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
    err.message = `[${comercialDbConfig.server}/${comercialDbConfig.database}] ${err.message}`;
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
      error: `[${comercialDbConfig.server}/${comercialDbConfig.database}] ${err.message}`,
    };
  } finally {
    pool?.close();
  }
};
