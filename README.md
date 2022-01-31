## Explanation of Endpoints

The server provides a number of endpoints in order to make testing, as well as access to test results, easier. All endpoints return JSON. If there is an error, it will be returned in the format of `{"error": "message"}`

### /demotests

Returns an object, sorted by recent first, of all completed tests saved by the server. Each provides the `runStamp` in the format `yyyy-mm-dd`, or, if manually ordered, `yyyy-mm-dd-m#`, as well as a link to directly access that run's summary.

### /demotests/results

Returns a summary of the most recent run.

#### /demotests/:runStamp

By adding a `runStamp` after `/demostests/`, you may specify a specific run to retrieve the summary of. Said summary will be returned if the run exists.

#### /demotests/:runStamp/:file

You may additionally specify the file to retrieve. Files included are the run summary and results files for each query. Query files take on the corresponding name from the [december demo query file](https://github.com/NCATSTranslator/minihackathons).

### /demotests/compare

By default, returns a comparison of the two most recent runs. By specifying two runStamps using `old` and `new` queries, (e.g. `/demotests/compare/?old=2021-11-01&new=2021-11-30`), you may retrieve a comparison of any two arbitrary runs, if they exist.

### /demotests/manualrun

Orders a new manual run. A user must be supplies as a `runner` query and must be present in `authedusers.js` (e.g. `/demotests/manualrun?runner=someAuthorizedUser`). Only one manual run may occur at a time.

## Authorized users file

A file named `authedusers.js` must exist in the root directory of the server which exports an array of authorized users, using the following format:

```JavaScript
export default [...]
```

## Environment Variables

The server accepts a number of environment variables at runtime:

- `PORT`: Which port the server will listen on. Defaults to 3200.
- `JOB_TIMEOUT`: The amount of the time in ms the server will wait on a given async query before considering it timed out and moving on to the next one. Defaults to 1 hour.
- `SHORT_TIMEOUT`: The amount of time in ms the server will wait on synchronous requests (starting a query, checking query status, etc) before considering it timed out and moving on. Defaults to 1 minute.
- `USE_CACHING`: Use BTE's caching feature for each query. Defaults to false.

## Running the server

`npm run debug`, if you have `nodemon` installed, or simply `node index.js`.
