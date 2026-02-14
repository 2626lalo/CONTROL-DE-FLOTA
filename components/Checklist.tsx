import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CHECKLIST_SECTIONS } from '../constants';
import { Checklist as ChecklistType, ChecklistItem, AccessoryItem, Vehicle, VehicleStatus, FindingMarker } from '../types';
import { 
  ArrowLeft, Eraser, ChevronDown, ChevronUp, FileText, Plus, Save, 
  Search, Cpu, Check, MapPin, Eye, Lightbulb, Zap, 
  Camera, X, AlertTriangle, Gauge, LucideLocate, LucideMaximize2,
  LucideFileSearch2, LucideX, LucideChevronRight, LucideMapPinCheck, LucideMapPinHouse,
  LucideMessageSquare, Trash2, Layout, Truck, LucideDownload, LucideClock,
  LucideShieldCheck, Mail, LucideAlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { compressImage } from '../utils/imageCompressor';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ImageZoomModal } from './ImageZoomModal';

const SignaturePad = ({ onEnd, label, error, id }: { onEnd: (base64: string) => void, label: string, error?: boolean, id?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect && rect.width > 0) {
                canvas.width = rect.width;
                canvas.height = 150;
                const ctx = canvas.getContext('2d');
                if (ctx) { 
                    ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a'; 
                    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; 
                }
            }
        }
    };

    useEffect(() => {
        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        return () => window.removeEventListener('resize', setupCanvas);
    }, []);

    const getCoords = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    };

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.beginPath(); ctx.moveTo(x, y);
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.lineTo(x, y); ctx.stroke();
        }
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
                    {error && <span className="text-[7px] font-black text-rose-600 uppercase italic">Justificación Obligatoria</span>}
                </div>
                <textarea 
                    className={`w-full p-2.5 bg-white border rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100 resize-none ${error ? 'border-rose-400' : 'border-slate-200'}`}
                    placeholder="Describa el motivo del faltante o daño..."
                    value={item.observation || ''}
                    onChange={e => onUpdate({ observation: e.target.value })}
                    rows={2}
                />
            </div>
        </div>
    );
};

const PreviewItem: React.FC<{ item: any }> = ({ item }) => (
    <div className="py-3 border-b border-slate-100 last:border-0">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{item.name}</p>
                {item.observation && (
                    <p className="text-[9px] font-bold text-slate-400 italic mt-1 leading-relaxed">Nota: {item.observation}</p>
                )}
                {item.images && item.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                        {item.images.map((img: string, i: number) => (
                            <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                                <img src={img} className="w-full h-full object-cover" alt="Evidencia" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="shrink-0 text-right">
                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                    item.hasIt === false ? 'bg-slate-100 text-slate-400 border-slate-200' :
                    item.status === 'GOOD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    item.status === 'REGULAR' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    item.status === 'BAD' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-300 border-slate-100'
                }`}>
                    {item.hasIt === false ? 'NO POSEE' : 
                         item.status === 'GOOD' ? 'OK' : 
                         item.status === 'REGULAR' ? 'REGULAR' : 
                         item.status === 'BAD' ? 'DEFECTUOSO' : 'SIN EVALUAR'}
                </span>
            </div>
        </div>
    </div>
);

export const Checklist = () => {
    const { vehicles, addChecklist, user, checklists, addNotification, masterFindingsImage } = useApp();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const plateFromUrl = searchParams.get('plate');
    const autoType = searchParams.get('type');
    
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'VIEW'>(plateFromUrl ? 'CREATE' : 'LIST');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingChecklist, setViewingChecklist] = useState<ChecklistType | null>(null);
    const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
    const [showHtmlPreview, setShowHtmlPreview] = useState(false);

    const [plateSearch, setPlateSearch] = useState(plateFromUrl || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const [km, setKm] = useState<number>(0);
    const [province, setProvince] = useState(''); 
    const [gpsCoords, setGpsCoords] = useState<string>('');
    const [checkType, setCheckType] = useState(autoType || 'DIARIO');
    const [originSector, setOriginSector] = useState('');
    const [destinationSector, setDestinationSector] = useState('');
    const [receivedBy, setReceivedBy] = useState('');
    const [receiverSignature, setReceiverSignature] = useState('');
    const [signature, setSignature] = useState('');
    const [clarification, setClarification] = useState(`${user?.nombre || ''} ${user?.apellido || ''}`.trim().toUpperCase());
    const [canCirculate, setCanCirculate] = useState(true);
    const [generalObservations, setGeneralObservations] = useState('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const [sendEmail, setSendEmail] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
    const [currentEmail, setCurrentEmail] = useState('');

    const [motorItems, setMotorItems] = useState<ChecklistItem[]>([]);
    const [lightItems, setLightItems] = useState<ChecklistItem[]>([]);
    const [generalItems, setGeneralItems] = useState<any[]>([]);
    const [bodyworkItems, setBodyworkItems] = useState<ChecklistItem[]>([]);
    const [accessoryItems, setAccessoryItems] = useState<any[]>([]);
    
    const [findingsMarkers, setFindingsMarkers] = useState<FindingMarker[]>([]);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ 
      motor: true, lights: false, general: true, bodywork: false, accessories: true, findings: true 
    });

    const filteredVehicles = useMemo(() => 
        vehicles.filter(v => v.plate.toUpperCase().includes(plateSearch.toUpperCase()))
    , [plateSearch, vehicles]);

    const selectedVehicle = useMemo(() => vehicles.find(v => v.plate === plateSearch), [plateSearch, vehicles]);

    useEffect(() => {
        if (viewMode === 'CREATE' && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setGpsCoords(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
                (err) => console.error("GPS Error:", err),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, [viewMode]);

    useEffect(() => {
        if (!selectedVehicle) return;
        setKm(selectedVehicle.currentKm || 0);
        setProvince(selectedVehicle.province || 'Mendoza');
        setMotorItems(CHECKLIST_SECTIONS.motor.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        setLightItems(CHECKLIST_SECTIONS.lights.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        setGeneralItems(CHECKLIST_SECTIONS.general.map(name => ({ name, status: undefined as any, observation: '', images: [], hasIt: name === 'Equipo de Frío' ? (selectedVehicle.fichaTecnica?.apariencia.tipoCaja.includes('frio') || false) : true })));
        setBodyworkItems(CHECKLIST_SECTIONS.bodywork.map(name => ({ name, status: undefined as any, observation: '', images: [] })));
        
        const fichaAcc = selectedVehicle.fichaTecnica?.equipamiento.accesoriosEstandar;
        setAccessoryItems((fichaAcc?.length ? fichaAcc.filter(a => a.isEquipped) : CHECKLIST_SECTIONS.accessories.map(n => ({ name: n, isEquipped: true, quantity: 1 }))).map((a: any) => ({ 
            name: a.name, quantity: a.quantity || 1, quantityFound: a.quantity || 1, 
            status: undefined as any, observation: '', images: [], hasIt: true
        })));
    }, [selectedVehicle]);

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        let firstErrorId = '';

        const setError = (id: string) => {
            newErrors[id] = true;
            if (!firstErrorId) firstErrorId = id;
        };

        if (!selectedVehicle) setError('plate_input');
        if (km < (selectedVehicle?.currentKm || 0)) setError('km_input');
        if (!province?.trim()) setError('province_input');
        if (!signature) setError('signature_pad');
        
        if (['REEMPLAZO', 'POR CAMBIO DE TURNO', 'ENTREGA / RECEPCIÓN'].includes(checkType) && (!receivedBy || !receiverSignature)) setError('received_by_input');
        if (['INGRESO', 'EGRESO', 'VIAJE DE INGRESO', 'VIAJE DE EGRESO'].includes(checkType) && (!originSector || !destinationSector)) setError('travel_inputs');

        const checkItems = (items: any[], sectionId: string) => {
            items.forEach((item, idx) => {
                if (item.hasIt !== false && item.status === undefined) {
                    newErrors[sectionId] = true;
                    if (!firstErrorId) firstErrorId = sectionId;
                }
                if (item.hasIt !== false && (item.status === 'REGULAR' || item.status === 'BAD' || item.quantityFound < item.quantity) && !item.observation?.trim()) {
                  setError(`obs_${sectionId}_${idx}`);
                }
            });
        };

        checkItems(motorItems, 'motor');
        checkItems(lightItems, 'lights');
        checkItems(generalItems, 'general');
        checkItems(bodyworkItems, 'bodywork');
        checkItems(accessoryItems, 'accessories');

        setErrors(newErrors);
        if (firstErrorId) {
            const el = document.getElementById(firstErrorId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            addNotification("Por favor, complete los campos faltantes resaltados.", "warning");
        }
        return Object.keys(newErrors).length === 0;
    };

    const addEmail = () => {
        if (currentEmail && currentEmail.includes('@') && !emailRecipients.includes(currentEmail.toLowerCase())) {
            setEmailRecipients([...emailRecipients, currentEmail.toLowerCase()]);
            setCurrentEmail('');
        }
    };

    const removeEmail = (email: string) => {
        setEmailRecipients(emailRecipients.filter(e => e !== email));
    };

    const handleSave = () => {
        if (!validateForm()) return;
        addChecklist({
            id: `CHK-${Date.now()}`, vehiclePlate: plateSearch, userId: user?.id || 'sys',
            userName: clarification, date: new Date().toISOString(), type: checkType, 
            km, costCenter: selectedVehicle?.costCenter || 'S/A', currentProvince: province, canCirculate, 
            motor: motorItems, lights: lightItems, general: generalItems, 
            bodywork: bodyworkItems, accessories: accessoryItems, 
            findingsMarkers, signature, clarification, generalObservations, 
            receivedBy, receiverSignature, originSector, destinationSector,
            emailRecipients: sendEmail ? emailRecipients : []
        });
        addNotification("Reporte generado y guardado.", "success");
        setViewMode('LIST');
    };

    const handleGeneratePDF = (data: ChecklistType) => {
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();
        
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pw, 45, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("REPORTE DE INSPECCIÓN TÉCNICA", 14, 25);
        doc.setFontSize(9); doc.text(`UNIDAD: ${data.vehiclePlate} | KM: ${data.km.toLocaleString()} | TIPO: ${data.type}`, 14, 35);
        doc.text(`UBICACIÓN: ${data.currentProvince.toUpperCase()} | FECHA: ${format(parseISO(data.date), 'dd/MM/yyyy HH:mm')}`, 14, 40);
        
        const summary = [
            ['Veredicto Operativo', data.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO'],
            ['Responsable Técnico', data.clarification],
            ['Observaciones Generales', data.generalObservations || 'Sin notas adicionales']
        ];

        autoTable(doc, {
            startY: 50,
            head: [['SÍNTESIS DE REGISTRO', 'ESTADO']],
            body: summary,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] }
        });

        const sections = [
            { t: 'SECCIÓN A: MECÁNICA Y NIVELES', d: data.motor },
            { t: 'SECCIÓN B: ILUMINACIÓN', d: data.lights },
            { t: 'SECCIÓN C: CABINA', d: data.general },
            { t: 'SECCIÓN D: CARROCERÍA', d: data.bodywork },
            { t: 'SECCIÓN E: ACCESORIOS', d: data.accessories }
        ];

        let finalY = (doc as any).lastAutoTable.finalY + 10;
        sections.forEach(s => {
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.text(s.t, 14, finalY);
            autoTable(doc, {
                startY: finalY + 5,
                head: [['ÍTEM', 'ESTADO', 'DETALLE DE NOVEDAD']],
                body: s.d.map((i:any) => [
                    i.name.toUpperCase(), 
                    i.hasIt === false ? 'NO POSEE' : (i.status === 'GOOD' ? 'OK' : i.status === 'REGULAR' ? 'REGULAR' : i.status === 'BAD' ? 'DEFECTUOSO' : 'N/E'),
                    i.observation || '-'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] },
                styles: { fontSize: 8 }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save(`Inspeccion_${data.vehiclePlate}_${format(parseISO(data.date), 'yyyyMMdd_HHmm')}.pdf`);
    };

    const ThumbnailsRow = ({ images }: { images: string[] }) => (
        images && images.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
                {images.map((img, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in" onClick={() => setZoomedImage({url: img, label: 'Evidencia'})}>
                        <img src={img} className="w-full h-full object-cover" alt="Evidencia" />
                    </div>
                ))}
            </div>
        ) : null
    );

    const StatusPicker = ({ section, index, status, disabled }: { section: string, index: number, status: any, disabled?: boolean }) => (
        <div className={`flex items-center gap-2 ${disabled ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 flex-wrap">
                {['GOOD', 'REGULAR', 'BAD'].map((s: any) => (
                    <button key={s} type="button" onClick={() => {
                        const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
                        const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
                        const ni = [...itemsMap[section]];
                        ni[index].status = s;
                        setMap[section](ni);
                        if (s === 'BAD') setCanCirculate(false);
                    }} className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${status === s ? (s === 'GOOD' ? 'bg-emerald-500' : s === 'REGULAR' ? 'bg-amber-500' : 'bg-rose-500') + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {s === 'GOOD' ? 'OK' : s === 'REGULAR' ? 'REG' : 'DEF'}
                    </button>
                ))}
            </div>
            {!disabled && (
                <label className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Camera size={16}/>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        const compressed = await compressImage(await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result as string); rd.readAsDataURL(e.target.files![0]); }));
                        const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
                        const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
                        const ni = [...itemsMap[section]];
                        ni[index].images = [...(ni[index].images || []), compressed];
                        setMap[section](ni);
                    }} />
                </label>
            )}
        </div>
    );

    const DossierView = ({ data, onDownload, onClose }: { data: ChecklistType, onDownload?: () => void, onClose: () => void }) => (
        <div className="fixed inset-0 z-[2100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 animate-fadeIn">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[98vw] lg:max-w-6xl h-[95vh] flex flex-col overflow-hidden border-t-[12px] border-indigo-600">
                <div className="bg-slate-950 p-4 md:p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 md:p-4 bg-indigo-600 rounded-2xl md:rounded-3xl shadow-xl"><LucideFileSearch2 size={24}/></div>
                        <div className="hidden sm:block">
                            <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter leading-none">Hoja de Inspección</h3>
                            <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronización de Campo Digital</p>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4">
                        {onDownload && (
                            <button onClick={onDownload} className="px-3 md:px-6 py-2 md:py-3 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg">
                                <LucideDownload size={16}/> <span className="hidden sm:inline">Descargar PDF</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-3 md:p-4 bg-white/10 hover:bg-rose-600 text-white rounded-xl md:rounded-2xl transition-all shadow-xl"><LucideX size={20}/></button>
                    </div>
                </div>
                
                <div className="flex-1 bg-slate-100 p-2 md:p-10 overflow-auto custom-scrollbar font-sans w-full">
                    <div className="mx-auto bg-white shadow-inner rounded-[2rem] overflow-hidden border border-slate-200 min-w-[320px] lg:max-w-4xl">
                        <div className="p-4 md:p-12 space-y-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start border-b-4 border-slate-900 pb-6 gap-4">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-900">Hoja de Inspección Técnica</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <LucideClock size={12} className="text-blue-600"/>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{format(parseISO(data.date), "dd 'de' MMMM, yyyy HH:mm'hs'", {locale: es})}</p>
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidad Auditada</p>
                                    <p className="text-3xl md:text-4xl font-black text-slate-900 italic uppercase leading-none">{data.vehiclePlate}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Contexto de Operación</p>
                                    <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-700">
                                        <div className="flex justify-between"><span className="text-slate-400 uppercase text-[9px]">Kilometraje:</span> <span>{data.km.toLocaleString()} KM</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 uppercase text-[9px]">Tipo Control:</span> <span className="uppercase">{data.type}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 uppercase text-[9px]">Ubicación:</span> <span className="uppercase">{data.currentProvince}</span></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Responsable Técnico</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase italic">{data.clarification}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{data.costCenter}</p>
                                    </div>
                                    <div className={`p-4 rounded-2xl text-center font-black uppercase text-xs border-2 shadow-sm ${data.canCirculate ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-rose-50 border-rose-500 text-rose-600'}`}>
                                        {data.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {[
                                    { t: 'SECCIÓN A: MECÁNICA Y NIVELES', d: data.motor, icon: Cpu, color: 'text-blue-600' },
                                    { t: 'SECCIÓN B: ILUMINACIÓN', d: data.lights, icon: Lightbulb, color: 'text-amber-500' },
                                    { t: 'SECCIÓN C: CABINA Y CONTROLES', d: data.general, icon: Layout, color: 'text-emerald-600' },
                                    { t: 'SECCIÓN D: CARROCERÍA', d: data.bodywork, icon: Truck, color: 'text-rose-500' },
                                    { t: 'SECCIÓN E: INVENTARIO ACCESORIOS', d: data.accessories, icon: Zap, color: 'text-indigo-600' }
                                ].map((section, sidx) => (
                                    <div key={sidx} className="space-y-4">
                                        <div className="flex items-center gap-3 border-b pb-2">
                                            <section.icon className={section.color} size={18}/>
                                            <h4 className="text-xs font-black text-slate-800 uppercase italic tracking-widest">{section.t}</h4>
                                        </div>
                                        <div className="space-y-1">
                                            {section.d.map((item, iidx) => (
                                                <PreviewItem key={iidx} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {data.findingsMarkers && data.findingsMarkers.length > 0 && masterFindingsImage && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b pb-2">
                                            <LucideMaximize2 className="text-indigo-900" size={18}/>
                                            <h4 className="text-xs font-black text-slate-800 uppercase italic tracking-widest">SECCIÓN F: MAPEO DE HALLAZGOS</h4>
                                        </div>
                                        <div className="relative border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 mb-6">
                                            <img src={masterFindingsImage} className="w-full h-auto" alt="Plano" />
                                            {data.findingsMarkers.map((m, idx) => (
                                                <div key={m.id} className="absolute w-6 h-6 -ml-3 -mt-3 bg-rose-600 text-white rounded-full flex items-center justify-center font-black text-[8px] shadow-lg border-2 border-white" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                                                    {idx + 1}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {data.findingsMarkers.map((m, idx) => (
                                                <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                                                    <span className="font-black text-rose-600 text-[10px]">{idx + 1}.</span>
                                                    <p className="text-[9px] font-bold text-slate-600 uppercase italic">"{m.comment || 'SIN DETALLE TÉCNICO'}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t-2 border-slate-100">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones Generales</p>
                                    <div className="p-6 bg-slate-50 rounded-3xl min-h-[120px] text-xs font-bold text-slate-600 leading-relaxed italic border border-slate-100">
                                        {data.generalObservations ? `"${data.generalObservations}"` : "Sin anotaciones adicionales de campo."}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma de Conformidad</p>
                                    <div className="h-40 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-inner relative group">
                                        {data.signature ? (
                                            <img src={data.signature} className="h-full object-contain mix-blend-multiply" alt="Firma" />
                                        ) : (
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Sin firma digital</p>
                                        )}
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{data.clarification}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"><LucideShieldCheck className="text-blue-600" size={14}/> Certificación Digital FleetPro</p>
                    <button onClick={onClose} className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"><LucideX size={16}/> Cerrar Vista</button>
                </div>
            </div>
        </div>
    );

    if (viewMode === 'LIST') {
        return (
            <div className="space-y-8 animate-fadeIn pb-10">
                {viewingChecklist && (
                    <DossierView 
                        data={viewingChecklist} 
                        onDownload={() => handleGeneratePDF(viewingChecklist)} 
                        onClose={() => setViewingChecklist(null)} 
                    />
                )}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic flex items-center gap-3"><FileText className="text-blue-600" size={36}/> Inspecciones</h1>
                    <button 
                      disabled={vehicles.length === 0}
                      onClick={() => setViewMode('CREATE')} 
                      className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl transition-all text-[11px] uppercase tracking-widest ${vehicles.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      <Plus size={24}/> Nueva Auditoría
                    </button>
                </div>

                {vehicles.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-center gap-6 animate-fadeIn">
                     <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl shadow-inner"><LucideAlertCircle size={32}/></div>
                     <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase italic tracking-tighter">Sin activos habilitados</h4>
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mt-1">Para iniciar una auditoría, primero debe <Link to="/vehicles/new" className="text-amber-900 underline font-black">registrar unidades</Link> en la base de datos de flota.</p>
                     </div>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50"><Search className="text-slate-400" size={24}/><input type="text" placeholder="Buscar patente..." className="bg-transparent border-none outline-none font-bold text-slate-700 w-full text-lg uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    <div className="divide-y divide-slate-50">
                        {checklists.filter(c => c.vehiclePlate.includes(searchTerm.toUpperCase())).map(c => (
                            <div key={c.id} onClick={() => setViewingChecklist(c)} className="p-6 hover:bg-slate-50 transition-all flex justify-between items-center cursor-pointer group">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0 ${c.canCirculate ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        {c.vehiclePlate.substring(0,2)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic group-hover:text-blue-600 transition-colors">{c.vehiclePlate}</h3>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{format(parseISO(c.date), 'dd/MM/yyyy HH:mm')} • {c.userName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4">
                                    <div className="hidden sm:block p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Eye size={20}/>
                                    </div>
                                    <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all" size={24}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentChecklistDataForPreview: ChecklistType = {
        id: 'PREVIEW',
        vehiclePlate: plateSearch,
        userId: user?.id || 'sys',
        userName: clarification,
        date: new Date().toISOString(),
        type: checkType,
        km: km,
        costCenter: selectedVehicle?.costCenter || 'S/A',
        currentProvince: province,
        canCirculate: canCirculate,
        motor: motorItems,
        lights: lightItems,
        general: generalItems,
        bodywork: bodyworkItems,
        accessories: accessoryItems,
        findingsMarkers,
        signature: signature,
        clarification: clarification,
        generalObservations: generalObservations
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fadeIn px-2 md:px-4 space-y-8">
            {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
            
            {showHtmlPreview && (
                <DossierView 
                    data={currentChecklistDataForPreview} 
                    onClose={() => setShowHtmlPreview(false)} 
                />
            )}

            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('LIST')} className="p-3 md:p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-all"><ArrowLeft size={24}/></button>
                <div><h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Inspección Operativa</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SISTEMA EMPRESARIAL</p></div>
            </div>

            <section className={`bg-white p-6 md:p-10 rounded-[3rem] text-slate-800 shadow-2xl relative border-t-8 transition-all ${errors.plate_input || errors.km_input || errors.travel_inputs || errors.province_input ? 'border-rose-500' : 'border-blue-600'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unidad (Patente)</label>
                        <input id="plate_input" type="text" className={`w-full px-6 py-5 bg-slate-50 border rounded-2xl font-black text-2xl uppercase outline-none focus:ring-4 focus:ring-blue-100 ${errors.plate_input ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} placeholder="BUSCAR..." value={plateSearch} onChange={e => { setPlateSearch(e.target.value.toUpperCase()); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}/>
                        {showSuggestions && (
                            <div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto custom-scrollbar">
                              {filteredVehicles.length > 0 ? filteredVehicles.map(v => (
                                <div key={v.plate} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50" onClick={() => { setPlateSearch(v.plate); setShowSuggestions(false); }}>
                                    <span className="text-slate-900 font-black text-lg italic">{v.plate}</span>
                                    <span className="text-slate-400 font-bold text-[9px] uppercase">{v.make} {v.model}</span>
                                </div>
                              )) : (
                                <div className="p-6 text-center text-[9px] font-black text-slate-400 uppercase">Sin resultados en flota</div>
                              )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Kilometraje Auditado</label>
                        <input id="km_input" type="number" onFocus={(e) => e.target.select()} className={`w-full px-8 py-5 bg-slate-50 border rounded-2xl font-black text-4xl outline-none ${errors.km_input ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-blue-600'}`} value={km || ''} onChange={e => setKm(Number(e.target.value))} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 mt-6">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Control</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] outline-none" value={checkType} onChange={e => setCheckType(e.target.value)}>
                            {['DIARIO', 'VIAJE DE INGRESO', 'VIAJE DE EGRESO', 'REEMPLAZO', 'POR CAMBIO DE TURNO', 'ENTREGA / RECEPCIÓN'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Ubicación Actual (Manual)</label>
                        <input id="province_input" type="text" className={`w-full px-4 py-3 rounded-xl border font-black text-[10px] uppercase outline-none ${errors.province_input ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-200 focus:bg-white'}`} placeholder="Ingrese lugar de auditoría..." value={province} onChange={e => setProvince(e.target.value.toUpperCase())} />
                    </div>
                </div>

                {gpsCoords && (
                    <div className="mt-4 p-4 bg-blue-600/5 border border-blue-200 rounded-2xl flex items-center gap-4 animate-fadeIn">
                        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"><LucideLocate size={20} className="animate-pulse" /></div>
                        <div className="flex-1"><p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Posición Real GPS (Automática)</p><p className="text-[11px] font-black text-blue-600 italic mt-1">{gpsCoords}</p></div>
                        <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Sincronizado</span>
                    </div>
                )}

                {['VIAJE DE INGRESO', 'VIAJE DE EGRESO'].includes(checkType) && (
                    <div id="travel_inputs" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 animate-fadeIn border-t border-slate-100 mt-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><LucideMapPinHouse size={10} className="text-blue-500"/> Lugar Origen</label>
                            <input type="text" className={`w-full px-4 py-3 rounded-xl border font-bold text-[10px] uppercase outline-none transition-all ${errors.travel_inputs && !originSector ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-200 focus:bg-white'}`} placeholder="Punto de Salida..." value={originSector} onChange={e => setOriginSector(e.target.value.toUpperCase())} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><LucideMapPinCheck size={10} className="text-emerald-500"/> Lugar Destino</label>
                            <input type="text" className={`w-full px-4 py-3 rounded-xl border font-bold text-[10px] uppercase outline-none transition-all ${errors.travel_inputs && !destinationSector ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-200 focus:bg-white'}`} placeholder="Punto de Llegada..." value={destinationSector} onChange={e => setDestinationSector(e.target.value.toUpperCase())} />
                        </div>
                    </div>
                )}
            </section>

            {[
                { id: 'motor', label: 'Sección A: Mecánica y Niveles', icon: Cpu, items: motorItems, color: 'blue' },
                { id: 'lights', label: 'Sección B: Iluminación', icon: Lightbulb, items: lightItems, color: 'amber' },
                { id: 'general', label: 'Sección C: Controles y Cabina', icon: Layout, items: generalItems, color: 'emerald' },
                { id: 'bodywork', label: 'Sección D: Carrocería', icon: Truck, items: bodyworkItems, color: 'rose' }
            ].map(sec => (
                <div id={sec.id} key={sec.id} className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors[sec.id] ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                    <button onClick={() => setOpenSections(p => ({...p, [sec.id]: !p[sec.id]}))} className={`w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-${sec.color}-500 hover:bg-slate-100 transition-all`}><div className="flex items-center gap-4"><sec.icon className={`text-${sec.color}-500`} size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">{sec.label}</h3></div>{openSections[sec.id] ? <ChevronUp/> : <ChevronDown/>}</button>
                    {openSections[sec.id] && (
                        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {sec.items.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className={`p-4 rounded-2xl border flex flex-col transition-all ${item.status === undefined && item.hasIt !== false && errors[sec.id] ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                                            <div className="flex items-center gap-4">
                                                {sec.id === 'general' && item.name === 'Equipo de Frío' && (
                                                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                                                      <button 
                                                          type="button"
                                                          onClick={() => {
                                                              const ni = [...generalItems];
                                                              ni[idx].hasIt = true;
                                                              setGeneralItems(ni);
                                                          }}
                                                          className={`px-2 py-1 rounded text-[7px] font-black transition-all ${item.hasIt !== false ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                                      >SI</button>
                                                      <button 
                                                          type="button"
                                                          onClick={() => {
                                                              const ni = [...generalItems];
                                                              ni[idx].hasIt = false;
                                                              ni[idx].status = undefined;
                                                              ni[idx].observation = '';
                                                              setGeneralItems(ni);
                                                          }}
                                                          className={`px-2 py-1 rounded text-[7px] font-black transition-all ${item.hasIt === false ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                                      >NO</button>
                                                  </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <h4 className={`font-black uppercase italic text-[10px] text-slate-800`}>{item.name}</h4>
                                                    <ThumbnailsRow images={item.images || []} />
                                                </div>
                                            </div>
                                            <StatusPicker section={sec.id} index={idx} status={item.status} disabled={item.hasIt === false} />
                                        </div>
                                    </div>
                                    {(item.status === 'REGULAR' || item.status === 'BAD') && item.hasIt !== false && (
                                        <EvidencePanel id={`obs_${sec.id}_${idx}`} item={item} onUpdate={(u) => {
                                            const setMap: any = { motor: setMotorItems, lights: setLightItems, general: setGeneralItems, bodywork: setBodyworkItems, accessories: setAccessoryItems };
                                            const itemsMap: any = { motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems };
                                            const ni = [...itemsMap[sec.id]];
                                            ni[idx] = { ...ni[idx], ...u };
                                            setMap[sec.id](ni);
                                            if (u.observation?.trim()) setErrors(prev => ({ ...prev, [`obs_${sec.id}_${idx}`]: false }));
                                        }} error={errors[`obs_${sec.id}_${idx}`]} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <div id="accessories" className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors.accessories ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                <button onClick={() => setOpenSections(p => ({...p, accessories: !p.accessories}))} className="w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-indigo-600 hover:bg-slate-100 transition-all"><div className="flex items-center gap-4"><Zap className="text-indigo-600" size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">Sección E: Inventario y Seguridad</h3></div>{openSections.accessories ? <ChevronUp/> : <ChevronDown/>}</button>
                {openSections.accessories && (
                    <div className="p-4 md:p-6 space-y-3 animate-fadeIn">
                        {accessoryItems.map((item, idx) => (
                            <div key={idx} className="space-y-2 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                <div className={`p-4 md:p-5 rounded-[2rem] border transition-all ${item.status === undefined && errors.accessories ? 'border-rose-500 bg-rose-50 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                                        <div className="flex-1 w-full sm:w-1/3 text-center sm:text-left">
                                            <h4 className="font-black text-slate-800 uppercase italic text-[11px] leading-tight">{item.name}</h4>
                                            <ThumbnailsRow images={item.images || []} />
                                        </div>
                                        <div className="flex-1 flex justify-center items-center gap-3 w-full sm:w-1/3">
                                            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border bg-white border-slate-200 shadow-sm`}>
                                                <button type="button" onClick={() => { const na = [...accessoryItems]; na[idx].quantityFound = Math.max(0, item.quantityFound - 1); setAccessoryItems(na); }} className="text-slate-400 hover:text-rose-500"><Plus size={16} className="rotate-45"/></button>
                                                <input type="number" onFocus={(e) => e.target.select()} className="w-12 text-center font-black text-xl bg-transparent outline-none text-blue-600" value={item.quantityFound} onChange={e => { const na = [...accessoryItems]; na[idx].quantityFound = Number(e.target.value); setAccessoryItems(na); }} />
                                                <button type="button" onClick={() => { const na = [...accessoryItems]; na[idx].quantityFound = item.quantityFound + 1; setAccessoryItems(na); }} className="text-slate-400 hover:text-rose-500"><Plus size={16}/></button>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-center sm:justify-end w-full sm:w-1/3"><StatusPicker section="accessories" index={idx} status={item.status} /></div>
                                    </div>
                                </div>
                                {(item.status === 'REGULAR' || item.status === 'BAD' || item.quantityFound < item.quantity) && (<EvidencePanel id={`obs_accessories_${idx}`} item={item} onUpdate={(u) => {
                                    const na = [...accessoryItems];
                                    na[idx] = { ...na[idx], ...u };
                                    setAccessoryItems(na);
                                    if (u.observation?.trim()) setErrors(prev => ({ ...prev, [`obs_accessories_${idx}`]: false }));
                                }} error={errors[`obs_accessories_${idx}`]} />)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {masterFindingsImage && (
                <div id="findings" className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors.findings ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                    <button type="button" onClick={() => setOpenSections(p => ({...p, findings: !p.findings}))} className="w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-indigo-900 hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-4">
                            <LucideMaximize2 className="text-indigo-900" size={24}/>
                            <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">Sección F: Mapeo de Hallazgos Técnicos</h3>
                        </div>
                        {openSections.findings ? <ChevronUp/> : <ChevronDown/>}
                    </button>
                    {openSections.findings && (
                        <div className="p-6 space-y-8 animate-fadeIn">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Presione sobre el diagrama para marcar un hallazgo o daño detectado en la unidad.</p>
                            <div className="relative border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50 cursor-crosshair group shadow-inner" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setFindingsMarkers([...findingsMarkers, { id: Date.now(), x, y, comment: '' }]);
                            }}>
                                <img src={masterFindingsImage} className="w-full h-auto select-none" alt="Plano Maestro" draggable={false} />
                                {findingsMarkers.map((m, idx) => (
                                    <div key={m.id} className="absolute w-6 h-6 md:w-8 md:h-8 -ml-3 -mt-3 md:-ml-4 md:-mt-4 bg-rose-600 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-2xl border-2 border-white animate-pulse z-20" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                                        {idx + 1}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {findingsMarkers.map((m, idx) => (
                                    <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center animate-fadeIn">
                                        <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg">{idx + 1}</div>
                                        <input 
                                            placeholder="Describa el hallazgo detectado..." 
                                            className="flex-1 w-full bg-white px-4 py-3 rounded-xl text-[10px] font-bold outline-none border border-slate-200 focus:border-rose-400" 
                                            value={m.comment} 
                                            onChange={e => {
                                                const nm = [...findingsMarkers];
                                                nm[idx].comment = e.target.value.toUpperCase();
                                                setFindingsMarkers(nm);
                                            }} 
                                        />
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setFindingsMarkers(findingsMarkers.filter(x => x.id !== m.id)); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                ))}
                                {findingsMarkers.length === 0 && (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Sin marcadores de hallazgos registrados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <section className={`bg-slate-950 p-8 md:p-12 rounded-[4rem] text-white space-y-12 shadow-2xl relative transition-all ${errors.received_by_input || errors.signature_pad ? 'ring-4 ring-rose-500/50' : ''}`}>
                <div className="pt-6 border-b border-white/5 pb-12">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Check size={16} className="text-emerald-500"/> VEREDICTO DE SEGURIDAD OPERATIVA
                    </h4>
                    <div className="flex flex-col sm:flex-row bg-slate-900/50 p-2 rounded-[2.5rem] border border-white/10 shadow-2xl gap-2">
                        <button type="button" onClick={() => setCanCirculate(true)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${canCirculate ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>APTA PARA CIRCULAR</button>
                        <button type="button" onClick={() => setCanCirculate(false)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${!canCirculate ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>FUERA DE SERVICIO</button>
                    </div>
                </div>

                <div className="pt-6 border-b border-white/5 pb-12 animate-fadeIn">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Mail size={16} className="text-blue-400"/> ¿DESEA ENVIAR EL REGISTRO POR CORREO ELECTRÓNICO?
                    </h4>
                    <div className="flex flex-col sm:flex-row bg-slate-900/50 p-2 rounded-[2.5rem] border border-white/10 shadow-2xl gap-2">
                        <button type="button" onClick={() => { setSendEmail(false); setEmailRecipients([]); }} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${!sendEmail ? 'bg-slate-700 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>NO</button>
                        <button type="button" onClick={() => setSendEmail(true)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${sendEmail ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>SÍ</button>
                    </div>
                    
                    {sendEmail && (
                        <div className="mt-8 space-y-4 animate-fadeIn">
                            <div className="flex gap-2">
                                <input 
                                    type="email" 
                                    placeholder="CORREO@EJEMPLO.COM" 
                                    className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                                    value={currentEmail}
                                    onChange={e => setCurrentEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                                />
                                <button type="button" onClick={addEmail} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shrink-0"><Plus size={20}/></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {emailRecipients.map(e => (
                                    <div key={e} className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-3 group animate-fadeIn">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight italic">{e}</span>
                                        <button type="button" onClick={() => removeEmail(e)} className="text-slate-500 hover:text-rose-500 transition-all"><X size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-12 flex flex-col items-center">
                        <div className="w-full space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Firma del Inspector</label>
                            <input className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:ring-4 focus:ring-blue-500/20" value={clarification} onChange={e => setClarification(e.target.value.toUpperCase())} />
                        </div>
                        <SignaturePad id="signature_pad" label="Área de Firma" onEnd={setSignature} error={errors.signature_pad} />
                    </div>

                    <div className="space-y-8 h-full flex flex-col">
                        {['REEMPLAZO', 'POR CAMBIO DE TURNO', 'ENTREGA / RECEPCIÓN'].includes(checkType) && (
                            <div id="received_by_input" className="space-y-10 animate-fadeIn bg-white/5 p-6 md:p-8 rounded-[3rem] border border-white/10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Receptor</label>
                                    <input className={`w-full px-8 py-5 bg-white/5 border rounded-[2rem] font-black text-white outline-none ${errors.received_by_input && !receivedBy ? 'border-rose-500' : 'border-white/10'}`} placeholder="NOMBRE DEL TERCERO..." value={receivedBy} onChange={e => setReceivedBy(e.target.value.toUpperCase())} />
                                </div>
                                <SignaturePad label="Firma Receptor" onEnd={setReceiverSignature} error={errors.received_by_input && !receiverSignature} />
                            </div>
                        )}
                        <div className="space-y-3 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Observaciones Generales</label>
                            <textarea rows={6} className="w-full flex-1 px-8 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-bold text-white outline-none resize-none custom-scrollbar" placeholder="NOTAS ADICIONALES..." value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-10 border-t border-white/5">
                    <button onClick={() => setViewMode('LIST')} className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border border-white/5"><LucideX size={18}/> Cancelar</button>
                    <button onClick={() => { if(validateForm()) setShowHtmlPreview(true); }} className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95"><LucideFileSearch2 size={18}/> Vista Previa Registro</button>
                    <button onClick={handleSave} className="w-full md:w-auto px-16 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[3rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 group"><Save size={28}/> Generar Reporte</button>
                </div>
            </section>
        </div>
    );
};