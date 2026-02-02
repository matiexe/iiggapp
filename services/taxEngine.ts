
import { TaxInputs, TaxResult, TaxScaleEntry } from '../types';
import { TAX_CONSTANTS, SOCIAL_SECURITY_RATE } from '../constants';

export const calculateTax = (inputs: TaxInputs): TaxResult => {
  const periodData = (TAX_CONSTANTS as any)[inputs.period];
  
  // 1. Sueldo Bruto Anual (incluyendo Aguinaldo si aplica)
  const monthlyGross = inputs.grossSalary;
  const annualGross = monthlyGross * (inputs.aguinaldo ? 13 : 12);
  
  // 2. Descuentos de Seguridad Social (estimados al 17%)
  const socialSecurityAnnual = annualGross * SOCIAL_SECURITY_RATE;
  const annualNetPreTax = annualGross - socialSecurityAnnual;
  
  // 3. Deducciones Personales (Art. 30)
  const gni = periodData.gni;
  const specialDeduction = periodData.specialDeduction;
  
  // 4. Deducciones Familiares
  let familyDeductions = 0;
  if (inputs.deductions.spouse) familyDeductions += periodData.spouse;
  familyDeductions += (inputs.deductions.children * periodData.child);
  familyDeductions += (inputs.deductions.otherDependents * (periodData.otherDependent || periodData.child));
  
  // 5. Otras Deducciones Permitidas (Topes aproximados según Ley 27.743 y vigentes)
  let otherDeductions = 0;
  
  // Deducción por Alquiler de Casa-Habitación: 10% del total pagado según nuevas normativas
  const rentDeduction = inputs.deductions.rent * 0.10;
  otherDeductions += rentDeduction;

  otherDeductions += Math.min(inputs.deductions.mortgageInterest, 20000); // Tope histórico desactualizado
  otherDeductions += Math.min(inputs.deductions.domesticHelp, gni);
  otherDeductions += inputs.deductions.medicalInsurance * 12; 
  otherDeductions += inputs.deductions.educationalExpenses;
  otherDeductions += (inputs.deductions.lifeInsurance || 0);
  otherDeductions += (inputs.deductions.others || 0);
  
  const totalDeductions = gni + specialDeduction + familyDeductions + otherDeductions;
  
  // 6. Ganancia Sujeta a Impuesto (Base Imponible)
  const taxableIncome = Math.max(0, annualNetPreTax - totalDeductions);
  
  // 7. Aplicación de la Escala Progresiva (Art. 94)
  let annualTax = 0;
  const scale = periodData.scale;
  
  for (let i = scale.length - 1; i >= 0; i--) {
    const entry = scale[i];
    if (taxableIncome > entry.lowerBound) {
      const excess = taxableIncome - entry.lowerBound;
      annualTax = entry.fixedCharge + (excess * entry.rate);
      break;
    }
  }
  
  const monthlyTax = annualTax / 12;
  const monthlyNetPreTax = monthlyGross * (1 - SOCIAL_SECURITY_RATE);
  const monthlyNetPostTax = monthlyNetPreTax - monthlyTax;
  const effectiveRate = annualNetPreTax > 0 ? (annualTax / annualNetPreTax) * 100 : 0;

  return {
    grossMonthly: monthlyGross,
    netMonthlyPreTax: monthlyNetPreTax,
    monthlyTax: Math.max(0, monthlyTax),
    netMonthlyPostTax: Math.max(0, monthlyNetPostTax),
    effectiveRate: effectiveRate,
    annualTotalTax: annualTax,
    taxableIncome: taxableIncome,
    totalDeductions: totalDeductions,
    breakdown: {
      baseDeduction: gni,
      specialDeduction: specialDeduction,
      familyDeductions: familyDeductions,
      otherDeductions: otherDeductions
    }
  };
};
