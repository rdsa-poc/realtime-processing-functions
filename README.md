# Realtime Processing Functions

Realtime processing shell for participant submissions, realtime state updates, and analytics event writes.

## Scope

- handle participant submissions
- update realtime quiz data
- save analytics events directly to BigQuery

## Development

- Copy `.env.example` to `.env.local` before first start and keep the `RADIOSA_*` names unchanged.
- `RADIOSA_ENVIRONMENT` identifies the local environment name shared across the PoC.
- `RADIOSA_APP_ID` must stay aligned with the repo identifier (`rt-fn` here).
- `RADIOSA_BACKOFFICE_BASE_URL` points to the local Backoffice BE APP shell, which defaults to `http://localhost:8080`.
- `RADIOSA_PORT` is optional and overrides the local functions port when needed.
- `npm run dev` starts the local functions shell on `http://localhost:5001`
- `npm run start` starts the local functions shell without file watching
- `npm run verify` runs the scaffold checks for this repository

## Notes

- The shell is intentionally dependency-free so the repo can boot immediately in a clean workspace.
- The exported handlers model the future Firebase Functions boundary while the local server provides a simple development surface.
- Startup fails fast with a message that lists any missing required `RADIOSA_*` values.

## Smoke Flow

- `GET /bootstrap/smoke-flow` mirrors the bootstrap identifiers exposed by `bof-be`.
- `POST /quiz-change` and `POST /participant-submissions` use the same scaffold smoke-flow identifiers.
- The full bootstrap and smoke-flow steps are documented in `../docs/baseline-smoke-flow.md`.
