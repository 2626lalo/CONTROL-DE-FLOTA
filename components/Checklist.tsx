
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CHECKLIST_SECTIONS } from '../constants';
import { Checklist as ChecklistType, ChecklistItem, AccessoryItem, VehicleStatus } from '../types';
import { LucideCheckCircle, LucideXCircle, LucideAlertTriangle, LucideCamera, LucideSave, LucideArrowRightLeft, LucidePenTool, LucideEraser, LucideChevronDown, LucideChevronUp, LucideTruck, LucideImage, LucideLoader, LucideZoomIn, LucideX, LucideSearch, LucideEye, LucideFileText, LucideShare2, LucideDownload, LucideCalendar, LucideUser, LucidePlus, LucideClock, LucideMapPin, LucideMinus, LucideMessageSquare, LucideShieldAlert, LucideShieldCheck } from 'lucide-react';
import { analyzeBatteryImage, analyzeExtinguisherLabel } from '../services/geminiService';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// --- PDF GENERATION HELPER ---
const generateChecklistPDF = (checklist: ChecklistType) => {
    const doc = new jsPDF();
    const dateStr = new Date(checklist.date).toLocaleString();

    // HEADER
    doc.setFillColor(41, 128, 185); // Blue
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`CHECKLIST: ${checklist.vehiclePlate}`, 14, 13);
    
    doc.setFontSize(10);
    doc.text(`${dateStr}`, 150, 13);

    let yPos = 30;

    // INFO BLOCK
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Responsable: ${checklist.userName}`, 14, yPos);
    doc.text(`Kilometraje: ${checklist.km} km`, 100, yPos);
    doc.text(`Tipo: ${checklist.type}`, 160, yPos);
    yPos += 8;
    
    // STATUS BANNER
    doc.setFont('helvetica', 'bold');
    if (checklist.canCirculate) {
        doc.setTextColor(0, 150, 0);
        doc.text("ESTADO: APTO PARA CIRCULAR", 14, yPos);
    } else {
        doc.setTextColor(200, 0, 0);
        doc.text("ESTADO: NO APTO / DETENER", 14, yPos);
    }
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // TABLE GENERATOR
    const generateSectionTable = (title: string, items: ChecklistItem[] | AccessoryItem[]) => {
        const bodyData = items.map(item => {
            let status = item.status === 'GOOD' ? 'OK' : item.status;
            let obs = item.observation || '-';

            // Special logic for accessories with quantity
            if ('quantity' in item) {
                if (item.quantity === 0) {
                    status = 'FALTANTE';
                    obs = `(No tiene) ${item.observation || ''}`;
                } else {
                    obs = `(Cant: ${item.quantity}) ${item.observation || ''}`;
                }
            } else if ('hasIt' in item && !item.hasIt) {
                 status = 'NO TIENE';
            }

            return [
                item.name,
                status,
                obs
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [[title.toUpperCase(), 'ESTADO', 'OBSERVACIONES']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30, fontStyle: 'bold' } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const val = data.cell.raw;
                    if (val === 'BAD' || val === 'NO TIENE' || val === 'FALTANTE') data.cell.styles.textColor = [200, 0, 0];
                    else if (val === 'REGULAR') data.cell.styles.textColor = [200, 150, 0];
                    else if (val === 'OK') data.cell.styles.textColor = [0, 150, 0];
                }
            }
        });
        
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 5;
    };

    generateSectionTable('Motor y Fluidos', checklist.motor);
    generateSectionTable('Luces', checklist.lights);
    generateSectionTable('General', checklist.general);
    generateSectionTable('Carrocería', checklist.bodywork);
    generateSectionTable('Accesorios', checklist.accessories);

    // SIGNATURE
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    
    if (checklist.signature) {
        doc.addImage(checklist.signature, 'PNG', 14, yPos, 40, 20);
        yPos += 22;
        doc.setFontSize(8);
        doc.text("Firma Responsable / Conductor", 14, yPos);
        if (checklist.receiverName) {
            doc.text(`Recibido por: ${checklist.receiverName}`, 14, yPos + 5);
        }
    }

    // IMAGES SECTION
    const allItems: (ChecklistItem | AccessoryItem)[] = [...checklist.motor, ...checklist.lights, ...checklist.general, ...checklist.bodywork, ...checklist.accessories];
    const itemsWithImages = allItems.filter(i => {
        if ('images' in i) {
            return i.images && i.images.length > 0;
        }
        if ('image' in i) {
            return !!i.image;
        }
        return false;
    });

    if (itemsWithImages.length > 0) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("EVIDENCIA FOTOGRÁFICA", 14, yPos);
        yPos += 10;

        itemsWithImages.forEach((item) => {
            let imgs: string[] = [];
            if ('images' in item) {
                imgs = item.images || [];
            } else if ('image' in item && item.image) {
                imgs = [item.image];
            }
            
            if (!imgs || imgs.length === 0) return;

            // Check space
            if (yPos > 240) { doc.addPage(); yPos = 20; }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Item: ${item.name} (${item.status})`, 14, yPos);
            yPos += 5;

            // Add images in a row (max 3 per row roughly)
            let xOffset = 14;
            imgs.forEach((imgBase64) => {
                if (xOffset > 150) { yPos += 45; xOffset = 14; } // Wrap
                if (yPos > 250) { doc.addPage(); yPos = 20; }
                
                try {
                    doc.addImage(imgBase64, 'JPEG', xOffset, yPos, 40, 40);
                    xOffset += 45;
                } catch (e) {
                    console.error("Error adding image to PDF", e);
                }
            });
            yPos += 45; // Move down for next item
        });
    }

    return doc;
};

// --- IMAGE VIEWER MODAL ---
const ImageViewer = ({ src, onClose }: { src: string, onClose: () => void }) => (
    <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}>
        <img src={src} className="max-w-full max-h-full object-contain rounded" alt="Evidence" />
        <button className="absolute top-4 right-4 text-white p-2 bg-slate-800/50 rounded-full hover:bg-slate-700"><LucideX size={24}/></button>
    </div>
);

// --- CHECKLIST DETAIL VIEWER (READ ONLY MODAL) ---
const ChecklistViewer = ({ checklist, onClose }: { checklist: ChecklistType, onClose: () => void }) => {
    const [zoomImage, setZoomImage] = useState<string|null>(null);

    const renderStatusBadge = (status: string, quantity?: number) => {
        if (quantity === 0) return <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-bold border border-red-100">FALTANTE</span>;
        if (status === 'GOOD') return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center gap-1"><LucideCheckCircle size={10}/> OK</span>;
        if (status === 'REGULAR') return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold flex items-center gap-1"><LucideAlertTriangle size={10}/> REG</span>;
        return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold flex items-center gap-1"><LucideXCircle size={10}/> MAL</span>;
    };

    const SectionBlock = ({ title, items }: { title: string, items: ChecklistItem[] | AccessoryItem[] }) => (
        <div className="mb-6">
            <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1 text-sm uppercase">{title}</h4>
            <div className="space-y-2">
                {items.map((item, idx) => {
                    const imgs = ('images' in item ? item.images : ('image' in item && item.image ? [item.image] : [])) || [];
                    const hasObs = !!item.observation;
                    const hasImgs = imgs.length > 0;
                    const status = item.status;
                    const isBad = status === 'BAD';
                    const hasCustomData = 'customData' in item && !!item.customData;
                    
                    // Quantity Logic
                    const qty = 'quantity' in item ? item.quantity : undefined;
                    const hasQty = qty !== undefined;

                    return (
                        <div key={idx} className={`p-2 rounded border ${isBad || (qty === 0) ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700">
                                    {item.name} 
                                    {hasQty && qty > 0 && <span className="ml-2 text-xs text-slate-500 font-bold bg-slate-100 px-1.5 rounded">x{qty}</span>}
                                </span>
                                {renderStatusBadge(item.status, qty)}
                            </div>
                            {(hasObs || hasImgs || hasCustomData) && (
                                <div className="mt-2 pl-2 border-l-2 border-slate-200 space-y-2">
                                    {hasObs && <p className="text-xs text-slate-600 italic">"{item.observation}"</p>}
                                    {hasCustomData && item.customData && (
                                        <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                                            {Object.entries(item.customData).map(([k,v]) => <span key={k} className="mr-2"><b>{k}:</b> {String(v)}</span>)}
                                        </div>
                                    )}
                                    {hasImgs && (
                                        <div className="flex gap-2 overflow-x-auto py-1">
                                            {imgs.map((img, i) => (
                                                <img 
                                                    key={i} 
                                                    src={img} 
                                                    className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80" 
                                                    onClick={() => setZoomImage(img)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            {zoomImage && <ImageViewer src={zoomImage} onClose={() => setZoomImage(null)} />}
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <LucideFileText className="text-blue-400"/> Checklist Detalle
                        </h2>
                        <p className="text-slate-400 text-sm">{checklist.vehiclePlate} • {new Date(checklist.date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"><LucideX size={24}/></button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    
                    {/* STATUS CARD */}
                    <div className={`p-4 rounded-xl border mb-6 flex items-center gap-4 ${checklist.canCirculate ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                        {checklist.canCirculate ? <LucideCheckCircle size={32}/> : <LucideXCircle size={32}/>}
                        <div>
                            <h3 className="font-bold text-lg">{checklist.canCirculate ? 'APTO PARA CIRCULAR' : 'NO APTO / DETENER'}</h3>
                            <p className="text-sm opacity-80">Resultado de la inspección</p>
                        </div>
                    </div>

                    {/* METADATA GRID */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="bg-white p-3 rounded border border-slate-200">
                            <span className="block text-slate-400 text-xs font-bold uppercase mb-1">Conductor / Responsable</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                <LucideUser size={16} className="text-blue-500"/> {checklist.userName}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-slate-200">
                            <span className="block text-slate-400 text-xs font-bold uppercase mb-1">Kilometraje</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                <LucideTruck size={16} className="text-blue-500"/> {checklist.km.toLocaleString()} km
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-slate-200">
                            <span className="block text-slate-400 text-xs font-bold uppercase mb-1">Tipo de Control</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                <LucideClock size={16} className="text-blue-500"/> {checklist.type}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-slate-200">
                            <span className="block text-slate-400 text-xs font-bold uppercase mb-1">ID Registro</span>
                            <div className="flex items-center gap-2 font-mono text-slate-600 text-xs">
                                {checklist.id}
                            </div>
                        </div>
                    </div>

                    {/* SECTIONS */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <SectionBlock title="Motor y Fluidos" items={checklist.motor} />
                        <SectionBlock title="Luces" items={checklist.lights} />
                        <SectionBlock title="General y Seguridad" items={checklist.general} />
                        <SectionBlock title="Carrocería" items={checklist.bodywork} />
                        <SectionBlock title="Accesorios" items={checklist.accessories} />
                    </div>

                    {/* SIGNATURE */}
                    {checklist.signature && (
                        <div className="mt-6 border-t border-slate-200 pt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Firma Digital</p>
                            <img src={checklist.signature} alt="Firma" className="max-h-20 border border-slate-200 rounded bg-white p-2" />
                            {checklist.receiverName && <p className="text-sm mt-2 text-slate-600">Recibido por: <b>{checklist.receiverName}</b></p>}
                        </div>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition">
                        Cerrar
                    </button>
                    <button onClick={() => generateChecklistPDF(checklist).save(`checklist_${checklist.vehiclePlate}.pdf`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2">
                        <LucideDownload size={18}/> Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

// Signature Pad Component
const SignaturePad = ({ onEnd }: { onEnd: (base64: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 300;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000000';
            }
        }
    }, []);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const endDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onEnd(canvas.toDataURL());
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            onEnd('');
        }
    };

    return (
        <div className="border border-slate-300 rounded bg-white relative">
            <canvas 
                ref={canvasRef}
                className="w-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
            />
            <button type="button" onClick={clear} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                <LucideEraser size={16}/>
            </button>
        </div>
    );
};

export const Checklist = () => {
    const { vehicles, addChecklist, user, checklists } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // VIEW STATE: 'LIST' or 'CREATE'
    // If URL has 'plate', we assume creation mode immediately
    const initialView = searchParams.get('plate') ? 'CREATE' : 'LIST';
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>(initialView);
    const [searchTerm, setSearchTerm] = useState('');

    // --- VIEW CHECKLIST DETAIL STATE ---
    const [viewingChecklist, setViewingChecklist] = useState<ChecklistType | null>(null);

    // --- FORM STATE ---
    const [selectedPlate, setSelectedPlate] = useState(searchParams.get('plate') || '');
    const [type, setType] = useState<'DAILY' | 'TRIP' | 'REPLACEMENT'>('DAILY');
    const [km, setKm] = useState<number>(0);
    
    // Alert State
    const [insuranceInfo, setInsuranceInfo] = useState<{date: string, days: number, status: string, company: string} | null>(null);
    
    // Sections State
    const [motorItems, setMotorItems] = useState<ChecklistItem[]>([]);
    const [lightItems, setLightItems] = useState<ChecklistItem[]>([]);
    const [generalItems, setGeneralItems] = useState<ChecklistItem[]>([]);
    const [bodyworkItems, setBodyworkItems] = useState<ChecklistItem[]>([]);
    const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>([]);

    const [canCirculate, setCanCirculate] = useState(true);
    const [receiverName, setReceiverName] = useState('');
    const [replacementPlate, setReplacementPlate] = useState('');
    const [signature, setSignature] = useState('');
    
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ motor: true, lights: false, general: false, bodywork: false, accessories: false });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [analyzingItemIndex, setAnalyzingItemIndex] = useState<{section: string, index: number} | null>(null);

    // Initialize items based on constants
    useEffect(() => {
        setMotorItems(CHECKLIST_SECTIONS.motor.map(name => ({ name, status: 'GOOD', images: [] })));
        setLightItems(CHECKLIST_SECTIONS.lights.map(name => ({ name, status: 'GOOD', images: [] })));
        setGeneralItems(CHECKLIST_SECTIONS.general.map(name => ({ name, status: 'GOOD', images: [] })));
        setBodyworkItems(CHECKLIST_SECTIONS.bodywork.map(name => ({ name, status: 'GOOD', images: [] })));
        setAccessoryItems(CHECKLIST_SECTIONS.accessories.map(name => ({ name, hasIt: true, quantity: 1, status: 'GOOD', observation: '' })));
    }, []);

    // Set initial KM and Insurance Info when plate selected
    useEffect(() => {
        if(selectedPlate) {
            const vehicle = vehicles.find(veh => veh.plate === selectedPlate);
            if(vehicle) {
                // 1. KM Logic: Find last checklist for this plate
                const vehicleHistory = checklists.filter(c => c.vehiclePlate === selectedPlate);
                // Sort by ID or Date to get the absolute latest
                vehicleHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const lastChecklist = vehicleHistory[0];
                
                // Use last checklist KM if available and greater than vehicle manual KM (safety check)
                // Otherwise fallback to vehicle current KM
                const suggestedKm = lastChecklist ? Math.max(lastChecklist.km, vehicle.currentKm) : vehicle.currentKm;
                setKm(suggestedKm);

                // 2. Insurance Logic
                const insuranceDoc = vehicle.documents && vehicle.documents.find(d => d.type === 'INSURANCE');
                if (insuranceDoc && insuranceDoc.expirationDate) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const exp = new Date(insuranceDoc.expirationDate);
                    // Use UTC or simple calculation to avoid timezone issues for simple days diff
                    const diffTime = exp.getTime() - today.getTime();
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let status = 'OK';
                    if (days < 0) status = 'EXPIRED';
                    else if (days <= 30) status = 'WARNING';

                    setInsuranceInfo({
                        date: insuranceDoc.expirationDate,
                        days: days,
                        status: status,
                        company: insuranceDoc.issuer || 'Seguro'
                    });
                } else {
                    setInsuranceInfo(null);
                }
            }
        } else {
            setKm(0);
            setInsuranceInfo(null);
        }
    }, [selectedPlate, vehicles, checklists]);

    // FILTERED LIST
    const filteredChecklists = checklists
        .filter(c => 
            c.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.userName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        // SORT BY PLATE THEN DATE (DESC)
        .sort((a, b) => {
            if (a.vehiclePlate === b.vehiclePlate) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return a.vehiclePlate.localeCompare(b.vehiclePlate);
        });

    const updateItemStatus = (section: string, index: number, status: 'GOOD' | 'REGULAR' | 'BAD') => {
        const update = (items: ChecklistItem[], setItems: any) => {
            const newItems = [...items];
            newItems[index].status = status;
            setItems(newItems);
        };
        if(section === 'motor') update(motorItems, setMotorItems);
        else if(section === 'lights') update(lightItems, setLightItems);
        else if(section === 'general') update(generalItems, setGeneralItems);
        else if(section === 'bodywork') update(bodyworkItems, setBodyworkItems);
        else if(section === 'accessories') {
            const newItems = [...accessoryItems];
            newItems[index].status = status;
            setAccessoryItems(newItems);
        }
    };
    
    // New Helper for Accessories
    const updateAccessoryQuantity = (index: number, newQty: number) => {
        if (newQty < 0) return;
        const newItems = [...accessoryItems];
        newItems[index].quantity = newQty;
        newItems[index].hasIt = newQty > 0;
        
        // Reset status if added back
        if (newQty > 0 && newItems[index].status === 'BAD') {
             // Optional: Reset to GOOD if user adds item back? 
             // Or keep as is. Let's keep as is unless it was 'Faltante' implicitly
        }
        setAccessoryItems(newItems);
    };

    const updateAccessoryObservation = (index: number, text: string) => {
        const newItems = [...accessoryItems];
        newItems[index].observation = text;
        setAccessoryItems(newItems);
    };

    // --- PHOTO UPLOAD LOGIC ---
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, index: number) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            
            const updateImage = (items: ChecklistItem[], setItems: any) => {
                const newItems = [...items];
                const currentItem = newItems[index];
                
                // Add image
                if (currentItem.images) {
                    currentItem.images = [base64];
                } else {
                    currentItem.images = [base64];
                }

                // AI ANALYSIS FOR BATTERY
                if (currentItem.name === 'Batería') {
                    setAnalyzingItemIndex({ section, index });
                    analyzeBatteryImage(base64.split(',')[1]).then(result => {
                        if (result) {
                            currentItem.customData = {
                                brand: result.brand || '',
                                serialNumber: result.serialNumber || ''
                            };
                            setItems([...newItems]); // Trigger re-render with new data
                        }
                        setAnalyzingItemIndex(null);
                    });
                } else {
                     setItems(newItems);
                }
            };

            if(section === 'motor') updateImage(motorItems, setMotorItems);
            else if(section === 'lights') updateImage(lightItems, setLightItems);
            else if(section === 'general') updateImage(generalItems, setGeneralItems);
            else if(section === 'bodywork') updateImage(bodyworkItems, setBodyworkItems);
        };
        reader.readAsDataURL(file);
    };

    // --- ACCESSORY PHOTO UPLOAD (EXTINGUISHERS) ---
    const handleAccessoryPhoto = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();

        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const newItems = [...accessoryItems];
            newItems[index].image = base64;
            setAccessoryItems(newItems);

            // AI ANALYSIS FOR EXTINGUISHER
            if (newItems[index].name.includes('Matafuego')) {
                setAnalyzingItemIndex({ section: 'accessories', index });
                const result = await analyzeExtinguisherLabel(base64.split(',')[1]);
                if (result && result.expirationDate) {
                    newItems[index].expirationDate = result.expirationDate;
                    setAccessoryItems([...newItems]);
                }
                setAnalyzingItemIndex(null);
            }
        };
        reader.readAsDataURL(file);
    };


    const toggleSection = (sec: string) => {
        setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const handleSubmit = () => {
        const errors = [];
        if(!selectedPlate) errors.push("Seleccione una unidad.");
        if(km <= 0) errors.push("Ingrese el kilometraje actual.");
        if(type === 'REPLACEMENT' && !replacementPlate) errors.push("Seleccione la unidad de reemplazo.");
        if(!receiverName && type === 'REPLACEMENT') errors.push("Ingrese nombre de quien recibe.");
        if(!signature) errors.push("La firma es obligatoria.");

        // Validate vehicle exists
        const vehicle = vehicles.find(v => v.plate === selectedPlate);
        
        // Modified Validation: Check against previous checklist KM instead of base vehicle KM to avoid logic errors if manual update failed
        const vehicleHistory = checklists.filter(c => c.vehiclePlate === selectedPlate);
        const lastChecklistKm = vehicleHistory.length > 0 ? Math.max(...vehicleHistory.map(c => c.km)) : (vehicle ? vehicle.currentKm : 0);
        
        if(km < lastChecklistKm) errors.push(`El kilometraje no puede ser menor al último registrado (${lastChecklistKm}).`);

        // VALIDATE MANDATORY PHOTOS
        const validateSection = (items: ChecklistItem[], secName: string) => {
            items.forEach(item => {
                if (item.status === 'BAD' && (!item.images || item.images.length === 0)) {
                    errors.push(`${secName}: ${item.name} marcado como MAL requiere una foto.`);
                }
                if (item.name === 'Batería' && (!item.images || item.images.length === 0)) {
                    errors.push(`${secName}: La Batería requiere una foto obligatoria.`);
                }
            });
        };

        validateSection(motorItems, 'Motor');
        validateSection(lightItems, 'Luces');
        validateSection(generalItems, 'General');
        validateSection(bodyworkItems, 'Carrocería');

        // VALIDATE EXTINGUISHERS & MISSING REASONS
        accessoryItems.forEach(acc => {
            if (acc.hasIt && acc.name.includes('Matafuego') && !acc.expirationDate) {
                errors.push(`Accesorios: ${acc.name} requiere fecha de vencimiento.`);
            }
            if (acc.quantity === 0 && (!acc.observation || acc.observation.trim() === '')) {
                errors.push(`Accesorios: Indique el motivo del faltante de ${acc.name}.`);
            }
        });

        if(errors.length > 0) {
            setValidationErrors(errors);
            window.scrollTo(0,0);
            return;
        }

        const newChecklist: ChecklistType = {
            id: `CHK-${Date.now()}`,
            vehiclePlate: selectedPlate,
            userId: user && user.id ? user.id : 'unknown',
            userName: user && user.name ? user.name : 'Usuario',
            date: new Date().toISOString(),
            type,
            km,
            insuranceCompany: insuranceInfo && insuranceInfo.company ? insuranceInfo.company : 'N/A', // Auto-populate from discovered doc
            insuranceExpiration: insuranceInfo && insuranceInfo.date ? insuranceInfo.date : 'N/A',
            motor: motorItems,
            lights: lightItems,
            general: generalItems,
            bodywork: bodyworkItems,
            accessories: accessoryItems,
            canCirculate,
            signature,
            receiverName: receiverName || undefined,
            replacementVehiclePlate: type === 'REPLACEMENT' ? replacementPlate : undefined,
            syncStatus: 'PENDING'
        };

        addChecklist(newChecklist);
        
        // Reset and go to list
        setViewMode('LIST');
        setKm(0);
        setSelectedPlate('');
        setSignature('');
    };

    const renderItemRow = (item: ChecklistItem, index: number, section: string) => {
        const getStatusColor = () => {
            if (item.status === 'BAD') return 'bg-red-50 border-red-200';
            if (item.status === 'REGULAR') return 'bg-yellow-50 border-yellow-200';
            return 'bg-white border-slate-200 hover:border-blue-300';
        };

        const getIcon = () => {
            if (item.status === 'BAD') return <LucideXCircle className="text-red-500" size={24} />;
            if (item.status === 'REGULAR') return <LucideAlertTriangle className="text-yellow-500" size={24} />;
            return <LucideCheckCircle className="text-green-500" size={24} />;
        };

        const isBattery = item.name === 'Batería';
        const isBad = item.status === 'BAD';
        const requiresPhoto = isBad || isBattery;
        const hasPhoto = item.images && item.images.length > 0;
        const isAnalyzing = analyzingItemIndex && analyzingItemIndex.section === section && analyzingItemIndex.index === index;

        return (
            <div key={index} className={`p-4 mb-3 rounded-xl border transition-all shadow-sm ${getStatusColor()}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            {getIcon()}
                        </div>
                        <span className={`font-bold text-sm ${item.status === 'GOOD' ? 'text-slate-700' : 'text-slate-900'}`}>
                            {item.name}
                        </span>
                        {isBattery && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 rounded font-bold">Foto Obligatoria (IA)</span>}
                    </div>

                    <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm w-full sm:w-auto">
                        <button 
                            onClick={() => updateItemStatus(section, index, 'GOOD')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${item.status === 'GOOD' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            OK
                        </button>
                        <button 
                            onClick={() => updateItemStatus(section, index, 'REGULAR')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${item.status === 'REGULAR' ? 'bg-yellow-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            REG
                        </button>
                        <button 
                            onClick={() => updateItemStatus(section, index, 'BAD')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${item.status === 'BAD' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            MAL
                        </button>
                    </div>
                </div>

                {/* OBSERVATIONS & PHOTO UPLOAD AREA */}
                {(item.status !== 'GOOD' || isBattery) && (
                    <div className="mt-3 pl-0 sm:pl-9 animate-fadeIn space-y-2">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder={`Detalle el problema con ${item.name}...`}
                                className="w-full p-2.5 pl-3 pr-10 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                                value={item.observation || ''}
                                onChange={(e) => {
                                     // Helper to update observations (kept from previous code structure)
                                     const updateObs = (items: any[], setItems: any) => {
                                         const newItems = [...items]; 
                                         newItems[index].observation = e.target.value; 
                                         setItems(newItems);
                                     };
                                     if(section === 'motor') updateObs(motorItems, setMotorItems);
                                     else if(section === 'lights') updateObs(lightItems, setLightItems);
                                     else if(section === 'general') updateObs(generalItems, setGeneralItems);
                                     else if(section === 'bodywork') updateObs(bodyworkItems, setBodyworkItems);
                                }}
                            />
                            <LucidePenTool className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                        </div>

                        {/* PHOTO UPLOAD BLOCK */}
                        {requiresPhoto && (
                            <div className={`p-3 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 ${hasPhoto ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-300'}`}>
                                {isAnalyzing ? (
                                    <div className="text-blue-600 font-bold text-xs flex items-center gap-2">
                                        <LucideLoader className="animate-spin" size={16}/> Analizando Imagen...
                                    </div>
                                ) : hasPhoto ? (
                                    <div className="w-full flex items-center justify-between">
                                        <div 
                                            className="flex items-center gap-2 cursor-zoom-in"
                                            onClick={() => setPreviewImage(item.images && item.images[0] ? item.images[0] : '')}
                                        >
                                            <div className="h-10 w-10 bg-slate-200 rounded overflow-hidden relative group border border-slate-300">
                                                <img src={item.images && item.images[0] ? item.images[0] : ''} className="w-full h-full object-cover" alt="Checklist Item" />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                                            </div>
                                            <span className="text-xs font-bold text-green-700 flex items-center gap-1"><LucideCheckCircle size={12}/> Foto Cargada (Clic para Zoom)</span>
                                        </div>
                                        <label className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">
                                            Cambiar
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, section, index)}/>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 w-full">
                                        <label className="flex-1 bg-white border border-slate-300 text-slate-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100">
                                            <LucideCamera size={14}/> Cámara
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, section, index)}/>
                                        </label>
                                        <label className="flex-1 bg-white border border-slate-300 text-slate-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100">
                                            <LucideImage size={14}/> Galería
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, section, index)}/>
                                        </label>
                                    </div>
                                )}
                                
                                {isBattery && (
                                    <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                        <div className="relative">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Marca (IA)</label>
                                            <input type="text" className="w-full text-xs p-1 border rounded bg-slate-100" placeholder="Pendiente..." value={item.customData && item.customData.brand ? item.customData.brand : ''} readOnly />
                                        </div>
                                        <div className="relative">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Serie / Lote (IA)</label>
                                            <input type="text" className="w-full text-xs p-1 border rounded bg-slate-100" placeholder="Pendiente..." value={item.customData && item.customData.serialNumber ? item.customData.serialNumber : ''} readOnly />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // --- RENDER LIST VIEW ---
    if (viewMode === 'LIST') {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                {viewingChecklist && <ChecklistViewer checklist={viewingChecklist} onClose={() => setViewingChecklist(null)} />}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LucideFileText className="text-blue-600"/> Historial de Checklists
                    </h1>
                    <button 
                        onClick={() => setViewMode('CREATE')} 
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg transform active:scale-95 transition-all w-full sm:w-auto justify-center"
                    >
                        <LucidePlus size={20}/> Nuevo Checklist
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="relative">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por patente o usuario..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Unidad</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredChecklists.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{new Date(c.date).toLocaleDateString()} <span className="text-slate-400 text-xs">{new Date(c.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{c.vehiclePlate}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {c.userName.charAt(0).toUpperCase()}
                                            </div>
                                            {c.userName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                                                {c.type === 'DAILY' ? 'DIARIO' : c.type === 'TRIP' ? 'VIAJE' : 'REEMPLAZO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.canCirculate ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200 flex items-center gap-1 w-fit">
                                                    <LucideCheckCircle size={12}/> APTO
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center gap-1 w-fit">
                                                    <LucideXCircle size={12}/> NO APTO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => setViewingChecklist(c)}
                                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center"
                                                    title="Ver Detalle"
                                                >
                                                    <LucideEye size={18}/>
                                                </button>
                                                <button 
                                                    onClick={() => generateChecklistPDF(c).save(`checklist_${c.vehiclePlate}.pdf`)}
                                                    className="text-slate-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors flex items-center justify-center"
                                                    title="Descargar PDF"
                                                >
                                                    <LucideDownload size={18}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredChecklists.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No se encontraron checklists.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER CREATE FORM (EXISTING CODE) ---
    return (
        <div className="max-w-3xl mx-auto pb-20">
            {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}
            
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewMode('LIST')} className="p-2 bg-white rounded-full shadow hover:bg-slate-100 text-slate-600">
                    <LucideArrowRightLeft size={20} className="rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Nuevo Checklist</h1>
            </div>
            
            {validationErrors.length > 0 && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border-l-4 border-red-500">
                    <p className="font-bold flex items-center gap-2"><LucideAlertTriangle size={20}/> Errores:</p>
                    <ul className="list-disc list-inside text-sm mt-2">
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-slate-50 font-bold"
                            value={selectedPlate}
                            onChange={(e) => setSelectedPlate(e.target.value)}
                        >
                            <option value="">-- Seleccionar --</option>
                            {vehicles.filter(v => v.status !== VehicleStatus.INACTIVE).map(v => (
                                <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>
                            ))}
                        </select>
                        
                        {/* INSURANCE ALERT BANNER */}
                        {insuranceInfo && (
                            <div className={`mt-3 p-3 rounded-lg border-l-4 flex items-center gap-3 shadow-sm ${insuranceInfo.status === 'EXPIRED' ? 'bg-red-50 border-red-500 text-red-800' : insuranceInfo.status === 'WARNING' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
                                {insuranceInfo.status === 'EXPIRED' ? <LucideShieldAlert size={20}/> : <LucideShieldCheck size={20}/>}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">{insuranceInfo.company}</p>
                                    <p className="text-sm font-bold">
                                        Vence: {new Date(insuranceInfo.date).toLocaleDateString()} 
                                        <span className="ml-1">
                                            ({insuranceInfo.days < 0 ? `Vencido hace ${Math.abs(insuranceInfo.days)} días` : `Faltan ${insuranceInfo.days} días`})
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kilometraje</label>
                        <input 
                            type="number" 
                            className="w-full p-3 border rounded-lg bg-slate-50 font-bold"
                            value={km}
                            onChange={(e) => setKm(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Checklist</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setType('DAILY')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'DAILY' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Diario</button>
                            <button onClick={() => setType('TRIP')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'TRIP' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Viaje</button>
                            <button onClick={() => setType('REPLACEMENT')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'REPLACEMENT' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Reemplazo</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTIONS */}
            <div className="space-y-4 mb-6">
                {[
                    { id: 'motor', title: 'Motor y Fluidos', items: motorItems },
                    { id: 'lights', title: 'Luces y Tablero', items: lightItems },
                    { id: 'general', title: 'General y Seguridad', items: generalItems },
                    { id: 'bodywork', title: 'Chapa y Pintura', items: bodyworkItems },
                ].map((section) => (
                    <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button 
                            className="w-full p-4 flex justify-between items-center bg-slate-50 font-bold text-slate-700"
                            onClick={() => toggleSection(section.id)}
                        >
                            <span>{section.title}</span>
                            {openSections[section.id] ? <LucideChevronUp size={20}/> : <LucideChevronDown size={20}/>}
                        </button>
                        {openSections[section.id] && (
                            <div className="p-4 bg-slate-50/50">
                                {section.items.map((item, index) => renderItemRow(item, index, section.id))}
                            </div>
                        )}
                    </div>
                ))}
                
                 {/* Accessories Special Case */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button 
                            className="w-full p-4 flex justify-between items-center bg-slate-50 font-bold text-slate-700"
                            onClick={() => toggleSection('accessories')}
                        >
                            <span>Accesorios y Equipamiento</span>
                            {openSections['accessories'] ? <LucideChevronUp size={20}/> : <LucideChevronDown size={20}/>}
                        </button>
                        {openSections['accessories'] && (
                            <div className="p-4 space-y-2 bg-slate-50/50">
                                {accessoryItems.map((item, index) => {
                                    const isExtinguisher = item.name.includes('Matafuego');
                                    const isAnalyzing = analyzingItemIndex && analyzingItemIndex.section === 'accessories' && analyzingItemIndex.index === index;
                                    
                                    return (
                                        <div key={index} className={`flex flex-col py-3 border-b border-slate-200 last:border-0 ${item.quantity === 0 ? 'opacity-90' : ''}`}>
                                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                                <div className="flex items-center justify-between w-full sm:w-1/2 pr-4">
                                                    <span className={`text-sm font-bold ${item.quantity > 0 ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{item.name}</span>
                                                    
                                                    {/* QUANTITY CONTROLS */}
                                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg overflow-hidden h-8">
                                                        <button 
                                                            onClick={() => updateAccessoryQuantity(index, (item.quantity || 0) - 1)}
                                                            className="w-8 h-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                        >
                                                            <LucideMinus size={14}/>
                                                        </button>
                                                        <div className="w-8 h-full flex items-center justify-center font-bold text-sm border-x border-slate-200 min-w-[2rem]">
                                                            {item.quantity}
                                                        </div>
                                                        <button 
                                                            onClick={() => updateAccessoryQuantity(index, (item.quantity || 0) + 1)}
                                                            className="w-8 h-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                        >
                                                            <LucidePlus size={14}/>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-auto">
                                                    {item.quantity > 0 ? (
                                                        <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                                            <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='GOOD'; setAccessoryItems(ni)}} className={`flex-1 sm:flex-none px-3 py-1 rounded text-[10px] font-bold transition-all ${item.status==='GOOD'?'bg-green-500 text-white shadow-sm':'text-slate-400 hover:bg-slate-50'}`}>OK</button>
                                                            <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='REGULAR'; setAccessoryItems(ni)}} className={`flex-1 sm:flex-none px-3 py-1 rounded text-[10px] font-bold transition-all ${item.status==='REGULAR'?'bg-yellow-500 text-white shadow-sm':'text-slate-400 hover:bg-slate-50'}`}>REG</button>
                                                            <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='BAD'; setAccessoryItems(ni)}} className={`flex-1 sm:flex-none px-3 py-1 rounded text-[10px] font-bold transition-all ${item.status==='BAD'?'bg-red-500 text-white shadow-sm':'text-slate-400 hover:bg-slate-50'}`}>MAL</button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full">
                                                            <input 
                                                                type="text" 
                                                                placeholder="¿Por qué no lo tiene? (Obligatorio)"
                                                                className="w-full text-xs p-2 border border-red-300 bg-red-50 rounded text-red-700 placeholder:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                                                                value={item.observation || ''}
                                                                onChange={(e) => updateAccessoryObservation(index, e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                             </div>
                                             
                                             {/* OBSERVATIONS FOR EXISTING ITEMS */}
                                             {item.quantity > 0 && (
                                                 <div className="pl-0 sm:pl-0 mt-2">
                                                     <div className="relative">
                                                         <input 
                                                            type="text" 
                                                            placeholder="Observación opcional..."
                                                            className="w-full text-xs p-2 pl-7 border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={item.observation || ''}
                                                            onChange={(e) => updateAccessoryObservation(index, e.target.value)}
                                                         />
                                                         <LucideMessageSquare size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                     </div>
                                                 </div>
                                             )}

                                             {/* EXTINGUISHER SPECIFIC LOGIC - ONLY IF QUANTITY > 0 */}
                                             {item.quantity > 0 && isExtinguisher && (
                                                 <div className="pl-0 mt-2 space-y-2 border-l-2 border-slate-300 ml-1 pl-2">
                                                     <div className="flex items-center gap-2">
                                                         <label className="text-xs font-bold text-slate-500 uppercase">Vencimiento:</label>
                                                         <input 
                                                            type="date" 
                                                            className="border rounded text-xs p-1"
                                                            value={item.expirationDate || ''}
                                                            onChange={(e) => {
                                                                const ni=[...accessoryItems]; 
                                                                ni[index].expirationDate = e.target.value; 
                                                                setAccessoryItems(ni);
                                                            }}
                                                         />
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <label className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-200 border border-slate-300">
                                                             <LucideCamera size={14}/> {item.image ? 'Cambiar Foto' : 'Foto Etiqueta (IA)'}
                                                             <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleAccessoryPhoto(e, index)}/>
                                                         </label>
                                                         {isAnalyzing && <span className="text-blue-600 text-xs font-bold flex items-center gap-1"><LucideLoader className="animate-spin" size={12}/> Leyendo Fecha...</span>}
                                                         {item.image && !isAnalyzing && (
                                                             <button 
                                                                className="text-green-600 text-xs font-bold flex items-center gap-1 hover:underline"
                                                                onClick={() => setPreviewImage(item.image || '')}
                                                             >
                                                                 <LucideCheckCircle size={14}/> Foto OK
                                                             </button>
                                                         )}
                                                     </div>
                                                 </div>
                                             )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                 </div>
            </div>

            {/* Final Decision & Signature */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 space-y-6">
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">¿Puede circular la unidad?</label>
                     <div className="flex gap-4">
                         <button 
                            onClick={() => setCanCirculate(true)} 
                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${canCirculate ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                             SI, APTO
                         </button>
                         <button 
                            onClick={() => setCanCirculate(false)} 
                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${!canCirculate ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                             NO CIRCULAR
                         </button>
                     </div>
                 </div>

                 {type === 'REPLACEMENT' && (
                     <div className="space-y-4 pt-4 border-t bg-slate-50 p-4 rounded-lg">
                         <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><LucideArrowRightLeft size={20}/> Reemplazo de Unidad</h3>
                         
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad de Reemplazo / Auxilio *</label>
                            <select 
                                className={`w-full border p-2 rounded bg-white ${validationErrors.some(e => e.includes('reemplazo')) ? 'border-red-500' : ''}`}
                                value={replacementPlate} 
                                onChange={(e) => setReplacementPlate(e.target.value)}
                            >
                                <option value="">Seleccionar vehículo de reemplazo...</option>
                                {vehicles
                                    .filter(v => v.plate !== selectedPlate && v.status === VehicleStatus.ACTIVE) // Don't show current or inactive
                                    .map(v => (
                                    <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>
                                ))}
                            </select>
                         </div>
                     </div>
                 )}

                 {/* SIGNATURE SECTION - ALWAYS VISIBLE */}
                 <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-700 text-sm mb-3 uppercase flex items-center gap-2">
                        <LucidePenTool size={16}/> Conformidad y Firma Digital
                    </h4>
                    
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            {type === 'REPLACEMENT' ? 'Nombre de quien RECIBE la unidad' : 'Aclaración / Nombre del Conductor'}
                        </label>
                        <input 
                            type="text" 
                            placeholder={type === 'REPLACEMENT' ? "Ej: Juan Pérez" : user && user.name ? user.name : "Nombre completo"} 
                            className={`w-full border p-2 rounded ${validationErrors.some(e => e.includes('nombre')) ? 'border-red-500' : ''}`}
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Firma en pantalla:</label>
                        <SignaturePad onEnd={setSignature} />
                        {validationErrors.some(e => e.includes('firma')) && <p className="text-red-500 text-xs mt-1 font-bold">⚠️ La firma es obligatoria</p>}
                        
                        {/* Preview if signature exists (useful if we implement edit later, currently just visual feedback handled by Pad) */}
                        {signature && <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><LucideCheckCircle size={10}/> Firma capturada correctamente</p>}
                    </div>
                 </div>
                 
                 <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-lg transform active:scale-95">
                    <LucideSave size={24}/> Guardar Checklist
                 </button>
            </div>
        </div>
    );
};
