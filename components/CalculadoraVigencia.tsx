
import React, { useState, useEffect } from 'react';
import { LucideCalculator, LucideCalendar, LucideClock, LucideAlertTriangle, LucideCheck, LucideX } from 'lucide-react';

interface Props {
  añoActual: number;
  onCalculoCompletado: (data: {
    añoFabricacion: number;
    añosVidaUtil: number;
    fechaVencimiento: string;
    diasRestantes: number;
    añosRestantes: number;
  }) => void;
  onCancelar: () => void;
}

export const CalculadoraVigencia: React.FC<Props> = ({ añoActual, onCalculoCompletado, onCancelar }) => {
  const [añoFabricacion, setAñoFabricacion] = useState(añoActual);
  const [añosVidaUtil, setAñosVidaUtil] = useState(10);
  const [resultados, setResultados] = useState<any>(null);

  const getVigenciaSugerida = (año: number): number => {
    const antiguedad = new Date().getFullYear() - año;
    if (antiguedad <= 3) return 10;
    if (antiguedad <= 5) return 8;
    if (antiguedad <= 10) return 5;
    return 3;
  };

  useEffect(() => {
    const hoy = new Date();
    const vSugerida = getVigenciaSugerida(añoFabricacion);
    const fechaVencimiento = new Date(añoFabricacion + vSugerida, 11, 31);
    const diff = fechaVencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const años = Math.max(0, parseFloat((diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));

    setResultados({
      añoFabricacion,
      añosVidaUtil: vSugerida,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      diasRestantes: dias,
      añosRestantes: años,
      estado: dias < 0 ? 'vencido' : dias <= 180 ? 'por_vencer' : 'vigente'
    });
  }, [añoFabricacion]);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <LucideCalculator size={32}/>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Calculadora de Ciclo de Vida</h2>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Proyección de Vigencia Operativa</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-2 hover:bg-white/10 rounded-full transition-all"><LucideX/></button>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Año de Fabricación</label>
              <div className="flex items-center gap-4">
                 <input type="range" min="2000" max={new Date().getFullYear() + 1} value={añoFabricacion} onChange={(e) => setAñoFabricacion(parseInt(e.target.value))} className="flex-1 accent-blue-600" />
                 <span className="text-3xl font-black text-slate-800">{añoFabricacion}</span>
              </div>
            </div>

            {resultados && (
              <div className={`p-6 rounded-[2rem] border ${resultados.estado === 'vigente' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                <div className="flex items-center gap-3 mb-2 font-black uppercase text-xs">
                  <LucideAlertTriangle size={18}/>
                  {resultados.estado === 'vigente' ? 'Unidad Operativa' : 'Requiere Renovación'}
                </div>
                <p className="text-[10px] font-bold">Según estándares corporativos, esta unidad tiene una vigencia sugerida de {resultados.añosVidaUtil} años.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {resultados && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <p className="text-3xl font-black text-blue-600 leading-none">{resultados.diasRestantes}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Días Restantes</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <p className="text-3xl font-black text-emerald-600 leading-none">{resultados.añosRestantes}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Años de Vida</p>
                </div>
                <div className="col-span-2 bg-slate-900 p-6 rounded-3xl text-center text-white">
                  <p className="text-xl font-black tracking-tighter uppercase italic">{resultados.fechaVencimiento}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase mt-2">Fecha Vencimiento Sugerida</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t flex gap-4">
          <button onClick={onCancelar} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Descartar</button>
          <button onClick={() => onCalculoCompletado(resultados)} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
            <LucideCheck size={18}/> Aplicar Proyección Técnico-Admin
          </button>
        </div>
      </div>
    </div>
  );
};
