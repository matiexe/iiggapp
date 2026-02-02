import { TaxScaleEntry } from './types';

/**
 * Los valores de Ganancias en Argentina (Ley 27.743) se actualizan por IPC.
 * Para 2025 y 2026 se utilizan proyecciones basadas en los valores vigentes a finales de 2024
 * con incrementos estimados por inflación.
 */

export const TAX_CONSTANTS = {
  '2025': {
    gni: 3600000, // Ganancia No Imponible Anual
    specialDeduction: 13600000, // Deducción Especial Anual
    spouse: 3400000,
    child: 1700000,
    otherDependent: 1700000, // Valor estimado para otras cargas
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 1500000, fixedCharge: 75000, rate: 0.09 },
      { lowerBound: 3000000, fixedCharge: 210000, rate: 0.12 },
      { lowerBound: 4500000, fixedCharge: 390000, rate: 0.15 },
      { lowerBound: 6500000, fixedCharge: 690000, rate: 0.19 },
      { lowerBound: 9000000, fixedCharge: 1165000, rate: 0.23 },
      { lowerBound: 13000000, fixedCharge: 2085000, rate: 0.27 },
      { lowerBound: 18000000, fixedCharge: 3435000, rate: 0.31 },
      { lowerBound: 25000000, fixedCharge: 5605000, rate: 0.35 },
    ] as TaxScaleEntry[]
  },
  '2026': {
    // Estimación con inflación adicional para 2026
    gni: 5400000, 
    specialDeduction: 20400000,
    spouse: 5100000,
    child: 2550000,
    otherDependent: 2550000,
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 2250000, fixedCharge: 112500, rate: 0.09 },
      { lowerBound: 4500000, fixedCharge: 315000, rate: 0.12 },
      { lowerBound: 6750000, fixedCharge: 585000, rate: 0.15 },
      { lowerBound: 9750000, fixedCharge: 1035000, rate: 0.19 },
      { lowerBound: 13500000, fixedCharge: 1747500, rate: 0.23 },
      { lowerBound: 19500000, fixedCharge: 3127500, rate: 0.27 },
      { lowerBound: 27000000, fixedCharge: 5152500, rate: 0.31 },
      { lowerBound: 37500000, fixedCharge: 8407500, rate: 0.35 },
    ] as TaxScaleEntry[]
  }
};

export const SOCIAL_SECURITY_RATE = 0.17; // Jubilación, PAMI, Obra Social
export const MAX_RETAINABLE_PERCENTAGE = 0.35;