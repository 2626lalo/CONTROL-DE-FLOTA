
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
  Building2, MapPinHouse, MapPinCheck, FileSearch, LucideCrosshair, LucideMessageSquare
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
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
    const { vehicles, addChecklist, user, checklists, addNotification, syncExtinguisherDate, logAudit, masterFindingsImage } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Parámetros de vinculación con el gestor de servicios
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
    
    const [showFindings, setShowFindings] = useState(false);
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
        const newMarker: FindingMarker = { id: Date.now(), x, y, comment: '' };
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

    const scrollToFirstError = (newErrors: Record<string, boolean>) => {
        const firstErrorId = Object.keys(newErrors)[0];
        const element = document.getElementById(firstErrorId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (['motor', 'lights', 'general', 'bodywork', 'accessories'].includes(firstErrorId)) {
                setOpenSections(prev => ({ ...prev, [firstErrorId]: true }));
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!selectedVehicle) { newErrors.plate_input = true; }
        if (km < (selectedVehicle?.currentKm || 0) || km < 0) { newErrors.km_input = true; }
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

        accessoryItems.forEach((item, idx) => {
            if (item.quantityFound === 0 && !item.observation?.trim()) {
                newErrors[`acc_obs_${idx}`] = true;
                newErrors.accessories = true;
            }
        });

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            addNotification("Faltan campos por completar o hay errores de validación técnica", "error");
            scrollToFirstError(newErrors);
            return false;
        }
        return true;
    };

    const getExtStatus = (dateStr: string) => {
        if (!dateStr) return null;
        const today = startOfDay(new Date());
        const expDate = parseISO(dateStr);
        const diff = differenceInDays(expDate, today);
        if (diff < 0) return { label: `VENCIDO HACE ${Math.abs(diff)} DÍAS`, color: 'text-rose-600 font-black', bg: 'bg-rose-50 border-rose-200', isCritical: true, action: 'PROGRAMAR RECARGA' };
        return { label: `VIGENTE (${diff} DÍAS RESTANTES)`, color: 'text-emerald-600 font-bold', bg: 'bg-emerald-50 border-emerald-200', isCritical: false, action: null };
    };

    const generatePDF = (checklistData: ChecklistType) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 20;

        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("REPORTE TÉCNICO INTEGRAL DE INSPECCIÓN", 15, 25);
        doc.setFontSize(10); doc.text(`UNIDAD: ${checklistData.vehiclePlate} | KM: ${checklistData.km.toLocaleString()} | FECHA: ${format(parseISO(checklistData.date), 'dd/MM/yyyy HH:mm')}`, 15, 35);

        autoTable(doc, {
            startY: 55,
            head: [['CAMPO', 'VALOR']],
            body: [
                ['AUDITOR', checklistData.userName],
                ['TIPO CONTROL', checklistData.type],
                ['CENTRO DE COSTO', checklistData.costCenter || 'S/A'],
                ['HOJA DE RUTA', checklistData.originSector ? `${checklistData.originSector} -> ${checklistData.destinationSector}` : '-'],
                ['ESTATUS', checklistData.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO'],
                ['RECEPTOR', checklistData.receivedBy || 'N/A'],
                ['OBSERVACIONES', checklistData.generalObservations || 'SIN OBSERVACIONES']
            ],
            theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        const sections = [
            { name: 'MOTOR Y NIVELES', items: checklistData.motor },
            { name: 'ILUMINACIÓN', items: checklistData.lights },
            { name: 'CONTROLES Y CABINA', items: checklistData.general },
            { name: 'CARROCERÍA', items: checklistData.bodywork },
            { name: 'INVENTARIO Y SEGURIDAD', items: checklistData.accessories }
        ];

        const newsSummary: any[] = [];

        for (const sec of sections) {
            if (currentY > 260) { doc.addPage(); currentY = 20; }
            doc.setFillColor(241, 245, 249); doc.rect(15, currentY, pageWidth - 30, 8, 'F');
            doc.setTextColor(51, 65, 85); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.text(sec.name, 20, currentY + 6);
            currentY += 12;

            for (const item of sec.items) {
                if (currentY > 270) { doc.addPage(); currentY = 20; }
                
                let statusLabel = item.status === 'GOOD' ? 'OK' : item.status === 'REGULAR' ? 'REGULAR' : 'DEFECTUOSO';
                if (item.name === 'Equipo de Frío' && (item as any).hasIt === false) { statusLabel = 'SIN EQUIPO'; }

                const extStatus = getExtStatus((item as any).expirationDates?.[0] || '');
                if (extStatus?.isCritical) { statusLabel = 'VENCIDO PROGRAMAR MANTENIMIENTO'; }
                
                if (item.status === 'REGULAR' || item.status === 'BAD' || extStatus?.isCritical) {
                    newsSummary.push({
                        sector: sec.name,
                        item: item.name,
                        status: statusLabel,
                        observation: item.observation || 'SIN DETALLE ADICIONAL'
                    });
                }

                const qtyText = (item as any).quantityFound !== undefined ? ` [En la unidad: ${(item as any).quantityFound}]` : '';
                const expDateText = (item as any).expirationDates?.[0] ? ` (Vence: ${(item as any).expirationDates[0]})` : '';
                
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
                doc.text(`• ${item.name}${qtyText}${expDateText}: `, 15, currentY);
                const nameWidth = doc.getTextWidth(`• ${item.name}${qtyText}${expDateText}: `);
                
                doc.setFont('helvetica', (item.observation || extStatus?.isCritical) ? 'bold' : 'normal');
                doc.setTextColor(item.status === 'BAD' || extStatus?.isCritical ? 190 : 30, 18, 41);
                
                const finalStatus = extStatus?.isCritical ? statusLabel : (item.observation ? item.observation.toUpperCase() : statusLabel);
                doc.text(finalStatus, 15 + nameWidth, currentY);
                currentY += 6;

                if (item.images && item.images.length > 0) {
                    let imgX = 20;
                    for (const img of item.images) {
                        if (currentY > 230) { doc.addPage(); currentY = 20; }
                        try { doc.addImage(img, 'JPEG', imgX, currentY, 40, 30); imgX += 45; if (imgX > 160) { imgX = 20; currentY += 35; } } catch (e) {}
                    }
                    if (imgX !== 20) currentY += 35;
                }
            }
            currentY += 5;
        }

        if (checklistData.findingsMarkers && checklistData.findingsMarkers.length > 0) {
            doc.addPage();
            currentY = 20;
            doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text("REGISTRO DE HALLAZGOS POR DIAGRAMA", 15, 36);
            currentY = 50;

            autoTable(doc, {
                startY: currentY,
                head: [['ID', 'OBSERVACIÓN / DIAGNÓSTICO']],
                body: checklistData.findingsMarkers.map((m, i) => [i + 1, m.comment.toUpperCase()]),
                theme: 'grid',
                headStyles: { fillColor: [190, 18, 41] }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        doc.addPage();
        currentY = 20;
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text("RESUMEN EJECUTIVO DE NOVEDADES Y HALLAZGOS", 15, 36);
        currentY = 50;

        if (newsSummary.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [['SECTOR', 'ÍTEM AFECTADO', 'ESTADO DETECTADO', 'OBSERVACIÓN / DETALLE']],
                body: newsSummary.map(n => [n.sector, n.item, n.status, n.observation.toUpperCase()]),
                theme: 'grid',
                headStyles: { fillColor: [190, 18, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 4 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
            doc.setTextColor(30, 41, 59); doc.setFontSize(10); doc.setFont('helvetica', 'italic');
            doc.text("No se detectaron desviaciones operativas en los puntos de control inspeccionados.", 15, currentY);
            currentY += 20;
        }

        if (currentY > 230) { doc.addPage(); currentY = 20; }
        doc.line(15, currentY, pageWidth - 15, currentY);
        currentY += 15;
        if (checklistData.signature) {
            doc.addImage(checklistData.signature, 'PNG', 15, currentY, 60, 30);
            doc.setFontSize(8); doc.setTextColor(0,0,0); doc.text(`FIRMA INSPECTOR: ${checklistData.userName}`, 15, currentY + 35);
        }
        if (checklistData.receiverSignature) {
            doc.addImage(checklistData.receiverSignature, 'PNG', pageWidth - 75, currentY, 60, 30);
            doc.setFontSize(8); doc.setTextColor(0,0,0); doc.text(`FIRMA RECEPTOR: ${checklistData.receivedBy}`, pageWidth - 75, currentY + 35);
        }

        return doc;
    };

    const handlePreview = () => {
        if (!validateForm()) return;
        const mockChecklist: any = {
            vehiclePlate: plateSearch, userName: clarification, date: new Date().toISOString(),
            type: checkType, km, canCirculate, signature, receivedBy, receiverSignature,
            currentProvince: province, originSector, destinationSector, generalObservations, costCenter,
            motor: motorItems, lights: lightItems, general: generalItems, bodywork: bodyworkItems, accessories: accessoryItems,
            findingsMarkers: showFindings ? findingsMarkers : []
        };
        const doc = generatePDF(mockChecklist);
        window.open(doc.output('bloburl') as unknown as string, '_blank');
    };

    const handleSave = () => {
        if (!validateForm()) return;
        
        accessoryItems.forEach(item => {
            if ((item.isFireExt || item.isBotiquin) && item.expirationDates && item.expirationDates[0] && selectedVehicle) {
                const target = item.isBotiquin ? 'BOTIQUÍN' : item.name.toUpperCase().includes('1KG') ? 'MATAFUEGO 1KG' : 'MATAFUEGO 5KG';
                syncExtinguisherDate(selectedVehicle.plate, target, item.expirationDates[0]);
            }
        });

        const newChecklist: ChecklistType = {
            id: `CHK-${Date.now()}`, vehiclePlate: plateSearch, userId: user?.id || 'guest',
            userName: clarification, date: new Date().toISOString(), type: checkType, 
            km, costCenter, currentProvince: province, canCirculate, 
            motor: motorItems, lights: lightItems, general: generalItems, 
            bodywork: bodyworkItems, accessories: accessoryItems, 
            findingsMarkers: showFindings ? findingsMarkers : [],
            signature, clarification, generalObservations, 
            receivedBy, receiverSignature,
            originSector, destinationSector,
            emailRecipients: emailRecipients ? emailRecipients.split(',').map(e => e.trim()) : []
        };
        
        addChecklist(newChecklist);
        logAudit('CHECKLIST', 'VEHICLE', plateSearch, `Auditoría sincronizada: ${checkType}. KM: ${km}`);
        
        if (sendEmail && emailRecipients) {
            const subject = `INSPECCIÓN FINALIZADA: ${plateSearch} - ${checkType}`;
            const body = `Se generó un nuevo reporte de inspección para la unidad ${plateSearch}.\nAuditor: ${clarification}\nKilometraje: ${km}\nVeredicto: ${canCirculate ? 'APTA' : 'FUERA DE SERVICIO'}\nHoja de Ruta: ${originSector} -> ${destinationSector}\nObservaciones: ${generalObservations || 'Ninguna'}`;
            const mailto = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailRecipients)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailto, '_blank');
        }

        addNotification("Registro v19.3.0 archivado con éxito.", "success");
        
        if (serviceId) {
            navigate(`/service?id=${serviceId}&view=DETAIL`);
        } else {
            setViewMode('LIST');
        }
    };

    const handleViewChecklist = (c: ChecklistType) => {
        setViewingChecklist(c);
        setViewMode('VIEW');
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

    const isDoubleSignType = checkType === 'REEMPLAZO' || checkType === 'TURNO' || checkType === 'POR INGRESO A TALLER';
    const isTravelType = checkType === 'INGRESO' || checkType === 'EGRESO';
    const isKmLower = selectedVehicle && km > 0 && km < selectedVehicle.currentKm;

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
                            <div key={c.id} className="p-6 hover:bg-slate-50 transition-all flex justify-between items-center cursor-pointer group">
                                <div className="flex items-center gap-6"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${c.canCirculate ? 'bg-emerald-500' : 'bg-rose-500'}`}>{c.vehiclePlate.substring(0,2)}</div><div><h3 className="text-xl font-black text-slate-800 uppercase italic">{c.vehiclePlate}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{format(parseISO(c.date), 'dd/MM/yyyy HH:mm')} • {c.userName} • {c.type}</p></div></div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleViewChecklist(c)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ver Registro"><Eye size={20}/></button>
                                    <button onClick={() => { const doc = generatePDF(c); window.open(doc.output('bloburl') as any, '_blank'); }} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Importar/Descargar PDF"><DownloadCloud size={20}/></button>
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
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><FileSearch size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Visualización de Registro</h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inspección v19.3.0 - Unidad: {viewingChecklist.vehiclePlate}</p>
                            </div>
                        </div>
                        <button onClick={() => setViewMode('LIST')} className="text-white hover:text-rose-500 transition-colors"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Kilometraje</p><p className="text-xl font-black text-slate-900">{viewingChecklist.km.toLocaleString()} KM</p></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Tipo</p><p className="text-sm font-black text-slate-900 uppercase">{viewingChecklist.type}</p></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Centro Costo</p><p className="text-sm font-black text-slate-900 uppercase">{viewingChecklist.costCenter || 'S/A'}</p></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase">Auditor</p><p className="text-sm font-black text-slate-900 uppercase">{viewingChecklist.userName}</p></div>
                        </div>
                        {viewingChecklist.originSector && (
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-blue-800"><MapPinHouse size={20}/><div><p className="text-[8px] font-black uppercase">Origen</p><p className="font-bold uppercase text-sm">{viewingChecklist.originSector}</p></div></div>
                                <MoveRight className="text-blue-300" size={24}/>
                                <div className="flex items-center gap-4 text-blue-800 text-right"><div><p className="text-[8px] font-black uppercase">Destino</p><p className="font-bold uppercase text-sm">{viewingChecklist.destinationSector}</p></div><MapPinCheck size={20}/></div>
                            </div>
                        )}
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-3">Veredicto Operativo</p><div className="flex items-center gap-3">{viewingChecklist.canCirculate ? <ShieldCheck className="text-emerald-500" size={20}/> : <ShieldAlert className="text-rose-500" size={20}/>}<p className={`font-black uppercase text-base ${viewingChecklist.canCirculate ? 'text-emerald-600' : 'text-rose-600'}`}>{viewingChecklist.canCirculate ? 'APTA PARA CIRCULAR' : 'FUERA DE SERVICIO'}</p></div></div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-3">Resumen de Hallazgos</p><p className="text-xs font-bold text-slate-700 italic">"{viewingChecklist.generalObservations || 'Sin observaciones generales registradas en este reporte.'}"</p></div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                        <button onClick={() => setViewMode('LIST')} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-200">Volver al Listado</button>
                        <button onClick={() => { const doc = generatePDF(viewingChecklist); window.open(doc.output('bloburl') as any, '_blank'); }} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"><DownloadCloud size={20}/> Descargar Reporte Técnico PDF</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fadeIn px-4 space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('LIST')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-all"><ArrowLeft size={24}/></button>
                <div><h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Inspección Operativa</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SISTEMA EMPRESARIAL v19.3.0-PRO-FINAL</p></div>
            </div>
            <section className={`bg-white p-10 rounded-[3rem] text-slate-800 shadow-2xl relative overflow-hidden border-t-8 transition-all ${errors.plate_input || errors.km_input || isKmLower ? 'border-rose-500 shadow-rose-200 ring-4 ring-rose-50' : 'border-blue-600'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unidad (Patente)</label>
                        <div className="relative">
                            <input id="plate_input" type="text" className={`w-full px-6 py-5 bg-slate-50 border rounded-2xl font-black text-2xl uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all ${errors.plate_input ? 'border-rose-500 bg-rose-50 shadow-inner' : 'border-slate-200'}`} placeholder="BUSCAR..." value={plateSearch} onChange={e => { setPlateSearch(e.target.value.toUpperCase()); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}/>
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                        </div>
                        {selectedVehicle && (<div className="mt-2 ml-4 flex items-center gap-2 animate-fadeIn"><Building2 size={12} className="text-blue-500"/><span className="text-[9px] font-black text-slate-400 uppercase">Centro de Costo: <span className="text-blue-600 font-black">{selectedVehicle.costCenter || 'SIN ASIGNAR'}</span></span></div>)}
                        {showSuggestions && (<div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto">{filteredVehicles.map(v => (<div key={v.plate} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50" onClick={() => { setPlateSearch(v.plate); setShowSuggestions(false); setErrors(p => ({...p, plate_input: false})); }}><span className="text-slate-900 font-black text-lg italic">{v.plate}</span><div className="text-right"><p className="text-slate-400 font-bold text-[9px] uppercase">{v.make} {v.model}</p></div></div>))}</div>)}
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Kilometraje Auditado</label>
                        <div className="relative">
                            <Gauge className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${errors.km_input || isKmLower ? 'text-rose-500' : 'text-slate-300'}`} size={24}/>
                            <input id="km_input" type="number" onFocus={(e) => e.target.select()} className={`w-full pl-16 pr-6 py-5 bg-slate-50 border rounded-2xl font-black text-4xl outline-none transition-all ${errors.km_input || isKmLower ? 'border-rose-500 text-rose-600 bg-rose-50 shadow-inner' : 'border-slate-200 text-blue-600'}`} value={km === 0 ? '' : String(km).replace(/^0+/, '')} onChange={e => { const val = Number(e.target.value); setKm(val); if (val >= (selectedVehicle?.currentKm || 0)) setErrors(p => ({...p, km_input: false})); }} />
                        </div>
                        <div className="flex justify-between items-center px-4">{selectedVehicle && <p className="text-[9px] font-black text-slate-400 uppercase">Último registro: <span className="text-slate-900 font-black">{(selectedVehicle.currentKm || 0).toLocaleString()} KM</span></p>}{isKmLower && <p className="text-[8px] font-black text-rose-600 uppercase animate-pulse">Alerta: Valor inferior al registro histórico</p>}</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Control</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] outline-none" value={checkType} onChange={e => setCheckType(e.target.value)}><option value="DIARIO">DIARIO / RUTINA</option><option value="INGRESO">VIAJE DE INGRESO</option><option value="EGRESO">VIAJE DE EGRESO</option><option value="REEMPLAZO">POR REEMPLAZO</option><option value="TURNO">POR CAMBIO DE TURNO</option><option value="POR INGRESO A TALLER">POR INGRESO A TALLER</option></select></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Provincia Operativa</label><div className="relative"><MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14}/><input type="text" className="w-full pl-9 pr-4 py-3 bg-slate-100 rounded-xl border border-slate-200 font-black text-[10px] text-slate-600 outline-none uppercase focus:bg-white focus:ring-4 focus:ring-blue-50" value={province} onChange={e => setProvince(e.target.value)} /></div></div>
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
                    {openSections[sec.id] && (<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">{sec.items.map((item, idx) => (<div key={idx} className="space-y-2"><div className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${item.status === undefined && errors[sec.id] ? 'border-rose-500 bg-rose-50' : 'bg-slate-50 border-slate-100'}`}><div className="flex items-center gap-3"><div className="space-y-1"><h4 className={`font-black uppercase italic text-[10px] text-slate-800`}>{item.name}</h4>{item.images && item.images.length > 0 && (<div className="flex gap-1.5 animate-fadeIn">{item.images.map((img, pIdx) => (<div key={pIdx} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-slate-200"><img src={img} className="w-full h-full object-cover" /><button type="button" onClick={() => removePhoto(sec.id, idx, pIdx)} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><X size={10}/></button></div>))}</div>)}</div>{item.name === 'Equipo de Frío' && (<div className="flex bg-white rounded-lg border border-slate-200 p-0.5 overflow-hidden shrink-0"><button type="button" onClick={() => { const ni = [...generalItems]; ni[idx].hasIt = true; setGeneralItems(ni); }} className={`px-2 py-1 text-[8px] font-black uppercase transition-all ${item.hasIt ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>CON</button><button type="button" onClick={() => { const ni = [...generalItems]; ni[idx].hasIt = false; ni[idx].status = 'GOOD'; setGeneralItems(ni); }} className={`px-2 py-1 text-[8px] font-black uppercase transition-all ${!item.hasIt ? 'bg-slate-400 text-white' : 'text-slate-400'}`}>SIN</button></div>)}</div><StatusPicker section={sec.id} index={idx} status={item.status} disabled={item.hasIt === false} /></div>{(item.status === 'REGULAR' || item.status === 'BAD') && item.hasIt !== false && (<EvidencePanel item={item} onUpdate={(u) => updateEvidence(sec.id, idx, u)} />)}</div>))}</div>)}
                </div>
            ))}
            <div id="accessories" className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${errors.accessories ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100'} overflow-hidden`}>
                <button onClick={() => setOpenSections(p => ({...p, accessories: !p.accessories}))} className="w-full p-6 flex justify-between items-center bg-slate-50 border-l-8 border-indigo-600 hover:bg-slate-100 transition-all"><div className="flex items-center gap-4"><Zap className="text-indigo-600" size={24}/> <h3 className="font-black uppercase text-xs italic tracking-widest text-slate-800">Sección E: Inventario y Seguridad</h3></div>{openSections.accessories ? <ChevronUp/> : <ChevronDown/>}</button>
                {openSections.accessories && (<div className="p-6 space-y-3 animate-fadeIn">{accessoryItems.map((item, idx) => { const isMissing = item.quantityFound !== item.quantity; const isZero = item.quantityFound === 0; const showVencimiento = (item.isFireExt || item.isBotiquin) && item.quantityFound > 0; const showInconsistency = item.status === 'GOOD' && isMissing && item.quantityFound > 0; const hasValidationError = errors[`acc_obs_${idx}`]; return (<div key={idx} className="space-y-2 border-b border-slate-50 pb-4 last:border-0 last:pb-0"><div className={`p-5 rounded-[2rem] border transition-all ${item.status === undefined && errors.accessories ? 'border-rose-500 bg-rose-50 shadow-inner' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col sm:flex-row items-center justify-between gap-6"><div className="flex-1 w-full sm:w-1/3"><div className="flex items-center gap-3">{item.isManual ? (<div className="flex items-center gap-2 w-full"><input className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2 font-black text-slate-800 uppercase italic text-[10px] outline-none" placeholder="NOMBRE ACCESORIO..." value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value.toUpperCase())} /><button onClick={() => deleteInventoryItem(idx)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button></div>) : (<div className="space-y-1"><h4 className="font-black text-slate-800 uppercase italic text-[11px] leading-tight">{item.name}</h4>{item.specification && (<p className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded inline-block uppercase italic">{item.specification}</p>)}{showInconsistency && (<p className="text-[7px] font-black text-rose-500 animate-pulse uppercase tracking-tighter">La unidad poseía {item.quantity} unidades históricamente</p>)}{item.images && item.images.length > 0 && (<div className="flex gap-1.5 animate-fadeIn mt-2">{item.images.map((img, pIdx) => (<div key={pIdx} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-slate-200"><img src={img} className="w-full h-full object-cover" /><button type="button" onClick={() => removePhoto('accessories', idx, pIdx)} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><X size={10}/></button></div>))}</div>)}</div>)}</div>{!item.isManual && <p className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-widest">Requerido Estándar: {item.quantity}</p>}</div><div className="flex-1 flex justify-center items-center gap-3 w-full sm:w-1/3"><div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isMissing ? 'bg-rose-100 border-rose-300 shadow-inner' : 'bg-white border-slate-200 shadow-sm'}`}><button type="button" onClick={() => updateManualItem(idx, 'quantityFound', Math.max(0, item.quantityFound - 1))} className="text-slate-400 hover:text-rose-500"><MinusCircle size={20}/></button><div className="flex flex-col items-center"><span className="text-[7px] font-black text-slate-400 uppercase leading-none">Actual</span><input type="number" min="0" onFocus={(e) => e.target.select()} className={`w-12 text-center font-black text-xl bg-transparent outline-none ${isMissing ? 'text-rose-600' : 'text-blue-600'}`} value={item.quantityFound} onChange={e => updateManualItem(idx, 'quantityFound', Number(e.target.value))} /></div><button type="button" onClick={() => updateManualItem(idx, 'quantityFound', item.quantityFound + 1)} className="text-slate-400 hover:text-rose-500"><PlusCircle size={20}/></button></div></div><div className="flex-1 flex justify-end w-full sm:w-1/3"><StatusPicker section="accessories" index={idx} status={item.status} /></div></div>{showVencimiento && (<div className="mt-4 p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4 shadow-2xl"><div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-2"><Timer size={16} className="text-blue-400"/><p className="text-[9px] font-black text-white uppercase tracking-widest">Control de Vencimiento: {item.name}</p></div><div className="grid grid-cols-1 gap-6"><div className="space-y-2 group"><div className="flex justify-between items-center px-1"><label className="text-[8px] font-black text-slate-500 uppercase">Fecha de Caducidad Registrada</label>{item.status === 'GOOD' && !item.expirationDates?.[0] && (<span className="text-[7px] font-black text-rose-500 animate-pulse uppercase flex items-center gap-1"><AlertTriangle size={8}/> Inspección incompleta sin fecha</span>)}</div><input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-black text-white outline-none focus:border-blue-500 transition-all" value={item.expirationDates?.[0] || ''} onChange={e => updateExtinguisherDate(idx, e.target.value)} />{item.expirationDates?.[0] && (<div className={`p-3 rounded-xl border flex flex-col items-center justify-center animate-fadeIn ${getExtStatus(item.expirationDates[0])?.bg} ${getExtStatus(item.expirationDates[0])?.color} shadow-lg shadow-black/20`}><p className="text-[9px] font-black uppercase text-center leading-tight">{getExtStatus(item.expirationDates[0])?.label}</p>{getExtStatus(item.expirationDates[0])?.action && <p className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md mt-1 animate-bounce">{getExtStatus(item.expirationDates[0])?.action}</p>}</div>)}</div></div></div>)}</div>{(item.status === 'REGULAR' || item.status === 'BAD' || isMissing || isZero) && (<EvidencePanel id={`acc_obs_${idx}`} item={item} error={hasValidationError} onUpdate={(u) => updateEvidence('accessories', idx, u)} />)}</div>); })}<button type="button" onClick={addNewInventoryItem} className="mt-4 w-full py-6 rounded-[2.5rem] border-2 border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 group"><PackagePlus className="group-hover:scale-110 transition-transform" size={24}/><span className="font-black uppercase text-[10px] tracking-widest">Incorporar Componente Manual al Inventario</span></button></div>)}
            </div>
            <section className="bg-slate-950 p-12 rounded-[4rem] text-white space-y-12 shadow-2xl relative overflow-hidden">
                <div className="pt-6 border-b border-white/5 pb-12"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> VEREDICTO DE SEGURIDAD OPERATIVA</h4><div className="flex bg-slate-900/50 p-2 rounded-[2.5rem] border border-white/10 shadow-2xl"><button type="button" onClick={() => setCanCirculate(true)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${canCirculate ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><ShieldCheck size={20}/> SÍ (APTA PARA CIRCULAR)</button><button type="button" onClick={() => setCanCirculate(false)} className={`flex-1 py-6 rounded-[2rem] text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 ${!canCirculate ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><ShieldAlert size={20}/> NO (FUERA DE SERVICIO)</button></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10"><div className="space-y-12 flex flex-col items-center"><SignaturePad id="signature_pad" label="Firma del Inspector" onEnd={setSignature} error={errors.signature_pad} />{isDoubleSignType && (<div className="w-full space-y-8 animate-fadeIn border-t border-white/10 pt-10 mt-4"><div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><UserCheck size={16}/> Aclaración Receptor</label><input id="received_by_input" className={`w-full px-8 py-5 bg-white/5 border rounded-[2rem] font-black text-white outline-none focus:ring-4 focus:ring-blue-500/20 text-lg uppercase ${errors.received_by_input ? 'border-rose-500' : 'border-white/10'}`} placeholder="QUIEN RECIBE..." value={receivedBy} onChange={e => setReceivedBy(e.target.value.toUpperCase())} /></div><SignaturePad label="Firma de Conformidad Receptor" onEnd={setReceiverSignature} error={errors.received_by_input} /></div>)}</div><div className="space-y-8 h-full flex flex-col"><div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Aclaración Inspector</label><input className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:ring-4 focus:ring-blue-500/20" value={clarification} onChange={e => setClarification(e.target.value.toUpperCase())} /></div><div className="space-y-3 flex-1 flex flex-col"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Observaciones Generales</label><textarea rows={6} className="w-full flex-1 px-8 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-bold text-white outline-none resize-none custom-scrollbar focus:ring-4 focus:ring-indigo-500/20 shadow-inner" placeholder="NOTAS ADICIONALES PARA EL REPORTE..." value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} /></div></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 pt-10"><button onClick={handlePreview} className="py-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[3rem] font-black uppercase text-xs transition-all flex items-center justify-center gap-4 active:scale-95"><EyeIcon size={24}/> Vista Previa del Reporte</button><button onClick={handleSave} className="py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[3rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 group"><Save size={28} className="group-hover:scale-110 transition-transform"/> Generar Reporte v19.3.0</button></div>
            </section>
        </div>
    );
};
