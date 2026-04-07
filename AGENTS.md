# Repository Guidelines

## Runtime Shape
- This repo is a single Azure Functions v4 app that mounts a Hono app through `src/functions/httpTrigger.ts`.
- `host.json` sets `"routePrefix": ""`, and the function route is `{*proxy}`, so local endpoints are the Hono paths directly: `/claims`, `/cases`, `/assign-workload`, and `/test-db-connection`.
- `src/app.ts` is the real HTTP entrypoint. `src/data.ts` owns SQL Server calls and stored procedure execution.

## Commands That Matter
- Prefer `npm`, not `yarn`, even though both lockfiles exist.
- `npm run build` is the only real automated verification in the repo.
- `npm start` is not a plain host start: `prestart` runs `npm run clean && npm run build` before `func start`.
- `npm run watch` only runs `tsc -w`; it does not start the Functions host.
- `npm test` is a placeholder that only prints `No tests yet...`.

## Route And Data Quirks
- Claims flow: `src/helpers/validateClaimData.ts` runs policy, plan, insured, and coverage validations before `SMI.USP_InsertClaims` is called.
- Claims insert uses a table-valued parameter in `src/data.ts`. Keep `tvp.columns.add(...)` and `tvp.rows.add(...)` in the same order or the stored procedure call will break silently.
- Cases do not use `SMI.USP_InsertCase`; the live route calls `[FTC].USP_InsertWorkFlowControl`.
- `/claims` normalizes `Claims_PolicyNumber` by removing hyphens and trims `Claims_CUser` to the substring before `@`.
- `/cases` removes hyphens from `IDNumber` and `PolicyNumber` before sending them to SQL.

## Environment Notes
- Required env vars are `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DYNAMICS_CLIENT_ID`, `DYNAMICS_CLIENT_SECRET`, `DYNAMICS_AUTHORITY`, `DYNAMICS_API_URL`, and `DYNAMICS_API_VERSION`.
- `src/app.ts` and `src/data.ts` call `dotenv.config()`, but local Azure Functions runs rely on `local.settings.json`. If you execute code outside `func start`, load env vars another way; `dotenv` will not read `local.settings.json`.
- `local.settings.json` is present in the repo and contains sensitive-looking values. Do not copy those values into commits, docs, logs, or responses.

## Workflow Notes
- No CI workflows, lint config, Prettier config, or Husky hooks are present.
- If asked to commit, recent history uses short Spanish summaries, often prefixed with `+`.
