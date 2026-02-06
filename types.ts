
export interface TaxDeductions {
  // Cargas de Familia
  spouse: boolean;
  children: number;
  otherDependents: number;
  
  // Vivienda y Hogar
  rent: number; 
  mortgageInterest: number; 
  domesticHelp: number; 
  
  // Seguros y Salud
  medicalInsurance: number; 
  medicalFees: number; 
  lifeInsurance: number; 
  retirementPlan: number; 
  
  // Educación y Otros
  educationalExpenses: number; 
  donations: number; 
  burialExpenses: number; 
  equipmentClothing: number; 
  viaticos: number; 
  others: number; 
}

export interface TaxInputs {
  period: '2025' | '2026';
  month: number;
  grossSalary: number;
  aguinaldo: boolean;
  isIndependent: boolean;
  deductions: TaxDeductions;
}

export interface DetailedBreakdown {
  // Personales
  baseDeduction: number;
  specialDeduction: number;
  
  // Familiares
  spouseAmount: number;
  childrenAmount: number;
  otherDependentsAmount: number;
  
  // Generales
  rentAmount: number;
  mortgageAmount: number;
  domesticHelpAmount: number;
  medicalInsuranceAmount: number;
  medicalFeesAmount: number;
  insuranceAmount: number;
  educationAmount: number;
  donationsAmount: number;
  burialAmount: number;
  equipmentAmount: number;
  viaticosAmount: number;
}

export interface TaxResult {
  month: number;
  grossMonthly: number;
  netMonthlyPreTax: number;
  monthlyTax: number;
  cumulativeTax: number;
  netMonthlyPostTax: number;
  effectiveRate: number;
  annualProjectedTax: number;
  taxableIncomeCumulative: number;
  totalDeductionsCumulative: number;
  steps: {
    cumulativeGross: number;
    cumulativeSAC: number;
    cumulativeSocialSecurity: number;
    cumulativeNetPreTax: number;
  };
  breakdown: DetailedBreakdown;
}

export interface TaxScaleEntry {
  lowerBound: number;
  fixedCharge: number;
  rate: number;
}
