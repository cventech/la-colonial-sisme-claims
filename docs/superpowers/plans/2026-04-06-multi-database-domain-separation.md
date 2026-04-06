# Multi-Database Domain Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/data.ts` into domain-specific modules (`smi` and `comercial`) with per-domain database configurations.

**Architecture:** Replace the single `data.ts` file with a `data/` directory containing `config.ts` (shared + domain configs), `smi.ts` (claims/validations), `comercial.ts` (cases/workload), and `index.ts` (barrel re-exports). Existing imports from `"./data"` continue working via the barrel file.

**Tech Stack:** TypeScript, mssql, dotenv

---

### Task 1: Create `src/data/config.ts`

**Files:**
- Create: `src/data/config.ts`

- [ ] **Step 1: Create the config file with base and domain-specific configs**

```ts
import * as dotenv from "dotenv";

dotenv.config();

const baseDbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  connectionTimeout: 50000,
  requestTimeout: 50000,
  authentication: {
    type: "default",
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    applicationIntent: "ReadWrite",
    multiSubnetFailover: false,
  },
};

export const smiDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_NAME_SMI,
};

export const comercialDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_NAME_COMERCIAL,
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors related to `src/data/config.ts`

- [ ] **Step 3: Commit**

```bash
git add src/data/config.ts
git commit -m "feat: add domain-specific database configs (SMI + Comercial)"
```

---

### Task 2: Create `src/data/smi.ts`

**Files:**
- Create: `src/data/smi.ts`

- [ ] **Step 1: Create the SMI domain module with all claims/validation functions**

This file contains the 5 SMI functions from `data.ts`, each using `smiDbConfig` instead of `dbConfig`. The function bodies are identical to the originals.

```ts
import * as sql from "mssql";
import { smiDbConfig } from "./config";

export const insertClaim = async function (
  spName: string,
  params: any[] = [],
  outputParams: any[] = [],
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(smiDbConfig);
    const request = pool.request();

    const tvp = new sql.Table();

    tvp.columns.add("Claims_PolicyNumber", sql.VarChar(50));
    tvp.columns.add("Claims_EffectiveDate", sql.VarChar(100));
    tvp.columns.add("Claims_Insured", sql.Int);
    tvp.columns.add("Claims_Dependent", sql.Int);
    tvp.columns.add("Claims_CUser", sql.VarChar(100));
    tvp.columns.add("Claims_ProducerCode", sql.Int);
    tvp.columns.add("ClaimsTr_GCoverage", sql.VarChar(100));
    tvp.columns.add("ClaimsTr_Coverage", sql.VarChar(100));
    tvp.columns.add("ClaimsTr_ServiceCode", sql.VarChar(100));
    tvp.columns.add("ClaimsTr_ServiceDate", sql.VarChar(100));
    tvp.columns.add("ClaimsTr_ProviderCode", sql.VarChar(100));
    tvp.columns.add("ClaimsTr_BeneficiaryType", sql.Int);
    tvp.columns.add("ClaimsTr_BeneficiaryCode", sql.Int);
    tvp.columns.add("ClaimsTr_BilledAmount", sql.Int);
    tvp.columns.add("ClaimsTr_CCurrency", sql.Int);
    tvp.columns.add("ClaimsTr_DiagnosticCode", sql.VarChar(20));
    tvp.columns.add("TicketNumber", sql.NVarChar(100));
    tvp.columns.add("IncidentID", sql.UniqueIdentifier);

    // Add row using the provided parameters
    if (params) {
      tvp.rows.add(
        params.find((p) => p.name === "Claims_PolicyNumber")?.value,
        params.find((p) => p.name === "Claims_EffectiveDate")?.value,
        params.find((p) => p.name === "Claims_Insured")?.value,
        params.find((p) => p.name === "Claims_Dependent")?.value,
        params.find((p) => p.name === "Claims_CUser")?.value,
        params.find((p) => p.name === "Claims_ProducerCode")?.value,
        params.find((p) => p.name === "ClaimsTr_GCoverage")?.value,
        params.find((p) => p.name === "ClaimsTr_Coverage")?.value,
        params.find((p) => p.name === "ClaimsTr_ServiceCode")?.value,
        params.find((p) => p.name === "ClaimsTr_ServiceDate")?.value,
        params.find((p) => p.name === "ClaimsTr_ProviderCode")?.value,
        params.find((p) => p.name === "ClaimsTr_BeneficiaryType")?.value,
        params.find((p) => p.name === "ClaimsTr_BeneficiaryCode")?.value,
        params.find((p) => p.name === "ClaimsTr_BilledAmount")?.value,
        params.find((p) => p.name === "ClaimsTr_CCurrency")?.value,
        params.find((p) => p.name === "ClaimsTr_DiagnosticCode")?.value,
        params.find((p) => p.name === "TicketNumber")?.value,
        params.find((p) => p.name === "IncidentID")?.value,
      );
    }

    request.input("Claims_Claimstransactions", tvp);

    // Add output parameters
    outputParams.forEach(({ name, type }) => {
      if (type === "VarChar") {
        request.output(name, sql.VarChar(255));
      } else if (type === "NVarChar") {
        request.output(name, sql.NVarChar(255));
      } else if (type === "Int") {
        request.output(name, sql.Int);
      } else {
        request.output(name, sql[type]);
      }
    });

    const result = await request.execute(spName);

    return {
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    pool?.close();
  }
};

export const validatePolicy = async function (
  policyNumber: string,
  serviceDate: string,
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(smiDbConfig);
    const request = pool.request();

    request.input("PolicyNumber", sql.Char(12), policyNumber);
    request.input("ServiceDate", sql.DateTime, new Date(serviceDate));

    const result = await request.execute("SMI.USP_SMI_ValidationsPolicy");

    return {
      success: true,
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Policy validation error:", err);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    pool?.close();
  }
};

export const validatePlan = async function (
  policyNumber: string,
  serviceDate: string,
  planCode: number,
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(smiDbConfig);
    const request = pool.request();

    request.input("PolicyNumber", sql.Char(12), policyNumber);
    request.input("ServiceDate", sql.DateTime, new Date(serviceDate));
    request.input("PlanCode", sql.SmallInt, planCode);

    const result = await request.execute("SMI.USP_SMI_ValidationsPlan");

    return {
      success: true,
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Plan validation error:", err);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    pool?.close();
  }
};

export const validateInsured = async function (
  policyNumber: string,
  serviceDate: string,
  insured: number,
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(smiDbConfig);
    const request = pool.request();

    request.input("PolicyNumber", sql.Char(12), policyNumber);
    request.input("ServiceDate", sql.DateTime, new Date(serviceDate));
    request.input("Insured", sql.SmallInt, insured);

    const result = await request.execute("SMI.USP_SMI_ValidationsInsured");

    return {
      success: true,
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Insured validation error:", err);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    pool?.close();
  }
};

export const validateCoveragesGroup = async function (
  policyNumber: string,
  planCode: number,
  service: number,
  serviceDate: string,
  coverageCode: string,
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(smiDbConfig);
    const request = pool.request();

    request.input("PolicyNumber", sql.Char(12), policyNumber);
    request.input("PlanCode", sql.SmallInt, planCode);
    request.input("Service", sql.SmallInt, service);
    request.input("ServiceDate", sql.DateTime, new Date(serviceDate));

    const result = await request.execute(
      "SMI.USP_SMI_ValidationsCoveragesGroup",
    );

    return {
      success: true,
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Coverage group validation error:", err);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    pool?.close();
  }
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors related to `src/data/smi.ts`

- [ ] **Step 3: Commit**

```bash
git add src/data/smi.ts
git commit -m "feat: add SMI domain module (claims + validations)"
```

---

### Task 3: Create `src/data/comercial.ts`

**Files:**
- Create: `src/data/comercial.ts`

- [ ] **Step 1: Create the Comercial domain module with cases/workload functions**

This file contains the 2 Comercial functions from `data.ts`, each using `comercialDbConfig` instead of `dbConfig`. The function bodies are identical to the originals.

```ts
import * as sql from "mssql";
import { comercialDbConfig } from "./config";

export const insertCase = async function (
  spName: string,
  params: any[] = [],
  outputParams: any[] = [],
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(comercialDbConfig);
    const request = pool.request();

    // Add input parameters for case creation
    params.forEach(({ name, type, value }) => {
      if (type === "VarChar") {
        request.input(name, sql.VarChar(255), value);
      } else if (type === "Char") {
        request.input(name, sql.Char(255), value);
      } else if (type === "TinyInt") {
        request.input(name, sql.TinyInt, value);
      } else if (type === "SmallInt") {
        request.input(name, sql.SmallInt, value);
      } else if (type === "Int") {
        request.input(name, sql.Int, value);
      } else if (type === "DateTime") {
        request.input(name, sql.DateTime, value ? new Date(value) : null);
      } else if (type === "Bit") {
        request.input(name, sql.Bit, value);
      } else {
        request.input(name, sql[type], value);
      }
    });

    // Add output parameters
    outputParams.forEach(({ name, type }) => {
      if (type === "VarChar") {
        request.output(name, sql.VarChar(255));
      } else if (type === "NVarChar") {
        request.output(name, sql.NVarChar(255));
      } else if (type === "Int") {
        request.output(name, sql.Int);
      } else {
        request.output(name, sql[type]);
      }
    });

    const result = await request.execute(spName);

    return {
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    pool?.close();
  }
};

export const getWorkFlowControlPoolSuscription = async function (
  branchCode: number,
  insuredCode: number,
  premium: number,
  insuranceAmount: number,
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(comercialDbConfig);
    const request = pool.request();

    request.input("BranchCode", sql.SmallInt, branchCode);
    request.input("InsuredCode", sql.Int, insuredCode);
    request.input("Premium", sql.Money, premium);
    request.input("InsuranceAmount", sql.Money, insuranceAmount);

    request.output("AssignedTo", sql.VarChar(100));

    const result = await request.execute(
      "[FTC].[USP_GetWorkFlowControlPoolSuscription]",
    );

    return {
      success: true,
      recordset: result.recordset,
      output: result.output,
    };
  } catch (err) {
    console.error("Workflow control pool subscription error:", err);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    pool?.close();
  }
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors related to `src/data/comercial.ts`

- [ ] **Step 3: Commit**

```bash
git add src/data/comercial.ts
git commit -m "feat: add Comercial domain module (cases + workload)"
```

---

### Task 4: Create `src/data/index.ts` and delete `src/data.ts`

**Files:**
- Create: `src/data/index.ts`
- Delete: `src/data.ts`

- [ ] **Step 1: Create the barrel re-export file**

```ts
export {
  insertClaim,
  validatePolicy,
  validatePlan,
  validateInsured,
  validateCoveragesGroup,
} from "./smi";

export {
  insertCase,
  getWorkFlowControlPoolSuscription,
} from "./comercial";
```

- [ ] **Step 2: Delete the old `src/data.ts`**

```bash
rm src/data.ts
```

- [ ] **Step 3: Verify the full project compiles**

Run: `npm run build`
Expected: Clean build with zero errors. All imports in `app.ts` and `validateClaimData.ts` resolve through `src/data/index.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/data/index.ts
git rm src/data.ts
git commit -m "feat: replace data.ts with domain-separated data/ module

Barrel index.ts preserves existing import paths."
```
