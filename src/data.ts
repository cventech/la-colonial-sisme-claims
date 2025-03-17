import * as sql from 'mssql'
import * as dotenv from 'dotenv'

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  authentication: {
    type: 'default',
  },
  options: {
    encrypt: false,
    trustServerCertificate: false,
    applicationIntent: 'ReadWrite',
    multiSubnetFailover: false
  }
};


export const validatePolicyNumber = async function (policyNumber: string): Promise<boolean> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('PolicyNumber', sql.VarChar(50), policyNumber);

    const result = await request.execute('SMI.USP_ValidatePolicyNumber');

    return result.recordset[0].IsValid;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    pool?.close();
  }
}



export const executeSPV2 = async function (
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

    // Add row with provided values
    tvp.rows.add(
      '121810000340',   // Claims_PolicyNumber
      '2024-09-14',     // Claims_EffectiveDate
      2,                // Claims_Insured
      0,                // Claims_Dependent
      'Junior Reyes',   // Claims_CUser
      1,                // Claims_ProducerCode
      '31',             // ClaimsTr_GCoverage
      '23',             // ClaimsTr_Coverage
      '24018',          // ClaimsTr_ServiceCode
      '2024-09-14',     // ClaimsTr_ServiceDate
      '87033',          // ClaimsTr_ProviderCode
      1,                // ClaimsTr_BeneficiaryType
      1,                // ClaimsTr_BeneficiaryCode
      3000,             // ClaimsTr_BilledAmount
      81,               // ClaimsTr_CCurrency
      '13690'           // ClaimsTr_DiagnosticCode
    );

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

export const executeStoredProcedure = async function (
  spName: string, 
  params: any[] = [], 
  outputParams: any[] = []
): Promise<any> {
  let pool: sql.ConnectionPool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Add input parameters
    params.forEach(({ name, type, value }) => {
      // Special handling for table-valued parameters
      if (type === 'TVP') {
        // Create a table object for the TVP
        const tvp = new sql.Table();
        
        // Define the table structure based on the first row of data (assuming it's an array of objects)
        if (Array.isArray(value) && value.length > 0) {
          // Extract the column names from the first object
          const firstRow = value[0];
          
          // Add columns to the table definition
          Object.keys(firstRow).forEach(key => {
            // Try to determine the SQL type based on JavaScript type
            const jsValue = firstRow[key];
            let sqlType;
            
            if (typeof jsValue === 'number') {
              if (Number.isInteger(jsValue)) {
                tvp.columns.add(key, sql.Int);
              } else {
                tvp.columns.add(key, sql.Decimal(18, 2));
              }
            } else if (typeof jsValue === 'string') {
              // Check if it's a date
              if (!isNaN(Date.parse(jsValue))) {
                tvp.columns.add(key, sql.DateTime);
              } else {
                tvp.columns.add(key, sql.NVarChar(255));
              }
            } else if (typeof jsValue === 'boolean') {
              tvp.columns.add(key, sql.Bit);
            } else {
              // Default to NVarChar for other types
              tvp.columns.add(key, sql.NVarChar(255));
            }
          });
          
          // Add rows to the table
          value.forEach(row => {
            tvp.rows.add(...Object.values(row));
          });
        }
        
        // Add the TVP as a parameter
        request.input(name, tvp);
      } else if (type === 'VarChar' || type === 'NVarChar') {
        let length = 4000; // Default max length for SQL Server
        
        // Set specific lengths based on parameter names if needed
        if (name === 'Username' || name === 'FirstName' || name === 'LastName') {
          length = 50;
        } else if (name === 'Email') {
          length = 100;
        } else if (name === 'PasswordHash') {
          length = 255;
        } else if (name === 'Claims_Claimstransactions') {
          // For JSON data, use max length to ensure it fits
          length = sql.MAX;
        }
        
        if (type === 'VarChar') {
          request.input(name, sql.VarChar(length), value);
        } else {
          request.input(name, sql.NVarChar(length), value);
        }
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
    
    // Return both recordset and output parameters
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

export default { executeSPV2, executeStoredProcedure };
