import React, { useState, useRef, useEffect } from 'react';
import { 
  LucideFlaskConical, LucideSparkles, LucideTerminal, 
  LucideChevronDown, LucideLayout, LucidePlusCircle,
  LucideFileText, LucideCalendar, LucideDollarSign, LucideTruck,
  LucideSettings, LucideRefreshCw, LucideDownload, LucideInfo,
  LucideZap, LucideShieldAlert, LucideMicroscope, LucideSearch
} from 'lucide-react';

type LabModule = 'NEW_REQ' | 'REQ_LIST' | 'RESERVATION' | 'BUDGETS' | 'PROVIDERS' | 'EMPTY';

interface ModuleItem {
  id: LabModule;
  label: string;
  icon: any;
  desc: string;
}

interface ModuleGroup {
  name: string;
  items: ModuleItem[];
}

export const TestSector = () => {
  const [activeModule, setActiveModule] = useState<LabModule>('NEW_REQ');
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  
  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(event.target as Node)) {
        setIsModuleMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const moduleGroups: ModuleGroup[] = [
    {
      name: 'Nuevo Evento',
      items: [
        { id: 'NEW_REQ', label: 'Nueva Solicitud de Mantenimiento', icon: LucidePlusCircle, desc: 'Apertura de nuevo caso técnico.' },
      ]
    },
    {
      name: 'Eventos',
      items: [
        { id: 'REQ_LIST', label: 'Solicitud de Mantenimiento', icon: LucideFileText, desc: 'Listado de solicitudes activas.' },
        { id: 'RESERVATION', label: 'Reserva de Turno', icon: LucideCalendar, desc: 'Gestión de agenda de talleres.' },
        { id: 'BUDGETS', label: 'Presupuestos', icon: LucideDollarSign, desc: 'Control de cotizaciones y auditoría.' },
        { id: 'PROVIDERS', label: 'Proveedores', icon: LucideTruck, desc: 'Directorio de talleres homologados.' },
      ]
    }
  ];

  const flatModules = moduleGroups.flatMap(g => g.items);
  const currentModule = flatModules.find(m => m.id === activeModule) || { label: 'Seleccionar Módulo', icon: LucideLayout };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Cabecera del Laboratorio con Título Actualizado */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative z-[100]">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
               <LucideFlaskConical size={20}/>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Laboratorio de Innovación Técnica</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none text-blue-600">Gestión de Servicios</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          {/* MENÚ 1: SELECTOR DE MÓDULO ESTRUCTURADO */}
          <div className="relative flex-1 md:w-80" ref={moduleMenuRef}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 italic">Selector de Módulo</p>
            <button 
              onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
              className="w-full bg-slate-900 text-white px-8 py-5 rounded-[2rem] flex items-center justify-between font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-slate-800 transition-all group border border-white/5"
            >
              <div className="flex items-center gap-3">
                <currentModule.icon className="text-blue-400" size={20}/>
                <span>{currentModule.label}</span>
              </div>
              <LucideChevronDown className={`transition-transform duration-300 ${isModuleMenuOpen ? 'rotate-180' : ''}`} size={20}/>
            </button>

            {isModuleMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 border border-slate-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden animate-fadeIn backdrop-blur-xl max-h-[70vh] overflow-y-auto custom-scrollbar">
                {moduleGroups.map((group, gIdx) => (
                  <div key={gIdx} className="p-2">
                    <div className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 mb-1">
                      {group.name}
                    </div>
                    {group.items.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setActiveModule(m.id); setIsModuleMenuOpen(false); }}
                        className={`w-full flex items-start gap-4 p-5 rounded-[1.8rem] transition-all text-left ${activeModule === m.id ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-500'}`}
                      >
                        <div className={`p-3 rounded-xl ${activeModule === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <m.icon size={20}/>
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-tighter">{m.label}</p>
                          <p className="text-[9px] font-bold opacity-60 mt-1">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MENÚ 2: HERRAMIENTAS TÉCNICAS */}
          <div className="relative flex-1 md:w-64" ref={toolsMenuRef}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 italic">Herramientas Diagnóstico</p>
            <button 
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="w-full bg-white text-slate-800 px-8 py-5 rounded-[2rem] flex items-center justify-between font-black uppercase text-[11px] tracking-widest shadow-xl border border-slate-100 hover:border-indigo-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <LucideSettings className="text-indigo-600" size={20}/>
                <span>Acciones</span>
              </div>
              <LucideChevronDown className={`transition-transform duration-300 ${isToolsMenuOpen ? 'rotate-180' : ''}`} size={20}/>
            </button>

            {isToolsMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn text-white">
                <div className="p-3 space-y-1">
                   <button 
                     className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                   >
                     <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                        <LucideRefreshCw size={16}/>
                     </div>
                     <span className="font-black text-[10px] uppercase tracking-widest">Sincronizar Datos</span>
                   </button>
                   <div className="h-px bg-white/5 my-2"></div>
                   <button 
                     className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-all text-left"
                   >
                     <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
                        <LucideDownload size={16}/>
                     </div>
                     <span className="font-black text-[10px] uppercase tracking-widest">Exportar Vista</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDERIZADO DINÁMICO DE MÓDULOS */}
      <div className="min-h-[600px] transition-all duration-500">
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl p-16 flex flex-col items-center justify-center text-center space-y-10 animate-fadeIn relative overflow-hidden group">
            <div className="relative z-10">
                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 bg-slate-900 text-blue-400`}>
                    <currentModule.icon size={56}/>
                </div>
                <h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter mb-4">{currentModule.label}</h2>
                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                   Módulo experimental en fase de prototipado para la sección de <span className="text-blue-600 font-black italic">{currentModule.label}</span>. 
                   Esta interfaz permite validar flujos de trabajo antes de su implementación en el núcleo de la aplicación.
                </p>
                <div className="flex justify-center gap-4 mt-12">
                   <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                      Iniciar Protocolo
                   </button>
                   <button className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all">
                      Ver Documentación
                   </button>
                </div>
            </div>
            
            {/* Decoración de fondo */}
            <div className="absolute -bottom-20 -right-20 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform duration-1000">
                <currentModule.icon size={400}/>
            </div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
      </div>

      {/* Footer del Laboratorio */}
      <div className="p-8 bg-indigo-900 text-white rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-inner"><LucideInfo size={24}/></div>
            <div>
               <p className="text-xs font-black uppercase italic text-indigo-300">Protocolo de Validación Experimental</p>
               <p className="text-[10px] font-medium leading-relaxed max-w-xl text-indigo-100/60 mt-1">
                 Los cambios realizados en el "Sector de Pruebas" no afectan a la base de datos operativa de la flota hasta que se solicite explícitamente su integración en el menú principal.
               </p>
            </div>
         </div>
         <button className="relative z-10 px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-400 hover:text-white transition-all transform active:scale-95">
            Solicitar Integración Main-App
         </button>
         <LucideSparkles className="absolute -bottom-20 -right-20 text-white opacity-5 group-hover:scale-110 transition-transform duration-1000" size={300}/>
      </div>
    </div>
  );
};