import { Hono } from "hono";
import { executeSPV2, executeStoredProcedure } from "./data";
import * as sql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config();
const testObject = [
  {
    "Claims_PolicyNumber": "121810000340",
    "Claims_EffectiveDate": "2024-09-14",
    "Claims_Insured": 2,
    "Claims_Dependent": 0,
    "Claims_CUser": "Junior Reyes",
    "Claims_ProducerCode": 1,
    "ClaimsTr_GCoverage": "31",
    "ClaimsTr_Coverage": "23",
    "ClaimsTr_ServiceCode": "24018",
    "ClaimsTr_ServiceDate": "2024-09-14",
    "ClaimsTr_ProviderCode": "87033",
    "ClaimsTr_BeneficiaryType": 1,
    "ClaimsTr_BeneficiaryCode": 1,
    "ClaimsTr_BilledAmount": 3000,
    "ClaimsTr_CCurrency": 81,
    "ClaimsTr_DiagnosticCode": "13690"
  }
]


const app = new Hono();


app.get('/', (c) => c.text('Hello Azure Functions!'))

// New endpoint for submitting claims
app.post('/claims', async (c) => {
  try {
    // Get claim data from request body or use test object
    const claimData = await c.req.json();
    
    // We'll pass the claims array directly as a TVP
    const result = await executeSPV2("SMI.USP_InsertClaims", 
      [{ name: 'Claims_Claimstransactions', type: "TVP", value: Array.isArray(claimData) ? claimData : [claimData] }],
      [{ name: 'ClaimNumber', type: "VarChar" }]
    );
    
    return c.json({ 
      success: true, 
      message: "Claim submitted successfully", 
      claimNumber: result.output.ClaimNumber
    });
  } catch (err) {
    console.error("Error submitting claim:", err);
    return c.json({
      success: false,
      message: "Failed to submit claim",
      error: err.message,
      stackTrace: err.stack
    }, 500);
  }
});

// New endpoint to test database connectivity
app.get('/test-db-connection', async (c) => {
  let pool;
  try {
 
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
    
    pool = await sql.connect(dbConfig);
    
    // Simple query to test connectivity
    await pool.request().query('SELECT 1 as connectionTest');
    
    return c.json({
      success: true,
      message: "Database connection successful",
      connection: {
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    });
  } catch (err) {
    console.error("Database connection error:", err);
    return c.json({
      success: false,
      message: "Database connection failed",
      error: err.message,
      connection: {
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    }, 500);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

app.post('/', async (c) => {
  try {
    const userData = await c.req.json();

    // Make sure all required parameters for the SP are provided
    const result = await executeSPV2("sp_InsertUser", [
      { name: 'Username', type: "VarChar", value: userData.username || "Julien" },
      { name: 'Email', type: "VarChar", value: userData.email || "example@example.com" },
      { name: 'PasswordHash', type: "VarChar", value: userData.passwordHash || "hashedpassword" },
      { name: 'FirstName', type: "VarChar", value: userData.firstName || "Default" },
      { name: 'LastName', type: "VarChar", value: userData.lastName || "User" }
    ]);

    return c.json({ message: "User inserted successfully!" });
  } catch (err) {
    console.error("Error:", err);
    return c.json({ error: `Error: ${err.message}` }, 500)
  }
})


export default app;
