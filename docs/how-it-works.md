# How it works

This is the walkthrough. It explains the ideas behind the code and points at the
file where each one lives.

Read it top to bottom. Each section builds on the one before it.

## The problem

Sending a one gigabyte file over the web is harder than it sounds.

- One HTTP request carrying a gigabyte will fail sometimes. When it fails, all of
  it is lost, and the person starts again from zero.
- If the file passes through our own server, we pay for a gigabyte coming in and
  a gigabyte going out, and our server has to hold the bytes somewhere while they
  move.
- Our server runs on Fly.io and can be restarted or replaced at any moment.
  Anything it was keeping in memory disappears with it.

Every design choice below answers one of those three problems.

## Idea one: cut the file into parts

Object stores support a thing called a multipart upload. You tell the store you
are about to upload an object. It gives you an upload id. You then send the file
in pieces, each with a number. When all the pieces have arrived, you tell the
store to glue them together.

We use pieces of 8 MiB. That number is a compromise.

| If parts are smaller  | If parts are larger        |
| --------------------- | -------------------------- |
| A failure costs less  | Fewer requests in total    |
| More requests to make | A failure costs more       |

The store sets the outer limits. It refuses parts under 5 MiB, except for the
last one, and it refuses more than 10000 parts per upload. At 8 MiB a one
gigabyte file becomes 128 parts, which sits comfortably between both limits.

The size lives in `api/config.ts` as `PART_SIZE`.

## Idea two: the browser talks to the storage directly

Our server never touches a file byte. Here is how that is possible.

The server holds the R2 credentials. It can build a request to upload a part and
sign that request with those credentials, without sending it. The signed request
becomes a plain URL. Anyone holding that URL can make that one request, and only
that one request, until it expires an hour later.

So the server signs a URL, the browser uses it, and the bytes go from the
person's laptop to Cloudflare without passing through Fly.

That is what `presignPartUrl` does in `api/lib/storage.ts`. Downloads work the
same way, in `presignDownloadUrl`.

A presigned URL is narrow on purpose. The URL for part 7 of one upload cannot
upload part 8, cannot upload to a different object, and cannot be used to read
anything. If one leaks, the damage is one part of one file for one hour.

This is also why the bucket needs a CORS rule. The browser is on our domain and
the request goes to Cloudflare's domain, and browsers block that unless the other
side says it is allowed. The README has the rule.

## Idea three: the upload carries its own state

Something has to remember that an upload is in progress: which object it is
writing to, and which upload id the store gave us.

The usual answer is to write that down somewhere and look it up on every later
request. We do something simpler. The server puts that information in a small
piece of text, signs it, and gives it to the browser. The browser sends it back
with every later request. We call it the upload token, and it lives in
`api/lib/upload-token.ts`.

The signature is the important part. Without it, anyone could edit the token and
write into somebody else's upload. With it, the server can check in one line that
the token is exactly what it handed out, because only the server knows the secret
used to sign it.

This buys two things.

- The Fly machine can restart between two parts and lose nothing.
- Two Fly machines can serve the same upload, because neither holds any state.

There is a database in this project, and this is not it. The database never holds
an upload in progress. What it does hold has its own section further down.

## Idea four: ask the storage what it already has

Now resuming.

When an upload begins, the browser writes one small note into IndexedDB, its own
local database. The note holds the upload token and a fingerprint of the file.
That code is in `app/lib/upload-store.ts`.

The fingerprint is the file name, its size, and its last modified date, joined
together. Browsers never tell a web page where a file sits on disk, so this is
the closest thing to an identity we can build. Two different files matching all
three is possible but very unlikely.

When the person picks a file, the browser looks for a note with that fingerprint.
If it finds one, it asks our server which parts have already arrived, and the
server asks R2. The browser then uploads only the numbers that came back missing.

Notice what we did not do. The browser does not keep its own list of finished
parts. It asks the store, every time. The store is the only place that knows the
truth, and its answer cannot go stale or get out of step with reality.

The whole loop is `uploadFile` in `app/lib/upload.ts`.

## Idea five: finish from the server

When every part has landed, the browser asks the server to finish the upload.

To glue the parts together, the store needs each part number together with its
ETag, a short string it returns when a part arrives. Most guides have the browser
collect those ETags and send them along.

We do not. The server asks the store for the part list, and that list already
carries the ETags. The browser sends nothing but the token.

This removes a whole family of bugs, and it removes a line of CORS configuration
too, because the browser never has to read a response header from Cloudflare.

It also gives us a free check. The server knows the file size, so it knows how
many parts there should be. If any are missing, it says so instead of assembling
a broken file.

That is `finish` in `api/services/uploads.ts`.

Finishing also flips the file's row in the database to `ready`. The order is R2
first, then the row. If the row update fails, the bytes are safe and only the
record is out of date, which can be put right. The other order would announce a
share link for a file that is not there.

## The database

There is a database as well, and it is worth being clear about what it is not
for. It holds no file bytes. It holds no upload in progress. If it were lost
tomorrow, every file would still be sitting in the bucket, whole.

It is an index. It answers the questions the bucket cannot.

- Is there a file at this share id, and what is it called?
- Did it finish, or did somebody give up halfway through?
- How many times has it been downloaded, and when?
- Whose file is it? Nothing fills this one in yet.

It runs on Supabase, which is ordinary Postgres with other things built around
it. We use only the Postgres part. One file talks to it, `api/lib/db.ts`, in the
same way that one file talks to R2. The schema lives in `supabase/migrations`.

There are three tables.

| Table       | One row for                            |
| ----------- | -------------------------------------- |
| `files`     | Every upload that has been started     |
| `downloads` | Every download that has happened       |
| `profiles`  | Every account, once there are accounts |

### The row goes in before the bytes

The `files` row is written when an upload starts, not when it finishes.

That order is deliberate. If the database write fails, nothing has been created
in the bucket and the person sees an error. The other way round would leave parts
in the bucket that no row points at, and those are the ones we could never find
again.

A row stays in status `uploading` until every part has arrived. So an abandoned
upload leaves its row behind, and that row is how the parts it left in the bucket
can be found and cleaned up later.

A row that is still `uploading` is not a file. Neither is a row that was
cancelled. Both answer a share link the same way an unused id does, with a 404.

### What happens when a write fails

Two different answers, and the difference is on purpose.

An upload that cannot be recorded fails. A file in the bucket with no row
pointing at it is invisible. Nobody can download it, and nobody can clean it up.

A download that cannot be recorded still happens. The failure goes to the log and
the person gets their file. A missing line in a tally is not a reason to refuse
somebody a download.

### What we keep about a person

One row per download. It holds the time, the browser's user agent, and a hash of
the address the request came from.

The address itself is never stored. A plain hash would be no protection, because
there are few enough addresses that somebody could try them all and compare, so
the server's secret goes into the hash as well. What is left is enough to tell
two downloads apart and useless for anything else.

Supabase also publishes every table through a REST API that its public key can
reach. All three tables have row level security turned on and no policies
written, which means that API can see nothing at all. Our server connects as the
database owner, and those rules do not apply to it.

## The five requests, end to end

| Step | Request                                       | What happens                       |
| ---- | --------------------------------------------- | ---------------------------------- |
| 1    | `POST /api/uploads`                           | Reserve an object, return a token  |
| 2    | `GET /api/uploads/:token/parts`               | List the parts already stored      |
| 3    | `GET /api/uploads/:token/parts/:number/url`   | Sign one part URL                  |
| 4    | `PUT` to that URL, straight to Cloudflare     | The bytes move                     |
| 5    | `POST /api/uploads/:token/complete`           | Glue the parts, return the link    |

Step 3 and step 4 repeat, three parts at a time.

Downloading is shorter. The share link `/f/:id` opens the app. The app calls
`GET /api/files/:id`, which reads the row for that id and answers with the name
and size. The download button goes to `GET /api/files/:id/download`. That one
writes a row in `downloads`, then answers with a redirect to a presigned URL
that lasts five minutes.

## Reading the code

Start here, in this order.

1. `api/config.ts` — every setting and every limit in one place.
2. `api/lib/storage.ts` — the only file that talks to R2.
3. `api/lib/db.ts` — the only file that talks to Postgres.
4. `api/services/uploads.ts` — the four steps of an upload, as functions.
5. `app/lib/upload.ts` — the browser side of the same four steps.
6. `app/pages/upload/index.ts` — the screen, and nothing else.

The server has four layers, and each one has a single job.

| Layer      | Job                                                    |
| ---------- | ------------------------------------------------------ |
| Route      | Map an address to a handler                            |
| Handler    | Read the request, check it, pick a status code         |
| Service    | The rules. It knows nothing about HTTP                 |
| Lib        | Talk to the outside world                              |

If you find upload logic in a handler, or an Express type in a service, something
has drifted into the wrong layer.

## Things to try next

Each of these is a small, self-contained change.

- **Show the download count.** Every download is already recorded, and
  `files.download_count` is already kept up to date. Nothing displays it. One
  more field in the API response, and one more line on the download page.
- **Expiring links.** The `files` table already has an `expires_at` column and
  nothing writes to it. Take a date when the upload starts, put it there, refuse
  the download once that date has passed, and add a lifecycle rule on the bucket
  so the bytes go too.
- **A password.** Take one when the upload starts, hash it, keep the hash in a
  new column on `files`, and ask for it before signing the download URL. That one
  needs a migration.
- **Many files at once.** The upload engine already handles one file. Making the
  page hold a list of them changes only the page.
- **Pause and resume.** Keep the `XMLHttpRequest` objects in a list and call
  `abort()` on them. Resuming already works, so the resume half is free.
