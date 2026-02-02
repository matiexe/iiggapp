
export interface TaxDeductions {
  spouse: boolean;
  children: number;
  otherDependents: number;
  mortgageInterest: number;
  domesticHelp: number;
  medicalInsurance: number;
  lifeInsurance: number;
  retirementPlan: number;
  educationalExpenses: number;
  rent: number; // Added: Alquiler de vivienda
  others: number; // Added: Otras deducciones generales
}

export interface TaxInputs {
  period: '2025' | '2026';
  grossSalary: number;
  aguinaldo: boolean;
  deductions: TaxDeductions;
}

export interface TaxResult {
  grossMonthly: number;
  netMonthlyPreTax: number;
  monthlyTax: number;
  netMonthlyPostTax: number;
  effectiveRate: number;
  annualTotalTax: number;
  taxableIncome: number;
  totalDeductions: number;
  breakdown: {
    baseDeduction: number;
    specialDeduction: number;
    familyDeductions: number;
    otherDeductions: number;
  };
}

export interface TaxScaleEntry {
  lowerBound: number;
  fixedCharge: number;
  rate: number;
}
