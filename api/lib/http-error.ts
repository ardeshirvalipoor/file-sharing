// An error that already knows which HTTP status the browser should see.
//
// Any layer may throw one. A service looking up a missing file knows the answer
// is 404 better than the handler above it does, so it says so directly instead
// of inventing an error code that the handler then has to translate.
//
// It lives in lib because everything is allowed to depend on lib, and nothing in
// lib depends on anything else.
export class HttpError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message)
    }
}
