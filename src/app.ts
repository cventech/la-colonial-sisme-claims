import { Hono } from "hono";
import { insertClaim } from "./data";
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
import { validateClaimData, ValidationResults } from "./helpers/validateClaimData";
dotenv.config();

const app = new Hono();

app.post('/claims', async (c) => {
  let validationResults: ValidationResults;
  try {
    const claimData = await c.req.json();
    
    const validation = await validateClaimData(claimData);
    validationResults = validation.validationResults;
    
    if (!validation.isValid) {
      return c.json({
        success: false,
        message: validation.errorMessage,
        error: validation.error,
        validationResults
      }, validation.errorCode || 400 as any);
    }

    const result = await insertClaim(
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

export default app;
