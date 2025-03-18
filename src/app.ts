import { Hono } from "hono";
import { executeSPV2, executeStoredProcedure, validatePolicy, validatePlan, validateInsured, validateCoveragesGroup } from "./data";
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

app.post('/claims', async (c) => {
  let validationResults;
  try {
    const claimData = await c.req.json();
    
    const policyNumber = claimData.Claims_PolicyNumber;
    const serviceDate = claimData.ClaimsTr_ServiceDate;
    const insured = claimData.Claims_Insured;
    const planCode = claimData.PlanCode; 
    const service = parseInt(claimData.ClaimsTr_GCoverage);

    validationResults = {
      policy: await validatePolicy(policyNumber, serviceDate),
      plan: planCode ? await validatePlan(policyNumber, serviceDate, planCode) : { success: false, error: 'Plan validation skipped - no plan code provided' },
      insured: await validateInsured(policyNumber, serviceDate, insured),
      coverage: (planCode && service) ? 
        await validateCoveragesGroup(policyNumber, planCode, service, serviceDate) : 
        { success: false, error: 'Coverage validation skipped - missing plan code or service' }
    };

    if (!validationResults.policy.success) {
      return c.json({
        success: false,
        message: "Policy validation failed",
        error: validationResults.policy.error,
        validationResults
      }, 400);
    }
    
    if (!validationResults.plan.success) {
      return c.json({
        success: false,
        message: "Plan validation failed",
        error: validationResults.plan.error,
        validationResults
      }, 400);
    }
    
    if (!validationResults.insured.success) {
      return c.json({
        success: false,
        message: "Insured validation failed",
        error: validationResults.insured.error,
        validationResults
      }, 400);
    }

    if (!validationResults.coverage.success) {
      return c.json({
        success: false,
        message: "Coverage validation failed",
        error: validationResults.coverage.error,
        validationResults
      }, 400);
    }

    const result = await executeSPV2(
      "SMI.USP_InsertClaims", 
      [],
      [{ name: 'ClaimNumber', type: "VarChar" }]
    );
    
    return c.json({ 
      success: true, 
      message: "Claim submitted successfully", 
      claimNumber: result.output.ClaimNumber,
      validationResults
    });
  } catch (err) {
    console.error("Error processing claim:", err);
    return c.json({
      success: false,
      message: "Failed to process claim",
      error: err.message,
      stackTrace: err.stack,
      validationResults: validationResults || 'Validation did not complete'
    }, 500);
  }
});

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
