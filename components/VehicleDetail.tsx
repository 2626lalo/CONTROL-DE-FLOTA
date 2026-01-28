import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { ImageZoomModal } from './ImageZoomModal';
import { 
  LucideArrowLeft, LucideClipboardCheck, LucideActivity, LucideRefreshCw, LucideCamera, 
  LucideImage, LucideMaximize, LucideClock, LucideUserCheck,
  LucideWrench, LucideDollarSign, LucideBuilding2, LucideGlobe, LucideHandshake, 
  LucideTags, LucidePrinter, LucideTimerReset, LucideCalendarDays, 
  LucideCalendar, LucideDatabase, LucideBattery, LucideBriefcase, LucideUser, LucideShieldCheck, 
  LucideFileText, LucideMapPin, LucideTruck, LucidePlus, LucideTrash2,
  LucideNavigation, LucideCrown, LucideAlertTriangle, LucideShieldAlert, LucideShield,
  LucideGauge, LucideHistory, LucideCheckCircle2, LucideZap, LucideAlertCircle, LucideHeartPulse,
  // Fix: Added missing LucideSettings and LucideInfo imports
  LucideSettings, LucideInfo
} from 'lucide-react';
import { VehicleStatus, UserRole, OwnershipType } from '../types';
import { 
  differenceInDays, parseISO, format, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { VehicleImageManager } from './VehicleImageManager';
import { DocumentationManager } from './DocumentationManager';
import { RegimenPropiedadAdmin } from './RegimenPropiedadAdmin';
import { FichaTecnica } from './FichaTecnica';

export const VehicleDetail = () => {
  const { plate } = useParams();
  const navigate = useNavigate();
  const { vehicles, updateVehicle, user } = useApp();
  
  const [activeTab, setActiveTab] = useState<'DASH' | 'TECH' | 'ADMON' | 'DOCS' | 'RENTAL' | 'GALLERY' | 'LEASING'>('DASH');
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

  const vehicle = useMemo(() => vehicles.find(v => v.plate === plate), [vehicles, plate]);
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
  const currentDate = format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es });

  // --- CÁLCULOS DE DASHBOARD ---
  const dashMetrics = useMemo(() => {
    if (!vehicle) return null;

    // 1. Salud Documental
    const totalDocs = vehicle.documents?.length || 0;
    const expiredDocs = vehicle.documents?.filter(d => {
        if (!d.expirationDate) return false;
        return differenceInDays(parseISO(d.expirationDate), new Date()) < 0;
    }).length || 0;

    // 2. Salud Técnica (Mantenimiento)
    const kmParaService = Math.max(0, vehicle.nextServiceKm - vehicle.currentKm);
    const percMantenimiento = Math.max(0, Math.min(100, (1 - (kmParaService / 10000)) * 100));

    // 3. Novedades / Daños
    const totalIncidents = vehicle.images?.list?.filter(img => img.category === 'incident').length || 0;
    const criticalIncidents = vehicle.images?.list?.filter(img => img.category === 'incident' && img.incident?.severity === 'critical').length || 0;

    // 4. Health Score (Ponderado)
    let score = 100;
    if (expiredDocs > 0) score -= 25;
    if (kmParaService < 1000) score -= 20;
    if (criticalIncidents > 0) score -= 40;
    if (totalIncidents > 3) score -= 15;

    return {
        totalDocs,
        expiredDocs,
        kmParaService,
        percMantenimiento,
        totalIncidents,
        criticalIncidents,
        healthScore: Math.max(0, score)
    };
  }, [vehicle]);

  if (!vehicle) return <div className="p-20 text-center font-black uppercase text-slate-300">Unidad no encontrada</div>;

  const tabs = [
    { id: 'DASH', label: 'Dashboard', icon: LucideActivity },
    { id: 'TECH', label: 'Ficha Técnica', icon: LucideWrench },
    { id: 'ADMON', label: 'Administrativo', icon: LucideBuilding2 },
    { id: 'DOCS', label: 'Documentación', icon: LucideShieldCheck },
    ...(vehicle.ownership === OwnershipType.RENTED ? [{ id: 'RENTAL', label: 'Gestión Alquiler', icon: LucideHandshake }] : []),
    ...(vehicle.ownership === OwnershipType.LEASING ? [{ id: 'LEASING', label: 'LEASING Pro', icon: LucideFileText }] : []),
    { id: 'GALLERY', label: 'Imágenes / Daños', icon: LucideImage },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <button onClick={() => navigate('/vehicles')} className="flex items-center gap-3 text-slate-500 hover:text-slate-800 font-black uppercase text-[10px] tracking-widest group mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 group-hover:shadow-xl transition-all"><LucideArrowLeft size={18}/></div> VOLVER A LISTADO
            </button>
            <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                <LucideCalendar size={14} className="text-blue-500"/> Hoy: {currentDate}
            </div>
        </div>
        <div className="flex gap-4">
          <Link to={`/checklist?plate=${vehicle.plate}`} className="bg-white text-slate-700 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase border border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-xl transition-all active:scale-95"><LucideClipboardCheck size={18}/> Inspeccionar</Link>
          <Link to={`/vehicles/${vehicle.plate}/edit`} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase flex items-center gap-3 shadow-2xl hover:bg-blue-600 transition-all active:scale-95"><LucideSettings size={18}/> Editar General</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* SIDEBAR FIJO IZQUIERDO */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center overflow-hidden relative">
            <div className="w-full aspect-square bg-slate-900 rounded-[3rem] mb-8 flex items-center justify-center text-white font-black text-6xl shadow-3xl overflow-hidden cursor-pointer relative group" onClick={() => vehicle.images.front && setZoomedImage({url: vehicle.images.front, label: 'Frontal'})}>
               {vehicle.images.front ? <img src={vehicle.images.front} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Frontal"/> : <span>{vehicle.plate.substring(0,2)}</span>}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <LucideMaximize size={32}/>
               </div>
            </div>
            
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{vehicle.plate}</h1>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] mt-4">{vehicle.make} {vehicle.model}</p>
            
            {/* KILOMETRAJE DESTACADO */}
            <div className="mt-8 w-full p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner group">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometraje Actual</p>
               <h3 className="text-3xl font-black italic text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">{(vehicle.currentKm || 0).toLocaleString()} <span className="text-xs uppercase not-italic text-slate-400">KM</span></h3>
               <div className="flex items-center justify-center gap-2 mt-2">
                  <LucideGauge size={10} className="text-blue-500"/>
                  <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter">Sincronización Activa v13.0</span>
               </div>
            </div>

            <div className={`mt-6 w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest ${vehicle.status === VehicleStatus.ACTIVE ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'} text-white shadow-xl`}>
                {vehicle.status}
            </div>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <div className="lg:col-span-3 space-y-10">
           <div className="flex gap-8 border-b border-slate-100 overflow-x-auto custom-scrollbar pb-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 shrink-0 pb-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><tab.icon size={18}/> {tab.label}</button>
              ))}
           </div>

           <div className="animate-fadeIn">
             {activeTab === 'DASH' && dashMetrics && (
                <div className="space-y-10">
                  {/* FILA 1: SCORE Y DISPONIBILIDAD */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10 flex justify-between items-start">
                           <div className="space-y-2">
                              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-blue-400 flex items-center gap-3"><LucideHeartPulse size={24}/> Salud Operativa de Unidad</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Índice ponderado de confiabilidad de activo</p>
                           </div>
                           <div className="text-right">
                              <p className="text-6xl font-black italic tracking-tighter">{dashMetrics.healthScore}%</p>
                              <p className="text-[9px] font-black text-blue-400 uppercase mt-1">Ready to Operate</p>
                           </div>
                        </div>
                        
                        <div className="relative z-10 mt-10 space-y-4">
                           <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                              <div className={`h-full rounded-full transition-all duration-1000 shadow-lg ${dashMetrics.healthScore > 80 ? 'bg-emerald-500' : dashMetrics.healthScore > 50 ? 'bg-amber-500' : 'bg-rose-600'}`} style={{width: `${dashMetrics.healthScore}%`}}></div>
                           </div>
                           <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Mínimo Corporativo: 75%</span>
                              <span className="text-white italic">Calificación: {dashMetrics.healthScore > 80 ? 'EXCELENTE' : 'REQUIERE ATENCIÓN'}</span>
                           </div>
                        </div>
                        <LucideShieldCheck className="absolute -right-10 -bottom-10 opacity-5" size={260}/>
                     </div>

                     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                        <div className={`p-6 rounded-[2rem] shadow-xl ${dashMetrics.expiredDocs > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {dashMetrics.expiredDocs > 0 ? <LucideShieldAlert size={40}/> : <LucideShieldCheck size={40}/>}
                        </div>
                        <div>
                           <h5 className="text-2xl font-black text-slate-800 uppercase italic leading-none">{dashMetrics.expiredDocs > 0 ? 'VENCIDO' : 'AL DÍA'}</h5>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Estado Legal y Documental</p>
                        </div>
                        <div className="pt-4 border-t w-full">
                           <p className="text-[10px] font-bold text-slate-500 uppercase">{dashMetrics.totalDocs} Legajos Registrados</p>
                        </div>
                     </div>
                  </div>

                  {/* FILA 2: MANTENIMIENTO E INCIDENTES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                           <h4 className="font-black text-slate-800 uppercase italic text-lg flex items-center gap-3"><LucideWrench className="text-indigo-600"/> Ciclo de Mantenimiento</h4>
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${dashMetrics.kmParaService < 1500 ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                              {dashMetrics.kmParaService < 1500 ? 'URGENTE' : 'ESTABLE'}
                           </span>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-4xl font-black italic text-slate-800">{dashMetrics.kmParaService.toLocaleString()}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kms restantes para Service</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-indigo-600 uppercase">Hito: {vehicle.nextServiceKm.toLocaleString()} KM</p>
                              </div>
                           </div>
                           
                           <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${dashMetrics.percMantenimiento > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${dashMetrics.percMantenimiento}%`}}></div>
                           </div>
                        </div>
                        <LucideGauge className="absolute -right-8 -top-8 text-slate-50 opacity-50 group-hover:scale-110 transition-transform" size={160}/>
                     </div>

                     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                           <h4 className="font-black text-slate-800 uppercase italic text-lg flex items-center gap-3"><LucideAlertTriangle className="text-amber-500"/> Siniestralidad y Daños</h4>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dashMetrics.totalIncidents} Registros</span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center group-hover:bg-amber-50 transition-colors">
                              <p className="text-3xl font-black italic text-slate-800">{dashMetrics.totalIncidents}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Novedades</p>
                           </div>
                           <div className={`p-6 rounded-[2rem] border text-center transition-all ${dashMetrics.criticalIncidents > 0 ? 'bg-rose-50 border-rose-200 shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                              <p className={`text-3xl font-black italic ${dashMetrics.criticalIncidents > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-800'}`}>{dashMetrics.criticalIncidents}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Danos Críticos</p>
                           </div>
                        </div>
                        <LucideShieldAlert className="absolute -right-8 -top-8 text-slate-50 opacity-50 group-hover:rotate-12 transition-transform" size={160}/>
                     </div>
                  </div>

                  {/* FILA 3: ALERTAS CRÍTICAS Y RESUMEN PATRIMONIAL */}
                  <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <LucideZap size={16} className="text-blue-500"/> Notificaciones y Alertas del Sistema
                     </h4>
                     <div className="space-y-4">
                        {dashMetrics.healthScore < 100 ? (
                           <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-l-8 border-blue-600 animate-fadeIn">
                              <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><LucideInfo size={24}/></div>
                              <div className="flex-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recomendación Estratégica</p>
                                 <p className="font-bold text-slate-700 text-sm mt-1">
                                    {dashMetrics.healthScore < 60 ? "UNIDAD EN RIESGO: Requiere intervención inmediata del gestor de flota." : "Se detectan desviaciones menores en documentación o mantenimiento preventivo."}
                                 </p>
                              </div>
                              <Link to={dashMetrics.expiredDocs > 0 ? `/vehicles/detail/${vehicle.plate}?tab=DOCS` : `/vehicles/detail/${vehicle.plate}?tab=TECH`} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">Atender</Link>
                           </div>
                        ) : (
                           <div className="py-12 text-center space-y-4">
                              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-lg"><LucideCheckCircle2 size={32}/></div>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Sistema estable. No hay alertas críticas para esta unidad.</p>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'DOCS' && (
                <DocumentationManager vehiclePlate={vehicle.plate} />
             )}
             
             {activeTab === 'GALLERY' && (
                <VehicleImageManager vehicle={vehicle} onUpdate={updateVehicle} />
             )}

             {activeTab === 'TECH' && (
                <FichaTecnica vehicle={vehicle} onSave={updateVehicle} />
             )}

             {activeTab === 'ADMON' && (
                <RegimenPropiedadAdmin vehicle={vehicle} onUpdate={updateVehicle} isAdmin={isAdmin} />
             )}
           </div>
        </div>
      </div>
    </div>
  );
};