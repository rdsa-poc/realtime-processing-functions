# Realtime Processing Functions

Minimal Firebase-aligned local shell for the `rt-fn` baseline application event boundary.

## Scope

- export exactly one application event entrypoint named `onApplicationEvent`
- accept unconstrained startup and application events without domain-specific processing
- keep the local development shell aligned with the app startup handoff contract

## Development

- Use the shared root `.env` file at `../.env` as the local discovery source for this shell.
- `RADIOSA_ENVIRONMENT` identifies the local environment name shared across the PoC.
- `RT_FN_BASE_URL` is the shared discovery value the mobile app uses to locate the local `rt-fn` shell at `http://localhost:5001`.
- `RADIOSA_APP_ID` is optional for `rt-fn`; the shell defaults it to the repo identifier when omitted from the shared root contract.
- `RADIOSA_PORT` is optional and overrides the local functions port when needed.
- `RADIOSA_BIND_HOST` is optional and controls which local interface the shell binds to. Leave it unset for `127.0.0.1`, or set it to `0.0.0.0` for phone/emulator access.
- `npm run dev` starts the local functions shell on `http://localhost:5001`
- `npm run start` starts the local functions shell without file watching
- `npm run verify` runs the scaffold checks for this repository

For the full local stack bootstrap from the workspace root, use `../scripts/start-local-stack.sh`.

## Notes

- The shell is intentionally dependency-free so the repo can boot immediately in a clean workspace.
- `src/index.ts` exports only `onApplicationEvent`.
- `src/functions/onApplicationEvent.ts` contains the local emulator-aligned route adapter for the single baseline function.
- Startup fails fast with a message that lists any missing required shared root `.env` values.

## Local Shell

- `GET /` lists the mounted baseline function.
- `POST /onApplicationEvent` accepts any JSON payload and returns it under the `Event` field with `accepted: true`.
- The shell accepts either a raw event payload or a wrapper object shaped like `{ "Event": ... }`.
- Manual verification path:
  - `cat ../.env`
  - `npm run dev`
  - `curl http://localhost:5001/`
  - `curl -X POST http://localhost:5001/onApplicationEvent -H 'content-type: application/json' -d '{"Event":{"eventName":"app.startup","source":"app"}}'`
