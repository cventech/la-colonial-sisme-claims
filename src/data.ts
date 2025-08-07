import * as sql from 'mssql'
import * as dotenv from 'dotenv'

dotenv.config();


const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  connectionTimeout: 50000,
  requestTimeout: 50000,
  authentication: {
    type: 'default',
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    applicationIntent: 'ReadWrite',
    multiSubnetFailover: false
  }
};


export const insertClaim = async function (
  spName: string, 
  params: any[] = [], 
  outputParams: any[] = []
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();

    const tvp = new sql.Table();

    tvp.columns.add('Claims_PolicyNumber', sql.VarChar(50));
    tvp.columns.add('Claims_EffectiveDate', sql.VarChar(100));
    tvp.columns.add('Claims_Insured', sql.Int);
    tvp.columns.add('Claims_Dependent', sql.Int);
    tvp.columns.add('Claims_CUser', sql.VarChar(100));
    tvp.columns.add('Claims_ProducerCode', sql.Int);
    tvp.columns.add('ClaimsTr_GCoverage', sql.VarChar(100));
    tvp.columns.add('ClaimsTr_Coverage', sql.VarChar(100));
    tvp.columns.add('ClaimsTr_ServiceCode', sql.VarChar(100));
    tvp.columns.add('ClaimsTr_ServiceDate', sql.VarChar(100));
    tvp.columns.add('ClaimsTr_ProviderCode', sql.VarChar(100));
    tvp.columns.add('ClaimsTr_BeneficiaryType', sql.Int);
    tvp.columns.add('ClaimsTr_BeneficiaryCode', sql.Int);
    tvp.columns.add('ClaimsTr_BilledAmount', sql.Int);
    tvp.columns.add('ClaimsTr_CCurrency', sql.Int);
    tvp.columns.add('ClaimsTr_DiagnosticCode', sql.VarChar(20));
    tvp.columns.add('TicketNumber', sql.NVarChar(100));
    tvp.columns.add('IncidentID', sql.UniqueIdentifier);

    // Add row with provided values
    // Add row using the provided parameters
    if (params) {
      tvp.rows.add(
        params.find(p => p.name === 'Claims_PolicyNumber')?.value,
        params.find(p => p.name === 'Claims_EffectiveDate')?.value,
        params.find(p => p.name === 'Claims_Insured')?.value,
        params.find(p => p.name === 'Claims_Dependent')?.value,
        params.find(p => p.name === 'Claims_CUser')?.value,
        params.find(p => p.name === 'Claims_ProducerCode')?.value, 
        params.find(p => p.name === 'ClaimsTr_GCoverage')?.value,
        params.find(p => p.name === 'ClaimsTr_Coverage')?.value,
        params.find(p => p.name === 'ClaimsTr_ServiceCode')?.value,
        params.find(p => p.name === 'ClaimsTr_ServiceDate')?.value,
        params.find(p => p.name === 'ClaimsTr_ProviderCode')?.value,
        params.find(p => p.name === 'ClaimsTr_BeneficiaryType')?.value,
        params.find(p => p.name === 'ClaimsTr_BeneficiaryCode')?.value,
        params.find(p => p.name === 'ClaimsTr_BilledAmount')?.value,
        params.find(p => p.name === 'ClaimsTr_CCurrency')?.value,
        params.find(p => p.name === 'ClaimsTr_DiagnosticCode')?.value,
        params.find(p => p.name === 'TicketNumber')?.value,
        params.find(p => p.name === 'IncidentID')?.value
      );
    }

    request.input('Claims_Claimstransactions', tvp);
    
    // Add output parameters
    outputParams.forEach(({ name, type }) => {
      if (type === 'VarChar') {
        request.output(name, sql.VarChar(255));
      } else if (type === 'NVarChar') {
        request.output(name, sql.NVarChar(255));
      } else if (type === 'Int') {
        request.output(name, sql.Int);
      } else {
        request.output(name, sql[type]);
      }
    });

    const result = await request.execute(spName);

    // Return both recordset and output parameters like executeStoredProcedure does
    return {
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Database error:", err);
    throw err; // Make sure to throw the error so it can be caught by the caller
  } finally {
    pool?.close();
  }
}

export const insertCase = async function (
  spName: string, 
  params: any[] = [], 
  outputParams: any[] = []
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Add input parameters for case creation
    params.forEach(({ name, type, value }) => {
      if (type === 'VarChar') {
        request.input(name, sql.VarChar(255), value);
      } else if (type === 'Char') {
        request.input(name, sql.Char(255), value);
      } else if (type === 'TinyInt') {
        request.input(name, sql.TinyInt, value);
      } else if (type === 'SmallInt') {
        request.input(name, sql.SmallInt, value);
      } else if (type === 'Int') {
        request.input(name, sql.Int, value);
      } else if (type === 'DateTime') {
        request.input(name, sql.DateTime, value ? new Date(value) : null);
      } else if (type === 'Bit') {
        request.input(name, sql.Bit, value);
      } else {
        request.input(name, sql[type], value);
      }
    });
    
    // Add output parameters
    outputParams.forEach(({ name, type }) => {
      if (type === 'VarChar') {
        request.output(name, sql.VarChar(255));
      } else if (type === 'NVarChar') {
        request.output(name, sql.NVarChar(255));
      } else if (type === 'Int') {
        request.output(name, sql.Int);
      } else {
        request.output(name, sql[type]);
      }
    });

    const result = await request.execute(spName);

    return {
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    pool?.close();
  }
}

/**
 * Validates policy information
 * @param policyNumber The policy number to validate
 * @param serviceDate The service date for validation
 * @returns Validation result
 */
export const validatePolicy = async function(policyNumber: string, serviceDate: string): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    // Add parameters according to the stored procedure definition
    request.input('PolicyNumber', sql.Char(12), policyNumber);
    request.input('ServiceDate', sql.DateTime, new Date(serviceDate));
    
    // Execute the validation stored procedure
    const result = await request.execute('SMI.USP_SMI_ValidationsPolicy');
    
    return {
      success: true,
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Policy validation error:", err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    pool?.close();
  }
};

/**
 * Validates plan information
 * @param policyNumber The policy number to validate
 * @param serviceDate The service date for validation
 * @param planCode The plan code to validate
 * @returns Validation result
 */
export const validatePlan = async function(
  policyNumber: string, 
  serviceDate: string, 
  planCode: number
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    // Add parameters according to the stored procedure definition
    request.input('PolicyNumber', sql.Char(12), policyNumber);
    request.input('ServiceDate', sql.DateTime, new Date(serviceDate));
    request.input('PlanCode', sql.SmallInt, planCode);
    
    // Execute the validation stored procedure
    const result = await request.execute('SMI.USP_SMI_ValidationsPlan');
    
    return {
      success: true,
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Plan validation error:", err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    pool?.close();
  }
};

/**
 * Validates insured person information
 * @param policyNumber The policy number to validate
 * @param serviceDate The service date for validation
 * @param insured The insured number to validate
 * @returns Validation result
 */
export const validateInsured = async function(
  policyNumber: string, 
  serviceDate: string, 
  insured: number
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    // Add parameters according to the stored procedure definition
    request.input('PolicyNumber', sql.Char(12), policyNumber);
    request.input('ServiceDate', sql.DateTime, new Date(serviceDate));
    request.input('Insured', sql.SmallInt, insured);
    
    // Execute the validation stored procedure
    const result = await request.execute('SMI.USP_SMI_ValidationsInsured');
    
    return {
      success: true,
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Insured validation error:", err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    pool?.close();
  }
};

/**
 * Validates coverage group information
 * @param policyNumber The policy number to validate
 * @param planCode The plan code to validate
 * @param service The service code to validate
 * @param serviceDate The service date for validation
 * @returns Validation result
 */
export const validateCoveragesGroup = async function(
  policyNumber: string, 
  planCode: number,
  service: number,
  serviceDate: string,
  coverageCode: string
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    // Add parameters according to the stored procedure definition
    request.input('PolicyNumber', sql.Char(12), policyNumber);
    request.input('PlanCode', sql.SmallInt, planCode);
    request.input('Service', sql.SmallInt, service);
    request.input('ServiceDate', sql.DateTime, new Date(serviceDate));
    // request.input('GCoverageCode', sql.SmallInt, coverageCode);
    // Execute the validation stored procedure
    const result = await request.execute('SMI.USP_SMI_ValidationsCoveragesGroup');
    
    return {
      success: true,
      recordset: result.recordset,
      output: result.output
    };
  } catch (err) {
    console.error("Coverage group validation error:", err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    pool?.close();
  }
};

export default { 
  insertClaim,
  insertCase,
  validatePolicy,
  validatePlan,
  validateInsured,
  validateCoveragesGroup
};
