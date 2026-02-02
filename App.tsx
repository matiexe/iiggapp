
import React, { useState, useMemo } from 'react';
import { TaxInputs, TaxResult, TaxScaleEntry } from './types';
import { calculateTax } from './services/taxEngine';
import { TAX_CONSTANTS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [inputs, setInputs] = useState<TaxInputs>({
    period: '2025',
    grossSalary: 2500000,
    aguinaldo: true,
    deductions: {
      spouse: false,
      children: 0,
      otherDependents: 0,
      mortgageInterest: 0,
      domesticHelp: 0,
      medicalInsurance: 0,
      lifeInsurance: 0,
      retirementPlan: 0,
      educationalExpenses: 0,
      rent: 0,
      others: 0,
    }
  });

  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);

  const result = useMemo(() => calculateTax(inputs), [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setInputs(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof TaxInputs] as any),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : Number(value)
        }
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'period' ? value : Number(value))
      }));
    }
  };

  const handlePeriodChange = (period: '2025' | '2026') => {
    setInputs(prev => ({ ...prev, period }));
    setAiInsight(""); // Clear AI insight when period changes to encourage recalculation
  };

  const generateAiInsight = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Actúa como un experto tributario argentino. Dado este escenario de Impuesto a las Ganancias para el año ${inputs.period}: 
      - Sueldo Bruto: $${inputs.grossSalary.toLocaleString()}
      - Retención Mensual Estimada: $${result.monthlyTax.toLocaleString()}
      - Tasa Efectiva: ${result.effectiveRate.toFixed(2)}%
      - Deducciones Familiares: ${inputs.deductions.children} hijos, ${inputs.deductions.otherDependents} otros dependientes.
      - Alquiler Anual informado: $${inputs.deductions.rent.toLocaleString()} (se deduce el 10%).
      
      Explica brevemente por qué paga este monto, si está en un escalón alto de la escala, y da 2 consejos legales rápidos para optimizar su carga impositiva en Argentina (por ejemplo, mencionar gastos educativos, seguros o donaciones). Sé conciso y profesional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiInsight(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error(error);
      setAiInsight("Hubo un error consultando al asesor fiscal IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const chartData = [
    { name: 'Sueldo Neto', value: result.netMonthlyPostTax, color: '#10b981' },
    { name: 'Ganancias', value: result.monthlyTax, color: '#ef4444' },
    { name: 'Aportes S.S.', value: result.grossMonthly * 0.17, color: '#3b82f6' },
  ];

  const inputBaseClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium";
  const labelBaseClass = "block text-sm font-semibold text-slate-600 mb-1.5 ml-1";

  const currentScale: TaxScaleEntry[] = (TAX_CONSTANTS as any)[inputs.period].scale;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-indigo-700 text-white py-12 px-4 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-900 rounded-full opacity-30 blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Calculadora Ganancias</h1>
            <p className="opacity-90 mt-2 text-indigo-100 font-medium text-lg">Argentina • Relación de Dependencia</p>
            <button 
              onClick={() => setShowScaleModal(true)}
              className="mt-6 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              Ver escalas de alícuotas
            </button>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-[0.2em] mb-1">Período Fiscal</span>
            <div className="bg-indigo-900/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 flex relative shadow-inner">
              <button 
                onClick={() => handlePeriodChange('2025')}
                className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${inputs.period === '2025' ? 'text-indigo-700 bg-white shadow-lg' : 'text-white hover:bg-white/5'}`}
              >
                Año 2025
              </button>
              <button 
                onClick={() => handlePeriodChange('2026')}
                className={`relative z-10 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${inputs.period === '2026' ? 'text-indigo-700 bg-white shadow-lg' : 'text-white hover:bg-white/5'}`}
              >
                Año 2026
              </button>
            </div>
            <p className="text-[10px] text-indigo-200/60 font-medium italic">Valores proyectados según inflación</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              Ingresos Mensuales
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelBaseClass}>Sueldo Bruto Mensual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    name="grossSalary" 
                    value={inputs.grossSalary} 
                    onChange={handleInputChange}
                    className={`${inputBaseClass} pl-8 text-xl font-mono`}
                    placeholder="Ej: 3,500,000"
                  />
                </div>
                <input 
                  type="range" 
                  min="500000" 
                  max="15000000" 
                  step="50000"
                  name="grossSalary"
                  value={inputs.grossSalary}
                  onChange={handleInputChange}
                  className="w-full mt-4 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  id="aguinaldo"
                  name="aguinaldo" 
                  checked={inputs.aguinaldo} 
                  onChange={handleInputChange}
                  className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700">Incluir Sueldo Anual Complementario (SAC)</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              Cargas de Familia
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                <span className="text-sm font-bold text-slate-700">Cónyuge / Unión Convivencial</span>
                <input 
                  type="checkbox" 
                  name="deductions.spouse" 
                  checked={inputs.deductions.spouse} 
                  onChange={handleInputChange}
                  className="w-6 h-6 rounded-full text-indigo-600 accent-indigo-600"
                />
              </label>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Hijos a cargo (&lt; 18 años)</span>
                <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setInputs(p => ({...p, deductions: {...p.deductions, children: Math.max(0, p.deductions.children - 1)}}))}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800 text-lg">{inputs.deductions.children}</span>
                  <button 
                    onClick={() => setInputs(p => ({...p, deductions: {...p.deductions, children: p.deductions.children + 1}}))}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Otros dependientes</span>
                <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setInputs(p => ({...p, deductions: {...p.deductions, otherDependents: Math.max(0, p.deductions.otherDependents - 1)}}))}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800 text-lg">{inputs.deductions.otherDependents}</span>
                  <button 
                    onClick={() => setInputs(p => ({...p, deductions: {...p.deductions, otherDependents: p.deductions.otherDependents + 1}}))}
                    className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              Deducciones Anuales
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelBaseClass}>Gastos Educación / Doméstico</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    name="deductions.educationalExpenses" 
                    value={inputs.deductions.educationalExpenses} 
                    onChange={handleInputChange}
                    className={`${inputBaseClass} pl-8`}
                    placeholder="Monto anual acumulado"
                  />
                </div>
              </div>

              <div>
                <label className={labelBaseClass}>Alquiler Vivienda Permanente (Total Pagado)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    name="deductions.rent" 
                    value={inputs.deductions.rent} 
                    onChange={handleInputChange}
                    className={`${inputBaseClass} pl-8`}
                    placeholder="Total anual pagado"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 ml-1 italic font-medium">Se deduce el 10% del total anual pagado según ley.</p>
              </div>

              <div>
                <label className={labelBaseClass}>Otras deducciones (Seguros, Donaciones, etc.)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    name="deductions.others" 
                    value={inputs.deductions.others} 
                    onChange={handleInputChange}
                    className={`${inputBaseClass} pl-8`}
                    placeholder="Suma de otros montos deducibles"
                  />
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed italic font-medium border-t pt-3">
                Los topes se ajustan trimestralmente por IPC. Esta calculadora usa valores proyectados para simplificar el cálculo anual.
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-indigo-500 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">En Mano</span>
              <div className="text-3xl font-extrabold text-slate-800">$ {result.netMonthlyPostTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase">Sueldo neto mensual</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-red-500 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Impuesto</span>
              <div className="text-3xl font-extrabold text-red-600">$ {result.monthlyTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] font-semibold text-red-400 mt-2 uppercase">Retención promedio</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-emerald-500 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Efectiva</span>
              <div className="text-3xl font-extrabold text-emerald-600">{result.effectiveRate.toFixed(1)}%</div>
              <p className="text-[10px] font-semibold text-emerald-400 mt-2 uppercase">Carga fiscal real</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-slate-50 rounded-full blur-3xl opacity-50"></div>
            <h3 className="text-xl font-bold mb-8 text-slate-800 relative z-10">Tu Ingreso Bruto</h3>
            <div className="h-64 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => `$ ${value.toLocaleString()}`} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-7 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Cómputos Anuales ({inputs.period})</h3>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-tighter">Proyectado</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-7 py-4 font-medium text-slate-600">Ganancia No Imponible (GNI)</td>
                    <td className="px-7 py-4 text-right font-mono font-bold text-slate-800">$ {result.breakdown.baseDeduction.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-7 py-4 font-medium text-slate-600">Deducción Especial</td>
                    <td className="px-7 py-4 text-right font-mono font-bold text-slate-800">$ {result.breakdown.specialDeduction.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-7 py-4 font-medium text-slate-600">Cargas de Familia</td>
                    <td className="px-7 py-4 text-right font-mono font-bold text-indigo-600">$ {result.breakdown.familyDeductions.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-7 py-4 font-medium text-slate-600">Alquiler, Educación y Otros</td>
                    <td className="px-7 py-4 text-right font-mono font-bold text-emerald-600">$ {result.breakdown.otherDeductions.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-indigo-50/30">
                    <td className="px-7 py-5 font-black text-slate-800 text-base">Mínimo no imponible total</td>
                    <td className="px-7 py-5 text-right font-mono font-black text-indigo-700 text-lg">$ {result.totalDeductions.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-indigo-200 group">
             <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
             <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-400 rounded-full blur-3xl opacity-20"></div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                 </div>
                 <h3 className="text-white font-extrabold text-xl">Análisis con Inteligencia Artificial</h3>
                 <span className="bg-indigo-400/30 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-white/20 ml-auto">Gemini Flash</span>
               </div>
               
               <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-5 mb-6 min-h-[100px] border border-white/5">
                 {aiInsight ? (
                   <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                     {aiInsight}
                   </p>
                 ) : (
                   <p className="text-indigo-200 text-sm italic font-medium">
                     Calcula tu sueldo y presiona el botón para recibir un análisis personalizado sobre tu situación fiscal, explicando tu escala y cómo optimizar deducciones.
                   </p>
                 )}
               </div>

               <button 
                 onClick={generateAiInsight}
                 disabled={loadingAi}
                 className="w-full bg-white text-indigo-700 hover:bg-indigo-50 disabled:bg-indigo-200 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-800/20 active:scale-[0.98] flex items-center justify-center gap-2"
               >
                 {loadingAi ? (
                   <>
                     <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Consultando al experto...
                   </>
                 ) : "Obtener Recomendación Personalizada"}
               </button>
             </div>
          </div>

        </section>
      </main>

      {/* Modal de Escalas */}
      {showScaleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowScaleModal(false)}
          ></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 leading-none">Escalas Período {inputs.period}</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Montos acumulados anuales según Art. 94</p>
              </div>
              <button 
                onClick={() => setShowScaleModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                    <td className="py-3 px-2">Desde ($)</td>
                    <td className="py-3 px-2">Hasta ($)</td>
                    <td className="py-3 px-2">Cuota Fija ($)</td>
                    <td className="py-3 px-2 text-right">% Exc.</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono text-sm">
                  {currentScale.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-2 font-bold text-slate-800">{row.lowerBound.toLocaleString()}</td>
                      <td className="py-4 px-2 text-slate-500">
                        {idx < currentScale.length - 1 ? currentScale[idx + 1].lowerBound.toLocaleString() : 'En adelante'}
                      </td>
                      <td className="py-4 px-2 text-indigo-600 font-bold">{row.fixedCharge.toLocaleString()}</td>
                      <td className="py-4 px-2 text-right font-black text-slate-800">{(row.rate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Nota: La base imponible sobre la cual se aplican estas escalas es el Sueldo Neto anual menos todas las deducciones admitidas (GNI, Especial, Cargas de familia, etc).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200 p-5 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-tighter">Sueldo neto</span>
          <span className="text-2xl font-black text-emerald-600">$ {result.netMonthlyPostTax.toLocaleString()}</span>
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[10px] uppercase font-black text-slate-400 block tracking-tighter">Impuesto</span>
          <span className="text-2xl font-black text-red-500">$ {result.monthlyTax.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
