import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  LucideClock, LucideMapPinCheck, LucideMapPinHouse, LucideLocate, LucideExternalLink, LucideNavigation2,
  LucideFilePlus, LucideFileSpreadsheet, LucideFileWarning,
  LucideClipboardList, LucideAlertCircle, LucideFileDown, LucideFileSearch,
  LucideBriefcase, LucideDollarSign, LucidePlus, LucideFile,
  LucideRefreshCw, LucideGauge, LucideUnlock, LucideNavigation,
  LucideMaximize, LucideFileCheck, LucideUserCheck,
  LucideCpu, LucideLightbulb, LucideLayout, LucideTruck, LucideUnlockKeyhole,
  LucideSave, LucideCalendarClock, LucideImage, LucideFactory,
  LucideMap, LucideActivity
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { 
    ServiceStage, ServiceRequest, UserRole, MainServiceCategory, 
    SuggestedDate, ServiceMessage, Checklist, Vehicle, ServiceHistoryItem
} from '../types';
import { format, parseISO, isBefore, startOfDay, endOfDay, subDays, isWithinInterval, differenceInDays, differenceInHours, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ImageZoomModal } from './ImageZoomModal';
import { compressImage } from '../utils/imageCompressor'; 

type ViewMode = 'DASHBOARD' | 'NEW_REQUEST' | 'DETAIL' | 'ASSIGN_TURN' | 'LOAD_BUDGET';

// --- COMPONENTE: DOSSIER DE ETAPA (MODAL DE REGISTRO HISTÓRICO) ---
const StageRecordModal = ({ 
    item, 
    request, 
    onClose 
}: { 
    item: ServiceHistoryItem, 
    request: ServiceRequest, 
    onClose: () => void 
}) => {
    const stage = item.toStage;
    
    const getStageContent = () => {
        switch(stage) {
            case ServiceStage.REQUESTED:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categoría Principal</p>
                                <p className="text-xs font-black text-slate-700 uppercase italic">{request.mainCategory}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo Específico</p>
                                <p className="text-xs font-black text-slate-700 uppercase italic">{request.specificType}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kilometraje Reportado</p>
                                <p className="text-xs font-black text-slate-700 uppercase italic">{request.odometerAtRequest.toLocaleString()} KM</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                <p className="text-xs font-black text-slate-700 uppercase italic truncate">{request.location}</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Descripción del Problema</p>
                            <p className="text-sm font-bold italic leading-relaxed">"{request.description}"</p>
                        </div>
                        {request.attachments && request.attachments.length > 0 && (
                          <div className="space-y-2">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjuntos del Registro</p>
                             <div className="grid grid-cols-4 gap-2">
                                {request.attachments.map((att, idx) => (
                                  <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                    {att.type.includes('image') ? <img src={att.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><LucideFileText size={20}/></div>}
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                    </div>
                );
            case ServiceStage.SCHEDULING:
                const turn = request.suggestedDates?.[request.suggestedDates.length - 1];
                return turn ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 space-y-4">
                            <div className="flex items-center gap-4 border-b border-amber-200 pb-3">
                                <LucideCalendarClock className="text-amber-600" size={24}/>
                                <h5 className="text-sm font-black text-amber-900 uppercase">Detalles del Turno Asignado</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[8px] font-black text-amber-500 uppercase">Fecha</p><p className="text-xs font-black text-slate-700">{format(parseISO(turn.fecha), 'dd/MM/yyyy')}</p></div>
                                <div><p className="text-[8px] font-black text-amber-500 uppercase">Hora</p><p className="text-xs font-black text-slate-700">{turn.hora} HS</p></div>
                            </div>
                            <div><p className="text-[8px] font-black text-amber-500 uppercase">Taller Receptor</p><p className="text-xs font-black text-slate-700 uppercase italic">{turn.nombreTaller}</p></div>
                            <div><p className="text-[8px] font-black text-amber-500 uppercase">Dirección</p><p className="text-xs font-bold text-slate-500 uppercase">{turn.direccionTaller}</p></div>
                        </div>
                    </div>
                ) : <p className="text-xs text-slate-400 italic">No se encontraron detalles de agenda.</p>;
            case ServiceStage.IN_WORKSHOP:
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-4">
                             <div className="flex items-center gap-4 border-b border-blue-200 pb-3">
                                <LucideFileCheck className="text-blue-600" size={24}/>
                                <h5 className="text-sm font-black text-blue-900 uppercase">Acta de Ingreso a Taller</h5>
                             </div>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed italic">{item.comment}</p>
                        </div>
                    </div>
                );
            case ServiceStage.BUDGETING:
                const budget = request.budgets?.[request.budgets.length - 1];
                return budget ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
                                <h5 className="text-sm font-black text-emerald-900 uppercase italic">Presupuesto Presentado</h5>
                                <span className="text-2xl font-black text-emerald-600 tracking-tighter">${budget.totalAmount.toLocaleString()}</span>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-emerald-500 uppercase">Detalle de Trabajos</p>
                                <p className="text-xs font-bold text-slate-700 italic mt-1 leading-relaxed">"{budget.details}"</p>
                            </div>
                        </div>
                    </div>
                ) : <p className="text-xs text-slate-400 italic">Detalle de presupuesto no disponible.</p>;
            default:
                return <p className="text-xs font-bold text-slate-500 italic">"{item.comment}"</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-t-[12px] border-slate-900 flex flex-col">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4"><div className="p-3 bg-blue-600 rounded-2xl"><LucideFileSearch size={24}/></div><div><h3 className="text-xl font-black uppercase italic tracking-tighter">Registro de Etapa</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stage}</p></div></div>
                    <button onClick={onClose} className="text-white hover:text-rose-500 transition-colors"><LucideX size={24}/></button>
                </div>
                
                <div className="px-10 pt-8 pb-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unidad Patrimonial</p>
                            <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{request.vehiclePlate}</h4>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Centro de Costo</p>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-blue-600 uppercase italic">{request.costCenter}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-black text-[10px] uppercase">{item.userName.charAt(0)}</div><p className="text-[10px] font-black text-slate-800 uppercase">{item.userName}</p></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(parseISO(item.date), 'dd/MM/yyyy HH:mm')} HS</p>
                    </div>
                    {getStageContent()}
                </div>
                <div className="p-8 bg-slate-50 border-t flex shrink-0">
                    <button onClick={onClose} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Cerrar Registro</button>
                </div>
            </div>
        </div>
    );
};

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
        } catch { return { label: 'FECHA NO VÁLIDA', color: 'text-slate-300' }; }
    };
    const res = calculateTime();
    return <span className={`text-[10px] font-black uppercase tracking-widest ${res.color}`}>{res.label}</span>;
};

export const TestSector = () => {
  const { vehicles, user, registeredUsers, serviceRequests, checklists, addServiceRequest, updateServiceRequest, addNotification, updateServiceStage } = useApp();
  const navigate = useNavigate();
  
  const userRole = user?.role || UserRole.USER;
  const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
  const isSupervisorOrAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR;
  const isReadOnly = userRole === UserRole.AUDITOR;
  const isProvider = userRole === UserRole.PROVIDER;

  const [activeView, setActiveView] = useState<ViewMode>('DASHBOARD');
  const [requestStep, setRequestStep] = useState(1); 
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  const [showFullChecklistModal, setShowFullChecklistModal] = useState<Checklist | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<ServiceHistoryItem | null>(null);

  // --- ESTADOS DE FILTRO ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [filterDateTo, setFilterDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterStatus, setFilterStatus] = useState<ServiceStage | ''>('');
  const [filterCC, setFilterCC] = useState('');

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
  const [selectedStageToTransition, setSelectedStageToTransition] = useState<ServiceStage | 'INGRESO_TALLER' | ''>('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishComment, setFinishComment] = useState('');

  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [ingresoData, setIngresoData] = useState({ workshopName: '', receptorName: '', observations: '' });

  const [turnDate, setTurnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turnTime, setTurnTime] = useState('09:00');
  const [workshopName, setWorkshopName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [turnComments, setTurnComments] = useState('');

  const [budgetDetail, setBudgetDetail] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(0);

  // --- ESTADOS DE MAPA ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const searchDebounceRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentRequest = useMemo(() => serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]);
  
  const lastChecklist = useMemo(() => {
    if (!currentRequest) return null;
    return [...checklists]
      .filter(c => c.vehiclePlate === currentRequest.vehiclePlate)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }, [checklists, currentRequest]);
  
  const isChecklistUpToDate = useMemo(() => {
    if (!lastChecklist) return false;
    return isSameDay(parseISO(lastChecklist.date), new Date());
  }, [lastChecklist]);

  const kpis = useMemo(() => {
    const visible = serviceRequests.filter(r => {
        if (isSupervisorOrAdmin || isReadOnly) return true;
        if (isProvider) return r.providerId === user?.id;
        return (r.costCenter || '').toUpperCase() === userCC;
    });

    return {
        total: visible.length,
        pending: visible.filter(r => r.stage === ServiceStage.REQUESTED || r.stage === ServiceStage.SCHEDULING).length,
        inWorkshop: visible.filter(r => r.stage === ServiceStage.IN_WORKSHOP || r.stage === ServiceStage.EXECUTING).length,
        budgeting: visible.filter(r => r.stage === ServiceStage.BUDGETING).length,
        overdue: visible.filter(r => {
            if (!r.suggestedDates?.length) return false;
            const turn = r.suggestedDates[r.suggestedDates.length - 1];
            return r.stage === ServiceStage.SCHEDULING && isBefore(parseISO(turn.fecha), startOfDay(new Date()));
        }).length
    };
  }, [serviceRequests, isSupervisorOrAdmin, isReadOnly, isProvider, user?.id, userCC]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentRequest?.messages, activeView]);

  useEffect(() => {
    const isMapNeeded = activeView === 'ASSIGN_TURN' || (activeView === 'DETAIL' && currentRequest?.suggestedDates?.length);
    
    if (isMapNeeded && !(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else if (isMapNeeded && (window as any).L) {
      setTimeout(initMap, 100);
    }
  }, [activeView, currentRequest]);

  useEffect(() => {
    if (activeView === 'ASSIGN_TURN' && workshopName.trim().length > 3) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        geocodeAddress(workshopName, true);
      }, 1200);
    }
  }, [workshopName, activeView]);

  useEffect(() => {
    if (activeView === 'ASSIGN_TURN' && workshopAddress.trim().length > 5) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        geocodeAddress(workshopAddress, false);
      }, 2000);
    }
  }, [workshopAddress, activeView]);

  const initMap = () => {
    if (!mapContainerRef.current || !(window as any).L) return;
    if (mapInstance.current) {
        mapInstance.current.remove();
    }

    const L = (window as any).L;
    const initialCoords: [number, number] = [-34.6037, -58.3816];
    
    mapInstance.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: activeView === 'ASSIGN_TURN'
    }).setView(initialCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      lang: 'es'
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker(initialCoords, { 
      draggable: activeView === 'ASSIGN_TURN' 
    }).addTo(mapInstance.current);

    if (activeView === 'ASSIGN_TURN') {
      mapInstance.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerInstance.current) markerInstance.current.setLatLng([lat, lng]);
          addNotification("Punto ajustado manualmente", "success");
      });
    }

    if (activeView === 'DETAIL' && currentRequest?.suggestedDates?.length) {
      const turn = currentRequest.suggestedDates[currentRequest.suggestedDates.length - 1];
      if (turn.direccionTaller) {
        geocodeAddress(turn.direccionTaller, false);
      }
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!lat || !lng) return;
    setIsMapLoading(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
        const data = await response.json();
        if (data && data.display_name) {
            setWorkshopAddress(data.display_name.toUpperCase());
            addNotification("Dirección extraída del mapa", "success");
        }
    } catch (e) {
        console.error(e);
        addNotification("Error al procesar ubicación inversa", "error");
    } finally {
        setIsMapLoading(false);
    }
  };

  const geocodeAddress = async (queryParam?: string, updateTextField: boolean = false) => {
    const query = queryParam || workshopAddress || workshopName;
    if (!query || query.trim().length < 3) return;
    setIsMapLoading(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon, display_name } = data[0];
            const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
            
            if (mapInstance.current) {
                mapInstance.current.setView(coords, 16);
            }
            if (markerInstance.current) {
                markerInstance.current.setLatLng(coords);
            }
            
            if (updateTextField) {
                setWorkshopAddress(display_name.toUpperCase());
                addNotification("Dirección autocompletada", "success");
            } else {
                addNotification("Ubicación encontrada en el mapa", "success");
            }
        }
    } catch (e) {
        console.error("Geocoding error", e);
    } finally {
        setIsMapLoading(false);
    }
  };

  const handleCaptureNativeGPS = () => {
    if (!navigator.geolocation) {
        addNotification("GPS no disponible en este navegador", "error");
        return;
    }
    addNotification("Sincronizando con satélites GPS...", "warning");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords: [number, number] = [latitude, longitude];
        if (mapInstance.current) mapInstance.current.setView(coords, 16);
        if (markerInstance.current) markerInstance.current.setLatLng(coords);
        addNotification("Señal GPS recibida con éxito", "success");
    }, (err) => {
        addNotification("Permiso denegado o señal GPS inestable", "error");
    }, { enableHighAccuracy: true });
  };

  const allCostCenters = useMemo(() => {
    const set = new Set(serviceRequests.map(r => r.costCenter).filter(Boolean));
    return Array.from(set).sort();
  }, [serviceRequests]);

  const filteredRequests = useMemo(() => {
    return serviceRequests.filter(r => {
        if (isSupervisorOrAdmin || isReadOnly) { /* Ver todo */ } 
        else if (isProvider) {
            if (r.providerId !== user?.id) return false;
            const validStages = [ServiceStage.SCHEDULING, ServiceStage.IN_WORKSHOP, ServiceStage.BUDGETING, ServiceStage.EXECUTING, ServiceStage.INVOICING, ServiceStage.FINISHED];
            if (!validStages.includes(r.stage)) return false;
        } else {
            if ((r.costCenter || '').toUpperCase() !== userCC) return false;
        }
        const term = searchQuery.toUpperCase();
        const matchSearch = r.vehiclePlate.includes(term) || r.code.toUpperCase().includes(term);
        if (!matchSearch) return false;
        if (filterStatus && r.stage !== filterStatus) return false;
        if (filterCC && r.costCenter !== filterCC) return false;
        const rDate = parseISO(r.createdAt);
        const start = startOfDay(parseISO(filterDateFrom));
        const end = endOfDay(parseISO(filterDateTo));
        if (!isWithinInterval(rDate, { start, end })) return false;
        return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [serviceRequests, searchQuery, filterDateFrom, filterDateTo, filterStatus, filterCC, isSupervisorOrAdmin, isReadOnly, isProvider, user?.id, userCC]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    for (const file of files) {
        const isImage = file.type.includes('image');
        const reader = new FileReader();
        reader.onloadend = async () => {
            let url = reader.result as string;
            if (isImage) url = await compressImage(url);
            setAttachments(prev => [...prev, { name: file.name, url, type: file.type, id: `ATT-${Date.now()}-${Math.random()}` }]);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleCaptureNativeLocation = () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
                setLocation(coords);
                addNotification("Ubicación GPS capturada", "success");
            },
            (err) => {
                console.error("GPS Error:", err);
                addNotification("Error al obtener ubicación GPS", "error");
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        addNotification("Geolocalización no soportada", "error");
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const validateAndSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    let firstErrorId = '';

    const setFieldError = (id: string) => {
        newErrors[id] = true;
        if (!firstErrorId) firstErrorId = `field-${id}`;
    };

    if (!selectedVehicle) setFieldError('vehicle');
    if (!specificType) setFieldError('specificType');
    if (!descriptionValue.trim()) setFieldError('description');
    if (!location.trim()) setFieldError('location');

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) { 
        addNotification("Complete los campos obligatorios", "error"); 
        const el = document.getElementById(firstErrorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; 
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const newRequest: ServiceRequest = {
        id: `SR-${Date.now()}`, code: `EV-${Math.floor(10000 + Math.random() * 90000)}`, vehiclePlate: selectedVehicle!.plate,
        userId: user?.id || 'sys', userName: `${user?.nombre || ''} ${user?.apellido || ''}`.trim(), userEmail: user?.email || '', userPhone: user?.telefono || '', costCenter: (selectedVehicle?.costCenter || userCC).toUpperCase(),
        stage: ServiceStage.REQUESTED, mainCategory: mainCategory, category: specificType, specificType: specificType, description: descriptionValue, location: location, odometerAtRequest: odometer, suggestedDates: [],
        priority: 'MEDIA', attachments: attachments, isDialogueOpen: false, messages: [], budgets: [], history: [{ id: `H-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'sys', userName: user?.nombre || 'Usuario', toStage: ServiceStage.REQUESTED, comment: 'Solicitud aperturada desde Sector de Gestión.' }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      addServiceRequest(newRequest);
      addNotification("Solicitud generada exitosamente", "success");
      setActiveView('DASHBOARD');
    } catch (error) { addNotification("Error al procesar", "error"); } finally { setIsSubmitting(false); }
  };

  const handleConfirmStageTransition = () => {
    if (!currentRequest || !selectedStageToTransition) return;
    
    if (selectedStageToTransition === 'INGRESO_TALLER') { 
        setShowIngresoModal(true); 
        return; 
    }
    
    if (selectedStageToTransition === ServiceStage.SCHEDULING) { 
        setTurnDate(format(new Date(), 'yyyy-MM-dd'));
        setTurnTime('09:00');
        setWorkshopName('');
        setWorkshopAddress('');
        setSelectedProviderId(currentRequest.providerId || '');
        setTurnComments('');
        setActiveView('ASSIGN_TURN'); 
        return; 
    }
    
    if (selectedStageToTransition === ServiceStage.BUDGETING && isProvider) { 
        setActiveView('LOAD_BUDGET'); 
        return; 
    }
    
    updateServiceStage(currentRequest.id, selectedStageToTransition as ServiceStage, `Cambio de estado manual a: ${selectedStageToTransition}`);
    addNotification(`Estado actualizado a ${selectedStageToTransition}`, "success");
    setSelectedStageToTransition('');
  };

  const handleFinishRequest = () => {
    if (!currentRequest || !finishComment.trim()) return;
    updateServiceStage(currentRequest.id, ServiceStage.FINISHED, `CIERRE FINAL: ${finishComment}`);
    addNotification("Gestión finalizada exitosamente", "success");
    setIsFinishing(false);
    setFinishComment('');
  };

  const toggleDialogueState = () => {
    if (!currentRequest || !isSupervisorOrAdmin) return;
    const newState = !currentRequest.isDialogueOpen;
    updateServiceRequest({ ...currentRequest, isDialogueOpen: newState, updatedAt: new Date().toISOString() });
    addNotification(newState ? "Mesa de diálogo abierta al usuario" : "Mesa de diálogo cerrada", newState ? "success" : "warning");
  };

  const handleProcessIngresoTaller = () => {
    if (!currentRequest || !isChecklistUpToDate) return;
    const comment = `ACTA DE INGRESO: Taller [${ingresoData.workshopName}] - Receptor [${ingresoData.receptorName}] - Obs: ${ingresoData.observations}`;
    updateServiceStage(currentRequest.id, ServiceStage.IN_WORKSHOP, comment);
    addNotification("Unidad ingresada a taller correctamente", "success");
    setShowIngresoModal(false);
    setSelectedStageToTransition('');
  };

  const handleConfirmTurnAssignment = () => {
    if (!currentRequest || !isSupervisorOrAdmin) return;
    const turnData: SuggestedDate = { id: `TURN-${Date.now()}`, fecha: turnDate, hora: turnTime, turno: 'MAÑANA', nombreTaller: workshopName, direccionTaller: workshopAddress, comentarios: turnComments };
    const provUser = registeredUsers.find(u => u.id === selectedProviderId);
    updateServiceRequest({
        ...currentRequest, stage: ServiceStage.SCHEDULING, suggestedDates: [turnData], providerId: selectedProviderId, providerName: provUser ? `${provUser.nombre} ${provUser.apellido}` : '', updatedAt: new Date().toISOString(),
        history: [...(currentRequest.history || []), { id: `HIST-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'sys', userName: user?.nombre || 'Supervisor', fromStage: currentRequest.stage, toStage: ServiceStage.SCHEDULING, comment: `Turno asignado: ${workshopName} (${turnTime}hs). Proveedor vinculado.` }]
    });
    addNotification("Turno agendado y notificado", "success");
    setActiveView('DETAIL');
  };

  const handlePublishBudget = () => {
    if (!currentRequest || !budgetDetail.trim() || budgetAmount <= 0) return;
    const newBudget = { id: `BUD-${Date.now()}`, providerId: user?.id, providerName: user?.nombre, details: budgetDetail, totalAmount: budgetAmount, status: 'PENDING', createdAt: new Date().toISOString() };
    updateServiceRequest({
        ...currentRequest, stage: ServiceStage.BUDGETING, budgets: [...(currentRequest.budgets || []), newBudget], updatedAt: new Date().toISOString(),
        history: [...(currentRequest.history || []), { id: `H-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'prov', userName: user?.nombre || 'Proveedor', toStage: ServiceStage.BUDGETING, comment: `Presupuesto publicado por proveedor por $${budgetAmount.toLocaleString()}` }]
    });
    addNotification("Presupuesto publicado correctamente", "success");
    setBudgetDetail(''); setBudgetAmount(0); setActiveView('DETAIL');
  };

  const getStageBadgeStyles = (stage: ServiceStage) => {
    switch (stage) {
      case ServiceStage.FINISHED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ServiceStage.CANCELLED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case ServiceStage.IN_WORKSHOP: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case ServiceStage.BUDGETING: return 'bg-purple-50 text-purple-600 border-purple-100';
      case ServiceStage.SCHEDULING: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentRequest || isReadOnly) return;
    const msg: ServiceMessage = { id: Date.now().toString(), userId: user?.id || 'sys', userName: user?.nombre || 'Usuario', text: chatMessage, timestamp: new Date().toISOString(), role: userRole };
    updateServiceRequest({ ...currentRequest, messages: [...(currentRequest.messages || []), msg] });
    setChatMessage('');
  };

  const specificOptions = useMemo(() => {
    if (mainCategory === 'MANTENIMIENTO') return ['CORRECTIVO', 'PREVENTIVO', 'CORRECTIVO-CONCESIONARIO OFICIAL'];
    if (mainCategory === 'COMPRAS') return ['COMPRA DE COMPONENTES', 'COMPRA DE ACCESORIOS'];
    if (mainCategory === 'SERVICIO') return ['ALQUILER', 'ASISTENCIA MÓVIL', 'DESINFECCIÓN', 'GESTORA', 'GOMERÍA', 'GPS', 'LAVADO', 'LOGÍSTICA', 'SEGURO', 'SINIESTRO', 'VTV', 'INFRACCIONES', 'TRASLADO'];
    return [];
  }, [mainCategory]);

  const filteredStagesForSelector = useMemo(() => {
    const forbidden = [ServiceStage.RECEPCION, ServiceStage.IN_WORKSHOP, ServiceStage.EXECUTING, ServiceStage.INVOICING];
    return Object.values(ServiceStage).filter(s => !forbidden.includes(s));
  }, []);

  const currentTurn = useMemo(() => {
      if (!currentRequest?.suggestedDates || currentRequest.suggestedDates.length === 0) return null;
      return currentRequest.suggestedDates[currentRequest.suggestedDates.length - 1];
  }, [currentRequest]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col animate-fadeIn">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      {showFullChecklistModal && lastChecklist && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-2 animate-fadeIn">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border-t-[12px] border-indigo-600">
                <div className="bg-slate-950 p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4"><LucideFileSearch size={24}/><h3 className="text-xl font-black uppercase italic tracking-tighter">Hoja de Inspección Técnica</h3></div>
                    <button onClick={() => setShowFullChecklistModal(null)} className="p-3 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl"><LucideX size={20}/></button>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-10"><p className="text-center font-black uppercase text-slate-300">Dossier de Inspección Sincronizado</p></div>
            </div>
        </div>
      )}

      {viewingHistoryItem && currentRequest && (
        <StageRecordModal item={viewingHistoryItem} request={currentRequest} onClose={() => setViewingHistoryItem(null)} />
      )}
      
      {showIngresoModal && currentRequest && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col max-h-[90vh]">
                  <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4"><div className="p-3 bg-blue-600 rounded-2xl"><LucideWrench size={24}/></div><div><h3 className="text-xl font-black uppercase italic tracking-tighter">Acta de Ingreso a Taller</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Recepción Técnica</p></div></div>
                      <button onClick={() => setShowIngresoModal(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                      <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${isChecklistUpToDate ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                          <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">{isChecklistUpToDate ? <LucideShieldCheck className="text-emerald-600" size={32}/> : <LucideShieldAlert className="text-rose-600 animate-pulse" size={32}/>}<div><h4 className="font-black text-slate-800 uppercase italic">Estado de Inspección Diaria</h4><p className={`text-[10px] font-bold uppercase ${isChecklistUpToDate ? 'text-emerald-600' : 'text-rose-600'}`}>{isChecklistUpToDate ? 'Checklist Actualizado (Hoy)' : 'ATENCIÓN: Inspección no actualizada'}</p></div></div>
                          </div>
                      </section>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6"><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideBuilding2 size={10}/> Nombre del Taller Receptor</label><input className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" placeholder="NOMBRE ESTABLECIMIENTO..." value={ingresoData.workshopName} onChange={e => setIngresoData({...ingresoData, workshopName: e.target.value.toUpperCase()})} /></div></div>
                          <div className="space-y-6"><div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideUser size={10}/> Nombre del Receptor (Taller)</label><input className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" placeholder="NOMBRE Y APELLIDO..." value={ingresoData.receptorName} onChange={e => setIngresoData({...ingresoData, receptorName: e.target.value.toUpperCase()})} /></div></div>
                      </div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                      <button onClick={() => setShowIngresoModal(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                      <button disabled={!isChecklistUpToDate || !ingresoData.workshopName || !ingresoData.receptorName} onClick={handleProcessIngresoTaller} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-30">Generar Registro y Pasar a Taller</button>
                  </div>
              </div>
          </div>
      )}

      {isFinishing && currentRequest && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border-t-[12px] border-emerald-600">
                  <div className="p-10 space-y-8 text-center">
                      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl animate-bounce"><LucideCheckCircle2 size={48}/></div>
                      <h3 className="text-3xl font-black text-slate-800 uppercase italic">Finalizar Gestión</h3>
                      <textarea rows={4} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-xs outline-none focus:ring-4 focus:ring-emerald-100 resize-none" placeholder="Comentarios finales..." value={finishComment} onChange={e => setFinishComment(e.target.value)} />
                      <div className="flex flex-col gap-3">
                        <button disabled={!finishComment.trim()} onClick={handleFinishRequest} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 flex items-center justify-center gap-3 disabled:opacity-30"><LucideSave size={20}/> Confirmar Cierre Técnico</button>
                        <button onClick={() => { setIsFinishing(false); setFinishComment(''); }} className="w-full text-slate-400 font-black uppercase text-[10px] py-4">Cancelar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12">
        {activeView === 'DASHBOARD' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-200 pb-8">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl border-4 border-white overflow-hidden">{user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <LucideUser size={40}/>}</div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{user?.nombre} {user?.apellido}</h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2"><LucideShieldCheck size={14} className="text-blue-600"/> Centro de Costo: {userCC}</p>
                  </div>
               </div>
               {!isReadOnly && !isProvider && (
                 <button 
                  disabled={vehicles.length === 0}
                  onClick={() => { setActiveView('NEW_REQUEST'); setRequestStep(1); }} 
                  className={`px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${vehicles.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                    <LucidePlusCircle size={22}/> Nueva Gestión de Unidad
                 </button>
               )}
            </div>

            {vehicles.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 p-10 rounded-[3.5rem] flex flex-col items-center text-center animate-fadeIn">
                   <LucideWrench size={48} className="text-blue-600 mb-4"/>
                   <h3 className="text-lg font-black text-blue-900 uppercase">Sin Activos Disponibles</h3>
                   <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-2 max-w-md">No existen unidades vinculadas para aperturar solicitudes. <Link to="/vehicles/new" className="text-blue-900 underline font-black">Cargue una unidad</Link> para habilitar el motor de gestión de servicios.</p>
                </div>
            )}

            {/* KPI PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Eventos Activos', val: kpis.total, icon: LucideActivity, color: 'blue' },
                    { label: 'Ingresados a Taller', val: kpis.inWorkshop, icon: LucideWrench, color: 'indigo' },
                    { label: 'Aguardando Presupuesto', val: kpis.budgeting, icon: LucideDollarSign, color: 'emerald' },
                    { label: 'Turnos Vencidos', val: kpis.overdue, icon: LucideAlertCircle, color: 'rose' },
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <div className={`p-3 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-xl`}><kpi.icon size={18}/></div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mt-6 tracking-tighter">{kpi.val}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Patente / Evento</label>
                    <div className="relative"><LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/><input type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-50" placeholder="BUSCAR..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] uppercase outline-none focus:ring-4 focus:ring-blue-50" value={filterStatus} onChange={e => setFilterStatus(e.target.value as ServiceStage)}><option value="">TODOS</option>{Object.values(ServiceStage).map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">C. Costo</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] uppercase outline-none focus:ring-4 focus:ring-blue-100" value={filterCC} onChange={e => setFilterCC(e.target.value)}><option value="">TODOS</option>{allCostCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}</select>
                </div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label><input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-100" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label><input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-100" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} /></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest italic">Mesa de Control de Servicios</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/10"><th className="px-8 py-6">Evento</th><th className="px-8 py-6">Unidad</th><th className="px-8 py-6">Tipo</th><th className="px-8 py-6">Estado</th><th className="px-8 py-6 text-right">Acción</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.map(req => (
                                <tr key={req.id} onClick={() => { setSelectedReqId(req.id); setActiveView('DETAIL'); }} className="group hover:bg-blue-50/50 transition-all cursor-pointer">
                                    <td className="px-8 py-6 font-black text-slate-700 italic">{req.code}</td>
                                    <td className="px-8 py-6 font-black text-slate-700 uppercase">{req.vehiclePlate}</td>
                                    <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase">{req.specificType}</td>
                                    <td className="px-8 py-6"><span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStageBadgeStyles(req.stage)}`}>{req.stage}</span></td>
                                    <td className="px-8 py-6 text-right"><LucideChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all"/></td>
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
                    <div className="flex items-center gap-6 mb-4"><button onClick={() => setActiveView('DASHBOARD')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400"><LucideArrowLeft size={24}/></button><h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Nueva Gestión Técnica</h2></div>
                    {requestStep === 1 ? (
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-fadeIn">
                            <div className="space-y-4 relative"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Vincular Unidad (Patente)</label><div className="relative"><input id="field-vehicle" type="text" placeholder="ESCRIBIR PATENTE..." className={`w-full px-8 py-6 bg-slate-50 border-2 rounded-[2rem] font-black text-3xl uppercase outline-none transition-all ${errors.vehicle ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100 focus:ring-8 focus:ring-blue-50'}`} value={searchQuery} onChange={e => { setSearchQuery(e.target.value.toUpperCase()); setShowSuggestions(true); setSelectedVehicle(null); }} onFocus={() => setShowSuggestions(true)}/>{showSuggestions && !selectedVehicle && vehicles.filter(v => (isSupervisorOrAdmin || v.costCenter.toUpperCase() === userCC) && v.plate.includes(searchQuery)).slice(0, 5).map(v => (<div key={v.plate} onClick={() => { setSelectedVehicle(v); setOdometer(v.currentKm); setSearchQuery(v.plate); setShowSuggestions(false); }} className="p-6 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-50"><span className="font-black text-2xl italic text-slate-800 uppercase">{v.plate}</span><span className="text-[10px] font-bold text-slate-400 uppercase">{v.make} {v.model}</span></div>))}</div></div>
                            {selectedVehicle && (<div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl animate-fadeIn space-y-6 relative overflow-hidden"><div className="flex justify-between items-start relative z-10"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Confirmación de Unidad</p><h3 className="text-5xl font-black italic tracking-tighter uppercase mt-2">{selectedVehicle.plate}</h3><p className="text-sm font-bold uppercase mt-2">{selectedVehicle.make} {selectedVehicle.model}</p></div><button onClick={() => { setSelectedVehicle(null); setSearchQuery(''); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-[9px] font-black uppercase"><LucideRefreshCw size={14}/> Cambiar</button></div><button onClick={() => setRequestStep(2)} className="w-full py-6 bg-white text-blue-600 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 relative z-10">Continuar <LucideArrowRight size={20}/></button><LucideCar className="absolute -right-12 -bottom-12 opacity-10" size={240}/></div>)}
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-fadeIn">
                            <div className="flex gap-4 p-2 bg-slate-100 rounded-[2rem]">{['MANTENIMIENTO', 'SERVICIO', 'COMPRAS'].map((cat) => (<button key={cat} onClick={() => { setMainCategory(cat as any); setSpecificType(''); }} className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 ${mainCategory === cat ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{cat === 'MANTENIMIENTO' ? <LucideWrench size={20}/> : cat === 'SERVICIO' ? <LucideSmartphone size={20}/> : <LucideShoppingBag size={20}/>}{cat}</button>))}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo Específico</label>
                                    <select id="field-specificType" className={`w-full px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase outline-none transition-all ${errors.specificType ? 'border-rose-500 bg-rose-50' : 'border-slate-100 focus:border-blue-500'}`} value={specificType} onChange={e => setSpecificType(e.target.value)}><option value="">ELIJA OPCIÓN...</option>{specificOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">KM Actual</label>
                                    <div className="flex items-center px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50"><input type="number" onFocus={(e) => e.target.select()} className="w-full font-black text-xl bg-transparent outline-none text-blue-600" value={odometer || ''} onChange={e => setOdometer(Number(e.target.value))} /><LucideGauge className="text-slate-300" size={20}/></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción</label>
                                <textarea id="field-description" rows={4} className={`w-full p-8 rounded-3xl border-2 font-bold text-sm outline-none resize-none transition-all ${errors.description ? 'border-rose-500 bg-rose-50' : 'border-slate-100 focus:border-blue-500'}`} placeholder="Detalle necesidad..." value={descriptionValue} onChange={e => setDescriptionValue(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación</label>
                                <div className="flex gap-2"><input id="field-location" className={`flex-1 px-6 py-4 rounded-2xl border-2 font-bold text-xs uppercase outline-none transition-all ${errors.location ? 'border-rose-500 bg-rose-50' : 'border-slate-100 focus:border-blue-500'}`} placeholder="LUGAR..." value={location} onChange={e => setLocation(e.target.value.toUpperCase())} /><button type="button" onClick={handleCaptureNativeLocation} className="px-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg flex items-center justify-center"><LucideLocate size={20}/></button></div>
                            </div>
                            <div className="pt-8 border-t flex gap-4"><button onClick={() => setRequestStep(1)} className="px-8 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest">Atrás</button><button onClick={validateAndSubmit} disabled={isSubmitting} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4">{isSubmitting ? <LucideRefreshCcw className="animate-spin" size={24}/> : <LucideSend size={24}/>} Enviar Solicitud</button></div>
                        </div>
                    )}
                </div>

                {requestStep === 2 && (
                   <div className="lg:col-span-4 space-y-8 animate-fadeIn">
                      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4"><LucideUserCheck size={14} className="text-blue-500"/> Ficha Solicitante</h4>
                         <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                               <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{user?.nombre.charAt(0)}</div>
                               <div><p className="text-xs font-black text-slate-800 uppercase italic leading-none">{user?.nombre} {user?.apellido}</p><p className="text-[9px] font-bold text-blue-600 uppercase mt-1">{userCC}</p></div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                               <div className="flex items-center gap-3 px-4 py-2 text-slate-500 bg-slate-50/50 rounded-xl"><LucideSmartphone size={12}/><span className="text-[10px] font-bold">{user?.telefono || 'NO REGISTRADO'}</span></div>
                               <div className="flex items-center gap-3 px-4 py-2 text-slate-500 bg-slate-50/50 rounded-xl"><LucideMail size={12}/><span className="text-[10px] font-bold truncate">{user?.email || 'NO REGISTRADO'}</span></div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4"><LucideCamera size={14} className="text-indigo-500"/> Registro Multimedia</h4>
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Cargue fotos del desperfecto o documentación adjunta (PDF, Word, Excel).</p>
                         
                         <div className="grid grid-cols-1 gap-4">
                            <label className="w-full py-8 border-2 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-400 group">
                               <LucideFilePlus size={32} className="mb-2 group-hover:scale-110 transition-transform"/>
                               <span className="text-[9px] font-black uppercase tracking-tighter">Subir archivos</span>
                               <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <div className="space-y-2">
                               {attachments.map(att => (
                                  <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group animate-fadeIn">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                        {att.type.includes('image') ? <LucideImage className="text-blue-500" size={16}/> : <LucideFileText className="text-rose-500" size={16}/>}
                                        <span className="text-[10px] font-bold text-slate-700 truncate uppercase">{att.name}</span>
                                     </div>
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => setZoomedImage({url: att.url, label: att.name})} className="p-2 text-slate-400 hover:text-indigo-600"><LucideMaximize size={14}/></button>
                                        <button type="button" onClick={() => removeAttachment(att.id)} className="p-2 text-slate-400 hover:text-rose-600"><LucideTrash2 size={14}/></button>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                )}
            </div>
        )}

        {activeView === 'DETAIL' && currentRequest && (
           <div className="space-y-10 animate-fadeIn pb-32">
              <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8"><div className="flex items-center gap-8"><button onClick={() => setActiveView('DASHBOARD')} className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 text-slate-400 transition-all shadow-sm active:scale-95"><LucideArrowLeft size={40}/></button><div><p className="text-[14px] font-black text-blue-600 uppercase tracking-[0.5em] mb-3">{currentRequest.code}</p><h3 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{currentRequest.vehiclePlate}</h3></div></div><span className={`px-14 py-8 rounded-[2.5rem] border-4 font-black uppercase text-sm tracking-[0.2em] shadow-3xl ${getStageBadgeStyles(currentRequest.stage)}`}>{currentRequest.stage}</span></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-8 space-y-10">
                    {currentTurn && (
                        <div className="bg-amber-50 p-10 rounded-[3.5rem] border-2 border-amber-200 shadow-xl space-y-8 animate-fadeIn relative overflow-hidden">
                           <div className="flex items-center gap-6 border-b border-amber-200 pb-6 relative z-10">
                               <div className="p-4 bg-amber-600 text-white rounded-2xl shadow-lg"><LucideCalendarDays size={28}/></div>
                               <div className="flex justify-between items-end flex-1">
                                  <div><h4 className="text-xl font-black uppercase italic tracking-tight text-amber-900 leading-none">Turno Técnico Confirmado</h4><p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-2">Detalles para Presentación</p></div>
                                  <TurnCountdown date={currentTurn.fecha} time={currentTurn.hora || '09:00'} />
                               </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                               <div className="space-y-6">
                                 <div className="p-6 bg-white/60 rounded-[2rem] border border-amber-200"><p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><LucideBuilding2 size={12}/> Taller</p><p className="text-xl font-black text-slate-800 uppercase italic">{currentTurn.nombreTaller}</p><p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{currentTurn.direccionTaller}</p></div>
                                 <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-white/5 flex justify-between items-center"><div><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><LucideClock size={12}/> Horario</p><p className="text-2xl font-black italic">{format(parseISO(currentTurn.fecha), "dd/MM/yyyy")} - {currentTurn.hora}HS</p></div><LucideCheckCircle2 className="text-emerald-500" size={32}/></div>
                               </div>
                               <div className="bg-white rounded-[2rem] overflow-hidden border border-amber-200 shadow-inner h-full min-h-[250px] relative">
                                  <div ref={mapContainerRef} className="w-full h-full z-0" />
                                  {isMapLoading && (
                                      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center">
                                          <LucideRefreshCcw className="animate-spin text-blue-600" size={24}/>
                                      </div>
                                  )}
                               </div>
                           </div>
                        </div>
                    )}

                    {!isReadOnly && (isSupervisorOrAdmin || isProvider) && (currentRequest.stage !== ServiceStage.FINISHED && currentRequest.stage !== ServiceStage.CANCELLED) && (
                      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white space-y-10 shadow-3xl border border-white/5 animate-fadeIn">
                         <div className="flex items-center gap-6"><div className="p-4 bg-blue-600 rounded-2xl shadow-xl"><LucideShield size={28}/></div><h4 className="text-2xl font-black uppercase italic tracking-tighter">Gestión Operativa</h4></div>
                         <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6"><h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2"><LucideRefreshCw size={14}/> Acciones</h5><div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 w-full space-y-2"><label className="text-[8px] font-black text-slate-500 uppercase ml-4">Nuevo Estado</label><select className="w-full px-6 py-4 bg-slate-900 border border-white/20 rounded-2xl text-xs font-black uppercase text-white outline-none focus:ring-2 focus:ring-blue-500/50" value={selectedStageToTransition} onChange={e => setSelectedStageToTransition(e.target.value as any)}><option value="">ELIJA ESTADO...</option>{(isSupervisorOrAdmin || (isProvider && currentRequest.stage === ServiceStage.SCHEDULING)) && <option value="INGRESO_TALLER">INGRESO TALLER (ACTA)</option>}{isProvider && currentRequest.stage === ServiceStage.IN_WORKSHOP && <option value={ServiceStage.BUDGETING}>CARGAR PRESUPUESTO</option>}{isSupervisorOrAdmin && filteredStagesForSelector.map(s => <option key={s} value={s}>{s}</option>)}</select></div><button onClick={handleConfirmStageTransition} disabled={!selectedStageToTransition} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-500 transition-all">Confirmar</button></div></div>
                         {isSupervisorOrAdmin && <button onClick={() => setIsFinishing(true)} className="w-full py-6 bg-emerald-600 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 flex items-center justify-center gap-3"><LucideCheckCircle2 size={20}/> Finalizar Solicitud</button>}
                      </div>
                    )}
                    
                    <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                        <div className="flex justify-between items-center border-b pb-6">
                            <div className="flex items-center gap-4"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><LucideInfo size={28}/></div><h3 className="text-2xl font-black text-slate-800 uppercase italic">Resumen Técnico</h3></div>
                            <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Apertura</p><p className="text-xs font-black text-slate-700 italic">{format(parseISO(currentRequest.createdAt), 'dd/MM/yyyy HH:mm')} HS</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clasificación</p><p className="text-sm font-black text-slate-800 uppercase italic">{currentRequest.mainCategory} / {currentRequest.specificType}</p></div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p><p className="text-sm font-black text-slate-800 uppercase italic truncate">{currentRequest.location}</p></div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">KM Reporte</p><p className="text-sm font-black text-slate-800 italic">{currentRequest.odometerAtRequest.toLocaleString()} KM</p></div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción de Necesidad</p>
                            <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] italic font-bold text-xl leading-relaxed shadow-3xl border border-white/5 relative overflow-hidden group">"{currentRequest.description}"<LucideFileText className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform" size={160}/></div>
                        </div>
                        {currentRequest.attachments && currentRequest.attachments.length > 0 && (
                            <div className="space-y-4">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Media Vinculada</p>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {currentRequest.attachments.map((att, idx) => (
                                      <div key={idx} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative group cursor-pointer" onClick={() => setZoomedImage({url: att.url, label: att.name})}>
                                         {att.type.includes('image') ? <img src={att.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><LucideFileText size={32}/></div>}
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><LucideMaximize size={24} className="text-white"/></div>
                                      </div>
                                  ))}
                               </div>
                            </div>
                        )}
                    </div>
                 </div>

                 <div className="lg:col-span-4 space-y-10">
                    <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden group"><h4 className="text-sm font-black uppercase italic tracking-widest text-blue-400 border-b border-white/10 pb-4 flex items-center gap-3"><LucideCar size={18}/> Ficha Unidad</h4><div className="space-y-6 relative z-10"><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">KM Solicitud</p><p className="text-xl font-black italic">{currentRequest.odometerAtRequest.toLocaleString()} KM</p></div><div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">C. Costo</p><p className="text-[10px] font-black truncate">{currentRequest.costCenter}</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-2"><span className="text-slate-500 uppercase">Solicitante</span><span className="uppercase">{currentRequest.userName}</span></div><div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-2"><span className="text-slate-500 uppercase">Proveedor</span><span className="uppercase text-blue-400 font-black">{currentRequest.providerName || 'NO ASIGNADO'}</span></div></div></div><LucideDatabase className="absolute -right-8 -bottom-8 opacity-5" size={160}/></div>
                    
                    {(isSupervisorOrAdmin || currentRequest.isDialogueOpen) && (
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col h-[550px] overflow-hidden animate-fadeIn">
                           <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                             <div className="flex items-center gap-3"><div className={`p-3 rounded-xl shadow-lg bg-indigo-600 text-white shadow-indigo-100`}><LucideMessageCircle size={20}/></div><div><h5 className="text-sm font-black text-slate-800 uppercase italic leading-none">Mesa de Diálogo</h5><p className="text-[7px] font-black text-slate-400 uppercase mt-1">Chat Directo Corporativo</p></div></div>
                             {isSupervisorOrAdmin && (<button onClick={toggleDialogueState} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${currentRequest.isDialogueOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{currentRequest.isDialogueOpen ? <LucideUnlock size={14}/> : <LucideLock size={14}/>}<span className="text-[8px] font-black uppercase">{currentRequest.isDialogueOpen ? 'Abierta' : 'Cerrada'}</span></button>)}
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#fcfdfe]">
                               {(!currentRequest.messages || currentRequest.messages.length === 0) ? (<div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale"><LucideSend size={48} className="mb-4 animate-bounce"/><p className="text-[9px] font-black uppercase tracking-widest">Sin intercambio de mensajes</p></div>) : (currentRequest.messages?.map(m => (<div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}><div className={`max-w-[90%] p-4 rounded-[1.8rem] shadow-sm border ${m.userId === user?.id ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-slate-50 text-slate-700 border-slate-200 rounded-tl-none'}`}><p className="text-[7px] font-black uppercase opacity-60 mb-2">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}</p><p className="text-[10px] font-bold italic leading-relaxed">"{m.text}"</p></div></div>)))}<div ref={chatEndRef}></div>
                           </div>
                           <div className="p-6 border-t bg-white shrink-0"><div className="relative"><textarea rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-100 shadow-inner resize-none custom-scrollbar" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} /><button onClick={handleSendMessage} disabled={!chatMessage.trim() || isReadOnly} className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-30"><LucideSend size={16}/></button></div></div>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4"><LucideHistory className="text-indigo-600" size={20}/><h4 className="text-sm font-black text-slate-800 uppercase italic leading-none">Trazabilidad Técnica</h4></div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic px-2">Presione sobre una etapa para ver registro</p>
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">{currentRequest.history.map((h, i) => (<div key={i} onClick={() => setViewingHistoryItem(h)} className="flex gap-4 group/item cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-all"><div className="w-1 bg-slate-100 group-hover/item:bg-indigo-500 rounded-full transition-all"></div><div className="flex-1"><div className="flex justify-between items-start"><p className="text-[11px] font-black text-slate-800 uppercase italic leading-tight group-hover/item:text-indigo-600 transition-colors">{h.comment}</p><LucideEye className="text-slate-200 group-hover/item:text-indigo-400 opacity-0 group-hover/item:opacity-100 transition-all shrink-0" size={14}/></div><div className="flex justify-between items-center mt-2"><p className="text-[8px] font-black text-slate-400 uppercase">{h.userName}</p><p className="text-[8px] font-bold text-slate-300 uppercase">{format(parseISO(h.date), 'dd/MM HH:mm')} HS</p></div></div></div>))}</div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeView === 'ASSIGN_TURN' && currentRequest && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn pb-24">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveView('DETAIL')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><LucideArrowLeft size={24}/></button>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Agendamiento Técnico</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración de Cita para Unidad {currentRequest.vehiclePlate}</p>
                        </div>
                    </div>
                    <TurnCountdown date={turnDate} time={turnTime} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* FORMULARIO */}
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 h-fit">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Pactada</label>
                                <div className="relative">
                                    <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                                    <input type="date" min={format(new Date(), 'yyyy-MM-dd')} className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-100 shadow-sm" value={turnDate} onChange={e => setTurnDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hora de Recepción</label>
                                <div className="relative">
                                    <LucideClock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                                    <input type="time" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-100 shadow-sm" value={turnTime} onChange={e => setTurnTime(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><LucideFactory size={14}/> Establecimiento y Ubicación del Servicio</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase ml-2 italic">Búsqueda inteligente: escriba el nombre o la dirección</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Nombre del Establecimiento</label>
                                    <input type="text" placeholder="NOMBRE TALLER O LUGAR..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-inner" value={workshopName} onChange={e => setWorkshopName(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Asignar Proveedor Responsable</label>
                                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-sm" value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)}>
                                        <option value="">ELIJA PROVEEDOR...</option>
                                        {registeredUsers.filter(u => u.role === UserRole.PROVIDER).map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Dirección Exacta de Presentación</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LucideMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18}/>
                                        <input type="text" placeholder="DIRECCIÓN O REFERENCIA..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-inner" value={workshopAddress} onChange={e => setWorkshopAddress(e.target.value.toUpperCase())} />
                                    </div>
                                    <button onClick={() => markerInstance.current && reverseGeocode(markerInstance.current.getLatLng().lat, markerInstance.current.getLatLng().lng)} className="px-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg group" title="Traer dirección desde el punto del mapa">
                                        <LucideRefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500"/>
                                    </button>
                                    <button onClick={() => geocodeAddress()} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg" title="Sincronizar mapa manualmente">
                                        <LucideSearch size={20}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Comentarios para Usuario/Chofer</label>
                            <textarea rows={3} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-100 resize-none shadow-inner" placeholder="Instrucciones especiales para el ingreso de la unidad..." value={turnComments} onChange={e => setTurnComments(e.target.value)} />
                        </div>
                        
                        <button onClick={handleConfirmTurnAssignment} disabled={!workshopName || !selectedProviderId || !turnDate} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 disabled:opacity-30">
                            <LucideShieldCheck size={24}/> Confirmar Agendamiento y Notificar
                        </button>
                    </div>
 
                    {/* MAPA ESTILO LOCAL GPS */}
                    <div className="bg-white p-6 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-6 flex flex-col h-[600px] lg:h-auto">
                        <div className="flex justify-between items-center px-4">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><LucideMap size={14} className="text-blue-600"/> Mapa de Localización de Turno</h4>
                                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Sincronización automática con campos de búsqueda</p>
                            </div>
                            <button onClick={handleCaptureNativeGPS} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                                <LucideLocate size={18}/> Mi Posición GPS
                            </button>
                        </div>
                        
                        <div className="flex-1 rounded-[2.5rem] bg-slate-100 border-2 border-slate-50 relative overflow-hidden group shadow-2xl">
                            <div ref={mapContainerRef} className="w-full h-full z-0" />
                            {isMapLoading && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <LucideRefreshCcw className="animate-spin text-blue-600" size={32}/>
                                        <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest italic">Sincronizando coordenadas...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeView === 'LOAD_BUDGET' && currentRequest && (
            <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-24">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveView('DETAIL')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400"><LucideArrowLeft size={24}/></button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Carga de Presupuesto</h2>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Detalle Técnico</label>
                        <textarea rows={5} className="w-full p-8 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 resize-none shadow-inner" placeholder="Descripción trabajos..." value={budgetDetail} onChange={e => setBudgetDetail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Total ($)</label>
                        <div className="relative">
                            <LucideDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600" size={24}/>
                            <input type="number" onFocus={(e) => e.target.select()} className="w-full pl-16 pr-8 py-6 bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] font-black text-4xl text-emerald-700 outline-none" value={budgetAmount} onChange={e => setBudgetAmount(Number(e.target.value))} />
                        </div>
                    </div>
                    <button onClick={handlePublishBudget} disabled={!budgetDetail.trim() || budgetAmount <= 0} className="w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase text-sm shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4">
                        Publicar para Auditoría
                    </button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};