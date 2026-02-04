
import React, { useState, useMemo } from 'react';
import { TaxInputs, TaxResult, TaxScaleEntry, TaxDeductions } from './types';
import { calculateTax } from './services/taxEngine';
import { TAX_CONSTANTS } from './constants';
import { GoogleGenAI } from "@google/genai";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const App: React.FC = () => {
  const [inputs, setInputs] = useState<TaxInputs>({
    period: '2025',
    month: 1,
    grossSalary: 3500000,
    aguinaldo: true,
    isIndependent: false,
    deductions: {
      spouse: false, children: 0, otherDependents: 0,
      rent: 0, mortgageInterest: 0, domesticHelp: 0,
      medicalInsurance: 0, medicalFees: 0, lifeInsurance: 0, retirementPlan: 0,
      educationalExpenses: 0, donations: 0, burialExpenses: 0, equipmentClothing: 0, viaticos: 0, others: 0
    }
  });

  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'family' | 'home' | 'health' | 'others'>('family');

  const result = useMemo(() => calculateTax(inputs), [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setInputs(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof TaxInputs] as any),
          [child]: type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : (value === '' ? 0 : Number(value))
        }
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : (name === 'period' ? value : (value === '' ? 0 : Number(value)))
      }));
    }
  };

  const generateAiInsight = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const situation = inputs.isIndependent ? 'Autónomo' : 'Relación de Dependencia';
      const prompt = `Actúa como experto en liquidación de haberes argentina. Analiza: Bruto $${inputs.grossSalary}, Neto de Aportes $${result.netMonthlyPreTax.toFixed(2)}, Retención Ganancias $${result.monthlyTax.toFixed(2)}. MNI mensual $542.295, Deducción Especial $2.060.721. Explica la incidencia del 8.33% de SAC proporcional y el impacto de deducir el 40% del alquiler.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiInsight(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      setAiInsight("Error al consultar a la IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700 text-sm";
  const labelBaseClass = "block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1";

  const factor = inputs.month / 12;
  const currentScales: TaxScaleEntry[] = (TAX_CONSTANTS as any)[inputs.period].scale;

  const MemoItem = ({ label, value, isNegative = false, isCategory = false }: { label: string, value: number, isNegative?: boolean, isCategory?: boolean }) => {
    if (value === 0 && !isCategory) return null;
    return (
      <div className={`flex justify-between items-center py-1.5 ${isCategory ? 'mt-4 border-b border-white/10 pb-1' : 'pl-4'}`}>
        <span className={`text-[11px] ${isCategory ? 'font-black text-indigo-400 uppercase tracking-widest' : 'text-slate-400 font-medium'}`}>{label}</span>
        <span className={`font-mono text-sm ${isNegative ? 'text-rose-400' : 'text-slate-200'} ${isCategory ? 'font-black' : ''}`}>
          {isNegative ? '-' : ''} $ {Math.round(value).toLocaleString()}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-slate-900 text-white pt-16 pb-24 px-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10 gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Calculadora Ganancias Profesional</h1>
            <p className="text-indigo-400 font-bold mt-2">Motor de cálculo Ley 27.743 • Argentina {inputs.period}</p>
            <button 
              onClick={() => setShowScaleModal(true)}
              className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors py-2 px-4 bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Escalas Mensualizadas Actualizadas
            </button>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Periodo</span>
              <select name="period" value={inputs.period} onChange={handleInputChange} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 font-bold outline-none text-white appearance-none cursor-pointer hover:bg-white/20">
                <option value="2025" className="text-slate-800">2025</option>
                <option value="2026" className="text-slate-800">2026</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mes</span>
              <select name="month" value={inputs.month} onChange={handleInputChange} className="bg-indigo-600 border border-indigo-400 rounded-xl px-4 py-2 font-bold outline-none text-white appearance-none cursor-pointer hover:bg-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1} className="text-slate-800">{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-7 rounded-[32px] shadow-2xl border border-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              Ingresos Mensuales
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelBaseClass}>Sueldo Bruto (Haberes con Aportes)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    name="grossSalary" 
                    value={inputs.grossSalary === 0 ? '' : inputs.grossSalary} 
                    onChange={handleInputChange} 
                    placeholder="Monto Bruto..."
                    className={inputBaseClass + " text-xl font-mono font-bold pl-10 py-3"} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-all group border border-slate-100 hover:border-indigo-200">
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-700">SAC Proporcional</span>
                    <p className="text-[10px] text-slate-400">Incluido (1/12) automático</p>
                  </div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                     <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl cursor-pointer hover:bg-indigo-100/50 transition-all group border border-indigo-100 hover:border-indigo-300">
                  <input type="checkbox" name="isIndependent" checked={inputs.isIndependent} onChange={handleInputChange} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="block text-xs font-bold text-indigo-700">Autónomo</span>
                    <p className="text-[10px] text-indigo-400">Art. 30 inc. c, apartado 1</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              {(['family', 'home', 'health', 'others'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-tighter transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'family' ? 'Familia' : tab === 'home' ? 'Vivienda' : tab === 'health' ? 'Salud' : 'Otros'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600"></div>}
                </button>
              ))}
            </div>
            
            <div className="p-7 min-h-[300px]">
              {activeTab === 'family' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="flex justify-between items-center p-4 bg-pink-50/50 rounded-2xl border border-pink-100 hover:border-pink-200 transition-colors cursor-pointer group">
                    <span className="text-xs font-bold text-pink-700">Cónyuge / Conviviente</span>
                    <input type="checkbox" name="deductions.spouse" checked={inputs.deductions.spouse} onChange={handleInputChange} className="w-5 h-5 accent-pink-600" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Hijos (&lt;18)</label>
                      <input 
                        type="number" 
                        name="deductions.children" 
                        value={inputs.deductions.children === 0 ? '' : inputs.deductions.children} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Otras Cargas</label>
                      <input 
                        type="number" 
                        name="deductions.otherDependents" 
                        value={inputs.deductions.otherDependents === 0 ? '' : inputs.deductions.otherDependents} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'home' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Alquiler Anual Total</label>
                    <input 
                      type="number" 
                      name="deductions.rent" 
                      value={inputs.deductions.rent === 0 ? '' : inputs.deductions.rent} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                    <p className="text-[9px] text-slate-400 mt-1 italic">Deducción del 40% según parámetros técnicos.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Intereses Hipotecarios (Anual)</label>
                    <input 
                      type="number" 
                      name="deductions.mortgageInterest" 
                      value={inputs.deductions.mortgageInterest === 0 ? '' : inputs.deductions.mortgageInterest} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Servicio Doméstico (Anual)</label>
                    <input 
                      type="number" 
                      name="deductions.domesticHelp" 
                      value={inputs.deductions.domesticHelp === 0 ? '' : inputs.deductions.domesticHelp} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Medicina Prepaga (Mensual)</label>
                    <input 
                      type="number" 
                      name="deductions.medicalInsurance" 
                      value={inputs.deductions.medicalInsurance === 0 ? '' : inputs.deductions.medicalInsurance} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Honorarios Médicos (Anual)</label>
                    <input 
                      type="number" 
                      name="deductions.medicalFees" 
                      value={inputs.deductions.medicalFees === 0 ? '' : inputs.deductions.medicalFees} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                    <p className="text-[9px] text-slate-400 mt-1 italic">Deducción del 40% de lo facturado.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Seguro de Vida</label>
                      <input 
                        type="number" 
                        name="deductions.lifeInsurance" 
                        value={inputs.deductions.lifeInsurance === 0 ? '' : inputs.deductions.lifeInsurance} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Seguro de Retiro</label>
                      <input 
                        type="number" 
                        name="deductions.retirementPlan" 
                        value={inputs.deductions.retirementPlan === 0 ? '' : inputs.deductions.retirementPlan} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'others' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Gastos Educativos (Anual)</label>
                    <input 
                      type="number" 
                      name="deductions.educationalExpenses" 
                      value={inputs.deductions.educationalExpenses === 0 ? '' : inputs.deductions.educationalExpenses} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Donaciones</label>
                      <input 
                        type="number" 
                        name="deductions.donations" 
                        value={inputs.deductions.donations === 0 ? '' : inputs.deductions.donations} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Gasto Sepelio</label>
                      <input 
                        type="number" 
                        name="deductions.burialExpenses" 
                        value={inputs.deductions.burialExpenses === 0 ? '' : inputs.deductions.burialExpenses} 
                        onChange={handleInputChange} 
                        className={inputBaseClass} 
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Indumentaria / Viáticos</label>
                    <input 
                      type="number" 
                      name="deductions.equipmentClothing" 
                      value={inputs.deductions.equipmentClothing === 0 ? '' : inputs.deductions.equipmentClothing} 
                      onChange={handleInputChange} 
                      className={inputBaseClass} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: RESULTADOS Y MEMORIA */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <div className="flex-1 space-y-4 relative z-10">
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Sueldo de Bolsillo (Neto Final)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-400">$</span>
                  <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">{Math.round(result.netMonthlyPostTax).toLocaleString()}</h3>
                </div>
                <div className="flex gap-8 pt-6 border-t border-slate-100">
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retención Ganancias</span>
                      <p className="text-2xl font-black text-rose-500">$ {Math.round(result.monthlyTax).toLocaleString()}</p>
                   </div>
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neto s/ Aportes</span>
                      <p className="text-2xl font-black text-slate-800">$ {Math.round(result.netMonthlyPreTax).toLocaleString()}</p>
                   </div>
                </div>
             </div>
             <div className="w-40 h-40 bg-emerald-100/50 rounded-full flex items-center justify-center border-8 border-white shadow-xl shrink-0 relative z-10">
                <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">Σ</span>
              Memoria de Cálculo Técnica
            </h3>
            
            <div className="space-y-1">
              {/* Sección Ingresos */}
              <div className="flex justify-between items-center py-2 border-b border-white/5 mb-2">
                 <div className="flex flex-col">
                   <span className="text-xs text-indigo-400 font-black uppercase tracking-widest">Neto Gravado (Mes + SAC Prop.)</span>
                   <p className="text-[10px] text-slate-500">Sueldo neto aportes + 1/12 SAC acumulado</p>
                 </div>
                 <span className="font-mono text-lg font-bold text-white">$ {Math.round(result.steps.cumulativeNetPreTax).toLocaleString()}</span>
              </div>

              {/* Sección Desglose Deducciones */}
              <div className="bg-white/5 rounded-3xl p-4 mt-4 space-y-1 border border-white/5">
                <MemoItem label="Mínimo No Imponible (Art. 30, a)" value={result.breakdown.baseDeduction} isNegative />
                <MemoItem label={`Deducción Especial (Art. 30, c, ${inputs.isIndependent ? '1' : '2'})`} value={result.breakdown.specialDeduction} isNegative />
                
                {(result.breakdown.spouseAmount > 0 || result.breakdown.childrenAmount > 0 || result.breakdown.otherDependentsAmount > 0) && (
                  <>
                    <MemoItem label="Cargas de Familia (Art. 30, b)" value={0} isCategory />
                    <MemoItem label="Cónyuge / Conviviente" value={result.breakdown.spouseAmount} isNegative />
                    <MemoItem label="Hijos / Hijastros" value={result.breakdown.childrenAmount} isNegative />
                  </>
                )}

                <MemoItem label="Deducciones Generales (SIRADIG)" value={0} isCategory />
                <MemoItem label="Alquileres (40% s/ Total)" value={result.breakdown.rentAmount} isNegative />
                <MemoItem label="Seguros / Otros" value={result.breakdown.insuranceAmount + result.breakdown.burialAmount} isNegative />
                <MemoItem label="Prepaga / Médicos" value={result.breakdown.medicalInsuranceAmount + result.breakdown.medicalFeesAmount} isNegative />
                <MemoItem label="Educación / Viáticos" value={result.breakdown.educationAmount + result.breakdown.viaticosAmount} isNegative />
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center py-4 mt-4 border-t border-white/10">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Base Imponible Final</span>
                   <span className="text-[9px] text-slate-500">Monto sujeto a alícuotas progresivas</span>
                 </div>
                 <span className="text-3xl font-mono font-black text-white">$ {Math.round(result.taxableIncomeCumulative).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mb-32 -mr-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-white font-black text-xl italic tracking-tight">Análisis Fiscal IA</h3>
                <span className="ml-auto bg-white/10 text-[9px] px-2 py-1 rounded-full font-black uppercase text-white/80 border border-white/10 backdrop-blur-sm tracking-widest">Gemini 3 Flash</span>
              </div>
              <div className="bg-black/15 backdrop-blur-md rounded-3xl p-6 mb-6 min-h-[100px] border border-white/5">
                <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                  {aiInsight || "Utilice la inteligencia artificial para analizar su situación fiscal y entender cómo el SAC proporcional del 8.33% y el tope de aportes impactan en su bolsillo."}
                </p>
              </div>
              <button 
                onClick={generateAiInsight} 
                disabled={loadingAi}
                className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 group/btn active:scale-95"
              >
                {loadingAi ? "Calculando impacto legal..." : "Analizar con IA (Gemini)"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Escalas */}
      {showScaleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.5)] w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Tabla de Alícuotas</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Valores Mensualizados ({inputs.period})</p>
              </div>
              <button onClick={() => setShowScaleModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">✕</button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <div className="overflow-hidden border border-slate-100 rounded-[24px] shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-5">Excedente Desde ($)</th>
                      <th className="px-6 py-5">Cuota Fija ($)</th>
                      <th className="px-6 py-5 text-right">% Alícuota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentScales.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-6 py-5 font-mono text-sm text-slate-700">
                          {Math.round(entry.lowerBound * factor).toLocaleString()}
                        </td>
                        <td className="px-6 py-5 font-mono text-sm text-slate-700">
                          {Math.round(entry.fixedCharge * factor).toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-900 text-base">
                          {(entry.rate * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <p className="text-[10px] text-amber-700 leading-relaxed">
                   <strong>Nota Técnica:</strong> Los aportes de seguridad social se calculan hasta el tope de base imponible sujeta a aportes proyectado de <strong>${TAX_CONSTANTS[inputs.period].maxSocialSecurityBase.toLocaleString()}</strong>.
                 </p>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowScaleModal(false)}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-xl"
              >
                Volver al Cálculo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
