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
    tvp.columns.add("ClaimNumber", sql.Int);

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
        params.find((p) => p.name === "ClaimNumber")?.value,
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
    err.message = `[${smiDbConfig.server}/${smiDbConfig.database}] ${err.message}`;
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
      error: `[${smiDbConfig.server}/${smiDbConfig.database}] ${err.message}`,
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
      error: `[${smiDbConfig.server}/${smiDbConfig.database}] ${err.message}`,
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
      error: `[${smiDbConfig.server}/${smiDbConfig.database}] ${err.message}`,
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
      error: `[${smiDbConfig.server}/${smiDbConfig.database}] ${err.message}`,
    };
  } finally {
    pool?.close();
  }
};
