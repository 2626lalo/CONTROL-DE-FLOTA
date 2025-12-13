import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CHECKLIST_SECTIONS } from '../constants';
import { Checklist as ChecklistType, ChecklistItem, AccessoryItem, VehicleStatus } from '../types';
import { LucideCheckCircle, LucideXCircle, LucideAlertTriangle, LucideCamera, LucideSave, LucideArrowRightLeft, LucidePenTool, LucideEraser, LucideChevronDown, LucideChevronUp, LucideTruck } from 'lucide-react';

// Signature Pad Component
const SignaturePad = ({ onEnd }: { onEnd: (base64: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 300;
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
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
    const { vehicles, addChecklist, user } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [selectedPlate, setSelectedPlate] = useState(searchParams.get('plate') || '');
    const [type, setType] = useState<'DAILY' | 'TRIP' | 'REPLACEMENT'>('DAILY');
    const [km, setKm] = useState<number>(0);
    
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

    // Initialize items based on constants
    useEffect(() => {
        setMotorItems(CHECKLIST_SECTIONS.motor.map(name => ({ name, status: 'GOOD' })));
        setLightItems(CHECKLIST_SECTIONS.lights.map(name => ({ name, status: 'GOOD' })));
        setGeneralItems(CHECKLIST_SECTIONS.general.map(name => ({ name, status: 'GOOD' })));
        setBodyworkItems(CHECKLIST_SECTIONS.bodywork.map(name => ({ name, status: 'GOOD' })));
        setAccessoryItems(CHECKLIST_SECTIONS.accessories.map(name => ({ name, hasIt: true, quantity: 1, status: 'GOOD' })));
    }, []);

    // Set initial KM if plate selected
    useEffect(() => {
        if(selectedPlate) {
            const v = vehicles.find(veh => veh.plate === selectedPlate);
            if(v) setKm(v.currentKm);
        }
    }, [selectedPlate, vehicles]);

    const updateItemStatus = (section: string, index: number, status: 'GOOD' | 'REGULAR' | 'BAD') => {
        if(section === 'motor') {
            const newItems = [...motorItems]; newItems[index].status = status; setMotorItems(newItems);
        } else if(section === 'lights') {
            const newItems = [...lightItems]; newItems[index].status = status; setLightItems(newItems);
        } else if(section === 'general') {
            const newItems = [...generalItems]; newItems[index].status = status; setGeneralItems(newItems);
        } else if(section === 'bodywork') {
            const newItems = [...bodyworkItems]; newItems[index].status = status; setBodyworkItems(newItems);
        } else if(section === 'accessories') {
            const newItems = [...accessoryItems]; newItems[index].status = status; setAccessoryItems(newItems);
        }
    };
    
    const updateAccessoryCheck = (index: number, hasIt: boolean) => {
        const newItems = [...accessoryItems]; newItems[index].hasIt = hasIt; setAccessoryItems(newItems);
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
        if(vehicle && km < vehicle.currentKm) errors.push(`El kilometraje no puede ser menor al actual (${vehicle.currentKm}).`);

        if(errors.length > 0) {
            setValidationErrors(errors);
            window.scrollTo(0,0);
            return;
        }

        const newChecklist: ChecklistType = {
            id: `CHK-${Date.now()}`,
            vehiclePlate: selectedPlate,
            userId: user?.id || 'unknown',
            userName: user?.name || 'Usuario',
            date: new Date().toISOString(),
            type,
            km,
            insuranceCompany: 'N/A', // Could be populated from vehicle.documents
            insuranceExpiration: 'N/A',
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
        
        navigate('/vehicles');
    };

    const renderItemRow = (item: ChecklistItem, index: number, section: string) => (
        <div key={index} className="flex flex-col py-3 border-b border-slate-100">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700 w-1/3">{item.name}</span>
                <div className="flex bg-slate-100 rounded p-1">
                    <button 
                        onClick={() => updateItemStatus(section, index, 'GOOD')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${item.status === 'GOOD' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >OK</button>
                    <button 
                        onClick={() => updateItemStatus(section, index, 'REGULAR')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${item.status === 'REGULAR' ? 'bg-yellow-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >REG</button>
                    <button 
                        onClick={() => updateItemStatus(section, index, 'BAD')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${item.status === 'BAD' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >MAL</button>
                </div>
            </div>
            {item.status !== 'GOOD' && (
                <input 
                    type="text" 
                    placeholder="Observación (opcional)" 
                    className="text-xs p-2 bg-slate-50 border rounded w-full mt-1"
                    value={item.observation || ''}
                    onChange={(e) => {
                         if(section === 'motor') {
                            const newItems = [...motorItems]; newItems[index].observation = e.target.value; setMotorItems(newItems);
                        } else if(section === 'lights') {
                            const newItems = [...lightItems]; newItems[index].observation = e.target.value; setLightItems(newItems);
                        } else if(section === 'general') {
                            const newItems = [...generalItems]; newItems[index].observation = e.target.value; setGeneralItems(newItems);
                        } else if(section === 'bodywork') {
                            const newItems = [...bodyworkItems]; newItems[index].observation = e.target.value; setBodyworkItems(newItems);
                        }
                    }}
                />
            )}
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Nuevo Checklist</h1>
            
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
                            <div className="p-4">
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
                            <div className="p-4 space-y-2">
                                {accessoryItems.map((item, index) => (
                                    <div key={index} className="flex flex-col py-3 border-b border-slate-100">
                                         <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 w-1/3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.hasIt} 
                                                    onChange={(e) => updateAccessoryCheck(index, e.target.checked)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm font-medium ${item.hasIt ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{item.name}</span>
                                            </div>
                                            {item.hasIt && (
                                                <div className="flex bg-slate-100 rounded p-1">
                                                    <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='GOOD'; setAccessoryItems(ni)}} className={`px-2 py-1 rounded text-[10px] font-bold ${item.status==='GOOD'?'bg-green-500 text-white':'text-slate-400'}`}>OK</button>
                                                    <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='REGULAR'; setAccessoryItems(ni)}} className={`px-2 py-1 rounded text-[10px] font-bold ${item.status==='REGULAR'?'bg-yellow-500 text-white':'text-slate-400'}`}>REG</button>
                                                    <button onClick={() => {const ni=[...accessoryItems]; ni[index].status='BAD'; setAccessoryItems(ni)}} className={`px-2 py-1 rounded text-[10px] font-bold ${item.status==='BAD'?'bg-red-500 text-white':'text-slate-400'}`}>MAL</button>
                                                </div>
                                            )}
                                         </div>
                                    </div>
                                ))}
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
                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${canCirculate ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'}`}
                        >
                             SI, APTO
                         </button>
                         <button 
                            onClick={() => setCanCirculate(false)} 
                            className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${!canCirculate ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-400'}`}
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
                            placeholder={type === 'REPLACEMENT' ? "Ej: Juan Pérez" : user?.name || "Nombre completo"} 
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
                 
                 <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-lg">
                    <LucideSave size={24}/> Guardar Checklist
                 </button>
            </div>
        </div>
    );
};