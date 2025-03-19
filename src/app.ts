import { Hono } from "hono";
import { executeSPV2, executeStoredProcedure, validatePolicy, validatePlan, validateInsured, validateCoveragesGroup } from "./data";
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
import { DynamicsOperations } from './shared/operations';

const app = new Hono();

app.get('/', (c) => c.text('Hello Azure Functions!'))

// Define interfaces for validation results
interface ValidationResult {
  success: boolean;
  error?: string;
  recordset?: any[];
  output?: any;
}

interface ValidationResults {
  policy: ValidationResult;
  plan: ValidationResult;
  insured: ValidationResult;
  coverage: ValidationResult;
}

dotenv.config();

app.post('/claims', async (c) => {
  let validationResults: ValidationResults;
  try {
    const claimData = await c.req.json();
    
    const policyNumber = claimData.Claims_PolicyNumber;
    const serviceDate = claimData.ClaimsTr_ServiceDate;
    const insured = claimData.Claims_Insured;
    const planCode = claimData.ClaimsTr_Plan; 
    const service = parseInt(claimData.ClaimsTr_ServiceCode);
    const coverageCode = claimData.ClaimsTr_GCoverage;

    // Store all validation results
    validationResults = {
      policy: await validatePolicy(policyNumber, serviceDate),
      plan: planCode ? await validatePlan(policyNumber, serviceDate, planCode) : 
        { success: false, error: 'Plan validation skipped - no plan code provided' },
      insured: await validateInsured(policyNumber, serviceDate, insured),
      coverage: (planCode && service) ? 
        await validateCoveragesGroup(policyNumber, planCode, service, serviceDate, coverageCode) : 
        { success: false, error: 'Coverage validation skipped - missing plan code or service' }
    };

    // Check if any validation failed
    if (!validationResults.policy.success) {
      return c.json({
        success: false,
        message: "Policy validation failed",
        error: validationResults.policy.error,
        validationResults
      }, 400);
    }
    
    if (planCode && !validationResults.plan.success) {
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

    if (planCode && service && !validationResults.coverage.success) {
      return c.json({
        success: false,
        message: "Coverage validation failed",
        error: validationResults.coverage.error,
        validationResults
      }, 400);
    }

    const result = await executeSPV2(
      "SMI.USP_InsertClaims", 
      [
        { name: 'Claims_PolicyNumber', type: "VarChar", value: claimData.Claims_PolicyNumber },
        { name: 'Claims_EffectiveDate', type: "Date", value: claimData.Claims_EffectiveDate },
        { name: 'Claims_Insured', type: "Int", value: claimData.Claims_Insured },
        { name: 'Claims_Dependent', type: "Int", value: claimData.Claims_Dependent || 0 },
        { name: 'Claims_CUser', type: "VarChar", value: claimData.Claims_CUser },
        { name: 'Claims_ProducerCode', type: "Int", value: claimData.Claims_ProducerCode },
        { name: 'ClaimsTr_GCoverage', type: "VarChar", value: claimData.ClaimsTr_GCoverage },
        { name: 'ClaimsTr_Coverage', type: "VarChar", value: claimData.ClaimsTr_Coverage },
        { name: 'ClaimsTr_ServiceCode', type: "VarChar", value: claimData.ClaimsTr_ServiceCode },
        { name: 'ClaimsTr_ServiceDate', type: "Date", value: claimData.ClaimsTr_ServiceDate },
        { name: 'ClaimsTr_ProviderCode', type: "VarChar", value: claimData.ClaimsTr_ProviderCode },
        { name: 'ClaimsTr_BeneficiaryType', type: "Int", value: claimData.ClaimsTr_BeneficiaryType },
        { name: 'ClaimsTr_BeneficiaryCode', type: "Int", value: claimData.ClaimsTr_BeneficiaryCode },
        { name: 'ClaimsTr_BilledAmount', type: "Decimal", value: claimData.ClaimsTr_BilledAmount },
        { name: 'ClaimsTr_CCurrency', type: "Int", value: claimData.ClaimsTr_CCurrency },
        { name: 'ClaimsTr_DiagnosticCode', type: "VarChar", value: claimData.ClaimsTr_DiagnosticCode },
        { name: 'ClaimsTr_Plan', type: "Int", value: claimData.ClaimsTr_Plan }
      ],
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
      validationResults: validationResults || { 
        policy: { success: false, error: 'Validation did not complete' },
        plan: { success: false, error: 'Validation did not complete' }, 
        insured: { success: false, error: 'Validation did not complete' },
        coverage: { success: false, error: 'Validation did not complete' }
      }
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
