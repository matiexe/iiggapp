
import { TaxScaleEntry } from './types';

export const TAX_CONSTANTS = {
  '2025': {
    // Valores MENSUALES oficiales ARCA (Enero 2025)
    gni: 306129.29 * 12, 
    specialDeductionEmployee: 1469420.59 * 12, // (GNI + 3.8 * GNI)
    specialDeductionIndependent: 612258.58 * 12, // (GNI * 2)
    spouse: 288131.07 * 12,
    child: 145300.43 * 12,
    otherDependent: 145300.43 * 12,
    
    // Tope base imponible para aportes SS (Enero 2025)
    maxSocialSecurityBase: 3117546.27, 
    
    topes: {
      insurance: 38970.89, // (Tope anual oficial / 12)
      burial: 38970.89, 
      mortgage: 1666.67, 
    },
    
    // Escala Art. 94 Mensual (Valores de la tabla de retención)
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 118940.00 * 12, fixedCharge: 5947.00 * 12, rate: 0.09 },
      { lowerBound: 237880.00 * 12, fixedCharge: 16651.60 * 12, rate: 0.12 },
      { lowerBound: 356820.00 * 12, fixedCharge: 30924.40 * 12, rate: 0.15 },
      { lowerBound: 475760.00 * 12, fixedCharge: 48765.40 * 12, rate: 0.19 },
      { lowerBound: 713640.00 * 12, fixedCharge: 93962.60 * 12, rate: 0.23 },
      { lowerBound: 951520.00 * 12, fixedCharge: 148675.00 * 12, rate: 0.27 },
      { lowerBound: 1427280.00 * 12, fixedCharge: 277130.20 * 12, rate: 0.31 },
      { lowerBound: 1903040.00 * 12, fixedCharge: 424615.80 * 12, rate: 0.35 },
    ] as TaxScaleEntry[]
  },
  '2026': {
    // Valores MENSUALES oficiales ARCA (Vigentes a Febrero 2026 según IPC)
    gni: 428581.01 * 12, 
    specialDeductionEmployee: 2057188.85 * 12,
    specialDeductionIndependent: 857162.02 * 12,
    spouse: 403383.50 * 12,
    child: 203420.60 * 12,
    otherDependent: 203420.60 * 12,
    
    maxSocialSecurityBase: 4364564.78,
    
    topes: {
      insurance: 54559.25,
      burial: 54559.25,
      mortgage: 1666.67,
    },
    
    // Escala Art. 94 Mensual 2026 (Actualizada por coeficiente oficial 1.40 aprox)
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 166516.00 * 12, fixedCharge: 8325.80 * 12, rate: 0.09 },
      { lowerBound: 333032.00 * 12, fixedCharge: 23312.24 * 12, rate: 0.12 },
      { lowerBound: 499548.00 * 12, fixedCharge: 43294.16 * 12, rate: 0.15 },
      { lowerBound: 666064.00 * 12, fixedCharge: 68271.56 * 12, rate: 0.19 },
      { lowerBound: 999096.00 * 12, fixedCharge: 131547.64 * 12, rate: 0.23 },
      { lowerBound: 1332128.00 * 12, fixedCharge: 208145.00 * 12, rate: 0.27 },
      { lowerBound: 1998192.00 * 12, fixedCharge: 387982.28 * 12, rate: 0.31 },
      { lowerBound: 2664256.00 * 12, fixedCharge: 594462.12 * 12, rate: 0.35 },
    ] as TaxScaleEntry[]
  }
};

export const SOCIAL_SECURITY_RATE = 0.17;
