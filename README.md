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
- `src/index.ts` now exports Firebase-aligned HTTP function definitions, and the local shell mounts each function at `/<functionName>`.
- The local shell keeps the original smoke-flow aliases so existing PoC callers can continue using `/bootstrap/smoke-flow`, `/quiz-change`, and `/participant-submissions`.
- Startup fails fast with a message that lists any missing required `RADIOSA_*` values.

## Smoke Flow

- `GET /` lists the mounted function names and their compatibility aliases.
- `GET /bootstrapSmokeFlow` mirrors the bootstrap identifiers exposed by `bof-be`.
- `POST /handleQuizChange` and `POST /handleParticipantSubmission` use the same scaffold smoke-flow identifiers.
- Compatibility aliases remain available at `GET /bootstrap/smoke-flow`, `POST /quiz-change`, and `POST /participant-submissions`.
- Manual verification path:
  - `cp .env.example .env.local`
  - `npm run dev`
  - `curl http://localhost:5001/`
  - `curl http://localhost:5001/bootstrapSmokeFlow`
  - `curl -X POST http://localhost:5001/handleParticipantSubmission`
- The full bootstrap and smoke-flow steps are documented in `../docs/baseline-smoke-flow.md`.
