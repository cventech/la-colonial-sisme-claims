import { Hono } from "hono";
import {
  insertClaim,
  insertCase,
  getWorkFlowControlPoolSuscription,
} from "./data";
import { smiDbConfig, comercialDbConfig } from "./data/config";
import * as sql from "mssql";
import * as dotenv from "dotenv";
import {
  validateClaimData,
  ValidationResults,
} from "./helpers/validateClaimData";
dotenv.config();

const app = new Hono();

app.post("/claims", async (c) => {
  let validationResults: ValidationResults;
  try {
    const claimData = await c.req.json();

    const validation = await validateClaimData(claimData);
    validationResults = validation.validationResults;

    if (!validation.isValid) {
      return c.json(
        {
          success: false,
          message: validation.errorMessage,
          error: validation.error,
          validationResults,
        },
        validation.errorCode || (400 as any),
      );
    }

    const extractedCUser = claimData.Claims_CUser
      ? claimData.Claims_CUser.split("@")[0]
      : claimData.Claims_CUser;

    const result = await insertClaim(
      "SMI.USP_InsertClaims",
      [
        {
          name: "Claims_PolicyNumber",
          type: "VarChar",
          value:
            claimData.Claims_PolicyNumber?.replace(/-/g, "") ||
            claimData.Claims_PolicyNumber,
        },
        {
          name: "Claims_EffectiveDate",
          type: "Date",
          value: claimData.Claims_EffectiveDate,
        },
        {
          name: "Claims_Insured",
          type: "Int",
          value: claimData.Claims_Insured,
        },
        {
          name: "Claims_Dependent",
          type: "Int",
          value: claimData.Claims_Dependent || 0,
        },
        { name: "Claims_CUser", type: "VarChar", value: extractedCUser },
        {
          name: "Claims_ProducerCode",
          type: "Int",
          value: claimData.Claims_ProducerCode,
        },
        {
          name: "ClaimsTr_GCoverage",
          type: "VarChar",
          value: claimData.ClaimsTr_GCoverage,
        },
        {
          name: "ClaimsTr_Coverage",
          type: "VarChar",
          value: claimData.ClaimsTr_Coverage,
        },
        {
          name: "ClaimsTr_ServiceCode",
          type: "VarChar",
          value: claimData.ClaimsTr_ServiceCode,
        },
        {
          name: "ClaimsTr_ServiceDate",
          type: "Date",
          value: claimData.ClaimsTr_ServiceDate,
        },
        {
          name: "ClaimsTr_ProviderCode",
          type: "VarChar",
          value: claimData.ClaimsTr_ProviderCode,
        },
        {
          name: "ClaimsTr_BeneficiaryType",
          type: "Int",
          value: claimData.ClaimsTr_BeneficiaryType,
        },
        {
          name: "ClaimsTr_BeneficiaryCode",
          type: "Int",
          value: claimData.ClaimsTr_BeneficiaryCode,
        },
        {
          name: "ClaimsTr_BilledAmount",
          type: "Decimal",
          value: claimData.ClaimsTr_BilledAmount,
        },
        {
          name: "ClaimsTr_CCurrency",
          type: "Int",
          value: claimData.ClaimsTr_CCurrency,
        },
        {
          name: "ClaimsTr_DiagnosticCode",
          type: "VarChar",
          value: claimData.ClaimsTr_DiagnosticCode,
        },
        { name: "ClaimsTr_Plan", type: "Int", value: claimData.ClaimsTr_Plan },
        {
          name: "TicketNumber",
          type: "NVarChar",
          value: claimData.TicketNumber,
        },
        {
          name: "IncidentID",
          type: "UniqueIdentifier",
          value: claimData.IncidentID,
        },
      ],
      [{ name: "ClaimNumber", type: "VarChar" }],
    );

    return c.json({
      success: true,
      message: "Claim submitted successfully",
      claimNumber: result.output.ClaimNumber,
      validationResults,
    });
  } catch (err) {
    console.error("Error processing claim:", err);
    return c.json(
      {
        success: false,
        message: "Failed to process claim",
        error: err.message,
        stackTrace: err.stack,
        validationResults: validationResults || {
          policy: { success: false, error: "Validation did not complete" },
          plan: { success: false, error: "Validation did not complete" },
          insured: { success: false, error: "Validation did not complete" },
          coverage: { success: false, error: "Validation did not complete" },
        },
      },
      500,
    );
  }
});

app.post("/cases", async (c) => {
  try {
    const caseData = await c.req.json();

    const result = await insertCase(
      "[FTC].USP_InsertWorkFlowControl",
      [
        { name: "BranchCode", type: "SmallInt", value: caseData.BranchCode },
        {
          name: "ChangeEffectiveDate",
          type: "DateTime",
          value: caseData.ChangeEffectiveDate,
        },
        { name: "ChangeType", type: "Int", value: caseData.ChangeType },
        { name: "CompanyCode", type: "TinyInt", value: caseData.CompanyCode },
        {
          name: "ConditionCode",
          type: "TinyInt",
          value: 0,
        },
        {
          name: "FullDocumentation",
          type: "TinyInt",
          value: caseData.FullDocumentation,
        },
        {
          name: "IDNumber",
          type: "VarChar",
          value: caseData.IDNumber?.replace(/-/g, "") || caseData.IDNumber,
        },
        {
          name: "InsuranceType",
          type: "SmallInt",
          value: caseData.InsuranceType,
        },
        { name: "InsuredCode", type: "Int", value: caseData.InsuredCode },
        { name: "Name1", type: "VarChar", value: caseData.Name1 },
        { name: "Name2", type: "VarChar", value: caseData.Name2 },
        { name: "Observations", type: "VarChar", value: caseData.Observations },
        { name: "OfficeCode", type: "SmallInt", value: caseData.OfficeCode },
        {
          name: "OfficeReceptionDate",
          type: "DateTime",
          value: caseData.OfficeReceptionDate,
        },
        // {
        //   name: "AssignedDate",
        //   type: "DateTime",
        //   value: caseData.AssignedDate,
        // },
        {
          name: "PolicyNumber",
          type: "Char",
          value:
            caseData.PolicyNumber?.replace(/-/g, "") || caseData.PolicyNumber,
        },
        { name: "Premium", type: "Money", value: caseData.Premium },
        {
          name: "ReceptionDate",
          type: "DateTime",
          value: caseData.ReceptionDate,
        },
        {
          name: "ReferenceNumber",
          type: "VarChar",
          value: "0",
        },
        { name: "SLOB", type: "Int", value: caseData.SLOB },
        { name: "UnitsToWork", type: "SmallInt", value: caseData.UnitsWork },
        { name: "isExpress", type: "Bit", value: caseData.Express },
        { name: "User", type: "VarChar", value: caseData.User },
        { name: "User2", type: "VarChar", value: caseData.User2 },

        { name: "ProducerNumber", type: "Int", value: caseData.ProducerNumber },
        { name: "CaseNumber", type: "Int", value: caseData.CaseNumber },
      ],
      [{ name: "WorkNumber", type: "VarChar" }], // Parámetro de salida
    );

    return c.json({
      success: true,
      message: "Case created successfully",
      caseNumber: result.output.WorkNumber,
    });
  } catch (err) {
    console.error("Error creating case:", err);
    return c.json(
      {
        success: false,
        message: "Failed to create case",
        error: err.message,
        stackTrace: err.stack,
      },
      500,
    );
  }
});

app.post("/assign-workload", async (c) => {
  try {
    const requestData = await c.req.json();

    const { BranchCode, InsuredCode, Premium, InsuranceAmount } = requestData;

    if (
      !BranchCode ||
      !InsuredCode ||
      Premium === undefined ||
      InsuranceAmount === undefined
    ) {
      return c.json(
        {
          success: false,
          message:
            "Missing required parameters: BranchCode, InsuredCode, Premium, InsuranceAmount",
        },
        400,
      );
    }

    const result = await getWorkFlowControlPoolSuscription(
      BranchCode,
      InsuredCode,
      Premium,
      InsuranceAmount,
    );

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Failed to assign workload",
          error: result.error,
        },
        500,
      );
    }

    return c.json({
      success: true,
      message: "Workload assignment completed successfully",
      assignedTo: result.output.AssignedTo,
      data: result.recordset,
    });
  } catch (err) {
    console.error("Error assigning workload:", err);
    return c.json(
      {
        success: false,
        message: "Failed to assign workload",
        error: err.message,
        stackTrace: err.stack,
      },
      500,
    );
  }
});

app.get("/test-db-connection", async (c) => {
  const testConnection = async (name: string, config: any) => {
    let pool: sql.ConnectionPool;
    try {
      pool = await sql.connect(config);
      await pool.request().query("SELECT 1 as connectionTest");
      return {
        success: true,
        database: config.database,
        server: config.server,
      };
    } catch (err) {
      return {
        success: false,
        database: config.database,
        server: config.server,
        error: err.message,
      };
    } finally {
      pool?.close();
    }
  };

  const [smi, comercial] = await Promise.allSettled([
    testConnection("smi", smiDbConfig),
    testConnection("comercial", comercialDbConfig),
  ]);

  const smiResult = smi.status === "fulfilled" ? smi.value : { success: false, error: smi.reason?.message };
  const comercialResult = comercial.status === "fulfilled" ? comercial.value : { success: false, error: comercial.reason?.message };
  const allHealthy = smiResult.success && comercialResult.success;

  return c.json(
    {
      success: allHealthy,
      connections: {
        smi: smiResult,
        comercial: comercialResult,
      },
    },
    allHealthy ? 200 : 500,
  );
});

export default app;
