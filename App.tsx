
import React, { useState, useMemo, useRef } from 'react';
import { TaxInputs, TaxResult, TaxScaleEntry, TaxDeductions } from './types';
import { calculateTax } from './services/taxEngine';
import { TAX_CONSTANTS } from './constants';
import { GoogleGenAI } from "@google/genai";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// === CONFIGURACIÓN DE SEGURIDAD ===
// La clave se obtiene de las variables de entorno para evitar exposición en el código fuente.
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || ""; 

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const ArgentinaFlag = () => (
  <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl mr-4 md:mr-6 -mt-2 md:-mt-3">
    <svg className="w-full h-full object-cover" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
      <path fill="#74acdf" d="M0 0h640v160H0z"/>
      <path fill="#fff" d="M0 160h640v160H0z"/>
      <path fill="#74acdf" d="M0 320h640v160H0z"/>
      <circle cx="320" cy="240" r="44" fill="#f6b43e"/>
      <path fill="#f6b43e" d="M320 186l10 24 25-10-10 25 24 10-24 10 10 25-25-10-10 24-10-24-25 10 10-25-24-10 24-10-10-25 25 10 10-24z"/>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<TaxInputs>({
    period: '2025',
    month: 1,
    grossSalary: 4500000,
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
  const [showThanksModal, setShowThanksModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState<boolean>(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'family' | 'home' | 'health' | 'others'>('family');
  const [isMemoryOpen, setIsMemoryOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [feedback, setFeedback] = useState({
    experience: 'Excelente',
    ease: 'Muy fácil',
    suggestions: '',
    recommendation: 10
  });

  const pdfReportRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => calculateTax(inputs), [inputs]);

  const chartData = useMemo(() => {
    const socialSecurity = result.steps.cumulativeSocialSecurity / result.month;
    return [
      { name: 'Sueldo Neto', value: result.netMonthlyPostTax, color: '#10b981' },
      { name: 'Ganancias', value: result.monthlyTax, color: '#f43f5e' },
      { name: 'Aportes Ley', value: socialSecurity, color: '#6366f1' },
    ];
  }, [result]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setInputs(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof TaxInputs] as any),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (value === '' ? 0 : Number(value))
        }
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'period' ? value : (value === '' ? 0 : Number(value)))
      }));
    }
  };

  const generateAiInsight = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Actúa como experto en liquidación de haberes argentina. Analiza: Bruto Mensual $${inputs.grossSalary}, Neto de Aportes $${result.netMonthlyPreTax.toFixed(2)}, Retención Ganancias $${result.monthlyTax.toFixed(2)}. MNI mensual $${((TAX_CONSTANTS as any)[inputs.period].gni / 12).toFixed(0)}. Explica la incidencia del 8.33% de SAC proporcional y el tope de aportes de seguridad social de $${(TAX_CONSTANTS as any)[inputs.period].maxSocialSecurityBase.toLocaleString()}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiInsight(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      setAiInsight("Error al consultar a la IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const exportToPDF = async () => {
    if (!pdfReportRef.current) return;
    setIsExporting(true);
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(pdfReportRef.current!, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Reporte_Ganancias_AR_${MONTHS[inputs.month - 1]}_${inputs.period}.pdf`);
        
        setShowThanksModal(true);
      } catch (error) {
        console.error("Error al exportar PDF:", error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!WEB3FORMS_ACCESS_KEY) {
      alert("Error: No se ha configurado la clave de acceso para el envío de formularios.");
      return;
    }
    setIsSendingFeedback(true);
    
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Feedback Calculadora Ganancias (${inputs.period})`,
          from_name: "Calculadora Ganancias Argentina",
          experience: feedback.experience,
          ease_of_use: feedback.ease,
          suggestions: feedback.suggestions,
          recommendation: feedback.recommendation,
          period: inputs.period,
          gross_salary: inputs.grossSalary
        })
      });

      const data = await response.json();

      if (data.success) {
        setFeedbackSent(true);
      } else {
        throw new Error(data.message || "Error al enviar");
      }
    } catch (error) {
      alert("Hubo un error al enviar el feedback. Por favor, verifica la configuración del servidor.");
      console.error(error);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700 text-sm";
  const labelBaseClass = "block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1";

  const factor = inputs.month / 12;
  const currentScales: TaxScaleEntry[] = (TAX_CONSTANTS as any)[inputs.period].scale;

  const currentScaleStep = useMemo(() => {
    const taxable = result.taxableIncomeCumulative;
    for (let i = currentScales.length - 1; i >= 0; i--) {
      if (taxable >= currentScales[i].lowerBound * factor) {
        return { ...currentScales[i], stepNumber: i + 1 };
      }
    }
    return { ...currentScales[0], stepNumber: 1 };
  }, [result.taxableIncomeCumulative, currentScales, factor]);

  const MemoItem = ({ label, value, isNegative = false, isCategory = false, percentage, sublabel }: { label: string, value: number, isNegative?: boolean, isCategory?: boolean, percentage?: number, sublabel?: string }) => {
    if (value === 0 && !isCategory) return null;
    return (
      <div className={`flex justify-between items-center py-1.5 ${isCategory ? 'mt-4 border-b border-white/10 pb-1' : 'pl-4 border-l border-white/5 ml-1'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] ${isCategory ? 'font-black text-indigo-400 uppercase tracking-widest' : 'text-slate-300 font-medium'}`}>{label}</span>
            {percentage !== undefined && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-bold">{percentage.toFixed(1)}%</span>
            )}
          </div>
          {sublabel && <span className="text-[9px] text-slate-500 italic uppercase tracking-tighter">{sublabel}</span>}
        </div>
        <span className={`font-mono text-sm ${isNegative ? 'text-rose-400' : 'text-slate-200'} ${isCategory ? 'font-black' : ''}`}>
          {isNegative ? '-' : ''} $ {Math.round(value).toLocaleString()}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* HEADER PRINCIPAL */}
      <header className="bg-slate-900 text-white pt-16 pb-24 px-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10 gap-8">
          <div className="flex items-center">
            <ArgentinaFlag />
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Calculadora Ganancias</h1>
              <p className="text-indigo-400 font-bold mt-1">Motor de cálculo Ley 27.743 • Argentina {inputs.period}</p>
              
              <button 
                onClick={() => setShowScaleModal(true)}
                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors py-2 px-4 bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Ver Escalas de Retención
              </button>
            </div>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Año Fiscal</span>
              <select name="period" value={inputs.period} onChange={handleInputChange} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 font-bold outline-none text-white appearance-none cursor-pointer hover:bg-white/20">
                <option value="2025" className="text-slate-800">2025</option>
                <option value="2026" className="text-slate-800">2026</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mes de Cálculo</span>
              <select name="month" value={inputs.month} onChange={handleInputChange} className="bg-indigo-600 border border-indigo-400 rounded-xl px-4 py-2 font-bold outline-none text-white appearance-none cursor-pointer hover:bg-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1} className="text-slate-800">{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DASHBOARD */}
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
                <label className={labelBaseClass}>Sueldo Bruto Mensual</label>
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
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-700">SAC Proporcional</span>
                    <p className="text-[10px] text-slate-400">Prorrateo 8.33% (1/12)</p>
                  </div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                     <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl cursor-pointer hover:bg-indigo-100/50 transition-all group border border-indigo-100 hover:border-indigo-300">
                  <input type="checkbox" name="isIndependent" checked={inputs.isIndependent} onChange={handleInputChange} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="block text-xs font-bold text-indigo-700">Autónomo</span>
                    <p className="text-[10px] text-indigo-400">Deducción Especial Diferencial</p>
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
                      <input type="number" name="deductions.children" value={inputs.deductions.children === 0 ? '' : inputs.deductions.children} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Otras Cargas</label>
                      <input type="number" name="deductions.otherDependents" value={inputs.deductions.otherDependents === 0 ? '' : inputs.deductions.otherDependents} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'home' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Alquiler Mensual (Monto Pago)</label>
                    <input type="number" name="deductions.rent" value={inputs.deductions.rent === 0 ? '' : inputs.deductions.rent} onChange={handleInputChange} className={inputBaseClass} />
                    <p className="text-[9px] text-slate-400 mt-1 italic">Deducción del 40% del monto total pagado, tope MNI.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Intereses Hipotecarios (Anual)</label>
                    <input type="number" name="deductions.mortgageInterest" value={inputs.deductions.mortgageInterest === 0 ? '' : inputs.deductions.mortgageInterest} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Servicio Doméstico (Anual)</label>
                    <input type="number" name="deductions.domesticHelp" value={inputs.deductions.domesticHelp === 0 ? '' : inputs.deductions.domesticHelp} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Medicina Prepaga (Mensual)</label>
                    <input type="number" name="deductions.medicalInsurance" value={inputs.deductions.medicalInsurance === 0 ? '' : inputs.deductions.medicalInsurance} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Honorarios Médicos (Anual)</label>
                    <input type="number" name="deductions.medicalFees" value={inputs.deductions.medicalFees === 0 ? '' : inputs.deductions.medicalFees} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Seguro de Vida (Anual)</label>
                      <input type="number" name="deductions.lifeInsurance" value={inputs.deductions.lifeInsurance === 0 ? '' : inputs.deductions.lifeInsurance} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Seguro de Retiro (Anual)</label>
                      <input type="number" name="deductions.retirementPlan" value={inputs.deductions.retirementPlan === 0 ? '' : inputs.deductions.retirementPlan} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'others' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Gastos Educativos (Anual)</label>
                    <input type="number" name="deductions.educationalExpenses" value={inputs.deductions.educationalExpenses === 0 ? '' : inputs.deductions.educationalExpenses} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Donaciones (Anual)</label>
                      <input type="number" name="deductions.donations" value={inputs.deductions.donations === 0 ? '' : inputs.deductions.donations} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className={labelBaseClass}>Gasto Sepelio (Anual)</label>
                      <input type="number" name="deductions.burialExpenses" value={inputs.deductions.burialExpenses === 0 ? '' : inputs.deductions.burialExpenses} onChange={handleInputChange} className={inputBaseClass} />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className={labelBaseClass}>Indumentaria / Viáticos</label>
                    <input type="number" name="deductions.equipmentClothing" value={inputs.deductions.equipmentClothing === 0 ? '' : inputs.deductions.equipmentClothing} onChange={handleInputChange} className={inputBaseClass} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <div className="flex-1 space-y-4 relative z-10">
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Sueldo Neto de Bolsillo</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-400">$</span>
                  <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">{Math.round(result.netMonthlyPostTax).toLocaleString()}</h3>
                </div>
                <div className="flex gap-8 pt-6 border-t border-slate-100">
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retención Mensual</span>
                      <p className="text-2xl font-black text-rose-500">$ {Math.round(result.monthlyTax).toLocaleString()}</p>
                   </div>
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alícuota Efectiva</span>
                      <p className="text-2xl font-black text-slate-800">{((result.monthlyTax / (result.grossMonthly || 1)) * 100).toFixed(1)}%</p>
                   </div>
                </div>
             </div>
             
             <div className="w-48 h-48 shrink-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(value: number) => `$ ${Math.round(value).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Bruto</span>
                      <span className="text-xs font-mono font-bold text-slate-600">$ {Math.round(result.grossMonthly).toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500">
            <button 
              onClick={() => setIsMemoryOpen(!isMemoryOpen)}
              className="w-full p-8 flex items-center justify-between group hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">Σ</span>
                <h3 className="text-xl font-black">Memoria de Cálculo Técnica ({inputs.period})</h3>
              </div>
              <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300 ${isMemoryOpen ? 'rotate-180 bg-white/10' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </button>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMemoryOpen ? 'max-h-[3000px] opacity-100 pb-8 px-8' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-4 pt-2">
                <div className="bg-indigo-900/30 rounded-3xl p-6 border border-indigo-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">1. Determinación Ganancia Neta</span>
                    <span className="text-[9px] text-slate-500 italic">Cálculos Acumulados Mes {inputs.month}</span>
                  </div>
                  <div className="space-y-2">
                    <MemoItem label="Sueldo Bruto Acumulado" value={result.steps.cumulativeGross} sublabel={`$ ${inputs.grossSalary.toLocaleString()} x ${inputs.month} meses`} />
                    <MemoItem label="(-) Aportes Seguridad Social" value={result.steps.cumulativeSocialSecurity} isNegative sublabel="Jub/OS/PAMI (Hasta Tope)" />
                    <MemoItem label="(=) Sueldo Neto Acumulado" value={result.steps.cumulativeGross - result.steps.cumulativeSocialSecurity} isCategory />
                    <MemoItem label="(+) SAC Proporcional Acumulado" value={result.steps.cumulativeSAC} sublabel="Ley 27.743 (1/12 del neto acumulado)" />
                    <div className="flex justify-between items-center py-3 px-4 bg-white/5 rounded-2xl border border-white/5 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GANANCIA BRUTA GRAVADA</span>
                          <p className="text-[9px] text-slate-500">Total ingresos sujetos a impuesto</p>
                        </div>
                        <span className="text-xl font-mono font-black text-white">$ {Math.round(result.steps.cumulativeNetPreTax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">2. Deducciones Art. 30 y Generales (Acum.)</span>
                  <div className="space-y-1">
                    <MemoItem label="Ganancia No Imponible (Inc. a)" value={result.breakdown.baseDeduction} isNegative sublabel="Monto Acumulado s/ meses" />
                    <MemoItem label={`Deducción Especial (Inc. c)`} value={result.breakdown.specialDeduction} isNegative sublabel={inputs.isIndependent ? 'Apartado 1 (Indep.)' : 'Apartado 2 (Rel. Dep.)'} />
                    
                    {(result.breakdown.spouseAmount > 0 || result.breakdown.childrenAmount > 0 || result.breakdown.otherDependentsAmount > 0) && (
                      <div className="mt-3 border-t border-white/5 pt-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2">Cargas de Familia</span>
                        <MemoItem label="Cónyuge / Conviviente" value={result.breakdown.spouseAmount} isNegative />
                        <MemoItem label="Hijos / Hijastros" value={result.breakdown.childrenAmount} isNegative />
                        <MemoItem label="Otras Cargas" value={result.breakdown.otherDependentsAmount} isNegative />
                      </div>
                    )}

                    <div className="mt-3 border-t border-white/5 pt-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2">Deducciones Generales</span>
                      <MemoItem label="Alquileres (40% s/ Acumulado)" value={result.breakdown.rentAmount} isNegative sublabel={`$ ${inputs.deductions.rent.toLocaleString()} x ${inputs.month} meses x 40%`} />
                      <MemoItem label="Intereses Hipotecarios" value={result.breakdown.mortgageAmount} isNegative />
                      <MemoItem label="Servicio Doméstico" value={result.breakdown.domesticHelpAmount} isNegative />
                      <MemoItem label="Medicina Prepaga" value={result.breakdown.medicalInsuranceAmount} isNegative sublabel={`$ ${inputs.deductions.medicalInsurance.toLocaleString()} x ${inputs.month} meses`} />
                      <MemoItem label="Honorarios Médicos (40%)" value={result.breakdown.medicalFeesAmount} isNegative />
                      <MemoItem label="Seguros Vida / Retiro" value={result.breakdown.insuranceAmount} isNegative />
                      <MemoItem label="Gastos Educativos" value={result.breakdown.educationAmount} isNegative />
                      <MemoItem label="Donaciones" value={result.breakdown.donationsAmount} isNegative />
                      <MemoItem label="Gasto Sepelio" value={result.breakdown.burialAmount} isNegative />
                      <MemoItem label="Viáticos / Equipo" value={result.breakdown.viaticosAmount + result.breakdown.equipmentAmount} isNegative />
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 px-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">GANANCIA NETA SUJETA A IMPUESTO</span>
                      <p className="text-[9px] text-slate-500">Base Imponible Final (Paso 1 - Paso 2)</p>
                    </div>
                    <span className="text-xl font-mono font-black text-white">$ {Math.round(result.taxableIncomeCumulative).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-emerald-900/20 rounded-3xl p-6 border border-emerald-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">3. Liquidación del Impuesto</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 uppercase font-black">Escalón</span>
                      <span className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-emerald-500/40">{currentScaleStep.stepNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-black/20 rounded-2xl space-y-2 border border-white/5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Tramo de Alícuota</span>
                        <span className="text-white font-bold">{(currentScaleStep.rate * 100).toFixed(0)} %</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Mínimo del Escalón (Acum.)</span>
                        <span className="text-white font-mono">$ {Math.round(currentScaleStep.lowerBound * factor).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-white/5 pt-2 font-bold">
                        <span className="text-emerald-400">Fórmula: (Base - Mínimo) * % + Fijo</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                        ($ {Math.round(result.taxableIncomeCumulative).toLocaleString()} - $ {Math.round(currentScaleStep.lowerBound * factor).toLocaleString()}) x {currentScaleStep.rate} + $ {Math.round(currentScaleStep.fixedCharge * factor).toLocaleString()}
                      </p>
                    </div>

                    <MemoItem label="Impuesto Determinado Acumulado" value={result.cumulativeTax} sublabel="A pagar por el total del año a la fecha" />
                    <MemoItem label="(-) Retenciones Meses Anteriores" value={result.cumulativeTax - result.monthlyTax} isNegative sublabel="Prorrateo acumulado anterior" />
                    
                    <div className="flex justify-between items-center py-5 px-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">IMPORTE A RETENER (MES)</span>
                          <p className="text-[9px] text-emerald-800/70 font-bold">Descuento en recibo de haberes</p>
                        </div>
                        <span className="text-3xl font-mono font-black text-white">$ {Math.round(result.monthlyTax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ASESOR IA */}
          <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-white font-black text-xl italic tracking-tight">Análisis Inteligente (Gemini)</h3>
              </div>
              <div className="bg-black/15 backdrop-blur-md rounded-3xl p-6 mb-6 min-h-[100px] border border-white/5">
                <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                  {aiInsight || "El asesor fiscal IA puede explicarle detalladamente cómo influyen sus deducciones específicas en el cálculo final y sugerir optimizaciones legales."}
                </p>
              </div>
              <button 
                onClick={generateAiInsight} 
                disabled={loadingAi}
                className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {loadingAi ? "Analizando normativa..." : "Obtener Análisis IA"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* BARRA DE ACCIONES FLOTANTE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-2xl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-2">
          <button 
            onClick={() => {
              setFeedbackSent(false);
              setShowFeedbackModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            Feedback
          </button>
          <button 
            onClick={() => window.open('https://cafecito.app/mexxtz', '_blank')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Donar
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            )}
            PDF
          </button>
        </div>
      </div>

      {/* MODAL DE FEEDBACK */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-lg w-full border border-slate-100 max-h-[90vh] overflow-y-auto">
            {feedbackSent ? (
              <div className="py-10 text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¡Feedback enviado!</h3>
                <p className="text-slate-500 text-sm mb-8 px-4">Gracias por ayudarnos a mejorar esta herramienta. Tu opinión es muy valiosa para nosotros.</p>
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Tu opinión nos importa</h3>
                  <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                </div>
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div>
                    <label className={labelBaseClass}>Calificación General</label>
                    <select 
                      value={feedback.experience}
                      onChange={(e) => setFeedback({...feedback, experience: e.target.value})}
                      className={inputBaseClass}
                    >
                      <option>Excelente</option>
                      <option>Buena</option>
                      <option>Regular</option>
                      <option>Pobre</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelBaseClass}>Facilidad de uso</label>
                    <select 
                      value={feedback.ease}
                      onChange={(e) => setFeedback({...feedback, ease: e.target.value})}
                      className={inputBaseClass}
                    >
                      <option>Muy fácil</option>
                      <option>Fácil</option>
                      <option>Neutral</option>
                      <option>Difícil</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelBaseClass}>Sugerencias de mejora</label>
                    <textarea 
                      value={feedback.suggestions}
                      onChange={(e) => setFeedback({...feedback, suggestions: e.target.value})}
                      className={inputBaseClass + " min-h-[100px] py-3"}
                      placeholder="¿Cómo podríamos mejorar?"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelBaseClass}>Probabilidad de recomendación (0-10)</label>
                    <input 
                      type="range" min="0" max="10" step="1"
                      value={feedback.recommendation}
                      onChange={(e) => setFeedback({...feedback, recommendation: Number(e.target.value)})}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      <span>Nunca</span>
                      <span className="text-indigo-600 text-sm">{feedback.recommendation}</span>
                      <span>Seguro</span>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSendingFeedback}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingFeedback ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Enviando...
                      </>
                    ) : (
                      "Enviar Feedback"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AGRADECIMIENTO POST-PDF */}
      {showThanksModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-900/60 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl p-10 max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">¡Reporte Generado!</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Gracias por usar nuestro servicio de cálculo impositivo. Si esta herramienta le ha sido de utilidad, por favor considere realizar una donación para mantener el servidor y las actualizaciones legales.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  window.open('https://cafecito.app/mexxtz', '_blank');
                  setShowThanksModal(false);
                }}
                className="w-full bg-amber-500 text-amber-950 py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                Contribuir con una donación
              </button>
              <button 
                onClick={() => setShowThanksModal(false)}
                className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ESCALAS */}
      {showScaleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.5)] w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Alícuotas Art. 94</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Tabla Oficial Período {inputs.period}</p>
              </div>
              <button onClick={() => setShowScaleModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="overflow-hidden border border-slate-100 rounded-[24px] shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-5">Esc.</th>
                      <th className="px-6 py-5">Excedente Desde ($)</th>
                      <th className="px-6 py-5">Cuota Fija ($)</th>
                      <th className="px-6 py-5 text-right">% Marg.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentScales.map((entry, idx) => (
                      <tr key={idx} className={`transition-colors ${currentScaleStep.stepNumber === idx + 1 ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-5 font-mono text-sm text-slate-700">{Math.round(entry.lowerBound * factor).toLocaleString()}</td>
                        <td className="px-6 py-5 font-mono text-sm text-slate-700">{Math.round(entry.fixedCharge * factor).toLocaleString()}</td>
                        <td className="px-6 py-5 text-right font-black text-slate-900 text-base">{(entry.rate * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
              <button onClick={() => setShowScaleModal(false)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-xl">Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* PLANTILLA DE REPORTE PDF (OCULTA) */}
      <div className="fixed left-[-9999px] top-0 w-[210mm] bg-white text-slate-900 p-[20mm]" ref={pdfReportRef}>
        <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Liquidación de Ganancias</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Reporte Técnico de Retención Mensual</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-slate-900">{MONTHS[inputs.month-1]} {inputs.period}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ARCA (Ex-AFIP) Ley 27.743</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen de Haberes</p>
              <div className="space-y-3">
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-medium text-slate-600">Sueldo Bruto</span>
                    <span className="text-sm font-bold">$ {inputs.grossSalary.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-sm font-medium text-slate-600">Neto Pre-Impuesto</span>
                    <span className="text-sm font-bold">$ {Math.round(result.netMonthlyPreTax).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-rose-600 pt-2">
                    <span className="text-sm font-black uppercase">Retención Ganancias</span>
                    <span className="text-sm font-black">$ {Math.round(result.monthlyTax).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-emerald-600 pt-4 border-t-2 border-slate-200">
                    <span className="text-base font-black uppercase">Sueldo de Bolsillo</span>
                    <span className="text-base font-black">$ {Math.round(result.netMonthlyPostTax).toLocaleString()}</span>
                 </div>
              </div>
           </div>
           
           <div className="p-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Datos del Contribuyente</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                 <p><span className="text-slate-400 font-bold uppercase mr-2">Condición:</span> {inputs.isIndependent ? 'Autónomo' : 'Relación de Dependencia'}</p>
                 <p><span className="text-slate-400 font-bold uppercase mr-2">Cargas Familia:</span> {inputs.deductions.children + (inputs.deductions.spouse ? 1 : 0)} persona(s)</p>
                 <p><span className="text-slate-400 font-bold uppercase mr-2">Tramo Alícuota:</span> {(currentScaleStep.rate * 100).toFixed(0)}%</p>
                 <p><span className="text-slate-400 font-bold uppercase mr-2">Tasa Efectiva:</span> {((result.monthlyTax / (result.grossMonthly || 1)) * 100).toFixed(2)}%</p>
              </div>
           </div>
        </div>

        <div className="mb-12">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 border-l-4 border-indigo-600 pl-4">Detalle de Deducciones Acumuladas</h3>
           <table className="w-full text-left border-collapse text-xs">
              <thead>
                 <tr className="bg-slate-900 text-white font-bold uppercase tracking-widest">
                    <th className="p-4 rounded-tl-xl">Concepto</th>
                    <th className="p-4 text-right rounded-tr-xl">Monto Acumulado ($)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100">
                 <tr><td className="p-4 font-medium">Ganancia No Imponible (MNI)</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.baseDeduction).toLocaleString()}</td></tr>
                 <tr><td className="p-4 font-medium">Deducción Especial (Inc. c)</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.specialDeduction).toLocaleString()}</td></tr>
                 {result.breakdown.spouseAmount > 0 && <tr><td className="p-4 font-medium">Carga: Cónyuge / Conviviente</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.spouseAmount).toLocaleString()}</td></tr>}
                 {result.breakdown.childrenAmount > 0 && <tr><td className="p-4 font-medium">Carga: Hijos / Hijastros</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.childrenAmount).toLocaleString()}</td></tr>}
                 {result.breakdown.medicalInsuranceAmount > 0 && <tr><td className="p-4 font-medium">Medicina Prepaga</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.medicalInsuranceAmount).toLocaleString()}</td></tr>}
                 {result.breakdown.rentAmount > 0 && <tr><td className="p-4 font-medium">Alquiler Vivienda (Tope MNI)</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.rentAmount).toLocaleString()}</td></tr>}
                 {result.breakdown.educationAmount > 0 && <tr><td className="p-4 font-medium">Gastos Educativos</td><td className="p-4 text-right font-mono">$ {Math.round(result.breakdown.educationAmount).toLocaleString()}</td></tr>}
                 <tr className="bg-slate-50 font-black">
                    <td className="p-4">TOTAL DEDUCCIONES COMPUTADAS</td>
                    <td className="p-4 text-right font-mono">$ {Math.round(result.totalDeductionsCumulative).toLocaleString()}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Base Imponible Neta Acumulada</p>
                 <p className="text-xl font-mono font-black">$ {Math.round(result.taxableIncomeCumulative).toLocaleString()}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Impuesto a Retener en Recibo</p>
                 <p className="text-4xl font-mono font-black">$ {Math.round(result.monthlyTax).toLocaleString()}</p>
              </div>
           </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase font-black tracking-[0.2em] space-y-2">
           <p>Este documento es una estimación informativa no vinculante.</p>
           <p>Calculadora Ganancias Argentina 🇦🇷 • Generado automáticamente</p>
        </div>
      </div>
    </div>
  );
};

export default App;
