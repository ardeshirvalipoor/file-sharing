# File sharing

Upload a file up to 1 GB, get a link, share it. An interrupted upload carries on
from where it stopped, even after the browser is closed and reopened.

The service runs on Fly.io. The files live in Cloudflare R2. The file bytes never
travel through the Fly machine, so the smallest machine Fly sells is enough.

## How it works

Three machines are involved. Each one holds something the other two do not.

```text
   +-----------------+                      +-----------------------------+
   |  Browser        |                      |  Fly machine (ours)         |
   |                 |   small messages     |                             |
   |  the file       |<-------------------->|  keeps the R2 secret key    |
   |  on disk        |   a few hundred      |  signs URLs on the spot     |
   |                 |   bytes each         |  no database                |
   |  one note in    |                      |  no file bytes, ever        |
   |  IndexedDB      |                      +-----------------------------+
   |                 |
   |                 |                      +-----------------------------+
   |                 |   the file itself    |  Cloudflare R2 (private)    |
   |                 |=====================>|                             |
   |                 |   8 MiB at a time,   |  files/AbC123               |
   |                 |   128 times          |    the bytes                |
   |                 |                      |    metadata: name, type,    |
   |                 |                      |                and size     |
   +-----------------+                      +-----------------------------+
```

The thin line carries small messages. The thick line carries the file.

The thick line goes past our machine, not through it. The browser sends each
8 MiB part straight to Cloudflare. A 1 GB upload therefore costs our machine no
bandwidth and no memory, which is why it can be the smallest machine Fly sells.

The metadata is not stored on our machine. The file name, its type and its size
travel with the object and live in R2, as metadata attached to the object. Our
machine keeps no database at all, and no record that any upload ever happened.

Two other things are worth pointing out in that picture.

The R2 secret key sits only on our machine. It is never sent anywhere, and the
browser never sees it.

The note in IndexedDB is small. It holds an upload token and a fingerprint of
the file, and nothing else. That is what makes an interrupted upload resumable.

### Where the presigned URL comes from

A presigned URL is one request, written out and signed in advance.

```text
   +--------------------------------------------------------------------+
   |  Signing happens here, inside the Fly machine. Nothing is sent.    |
   |                                                                    |
   |      the R2 secret key                                             |
   |               +                                                    |
   |      "PUT part 41 of files/AbC123, expires in one hour"            |
   |               |                                                    |
   |               v                                                    |
   |      https://<account>.r2.cloudflarestorage.com/files/AbC123       |
   |        ?partNumber=41&X-Amz-Expires=3600&X-Amz-Signature=9f3c8b    |
   +--------------------------------------------------------------------+
```

Our machine builds the request it wants to allow, signs it with the R2 secret
key, and turns the result into a plain URL. No call to Cloudflare takes place.
Signing is arithmetic, not a conversation.

Whoever holds that URL can make that one request, and nothing else. The URL for
part 41 cannot upload part 42, cannot write to another object, and cannot read
anything. It stops working after an hour.

### Downloading

The share link `/f/AbC123` opens the app. Then this happens.

```text
   +-----------------+                      +-----------------------------+
   |  Browser        |                      |  Fly machine (ours)         |
   |                 |  1 GET /api/files    |                             |
   |  someone        |--------------------->|  looks up the name and      |
   |  opened the     |  2 the name and size |  size in R2, with a         |
   |  share link     |<---------------------|  HEAD request               |
   |  /f/AbC123      |                      |                             |
   |                 |  3 GET .../download  |  signs a GET URL for        |
   |                 |--------------------->|  the object, good for       |
   |                 |  4 a 302 redirect    |  five minutes               |
   |                 |<---------------------|                             |
   |                 |                      +-----------------------------+
   |                 |
   |                 |                      +-----------------------------+
   |                 |  5 the browser goes  |  Cloudflare R2 (private)    |
   |                 |    there itself      |                             |
   |                 |<=====================|  sends the bytes, under     |
   |                 |  6 the bytes arrive  |  the name the uploader      |
   |                 |                      |  chose                      |
   +-----------------+                      +-----------------------------+
```

The pattern is the same as the upload, in reverse. The small messages go to our
machine. The file itself goes straight between the browser and Cloudflare.

The bucket stays private throughout. A presigned URL that lasts five minutes is
the only way in, and our machine is the only thing that can make one.

### Picking up an interrupted upload

Say the tab closes after 40 of the 128 parts.

The browser kept one small note in IndexedDB, holding the upload token and a
fingerprint of the file. Choose the same file again, and the browser asks our
machine which parts R2 already holds. The answer comes back: parts 1 to 40.

```text
   part 1                                 40  41                    part 128
   +======== already in the bucket ========+  +======= not sent yet =======+
                                               ^
                                               the second attempt starts
                                               right here
```

Nothing was lost. Those 40 parts are still sitting in the bucket, so the second
attempt sends 88 parts rather than 128.

The full walkthrough, with the reasoning behind every choice, is in
[docs/how-it-works.md](docs/how-it-works.md).

## What you need

1. A Cloudflare account with an R2 bucket.
2. An R2 API token with Object Read and Write permission on that bucket.
3. Node 22 or newer.
4. A Fly.io account, when you are ready to deploy.

## Set up the bucket

Create a bucket in the Cloudflare dashboard. Leave it private. The service hands
out short-lived links instead of making the bucket public.

Then add a CORS rule to the bucket. The browser uploads parts straight to R2, and
without this rule the browser refuses to send them.

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-app.fly.dev"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

You do not need to expose the ETag header, which most guides tell you to do. Our
server asks R2 for the part list when it finishes an upload, so the browser never
has to read that header.

## Run it on your machine

```powershell
npm install
copy .env.example .env
# fill in the R2 values in .env
npm run dev
```

Open <http://localhost:3000>.

`npm run dev` starts two things at once. The server restarts when a file in
`api/` changes. The browser bundle rebuilds when a file in `app/` changes. Reload
the page yourself to pick up a new bundle.

## Deploy to Fly.io

```powershell
fly launch --no-deploy
fly secrets set `
  R2_ACCOUNT_ID=... `
  R2_ACCESS_KEY_ID=... `
  R2_SECRET_ACCESS_KEY=... `
  R2_BUCKET_NAME=... `
  UPLOAD_TOKEN_SECRET=... `
  PUBLIC_BASE_URL=https://your-app.fly.dev
fly deploy
```

Add your Fly address to the bucket's CORS rule as well, or uploads will work on
your machine and fail in production.

## Layout

| Folder            | What lives there                                         |
| ----------------- | -------------------------------------------------------- |
| `api/routes`      | Which address maps to which handler                      |
| `api/handlers`    | Reading the request, checking it, choosing a status code |
| `api/services`    | The rules of an upload and of a download                 |
| `api/lib`         | Talking to R2, signing tokens, making ids                |
| `api/middlewares` | Turning an error into a response                         |
| `app/pages`       | One folder per screen                                    |
| `app/components`  | Pieces reused by more than one screen                    |
| `app/lib`         | The upload engine, the API calls, small helpers          |
| `public`          | The HTML shell, plus the bundle the build writes into it |

The server is CommonJS TypeScript, the same as the `api` folder in papalist. The
browser app is ES modules bundled by esbuild, and it uses
[@codesuma/baseline](https://www.npmjs.com/package/@codesuma/baseline) for the
user interface.

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Server and browser bundle, both watching         |
| `npm run build`     | Compiles the server, bundles the browser app     |
| `npm run typecheck` | Type-checks both halves without writing anything |
| `npm start`         | Runs the compiled server from `dist/`            |

## Limits and what is missing

- One file per upload, up to 1 GB.
- A share link never expires. Add a lifecycle rule on the bucket if you want
  files to disappear after a week.
- Anyone holding a link can download the file. There are no accounts and no
  passwords.
- An interrupted upload can be resumed for 7 days. New R2 buckets come with a
  rule named "Default Multipart Abort Rule" that throws away the parts of an
  unfinished upload after a week. After that, the next attempt starts from zero.
  The app notices and handles it quietly, so nobody sees an error.
