
import { TaxScaleEntry } from './types';

export const TAX_CONSTANTS = {
  '2025': {
    // Valores MENSUALES base según PDF ARCA
    gni: 326355.70 * 12, 
    specialDeductionEmployee: 1566507.79 * 12, 
    specialDeductionIndependent: 1142244.94 * 12, 
    spouse: 307361.71 * 12,
    child: 155003.58 * 12,
    otherDependent: 257381 * 12,
    // Tope base imponible para aportes SS (MOPRE proyectado mensual)
    maxSocialSecurityBase: 2834142.06, 
    topes: {
      insurance: 200000, 
      burial: 15000, 
      mortgage: 20000, 
    },
    // Escala Art. 94 Mensualizada x 12
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 126697.64 * 12, fixedCharge: 6344.88 * 12, rate: 0.09 },
      { lowerBound: 253395.28 * 12, fixedCharge: 17737.67 * 12, rate: 0.12 },
      { lowerBound: 380092.92 * 12, fixedCharge: 32941.39* 12, rate: 0.15 },
      { lowerBound: 570139.38 * 12, fixedCharge: 61448.36 * 12, rate: 0.19 },
      { lowerBound: 140278.75 * 12, fixedCharge: 169774.84 * 12, rate: 0.23 },
      { lowerBound: 1710418.13 * 12, fixedCharge: 300906.89* 12, rate: 0.27 },
      { lowerBound: 2565627.20 * 12, fixedCharge: 531813.84 * 12, rate: 0.31 },
      { lowerBound: 3848440.79 * 12, fixedCharge: 929485.56 * 12, rate: 0.35 },
    ] as TaxScaleEntry[]
  },
  '2026': {
    // Proyección ajustada por IPC estimado (40%)
    gni: 429316.88 * 12, 
    specialDeductionEmployee: 2060721  * 12,
    specialDeductionIndependent: 1717267.50  * 12,
    spouse: 4004330.39 * 12,
    child: 203905.29 * 12,
    otherDependent: 360333 * 12,
    maxSocialSecurityBase: 3967800,
    topes: {
      insurance: 300000,
      burial: 22000,
      mortgage: 20000,
    },
    scale: [
      { lowerBound: 0, fixedCharge: 0, rate: 0.05 },
      { lowerBound: 252000 * 12, fixedCharge: 12600 * 12, rate: 0.09 },
      { lowerBound: 504000 * 12, fixedCharge: 35280 * 12, rate: 0.12 },
      { lowerBound: 756000 * 12, fixedCharge: 65520 * 12, rate: 0.15 },
      { lowerBound: 1008000 * 12, fixedCharge: 103320 * 12, rate: 0.19 },
      { lowerBound: 1512000 * 12, fixedCharge: 199080 * 12, rate: 0.23 },
      { lowerBound: 2016000 * 12, fixedCharge: 315000 * 12, rate: 0.27 },
      { lowerBound: 3024000 * 12, fixedCharge: 587160 * 12, rate: 0.31 },
      { lowerBound: 4032000 * 12, fixedCharge: 899640 * 12, rate: 0.35 },
    ] as TaxScaleEntry[]
  }
};

export const SOCIAL_SECURITY_RATE = 0.17;
