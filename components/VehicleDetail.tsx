import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { ImageZoomModal } from './ImageZoomModal';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  LucideArrowLeft, LucideClipboardCheck, LucideActivity, LucideRefreshCw, 
  LucideImage, LucideMaximize, LucideClock, LucideUserCheck,
  LucideWrench, LucideDollarSign, LucideBuilding2, LucideGlobe, LucideHandshake, 
  LucideTags, LucidePrinter, LucideTimerReset, LucideCalendarDays, 
  LucideCalendar, LucideDatabase, LucideBattery, LucideBriefcase, LucideUser, LucideShieldCheck, 
  LucideFileText, LucideMapPin, LucideTruck, LucidePlus, LucideTrash2,
  LucideNavigation, LucideCrown, LucideAlertTriangle, LucideShieldAlert, LucideShield,
  LucideGauge, LucideHistory, LucideCheckCircle2, LucideZap, LucideAlertCircle, LucideHeartPulse,
  LucideSettings, LucideInfo
} from 'lucide-react';
import { VehicleStatus, UserRole, OwnershipType } from '../types';
import { 
  differenceInDays, parseISO, format, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { VehicleImageManager } from './VehicleImageManager';
import { DocumentationManager } from './DocumentationManager';
import { RegimenPropiedadAdmin } from './RegimenPropiedadAdmin';
import { FichaTecnica } from './FichaTecnica';

export const VehicleDetail = () => {
  const { plate } = useParams();
  const navigate = useNavigate();
  const { vehicles, updateVehicle, deleteVehicle, user, addNotification } = useApp();
  
  const [activeTab, setActiveTab] = useState<'DASH' | 'TECH' | 'ADMON' | 'DOCS' | 'RENTAL' | 'GALLERY' | 'LEASING'>('DASH');
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const vehicle = useMemo(() => vehicles.find(v => v.plate === plate), [vehicles, plate]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const currentDate = format(new Date(), "eeee, d 'de' MMMM", { locale: es });

  const dashMetrics = useMemo(() => {
    if (!vehicle) return null;
    const totalDocs = vehicle.documents?.length || 0;
    const expiredDocs = vehicle.documents?.filter(d => {
        if (!d.expirationDate) return false;
        return differenceInDays(parseISO(d.expirationDate), new Date()) < 0;
    }).length || 0;
    const kmParaService = Math.max(0, vehicle.nextServiceKm - vehicle.currentKm);
    const percMantenimiento = Math.max(0, Math.min(100, (1 - (kmParaService / 10000)) * 100));
    const totalIncidents = vehicle.images?.list?.filter(img => img.category === 'incident').length || 0;
    const criticalIncidents = vehicle.images?.list?.filter(img => img.category === 'incident' && img.incident?.severity === 'critical').length || 0;
    let score = 100;
    if (expiredDocs > 0) score -= 25;
    if (kmParaService < 1000) score -= 20;
    if (criticalIncidents > 0) score -= 40;
    if (totalIncidents > 3) score -= 15;
    return { totalDocs, expiredDocs, kmParaService, percMantenimiento, totalIncidents, criticalIncidents, healthScore: Math.max(0, score) };
  }, [vehicle]);

  const handleDeleteVehicle = () => {
    if (vehicle) {
      deleteVehicle(vehicle.plate);
      addNotification("Unidad eliminada del inventario corporativo", "warning");
      navigate('/vehicles');
    }
  };

  if (!vehicle) return <div className="p-20 text-center font-black uppercase text-slate-300">Unidad no encontrada</div>;

  const tabs = [
    { id: 'DASH', label: 'Resumen', icon: LucideActivity },
    { id: 'TECH', label: 'Técnica', icon: LucideWrench },
    { id: 'ADMON', label: 'Admin', icon: LucideBuilding2 },
    { id: 'DOCS', label: 'Legajos', icon: LucideShieldCheck },
    ...(vehicle.ownership === OwnershipType.RENTED ? [{ id: 'RENTAL', label: 'Renting', icon: LucideHandshake }] : []),
    ...(vehicle.ownership === OwnershipType.LEASING ? [{ id: 'LEASING', label: 'Leasing', icon: LucideFileText }] : []),
    { id: 'GALLERY', label: 'Daños', icon: LucideImage },
  ];

  return (
    <div className="space-y-6 md:space-y-10 animate-fadeIn pb-24 max-w-full">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        title="Eliminar Activo"
        message={`¿Confirma la eliminación total de la unidad ${vehicle.plate}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteVehicle}
        onClose={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <button onClick={() => navigate('/vehicles')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black uppercase text-[9px] tracking-widest group mb-4">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 group-hover:shadow-xl transition-all"><LucideArrowLeft size={16}/></div> ATRÁS
            </button>
            <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[8px] tracking-widest">
                <LucideCalendar size={12} className="text-blue-500"/> {currentDate}
            </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link to={`/checklist?plate=${vehicle.plate}`} className="flex-1 md:flex-none justify-center bg-white text-slate-700 px-4 py-4 rounded-2xl text-[9px] font-black uppercase border border-slate-200 flex items-center gap-2 shadow-sm active:scale-95 transition-all"><LucideClipboardCheck size={16}/> Auditoría</Link>
          <Link to={`/vehicles/${vehicle.plate}/edit`} className="flex-1 md:flex-none justify-center bg-slate-900 text-white px-6 py-4 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl active:scale-95 transition-all"><LucideSettings size={16}/> Editar</Link>
          {isAdmin && (
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="flex-1 md:flex-none justify-center bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl text-[9px] font-black uppercase border border-rose-100 flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <LucideTrash2 size={16}/> Eliminar Unidad
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center overflow-hidden">
            <div className="w-full aspect-video md:aspect-square bg-slate-900 rounded-3xl mb-6 md:mb-8 flex items-center justify-center text-white font-black text-4xl md:text-6xl shadow-3xl overflow-hidden cursor-pointer relative group" onClick={() => vehicle.images.front && setZoomedImage({url: vehicle.images.front, label: 'Frontal'})}>
               {vehicle.images.front ? <img src={vehicle.images.front} className="w-full h-full object-cover" alt="Frontal"/> : <span>{vehicle.plate.substring(0,2)}</span>}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <LucideMaximize size={24}/>
               </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{vehicle.plate}</h1>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] md:text-[9px] mt-2 md:mt-4">{vehicle.make} {vehicle.model}</p>
            
            <div className="mt-6 md:mt-8 w-full p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-inner group">
               <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometraje</p>
               <h3 className="text-2xl md:text-3xl font-black italic text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">{(vehicle.currentKm || 0).toLocaleString()} <span className="text-[10px] uppercase not-italic text-slate-400">KM</span></h3>
            </div>

            <div className={`mt-4 md:mt-6 w-full py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest ${vehicle.status === VehicleStatus.ACTIVE ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-lg`}>
                {vehicle.status}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex gap-4 md:gap-8 border-b border-slate-100 overflow-x-auto custom-scrollbar scroll-smooth whitespace-nowrap pb-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 shrink-0 pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><tab.icon size={14}/> {tab.label}</button>
              ))}
           </div>

           <div className="animate-fadeIn w-full">
             {activeTab === 'DASH' && dashMetrics && (
                <div className="space-y-6 md:space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                     <div className="md:col-span-2 bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10 flex justify-between items-start">
                           <div className="space-y-1 md:space-y-2">
                              <h4 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-blue-400 flex items-center gap-2"><LucideHeartPulse size={20}/> Salud Unidad</h4>
                              <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score de Confiabilidad</p>
                           </div>
                           <div className="text-right">
                              <p className="text-4xl md:text-6xl font-black italic tracking-tighter">{dashMetrics.healthScore}%</p>
                           </div>
                        </div>
                        <div className="relative z-10 mt-8 md:mt-10 space-y-4">
                           <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                              <div className={`h-full rounded-full transition-all duration-1000 ${dashMetrics.healthScore > 80 ? 'bg-emerald-500' : dashMetrics.healthScore > 50 ? 'bg-amber-500' : 'bg-rose-600'}`} style={{width: `${dashMetrics.healthScore}%`}}></div>
                           </div>
                           <div className="flex justify-between items-center text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Mínimo Corp: 75%</span>
                              <span className="text-white">Estado: {dashMetrics.healthScore > 80 ? 'ÓPTIMO' : 'ATENCIÓN'}</span>
                           </div>
                        </div>
                        <LucideShieldCheck className="absolute -right-10 -bottom-10 opacity-5" size={160}/>
                     </div>

                     <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                        <div className={`p-4 md:p-6 rounded-2xl shadow-lg ${dashMetrics.expiredDocs > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                           {dashMetrics.expiredDocs > 0 ? <LucideShieldAlert size={32}/> : <LucideShieldCheck size={32}/>}
                        </div>
                        <div>
                           <h5 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic leading-none">{dashMetrics.expiredDocs > 0 ? 'VENCIDO' : 'AL DÍA'}</h5>
                           <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">Dossier Legal</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                     <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4 md:pb-6">
                           <h4 className="font-black text-slate-800 uppercase italic text-sm md:text-lg flex items-center gap-2"><LucideWrench className="text-indigo-600" size={18}/> Mantenimiento</h4>
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${dashMetrics.kmParaService < 1500 ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                              {dashMetrics.kmParaService < 1500 ? 'URGENTE' : 'OK'}
                           </span>
                        </div>
                        <div>
                            <p className="text-3xl md:text-4xl font-black italic text-slate-800">{dashMetrics.kmParaService.toLocaleString()}</p>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">KMs para el próximo Service</p>
                        </div>
                        <div className="h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${dashMetrics.percMantenimiento > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${dashMetrics.percMantenimiento}%`}}></div>
                        </div>
                     </div>

                     <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4 md:pb-6">
                           <h4 className="font-black text-slate-800 uppercase italic text-sm md:text-lg flex items-center gap-2"><LucideAlertTriangle className="text-amber-500" size={18}/> Incidentes</h4>
                           <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">{dashMetrics.totalIncidents} Total</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 md:p-6 bg-slate-50 rounded-2xl text-center">
                              <p className="text-2xl md:text-3xl font-black text-slate-800">{dashMetrics.totalIncidents}</p>
                              <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mt-1">Registros</p>
                           </div>
                           <div className={`p-4 md:p-6 rounded-2xl text-center border ${dashMetrics.criticalIncidents > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                              <p className={`text-2xl md:text-3xl font-black ${dashMetrics.criticalIncidents > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>{dashMetrics.criticalIncidents}</p>
                              <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mt-1">Críticos</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'DOCS' && <DocumentationManager vehiclePlate={vehicle.plate} />}
             {activeTab === 'GALLERY' && <VehicleImageManager vehicle={vehicle} onUpdate={updateVehicle} />}
             {activeTab === 'TECH' && <FichaTecnica vehicle={vehicle} onSave={updateVehicle} />}
             {activeTab === 'ADMON' && <RegimenPropiedadAdmin vehicle={vehicle} onUpdate={updateVehicle} isAdmin={isAdmin} />}
           </div>
        </div>
      </div>
    </div>
  );
};