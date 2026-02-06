
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

  // 4. Deducciones Familiares (Ya vienen anualizadas en constants, aplicamos factor de meses)
  const spouseAmount = inputs.deductions.spouse ? periodData.spouse * factor : 0;
  const childrenAmount = (inputs.deductions.children * periodData.child) * factor;
  const otherDependentsAmount = (inputs.deductions.otherDependents * (periodData.otherDependent || periodData.child)) * factor;
  const familyTotal = spouseAmount + childrenAmount + otherDependentsAmount;

  // 5. Deducciones Generales (SIRADIG)
  
  // CORRECCIÓN ALQUILER: 40% del monto pagado ACUMULADO, con tope del MNI (GNI) acumulado.
  // inputs.deductions.rent es el valor MENSUAL que paga el usuario.
  const cumulativeRentPaid = inputs.deductions.rent * m;
  const rentAmount = Math.min(cumulativeRentPaid * 0.40, gniAcc);

  // Intereses Hipotecarios: Tope anual fijo, lo mensualizamos según el mes de cálculo.
  const mortgageAmount = Math.min(inputs.deductions.mortgageInterest * factor, periodData.topes.mortgage * factor);
  
  // Servicio Doméstico: Tope anual es el MNI, lo mensualizamos.
  const domesticHelpAmount = Math.min(inputs.deductions.domesticHelp * factor, gniAcc);
  
  // Gastos Educativos: Tope anual es el 40% del MNI, lo mensualizamos.
  const educationAmount = Math.min(inputs.deductions.educationalExpenses * factor, gniAcc * 0.40);
  
  // Seguros: Tope anual fijo.
  const insuranceAmount = Math.min((inputs.deductions.lifeInsurance + inputs.deductions.retirementPlan) * factor, periodData.topes.insurance * factor);
  
  // Sepelio: Tope anual fijo (usualmente muy bajo por ley).
  const burialAmount = Math.min(inputs.deductions.burialExpenses * factor, periodData.topes.burial * factor);
  
  // Viáticos: Tope 40% del MNI.
  const viaticosAmount = Math.min(inputs.deductions.viaticos * factor, gniAcc * 0.40);
  
  // Indumentaria: No tiene tope específico pero debe ser gasto real.
  const equipmentAmount = inputs.deductions.equipmentClothing * factor;

  // Salud y Donaciones (Tope 5% Ganancia Neta Acumulada)
  const fivePercentTope = cumulativeNetPreTax * 0.05;
  // medicalInsurance es MENSUAL, medicalFees y donations son ANUALES (SIRADIG).
  const healthRaw = (inputs.deductions.medicalInsurance * m) + ((inputs.deductions.medicalFees + inputs.deductions.donations) * factor);
  const appliedHealthDonations = Math.min(healthRaw, fivePercentTope);
  
  // Prorrateo del tope entre los 3 conceptos si se excede
  const ratio = healthRaw > 0 ? appliedHealthDonations / healthRaw : 1;
  const medicalInsuranceAmount = (inputs.deductions.medicalInsurance * m) * ratio;
  const medicalFeesAmount = (inputs.deductions.medicalFees * factor * 0.40) * ratio; // Se deduce solo el 40% de honorarios médicos
  const donationsAmount = (inputs.deductions.donations * factor) * ratio;

  const totalOtherDeductions = rentAmount + mortgageAmount + domesticHelpAmount + educationAmount + 
                               insuranceAmount + burialAmount + viaticosAmount + equipmentAmount + appliedHealthDonations;

  const totalDeductionsAcc = gniAcc + specialDeductionAcc + familyTotal + totalOtherDeductions;

  // 6. Base Imponible Final Acumulada
  const taxableIncomeAcc = Math.max(0, cumulativeNetPreTax - totalDeductionsAcc);

  // 7. Aplicación de Escala Art. 94 (Sobre Base Acumulada)
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

  // 8. Cálculo de retención del mes (Diferencia entre acumulado actual y acumulado anterior proyectado)
  const previousMonthsFactor = (m - 1) / 12;
  let prevCumulativeTax = 0;
  if (m > 1) {
    const prevNetPre = (monthlyNetPreTax + monthlySAC) * (m - 1);
    // Prorrateamos las deducciones acumuladas al mes anterior
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
