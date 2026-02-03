import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CHECKLIST_SECTIONS } from '../constants';
import { Checklist as ChecklistType, ChecklistItem, AccessoryItem, Vehicle, VehicleStatus, FindingMarker } from '../types';
import { 
  ArrowLeft, Eraser, ChevronDown, ChevronUp, FileText, Plus, Save, 
  Search, Cpu, Check, MapPin, Eye, Lightbulb, Zap, HardDrive, 
  Mail, Map, Navigation, AlertCircle, Layout, Truck, ShieldCheck,
  UserCheck, Camera, Calendar, Image as ImageIcon, X, AlertTriangle,
  BellRing, ShieldAlert, Timer, History, PackagePlus, MinusCircle, PlusCircle,
  MapPinned, MoveRight, Gauge, FileDown, EyeIcon, Trash2, DownloadCloud,
  Building2, MapPinHouse, MapPinCheck, FileSearch, LucideCrosshair, LucideMessageSquare,
  LucideImage
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { compressImage } from '../utils/imageCompressor';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SignaturePad = ({ onEnd, label, error, id }: { onEnd: (base64: string) => void, label: string, error?: boolean, id?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) { 
                ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a'; 
                ctx.lineJoin = 'round'; ctx.lineCap = 'round'; 
            }
        }
    }, []);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.beginPath(); ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.lineTo(x, y); ctx.stroke();
    };

    return (
        <div id={id} className="space-y-2 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
            <div className={`border-2 rounded-[2rem] bg-slate-50 relative overflow-hidden transition-all h-[154px] ${error ? 'border-rose-500 ring-4 ring-rose-100 shadow-lg' : 'border-slate-200 shadow-inner hover:border-slate-300'}`}>
                <canvas 
                    ref={canvasRef} className="w-full h-full touch-none cursor-crosshair" 
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }} 
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }} 
                />
                <button 
                    type="button"
                    onClick={() => { const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); onEnd(''); } }} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-2 bg-white rounded-full shadow-lg border border-slate-100"
                ><Eraser size={16}/></button>
            </div>
        </div>
    );
};

const EvidencePanel = ({ 
    item, 
    onUpdate,
    error,
    id
}: { 
    item: any, 
    onUpdate: (updates: { observation?: string, images?: string[] }) => void,
    error?: boolean,
    id?: string
}) => {
    return (
        <div id={id} className={`mt-2 p-4 rounded-2xl border space-y-3 animate-fadeIn transition-all ${error ? 'bg-rose-50 border-rose-300 ring-4 ring-rose-100' : 'bg-slate-100/50 border-slate-200'}`}>
            <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Detalle de Novedad</label>
                    {error && <span className="text-[7px] font-black text-rose-600 uppercase italic">Justificación Obligatoria por Stock 0</span>}
                </div>
                <textarea 
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    placeholder="Describa el motivo del faltante o daño..."
                    value={item.observation || ''}
                    onChange={e => onUpdate({ observation: e.target.value })}
                    rows={2}
                />
            </div>
        </div>
    );
};

export const Checklist = () => {
    const { vehicles, addChecklist, user, checklists, addNotification, logAudit, masterFindingsImage } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const serviceId = searchParams.get('serviceId');
    const autoType = searchParams.get('type');
    
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'VIEW'>(searchParams.get('plate') ? 'CREATE' : 'LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingChecklist, setViewingChecklist] = useState<ChecklistType | null>(null);
    
    const [plateSearch, setPlateSearch] = useState(searchParams.get('plate') || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const [km, setKm] = useState<number>(0);
    const [costCenter, setCostCenter] = useState('');
    const [province, setProvince] = useState('');
    const [checkType, setCheckType] = useState(autoType === 'POR_INGRESO' ? 'POR INGRESO A TALLER' : 'DIARIO');
    const [originSector, setOriginSector] = useState('');
    const [destinationSector, setDestinationSector] = useState('');
    const [sendEmail, setSendEmail] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState('');
    const [receivedBy, setReceivedBy] = useState('');
    const [receiverSignature, setReceiverSignature] = useState('');
    const [signature, setSignature] = useState('');
    const [clarification, setClarification] = useState(user?.name || '');
    const [canCirculate, setCanCirculate] = useState(true);
    const [generalObservations, setGeneralObservations] = useState('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const [motorItems, setMotorItems] = useState<ChecklistItem[]>([]);
    const [lightItems, setLightItems] = useState<ChecklistItem[]>([]);
    const [generalItems, setGeneralItems] = useState<any[]>([]);
    const [bodyworkItems, setBodyworkItems] = useState<ChecklistItem[]>([]);
    const [accessoryItems, setAccessoryItems] = useState<any[]>([]);
    
    const [findingsMarkers, setFindingsMarkers] = useState<FindingMarker[]>([]);
    const findingsImageRef = useRef<HTMLDivElement>(null);

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ 
      motor: true, lights: false, general: false, bodywork: false, accessories: true, findings: false 
    });

    const filteredVehicles = useMemo(() => 
        vehicles.filter(v => v.plate.toUpperCase().includes(plateSearch.toUpperCase())).slice(0, 5)
    , [plateSearch, vehicles]);

    const selectedVehicle = useMemo(() => vehicles.find(v => v.plate === plateSearch), [plateSearch, vehicles]);

    useEffect(() => {
        if (!selectedVehicle) return;
        
        setKm(selectedVehicle.currentKm || 0);
        setCostCenter(selectedVehicle.costCenter || 'SIN ASIGNAR');
        setProvince(selectedVehicle.province || 'Mendoza');
        setFindingsMarkers([]); 
        
        setMotorItems(CHECKLIST_SECTIONS.motor.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        setLightItems(CHECKLIST_SECTIONS.lights.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        setGeneralItems(CHECKLIST_SECTIONS.general.map(name => ({ name, status: undefined as any, observation: '', images: [], hasIt: name === 'Equipo de Frío' ? (selectedVehicle.fichaTecnica?.apariencia.tipoCaja.includes('frio') || false) : true })));
        setBodyworkItems(CHECKLIST_SECTIONS.bodywork.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        
        const fichaAcc = selectedVehicle.fichaTecnica?.equipamiento.accesoriosEstandar;
        if (fichaAcc && fichaAcc.length > 0) {
            setAccessoryItems(fichaAcc.filter(a => a.isEquipped).map(a => {
                const isFireExt = a.name.toUpperCase().includes('MATAFUEGO');
                const isBotiquin = a.name.toUpperCase().includes('BOTIQUÍN');
                let initialDates = [''];
                if (isFireExt || isBotiquin) {
                    const target = isBotiquin ? 'BOTIQUÍN' : a.name.toUpperCase().includes('1KG') ? 'MATAFUEGO 1KG' : 'MATAFUEGO 5KG';
                    const doc = selectedVehicle.documents?.find(d => d.type.toUpperCase() === target);
                    initialDates = doc?.expirationDate ? [doc.expirationDate] : [''];
                }
                return { 
                    name: a.name, isFireExt, isBotiquin, quantity: a.quantity, quantityFound: a.quantity, 
                    status: undefined as any, observation: '', images: [], expirationDates: initialDates,
                    specification: a.detail || '', isManual: false
                };
            }));
        } else {
            setAccessoryItems(CHECKLIST_SECTIONS.accessories.map(name => ({
                name, isFireExt: name.toUpperCase().includes('MATAFUEGO'), isBotiquin: name.toUpperCase().includes('BOTIQUÍN'), quantity: 1, quantityFound: 1,
                status: undefined as any, observation: '', images: [], expirationDates: [''], specification: '', isManual: false
            })));
        }
    }, [selectedVehicle]);

    const handleFindingsClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!findingsImageRef.current || !masterFindingsImage) return;
        const rect = findingsImageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const newMarker: FindingMarker = { id: findingsMarkers.length + 1, x, y, comment: '' };
        setFindingsMarkers([...findingsMarkers, newMarker]);
    };

    const updateFindingField = (id: number, field: keyof FindingMarker, value: any) => {
        setFindingsMarkers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleFindingPhoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            updateFindingField(id, 'photo', compressed);
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    const removeFindingMarker = (id: number) => {
        setFindingsMarkers(prev => prev.filter(m => m.id !== id).map((m, i) => ({ ...m, id: i + 1 })));
    };

    const handleStatusChange = (section: string, index: number, status: 'GOOD' | 'REGULAR' | 'BAD') => {
        const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
        const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
        const newItems = [...itemsMap[section]];
        newItems[index].status = status;
        setMap[section](newItems);
        if (status === 'BAD') setCanCirculate(false);
    };

    const handlePhotoCapture = async (section: string, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
            const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
            const newItems = [...itemsMap[section]];
            newItems[index].images = [...(newItems[index].images || []), compressed];
            setMap[section](newItems);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = (section: string, itemIdx: number, photoIdx: number) => {
        const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
        const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
        const newItems = [...itemsMap[section]];
        newItems[itemIdx].images = newItems[itemIdx].images.filter((_: any, i: number) => i !== photoIdx);
        setMap[section](newItems);
    };

    const addNewInventoryItem = () => {
        const lastManual = [...accessoryItems].reverse().find(i => i.isManual);
        if (lastManual && !lastManual.name.trim()) {
            addNotification("Complete el nombre del accesorio manual antes de agregar otro.", "warning");
            return;
        }
        setAccessoryItems(prev => [...prev, {
            name: '', isFireExt: false, isBotiquin: false, quantity: 1, quantityFound: 1,
            status: undefined as any, observation: '', images: [], expirationDates: [''], specification: '', isManual: true
        }]);
    };

    const deleteInventoryItem = (index: number) => {
        setAccessoryItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateManualItem = (index: number, field: string, value: any) => {
        const na = [...accessoryItems];
        na[index] = { ...na[index], [field]: value };
        setAccessoryItems(na);
    };

    const updateExtinguisherDate = (itemIdx: number, val: string) => {
        const na = [...accessoryItems];
        na[itemIdx].expirationDates = [val];
        setAccessoryItems(na);
    };

    const updateEvidence = (section: string, index: number, updates: any) => {
        const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
        const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
        const newItems = [...itemsMap[section]];
        newItems[index] = { ...newItems[index], ...updates };
        setMap[section](newItems);
    };

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!selectedVehicle) { newErrors.plate_input = true; }
        
        // CORRECCIÓN INTEGRIDAD: Validación de kilometraje lógico
        const currentKm = selectedVehicle?.currentKm || 0;
        if (km < currentKm) { 
            newErrors.km_input = true;
            addNotification(`El kilometraje (${km}) no puede ser menor al actual (${currentKm})`, "error");
        }
        if (km < 0) { newErrors.km_input = true; }
        
        if (!signature) newErrors.signature_pad = true;
        
        const isDoubleSignType = checkType === 'REEMPLAZO' || checkType === 'TURNO' || checkType === 'POR INGRESO A TALLER';
        if (isDoubleSignType && (!receivedBy || !receiverSignature)) newErrors.received_by_input = true;

        const isTravelType = checkType === 'INGRESO' || checkType === 'EGRESO';
        if (isTravelType && (!originSector || !destinationSector)) newErrors.travel_inputs = true;

        const checkSection = (items: any[]) => items.some(i => i.hasIt !== false && i.status === undefined);
        if (checkSection(motorItems)) newErrors.motor = true;
        if (checkSection(lightItems)) newErrors.lights = true;
        if (checkSection(generalItems)) newErrors.general = true;
        if (checkSection(bodyworkItems)) newErrors.bodywork = true;
        if (checkSection(accessoryItems)) newErrors.accessories = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getExtStatus = (dateStr: string) => {
        if (!dateStr) return null;
        const today = startOfDay(new Date());
        const expDate = parseISO(dateStr);
        const diff = differenceInDays(expDate, today);
        if (diff < 0) return { label: `VENCIDO`, color: 'text-rose-600', bg: 'bg-rose-50', isCritical: true };
        return { label: `VIGENTE`, color: 'text-emerald-600', bg: 'bg-emerald-50', isCritical: false };
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }
        
        const newChecklist: ChecklistType = {
            id: `CHK-${Date.now()}`, vehiclePlate: plateSearch, userId: user?.id || 'guest',
            userName: clarification, date: new Date().toISOString(), type: checkType, 
            km, costCenter, currentProvince: province, canCirculate, 
            motor: motorItems, lights: lightItems, general: generalItems, 
            bodywork: bodyworkItems, accessories: accessoryItems, 
            findingsMarkers: findingsMarkers,
            signature, clarification, generalObservations, 
            receivedBy, receiverSignature,
            originSector, destinationSector,
            emailRecipients: emailRecipients ? emailRecipients.split(',').map(e => e.trim()) : []
        };
        
        addChecklist(newChecklist);
        addNotification("Reporte guardado con éxito.", "success");
        setViewMode('LIST');
    };

    const StatusPicker = ({ section, index, status, disabled }: { section: string, index: number, status: any, disabled?: boolean }) => (
        <div className={`flex items-center gap-2 ${disabled ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button type="button" onClick={() => handleStatusChange(section, index, 'GOOD')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${status === 'GOOD' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>OK</button>
                <button type="button" onClick={() => handleStatusChange(section, index, 'REGULAR')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${status === 'REGULAR' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>REG</button>
                <button type="button" onClick={() => handleStatusChange(section, index, 'BAD')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${status === 'BAD' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>DEF</button>
            </div>
            {!disabled && (
                <label className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Camera size={16}/>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(section, index, e)} />
                </label>
            )}
        </div>
    );

    if (viewMode === 'LIST') {
        return (
            <div className="space-y-8 animate-fadeIn pb-10">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-black text-slate-800 uppercase italic flex items-center gap-3"><FileText className="text-blue-600" size={36}/> Inspecciones v19.3.0</h1>
                    <button onClick={() => setViewMode('CREATE')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-700 shadow-2xl transition-all text-[11px] uppercase tracking-widest"><Plus size={24}/> Nueva Auditoría</button>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50"><Search className="text-slate-400" size={24}/><input type="text" placeholder="Buscar patente..." className="bg-transparent border-none outline-none font-bold text-slate-700 w-full text-lg uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    <div className="divide-y divide-slate-50">
                        {checklists.filter(c => c.vehiclePlate.includes(searchTerm.toUpperCase())).map(c => (
                            <div key={c.id} className="p-6 hover:bg-slate-50 transition-all flex justify-between items-center cursor-pointer">
                                <div className="flex items-center gap-6"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${c.canCirculate ? 'bg-emerald-500' : 'bg-rose-500'}`}>{c.vehiclePlate.substring(0,2)}</div><div><h3 className="text-xl font-black text-slate-800 uppercase italic">{c.vehiclePlate}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{format(parseISO(c.date), 'dd/MM/yyyy HH:mm')} • {c.userName}</p></div></div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setViewingChecklist(c); setViewMode('VIEW'); }} className="p-3 text-slate-400 hover:text-blue-600 rounded-xl"><Eye size={20}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'VIEW' && viewingChecklist) {
        return (
            <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                    <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4"><div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><FileSearch size={24}/></div><h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Visualización de Registro</h3></div>
                        <button onClick={() => setViewMode('LIST')} className="text-white hover:text-rose-500"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Kilometraje</p><p className="text-xl font-black text-slate-900">{viewingChecklist.km.toLocaleString()} KM</p></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Tipo</p><p className="text-sm font-black text-slate-900 uppercase">{viewingChecklist.type}</p></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Unidad</p><p className="text-sm font-black text-slate-900 uppercase">{viewingChecklist.vehiclePlate}</p></div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-3">Veredicto Operativo</p><p className={`font-black uppercase text-base ${viewingChecklist.canCirculate ? 'text-emerald-600' : 'text-rose-600'}`}>{viewingChecklist.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO'}</p></div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t shrink-0"><button onClick={() => setViewMode('LIST')} className="w-full py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-200">Volver al Listado</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fadeIn px-4 space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('LIST')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-all"><ArrowLeft size={24}/></button>
                <div><h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Inspección Operativa</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SISTEMA EMPRESARIAL v19.3.0</p></div>
            </div>

            <section className={`bg-white p-10 rounded-[3rem] text-slate-800 shadow-2xl relative overflow-hidden border-t-8 transition-all ${errors.plate_input || errors.km_input ? 'border-rose-500' : 'border-blue-600'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unidad (Patente)</label>
                        <div className="relative">
                            <input id="plate_input" type="text" className={`w-full px-6 py-5 bg-slate-50 border rounded-2xl font-black text-2xl uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all ${errors.plate_input ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} placeholder="BUSCAR..." value={plateSearch} onChange={e => { setPlateSearch(e.target.value.toUpperCase()); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}/>
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                        </div>
                        {showSuggestions && (<div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto">{filteredVehicles.map(v => (<div key={v.plate} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50" onClick={() => { setPlateSearch(v.plate); setShowSuggestions(false); }}><span className="text-slate-900 font-black text-lg italic">{v.plate}</span><div className="text-right"><p className="text-slate-400 font-bold text-[9px] uppercase">{v.make} {v.model}</p></div></div>))}</div>)}
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Kilometraje Auditado</label>
                        <div className="relative">
                            <Gauge className={`absolute left-6 top-1/2 -translate-y-1/2 ${errors.km_input ? 'text-rose-500' : 'text-slate-300'}`} size={24}/>
                            <input id="km_input" type="number" onFocus={(e) => e.target.select()} className={`w-full pl-16 pr-6 py-5 bg-slate-50 border rounded-2xl font-black text-4xl outline-none ${errors.km_input ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-blue-600'}`} value={km || ''} onChange={e => setKm(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 mt-6">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Control</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] outline-none" value={checkType} onChange={e => setCheckType(e.target.value)}><option value="DIARIO">DIARIO / RUTINA</option><option value="INGRESO">VIAJE DE INGRESO</option><option value="EGRESO">VIAJE DE EGRESO</option><option value="REEMPLAZO">POR REEMPLAZO</option><option value="TURNO">POR CAMBIO DE TURNO</option><option value="POR INGRESO A TALLER">POR INGRESO A TALLER</option></select></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Provincia Operativa</label><input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-black text-[10px] text-slate-600 outline-none uppercase" value={province} onChange={e => setProvince(e.target.value)} /></div>
                </div>
            </section>

            {[
                { id: 'motor', label: 'Sección A: Mecánica y Niveles', icon: Cpu, items: motorItems, color: 'blue' },
                { id: 'lights', label: 'Sección B: Iluminación', icon: Lightbulb, items: lightItems, color: 'amber' },
                { id: 'general', label: 'Sección C: Controles y Cabina', icon: Layout, items: generalItems, color: 'emerald' },
                { id: 'bodywork', label: 'Sección D: Carrocería', icon: Truck, items: bodyworkItems, color: 'rose' }
            ].map(sec => (
                <div id={sec.id} key={sec.id} className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors[sec.id] ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                    <button onClick={() => setOpenSections(p => ({...p, [sec.id]: !p[sec.id]}))} className={`w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-${sec.color}-500 hover:bg-slate-100 transition-all`}><div className="flex items-center gap-4"><sec.icon className={`text-${sec.color}-500`} size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">{sec.label}</h3></div>{openSections[sec.id] ? <ChevronUp/> : <ChevronDown/>}</button>
                    {openSections[sec.id] && (<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">{sec.items.map((item, idx) => (<div key={idx} className="space-y-2"><div className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${item.status === undefined && errors[sec.id] ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`}><div className="flex items-center gap-3"><h4 className={`font-black uppercase italic text-[10px] text-slate-800`}>{item.name}</h4></div><StatusPicker section={sec.id} index={idx} status={item.status} disabled={item.hasIt === false} /></div>{(item.status === 'REGULAR' || item.status === 'BAD') && item.hasIt !== false && (<EvidencePanel item={item} onUpdate={(u) => updateEvidence(sec.id, idx, u)} />)}</div>))}</div>)}
                </div>
            ))}

            <div id="accessories" className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors.accessories ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                <button onClick={() => setOpenSections(p => ({...p, accessories: !p.accessories}))} className="w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-indigo-600 hover:bg-slate-100 transition-all"><div className="flex items-center gap-4"><Zap className="text-indigo-600" size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">Sección E: Inventario y Seguridad</h3></div>{openSections.accessories ? <ChevronUp/> : <ChevronDown/>}</button>
                {openSections.accessories && (<div className="p-6 space-y-3 animate-fadeIn">{accessoryItems.map((item, idx) => (<div key={idx} className="space-y-2 border-b border-slate-50 pb-4 last:border-0 last:pb-0"><div className={`p-5 rounded-[2rem] border transition-all ${item.status === undefined && errors.accessories ? 'border-rose-500 bg-rose-50 shadow-inner' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col sm:flex-row items-center justify-between gap-6"><div className="flex-1 w-full sm:w-1/3"><h4 className="font-black text-slate-800 uppercase italic text-[11px] leading-tight">{item.name}</h4></div><div className="flex-1 flex justify-center items-center gap-3 w-full sm:w-1/3"><div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border bg-white border-slate-200 shadow-sm`}><button type="button" onClick={() => updateManualItem(idx, 'quantityFound', Math.max(0, item.quantityFound - 1))} className="text-slate-400 hover:text-rose-500"><MinusCircle size={20}/></button><div className="flex flex-col items-center"><input type="number" min="0" onFocus={(e) => e.target.select()} className="w-12 text-center font-black text-xl bg-transparent outline-none text-blue-600" value={item.quantityFound} onChange={e => updateManualItem(idx, 'quantityFound', Number(e.target.value))} /></div><button type="button" onClick={() => updateManualItem(idx, 'quantityFound', item.quantityFound + 1)} className="text-slate-400 hover:text-rose-500"><PlusCircle size={20}/></button></div></div><div className="flex-1 flex justify-end w-full sm:w-1/3"><StatusPicker section="accessories" index={idx} status={item.status} /></div></div></div>{(item.status === 'REGULAR' || item.status === 'BAD' || item.quantityFound === 0) && (<EvidencePanel item={item} onUpdate={(u) => updateEvidence('accessories', idx, u)} />)}</div>))}</div>)}
            </div>

            {/* SECCIÓN F: HALLAZGOS POR DIAGRAMA */}
            {masterFindingsImage && (
                <div id="findings" className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden`}>
                    <button onClick={() => setOpenSections(p => ({...p, findings: !p.findings}))} className="w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-rose-600 hover:bg-slate-100 transition-all"><div className="flex items-center gap-4"><LucideCrosshair className="text-rose-600" size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">Sección F: Hallazgos por Diagrama</h3></div>{openSections.findings ? <ChevronUp/> : <ChevronDown/>}</button>
                    {openSections.findings && (
                        <div className="p-8 space-y-10 animate-fadeIn">
                            <div className="bg-slate-950 p-4 rounded-[3rem] shadow-2xl relative overflow-hidden group border-4 border-slate-900">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center text-white mb-4">
                                    <div className="flex items-center gap-4"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano Técnico Maestro</span></div>
                                    <p className="text-[9px] font-bold text-slate-400 italic">Haga clic en la imagen para marcar un punto de hallazgo</p>
                                </div>
                                <div ref={findingsImageRef} onClick={handleFindingsClick} className="relative cursor-crosshair flex items-center justify-center min-h-[400px]">
                                    <img src={masterFindingsImage} className="max-w-full h-auto rounded-2xl select-none" alt="Diagrama Maestro" />
                                    {findingsMarkers.map((marker) => (
                                        <div key={marker.id} className="absolute w-8 h-8 -ml-4 -mt-4 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-white font-black text-xs shadow-xl animate-fadeIn" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
                                            {marker.id}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {findingsMarkers.map((marker) => (
                                    <div key={marker.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 space-y-4 animate-fadeIn">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black text-sm">#{marker.id}</div>
                                                <h5 className="font-black uppercase italic text-slate-800 text-xs">Detalle Punto de Hallazgo {marker.id}</h5>
                                            </div>
                                            <button onClick={() => removeFindingMarker(marker.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><LucideMessageSquare size={12}/> Comentario Técnico</label>
                                                <textarea rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:ring-4 focus:ring-rose-100 resize-none shadow-inner" placeholder="Describa el hallazgo en este punto..." value={marker.comment} onChange={e => updateFindingField(marker.id, 'comment', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Camera size={14}/> Evidencia Fotográfica</label>
                                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 group bg-white">
                                                    {marker.photo ? (
                                                        <>
                                                            <img src={marker.photo} className="w-full h-full object-cover" alt={`Hallazgo ${marker.id}`} />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <button onClick={() => updateFindingField(marker.id, 'photo', undefined)} className="p-3 bg-rose-600 text-white rounded-xl"><Trash2 size={20}/></button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-slate-300">
                                                            <Camera size={32} className="mb-2"/>
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Click para capturar</span>
                                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFindingPhoto(marker.id, e)} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {findingsMarkers.length === 0 && (
                                    <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No se han marcado hallazgos sobre el plano aún</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <section className="bg-slate-950 p-12 rounded-[4rem] text-white space-y-12 shadow-2xl relative overflow-hidden">
                <div className="pt-6 border-b border-white/5 pb-12"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> VEREDICTO DE SEGURIDAD OPERATIVA</h4><div className="flex bg-slate-900/50 p-2 rounded-[2.5rem] border border-white/10 shadow-2xl"><button type="button" onClick={() => setCanCirculate(true)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${canCirculate ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><ShieldCheck size={20}/> SÍ (APTA PARA CIRCULAR)</button><button type="button" onClick={() => setCanCirculate(false)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${!canCirculate ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><ShieldAlert size={20}/> NO (FUERA DE SERVICIO)</button></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10"><div className="space-y-12 flex flex-col items-center"><SignaturePad id="signature_pad" label="Firma del Inspector" onEnd={setSignature} error={errors.signature_pad} /></div><div className="space-y-8 h-full flex flex-col"><div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Aclaración Inspector</label><input className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:ring-4 focus:ring-blue-500/20" value={clarification} onChange={e => setClarification(e.target.value.toUpperCase())} /></div><div className="space-y-3 flex-1 flex flex-col"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Observaciones Generales</label><textarea rows={6} className="w-full flex-1 px-8 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-bold text-white outline-none resize-none custom-scrollbar focus:ring-4 focus:ring-indigo-50 shadow-inner" placeholder="NOTAS ADICIONALES PARA EL REPORTE..." value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} /></div></div></div>
                <div className="flex justify-end pt-10"><button onClick={handleSave} className="w-full md:w-auto px-20 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[3rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 group"><Save size={28}/> Generar Reporte v19.3.0</button></div>
            </section>
        </div>
    );
};