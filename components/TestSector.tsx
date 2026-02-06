import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LucidePlusCircle, LucideCar, LucideSearch, LucideChevronRight, 
  LucideArrowLeft, LucideTrash2, LucideMessageCircle, 
  LucideMapPin, LucideCamera, LucideSend, LucideInfo, 
  LucideAlertTriangle, LucideZap, LucideShield, 
  LucideTimer, LucideChevronDown, LucideX, LucideDatabase, LucideEye, 
  LucideLock, LucideBuilding2, LucideUser, LucideFileText,
  LucidePaperclip, LucideCheckCircle2, 
  LucideMail, LucideSmartphone, LucideWrench, LucideShoppingBag,
  LucideArrowRight, LucideRefreshCcw, LucideFileUp,
  LucideHistory, LucideDownload, LucideCalendarDays, LucideLockKeyhole,
  LucideCheck, LucideMessageSquare, LucideShieldAlert, LucideShieldCheck,
  LucideChevronUp, LucideChevronsUpDown, LucideListFilter, LucideCalendar,
  LucideClock, LucideMapPinCheck, LucideLocate, LucideExternalLink, LucideNavigation2,
  LucideFilePlus, LucideFileSpreadsheet, LucideFileWarning,
  LucideClipboardList, LucideAlertCircle, LucideFileDown, LucideFileSearch,
  LucideBriefcase, LucideDollarSign, LucidePlus, LucideFile,
  LucideRefreshCw, LucideGauge, LucideUnlock, LucideNavigation
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { 
    ServiceStage, ServiceRequest, UserRole, MainServiceCategory, 
    SuggestedDate, ServiceMessage, Checklist, Vehicle
} from '../types';
import { format, parseISO, isBefore, startOfDay, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ImageZoomModal } from './ImageZoomModal';
import { compressImage } from '../utils/imageCompressor'; 

type ViewMode = 'DASHBOARD' | 'NEW_REQUEST' | 'DETAIL' | 'ASSIGN_TURN';

// --- COMPONENTE CONTADOR ---
const TurnCountdown = ({ date, time }: { date: string, time: string }) => {
    const calculateTime = () => {
        try {
            const turnDateTime = parseISO(`${date}T${time || '00:00'}`);
            const now = new Date();
            const diffMs = turnDateTime.getTime() - now.getTime();
            
            if (diffMs < 0) return { label: 'TURNO PASADO', color: 'text-slate-400' };
            
            const days = differenceInDays(turnDateTime, now);
            const hours = differenceInHours(turnDateTime, now) % 24;

            if (days === 0) return { label: `EL TURNO ES HOY (Faltan ${hours} hs)`, color: 'text-rose-500 animate-pulse' };
            return { label: `FALTAN ${days} DÍAS Y ${hours} HORAS`, color: 'text-emerald-500' };
        } catch {
            return { label: 'FECHA NO VÁLIDA', color: 'text-slate-300' };
        }
    };

    const res = calculateTime();
    return <span className={`text-[10px] font-black uppercase tracking-widest ${res.color}`}>{res.label}</span>;
};

export const TestSector = () => {
  const { vehicles, user, serviceRequests, addServiceRequest, updateServiceRequest, addNotification, updateServiceStage } = useApp();
  const navigate = useNavigate();
  
  const userRole = user?.role || UserRole.USER;
  const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
  const isSupervisorOrAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR;
  const isReadOnly = userRole === UserRole.AUDITOR;
  const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== "";

  const [activeView, setActiveView] = useState<ViewMode>('DASHBOARD');
  const [requestStep, setRequestStep] = useState(1); 
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mainCategory, setMainCategory] = useState<MainServiceCategory>('MANTENIMIENTO');
  const [specificType, setSpecificType] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [chatMessage, setChatMessage] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishComment, setFinishComment] = useState('');
  const [selectedStageToTransition, setSelectedStageToTransition] = useState<ServiceStage | ''>('');

  const [turnDate, setTurnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turnTime, setTurnTime] = useState('09:00');
  const [workshopName, setWorkshopName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [turnComments, setTurnComments] = useState('');

  const currentRequest = useMemo(() => 
    serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]
  );

  const requestVehicle = useMemo(() => 
    vehicles.find(v => v.plate === currentRequest?.vehiclePlate), [vehicles, currentRequest]
  );

  const specificOptions = useMemo(() => {
    if (mainCategory === 'MANTENIMIENTO') return ['CORRECTIVO', 'PREVENTIVO', 'CORRECTIVO-CONCESIONARIO OFICIAL'];
    if (mainCategory === 'COMPRAS') return ['COMPRA DE COMPONENTES', 'COMPRA DE ACCESORIOS'];
    if (mainCategory === 'SERVICIO') return ['ALQUILER', 'ASISTENCIA MÓVIL', 'DESINFECCIÓN', 'GESTORA', 'GOMERÍA', 'GPS', 'LAVADO', 'LOGÍSTICA', 'SEGURO', 'SINIESTRO', 'VTV', 'INFRACCIONES', 'TRASLADO'];
    return [];
  }, [mainCategory]);

  const filteredRequests = useMemo(() => {
    return serviceRequests.filter(r => {
        if (!isSupervisorOrAdmin && !isReadOnly) {
            return (r.costCenter || '').toUpperCase() === userCC;
        }
        return true;
    }).filter(r => r.vehiclePlate.includes(searchQuery.toUpperCase()));
  }, [serviceRequests, searchQuery, isSupervisorOrAdmin, isReadOnly, userCC]);

  const startNewRequest = () => {
    setSearchQuery('');
    setSelectedVehicle(null);
    setRequestStep(1);
    setMainCategory('MANTENIMIENTO');
    setSpecificType('');
    setDescriptionValue('');
    setLocation('');
    setAttachments([]);
    setErrors({});
    setActiveView('NEW_REQUEST');
  };

  const handleOpenDetail = (req: ServiceRequest) => {
    setSelectedReqId(req.id);
    setActiveView('DETAIL');
    if (userRole === UserRole.USER && (req.unreadUserCount || 0) > 0) {
        updateServiceRequest({ ...req, unreadUserCount: 0 });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    for (const file of files) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            let finalUrl = reader.result as string;
            if (isImage) finalUrl = await compressImage(finalUrl);
            setAttachments(prev => [...prev, {
                id: `FILE-${Date.now()}-${Math.random()}`,
                name: file.name,
                url: finalUrl,
                type: file.type,
                isImage
            }]);
        };
        reader.readAsDataURL(file);
    }
  };

  const validateAndSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!selectedVehicle) newErrors.vehicle = true;
    if (!specificType) newErrors.type = true;
    if (!descriptionValue.trim()) newErrors.description = true;
    if (!location.trim()) newErrors.location = true; 
    if (odometer < (selectedVehicle?.currentKm || 0)) newErrors.odometer = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        const firstErrorKey = Object.keys(newErrors)[0];
        const element = document.getElementById(`field-${firstErrorKey}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        addNotification("Complete todos los campos requeridos marcados en rojo", "error");
        return;
    }

    setIsSubmitting(true);
    const newRequest: ServiceRequest = {
        id: `SR-${Date.now()}`,
        code: `EV-${Math.floor(10000 + Math.random() * 90000)}`,
        vehiclePlate: selectedVehicle!.plate,
        userId: user?.id || 'sys',
        userName: `${user?.nombre || ''} ${user?.apellido || ''}`.trim(),
        userEmail: user?.email || '',
        userPhone: user?.telefono || '',
        costCenter: selectedVehicle!.costCenter || 'S/A',
        stage: ServiceStage.REQUESTED,
        mainCategory,
        specificType,
        description: descriptionValue,
        location,
        odometerAtRequest: odometer,
        suggestedDates: [],
        priority: 'MEDIA',
        attachments: attachments.map(a => ({ name: a.name, url: a.url, type: a.type })),
        isDialogueOpen: false,
        messages: [],
        budgets: [],
        history: [{ id: `H-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'sys', userName: user?.nombre || 'Solicitante', toStage: ServiceStage.REQUESTED, comment: 'Solicitud iniciada.' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    addServiceRequest(newRequest);
    addNotification("Gestión enviada correctamente", "success");
    setActiveView('DASHBOARD');
    setIsSubmitting(false);
  };

  const handleGetDirections = (address: string) => {
    if (!address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleConfirmStageTransition = () => {
    if (!currentRequest || !selectedStageToTransition) return;
    if (selectedStageToTransition === ServiceStage.SCHEDULING) {
        setActiveView('ASSIGN_TURN');
        return;
    }
    if (selectedStageToTransition === currentRequest.stage) return;
    updateServiceStage(currentRequest.id, selectedStageToTransition as ServiceStage, `Cambio de estado manual a: ${selectedStageToTransition}`);
    addNotification(`Estado actualizado a ${selectedStageToTransition}`, "success");
  };

  const handleConfirmTurnAssignment = () => {
    if (!currentRequest || !isSupervisorOrAdmin) return;
    const today = startOfDay(new Date());
    const selDate = startOfDay(parseISO(turnDate));
    if (isBefore(selDate, today)) {
        addNotification("La fecha de turno no puede ser anterior a hoy", "error");
        return;
    }
    const turnData: SuggestedDate = {
        id: `TURN-${Date.now()}`, fecha: turnDate, hora: turnTime, turno: 'MAÑANA',
        nombreTaller: workshopName, direccionTaller: workshopAddress,
        comentarios: turnComments
    };
    updateServiceRequest({
        ...currentRequest,
        stage: ServiceStage.SCHEDULING,
        suggestedDates: [turnData],
        updatedAt: new Date().toISOString(),
        history: [...(currentRequest.history || []), { 
            id: `HIST-${Date.now()}`, 
            date: new Date().toISOString(), 
            userId: user?.id || 'sys', 
            userName: user?.nombre || 'Supervisor', 
            fromStage: currentRequest.stage, 
            toStage: ServiceStage.SCHEDULING, 
            comment: `Turno asignado: ${workshopName} (${turnTime}hs).` 
        }]
    });
    addNotification("Turno agendado y notificado al chofer", "success");
    setActiveView('DETAIL');
  };

  const handleConfirmFinish = () => {
    if (!currentRequest || !finishComment.trim()) return;
    updateServiceStage(currentRequest.id, ServiceStage.FINISHED, finishComment);
    addNotification("Gestión finalizada exitosamente", "success");
    setIsFinishing(false);
    setFinishComment('');
  };

  const getStageBadgeStyles = (stage: ServiceStage) => {
    switch (stage) {
      case ServiceStage.FINISHED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ServiceStage.CANCELLED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case ServiceStage.SCHEDULING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ServiceStage.REQUESTED: return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentRequest || isReadOnly) return;
    const msg: ServiceMessage = {
        id: Date.now().toString(),
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Usuario',
        text: chatMessage,
        timestamp: new Date().toISOString(),
        role: userRole
    };
    const isFromAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR;
    updateServiceRequest({
        ...currentRequest,
        messages: [...(currentRequest.messages || []), msg],
        unreadUserCount: isFromAdmin ? (currentRequest.unreadUserCount || 0) + 1 : 0
    });
    setChatMessage('');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12">
        {activeView === 'DASHBOARD' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-200 pb-8">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl border-4 border-white overflow-hidden">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <LucideUser size={40}/>}
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{user?.nombre} {user?.apellido}</h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                        <LucideShieldCheck size={14} className="text-blue-600"/> Centro de Costo: {userCC}
                    </p>
                  </div>
               </div>
               {!isReadOnly && (
                 <button onClick={startNewRequest} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                    <LucidePlusCircle size={22}/> Nueva Gestión de Unidad
                 </button>
               )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest italic">Mesa de Control de Servicios</h3>
                    <div className="flex gap-4">
                        <div className="relative">
                            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input type="text" placeholder="Filtrar por Patente..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/10">
                                <th className="px-8 py-6">Evento</th>
                                <th className="px-8 py-6">Unidad</th>
                                <th className="px-8 py-6">Tipo Gestión</th>
                                <th className="px-8 py-6">Fecha</th>
                                <th className="px-8 py-6">Situación Actual</th>
                                <th className="px-8 py-6 text-right">Canal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.map(req => (
                                <tr key={req.id} onClick={() => handleOpenDetail(req)} className="group hover:bg-blue-50/50 transition-all cursor-pointer">
                                    <td className="px-8 py-6"><span className="text-sm font-black text-slate-700 italic">{req.code}</span></td>
                                    <td className="px-8 py-6"><span className="text-sm font-black text-slate-700 uppercase">{req.vehiclePlate}</span></td>
                                    <td className="px-8 py-6"><span className="text-[10px] font-black text-slate-500 uppercase">{req.specificType}</span></td>
                                    <td className="px-8 py-6"><span className="text-xs font-bold text-slate-400">{format(parseISO(req.createdAt), 'dd/MM/yy')}</span></td>
                                    <td className="px-8 py-6">
                                        <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStageBadgeStyles(req.stage)}`}>{req.stage}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {req.isDialogueOpen && (
                                                <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${(req.unreadUserCount || 0) > 0 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-blue-500 shadow-blue-200'}`}></div>
                                            )}
                                            <LucideChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all"/>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {activeView === 'NEW_REQUEST' && (
            <div className={`grid grid-cols-1 ${requestStep === 2 ? 'lg:grid-cols-12' : 'max-w-3xl mx-auto'} gap-10 animate-fadeIn`}>
                <div className={`${requestStep === 2 ? 'lg:col-span-8' : 'w-full'} space-y-8`}>
                    <div className="flex items-center gap-6 mb-4">
                        <button onClick={() => setActiveView('DASHBOARD')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={24}/></button>
                        <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Nueva Gestión Técnica</h2>
                    </div>

                    {requestStep === 1 ? (
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-fadeIn">
                            <div className="space-y-4 relative" id="field-vehicle">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Vincular Unidad (Patente)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="ESCRIBIR PATENTE..." 
                                        className={`w-full px-8 py-6 bg-slate-50 border-2 rounded-[2rem] font-black text-3xl uppercase outline-none transition-all ${errors.vehicle ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100 focus:ring-8 focus:ring-blue-50'}`}
                                        value={searchQuery} 
                                        onChange={e => { setSearchQuery(e.target.value.toUpperCase()); setShowSuggestions(true); setSelectedVehicle(null); }} 
                                        onFocus={() => setShowSuggestions(true)}
                                    />
                                    {showSuggestions && !selectedVehicle && vehicles.filter(v => (isSupervisorOrAdmin || v.costCenter.toUpperCase() === userCC) && v.plate.includes(searchQuery)).slice(0, 5).map(v => (
                                        <div key={v.plate} onClick={() => { setSelectedVehicle(v); setOdometer(v.currentKm); setSearchQuery(v.plate); setShowSuggestions(false); }} className="p-6 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-50">
                                            <span className="font-black text-2xl italic text-slate-800 uppercase">{v.plate}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{v.make} {v.model}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedVehicle && (
                                <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl animate-fadeIn space-y-6 relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Confirmación de Unidad</p>
                                            <h3 className="text-5xl font-black italic tracking-tighter uppercase mt-2">{selectedVehicle.plate}</h3>
                                            <p className="text-sm font-bold uppercase mt-2">{selectedVehicle.make} {selectedVehicle.model}</p>
                                        </div>
                                        <button onClick={() => { setSelectedVehicle(null); setSearchQuery(''); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-[9px] font-black uppercase">
                                            <LucideRefreshCw size={14}/> Cambiar Unidad
                                        </button>
                                    </div>
                                    <button onClick={() => setRequestStep(2)} className="w-full py-6 bg-white text-blue-600 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 relative z-10">
                                        Continuar <LucideArrowRight size={20}/>
                                    </button>
                                    <LucideCar className="absolute -right-12 -bottom-12 opacity-10" size={240}/>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-fadeIn">
                            <div className="flex gap-4 p-2 bg-slate-100 rounded-[2rem]">
                                {['MANTENIMIENTO', 'SERVICIO', 'COMPRAS'].map((cat) => (
                                    <button key={cat} onClick={() => { setMainCategory(cat as any); setSpecificType(''); }} className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 ${mainCategory === cat ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {cat === 'MANTENIMIENTO' ? <LucideWrench size={20}/> : cat === 'SERVICIO' ? <LucideSmartphone size={20}/> : <LucideShoppingBag size={20}/>}
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2" id="field-type">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo Específico</label>
                                    <select className={`w-full px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase outline-none transition-all ${errors.type ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} value={specificType} onChange={e => setSpecificType(e.target.value)}>
                                        <option value="">ELIJA UNA OPCIÓN...</option>
                                        {specificOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2" id="field-odometer">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje Actual</label>
                                    <div className={`flex items-center px-6 py-4 rounded-2xl border-2 transition-all ${errors.odometer ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-blue-500'}`}>
                                        <input type="number" onFocus={(e) => e.target.select()} className="w-full font-black text-xl bg-transparent outline-none text-blue-600" value={odometer || ''} onChange={e => setOdometer(Number(e.target.value))} />
                                        <LucideGauge className="text-slate-300" size={20}/>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2" id="field-description">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción de la Necesidad</label>
                                <textarea rows={4} className={`w-full p-8 rounded-3xl border-2 font-bold text-sm outline-none transition-all resize-none shadow-inner ${errors.description ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} placeholder="Detalle el requerimiento..." value={descriptionValue} onChange={e => setDescriptionValue(e.target.value)} />
                            </div>
                            <div className="space-y-2" id="field-location">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación / Localidad (Requerido)</label>
                                <input className={`w-full px-6 py-4 rounded-2xl border-2 font-bold text-xs uppercase outline-none transition-all ${errors.location ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} placeholder="¿DÓNDE SE ENCUENTRA EL VEHÍCULO?" value={location} onChange={e => setLocation(e.target.value.toUpperCase())} />
                            </div>
                            <div className="pt-8 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setRequestStep(1)} className="px-8 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">Atrás</button>
                                <button onClick={validateAndSubmit} disabled={isSubmitting} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                    {isSubmitting ? <LucideRefreshCcw className="animate-spin" size={24}/> : <LucideSend size={24}/>} 
                                    Enviar Solicitud de Gestión
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {requestStep === 2 && (
                    <div className="lg:col-span-4 space-y-8 animate-fadeIn">
                         <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
                            <div className="space-y-6 pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><LucideUser size={24}/></div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Solicitante Activo</p>
                                        <p className="text-sm font-black text-slate-800 uppercase italic">{user?.nombre} {user?.apellido}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500"><LucideMail size={14}/><p className="text-[10px] font-bold">{user?.email}</p></div>
                                    <div className="flex items-center gap-3 text-slate-500"><LucideSmartphone size={14}/><p className="text-[10px] font-bold">{user?.telefono || 'S/T'}</p></div>
                                    <div className="flex items-center gap-3 text-slate-500"><LucideBuilding2 size={14}/><p className="text-[10px] font-bold">{userCC}</p></div>
                                </div>
                            </div>
                            {selectedVehicle && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><LucideCar size={14}/> Ficha Unidad</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Patente</span>
                                            <span className="text-[10px] font-bold text-slate-700 uppercase">{selectedVehicle.plate}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Modelo</span>
                                            <span className="text-[10px] font-bold text-slate-700 uppercase">{selectedVehicle.make} {selectedVehicle.model}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
                            <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3"><LucidePaperclip className="text-blue-600"/> Adjuntos y Evidencia</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-600 group">
                                    <LucideCamera size={24} className="group-hover:scale-110 mb-2 transition-transform"/><span className="text-[9px] font-black uppercase">Fotos</span>
                                    <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e, true)} />
                                </label>
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-emerald-50 transition-all text-slate-400 hover:text-emerald-600 group">
                                    <LucideFilePlus size={24} className="group-hover:scale-110 mb-2 transition-transform"/><span className="text-[9px] font-black uppercase">Archivos</span>
                                    <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={e => handleFileUpload(e, false)} />
                                </label>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {attachments.map(att => (
                                    <div key={att.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group animate-fadeIn">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            {att.isImage ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in" onClick={() => setZoomedImage({url: att.url, label: att.name})}>
                                                    <img src={att.url} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shrink-0"><LucideFile size={20}/></div>
                                            )}
                                            <span className="text-[9px] font-bold text-slate-600 truncate uppercase">{att.name}</span>
                                        </div>
                                        <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><LucideTrash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeView === 'DETAIL' && currentRequest && (
           <div className="space-y-10 animate-fadeIn pb-32">
              <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="flex items-center gap-10">
                    <button onClick={() => setActiveView('DASHBOARD')} className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 text-slate-400 transition-all shadow-sm active:scale-95"><LucideArrowLeft size={40}/></button>
                    <div><p className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em] mb-3">{currentRequest.code}</p><h3 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{currentRequest.vehiclePlate}</h3></div>
                 </div>
                 <span className={`px-14 py-8 rounded-[2.5rem] border-4 font-black uppercase text-sm tracking-[0.2em] shadow-3xl ${getStageBadgeStyles(currentRequest.stage)}`}>{currentRequest.stage}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-8 space-y-10">
                    {!isReadOnly && isSupervisorOrAdmin && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED) && (
                      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white space-y-10 shadow-3xl border border-white/5 animate-fadeIn">
                         <div className="flex items-center gap-6"><div className="p-4 bg-blue-600 rounded-2xl shadow-xl"><LucideShield size={28}/></div><h4 className="text-2xl font-black uppercase italic tracking-tighter">Consola de Operaciones</h4></div>
                         <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                            <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2"><LucideRefreshCw size={14}/> Tránsito de Situación Operativa</h5>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-[8px] font-black text-slate-500 uppercase ml-4">Seleccionar Nuevo Estado</label>
                                    <select className="w-full px-6 py-4 bg-slate-900 border border-white/20 rounded-2xl text-xs font-black uppercase text-white outline-none focus:ring-2 focus:ring-blue-500/50" value={selectedStageToTransition} onChange={e => setSelectedStageToTransition(e.target.value as ServiceStage)}>
                                        <option value="">ELIJA UN ESTADO...</option>
                                        {Object.values(ServiceStage).map(s => <option key={s} value={s}>{s === ServiceStage.SCHEDULING ? 'ASIGNAR TURNO' : s}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleConfirmStageTransition} disabled={!selectedStageToTransition} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-500 transition-all disabled:opacity-30">Confirmar</button>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={() => updateServiceRequest({ ...currentRequest, isDialogueOpen: !currentRequest.isDialogueOpen })} className={`py-6 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${currentRequest.isDialogueOpen ? 'bg-amber-600' : 'bg-blue-600'}`}>
                               {currentRequest.isDialogueOpen ? <LucideLock size={20}/> : <LucideMessageCircle size={20}/>} {currentRequest.isDialogueOpen ? 'Cerrar Chat' : 'Habilitar Chat'}
                            </button>
                            <button onClick={() => setIsFinishing(true)} className="py-6 bg-emerald-600 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 flex items-center justify-center gap-3"><LucideCheckCircle2 size={20}/> Finalizar Gestión</button>
                         </div>
                         {currentRequest.isDialogueOpen && (
                            <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 flex flex-col h-[400px] overflow-hidden animate-fadeIn">
                                <div className="p-5 border-b border-white/5 flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-lg"><LucideMessageCircle size={14}/></div><span className="text-[10px] font-black uppercase">Canal de Chat Directo</span></div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {currentRequest.messages.map(m => (
                                        <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}><div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${m.userId === user?.id ? 'bg-blue-600 border-blue-500 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none'}`}><p className="text-[7px] font-black uppercase opacity-60 mb-1">{m.userName}</p><p className="text-[11px] font-bold italic">"{m.text}"</p></div></div>
                                    ))}
                                </div>
                                <div className="p-5 border-t border-white/5 relative"><textarea rows={1} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" placeholder="Escribir..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} /><button onClick={handleSendMessage} className="absolute right-7 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg"><LucideSend size={14}/></button></div>
                            </div>
                         )}
                         {isFinishing && (
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-emerald-500 shadow-2xl space-y-6 animate-fadeIn">
                                <textarea rows={3} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-500 resize-none" placeholder="Informe final técnico..." value={finishComment} onChange={e => setFinishComment(e.target.value)} />
                                <div className="flex gap-4"><button onClick={handleConfirmFinish} disabled={!finishComment.trim()} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs">Cerrar Caso</button><button onClick={() => setIsFinishing(false)} className="px-8 py-4 bg-white/10 text-white rounded-xl font-black uppercase text-[10px]">Cancelar</button></div>
                            </div>
                         )}
                      </div>
                    )}

                    {currentRequest.stage === ServiceStage.SCHEDULING && currentRequest.suggestedDates?.[0] && (
                        <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white space-y-8 shadow-3xl border border-white/5 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-blue-600 rounded-2xl shadow-xl"><LucideCalendarDays size={28}/></div>
                                    <div><h4 className="text-2xl font-black uppercase italic tracking-tighter">Turno Asignado</h4><p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Confirmación de Establecimiento</p></div>
                                </div>
                                <TurnCountdown date={currentRequest.suggestedDates[0].fecha} time={currentRequest.suggestedDates[0].hora || ''} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Cita Técnica</p><p className="text-2xl font-black italic">{format(parseISO(currentRequest.suggestedDates[0].fecha), "dd 'de' MMMM, yyyy", {locale: es}).toUpperCase()} • {currentRequest.suggestedDates[0].hora} HS</p></div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Taller Autorizado</p><p className="text-lg font-black uppercase">{currentRequest.suggestedDates[0].nombreTaller}</p><p className="text-[10px] text-indigo-200 mt-2 flex items-center gap-2"><LucideMapPin size={12}/> {currentRequest.suggestedDates[0].direccionTaller}</p></div>
                                    <button onClick={() => handleGetDirections(currentRequest.suggestedDates[0].direccionTaller || '')} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl transform active:scale-95"><LucideNavigation size={18}/> ¿Cómo llegar? (GPS)</button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ubicación Georreferenciada</p>
                                    <div className="aspect-video bg-white rounded-3xl overflow-hidden border border-white/20 shadow-inner relative">
                                        <iframe width="100%" height="100%" frameBorder="0" style={{border:0}} src={`https://www.google.com/maps/embed/v1/place?key=${process.env.API_KEY}&q=${encodeURIComponent((currentRequest.suggestedDates[0].nombreTaller || '') + ' ' + (currentRequest.suggestedDates[0].direccionTaller || ''))}`} allowFullScreen></iframe>
                                        {!hasApiKey && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8 text-center text-[10px] font-black uppercase text-white">Mapa Interactivo Deshabilitado (Carga Manual)</div>}
                                    </div>
                                </div>
                            </div>
                            {currentRequest.suggestedDates[0].comentarios && (
                                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl"><p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><LucideInfo size={12}/> Instrucciones Especiales</p><p className="text-sm font-bold italic leading-relaxed text-indigo-100">"{currentRequest.suggestedDates[0].comentarios}"</p></div>
                            )}
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4 border-b pb-6"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><LucideInfo size={24}/></div><div><h4 className="text-xl font-black text-slate-800 uppercase italic">Ficha Técnica de Solicitud</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relevamiento fiel de carga</p></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categoría</p><p className="text-[10px] font-black text-blue-600 uppercase">{currentRequest.mainCategory}</p></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo</p><p className="text-[10px] font-black text-slate-700 uppercase">{currentRequest.specificType}</p></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kilometraje</p><p className="text-lg font-black text-slate-800 italic">{currentRequest.odometerAtRequest.toLocaleString()} KM</p></div>
                        </div>
                        <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] italic font-bold text-xl leading-relaxed shadow-xl border border-white/5">"{currentRequest.description}"</div>
                        
                        {currentRequest.attachments && currentRequest.attachments.length > 0 && (
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Legajo Fotográfico y Documental</p>
                                <div className="flex flex-wrap gap-4">
                                    {currentRequest.attachments.map((att, i) => {
                                        const isImg = att.type?.includes('image') || att.url?.startsWith('data:image');
                                        return (
                                            <div key={i} className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                                                {isImg ? (
                                                    <div className="w-full h-full cursor-zoom-in" onClick={() => setZoomedImage({url: att.url, label: att.name})}>
                                                        <img src={att.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><LucideEye className="text-white" size={18}/></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-2 relative">
                                                        <LucideFileText className="text-blue-500" size={32} />
                                                        <span className="text-[6px] font-black uppercase text-center mt-2 truncate w-full px-1">{att.name}</span>
                                                        <a href={att.url} download={att.name} className="absolute inset-0 bg-blue-600/90 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1">
                                                            <LucideDownload size={20}/>
                                                            <span className="text-[7px] font-black uppercase">Descargar</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>

                 <div className="lg:col-span-4 space-y-10">
                    {userRole === UserRole.USER && currentRequest.isDialogueOpen && (
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-3xl flex flex-col h-[500px] overflow-hidden animate-fadeIn">
                            <div className="p-8 border-b bg-blue-600 text-white flex items-center gap-4"><div className="p-3 bg-white/20 rounded-xl shadow-lg"><LucideMessageCircle size={20}/></div><h5 className="text-lg font-black uppercase italic">Mesa de Ayuda</h5></div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/20">
                                {currentRequest.messages.map(m => (
                                    <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}><div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm border-2 ${m.userId === user?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'}`}><p className="text-[7px] font-black uppercase opacity-60 mb-2">{m.userName}</p><p className="text-[11px] font-bold italic leading-relaxed">"{m.text}"</p></div></div>
                                ))}
                            </div>
                            <div className="p-8 border-t bg-white relative"><textarea rows={2} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-xs outline-none focus:ring-8 focus:ring-blue-50 resize-none shadow-inner" placeholder="Escribir..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} /><button onClick={handleSendMessage} className="absolute right-4 bottom-4 p-4 bg-blue-600 text-white rounded-2xl shadow-xl"><LucideSend size={18}/></button></div>
                        </div>
                    )}
                    <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden group"><h4 className="text-sm font-black uppercase italic tracking-widest text-blue-400 border-b border-white/10 pb-4 flex items-center gap-3"><LucideCar size={18}/> Ficha Unidad</h4>
                        <div className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">KM Solicitud</p><p className="text-xl font-black italic">{currentRequest.odometerAtRequest.toLocaleString()} KM</p></div><div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">C. Costo</p><p className="text-[10px] font-black truncate">{currentRequest.costCenter}</p></div></div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-2"><span className="text-slate-500 uppercase">Solicitante</span><span className="uppercase">{currentRequest.userName}</span></div>
                                <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-500 uppercase">Ubicación</span><span className="uppercase">{currentRequest.location}</span></div>
                            </div>
                        </div><LucideDatabase className="absolute -right-8 -bottom-8 opacity-5" size={160}/>
                    </div>
                    <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8"><h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideHistory className="text-indigo-600" size={18}/> Bitácora Eventos</h4><div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {currentRequest.history.map((h, i) => <div key={i} className="flex gap-4 group/item"><div className="w-1 bg-slate-100 group-hover/item:bg-indigo-500 rounded-full transition-all"></div><div className="flex-1"><p className="text-[11px] font-black text-slate-800 uppercase italic leading-tight">{h.comment}</p><p className="text-[8px] font-black text-slate-400 uppercase mt-2">{h.userName} • {format(parseISO(h.date), 'dd/MM HH:mm')}</p></div></div>)}
                    </div></div>
                 </div>
              </div>
           </div>
        )}

        {activeView === 'ASSIGN_TURN' && currentRequest && (
            <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-24">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveView('DETAIL')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={24}/></button>
                        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Agendamiento Técnico</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{hasApiKey ? 'Geolocalización Dinámica Activada' : 'Carga Manual de Dirección (Sin API Key)'}</p></div>
                    </div>
                    <TurnCountdown date={turnDate} time={turnTime} />
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Asignada</label>
                            <input type="date" min={format(new Date(), 'yyyy-MM-dd')} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-100" value={turnDate} onChange={e => setTurnDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hora del Turno</label>
                            <input type="time" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-100" value={turnTime} onChange={e => setTurnTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideBuilding2 size={14}/> Establecimiento / Taller</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <LucideWrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="NOMBRE DEL TALLER..." 
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" 
                                    value={workshopName} 
                                    onChange={e => setWorkshopName(e.target.value.toUpperCase())} 
                                />
                            </div>
                            <div className="relative">
                                <LucideMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="DIRECCIÓN COMPLETA..." 
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" 
                                    value={workshopAddress} 
                                    onChange={e => setWorkshopAddress(e.target.value.toUpperCase())} 
                                />
                            </div>
                        </div>
                        
                        {hasApiKey ? (
                            <div className="space-y-4 animate-fadeIn">
                                {!isMapLoaded ? (
                                    <button 
                                        onClick={() => setIsMapLoaded(true)}
                                        className="w-full py-12 border-4 border-dashed border-blue-100 rounded-[2.5rem] bg-blue-50/30 flex flex-col items-center justify-center gap-4 group transition-all hover:bg-blue-50"
                                    >
                                        <div className="p-4 bg-blue-600 text-white rounded-full shadow-xl group-hover:scale-110 transition-transform"><LucideNavigation2 size={32}/></div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Visualizar Mapa Interactivo y Validar Punto GPS</span>
                                    </button>
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded-[2.5rem] overflow-hidden border-2 border-slate-200 shadow-inner relative group animate-fadeIn">
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            frameBorder="0" 
                                            style={{border:0}} 
                                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.API_KEY}&q=${encodeURIComponent((workshopName || '') + ' ' + (workshopAddress || ''))}`} 
                                            allowFullScreen
                                        ></iframe>
                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200">
                                            <button 
                                                onClick={() => { setIsMapLoaded(false); setWorkshopAddress(''); }}
                                                className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-2"
                                            >
                                                <LucideTrash2 size={12}/> Limpiar Geolocalización
                                            </button>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Si el marcador es incorrecto, verifique la dirección ingresada arriba.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                                <LucideShieldAlert size={32} className="text-slate-300"/>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Funciones de Mapa deshabilitadas (Falta API Key)</p>
                                <p className="text-[8px] text-slate-300 font-bold uppercase">La carga de datos se realizará en modo manual para el registro histórico.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instrucciones Especiales para el Chofer</label>
                        <textarea rows={4} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-bold text-sm outline-none resize-none focus:ring-4 focus:ring-indigo-50" placeholder="Indicar requerimientos específicos..." value={turnComments} onChange={e => setTurnComments(e.target.value)} />
                    </div>

                    <button onClick={handleConfirmTurnAssignment} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 transform active:scale-95"><LucideShieldCheck size={24}/> Confirmar Turno y Notificar Chofer</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};