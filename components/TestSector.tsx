import React, { useState, useMemo, useEffect } from 'react';
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
  LucideClock, LucideMapPinCheck
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { 
    ServiceStage, ServiceRequest, UserRole, MainServiceCategory, 
    SuggestedDate, ServiceMessage
} from '../types';
import { format, parseISO, subMonths, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ImageZoomModal } from './ImageZoomModal';

type ViewMode = 'DASHBOARD' | 'NEW_REQUEST' | 'DETAIL' | 'ASSIGN_TURN';

export const TestSector = () => {
  const { vehicles, user, serviceRequests, addServiceRequest, updateServiceRequest, addNotification, updateServiceStage } = useApp();
  
  const [activeRole, setActiveRole] = useState<UserRole>(user?.role || UserRole.USER);
  const [activeView, setActiveView] = useState<ViewMode>('DASHBOARD');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

  const isMasterAdmin = user?.email === 'alewilczek@gmail.com';
  const isAdminSession = user?.role === UserRole.ADMIN;

  // ESTADO DE FILTROS AVANZADOS
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState({
    eventNumber: '',
    vehicle: '',
    serviceType: '',
    location: '',
    status: '',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [requestStep, setRequestStep] = useState(1);
  const [mainCategory, setMainCategory] = useState<MainServiceCategory | null>(null);
  const [specificType, setSpecificType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [suggestedDates, setSuggestedDates] = useState<SuggestedDate[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [chatMessage, setChatMessage] = useState('');

  const [pendingStage, setPendingStage] = useState<ServiceStage | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishComment, setFinishComment] = useState('');

  // ESTADO ASIGNACIÓN DE TURNO
  const [turnDate, setTurnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turnShift, setTurnShift] = useState<'MAÑANA' | 'TARDE'>('MAÑANA');
  const [turnLocation, setTurnLocation] = useState('');

  const currentRequest = useMemo(() => 
    serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]
  );

  const closingObservation = useMemo(() => {
    if (!currentRequest) return null;
    if (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED) return null;
    const finishEvent = [...(currentRequest.history || [])].reverse().find(h => h.toStage === ServiceStage.FINISHED || h.toStage === ServiceStage.CANCELLED);
    return finishEvent?.comment || null;
  }, [currentRequest]);

  useEffect(() => {
    if (currentRequest) {
      setPendingStage(currentRequest.stage);
      setIsFinishing(false);
      setFinishComment('');
      setTurnLocation(currentRequest.location || '');
    }
  }, [currentRequest?.id]);

  // LÓGICA DE FILTRADO MAESTRA
  const userRequests = useMemo(() => {
    return serviceRequests.filter(r => {
        // 1. Filtro por Rol / Centro de Costo (Privacidad)
        let passPrivacy = true;
        if (!isMasterAdmin && activeRole === UserRole.USER) {
            const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
            passPrivacy = (r.costCenter || '').toUpperCase() === userCC;
        }
        if (!passPrivacy) return false;

        // 2. Filtros de Búsqueda Avanzada
        const matchEvent = !filterState.eventNumber || r.code.includes(filterState.eventNumber);
        const matchVehicle = !filterState.vehicle || r.vehiclePlate.toUpperCase().includes(filterState.vehicle.toUpperCase());
        const matchType = !filterState.serviceType || r.specificType === filterState.serviceType;
        const matchLocation = !filterState.location || r.location.toUpperCase().includes(filterState.location.toUpperCase());
        const matchStatus = !filterState.status || r.stage === filterState.status;

        // 3. Filtro por Fechas
        let matchDates = true;
        const reqDate = parseISO(r.createdAt);
        if (filterState.startDate && filterState.endDate) {
            matchDates = isWithinInterval(reqDate, {
                start: startOfDay(parseISO(filterState.startDate)),
                end: endOfDay(parseISO(filterState.endDate))
            });
        } else if (filterState.startDate) {
            matchDates = reqDate >= startOfDay(parseISO(filterState.startDate));
        } else if (filterState.endDate) {
            matchDates = reqDate <= endOfDay(parseISO(filterState.endDate));
        }

        return matchEvent && matchVehicle && matchType && matchLocation && matchStatus && matchDates;
    });
  }, [serviceRequests, activeRole, user, isMasterAdmin, filterState]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (query.length < 1) return [];
    
    return vehicles.filter(v => {
        const matchesQuery = (v.plate || '').toUpperCase().includes(query) || (v.model || '').toUpperCase().includes(query);
        if (isMasterAdmin) return matchesQuery;
        
        if (activeRole === UserRole.USER) {
            const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
            return matchesQuery && (v.costCenter || '').toUpperCase() === userCC;
        }
        return matchesQuery;
    }).slice(0, 8);
  }, [vehicles, searchQuery, activeRole, user, isMasterAdmin]);

  // Lógica de filtrado de tipos específicos por categoría
  const specificOptions = useMemo(() => {
    if (!mainCategory) return [];
    
    if (mainCategory === 'MANTENIMIENTO') {
      return ['CORRECTIVO', 'PREVENTIVO', 'CORRECTIVO-CONCESIONARIO OFICIAL'];
    }
    
    if (mainCategory === 'COMPRAS') {
      return ['COMPRA DE COMPONENTES', 'COMPRA DE ACCESORIOS'];
    }
    
    if (mainCategory === 'SERVICIO') {
      return [
        'ALQUILER DE VEHÍCULOS', 'ASISTENCIA MÓVIL', 'DESINFECCIÓN', 
        'GESTORA', 'GOMERÍA', 'GPS', 'LAVADO', 'LOGÍSTICA', 
        'SEGURO', 'SINIESTRO', 'VTV', 'INFRACCIONES', 'TRASLADO'
      ];
    }
    
    return [];
  }, [mainCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          id: `ATT-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: reader.result as string,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const submitRequest = () => {
    const newErrors: Record<string, boolean> = {};
    if (!mainCategory) newErrors.mainCategory = true;
    if (!specificType) newErrors.specificType = true;
    if (!description || description.trim().length < 10) newErrors.description = true;
    if (!location || !location.trim()) newErrors.location = true;
    if (!odometer || odometer < (selectedVehicle?.currentKm || 0)) newErrors.odometer = true;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        addNotification("Campos obligatorios incompletos. Verifique los campos resaltados.", "error");
        return;
    }

    setIsSubmitting(true);
    const eventCode = `EV-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReq: ServiceRequest = {
        id: `SR-${Date.now()}`,
        code: eventCode,
        vehiclePlate: selectedVehicle.plate,
        userId: user?.id || 'sys',
        userName: `${user?.nombre || 'Solicitante'} ${user?.apellido || ''}`,
        userEmail: user?.email || '',
        userPhone: user?.telefono || '',
        costCenter: selectedVehicle.costCenter,
        stage: ServiceStage.REQUESTED,
        mainCategory: mainCategory!,
        specificType,
        description,
        location,
        odometerAtRequest: odometer,
        suggestedDates,
        attachments,
        priority: 'MEDIA',
        isDialogueOpen: false,
        messages: [],
        budgets: [],
        history: [{ 
            id: `HIST-${Date.now()}`, 
            date: new Date().toISOString(), 
            toStage: ServiceStage.REQUESTED, 
            comment: 'Solicitud creada en sistema.',
            userId: user?.id || 'sys',
            userName: user?.nombre || 'Sistema'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
        addServiceRequest(newReq);
        addNotification(`Gestión ${eventCode} enviada`, "success");
        setActiveView('DASHBOARD');
        setIsSubmitting(false);
        resetForm();
    }, 1000);
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setRequestStep(1);
    setMainCategory(null);
    setSpecificType('');
    setDescription('');
    setLocation('');
    setOdometer(0);
    setSuggestedDates([]);
    setAttachments([]);
    setSearchQuery('');
    setErrors({});
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentRequest) return;
    const msg: ServiceMessage = {
        id: Date.now().toString(),
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Usuario',
        text: chatMessage,
        timestamp: new Date().toISOString(),
        role: activeRole
    };
    updateServiceRequest({
        ...currentRequest,
        messages: [...(currentRequest.messages || []), msg]
    });
    setChatMessage('');
  };

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const handleConfirmStageUpdate = () => {
    if (!currentRequest || !pendingStage || pendingStage === currentRequest.stage) return;
    
    // Si la etapa es SOLICITANDO TURNO, abrimos la vista de asignación
    if (pendingStage === ServiceStage.APPOINTMENT_REQUESTED) {
        setActiveView('ASSIGN_TURN');
        return;
    }

    // PROTECCIÓN DE INTEGRIDAD: Evitar saltos de etapa críticos sin datos de turno
    if (pendingStage === ServiceStage.SCHEDULING && (!currentRequest.suggestedDates || currentRequest.suggestedDates.length === 0)) {
        addNotification("Debe asignar formalmente un turno antes de pasar a esta etapa.", "warning");
        return;
    }

    updateServiceStage(currentRequest.id, pendingStage, `Actualización manual de etapa: de ${currentRequest.stage} a ${pendingStage}`);
    addNotification(`Etapa actualizada a ${pendingStage}`, "success");
  };

  const handleConfirmTurnAssignment = () => {
    if (!currentRequest) return;
    
    const turnData: SuggestedDate = {
        id: `TURN-${Date.now()}`,
        fecha: turnDate,
        turno: turnShift
    };

    const updatedRequest: ServiceRequest = {
        ...currentRequest,
        stage: ServiceStage.SCHEDULING,
        location: turnLocation,
        suggestedDates: [turnData],
        suggestedDate: turnDate,
        updatedAt: new Date().toISOString(),
        history: [
            ...(currentRequest.history || []),
            {
                id: `HIST-${Date.now()}`,
                date: new Date().toISOString(),
                userId: user?.id || 'sys',
                userName: user?.nombre || 'Supervisor',
                fromStage: currentRequest.stage,
                toStage: ServiceStage.SCHEDULING,
                comment: `Turno asignado para el ${format(parseISO(turnDate), 'dd/MM')} en ${turnLocation} (${turnShift}).`
            }
        ]
    };

    updateServiceRequest(updatedRequest);
    addNotification("Turno asignado y notificado", "success");
    setActiveView('DETAIL');
  };

  const handleConfirmFinish = () => {
    if (!currentRequest || !finishComment.trim()) {
        addNotification("Debe ingresar un comentario para finalizar", "error");
        return;
    }
    updateServiceStage(currentRequest.id, ServiceStage.FINISHED, finishComment);
    updateServiceRequest({
        ...currentRequest,
        stage: ServiceStage.FINISHED,
        isDialogueOpen: false,
        updatedAt: new Date().toISOString()
    });
    addNotification("Gestión finalizada exitosamente", "success");
    setIsFinishing(false);
    setFinishComment('');
  };

  const getStageBadgeStyles = (stage: ServiceStage) => {
    switch (stage) {
      case ServiceStage.FINISHED:
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ServiceStage.CANCELLED:
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case ServiceStage.SCHEDULING:
      case ServiceStage.APPOINTMENT_REQUESTED:
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case ServiceStage.REQUESTED:
        return 'bg-blue-50 text-blue-600 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const resetFilters = () => {
    setFilterState({
        eventNumber: '',
        vehicle: '',
        serviceType: '',
        location: '',
        status: '',
        startDate: '',
        endDate: ''
    });
  };

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}

      {isAdminSession && (
        <div className="bg-slate-900 px-8 py-3 flex items-center justify-between border-b border-white/5 sticky top-0 z-[100] shadow-2xl">
            <div className="flex items-center gap-4">
                <LucideShield className="text-blue-500" size={18}/>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isMasterAdmin ? 'CONSOLA MAESTRA (ADMINISTRADOR PRINCIPAL)' : 'CONTROL DE VISTA'}
                </span>
            </div>
            <div className="flex gap-2">
                {[UserRole.USER, UserRole.SUPERVISOR, UserRole.ADMIN].map(role => (
                    <button 
                        key={role} 
                        onClick={() => { setActiveRole(role); setActiveView('DASHBOARD'); }}
                        className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${activeRole === role ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                    >
                        {role === UserRole.USER ? 'VISTA CHOFER' : role.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
      )}

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12">
        {/* DASHBOARD LINEAL (TABLA) */}
        {activeView === 'DASHBOARD' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-200 pb-8">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl border-4 border-white overflow-hidden">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <LucideUser size={40}/>}
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{user?.nombre} {user?.apellido}</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <LucideBuilding2 size={14} className="text-blue-600"/> {user?.centroCosto?.nombre || user?.costCenter || 'DIRECCIÓN GENERAL'}
                    </p>
                  </div>
               </div>
               {activeRole === UserRole.USER && (
                 <button onClick={() => { resetForm(); setActiveView('NEW_REQUEST'); }} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <LucidePlusCircle size={22}/> Nueva Gestión de Unidad
                 </button>
               )}
            </div>

            <div className="space-y-6">
                {/* BARRA DE FILTROS MEJORADA */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
                    <div className="p-6 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">
                                {Object.values(filterState).filter(v => v !== '').length}
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic mr-4">Filtros</h3>
                            <div className="flex gap-2 flex-wrap">
                                {filterState.startDate && (
                                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-sm animate-fadeIn">
                                        Desde {format(parseISO(filterState.startDate), 'dd/MM/yyyy')} 
                                        <button onClick={() => setFilterState({...filterState, startDate: ''})} className="hover:text-blue-900 transition-colors"><LucideX size={12}/></button>
                                    </span>
                                )}
                                {filterState.endDate && (
                                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-sm animate-fadeIn">
                                        Hasta {format(parseISO(filterState.endDate), 'dd/MM/yyyy')} 
                                        <button onClick={() => setFilterState({...filterState, endDate: ''})} className="hover:text-amber-900 transition-colors"><LucideX size={12}/></button>
                                    </span>
                                )}
                                {filterState.status && (
                                    <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-sm animate-fadeIn">
                                        Situación: {filterState.status} 
                                        <button onClick={() => setFilterState({...filterState, status: ''})} className="hover:text-amber-900 transition-colors"><LucideX size={12}/></button>
                                    </span>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={`p-3 rounded-xl transition-all ${filtersOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                        >
                            {filtersOpen ? <LucideChevronUp size={24}/> : <LucideChevronDown size={24}/>}
                        </button>
                    </div>

                    {/* PANEL DE FILTROS DESPLEGABLE */}
                    {filtersOpen && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 space-y-10 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Número del evento</label>
                                    <input 
                                        type="text" 
                                        placeholder="Solo números" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                        value={filterState.eventNumber}
                                        onChange={e => setFilterState({...filterState, eventNumber: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vehículo o equipo</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ingrese patente" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all uppercase"
                                        value={filterState.vehicle}
                                        onChange={e => setFilterState({...filterState, vehicle: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de servicio</label>
                                    <select 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 appearance-none transition-all"
                                        value={filterState.serviceType}
                                        onChange={e => setFilterState({...filterState, serviceType: e.target.value})}
                                    >
                                        <option value="">Seleccione...</option>
                                        {['ALQUILER DE VEHÍCULOS', 'ASISTENCIA MÓVIL', 'DESINFECCIÓN', 'GESTORA', 'GOMERÍA', 'GPS', 'LAVADO', 'LOGÍSTICA', 'SEGURO', 'SINIESTRO', 'VTV', 'INFRACCIONES', 'TRASLADO', 'CORRECTIVO', 'PREVENTIVO', 'CORRECTIVO-CONCESIONARIO OFICIAL', 'COMPRA DE ACCESORIOS', 'COMPRA DE COMPONENTES'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Localidad</label>
                                    <input 
                                        type="text" 
                                        placeholder="Seleccione localidad" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                        value={filterState.location}
                                        onChange={e => setFilterState({...filterState, location: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Situación</label>
                                    <select 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 appearance-none transition-all"
                                        value={filterState.status}
                                        onChange={e => setFilterState({...filterState, status: e.target.value})}
                                    >
                                        <option value="">Seleccione...</option>
                                        {Object.values(ServiceStage).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="lg:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha de solicitud</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input 
                                                type="date" 
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                                value={filterState.startDate}
                                                onChange={e => setFilterState({...filterState, startDate: e.target.value})}
                                            />
                                        </div>
                                        <div className="relative">
                                            <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input 
                                                type="date" 
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                                value={filterState.endDate}
                                                onChange={e => setFilterState({...filterState, endDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-4 pt-4">
                                <button 
                                    onClick={resetFilters}
                                    className="px-8 py-3 bg-white border border-slate-300 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Limpiar
                                </button>
                                <button 
                                    onClick={() => setFiltersOpen(false)}
                                    className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-[0.2em]">Resultados encontrados</h3>
                            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">{userRequests.length}</span>
                        </div>
                        <button onClick={() => setFiltersOpen(!filtersOpen)} className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><LucideListFilter size={20}/></button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-8 py-6 flex items-center gap-2">Evento <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Vehículo o equipo <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Fecha de solicitud <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Tipo de servicio <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Núm. Flota <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Localidad <LucideChevronsUpDown size={14}/></th>
                                    <th className="px-8 py-6">Situación <LucideChevronsUpDown size={14}/></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {userRequests.map(req => (
                                    <tr 
                                        key={req.id} 
                                        onClick={() => { setSelectedReqId(req.id); setActiveView('DETAIL'); }}
                                        className="group hover:bg-blue-50/50 transition-all cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <LucideRefreshCcw size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors"/>
                                                <span className="text-sm font-black text-slate-700 italic">{req.code.replace('EV-', '')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-700 uppercase">{req.vehiclePlate}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{format(parseISO(req.createdAt), 'dd/MM/yyyy')}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-600 uppercase truncate max-w-[200px] block">{req.specificType}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-400 uppercase italic">{(req as any).fleetNumber || ''}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-600 uppercase">{req.location}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStageBadgeStyles(req.stage)}`}>
                                                        {req.stage.includes('TURNO') ? 'Asignada' : req.stage === ServiceStage.FINISHED ? 'Finalizada' : req.stage === ServiceStage.CANCELLED ? 'Cancelada' : req.stage}
                                                    </span>
                                                    {req.isDialogueOpen && (
                                                        <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg animate-pulse ring-4 ring-blue-50">
                                                            <LucideMessageCircle size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                                <LucideChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"/>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {userRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="opacity-10 grayscale flex flex-col items-center">
                                                <LucideDatabase size={64} className="mb-4"/>
                                                <p className="text-sm font-black uppercase tracking-widest">Sin registros encontrados</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* ASIGNACIÓN DE TURNO (NUEVA VISTA) */}
        {activeView === 'ASSIGN_TURN' && currentRequest && (
            <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveView('DETAIL')} className="p-5 bg-white rounded-3xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={32}/></button>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Asignación de Turno</h2>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Evento: {currentRequest.code} • {currentRequest.vehiclePlate}</p>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2">
                                <LucideCalendar size={16} className="text-blue-600"/> Fecha de Cita
                            </label>
                            <input 
                                type="date" 
                                min={todayStr}
                                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-2xl outline-none focus:ring-8 focus:ring-blue-50 transition-all"
                                value={turnDate}
                                onChange={e => setTurnDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2">
                                <LucideClock size={16} className="text-blue-600"/> Franja Horaria
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {['MAÑANA', 'TARDE'].map((shift: any) => (
                                    <button 
                                        key={shift}
                                        onClick={() => setTurnShift(shift)}
                                        className={`py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${turnShift === shift ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                    >
                                        {shift}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2">
                                <LucideMapPin size={16} className="text-blue-600"/> Lugar de Presentación / Taller
                            </label>
                            <input 
                                type="text" 
                                placeholder="Indique dirección o nombre del taller..."
                                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-sm uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all"
                                value={turnLocation}
                                onChange={e => setTurnLocation(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-center gap-6">
                        <LucideInfo className="text-blue-600" size={32}/>
                        <p className="text-[11px] font-bold text-blue-800 leading-relaxed uppercase">
                            Al confirmar, el sistema notificará al chofer <span className="font-black">({currentRequest.userName})</span> y cambiará el estado a <span className="font-black">TURNO ASIGNADO</span> automáticamente.
                        </p>
                    </div>

                    <div className="flex gap-6 pt-4">
                        <button onClick={() => setActiveView('DETAIL')} className="flex-1 py-8 bg-white border-2 border-slate-200 rounded-[2.5rem] font-black uppercase text-xs text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                        <button onClick={handleConfirmTurnAssignment} className="flex-[2] py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
                            <LucideCheckCircle2 size={32}/> Confirmar Turno
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* NUEVA SOLICITUD */}
        {activeView === 'NEW_REQUEST' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
             <div className="flex items-center gap-6">
                <button onClick={() => setActiveView('DASHBOARD')} className="p-5 bg-white rounded-3xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={32}/></button>
                <div>
                   <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Relevamiento Técnico</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Paso {requestStep} de 2: Especificación Operativa</p>
                </div>
             </div>

             {requestStep === 1 ? (
                <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-100 space-y-12 animate-fadeIn max-w-2xl mx-auto relative z-20">
                    <div className="space-y-4 relative">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-6 flex items-center gap-2">
                           <LucideSearch size={16} className="text-blue-600"/> Buscador de Unidad o Equipo
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Escriba patente..." 
                                className="w-full px-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] font-black text-4xl uppercase outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all text-slate-800"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    if (selectedVehicle) setSelectedVehicle(null);
                                }}
                            />
                            {searchQuery.trim().length > 0 && !selectedVehicle && filteredVehicles.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-slate-100 z-[500] overflow-hidden animate-fadeIn">
                                    {filteredVehicles.map(v => (
                                        <div key={v.plate} onClick={() => { setSelectedVehicle(v); setOdometer(v.currentKm); setSearchQuery(v.plate); }} className="p-8 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-50 group transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 transition-colors">{v.plate.substring(0,2)}</div>
                                                <div><p className="font-black text-3xl italic text-slate-800 uppercase leading-none">{v.plate}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{v.make} {v.model}</p></div>
                                            </div>
                                            <LucideArrowRight size={32} className="text-slate-200 group-hover:text-blue-600 transition-all transform group-hover:translate-x-2"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedVehicle && (
                      <div className="space-y-10 animate-fadeIn">
                        <div className="p-10 bg-slate-950 rounded-[3.5rem] text-white flex justify-between items-center relative overflow-hidden group shadow-3xl">
                           <div className="relative z-10">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3">Activo Vinculado</p>
                                <h4 className="text-6xl font-black italic tracking-tighter uppercase leading-none mb-2">{selectedVehicle.plate}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedVehicle.make} {selectedVehicle.model}</p>
                                
                                <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Solicitante Identificado</p>
                                    <div className="flex items-center gap-4 text-blue-400 font-black uppercase text-[11px] tracking-widest"><LucideUser size={14}/> {user?.nombre} {user?.apellido}</div>
                                    <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px]"><LucideSmartphone size={14}/> {user?.telefono || 'N/A'}</div>
                                    <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] lowercase"><LucideMail size={14}/> {user?.email}</div>
                                </div>
                           </div>
                           <button onClick={() => setSelectedVehicle(null)} className="absolute top-10 right-10 z-10 p-5 bg-white/10 rounded-3xl hover:bg-rose-600 transition-all text-white border border-white/5"><LucideRefreshCcw size={20}/></button>
                           <LucideCar className="absolute -right-16 -bottom-16 opacity-5 text-white scale-150 transform -rotate-12" size={320}/>
                        </div>
                        <button onClick={() => setRequestStep(2)} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95">Continuar <LucideChevronRight size={28}/></button>
                      </div>
                    )}
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn pb-32">
                   <div className="lg:col-span-2 space-y-12">
                      <div className={`bg-white p-12 rounded-[4rem] shadow-2xl border transition-all ${Object.keys(errors).length > 0 ? 'border-rose-300' : 'border-slate-100'} space-y-12`}>
                         <div className="border-b border-slate-100 pb-8 flex justify-between items-center">
                            <h4 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-4"><LucideWrench className="text-blue-600" size={36}/> Especificación Técnica</h4>
                         </div>
                         <div className="space-y-12">
                            <div className="space-y-6">
                               <div className="flex justify-between items-center ml-6">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ${errors.mainCategory ? 'text-rose-500' : 'text-slate-400'}`}>Categoría de Gestión *</label>
                                  {errors.mainCategory && <span className="text-[10px] font-black text-rose-500 uppercase italic">Requerido</span>}
                               </div>
                               <div className="grid grid-cols-3 gap-6">
                                  {['MANTENIMIENTO', 'SERVICIO', 'COMPRAS'].map((cat: any) => (
                                    <button 
                                      key={cat} 
                                      onClick={() => { setMainCategory(cat); setSpecificType(''); setErrors(prev => ({...prev, mainCategory: false})); }} 
                                      className={`py-8 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex flex-col items-center gap-4 border-2 ${mainCategory === cat ? 'bg-blue-600 text-white border-blue-500 shadow-blue-100 scale-105' : errors.mainCategory ? 'bg-rose-50 border-rose-200 text-rose-400' : 'bg-slate-50 text-slate-400 hover:bg-white border-slate-100'}`}
                                    >
                                      {cat === 'MANTENIMIENTO' ? <LucideWrench size={24}/> : cat === 'SERVICIO' ? <LucideSmartphone size={24}/> : <LucideShoppingBag size={24}/>} {cat}
                                    </button>
                                  ))}
                               </div>
                            </div>
                            {mainCategory && (
                                <div className="space-y-4 animate-fadeIn">
                                   <div className="flex justify-between items-center ml-6">
                                      <label className={`text-[10px] font-black uppercase tracking-widest ${errors.specificType ? 'text-rose-500' : 'text-slate-400'}`}>Tipo Específico *</label>
                                      {errors.specificType && <span className="text-[10px] font-black text-rose-500 uppercase italic">Seleccione una opción</span>}
                                   </div>
                                   <select 
                                      className={`w-full px-8 py-6 rounded-[2rem] border font-black text-sm uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all appearance-none cursor-pointer ${errors.specificType ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                      value={specificType} 
                                      onChange={e => { setSpecificType(e.target.value); setErrors(prev => ({...prev, specificType: false})); }}
                                    >
                                      <option value="">Seleccione el tipo de {mainCategory.toLowerCase()}...</option>
                                      {specificOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-4">
                               <div className="flex justify-between items-center ml-6">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ${errors.description ? 'text-rose-500' : 'text-slate-400'}`}>Descripción de Necesidad Técnica *</label>
                                  {errors.description && <span className="text-[10px] font-black text-rose-500 uppercase italic">Mínimo 10 caracteres</span>}
                               </div>
                               <textarea 
                                  rows={5} 
                                  className={`w-full p-10 rounded-[3.5rem] border font-bold text-base outline-none transition-all shadow-inner resize-none focus:ring-8 focus:ring-blue-50 ${errors.description ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                                  placeholder="Escriba aquí los detalles..." 
                                  value={description} 
                                  onChange={e => { setDescription(e.target.value); if(e.target.value.length >= 10) setErrors(prev => ({...prev, description: false})); }}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center ml-6">
                                     <label className={`text-[10px] font-black uppercase tracking-widest ${errors.location ? 'text-rose-500' : 'text-slate-400'}`}>Localidad / Obrador *</label>
                                     {errors.location && <span className="text-[10px] font-black text-rose-500 uppercase italic">Indique lugar</span>}
                                  </div>
                                  <input 
                                     className={`w-full px-8 py-6 rounded-[2rem] border font-black text-xs uppercase outline-none focus:bg-white focus:border-blue-200 transition-all ${errors.location ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`} 
                                     placeholder="Lugar de la unidad..." 
                                     value={location} 
                                     onChange={e => { setLocation(e.target.value); if(e.target.value.trim()) setErrors(prev => ({...prev, location: false})); }} 
                                  />
                               </div>
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center ml-6">
                                     <label className={`text-[10px] font-black uppercase tracking-widest ${errors.odometer ? 'text-rose-500' : 'text-slate-400'}`}>KM Auditoría *</label>
                                     {errors.odometer && <span className="text-[10px] font-black text-rose-500 uppercase italic">Inválido</span>}
                                  </div>
                                  <input 
                                     type="number" 
                                     onFocus={(e) => e.target.select()} 
                                     className={`w-full px-8 py-6 rounded-[2rem] border font-black text-3xl outline-none focus:bg-white transition-all ${errors.odometer ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-slate-50 border-slate-200 text-blue-600'}`} 
                                     value={odometer || ''} 
                                     onChange={e => { setOdometer(Number(e.target.value)); if(Number(e.target.value) >= (selectedVehicle?.currentKm || 0)) setErrors(prev => ({...prev, odometer: false})); }} 
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-8">
                         <button onClick={() => setRequestStep(1)} className="flex-1 py-8 bg-white border-2 border-slate-200 rounded-[2.5rem] font-black uppercase text-xs text-slate-400 hover:bg-slate-50 transition-all shadow-md">Regresar</button>
                         <button onClick={submitRequest} disabled={isSubmitting} className="flex-[2] py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50">{isSubmitting ? <LucideRefreshCcw className="animate-spin" size={32}/> : <LucideCheckCircle2 size={32}/>} Confirmar y Enviar</button>
                      </div>
                   </div>

                   <div className="lg:col-span-1 space-y-12">
                      <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-100 space-y-10 sticky top-28">
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-4"><LucideCar size={16} className="text-blue-500"/> Ficha Activo</h5>
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl"><p className="text-4xl font-black italic uppercase leading-none mb-3">{selectedVehicle?.plate}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedVehicle?.make} {selectedVehicle?.model}</p></div>
                         </div>
                         <div className="space-y-6 pt-8 border-t border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-4"><LucideUser size={16} className="text-blue-500"/> Datos Solicitante</h5>
                            <div className="px-6 space-y-4">
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Nombre Completo</p><p className="text-[11px] font-black text-slate-800 uppercase italic">{user?.nombre} {user?.apellido}</p></div>
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Contacto Registrado</p><p className="text-[10px] font-bold text-slate-600">{user?.telefono || 'S/T'}</p><p className="text-[9px] font-medium text-slate-400 lowercase">{user?.email}</p></div>
                            </div>
                         </div>
                         <div className="space-y-8 pt-8 border-t border-slate-100">
                            <div className="flex justify-between items-center px-4"><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><LucidePaperclip size={16} className="text-blue-500"/> Adjuntos</h5><label className="p-3 bg-blue-600 text-white rounded-2xl cursor-pointer hover:bg-blue-700 shadow-xl active:scale-90"><LucideFileUp size={24}/><input type="file" multiple className="hidden" onChange={handleFileUpload} /></label></div>
                            <div className="space-y-4">{attachments.map((att) => (<div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group animate-fadeIn hover:bg-white"><div className="flex items-center gap-4 overflow-hidden"><LucideFileText className="text-blue-500 shrink-0" size={20}/><span className="text-[10px] font-black text-slate-600 truncate uppercase">{att.name}</span></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => downloadFile(att.url, att.name)} className="p-2 text-slate-400 hover:text-blue-600"><LucideDownload size={16}/></button><button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="p-2 text-slate-400 hover:text-rose-500"><LucideTrash2 size={16}/></button></div></div>))}</div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* DETALLE FIEL AL REGISTRO */}
        {activeView === 'DETAIL' && currentRequest && (
           <div className="space-y-12 animate-fadeIn pb-32">
              <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="flex items-center gap-10">
                    <button onClick={() => setActiveView('DASHBOARD')} className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 text-slate-400 transition-all shadow-sm active:scale-95"><LucideArrowLeft size={40}/></button>
                    <div><p className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em] mb-3">{currentRequest.code}</p><h3 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{currentRequest.vehiclePlate}</h3></div>
                 </div>
                 <div className="flex items-center gap-8">
                    <span className={`px-14 py-8 rounded-[2.5rem] border-4 font-black uppercase text-sm tracking-[0.2em] shadow-3xl flex items-center gap-6 ${getStageBadgeStyles(currentRequest.stage)}`}>
                        {currentRequest.stage}
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 {/* SIDEBAR IZQUIERDO (3/12) */}
                 <div className="lg:col-span-3 space-y-8">
                    {/* BURBUJA ACTIVO VINCULADO */}
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><LucideCar size={14} className="text-blue-500"/> Activo Vinculado</p>
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl"><p className="text-2xl font-black italic uppercase leading-none mb-2">{currentRequest.vehiclePlate}</p><p className="text-[9px] font-bold text-slate-500 uppercase">{currentRequest.costCenter}</p></div>
                    </div>

                    {/* BURBUJA HISTORIAL (BAJO ACTIVO VINCULADO) */}
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-3xl p-8 space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm"><LucideHistory size={20}/></div>
                             <div><h5 className="text-base font-black text-slate-800 uppercase italic leading-none">Historial</h5><p className="text-[8px] font-black text-slate-400 uppercase mt-1 italic tracking-widest">Línea de Tiempo</p></div>
                        </div>
                        
                        <div className="space-y-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {currentRequest.history?.map((h: any) => (
                                <div key={h.id} className="flex gap-4 group relative">
                                    <div className="flex flex-col items-center">
                                        <div className="w-1 bg-blue-100 flex-1 rounded-full group-hover:bg-blue-600 transition-all"></div>
                                        <div className="w-3 h-3 rounded-full border-2 border-white bg-blue-600 shadow-md absolute -left-1 top-0 transition-transform group-hover:scale-125"></div>
                                    </div>
                                    <div className="pb-6">
                                        <p className="text-[9px] font-black text-slate-800 uppercase italic leading-tight">{h.comment}</p>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                                            {h.userName} • {format(parseISO(h.date), 'dd/MM HH:mm')}hs
                                        </p>
                                        {h.toStage && (
                                            <span className={`inline-block mt-2 px-2 py-0.5 rounded-lg text-[6px] font-black uppercase border transition-colors ${getStageBadgeStyles(h.toStage)}`}>
                                                {h.toStage}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                        <div className="space-y-6 pt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><LucideUser size={14} className="text-blue-500"/> Solicitante</p>
                            <div className="px-2 space-y-4">
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Nombre Completo</p><p className="text-[11px] font-black text-slate-800 uppercase italic">{currentRequest.userName}</p></div>
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Contacto Registrado</p><p className="text-[10px] font-bold text-slate-600">{currentRequest.userPhone || 'N/R'}</p><p className="text-[9px] font-medium text-slate-400 lowercase">{currentRequest.userEmail}</p></div>
                            </div>
                        </div>
                        <div className="space-y-6 pt-6 border-t border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><LucidePaperclip size={14} className="text-blue-500"/> Adjuntos ({currentRequest.attachments?.length || 0})</p>
                            <div className="space-y-2">{currentRequest.attachments?.map((att: any) => (<div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group"><div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => att.type.includes('image') && setZoomedImage({url: att.url, label: att.name})}><LucideFileText size={14} className="text-blue-500 shrink-0"/><span className="text-[9px] font-black text-slate-600 truncate uppercase">{att.name}</span></div><button onClick={() => downloadFile(att.url, att.name)} className="p-1.5 text-slate-300 hover:text-blue-600"><LucideDownload size={14}/></button></div>))}</div>
                        </div>
                    </div>
                 </div>

                 {/* COLUMNA CENTRAL (9/12) */}
                 <div className="lg:col-span-9 space-y-12">
                    {/* RESUMEN DE TURNO ASIGNADO (Visible para ambos, solo lectura para chofer) */}
                    {currentRequest.stage === ServiceStage.SCHEDULING && currentRequest.suggestedDates && currentRequest.suggestedDates.length > 0 && (
                        <div className="bg-amber-50 border-4 border-amber-400 p-10 rounded-[4rem] shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-amber-500 text-white rounded-[2rem] shadow-lg"><LucideMapPinCheck size={32}/></div>
                                    <div>
                                        <h4 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter">Cita Técnica Confirmada</h4>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Hoja de Ruta Operativa</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-amber-500 uppercase">Turno</p>
                                    <p className="text-2xl font-black text-amber-900 italic uppercase">{currentRequest.suggestedDates[0]?.turno || 'S/T'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-amber-200 shadow-inner flex items-center gap-6">
                                    <LucideCalendarDays size={36} className="text-amber-600"/>
                                    <div>
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Día de Presentación</p>
                                        <p className="text-xl font-black text-amber-900 uppercase">{currentRequest.suggestedDates[0] ? format(parseISO(currentRequest.suggestedDates[0].fecha), "eeee dd 'de' MMMM", {locale: es}) : 'FECHA NO DEFINIDA'}</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-amber-200 shadow-inner flex items-center gap-6">
                                    <LucideMapPin size={36} className="text-amber-600"/>
                                    <div>
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Lugar / Establecimiento</p>
                                        <p className="text-xl font-black text-amber-900 uppercase">{currentRequest.location || 'UBICACIÓN NO DEFINIDA'}</p>
                                    </div>
                                </div>
                            </div>
                            <LucideClock size={300} className="absolute -right-20 -bottom-20 opacity-5 text-amber-900 scale-125"/>
                        </div>
                    )}

                    {/* CONSOLA REGIONAL DE FLOTA (VISTA SUPERVISOR) */}
                    {(activeRole === UserRole.SUPERVISOR || activeRole === UserRole.ADMIN) && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED) && (
                      <div className="bg-slate-950 p-12 rounded-[4.5rem] text-white space-y-12 shadow-3xl border border-white/5 relative overflow-hidden animate-fadeIn">
                         <div className="flex items-center gap-8 border-b border-white/10 pb-10 relative z-10">
                            <div className="p-6 bg-blue-600 rounded-[2rem] shadow-2xl transform -rotate-3"><LucideShield size={40}/></div>
                            <div>
                                <h4 className="text-4xl font-black uppercase italic tracking-tighter">Consola Regional de Flota</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Control Maestro de Etapas y Comunicaciones</p>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            {/* BOTÓN MESA DE DIÁLOGO */}
                            <button 
                                onClick={() => updateServiceRequest({ ...currentRequest, isDialogueOpen: !currentRequest.isDialogueOpen })} 
                                className={`py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-6 shadow-2xl ${currentRequest.isDialogueOpen ? 'bg-amber-600 shadow-amber-900/40 hover:bg-amber-700' : 'bg-blue-600 shadow-blue-900/40 hover:bg-blue-700'}`}
                            >
                               {currentRequest.isDialogueOpen ? <LucideLock size={28}/> : <LucideMessageCircle size={28}/>} 
                               {currentRequest.isDialogueOpen ? 'Cerrar Mesa de Diálogo' : 'Habilitar Mesa de Diálogo'}
                            </button>
                            
                            {/* BOTÓN FINALIZAR GESTIÓN */}
                            <div className="relative">
                               {!isFinishing ? (
                                 <button onClick={() => setIsFinishing(true)} className="w-full h-full py-8 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-700 flex items-center justify-center gap-6 transition-all animate-fadeIn">
                                    <LucideCheckCircle2 size={28}/> Finalizar Gestión
                                 </button>
                               ) : (
                                 <div className="bg-slate-900 p-6 rounded-[2.5rem] border-2 border-emerald-500 shadow-2xl space-y-6 animate-fadeIn">
                                    <div className="flex justify-between items-center">
                                       <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><LucideMessageSquare size={12}/> Comentario Técnico Obligatorio</p>
                                       <button onClick={() => { setIsFinishing(false); setFinishComment(''); }} className="text-slate-500 hover:text-white"><LucideX size={16}/></button>
                                    </div>
                                    <textarea 
                                        rows={2} 
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-emerald-500 resize-none" 
                                        placeholder="Escriba la observación final..."
                                        value={finishComment}
                                        onChange={e => setFinishComment(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleConfirmFinish}
                                        disabled={!finishComment.trim()}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <LucideCheck size={16}/> Confirmar Cierre
                                    </button>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* MESA DE DIÁLOGO INTERNA (Integrada en la Consola) */}
                         <div className={`transition-all duration-1000 overflow-hidden ${currentRequest.isDialogueOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white rounded-[3rem] border border-white/10 shadow-3xl flex flex-col h-[500px] overflow-hidden mt-8">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><LucideMessageCircle size={24}/></div>
                                        <div>
                                            <h5 className="text-sm font-black text-slate-800 uppercase italic leading-none">Gestión de Comunicación Interna</h5>
                                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1 italic tracking-widest">Canal Directo Activo</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#f8f9fc]/50 relative">
                                    {currentRequest.messages.map(m => (
                                        <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                            <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-xl border-2 transition-all ${m.userId === user?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'}`}>
                                                <p className="text-[8px] font-black uppercase opacity-60 mb-2 tracking-[0.2em] flex items-center gap-2">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}hs</p>
                                                <p className="text-[12px] font-bold italic leading-relaxed">"{m.text}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-8 border-t bg-white">
                                    <div className="relative group">
                                        <textarea rows={1} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-full font-bold text-xs outline-none focus:ring-12 focus:ring-blue-50 focus:border-blue-200 shadow-inner resize-none text-slate-700 transition-all pr-20" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                                        <button onClick={handleSendMessage} className="absolute right-2 bottom-2 w-12 h-12 bg-blue-600 text-white rounded-full shadow-3xl hover:bg-blue-700 transition-all active:scale-90 flex items-center justify-center"><LucideSend size={20}/></button>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* SELECTOR DE ETAPA OPERATIVA */}
                         <div className="pt-10 relative z-10 space-y-6 border-t border-white/5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-8">Modificar Etapa Operativa</label>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <select 
                                        className="w-full bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] outline-none focus:border-blue-500 appearance-none cursor-pointer text-blue-400 shadow-inner" 
                                        value={pendingStage || currentRequest.stage} 
                                        onChange={e => setPendingStage(e.target.value as ServiceStage)}
                                    >
                                        {Object.values(ServiceStage).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                                    </select>
                                    <LucideChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 text-white opacity-20 pointer-events-none" size={32}/>
                                </div>
                                {pendingStage && pendingStage !== currentRequest.stage && (
                                    <button 
                                        onClick={handleConfirmStageUpdate}
                                        className="px-10 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-4 animate-fadeIn"
                                    >
                                        <LucideCheck size={24}/> {pendingStage === ServiceStage.APPOINTMENT_REQUESTED ? 'Pasar a Asignación' : 'Confirmar Cambio'}
                                    </button>
                                )}
                            </div>
                         </div>
                         <LucideDatabase size={300} className="absolute -right-20 -bottom-20 opacity-5 text-blue-500 scale-125 pointer-events-none"/>
                      </div>
                    ) : (
                        /* MESA DE DIÁLOGO ESTÁNDAR (CHOFER O FINALIZADA) */
                        <div className={`bg-white rounded-[4.5rem] border border-slate-100 shadow-3xl flex flex-col h-[600px] overflow-hidden transition-all duration-1000 ${!currentRequest.isDialogueOpen && activeRole === UserRole.USER ? 'opacity-30 grayscale pointer-events-none shadow-none scale-95 blur-md' : ''}`}>
                           <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                              <div className="flex items-center gap-6">
                                 <div className={`p-6 rounded-[2.2rem] shadow-2xl transition-all duration-700 ${currentRequest.isDialogueOpen ? 'bg-blue-600 text-white rotate-6' : 'bg-slate-300 text-slate-100'}`}><LucideMessageCircle size={32}/></div>
                                 <div>
                                    <h5 className="text-xl font-black text-slate-800 uppercase italic leading-none">Mesa de Diálogo</h5>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 italic tracking-widest flex items-center gap-2">
                                        {currentRequest.isDialogueOpen ? <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Canal Activo</> : (currentRequest.stage === ServiceStage.FINISHED || currentRequest.stage === ServiceStage.CANCELLED) ? 'Mesa Cerrada por Finalización' : 'Conexión Restringida'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#f8f9fc]/50 relative">
                              {!currentRequest.isDialogueOpen && (
                                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-12 space-y-6 bg-slate-50/10 backdrop-blur-sm animate-fadeIn">
                                    <div className="p-8 bg-white rounded-full text-slate-300 shadow-xl border border-slate-100"><LucideLockKeyhole size={64}/></div>
                                    <h4 className="text-xl font-black text-slate-400 uppercase italic">Conexión Restringida</h4>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xs">
                                        {currentRequest.stage === ServiceStage.FINISHED ? 'El canal de comunicación ha sido clausurado por el sector operativo al concluir la gestión.' : 'El canal de comunicación se encuentra deshabilitado temporalmente.'}
                                    </p>
                                 </div>
                              )}
                              {currentRequest.messages.map(m => (
                                <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                    <div className={`max-w-[80%] p-8 rounded-[3rem] shadow-xl border-2 transition-all ${m.userId === user?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'}`}>
                                        <p className="text-[9px] font-black uppercase opacity-60 mb-4 tracking-[0.2em] flex items-center gap-3">{m.userName} <span className="w-1 h-1 bg-current rounded-full opacity-30"></span> {format(parseISO(m.timestamp), 'HH:mm')}hs</p>
                                        <p className="text-base font-bold italic leading-relaxed">"{m.text}"</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           {(currentRequest.isDialogueOpen && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED)) && (
                             <div className="p-10 border-t bg-white">
                                <div className="relative group">
                                    <textarea rows={2} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] font-bold text-base outline-none focus:ring-12 focus:ring-blue-50 focus:border-blue-200 shadow-inner resize-none text-slate-700 transition-all pr-24" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                                    <button onClick={handleSendMessage} className="absolute right-4 bottom-4 w-16 h-16 bg-blue-600 text-white rounded-3xl shadow-3xl hover:bg-blue-700 transition-all active:scale-90 flex items-center justify-center"><LucideSend size={28}/></button>
                                </div>
                             </div>
                           )}
                        </div>
                    )}

                    {/* RELEVAMIENTO DEL EVENTO (Siempre visible) */}
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 shadow-sm space-y-12 relative overflow-hidden">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-10">
                            <h4 className="text-3xl font-black text-slate-800 uppercase italic flex items-center gap-6"><LucideInfo className="text-blue-600" size={44}/> Relevamiento del Evento</h4>
                            <span className="px-8 py-3 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic">{currentRequest.specificType}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-10">
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Localidad / Establecimiento</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 uppercase text-base border border-slate-100 flex items-center gap-4"><LucideMapPin size={24} className="text-blue-500"/> {currentRequest.location || 'S/E'}</div></div>
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Fecha Solicitada por Usuario</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 uppercase text-base border border-slate-100 flex items-center gap-4"><LucideCalendarDays size={24} className="text-blue-500"/> {currentRequest.suggestedDates && currentRequest.suggestedDates.length > 0 ? format(parseISO(currentRequest.suggestedDates[0].fecha), 'dd/MM/yyyy') : 'SIN ELECCIÓN'}</div></div>
                            </div>
                            <div className="space-y-10"><div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Odómetro Registrado</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-blue-600 text-3xl border border-slate-100 italic tracking-tighter">{currentRequest.odometerAtRequest.toLocaleString()} <span className="text-xs not-italic text-slate-400 font-bold uppercase ml-2">KM</span></div></div></div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Descripción Técnica de la Necesidad:</p>
                            <div className="p-16 bg-slate-900 text-white rounded-[4rem] italic font-bold text-2xl leading-relaxed shadow-3xl relative overflow-hidden"><span className="relative z-10">"{currentRequest.description}"</span><LucideMessageCircle className="absolute -right-12 -bottom-12 opacity-5 scale-[2]" size={320}/></div>
                        </div>
                    </div>

                    {/* RESOLUCIÓN DE GESTIÓN (Finalizada) */}
                    {closingObservation && (
                        <div className="bg-emerald-50 border-4 border-emerald-500 p-12 rounded-[4rem] shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-5 bg-emerald-600 text-white rounded-[2rem] shadow-lg"><LucideShieldCheck size={32}/></div>
                                <div>
                                    <h4 className="text-3xl font-black text-emerald-900 uppercase italic tracking-tighter">Resolución de Gestión</h4>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Dictamen Técnico / Observación de Cierre</p>
                                </div>
                            </div>
                            <div className="p-10 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-emerald-200 shadow-inner relative z-10">
                                <p className="text-xl font-black text-emerald-950 italic leading-relaxed">"{closingObservation}"</p>
                            </div>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}