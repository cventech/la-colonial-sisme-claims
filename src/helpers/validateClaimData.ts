import { validatePolicy, validatePlan, validateInsured, validateCoveragesGroup } from "../data";

interface ValidationResult {
  success: boolean;
  error?: string;
  recordset?: any[];
  output?: any;
}

export interface ValidationResults {
  policy: ValidationResult;
  plan: ValidationResult;
  insured: ValidationResult;
  coverage: ValidationResult;
}
export async function validateClaimData(claimData: any): Promise<{
  isValid: boolean;
  validationResults: ValidationResults;
  errorMessage?: string;
  errorCode?: number;
  error?: string;
}> {
  const policyNumber = claimData.Claims_PolicyNumber;
  const serviceDate = claimData.ClaimsTr_ServiceDate;
  const insured = claimData.Claims_Insured;
  const planCode = claimData.ClaimsTr_Plan;
  const service = parseInt(claimData.ClaimsTr_ServiceCode);
  const coverageCode = claimData.ClaimsTr_GCoverage;

  const validationResults: ValidationResults = {
    policy: await validatePolicy(policyNumber, serviceDate),
    plan: planCode ? await validatePlan(policyNumber, serviceDate, planCode) :
      { success: false, error: 'Plan validation skipped - no plan code provided' },
    insured: await validateInsured(policyNumber, serviceDate, insured),
    coverage: (planCode && service) ?
      await validateCoveragesGroup(policyNumber, planCode, service, serviceDate, coverageCode) :
      { success: false, error: 'Coverage validation skipped - missing plan code or service' }
  };

  if (!validationResults.policy.success) {
    return {
      isValid: false,
      validationResults,
      errorMessage: "Policy validation failed",
      errorCode: 400,
      error: validationResults.policy.error
    };
  }

  if (planCode && !validationResults.plan.success) {
    return {
      isValid: false,
      validationResults,
      errorMessage: "Plan validation failed",
      errorCode: 400,
      error: validationResults.plan.error
    };
  }

  if (!validationResults.insured.success) {
    return {
      isValid: false,
      validationResults,
      errorMessage: "Insured validation failed",
      errorCode: 400,
      error: validationResults.insured.error
    };
  }

  if (planCode && service && !validationResults.coverage.success) {
    return {
      isValid: false,
      validationResults,
      errorMessage: "Coverage validation failed",
      errorCode: 400,
      error: validationResults.coverage.error
    };
  }

  return {
    isValid: true,
    validationResults
  };
}
