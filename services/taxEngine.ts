
import { TaxInputs, TaxResult, DetailedBreakdown } from '../types';
import { TAX_CONSTANTS, SOCIAL_SECURITY_RATE } from '../constants';

export const calculateTax = (inputs: TaxInputs): TaxResult => {
  const periodData = (TAX_CONSTANTS as any)[inputs.period];
  const m = inputs.month;
  const factor = m / 12;

  // 1. Aportes de Ley (17%) con Tope de Base Imponible (MOPRE)
  const monthlyGross = inputs.grossSalary;
  const baseForSocialSecurity = Math.min(monthlyGross, periodData.maxSocialSecurityBase);
  const monthlySocialSecurity = baseForSocialSecurity * SOCIAL_SECURITY_RATE;
  
  // Sueldo Neto antes de Ganancias
  const monthlyNetPreTax = monthlyGross - monthlySocialSecurity;

  // 2. SAC Proporcional (8.33% s/ neto) - Ley 27.743
  const monthlySAC = monthlyNetPreTax * (1 / 12);
  
  // Base Imponible Bruta Mensual Acumulada
  const cumulativeNetPreTax = (monthlyNetPreTax + monthlySAC) * m;

  // 3. Deducciones Personales (Art. 30) - Acumuladas
  const gniAcc = periodData.gni * factor;
  const specialDeductionBase = inputs.isIndependent 
    ? periodData.specialDeductionIndependent 
    : periodData.specialDeductionEmployee;
  const specialDeductionAcc = specialDeductionBase * factor;

  // 4. Deducciones Familiares
  const spouseAmount = inputs.deductions.spouse ? periodData.spouse * factor : 0;
  const childrenAmount = (inputs.deductions.children * periodData.child) * factor;
  const otherDependentsAmount = (inputs.deductions.otherDependents * (periodData.otherDependent || periodData.child)) * factor;
  const familyTotal = spouseAmount + childrenAmount + otherDependentsAmount;

  // 5. Deducciones Generales (SIRADIG)
  // Alquiler: 40% del monto total según usuario
  const rentAmount = Math.min((inputs.deductions.rent * factor) * 0.40, gniAcc);
  const mortgageAmount = Math.min(inputs.deductions.mortgageInterest * factor, periodData.topes.mortgage * factor);
  const domesticHelpAmount = Math.min(inputs.deductions.domesticHelp * factor, gniAcc);
  const educationAmount = Math.min(inputs.deductions.educationalExpenses * factor, gniAcc * 0.40);
  const insuranceAmount = Math.min((inputs.deductions.lifeInsurance + inputs.deductions.retirementPlan) * factor, periodData.topes.insurance * factor);
  const burialAmount = Math.min(inputs.deductions.burialExpenses * factor, periodData.topes.burial * factor);
  const viaticosAmount = Math.min(inputs.deductions.viaticos * factor, gniAcc * 0.40);
  const equipmentAmount = inputs.deductions.equipmentClothing * factor;

  // Salud y Donaciones (Tope 5% Ganancia Neta)
  const fivePercentTope = cumulativeNetPreTax * 0.05;
  const healthRaw = (inputs.deductions.medicalInsurance * m) + (inputs.deductions.medicalFees * factor * 0.40);
  const combinedHealthDonations = healthRaw + (inputs.deductions.donations * factor);
  const appliedHealthDonations = Math.min(combinedHealthDonations, fivePercentTope);
  
  const ratio = combinedHealthDonations > 0 ? appliedHealthDonations / combinedHealthDonations : 1;
  const medicalInsuranceAmount = (inputs.deductions.medicalInsurance * m) * ratio;
  const medicalFeesAmount = (inputs.deductions.medicalFees * factor * 0.40) * ratio;
  const donationsAmount = (inputs.deductions.donations * factor) * ratio;

  const totalOtherDeductions = rentAmount + mortgageAmount + domesticHelpAmount + educationAmount + 
                               insuranceAmount + burialAmount + viaticosAmount + equipmentAmount + appliedHealthDonations;

  const totalDeductionsAcc = gniAcc + specialDeductionAcc + familyTotal + totalOtherDeductions;

  // 6. Base Imponible Final Acumulada
  const taxableIncomeAcc = Math.max(0, cumulativeNetPreTax - totalDeductionsAcc);

  // 7. Aplicación de Escala Art. 94
  let cumulativeTax = 0;
  const scale = periodData.scale;
  for (let i = scale.length - 1; i >= 0; i--) {
    const entry = scale[i];
    const lb = entry.lowerBound * factor;
    const fc = entry.fixedCharge * factor;
    if (taxableIncomeAcc >= lb) {
      cumulativeTax = fc + ((taxableIncomeAcc - lb) * entry.rate);
      break;
    }
  }

  // 8. Cálculo de retención del mes (Simplificado)
  const previousMonthsFactor = (m - 1) / 12;
  let prevCumulativeTax = 0;
  if (m > 1) {
    const prevNetPre = (monthlyNetPreTax + monthlySAC) * (m - 1);
    const prevDeductions = totalDeductionsAcc * (m - 1) / m;
    const prevTaxable = Math.max(0, prevNetPre - prevDeductions);
    for (let i = scale.length - 1; i >= 0; i--) {
      const lb = scale[i].lowerBound * previousMonthsFactor;
      const fc = scale[i].fixedCharge * previousMonthsFactor;
      if (prevTaxable >= lb) {
        prevCumulativeTax = fc + ((prevTaxable - lb) * scale[i].rate);
        break;
      }
    }
  }

  const monthlyTax = Math.max(0, cumulativeTax - prevCumulativeTax);
  const pocketSalary = monthlyNetPreTax - monthlyTax;

  const breakdown: DetailedBreakdown = {
    baseDeduction: gniAcc,
    specialDeduction: specialDeductionAcc,
    spouseAmount,
    childrenAmount,
    otherDependentsAmount,
    rentAmount,
    mortgageAmount,
    domesticHelpAmount,
    medicalInsuranceAmount,
    medicalFeesAmount,
    insuranceAmount,
    educationAmount,
    donationsAmount,
    burialAmount,
    equipmentAmount,
    viaticosAmount
  };

  return {
    month: m,
    grossMonthly: monthlyGross,
    netMonthlyPreTax: monthlyNetPreTax,
    monthlyTax,
    cumulativeTax,
    netMonthlyPostTax: pocketSalary,
    effectiveRate: (cumulativeTax / (cumulativeNetPreTax || 1)) * 100,
    annualProjectedTax: cumulativeTax / (factor || 1),
    taxableIncomeCumulative: taxableIncomeAcc,
    totalDeductionsCumulative: totalDeductionsAcc,
    steps: {
      cumulativeGross: monthlyGross * m,
      cumulativeSAC: monthlySAC * m,
      cumulativeSocialSecurity: monthlySocialSecurity * m,
      cumulativeNetPreTax
    },
    breakdown
  };
};
