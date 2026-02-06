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
  LucideClipboardList, LucideAlertCircle, LucideFileDown, LucideFileSearch // MOD: 2024-05-24 23:50
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { 
    ServiceStage, ServiceRequest, UserRole, MainServiceCategory, 
    SuggestedDate, ServiceMessage, Checklist
} from '../types';
import { format, parseISO, subMonths, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ImageZoomModal } from './ImageZoomModal';
import { compressImage } from '../utils/imageCompressor'; 
import { jsPDF } from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 

type ViewMode = 'DASHBOARD' | 'NEW_REQUEST' | 'DETAIL' | 'ASSIGN_TURN';

export const TestSector = () => {
  const { vehicles, user, serviceRequests, checklists, addServiceRequest, updateServiceRequest, addNotification, updateServiceStage } = useApp();
  const navigate = useNavigate();
  
  const [activeRole, setActiveRole] = useState<UserRole>(user?.role || UserRole.USER);
  const [activeView, setActiveView] = useState<ViewMode>('DASHBOARD');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null); // MOD: 2024-05-24 23:50

  const isMasterAdmin = user?.email === 'alewilczek@gmail.com';
  const isAdminSession = user?.role === UserRole.ADMIN;
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

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

  // ESTADO PARA NUEVA GESTIÓN
  const [searchQuery, setSearchQuery] = useState('');
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [requestStep, setRequestStep] = useState(1);
  const [mainCategory, setMainCategory] = useState<MainServiceCategory | null>(null);
  const [specificType, setSpecificType] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [chatMessage, setChatMessage] = useState('');

  const [pendingStage, setPendingStage] = useState<ServiceStage | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishComment, setFinishComment] = useState('');

  // ESTADO ASIGNACIÓN DE TURNO MEJORADO
  const [turnDate, setTurnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turnTime, setTurnTime] = useState('09:00');
  const [turnShift, setTurnShift] = useState<'MAÑANA' | 'TARDE'>('MAÑANA');
  const [workshopName, setWorkshopName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [workshopCoords, setWorkshopCoords] = useState('');
  const [turnComments, setTurnComments] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const currentRequest = useMemo(() => 
    serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]
  );

  const lastChecklist = useMemo(() => {
    if (!currentRequest) return null;
    return [...checklists]
        .filter(c => c.vehiclePlate === currentRequest.vehiclePlate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [checklists, currentRequest?.vehiclePlate]);

  const isChecklistToday = useMemo(() => {
    if (!lastChecklist) return false;
    return format(parseISO(lastChecklist.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  }, [lastChecklist]);

  // MOD: 2024-05-24 23:50 - Función mejorada para previsualizar PDF
  const handlePreviewPDF = (chk: Checklist) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("COMPROBANTE DE INSPECCIÓN", 14, 25);
    doc.setFontSize(10); doc.text(`UNIDAD: ${chk.vehiclePlate} | EMISIÓN: ${format(parseISO(chk.date), 'dd/MM/yyyy HH:mm')}hs`, 14, 35);
    
    autoTable(doc, {
        startY: 50,
        head: [['ITEM', 'VALOR / DETALLE']],
        body: [
            ['CONDUCTOR / INSPECTOR', chk.userName.toUpperCase()],
            ['DOMINIO', chk.vehiclePlate],
            ['KILOMETRAJE', `${chk.km.toLocaleString()} KM`],
            ['TIPO DE CONTROL', chk.type],
            ['CENTRO DE COSTO', chk.costCenter],
            ['VERDICTO', chk.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO']
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);
  };

  const downloadChecklistPDF = (chk: Checklist) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("COMPROBANTE DE INSPECCIÓN", 14, 25);
    doc.setFontSize(10); doc.text(`UNIDAD: ${chk.vehiclePlate} | EMISIÓN: ${format(parseISO(chk.date), 'dd/MM/yyyy HH:mm')}hs`, 14, 35);
    
    autoTable(doc, {
        startY: 50,
        head: [['ITEM', 'VALOR / DETALLE']],
        body: [
            ['CONDUCTOR / INSPECTOR', chk.userName.toUpperCase()],
            ['DOMINIO', chk.vehiclePlate],
            ['KILOMETRAJE', `${chk.km.toLocaleString()} KM`],
            ['TIPO DE CONTROL', chk.type],
            ['CENTRO DE COSTO', chk.costCenter],
            ['VERDICTO', chk.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO']
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`Inspeccion_${chk.vehiclePlate}_${format(parseISO(chk.date), 'yyyyMMdd')}.pdf`);
    addNotification("PDF generado con éxito", "success");
  };

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
      
      if (currentRequest.suggestedDates && currentRequest.suggestedDates.length > 0) {
          const t = currentRequest.suggestedDates[0];
          setTurnDate(t.fecha);
          setTurnTime(t.hora || '09:00');
          setTurnShift(t.turno);
          setWorkshopName(t.nombreTaller || '');
          setWorkshopAddress(t.direccionTaller || '');
          setWorkshopCoords(t.mapUrl || '');
          setTurnComments(t.comentarios || '');
      } else {
          setWorkshopName('');
          setWorkshopAddress(currentRequest.location || '');
          setWorkshopCoords('');
          setTurnComments('');
      }
    }
  }, [currentRequest?.id]);

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
        addNotification("GPS no compatible", "error");
        return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setWorkshopCoords(`${pos.coords.latitude},${pos.coords.longitude}`);
            setGpsLoading(false);
            addNotification("Coordenadas capturadas con éxito", "success");
        },
        () => {
            setGpsLoading(false);
            addNotification("No se pudo acceder al GPS", "warning");
        },
        { timeout: 8000 }
    );
  };

  const userRequests = useMemo(() => {
    return serviceRequests.filter(r => {
        let passPrivacy = true;
        if (!isMasterAdmin && activeRole === UserRole.USER) {
            const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
            passPrivacy = (r.costCenter || '').toUpperCase() === userCC;
        }
        if (!passPrivacy) return false;

        const matchEvent = !filterState.eventNumber || r.code.includes(filterState.eventNumber);
        const matchVehicle = !filterState.vehicle || r.vehiclePlate.toUpperCase().includes(filterState.vehicle.toUpperCase());
        const matchType = !filterState.serviceType || r.specificType === filterState.serviceType;
        const matchLocation = !filterState.location || r.location.toUpperCase().includes(filterState.location.toUpperCase());
        const matchStatus = !filterState.status || r.stage === filterState.status;

        let matchDates = true;
        const reqDate = parseISO(r.createdAt);
        if (filterState.startDate && filterState.endDate) {
            matchDates = isWithinInterval(reqDate, {
                start: startOfDay(parseISO(filterState.startDate)),
                end: endOfDay(parseISO(filterState.endDate))
            });
        }

        return matchEvent && matchVehicle && matchType && matchLocation && matchStatus && matchDates;
    });
  }, [serviceRequests, activeRole, user, isMasterAdmin, filterState]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    return vehicles.filter(v => {
        const matchesQuery = query === '' || (v.plate || '').toUpperCase().includes(query);
        if (isMasterAdmin) return matchesQuery;
        if (activeRole === UserRole.USER) {
            const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
            return matchesQuery && (v.costCenter || '').toUpperCase() === userCC;
        }
        return matchesQuery;
    }).slice(0, 8);
  }, [vehicles, searchQuery, activeRole, user, isMasterAdmin]);

  const specificOptions = useMemo(() => {
    if (!mainCategory) return [];
    if (mainCategory === 'MANTENIMIENTO') return ['CORRECTIVO', 'PREVENTIVO', 'CORRECTIVO-CONCESIONARIO OFICIAL'];
    if (mainCategory === 'COMPRAS') return ['COMPRA DE COMPONENTES', 'COMPRA DE ACCESORIOS'];
    if (mainCategory === 'SERVICIO') return ['ALQUILER DE VEHÍCULOS', 'ASISTENCIA MÓVIL', 'DESINFECCIÓN', 'GESTORA', 'GOMERÍA', 'GPS', 'LAVADO', 'LOGÍSTICA', 'SEGURO', 'SINIESTRO', 'VTV', 'INFRACCIONES', 'TRASLADO'];
    return [];
  }, [mainCategory]);

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = async () => {
            const content = reader.result as string;
            const finalUrl = isImage ? await compressImage(content) : content;
            setAttachments(prev => [...prev, {
                id: `ATT-${Date.now()}-${Math.random()}`,
                name: file.name,
                url: finalUrl,
                type: isImage ? 'image' : 'file',
                fileType: file.type
            }]);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const submitRequest = () => {
    const newErrors: Record<string, boolean> = {};
    if (!mainCategory) newErrors.mainCategory = true;
    if (!specificType) newErrors.specificType = true;
    if (!descriptionValue || descriptionValue.trim().length < 10) newErrors.description = true;
    if (!location || !location.trim()) newErrors.location = true;
    
    if (selectedVehicle && odometer < selectedVehicle.currentKm) {
        newErrors.odometer = true;
        addNotification(`El KM no puede ser menor al actual (${selectedVehicle.currentKm.toLocaleString()} KM)`, "error");
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        addNotification("Por favor, complete todos los campos obligatorios correctamente", "warning");
        return;
    }

    setIsSubmitting(true);
    const eventCode = `EV-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReq: ServiceRequest = {
        id: `SR-${Date.now()}`,
        code: eventCode,
        vehiclePlate: selectedVehicle.plate,
        userId: user?.id || 'sys',
        userName: `${user?.nombre || ''} ${user?.apellido || ''}`,
        userEmail: user?.email || '',
        userPhone: user?.telefono || '',
        costCenter: selectedVehicle.costCenter,
        stage: ServiceStage.REQUESTED,
        mainCategory: mainCategory!,
        specificType,
        description: descriptionValue,
        location,
        odometerAtRequest: odometer,
        suggestedDates: [],
        attachments: attachments, 
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
    setDescriptionValue('');
    setLocation('');
    setOdometer(0);
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

  const handleConfirmTurnAssignment = () => {
    if (!currentRequest) return;
    const turnData: SuggestedDate = {
        id: `TURN-${Date.now()}`,
        fecha: turnDate,
        hora: turnTime,
        turno: turnShift,
        nombreTaller: workshopName,
        direccionTaller: workshopAddress,
        mapUrl: workshopCoords,
        comentarios: turnComments
    };
    const updatedRequest: ServiceRequest = {
        ...currentRequest,
        stage: ServiceStage.SCHEDULING,
        location: workshopAddress,
        suggestedDates: [turnData],
        updatedAt: new Date().toISOString(),
        history: [...(currentRequest.history || []), { id: `HIST-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'sys', userName: user?.nombre || 'Supervisor', fromStage: currentRequest.stage, toStage: ServiceStage.SCHEDULING, comment: `Turno asignado en ${workshopName || 'Taller'} (${turnTime}hs).` }]
    };
    updateServiceRequest(updatedRequest);
    addNotification("Turno asignado correctamente", "success");
    setActiveView('DETAIL');
  };

  const handleConfirmFinish = () => {
    if (!currentRequest || !finishComment.trim()) {
        addNotification("Indique una observación de cierre", "error");
        return;
    }
    updateServiceStage(currentRequest.id, ServiceStage.FINISHED, finishComment);
    addNotification("Gestión finalizada exitosamente", "success");
    setIsFinishing(false);
    setFinishComment('');
  };

  const getStageBadgeStyles = (stage: ServiceStage) => {
    switch (stage) {
      case ServiceStage.FINISHED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ServiceStage.CANCELLED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case ServiceStage.SCHEDULING:
      case ServiceStage.APPOINTMENT_REQUESTED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ServiceStage.REQUESTED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ServiceStage.RECEPCION: return 'bg-indigo-50 text-indigo-600 border-indigo-100'; 
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const resetFilters = () => {
    setFilterState({ eventNumber: '', vehicle: '', serviceType: '', location: '', status: '', startDate: '', endDate: '' });
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      {/* MOD: 2024-05-24 23:50 - Ventana emergente para previsualización de PDF */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[2100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12 animate-fadeIn">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden border-t-[12px] border-indigo-600">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><LucideFileSearch size={28}/></div>
                        <div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Previsualización de Auditoría</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Validez Legal del Registro de Campo</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                if (lastChecklist) downloadChecklistPDF(lastChecklist);
                            }}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <LucideDownload size={18}/> Descargar PDF
                        </button>
                        <button onClick={() => setPdfPreviewUrl(null)} className="p-4 bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl"><LucideX size={24}/></button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 p-8">
                    <iframe src={pdfPreviewUrl} className="w-full h-full rounded-[2.5rem] shadow-inner border border-slate-200 bg-white" title="PDF Preview" />
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-center shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">FleetPro Enterprise Document Viewer v19.3.0</p>
                </div>
            </div>
        </div>
      )}

      {isAdminSession && (
        <div className="bg-slate-900 px-8 py-3 flex items-center justify-between border-b border-white/5 sticky top-0 z-[100] shadow-2xl">
            <div className="flex items-center gap-4">
                <LucideShield className="text-blue-50" size={18}/>
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
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
                    <div className="p-6 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">
                                {Object.values(filterState).filter(v => v !== '').length}
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic mr-4">Filtros Avanzados</h3>
                            <div className="flex gap-2 flex-wrap">
                                {filterState.startDate && <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2">Desde {format(parseISO(filterState.startDate), 'dd/MM/yy')} <button onClick={() => setFilterState({...filterState, startDate: ''})}><LucideX size={12}/></button></span>}
                                {filterState.endDate && <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2">Hasta {format(parseISO(filterState.endDate), 'dd/MM/yy')} <button onClick={() => setFilterState({...filterState, endDate: ''})}><LucideX size={12}/></button></span>}
                            </div>
                        </div>
                        <button onClick={() => setFiltersOpen(!filtersOpen)} className={`p-3 rounded-xl transition-all ${filtersOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>
                            {filtersOpen ? <LucideChevronUp size={24}/> : <LucideChevronDown size={24}/>}
                        </button>
                    </div>

                    {filtersOpen && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 space-y-10 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Evento</label><input type="text" placeholder="Solo números" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none" value={filterState.eventNumber} onChange={e => setFilterState({...filterState, eventNumber: e.target.value})}/></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad</label><input type="text" placeholder="Ingrese patente" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none uppercase" value={filterState.vehicle} onChange={e => setFilterState({...filterState, vehicle: e.target.value})}/></div>
                                <div className="lg:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Solicitud</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="date" className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none" value={filterState.startDate} onChange={e => setFilterState({...filterState, startDate: e.target.value})} />
                                        <input type="date" className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none" value={filterState.endDate} onChange={e => setFilterState({...filterState, endDate: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4"><button onClick={resetFilters} className="px-8 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-black uppercase text-[10px]">Limpiar</button><button onClick={() => setFiltersOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px]">Aplicar</button></div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-[0.2em]">Resultados de Gestión</h3>
                            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">{userRequests.length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-8 py-6">Evento</th>
                                    <th className="px-8 py-6">Unidad</th>
                                    <th className="px-8 py-6">Fecha</th>
                                    <th className="px-8 py-6">Tipo</th>
                                    <th className="px-8 py-6">Localidad</th>
                                    <th className="px-8 py-6">Situación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {userRequests.map(req => (
                                    <tr key={req.id} onClick={() => { setSelectedReqId(req.id); setActiveView('DETAIL'); }} className="group hover:bg-blue-50/50 transition-all cursor-pointer">
                                        <td className="px-8 py-6"><span className="text-sm font-black text-slate-700 italic">{req.code.replace('EV-', '')}</span></td>
                                        <td className="px-8 py-6"><span className="text-sm font-black text-slate-700 uppercase">{req.vehiclePlate}</span></td>
                                        <td className="px-8 py-6"><span className="text-xs font-bold text-slate-500 uppercase">{format(parseISO(req.createdAt), 'dd/MM/yyyy')}</span></td>
                                        <td className="px-8 py-6"><span className="text-xs font-bold text-slate-600 uppercase truncate max-w-[200px] block">{req.specificType}</span></td>
                                        <td className="px-8 py-6"><span className="text-xs font-bold text-slate-600 uppercase">{req.location}</span></td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStageBadgeStyles(req.stage)}`}>{req.stage}</span>
                                                    {req.isDialogueOpen && (
                                                        <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg animate-pulse ring-4 ring-blue-50"><LucideMessageCircle size={12} /></div>
                                                    )}
                                                </div>
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
          </div>
        )}

        {/* ASIGNACIÓN DE TURNO TÉCNICA */}
        {activeView === 'ASSIGN_TURN' && currentRequest && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveView('DETAIL')} className="p-5 bg-white rounded-3xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={32}/></button>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Asignación de Turno Profesional</h2>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Evento: {currentRequest.code} • {currentRequest.vehiclePlate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Fecha de Cita</label>
                                    <input type="date" min={todayStr} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-xl outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={turnDate} onChange={e => setTurnDate(e.target.value)} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Hora del Turno</label>
                                    <input type="time" className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-xl outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={turnTime} onChange={e => setTurnTime(e.target.value)} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Franja Horaria</label>
                                    <div className="grid grid-cols-2 gap-2 h-[68px]">
                                        {['MAÑANA', 'TARDE'].map((shift: any) => (
                                            <button key={shift} onClick={() => setTurnShift(shift)} className={`rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all ${turnShift === shift ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{shift}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10 border-t pt-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Nombre del Taller</label>
                                        <input type="text" placeholder="Ej: Concesionario Oficial XYZ..." className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-sm uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={workshopName} onChange={e => setWorkshopName(e.target.value.toUpperCase())} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Dirección Exacta</label>
                                        <input type="text" placeholder="Calle, Altura, Ciudad..." className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-sm uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={workshopAddress} onChange={e => setWorkshopAddress(e.target.value.toUpperCase())} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center ml-6">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Ubicación Google Maps (GPS)</label>
                                        <button onClick={handleGetGPS} disabled={gpsLoading} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50">
                                            {gpsLoading ? <LucideRefreshCcw className="animate-spin" size={14}/> : <LucideLocate size={14}/>} Capturar GPS Actual
                                        </button>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <input type="text" placeholder="Coordenadas o Link de Maps..." className="flex-1 px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-xs text-blue-600 outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={workshopCoords} onChange={e => setWorkshopCoords(e.target.value)} />
                                        <div className="flex-1 aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative group">
                                            {(workshopCoords || workshopAddress) ? (
                                                <iframe 
                                                    width="100%" 
                                                    height="100%" 
                                                    frameBorder="0" 
                                                    scrolling="no" 
                                                    marginHeight={0} 
                                                    marginWidth={0} 
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(workshopCoords || workshopAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                                    title="Vista Mapa"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                                    <LucideNavigation2 size={40} className="mb-2 opacity-20"/>
                                                    <p className="text-[8px] font-black uppercase tracking-widest">Mapa no disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-6">
                            <h4 className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-3"><LucideMessageSquare className="text-blue-600"/> Comentarios Técnicos</h4>
                            <textarea rows={8} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm text-slate-700 outline-none focus:ring-8 focus:ring-blue-50 transition-all resize-none shadow-inner" placeholder="Indicaciones opcionales para el chofer..." value={turnComments} onChange={e => setTurnComments(e.target.value)} />
                        </div>

                        <button onClick={handleConfirmTurnAssignment} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
                            <LucideCheckCircle2 size={32}/> Confirmar Turno
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* VISTA DE NUEVA GESTIÓN (RESTAURADO CON VALIDACIONES) */}
        {activeView === 'NEW_REQUEST' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
             <div className="flex items-center gap-6">
                <button onClick={() => setActiveView('DASHBOARD')} className="p-5 bg-white rounded-3xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={32}/></button>
                <div>
                   <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Nueva Gestión de Unidad</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Paso {requestStep} de 2: Relevamiento Operativo</p>
                </div>
             </div>

             {requestStep === 1 ? (
                <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-100 space-y-12 animate-fadeIn max-w-2xl mx-auto">
                    <div className="space-y-4 relative">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-6">Buscador de Unidad</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Escriba patente..." 
                                className="w-full px-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] font-black text-4xl uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all"
                                value={searchQuery}
                                onFocus={() => setShowVehicleSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 200)}
                                onChange={e => { setSearchQuery(e.target.value); if (selectedVehicle) setSelectedVehicle(null); }}
                            />
                            {showVehicleSuggestions && !selectedVehicle && filteredVehicles.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[3rem] shadow-2xl border border-slate-100 z-[500] overflow-hidden animate-fadeIn">
                                    {filteredVehicles.map(v => (
                                        <div key={v.plate} onClick={() => { setSelectedVehicle(v); setOdometer(v.currentKm); setSearchQuery(v.plate); setShowVehicleSuggestions(false); }} className="p-8 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-50 group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 transition-all">{v.plate.substring(0,2)}</div>
                                                <div><p className="font-black text-3xl italic text-slate-800 uppercase">{v.plate}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{v.make} {v.model}</p></div>
                                            </div>
                                            <LucideArrowRight size={32} className="text-slate-200 group-hover:text-blue-600 transition-all"/>
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
                                <h4 className="text-5xl font-black italic uppercase leading-none mb-2">{selectedVehicle.plate}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase">{selectedVehicle.make} {selectedVehicle.model}</p>
                            </div>
                           <button onClick={() => setSelectedVehicle(null)} className="absolute top-10 right-10 z-10 p-5 bg-white/10 rounded-3xl hover:bg-rose-600 transition-all text-white"><LucideRefreshCcw size={20}/></button>
                        </div>
                        <button onClick={() => setRequestStep(2)} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4">Continuar <LucideChevronRight size={28}/></button>
                      </div>
                    )}
                </div>
             ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn pb-32">
                   <div className="lg:col-span-2 space-y-12">
                      <div className={`bg-white p-12 rounded-[4rem] shadow-2xl border ${Object.keys(errors).length > 0 ? 'border-rose-300' : 'border-slate-100'} space-y-12`}>
                         <div className="space-y-12">
                            <div className="space-y-6">
                               <div className="flex justify-between items-center ml-6">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría de Gestión</label>
                                  {errors.mainCategory && <span className="text-[9px] font-black text-rose-500 uppercase italic">Requerido</span>}
                               </div>
                               <div className="grid grid-cols-3 gap-6">
                                  {['MANTENIMIENTO', 'SERVICIO', 'COMPRAS'].map((cat: any) => (
                                    <button key={cat} onClick={() => { setMainCategory(cat); setSpecificType(''); setErrors(prev => ({...prev, mainCategory: false})); }} className={`py-8 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex flex-col items-center gap-4 border-2 ${mainCategory === cat ? 'bg-blue-600 text-white border-blue-500 shadow-blue-100' : (errors.mainCategory ? 'bg-rose-50 border-rose-200 text-rose-300' : 'bg-slate-50 text-slate-400 border-slate-100')}`}>
                                      {cat === 'MANTENIMIENTO' ? <LucideWrench size={24}/> : cat === 'SERVICIO' ? <LucideSmartphone size={24}/> : <LucideShoppingBag size={24}/>} {cat}
                                    </button>
                                  ))}
                               </div>
                            </div>
                            {mainCategory && (
                                <div className="space-y-4 animate-fadeIn">
                                   <div className="flex justify-between items-center ml-6">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo Específico</label>
                                      {errors.specificType && <span className="text-[9px] font-black text-rose-500 uppercase italic">Seleccione una opción</span>}
                                   </div>
                                   <select className={`w-full px-8 py-6 rounded-[2rem] border font-black text-sm uppercase outline-none transition-all focus:ring-8 focus:ring-blue-50 ${errors.specificType ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`} value={specificType} onChange={e => { setSpecificType(e.target.value); setErrors(prev => ({...prev, specificType: false})); }}>
                                      <option value="">Seleccione el tipo...</option>
                                      {specificOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-4">
                               <div className="flex justify-between items-center ml-6">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción de Necesidad Técnica</label>
                                  {errors.description && <span className="text-[9px] font-black text-rose-500 uppercase italic">Mínimo 10 caracteres</span>}
                               </div>
                               <textarea rows={5} className={`w-full p-10 rounded-[3.5rem] border font-bold text-base outline-none transition-all shadow-inner resize-none focus:ring-8 focus:ring-blue-50 ${errors.description ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`} placeholder="Escriba aquí los detalles..." value={descriptionValue} onChange={e => { setDescriptionValue(e.target.value); if(e.target.value.length >= 10) setErrors(prev => ({...prev, description: false})); }} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center ml-6">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localidad / Obrador</label>
                                     {errors.location && <span className="text-[9px] font-black text-rose-500 uppercase italic">Campo obligatorio</span>}
                                  </div>
                                  <input className={`w-full px-8 py-6 rounded-[2rem] border font-black text-xs uppercase outline-none transition-all focus:bg-white focus:border-blue-200 ${errors.location ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`} placeholder="Lugar de la unidad..." value={location} onChange={e => { setLocation(e.target.value); setErrors(prev => ({...prev, location: false})); }} />
                               </div>
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center ml-6">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kilometraje Registrado</label>
                                     {errors.odometer && <span className="text-[9px] font-black text-rose-500 uppercase italic">Inválido (Mín: {selectedVehicle?.currentKm.toLocaleString()})</span>}
                                  </div>
                                  <input type="number" onFocus={(e) => e.target.select()} className={`w-full px-8 py-6 rounded-[2rem] border font-black text-3xl outline-none transition-all focus:bg-white ${errors.odometer ? 'border-rose-500 bg-rose-50 text-rose-600' : 'bg-slate-50 border-slate-100'}`} value={odometer || ''} onChange={e => { setOdometer(Number(e.target.value)); if(Number(e.target.value) >= (selectedVehicle?.currentKm || 0)) setErrors(prev => ({...prev, odometer: false})); }} />
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-8">
                         <button onClick={() => setRequestStep(1)} className="flex-1 py-8 bg-white border-2 border-slate-200 rounded-[2.5rem] font-black uppercase text-xs text-slate-400 hover:bg-slate-50 transition-all">Regresar</button>
                         <button onClick={submitRequest} disabled={isSubmitting} className="flex-[2] py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-6">{isSubmitting ? <LucideRefreshCcw className="animate-spin" size={32}/> : <LucideCheckCircle2 size={32}/>} Confirmar y Enviar</button>
                      </div>
                   </div>
                   
                   {/* SIDEBAR DERECHO - DATOS VINCULADOS */}
                   <div className="lg:col-span-1 space-y-10">
                      <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-100 space-y-10 sticky top-28">
                         {/* BURBUJA ACTIVO */}
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-2"><LucideCar size={16} className="text-blue-500"/> Activo Vinculado</h5>
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl border-4 border-slate-800 relative overflow-hidden group">
                                <p className="text-4xl font-black italic uppercase leading-none mb-3 relative z-10">{selectedVehicle?.plate}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase relative z-10">{selectedVehicle?.make} {selectedVehicle?.model}</p>
                                <LucideCar className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700" size={140}/>
                            </div>
                         </div>

                         {/* BURBUJA SOLICITANTE */}
                         <div className="space-y-6 border-t pt-8">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-2"><LucideUser size={16} className="text-blue-500"/> Datos del Solicitante</h5>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100"><LucideUser size={24}/></div>
                                    <div><p className="text-sm font-black text-slate-800 uppercase italic leading-none">{user?.nombre} {user?.apellido}</p><p className="text-[9px] font-black text-blue-500 uppercase mt-1">Usuario en Sesión</p></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500"><LucideMail size={14} className="text-slate-300"/><span className="text-[10px] font-bold truncate">{user?.email}</span></div>
                                    <div className="flex items-center gap-3 text-slate-500"><LucideSmartphone size={14} className="text-slate-300"/><span className="text-[10px] font-bold">{user?.telefono || 'Sin Teléfono'}</span></div>
                                    <div className="flex items-center gap-3 text-slate-500"><LucideBuilding2 size={14} className="text-slate-300"/><span className="text-[10px] font-black text-slate-700 uppercase">{user?.centroCosto?.nombre || user?.costCenter || 'DIRECCIÓN'}</span></div>
                                </div>
                            </div>
                         </div>

                         {/* BURBUJA DE ADJUNTOS EN CARGA */}
                         <div className="space-y-6 border-t pt-8">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-2"><LucidePaperclip size={16} className="text-blue-500"/> Documentación de Respaldo</h5>
                            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all group">
                                        <LucideCamera size={20} className="text-slate-400 group-hover:text-blue-600 mb-1"/>
                                        <span className="text-[8px] font-black uppercase text-slate-500">Cargar Foto</span>
                                        <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handleAttachmentUpload(e, true)} />
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all group">
                                        <LucideFilePlus size={20} className="text-slate-400 group-hover:text-blue-600 mb-1"/>
                                        <span className="text-[8px] font-black uppercase text-slate-500">Adjuntar Archivo</span>
                                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={(e) => handleAttachmentUpload(e, false)} />
                                    </label>
                                </div>
                                
                                {attachments.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Archivos Seleccionados ({attachments.length})</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {attachments.map(att => (
                                                <div key={att.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                    {att.type === 'image' ? (
                                                        <img src={att.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                                            {att.fileType.includes('pdf') ? <LucideFileText size={18}/> : <LucideFileSpreadsheet size={18}/>}
                                                        </div>
                                                    )}
                                                    <button onClick={() => removeAttachment(att.id)} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <LucideTrash2 size={16}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* DETALLE DE GESTIÓN */}
        {activeView === 'DETAIL' && currentRequest && (
           <div className="space-y-12 animate-fadeIn pb-32">
              <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="flex items-center gap-10">
                    <button onClick={() => setActiveView('DASHBOARD')} className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 text-slate-400 transition-all shadow-sm active:scale-95"><LucideArrowLeft size={40}/></button>
                    <div><p className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em] mb-3">{currentRequest.code}</p><h3 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{currentRequest.vehiclePlate}</h3></div>
                 </div>
                 <span className={`px-14 py-8 rounded-[2.5rem] border-4 font-black uppercase text-sm tracking-[0.2em] shadow-3xl ${getStageBadgeStyles(currentRequest.stage)}`}>{currentRequest.stage}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-3xl p-8 space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><LucideHistory size={20}/></div><h5 className="text-base font-black text-slate-800 uppercase italic leading-none">Historial</h5></div>
                        <div className="space-y-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {currentRequest.history?.map((h: any) => (<div key={h.id} className="flex gap-4 group relative"><div className="flex flex-col items-center"><div className="w-1 bg-blue-100 flex-1 rounded-full group-hover:bg-blue-600 transition-all"></div><div className="w-3 h-3 rounded-full border-2 border-white bg-blue-600 shadow-md absolute -left-1 top-0"></div></div><div className="pb-6"><p className="text-[9px] font-black text-slate-800 uppercase italic leading-tight">{h.comment}</p><p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{h.userName} • {format(parseISO(h.date), 'dd/MM HH:mm')}hs</p></div></div>))}
                        </div>
                    </div>
                 </div>

                 <div className="lg:col-span-9 space-y-12">
                    {/* TURNO ASIGNADO DETALLADO */}
                    {currentRequest.stage === ServiceStage.SCHEDULING && currentRequest.suggestedDates && currentRequest.suggestedDates.length > 0 && (
                        <div className="bg-amber-50 border-4 border-amber-400 p-10 rounded-[4rem] shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-amber-500 text-white rounded-[2rem] shadow-lg"><LucideMapPinCheck size={32}/></div>
                                    <div>
                                        <h4 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter">Turno Técnico Confirmado</h4>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Hoja de Ruta para Presentación</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-amber-500 uppercase">Hora de Cita</p>
                                    <p className="text-3xl font-black text-amber-900 italic uppercase">{currentRequest.suggestedDates[0]?.hora || 'S/H'} HS</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-6">
                                    <div className="p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-amber-200 shadow-inner flex items-center gap-6">
                                        <LucideCalendarDays size={36} className="text-amber-600"/>
                                        <div>
                                            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Día de Presentación</p>
                                            <p className="text-xl font-black text-amber-900 uppercase">{format(parseISO(currentRequest.suggestedDates[0].fecha), "eeee dd 'de' MMMM", {locale: es})}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-amber-200 shadow-inner space-y-4">
                                        <div className="flex items-center gap-6">
                                            <LucideBuilding2 size={36} className="text-amber-600"/>
                                            <div>
                                                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Establecimiento / Taller</p>
                                                <p className="text-xl font-black text-amber-900 uppercase">{currentRequest.suggestedDates[0].nombreTaller || 'TALLER NO DEFINIDO'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 pt-4 border-t border-amber-100/50">
                                            <LucideMapPin size={24} className="text-amber-400"/>
                                            <div>
                                                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Dirección</p>
                                                <p className="text-xs font-black text-amber-800 uppercase">{currentRequest.suggestedDates[0].direccionTaller || 'SIN DIRECCIÓN'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {currentRequest.suggestedDates[0].mapUrl && (
                                        <div className="aspect-video bg-white rounded-[3rem] overflow-hidden border-4 border-white shadow-xl relative group">
                                            <iframe 
                                                width="100%" 
                                                height="100%" 
                                                frameBorder="0" 
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(currentRequest.suggestedDates[0].mapUrl)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                                title="Map"
                                            />
                                        </div>
                                    )}
                                    {currentRequest.suggestedDates[0].comentarios && (
                                        <div className="p-8 bg-amber-900/5 rounded-[3rem] border border-amber-200/50 italic font-bold text-amber-900 text-xs leading-relaxed">
                                            <p className="text-[8px] font-black uppercase text-amber-500 mb-2 not-italic">Notas del Supervisor:</p>
                                            "{currentRequest.suggestedDates[0].comentarios}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeRole === UserRole.SUPERVISOR || activeRole === UserRole.ADMIN) && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED) && (
                      <div className="bg-slate-950 p-12 rounded-[4.5rem] text-white space-y-12 shadow-3xl border border-white/5 relative overflow-hidden animate-fadeIn">
                         <div className="flex items-center gap-8 relative z-10"><div className="p-6 bg-blue-600 rounded-[2rem] shadow-2xl transform -rotate-3"><LucideShield size={40}/></div><div><h4 className="text-4xl font-black uppercase italic tracking-tighter">Consola Regional de Flota</h4></div></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <button onClick={() => updateServiceRequest({ ...currentRequest, isDialogueOpen: !currentRequest.isDialogueOpen })} className={`py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-6 shadow-2xl ${currentRequest.isDialogueOpen ? 'bg-amber-600 shadow-amber-900/40 hover:bg-amber-700' : 'bg-blue-600 shadow-blue-900/40 hover:bg-blue-700'}`}>
                               {currentRequest.isDialogueOpen ? <LucideLock size={28}/> : <LucideMessageCircle size={28}/>} 
                               {currentRequest.isDialogueOpen ? 'Cerrar Mesa de Diálogo' : 'Habilitar Mesa de Diálogo'}
                            </button>
                            {!isFinishing ? (
                                <button onClick={() => setIsFinishing(true)} className="w-full h-full py-8 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-emerald-700 flex items-center justify-center gap-6 transition-all">
                                    <LucideCheckCircle2 size={28}/> Finalizar Gestión</button>
                            ) : (
                                <div className="bg-slate-900 p-6 rounded-[2.5rem] border-2 border-emerald-500 shadow-2xl space-y-6 animate-fadeIn">
                                    <textarea rows={2} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-emerald-500 resize-none" placeholder="Escriba la observación final..." value={finishComment} onChange={e => setFinishComment(e.target.value)} />
                                    <button onClick={handleConfirmFinish} disabled={!finishComment.trim()} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg"><LucideCheck size={16}/> Confirmar Cierre</button>
                                </div>
                            )}
                         </div>

                         {/* MESA DE DIÁLOGO INTERNA */}
                         {currentRequest.isDialogueOpen && (
                            <div className="bg-white rounded-[3rem] border border-white/10 shadow-3xl flex flex-col h-[500px] overflow-hidden mt-8 animate-fadeIn">
                                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#f8f9fc]/50">
                                    {currentRequest.messages.map(m => (
                                        <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                            <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-xl border-2 ${m.userId === user?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'}`}>
                                                <p className="text-[9px] font-black uppercase opacity-60 mb-2">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}hs</p>
                                                <p className="text-[12px] font-bold italic leading-relaxed">"{m.text}"</p>
                                            </div>
                                        </div>
                                    ))}
                                    {currentRequest.messages.length === 0 && <div className="h-full flex items-center justify-center opacity-20"><LucideSend size={40}/></div>}
                                </div>
                                <div className="p-8 border-t bg-white">
                                    <div className="relative group">
                                        <textarea rows={1} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-full font-bold text-xs outline-none shadow-inner resize-none text-slate-700 pr-20" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                                        <button onClick={handleSendMessage} className="absolute right-2 bottom-2 w-12 h-12 bg-blue-600 text-white rounded-full shadow-3xl flex items-center justify-center transition-all hover:scale-110 active:scale-90"><LucideSend size={20}/></button>
                                    </div>
                                </div>
                            </div>
                         )}

                         <div className="pt-10 relative z-10 space-y-6 border-t border-white/5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-8">Modificar Etapa Operativa</label>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <select 
                                        className="w-full bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] outline-none focus:border-blue-500 appearance-none cursor-pointer text-blue-400" 
                                        value={pendingStage || currentRequest.stage} 
                                        onChange={e => {
                                            const val = e.target.value as ServiceStage;
                                            setPendingStage(val);
                                            // MOD: 2024-05-24 23:45 - Automatización de selección de Solicitando Turno
                                            if (val === ServiceStage.APPOINTMENT_REQUESTED) {
                                                updateServiceStage(currentRequest.id, val, 'Pase automático a solicitud de turno.');
                                                addNotification("Estado actualizado a SOLICITANDO TURNO", "success");
                                            }
                                        }}
                                    >
                                        {/* MOD: 2024-05-24 23:45 - Inclusión de RECEPCIÓN y filtrado de TURNO ASIGNADO */}
                                        {Object.values(ServiceStage)
                                            .filter(s => s !== ServiceStage.SCHEDULING)
                                            .map(s => (
                                                <option key={s} value={s} className="bg-slate-900">
                                                    {s === ServiceStage.APPOINTMENT_REQUESTED ? 'SOLICITANDO TURNO' : s}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <LucideChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 text-white opacity-20 pointer-events-none" size={32}/>
                                </div>
                                
                                {pendingStage && pendingStage !== currentRequest.stage && pendingStage !== ServiceStage.APPOINTMENT_REQUESTED && pendingStage !== ServiceStage.RECEPCION && (
                                    <button onClick={() => { updateServiceStage(currentRequest.id, pendingStage, 'Cambio manual'); addNotification(`Etapa actualizada a ${pendingStage}`, "success"); }} className="px-10 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-4 animate-fadeIn"><LucideCheck size={24}/> Confirmar</button> // MOD: 2024-05-24 23:45
                                )}

                                {/* MOD: 2024-05-24 21:00 - Botón específico para ingresar datos de turno técnico */}
                                {currentRequest.stage === ServiceStage.APPOINTMENT_REQUESTED && (
                                    <button onClick={() => setActiveView('ASSIGN_TURN')} className="px-10 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 animate-fadeIn"><LucideCalendarDays size={24}/> Ingresar Datos de Turno</button>
                                )}
                            </div>

                            {/* MOD: 2024-05-24 23:45 - VISTA DE VALIDACIÓN PARA RECEPCIÓN ACTUALIZADA */}
                            {pendingStage === ServiceStage.RECEPCION && (
                                <div className="mt-8 p-10 bg-slate-900 rounded-[3rem] border border-indigo-500/30 animate-fadeIn space-y-8 relative overflow-hidden">
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><LucideClipboardList size={28}/></div>
                                        <div>
                                            <h5 className="text-xl font-black uppercase italic tracking-tighter text-white">Validación de Recepción</h5>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Sincronización con Auditoría de Campo</p>
                                        </div>
                                    </div>

                                    {lastChecklist ? (
                                        <div className="space-y-6 relative z-10">
                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Último Registro de Inspección</p>
                                                    <p className="text-sm font-black text-white uppercase italic mt-1">
                                                        {format(parseISO(lastChecklist.date), "dd 'de' MMMM, HH:mm'hs'", { locale: es })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {/* MOD: 2024-05-24 23:50 - Botón mejorado para previsualizar PDF */}
                                                    <button 
                                                        onClick={() => handlePreviewPDF(lastChecklist)}
                                                        className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                                    >
                                                        <LucideFileSearch size={14}/> Ver PDF del Registro
                                                    </button>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center ${isChecklistToday ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600 text-white animate-pulse'}`}>
                                                        {isChecklistToday ? 'REGISTRO ACTUALIZADO' : 'REGISTRO DESACTUALIZADO'}
                                                    </div>
                                                </div>
                                            </div>

                                            {!isChecklistToday ? (
                                                <div className="p-6 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl space-y-4 animate-fadeIn">
                                                    <div className="flex items-center gap-3 text-rose-400">
                                                        <LucideAlertCircle size={20}/>
                                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                                            El registro no está actualizado al momento de la recepción.<br/>
                                                            Debe realizar la inspección de manera obligatoria para continuar.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate(`/checklist?plate=${currentRequest.vehiclePlate}`)}
                                                        className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <LucideClipboardList size={16}/> Realizar Inspección Ahora
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl space-y-6 animate-fadeIn">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase text-center tracking-widest">
                                                        ¿Es este el último registro al momento de la recepción/entrega?
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={() => {
                                                                updateServiceStage(currentRequest.id, ServiceStage.RECEPCION, 'Unidad recibida con inspección validada.');
                                                                addNotification("Unidad recibida correctamente", "success");
                                                            }}
                                                            className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <LucideCheck size={16}/> Sí, Continuar
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/checklist?plate=${currentRequest.vehiclePlate}`)}
                                                            className="flex-1 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <LucideRefreshCcw size={16}/> Actualizar Registro
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-800 rounded-2xl border border-white/5 text-center space-y-4 relative z-10 animate-fadeIn">
                                            <LucideAlertTriangle className="mx-auto text-amber-500" size={32}/>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No existen registros previos para esta unidad.</p>
                                            <button 
                                                onClick={() => navigate(`/checklist?plate=${currentRequest.vehiclePlate}`)}
                                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all"
                                            >
                                                Iniciar Primera Inspección
                                            </button>
                                        </div>
                                    )}
                                    <LucideShield className="absolute -right-12 -bottom-12 opacity-5 text-indigo-500" size={240}/>
                                </div>
                            )}
                         </div>
                      </div>
                    )}

                    {(activeRole === UserRole.USER || currentRequest.stage === ServiceStage.FINISHED || currentRequest.stage === ServiceStage.CANCELLED) && (
                        <div className={`bg-white rounded-[4.5rem] border border-slate-100 shadow-3xl flex flex-col h-[600px] overflow-hidden transition-all duration-1000 ${!currentRequest.isDialogueOpen && activeRole === UserRole.USER ? 'opacity-30 grayscale pointer-events-none shadow-none scale-95 blur-md' : ''}`}>
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                                <div className="flex items-center gap-6">
                                    <div className={`p-6 rounded-[2.2rem] shadow-2xl transition-all duration-700 ${currentRequest.isDialogueOpen ? 'bg-blue-600 text-white rotate-6' : 'bg-slate-300 text-slate-100'}`}><LucideMessageCircle size={32}/></div>
                                    <h5 className="text-xl font-black text-slate-800 uppercase italic leading-none">Mesa de Diálogo</h5>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#f8f9fc]/50 relative">
                                {!currentRequest.isDialogueOpen && (<div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-12 space-y-6 bg-slate-50/10 backdrop-blur-sm animate-fadeIn"><div className="p-8 bg-white rounded-full text-slate-300 shadow-xl border border-slate-100"><LucideLockKeyhole size={64}/></div><h4 className="text-xl font-black text-slate-400 uppercase italic">Conexión Restringida</h4></div>)}
                                {currentRequest.messages.map(m => (<div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}><div className={`max-w-[80%] p-8 rounded-[3rem] shadow-xl border-2 transition-all ${m.userId === user?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'}`}><p className="text-[9px] font-black uppercase opacity-60 mb-4 tracking-[0.2em] flex items-center gap-3">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}hs</p><p className="text-base font-bold italic leading-relaxed">"{m.text}"</p></div></div>))}
                            </div>
                            {(currentRequest.isDialogueOpen && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED)) && (<div className="p-10 border-t bg-white"><div className="relative group"><textarea rows={2} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] font-bold text-base outline-none focus:ring-12 focus:ring-blue-50 focus:border-blue-200 shadow-inner resize-none text-slate-700 transition-all pr-24" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} /><button onClick={handleSendMessage} className="absolute right-4 bottom-4 w-16 h-16 bg-blue-600 text-white rounded-3xl shadow-3xl hover:bg-blue-700 transition-all active:scale-90 flex items-center justify-center"><LucideSend size={28}/></button></div></div>)}
                        </div>
                    )}

                    {/* SECCIÓN DE ADJUNTOS EN DETALLE */}
                    {currentRequest.attachments && currentRequest.attachments.length > 0 && (
                        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 space-y-8 animate-fadeIn">
                             <div className="flex items-center gap-6 border-b border-slate-50 pb-6">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm"><LucidePaperclip size={24}/></div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Documentación de Respaldo</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Evidencia Fotográfica y Adjuntos Técnicos</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {currentRequest.attachments.map((att: any) => (
                                    <div key={att.id} className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 group hover:shadow-xl transition-all">
                                        <div className="aspect-square rounded-2xl overflow-hidden relative mb-4 shadow-inner bg-white">
                                            {att.type === 'image' ? (
                                                <>
                                                    <img src={att.url} className="w-full h-full object-cover" />
                                                    <button onClick={() => setZoomedImage({url: att.url, label: att.name})} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <LucideEye className="text-white" size={24}/>
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-blue-600">
                                                    {att.fileType.includes('pdf') ? <LucideFileText size={48}/> : <LucideFileSpreadsheet size={48}/>}
                                                    <p className="text-[8px] font-black uppercase mt-2 px-4 text-center truncate w-full">{att.name}</p>
                                                </div>
                                            )}
                                        </div>
                                        <a href={att.url} download={att.name} className="w-full py-3 bg-white border border-slate-200 rounded-xl font-black uppercase text-[8px] flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all">
                                            <LucideDownload size={12}/> Descargar
                                        </a>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* RELEVAMIENTO DEL EVENTO */}
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 shadow-sm space-y-12 relative overflow-hidden">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-10">
                            <h4 className="text-3xl font-black text-slate-800 uppercase italic flex items-center gap-6"><LucideInfo className="text-blue-600" size={44}/> Relevamiento del Evento</h4>
                            <span className="px-8 py-3 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic">{currentRequest.specificType}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                            <div className="space-y-10">
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Localidad / Establecimiento</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 uppercase text-base border border-slate-100 flex items-center gap-4"><LucideMapPin size={24} className="text-blue-500"/> {currentRequest.location || 'S/E'}</div></div>
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Fecha Solicitada por Usuario</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 uppercase text-base border border-slate-100 flex items-center gap-4"><LucideCalendarDays size={24} className="text-blue-500"/> {currentRequest.suggestedDates && currentRequest.suggestedDates.length > 0 ? format(parseISO(currentRequest.suggestedDates[0].fecha), 'dd/MM/yyyy') : 'SIN ELECCIÓN'}</div></div>
                            </div>
                            <div className="space-y-10">
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Odómetro Registrado</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-blue-600 text-3xl border border-slate-100 italic tracking-tighter">{currentRequest.odometerAtRequest.toLocaleString()} <span className="text-xs not-italic text-slate-400 font-bold uppercase ml-2">KM</span></div></div>
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Centro de Costo</p><div className="p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 uppercase text-base border border-slate-100 flex items-center gap-4"><LucideBuilding2 size={24} className="text-blue-500"/> {currentRequest.costCenter}</div></div>
                            </div>
                            <div className="space-y-10">
                                <div className="space-y-3"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Contacto Solicitante</p>
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 space-y-4 shadow-xl">
                                        <div className="flex items-center gap-4"><LucideUser className="text-blue-400" size={20}/><p className="text-sm font-black text-white uppercase italic">{currentRequest.userName}</p></div>
                                        <div className="flex items-center gap-4"><LucideMail className="text-slate-500" size={16}/><p className="text-[10px] font-bold text-slate-400 truncate">{currentRequest.userEmail}</p></div>
                                        <div className="flex items-center gap-4"><LucideSmartphone className="text-slate-500" size={16}/><p className="text-[10px] font-bold text-slate-400">{currentRequest.userPhone}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Descripción Técnica de la Necesidad:</p>
                            <div className="p-16 bg-slate-900 text-white rounded-[4rem] italic font-bold text-2xl leading-relaxed shadow-3xl relative overflow-hidden">
                                <span className="relative z-10">"{currentRequest.description}"</span>
                                <LucideMessageCircle className="absolute -right-12 -bottom-12 opacity-5 scale-[2]" size={320}/>
                            </div>
                        </div>
                    </div>

                    {closingObservation && (
                        <div className="bg-emerald-50 border-4 border-emerald-500 p-12 rounded-[4rem] shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
                            <div className="flex items-center gap-6 relative z-10"><div className="p-5 bg-emerald-600 text-white rounded-[2rem] shadow-lg"><LucideShieldCheck size={32}/></div><div><h4 className="text-3xl font-black text-emerald-900 uppercase italic tracking-tighter">Resolución de Gestión</h4><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Dictamen Técnico / Observación de Cierre</p></div></div>
                            <div className="p-10 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-emerald-200 shadow-inner relative z-10"><p className="text-xl font-black text-emerald-950 italic leading-relaxed">"{closingObservation}"</p></div>
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