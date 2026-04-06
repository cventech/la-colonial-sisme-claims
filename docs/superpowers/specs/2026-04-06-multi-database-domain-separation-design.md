# Multi-Database Domain Separation

## Summary

Split the monolithic `src/data.ts` into domain-specific modules (`smi` and `comercial`) and introduce per-domain database configurations so that each domain points to its own database on the same SQL Server instance.

## Motivation

Currently all database functions live in a single `data.ts` file and share one `dbConfig`. This makes it unclear which functions belong to which business domain, and prevents routing domains to different databases. Separating by domain improves maintainability and enables independent database targeting.

## Domains

| Domain      | Database Env Var     | Schema | Functions                                                                                  |
|-------------|----------------------|--------|--------------------------------------------------------------------------------------------|
| SMI         | `DB_NAME_SMI`        | `SMI`  | `insertClaim`, `validatePolicy`, `validatePlan`, `validateInsured`, `validateCoveragesGroup` |
| Comercial   | `DB_NAME_COMERCIAL`  | `FTC`  | `insertCase`, `getWorkFlowControlPoolSuscription`                                          |

## File Structure

### Before

```
src/
  data.ts              -- all functions + single dbConfig
```

### After

```
src/
  data/
    config.ts          -- baseDbConfig, smiDbConfig, comercialDbConfig
    smi.ts             -- claims and validation functions
    comercial.ts       -- cases and workload functions
    index.ts           -- barrel re-exports
```

`src/data.ts` is deleted and replaced by `src/data/` directory.

## Detailed Design

### `src/data/config.ts`

- Imports `dotenv` and `mssql`
- Defines `baseDbConfig` using existing env vars (`DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_PORT`, `DB_NAME`) — identical to the current `dbConfig`
- Derives `smiDbConfig` = `{ ...baseDbConfig, database: process.env.DB_NAME_SMI }`
- Derives `comercialDbConfig` = `{ ...baseDbConfig, database: process.env.DB_NAME_COMERCIAL }`
- Exports all three configs

### `src/data/smi.ts`

- Imports `smiDbConfig` from `./config`
- Contains the following functions, unchanged in logic, but using `smiDbConfig` instead of `dbConfig`:
  - `insertClaim`
  - `validatePolicy`
  - `validatePlan`
  - `validateInsured`
  - `validateCoveragesGroup`

### `src/data/comercial.ts`

- Imports `comercialDbConfig` from `./config`
- Contains the following functions, unchanged in logic, but using `comercialDbConfig` instead of `dbConfig`:
  - `insertCase`
  - `getWorkFlowControlPoolSuscription`

### `src/data/index.ts`

- Re-exports all public functions from `smi.ts` and `comercial.ts`
- This preserves existing import paths: `import { insertClaim } from "./data"` continues to work

## Environment Variables

### New

| Variable            | Description                        |
|---------------------|------------------------------------|
| `DB_NAME_SMI`       | Database name for the SMI domain   |
| `DB_NAME_COMERCIAL` | Database name for the Comercial domain |

### Unchanged

`DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_PORT`, `DB_NAME` — all remain. `DB_NAME` is still used by `baseDbConfig` and the `/test-db-connection` endpoint in `app.ts`.

## What Does NOT Change

- `src/app.ts` — no changes (imports resolve through barrel `index.ts`)
- `src/helpers/validateClaimData.ts` — no changes (imports resolve through barrel `index.ts`)
- `src/shared/` — no changes
- `src/functions/httpTrigger.ts` — no changes
- API routes, request/response contracts, and behavior — all unchanged
- `/test-db-connection` endpoint — continues using `DB_NAME` via its inline config

## Backwards Compatibility

If `DB_NAME_SMI` and `DB_NAME_COMERCIAL` are set to the same value as the current `DB_NAME`, the application behaves identically to today. No API consumers are affected.
