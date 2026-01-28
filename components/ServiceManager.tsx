
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { 
  ServiceRequest, ServiceStage, ServiceCategory, 
  UserRole, Vehicle, ServiceMessage, ServiceHistoryItem,
  Estimate, EstimateItem
} from '../types';
import { 
  LucidePlus, LucideSearch, LucideFileText, LucideWrench, 
  LucideClock, LucideUser, LucideChevronRight, LucideX, 
  LucideLayoutGrid, LucideList, LucideShieldCheck, 
  LucideArrowLeft, LucidePrinter, LucideHistory, LucideGauge,
  LucideBellRing, LucideEraser, LucideAlertTriangle, LucideTrash2,
  LucidePencil, LucideSend, LucideMessageSquare, LucideCheckCircle2,
  LucideTimer, LucideArrowRightCircle, LucideCircleDot, LucideMapPin,
  LucideBuilding2, LucideDollarSign, LucideFileCheck, LucideBriefcase,
  LucideTruck, LucidePackage, LucideHammer, LucideShield, LucideInfo,
  LucideCalendar, LucidePhone, LucideMapPinHouse, LucideRotateCcw,
  LucideCalendarDays, LucideCheck, LucideUserPlus, LucideClipboardList,
  LucideBrain, LucideMaximize, LucideDownload, LucideLoader2, LucideCamera,
  LucidePenTool, LucideBan, LucideRefreshCcw, LucideCheckCircle, LucideSparkles
} from 'lucide-react';
import { format, parseISO, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { analyzeBudgetImage, isAiAvailable, getTechnicalAdvice } from '../services/geminiService';
import { compressImage } from '../utils/imageCompressor';
import { ImageZoomModal } from './ImageZoomModal';

// --- SUB-COMPONENTE: PAD DE FIRMA ---
const SignaturePadSmall = ({ onEnd }: { onEnd: (base64: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 300;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.lineWidth = 2; ctx.strokeStyle = '#1e293b'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
        }
    }, []);
    const start = (e: any) => {
        const canvas = canvasRef.current; if (!canvas) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        canvas.getContext('2d')?.beginPath(); canvas.getContext('2d')?.moveTo(x, y);
    };
    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        canvas.getContext('2d')?.lineTo(x, y); canvas.getContext('2d')?.stroke();
    };
    return (
        <div className="border-2 border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden h-[104px]">
            <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair" onMouseDown={start} onMouseMove={draw} onMouseUp={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }} onTouchStart={start} onTouchMove={draw} onTouchEnd={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }} />
            <button type="button" onClick={() => { const c = canvasRef.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); onEnd(''); }} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><LucideEraser size={14}/></button>
        </div>
    );
};

// --- CENTRO DE RECOTIZACIÓN ---
const RebudgetingCenter = ({ sr, onUpdate, onCompleteAction }: { sr: ServiceRequest, onUpdate: (sr: ServiceRequest) => void, onCompleteAction: () => void }) => {
    const { addNotification } = useApp();
    const referredBudgets = sr.budgets.filter(b => b.status === 'REQUOTE');

    const handleReturnToAudit = () => {
        if (sr.budgets.length === 0) {
            addNotification("Error: Debe cargar al menos una propuesta.", "error");
            return;
        }
        onUpdate({ ...sr, stage: ServiceStage.AUDITING, updatedAt: new Date().toISOString() });
        addNotification("Unidad enviada a nueva auditoría estratégica.", "success");
        onCompleteAction(); 
    };

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[3rem] space-y-6 shadow-sm">
                <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
                    <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg"><LucideRefreshCcw size={24}/></div>
                    <div>
                        <h4 className="text-xl font-black uppercase italic text-amber-800 tracking-tighter leading-none">Negociación y Ajustes</h4>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1">Recotización solicitada por auditoría corporativa</p>
                    </div>
                </div>
                {referredBudgets.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-4">Observaciones técnicas:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {referredBudgets.map(rb => (
                                <div key={rb.id} className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 italic">#{rb.version}</div>
                                        <div><p className="text-xs font-black text-slate-800 uppercase italic">{rb.providerName}</p></div>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 italic text-[11px] font-bold text-amber-800 leading-relaxed">
                                        "{rb.requoteComment || 'Revisar costos o especificaciones técnicas.'}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center px-4">
                <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3"><LucidePlus className="text-blue-600" size={20}/> Refinar Propuestas</h4>
                <button onClick={handleReturnToAudit} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl"><LucideSend size={16}/> Finalizar y Re-Auditar</button>
            </div>
            <BudgetingCenter sr={sr} onUpdate={onUpdate} />
        </div>
    );
};

// --- CENTRO DE AUDITORÍA ---
const AuditingCenter = ({ sr, onUpdate, onCompleteAction }: { sr: ServiceRequest, onUpdate: (sr: ServiceRequest) => void, onCompleteAction: () => void }) => {
    const { user, addNotification } = useApp();
    const [localBudgets, setLocalBudgets] = useState<Estimate[]>(sr.budgets);
    const [requotingId, setRequotingId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [signature, setSignature] = useState('');
    const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

    const handleLocalStatus = (id: string, status: 'APPROVED' | 'REJECTED' | 'REQUOTE', requoteMsg?: string) => {
        setLocalBudgets(prev => prev.map(b => b.id === id ? { 
            ...b, 
            status, 
            requoteComment: requoteMsg || b.requoteComment,
            approvedBy: status === 'APPROVED' ? user?.name : undefined,
            approvedAt: status === 'APPROVED' ? new Date().toISOString() : undefined,
            approvedSignature: status === 'APPROVED' ? signature : undefined
        } : b));
    };

    const handleFinalConfirm = () => {
        const anyApproved = localBudgets.some(b => b.status === 'APPROVED');
        const anyRequote = localBudgets.some(b => b.status === 'REQUOTE');
        
        let nextStage: ServiceStage = sr.stage;
        if (anyApproved) nextStage = ServiceStage.SCHEDULING;
        else if (anyRequote) nextStage = ServiceStage.REBUDGETING;
        else nextStage = ServiceStage.BUDGETING;

        const totalCost = localBudgets
            .filter(b => b.status === 'APPROVED')
            .reduce((acc, curr) => acc + curr.totalAmount, 0);

        onUpdate({ 
            ...sr, 
            budgets: localBudgets, 
            totalCost: anyApproved ? totalCost : sr.totalCost, 
            stage: nextStage, 
            updatedAt: new Date().toISOString() 
        });

        addNotification(anyApproved ? "Gasto autorizado" : "Auditoría finalizada.", "success");
        onCompleteAction(); 
    };

    return (
        <div className="space-y-10 animate-fadeIn">
            {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
            <div className="flex justify-between items-center border-b pb-6">
                <h4 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-4"><LucideShieldCheck className="text-blue-600" size={32}/> Auditoría de Inversión</h4>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {localBudgets.map(b => (
                    <div key={b.id} className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 shadow-sm ${b.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-300' : b.status === 'REQUOTE' ? 'bg-amber-50 border-amber-300' : b.status === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex flex-col lg:flex-row gap-10 items-center">
                            {b.imageUrl && (<div className="w-32 h-44 rounded-2xl border border-slate-200 overflow-hidden cursor-zoom-in shrink-0 shadow-lg" onClick={() => setZoomedImage({url: b.imageUrl!, label: b.providerName})}><img src={b.imageUrl} className="w-full h-full object-cover" /></div>)}
                            <div className="flex-1 space-y-6">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                    <div>
                                       <h5 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{b.providerName}</h5>
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Presupuesto Opción #{b.version}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleLocalStatus(b.id, 'APPROVED')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${b.status === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-600'}`}><LucideCheck size={16}/> Autorizar</button>
                                        <button onClick={() => { setRequotingId(b.id); setComment(''); }} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${b.status === 'REQUOTE' ? 'bg-amber-600 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-400 hover:border-amber-600'}`}><LucideRefreshCcw size={16}/> Observar</button>
                                        <button onClick={() => handleLocalStatus(b.id, 'REJECTED')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${b.status === 'REJECTED' ? 'bg-rose-600 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-400 hover:border-rose-600'}`}><LucideBan size={16}/> Rechazar</button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                                    <p className="text-[11px] font-bold text-slate-500 italic max-w-md">"{b.details || 'Sin descripción técnica adicional.'}"</p>
                                    <p className="text-4xl font-black text-slate-800 tracking-tighter">${b.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        {requotingId === b.id && (
                            <div className="mt-8 p-8 bg-white rounded-[2.5rem] border-2 border-amber-200 animate-fadeIn space-y-6 shadow-inner">
                                <textarea rows={2} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-amber-50" placeholder="Escriba el motivo de la observación para el gestor..." value={comment} onChange={e => setComment(e.target.value)} />
                                <button onClick={() => { handleLocalStatus(b.id, 'REQUOTE', comment); setRequotingId(null); }} className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Aplicar Marca de Revisión</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl space-y-10 mt-12 border-t-8 border-blue-600">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-6">Firma del Auditor de Flota</label>
                        <SignaturePadSmall onEnd={setSignature} />
                    </div>
                    <div className="flex flex-col justify-center gap-6">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic text-center">Al confirmar, se notificará a los proveedores y se procederá con la agenda de turnos.</p>
                        <button onClick={handleFinalConfirm} className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 shadow-blue-500/20"><LucideShieldCheck size={28}/> Confirmar Veredicto Global</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- CENTRO DE COTIZACIONES ---
const BudgetingCenter = ({ sr, onUpdate }: { sr: ServiceRequest, onUpdate: (sr: ServiceRequest) => void }) => {
    const { addNotification } = useApp();
    const [showAdd, setShowAdd] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
    const [newBudget, setNewBudget] = useState<Partial<Estimate>>({ providerName: '', totalAmount: 0, status: 'PENDING', imageUrl: '', details: '' });
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader(); reader.onloadend = async () => { const compressed = await compressImage(reader.result as string); setNewBudget(prev => ({ ...prev, imageUrl: compressed })); }; reader.readAsDataURL(file);
    };

    const handleAiAnalyze = async () => {
        if (!newBudget.imageUrl) return; setIsProcessing(true); addNotification("Analizando presupuesto con IA...", "warning");
        try { const result = await analyzeBudgetImage(newBudget.imageUrl, 'image/jpeg'); if (result) { setNewBudget(prev => ({ ...prev, providerName: result.provider?.toUpperCase(), totalAmount: result.totalCost, details: result.details })); addNotification("Datos técnicos extraídos"); } } finally { setIsProcessing(false); }
    };

    const handleSaveBudget = () => {
        if (!newBudget.providerName || !newBudget.totalAmount) return;
        let updatedBudgets: Estimate[];
        if (editingBudgetId) {
            updatedBudgets = sr.budgets.map(b => b.id === editingBudgetId ? { ...b, ...newBudget } as Estimate : b);
            addNotification("Cotización actualizada");
        } else {
            const budget: Estimate = { id: `EST-${Date.now()}`, version: (sr.budgets?.length || 0) + 1, providerId: 'manual', providerName: newBudget.providerName, items: [], totalAmount: Number(newBudget.totalAmount), status: 'PENDING', createdAt: new Date().toISOString(), imageUrl: newBudget.imageUrl, details: newBudget.details };
            updatedBudgets = [...(sr.budgets || []), budget];
            addNotification("Cotización registrada");
        }
        onUpdate({ ...sr, budgets: updatedBudgets }); setShowAdd(false); setEditingBudgetId(null);
        setNewBudget({ providerName: '', totalAmount: 0, status: 'PENDING', imageUrl: '', details: '' });
    };

    const handleDeleteBudget = (id: string) => {
        if (!confirm("¿Eliminar registro de presupuesto?")) return;
        onUpdate({ ...sr, budgets: sr.budgets.filter(b => b.id !== id) });
        addNotification("Propuesta eliminada", "warning");
    };

    return (
        <div className="space-y-10 animate-fadeIn">
            {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
            <div className="flex justify-between items-center"><h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3"><LucideDollarSign className="text-emerald-500" size={24}/> Propuestas Comerciales</h4><button onClick={() => { setEditingBudgetId(null); setNewBudget({ providerName: '', totalAmount: 0, status: 'PENDING', imageUrl: '', details: '' }); setShowAdd(true); }} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl"><LucidePlus size={18}/> Cargar Nueva Opción</button></div>
            {showAdd && (
                <div className="p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] animate-fadeIn space-y-10 shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-6"><h5 className="text-lg font-black text-blue-600 uppercase italic tracking-tighter">{editingBudgetId ? 'Modificar Registro' : 'Digitalización de Presupuesto'}</h5><button onClick={() => { setShowAdd(false); setEditingBudgetId(null); }} className="p-2 text-slate-300 hover:text-rose-500"><LucideX size={28}/></button></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Evidencia Digital del Comprobante</label><div className="aspect-video bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden relative group shadow-lg">{newBudget.imageUrl ? (<><img src={newBudget.imageUrl} className="w-full h-full object-contain" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all"><button onClick={() => setZoomedImage({url: newBudget.imageUrl!, label: 'Zoom Presupuesto'})} className="p-4 bg-white rounded-2xl text-slate-800 shadow-xl"><LucideMaximize size={24}/></button><button onClick={() => setNewBudget({...newBudget, imageUrl: ''})} className="p-4 bg-rose-600 rounded-2xl text-white shadow-xl hover:bg-rose-500"><LucideTrash2 size={24}/></button></div></>) : (<label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all"><LucideCamera size={56} className="text-slate-200 mb-3"/><span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Click para capturar o subir archivo</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} /></label>)}</div>{newBudget.imageUrl && isAiAvailable() && (<button onClick={handleAiAnalyze} disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-xl">{isProcessing ? <LucideLoader2 className="animate-spin" size={24}/> : <LucideBrain size={24}/>}{isProcessing ? 'Procesando con Gemini...' : 'Analizar y Extraer Datos (IA)'}</button>)}</div>
                        <div className="space-y-8">
                            <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-4">Taller / Proveedor</label><input className="w-full px-8 py-5 rounded-2xl bg-white border border-slate-200 font-black text-xl outline-none uppercase text-slate-800 shadow-sm focus:ring-4 focus:ring-blue-100" value={newBudget.providerName} onChange={e => setNewBudget({...newBudget, providerName: e.target.value.toUpperCase()})} placeholder="NOMBRE DEL ESTABLECIMIENTO..." /></div>
                            <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-4">Importe Total ($)</label><input type="number" className="w-full px-8 py-5 rounded-2xl bg-white border border-slate-200 font-black text-3xl outline-none text-blue-600 shadow-sm focus:ring-4 focus:ring-blue-100" value={newBudget.totalAmount || ''} onChange={e => setNewBudget({...newBudget, totalAmount: Number(e.target.value)})} placeholder="0.00" /></div>
                            <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-4">Detalles Técnicos</label><textarea className="w-full px-8 py-5 rounded-2xl bg-white border border-slate-200 font-bold text-xs outline-none resize-none shadow-sm h-32 focus:ring-4 focus:ring-blue-100" value={newBudget.details} onChange={e => setNewBudget({...newBudget, details: e.target.value})} placeholder="Resumen de tareas presupuestadas..." /></div>
                        </div>
                    </div>
                    <div className="flex gap-6 pt-10 border-t border-slate-200"><button onClick={() => { setShowAdd(false); setEditingBudgetId(null); }} className="flex-1 py-6 font-black uppercase text-[11px] text-slate-400 tracking-widest">Descartar</button><button onClick={handleSaveBudget} className="flex-[2] bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">{editingBudgetId ? 'Guardar Cambios' : 'Confirmar Registro de Propuesta'}</button></div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(sr.budgets || []).map(b => (
                    <div key={b.id} className="p-10 rounded-[3.5rem] border bg-white border-slate-100 flex flex-col group transition-all hover:shadow-2xl relative overflow-hidden hover:border-blue-200">
                        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setNewBudget(b); setEditingBudgetId(b.id); setShowAdd(true); }} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-colors"><LucidePencil size={18}/></button>
                            <button onClick={() => handleDeleteBudget(b.id)} className="p-3 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-colors"><LucideTrash2 size={18}/></button>
                        </div>
                        <div className="flex justify-between items-start mb-8"><div className="flex items-center gap-6">{b.imageUrl && (<div className="w-20 h-20 rounded-2xl border border-slate-100 overflow-hidden cursor-zoom-in group relative shadow-md" onClick={() => setZoomedImage({url: b.imageUrl!, label: b.providerName})}><img src={b.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><LucideMaximize size={24} className="text-white"/></div></div>)}<div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Alternativa #{b.version}</p><h5 className="text-2xl font-black text-slate-800 uppercase italic leading-none">{b.providerName}</h5></div></div><span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${b.status === 'APPROVED' ? 'bg-emerald-600 text-white shadow-emerald-200' : b.status === 'REQUOTE' ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-blue-50 text-blue-600 shadow-blue-50'} shadow-lg`}>{b.status}</span></div>
                        <div className="mt-auto flex justify-between items-end"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Estimado</p><p className="text-4xl font-black text-slate-800 tracking-tighter italic">${b.totalAmount.toLocaleString()}</p></div><button onClick={() => { const a = document.createElement('a'); a.href = b.imageUrl!; a.download = `Presupuesto_${b.providerName}.jpg`; a.click(); }} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><LucideDownload size={24}/></button></div>
                    </div>
                ))}
                {(sr.budgets || []).length === 0 && (
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                        <LucideDollarSign size={64} className="mx-auto text-slate-100 mb-6"/>
                        <p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">Inicie la carga de presupuestos para esta solicitud</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- GESTIÓN DE TURNO ---
const SchedulingCenter = ({ sr, onUpdate, isAdmin }: { sr: ServiceRequest, onUpdate: (sr: ServiceRequest) => void, isAdmin: boolean }) => {
    const { addNotification } = useApp();
    const [editScheduling, setEditScheduling] = useState(!sr.scheduledDate);
    const [phoneVal, setPhoneVal] = useState(sr.scheduledContact || '');
    
    const handleAdminSave = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        const dateInput = fd.get('date') as string;
        
        if (isBefore(parseISO(dateInput), startOfDay(new Date()))) {
            addNotification("Error: La fecha de ingreso debe ser hoy o futura.", "error");
            return;
        }

        onUpdate({ 
            ...sr, 
            scheduledDate: dateInput, 
            scheduledTime: fd.get('time') as string, 
            scheduledProvider: fd.get('provider') as string, 
            scheduledContact: phoneVal, 
            scheduledAdminComments: fd.get('adminComments') as string, 
            userSchedulingStatus: 'PENDING', 
            updatedAt: new Date().toISOString() 
        });
        setEditScheduling(false);
        addNotification("Agenda de taller sincronizada exitosamente.");
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneVal(e.target.value.replace(/[^0-9+]/g, '')); 
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="space-y-10 animate-fadeIn">
            {isAdmin && editScheduling ? (
                <form onSubmit={handleAdminSave} className="bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-200 space-y-10 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha de Ingreso</label><input name="date" type="date" required min={todayStr} className="w-full px-6 py-5 rounded-2xl border bg-white font-black text-xl outline-none focus:ring-4 focus:ring-blue-100" defaultValue={sr.scheduledDate || todayStr} /></div>
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hora Pactada</label><input name="time" type="time" required className="w-full px-6 py-5 rounded-2xl border bg-white font-black text-xl outline-none" defaultValue={sr.scheduledTime} /></div>
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Establecimiento / Taller</label><input name="provider" required className="w-full px-6 py-5 rounded-2xl border bg-white font-black uppercase text-lg outline-none" placeholder="INDIQUE TALLER..." defaultValue={sr.scheduledProvider} /></div>
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contacto Taller</label><div className="relative"><LucidePhone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/><input type="tel" required className="w-full pl-16 pr-6 py-5 rounded-2xl border bg-white font-black outline-none focus:ring-4 focus:ring-blue-100" value={phoneVal} onChange={handlePhoneChange} placeholder="WHATSAPP / TEL..." /></div></div>
                        <div className="md:col-span-2 space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Comentarios Administrativos</label><textarea name="adminComments" rows={3} className="w-full px-8 py-6 rounded-3xl border bg-white font-bold outline-none focus:ring-4 focus:ring-blue-100 resize-none text-slate-700 shadow-sm" placeholder="AGREGAR INDICACIONES PARA EL CONDUCTOR O TALLER..." defaultValue={sr.scheduledAdminComments} /></div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">Sincronizar Programación de Turno</button>
                </form>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden transition-all group hover:shadow-2xl">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-8 relative z-10">
                            <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Turno Programado v36.0</p><h4 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{sr.scheduledDate ? format(parseISO(sr.scheduledDate), 'dd MMMM yyyy', {locale: es}) : 'SIN ASIGNAR'}</h4></div>
                            {isAdmin && <button onClick={() => setEditScheduling(true)} className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-90"><LucidePencil size={24}/></button>}
                        </div>
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Hora de Recepción</p><p className="text-2xl font-black text-slate-800 uppercase italic">{sr.scheduledTime || 'S/D'}</p></div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Establecimiento</p><p className="text-xl font-black text-slate-800 uppercase truncate italic">{sr.scheduledProvider || 'S/D'}</p></div>
                        </div>
                        {sr.scheduledAdminComments && (<div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 italic text-xs font-bold text-blue-800 relative z-10 shadow-inner">"{sr.scheduledAdminComments}"</div>)}
                        <LucideCalendar className="absolute -right-16 -top-16 text-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-1000" size={320}/>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL: SERVICE MANAGER ---
export const ServiceManager = () => {
  const { serviceRequests, addServiceRequest, updateServiceStage, updateServiceRequest, deleteServiceRequest, vehicles, user, addNotification, updateVehicleMileage } = useApp();
  const [view, setView] = useState<'KANBAN' | 'LIST' | 'FORM' | 'DETAIL'>('KANBAN');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plateSearch, setPlateSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [kmActual, setKmActual] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [chattingRequest, setChattingRequest] = useState<ServiceRequest | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2 || user?.role === UserRole.MANAGER;
  
  const filteredRequests = useMemo(() => serviceRequests.filter(sr => {
    const matchesIdentity = isAdmin || sr.userId === user?.id;
    const matchesSearch = sr.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || sr.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesIdentity && matchesSearch;
  }), [serviceRequests, searchTerm, isAdmin, user]);

  const filteredVehicles = useMemo(() => 
    vehicles.filter(v => v.plate.toUpperCase().includes(plateSearch.toUpperCase())).slice(0, 5)
  , [vehicles, plateSearch]);

  const allStages = Object.values(ServiceStage);

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); const v = vehicles.find(veh => veh.plate === plateSearch);
    if (!v || kmActual <= 0) return addNotification("Error de validación: Datos insuficientes", "error");
    if (isEditing) { 
        updateServiceRequest({ 
            ...serviceRequests.find(r => r.id === isEditing)!, 
            category: fd.get('category') as any, 
            priority: fd.get('priority') as any, 
            description: fd.get('description') as string, 
            updatedAt: new Date().toISOString() 
        }); 
    }
    else { 
        addServiceRequest({ 
            id: `SR-${Date.now()}`, 
            code: `SVC-${new Date().getFullYear()}-${serviceRequests.length + 101}`, 
            vehiclePlate: v.plate, 
            userId: user?.id || 'guest', 
            userName: user?.name || 'Invitado', 
            costCenter: v.costCenter || 'S/A', 
            stage: ServiceStage.REQUESTED, 
            category: fd.get('category') as any, 
            priority: fd.get('priority') as any, 
            description: fd.get('description') as string, 
            odometerAtRequest: kmActual, 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(), 
            budgets: [], invoices: [], history: [], images: [], messages: [], 
            unreadAdminCount: 0, unreadUserCount: 0 
        }); 
        updateVehicleMileage(v.plate, kmActual, 'SERVICE'); 
    }
    setView('KANBAN'); setIsEditing(null); setPlateSearch(''); setKmActual(0);
  };

  const handleStageTransition = (nextStage: ServiceStage) => {
    if (!selectedRequest) return;
    
    // REGLA DE NEGOCIO: Blindaje de Auditoría Técnica
    if (nextStage === ServiceStage.AUDITING && selectedRequest.budgets.length === 0) {
        addNotification("Flujo bloqueado: No se puede auditar sin propuestas de costos.", "error");
        return;
    }
    
    updateServiceStage(selectedRequest.id, nextStage, `Cambio de etapa estratégica por gestor: ${user?.name}`);
    const updated: ServiceRequest = { ...selectedRequest, stage: nextStage, updatedAt: new Date().toISOString() };
    updateServiceRequest(updated); setSelectedRequest(updated);
    addNotification(`Estado actualizado a: ${nextStage}`);
    if (nextStage !== selectedRequest.stage) setView('KANBAN'); 
  };

  const getCardStyle = (sr: ServiceRequest) => {
    const base = "bg-white p-6 rounded-[2.5rem] shadow-sm border-2 transition-all cursor-pointer group relative ";
    if (sr.stage === ServiceStage.AUDITING) return base + "bg-blue-50 border-blue-400 shadow-blue-100 ring-2 ring-blue-50";
    if (sr.stage === ServiceStage.REBUDGETING) return base + "bg-orange-50 border-orange-500 shadow-orange-100 ring-2 ring-orange-200";
    if (sr.stage === ServiceStage.SCHEDULING) return base + "bg-emerald-50 border-emerald-400 shadow-emerald-100 ring-2 ring-emerald-50";
    return base + "border-slate-100 hover:border-blue-200 hover:shadow-xl";
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {chattingRequest && <ServiceChat sr={chattingRequest} onClose={() => setChattingRequest(null)} currentUser={user} onSendMessage={(t, isAi = false) => { const newMsg: ServiceMessage = { id: Date.now().toString(), userId: isAi ? 'gemini-ai' : (user?.id || 'guest'), userName: isAi ? 'IA TÉCNICA' : (user?.name || 'Invitado'), text: t, timestamp: new Date().toISOString(), role: isAi ? UserRole.MANAGER : (user?.role || UserRole.GUEST), isAi }; const updated: ServiceRequest = { ...chattingRequest, messages: [...(chattingRequest.messages || []), newMsg], unreadAdminCount: !isAdmin ? (chattingRequest.unreadAdminCount || 0) + 1 : chattingRequest.unreadAdminCount, unreadUserCount: isAdmin ? (chattingRequest.unreadUserCount || 0) + 1 : chattingRequest.unreadUserCount, updatedAt: new Date().toISOString() }; updateServiceRequest(updated); setChattingRequest(updated); }} onFinalize={(r) => { updateServiceStage(chattingRequest.id, ServiceStage.FINISHED, `FINALIZADO: ${r}`); updateServiceRequest({ ...chattingRequest, resolutionSummary: r, stage: ServiceStage.FINISHED, unreadAdminCount: 0, unreadUserCount: 0 }); setChattingRequest(null); addNotification("Cierre técnico completado."); setView('KANBAN'); }} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div><h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Mantenimiento v36.0</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{isAdmin ? 'CENTRO ESTRATÉGICO DE OPERACIONES' : 'MIS SOLICITUDES TÉCNICAS'}</p></div>
        <div className="flex items-center gap-4">
            {isAdmin && <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex gap-1"><button onClick={() => setView('KANBAN')} className={`p-3 rounded-xl transition-all ${view === 'KANBAN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideLayoutGrid size={22}/></button><button onClick={() => setView('LIST')} className={`p-3 rounded-xl transition-all ${view === 'LIST' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideList size={22}/></button></div>}
            <button onClick={() => { setSelectedRequest(null); setIsEditing(null); setPlateSearch(''); setKmActual(0); setView('FORM'); }} className="bg-blue-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:bg-blue-700 transition-all transform active:scale-95 shadow-blue-500/20"><LucidePlus size={24}/> Apertura de Caso</button>
        </div>
      </div>

      {view === 'KANBAN' && (
        <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar scroll-smooth snap-x">
          {allStages.map(stage => {
            const stageRequests = filteredRequests.filter(r => r.stage === stage);
            if (stageRequests.length === 0 && !isAdmin) return null;
            return (
              <div key={stage} className="min-w-[340px] w-[340px] flex flex-col gap-6 snap-start">
                <div className="flex justify-between items-center px-4"><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><span className={`w-3 h-3 rounded-full ${stageRequests.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`}></span> {stage}</h3><span className="bg-slate-200 text-slate-600 text-[11px] font-black px-3 py-1 rounded-full">{stageRequests.length}</span></div>
                <div className="flex-1 space-y-5 bg-slate-100/50 p-5 rounded-[3rem] border border-slate-200/50 min-h-[550px] shadow-inner">
                  {stageRequests.map(sr => (
                    <div key={sr.id} onClick={() => { setSelectedRequest(sr); setView('DETAIL'); }} className={getCardStyle(sr)}>
                        <div className="flex justify-between items-start mb-5"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100 uppercase tracking-tighter">{sr.code}</span>{isAdmin && <button onClick={(e) => { e.stopPropagation(); if(confirm("¿Purgar registro?")) deleteServiceRequest(sr.id); }} className="p-2 text-slate-200 hover:text-rose-600 transition-colors"><LucideTrash2 size={14}/></button>}</div>
                        <h4 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{sr.vehiclePlate}</h4>
                        <div className="mt-4 flex items-center gap-3"><LucideBuilding2 size={12} className="text-slate-400"/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sr.costCenter}</p></div>
                        <p className="text-xs font-bold text-slate-500 mt-4 line-clamp-2 italic leading-relaxed">"{sr.description}"</p>
                        <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center"><div className="flex items-center gap-2"><LucideTimer size={14} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{differenceInHours(new Date(), parseISO(sr.createdAt))} HS SLA</span></div><LucideChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all"/></div>
                        {(sr.unreadAdminCount || 0) > 0 && isAdmin && <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-lg animate-bounce">{sr.unreadAdminCount}</div>}
                    </div>
                  ))}
                  {stageRequests.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-slate-300 rounded-[2.5rem]"><LucideBox size={48}/><p className="text-[10px] font-black uppercase mt-4">Sector Vacío</p></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'FORM' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-800 flex items-center gap-5">{isEditing ? <LucidePencil className="text-blue-600" size={36}/> : <LucidePlus className="text-blue-600" size={36}/>} {isEditing ? 'Actualizar Novedad' : 'Reporte Técnico de Unidad'}</h2>
              <form onSubmit={handleCreateOrUpdate} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3 relative"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6">Unidad (Patente)</label><input disabled={!!isEditing} type="text" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-2xl uppercase outline-none focus:ring-8 focus:ring-blue-100 shadow-sm transition-all" placeholder="BUSCAR UNIDAD..." value={plateSearch} onChange={e => { setPlateSearch(e.target.value.toUpperCase()); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}/>{showSuggestions && !isEditing && (<div className="absolute z-[100] w-full mt-3 bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto custom-scrollbar">{filteredVehicles.map(v => (<div key={v.plate} className="p-6 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 transition-colors" onClick={() => { setPlateSearch(v.plate); setKmActual(v.currentKm); setShowSuggestions(false); }}><div className="text-left"><span className="text-slate-900 font-black text-2xl italic tracking-tighter leading-none">{v.plate}</span><p className="text-[9px] font-black text-blue-600 uppercase mt-1 tracking-widest">{v.costCenter}</p></div><div className="text-right"><p className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">{v.make} {v.model}</p><p className="text-[8px] font-black text-slate-300 mt-1 uppercase italic">{v.currentKm.toLocaleString()} KM REGISTRADOS</p></div></div>))}</div>)}</div>
                  <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6">Tipo de Reporte</label><select name="category" required className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase text-xs outline-none focus:ring-8 focus:ring-blue-100 shadow-sm appearance-none cursor-pointer">{Object.values(ServiceCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6">KM Auditado al Reporte</label><div className="relative"><LucideGauge className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={28}/><input type="number" required disabled={!!isEditing} className="w-full pl-20 pr-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-3xl outline-none focus:ring-8 focus:ring-blue-100 shadow-sm transition-all" value={kmActual || ''} onChange={e => setKmActual(Number(e.target.value))} onFocus={(e) => e.target.select()}/></div></div>
                  <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6">Prioridad Operativa</label><select name="priority" className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase text-xs outline-none focus:ring-8 focus:ring-blue-100 shadow-sm appearance-none cursor-pointer"><option value="BAJA">BAJA</option><option value="MEDIA">MEDIA</option><option value="ALTA">ALTA</option><option value="URGENTE">URGENTE (CRÍTICO)</option></select></div>
                </div>
                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6">Descripción Técnica de la Novedad</label><textarea name="description" rows={5} required className="w-full p-10 bg-slate-50 border border-slate-200 rounded-[3.5rem] font-bold text-slate-700 outline-none focus:ring-8 focus:ring-blue-100 shadow-sm resize-none text-lg leading-relaxed" placeholder="Describa el fallo, síntoma o requerimiento de la unidad..." defaultValue={isEditing ? serviceRequests.find(r => r.id === isEditing)?.description : ''}></textarea></div>
                <div className="pt-10 flex gap-6"><button type="button" onClick={() => setView('KANBAN')} className="flex-1 py-6 font-black uppercase text-[12px] text-slate-400 tracking-[0.2em] hover:text-slate-600 transition-colors">Cancelar Operación</button><button type="submit" className="flex-[2] bg-slate-950 text-white py-7 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 shadow-black/20">Sincronizar Apertura de Caso</button></div>
              </form>
            </div>
          </div>
      )}

      {view === 'DETAIL' && selectedRequest && (
        <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 group">
                <div className="flex items-center gap-10"><button onClick={() => setView('KANBAN')} className="p-6 bg-slate-50 rounded-[1.8rem] hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-800 shadow-sm"><LucideArrowLeft size={28}/></button><div><p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none mb-3">{selectedRequest.code}</p><h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedRequest.vehiclePlate}</h3></div></div>
                <div className="flex items-center gap-10"><div className="text-right hidden md:block"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Centro de Costo</p><p className="text-lg font-black text-slate-800 uppercase italic tracking-tight">{selectedRequest.costCenter}</p></div><button onClick={() => { setChattingRequest(selectedRequest); const updated: ServiceRequest = { ...selectedRequest, unreadAdminCount: isAdmin ? 0 : selectedRequest.unreadAdminCount, unreadUserCount: !isAdmin ? 0 : selectedRequest.unreadUserCount }; updateServiceRequest(updated); setSelectedRequest(updated); }} className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-blue-500/20"><LucideMessageSquare size={22}/> Mesa de Ayuda Pro</button></div>
            </div>

            {isAdmin && (
                <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-5 mb-10 border-b border-white/10 pb-6 relative z-10"><LucideArrowRightCircle className="text-blue-500" size={32}/><div><h4 className="text-3xl font-black uppercase italic tracking-tighter">Motor de Gestión Estratégica</h4><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">SLA y Transiciones Operativas</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end relative z-10">
                        <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Forzar Transición de Etapa</p>
                            <select className="w-full px-8 py-6 bg-white/5 border border-white/10 text-blue-400 rounded-[2rem] font-black uppercase text-xs outline-none focus:ring-8 focus:ring-blue-500/20 shadow-inner appearance-none cursor-pointer" value={selectedRequest.stage} onChange={(e) => handleStageTransition(e.target.value as ServiceStage)}>
                                <option value={selectedRequest.stage}>{selectedRequest.stage} (ACTUAL)</option>
                                {Object.values(ServiceStage).filter(s => s !== selectedRequest.stage).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex justify-between items-center shadow-inner hover:bg-white/10 transition-all"><div className="flex items-center gap-5"><LucideClock className="text-blue-400" size={32}/><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tiempo de Respuesta (SLA)</p><p className="text-3xl font-black text-white italic tracking-tighter uppercase">{differenceInHours(new Date(), parseISO(selectedRequest.createdAt))} HORAS ACUMULADAS</p></div></div><LucideShield className="text-slate-700 opacity-20" size={48}/></div>
                    </div>
                    <LucideZap className="absolute -right-20 -bottom-20 opacity-5 text-blue-500 group-hover:scale-110 transition-transform duration-1000" size={400}/>
                </section>
            )}

            <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                {selectedRequest.stage === ServiceStage.REQUESTED && (<div className="space-y-12 animate-fadeIn"><h4 className="text-3xl font-black text-slate-800 uppercase italic border-b border-slate-100 pb-6 mb-10 flex items-center gap-4"><LucideFileText className="text-blue-600" size={32}/> Reporte Inicial de Flota</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-12"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clasificación Técnica</p><p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{selectedRequest.category}</p></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">KM Registrado</p><p className="text-3xl font-black text-slate-800 italic">{selectedRequest.odometerAtRequest.toLocaleString()} KM</p></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridad de Activo</p><span className={`px-6 py-2.5 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest shadow-lg ${selectedRequest.priority === 'URGENTE' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-slate-100 text-slate-600'}`}>{selectedRequest.priority}</span></div></div><div className="p-12 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 italic font-bold text-slate-600 text-xl leading-relaxed shadow-inner">"{selectedRequest.description}"</div></div>)}
                {selectedRequest.stage === ServiceStage.BUDGETING && (<div className="animate-fadeIn"><h4 className="text-3xl font-black text-slate-800 uppercase italic border-b border-slate-100 pb-8 mb-12 flex items-center gap-5"><LucideDollarSign className="text-emerald-500" size={32}/> Ciclo de Licitación y Costos</h4><BudgetingCenter sr={selectedRequest} onUpdate={(u) => { updateServiceRequest(u); setSelectedRequest(u); }} /></div>)}
                {selectedRequest.stage === ServiceStage.REBUDGETING && (<div className="animate-fadeIn"><RebudgetingCenter sr={selectedRequest} onUpdate={(u) => { updateServiceRequest(u); setSelectedRequest(u); }} onCompleteAction={() => setView('KANBAN')} /></div>)}
                {selectedRequest.stage === ServiceStage.AUDITING && (<div className="animate-fadeIn"><AuditingCenter sr={selectedRequest} onUpdate={(u) => { updateServiceRequest(u); setSelectedRequest(u); }} onCompleteAction={() => setView('KANBAN')} /></div>)}
                {selectedRequest.stage === ServiceStage.SCHEDULING && (
                    <div className="animate-fadeIn">
                        <h4 className="text-3xl font-black text-slate-800 uppercase italic border-b border-slate-100 pb-8 mb-12 flex items-center gap-5"><LucideCalendar className="text-blue-600" size={32}/> Gestión de Agenda de Taller</h4>
                        <SchedulingCenter sr={selectedRequest} isAdmin={isAdmin} onUpdate={(u) => { updateServiceRequest(u); setSelectedRequest(u); }} />
                    </div>
                )}
                {selectedRequest.stage === ServiceStage.IN_WORKSHOP && (<div className="animate-fadeIn"><h4 className="text-3xl font-black text-slate-800 uppercase italic border-b border-slate-100 pb-8 mb-12 flex items-center gap-5"><LucideTruck className="text-blue-600" size={32}/> Recepción Física en Instalaciones</h4><div className="p-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100"><p className="text-xl font-black uppercase text-slate-400 italic tracking-[0.2em] animate-pulse">Unidad en Proceso de Inspección de Ingreso</p></div></div>)}
                {selectedRequest.stage === ServiceStage.FINISHED && (
                   <div className="animate-fadeIn space-y-10">
                      <h4 className="text-3xl font-black text-emerald-600 uppercase italic border-b border-slate-100 pb-8 mb-12 flex items-center gap-5"><LucideCheckCircle2 className="text-emerald-500" size={32}/> Historial de Resolución Técnica</h4>
                      <div className="p-12 bg-emerald-50 rounded-[3.5rem] border-2 border-emerald-100 shadow-inner">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-4">Dictamen de Cierre</p>
                         <p className="text-2xl font-black text-emerald-950 italic tracking-tighter leading-tight">"{selectedRequest.resolutionSummary || 'Caso cerrado sin dictamen formal.'}"</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-50">
                         <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Costo Final Auditado</p><p className="text-2xl font-black text-slate-800 italic">${(selectedRequest.totalCost || 0).toLocaleString()}</p></div>
                         <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha de Cierre</p><p className="text-sm font-black text-slate-800 uppercase">{format(parseISO(selectedRequest.updatedAt), 'dd/MM/yyyy HH:mm')}</p></div>
                      </div>
                   </div>
                )}
                <LucideHistory className="absolute -right-20 -bottom-20 opacity-5 text-slate-200 group-hover:rotate-12 transition-transform duration-[3000ms]" size={500}/>
            </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTE: CHAT DE RESOLUCIÓN CON IA ---
const ServiceChat = ({ sr, onClose, onSendMessage, onFinalize, currentUser }: { sr: ServiceRequest, onClose: () => void, onSendMessage: (t: string, isAi?: boolean) => void, onFinalize: (s: string) => void, currentUser: any }) => {
    const { vehicles } = useApp();
    const [msg, setMsg] = useState(''); 
    const [res, setRes] = useState(''); 
    const [showFin, setShowFin] = useState(false);
    const [isAiConsulting, setIsAiConsulting] = useState(false);
    const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ADMIN_L2 || currentUser?.role === UserRole.MANAGER;
    const scroll = useRef<HTMLDivElement>(null); 
    
    useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [sr.messages]);
    
    const handleAiAdvice = async () => {
        setIsAiConsulting(true);
        try {
          const v = vehicles.find(veh => veh.plate === sr.vehiclePlate);
          const vehicleInfo = v ? `${v.make} ${v.model} (${v.year}) - ${v.currentKm} KM - Centro de Costo: ${v.costCenter}` : 'Unidad no identificada en base de datos central';
          const advice = await getTechnicalAdvice(sr.description, vehicleInfo);
          onSendMessage(advice, true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsAiConsulting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[4000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border-t-[12px] border-blue-600 animate-fadeIn">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center shrink-0 shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20"><LucideMessageSquare size={28} className="text-white"/></div>
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Canal Técnico Pro</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{sr.vehiclePlate} • {sr.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAiAvailable() && (
                        <button 
                            onClick={handleAiAdvice}
                            disabled={isAiConsulting}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            {isAiConsulting ? <LucideLoader2 className="animate-spin" size={16}/> : <LucideSparkles size={16}/>}
                            AI Advisor
                        </button>
                    )}
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-md"><LucideX size={24}/></button>
                </div>
            </div>
            <div ref={scroll} className="flex-1 p-10 overflow-y-auto space-y-8 bg-slate-50 custom-scrollbar shadow-inner">
                {sr.messages?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20"><LucideMessageSquare size={48}/><p className="text-[10px] font-black uppercase mt-4">Inicie la conversación técnica aquí</p></div>
                )}
                {sr.messages?.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.userId === currentUser?.id ? 'items-end' : 'items-start'} animate-fadeIn`}>
                        <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm relative ${m.isAi ? 'bg-indigo-900 text-indigo-100 border border-indigo-700 shadow-indigo-200' : m.userId === currentUser?.id ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white border border-slate-200 text-slate-800'}`}>
                            {m.isAi && <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase text-indigo-400 border-b border-indigo-800 pb-2 tracking-[0.2em]"><LucideSparkles size={12}/> Recomendación de Diagnóstico IA</div>}
                            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mt-3 px-4 tracking-widest">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}</p>
                    </div>
                ))}
            </div>
            {showFin ? (
                <div className="p-10 bg-emerald-50 border-t border-emerald-100 space-y-6 animate-fadeIn">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-4">Reporte Técnico de Cierre</label>
                        <textarea className="w-full p-6 bg-white border border-emerald-200 rounded-[2rem] text-sm font-bold outline-none focus:ring-8 focus:ring-emerald-100 shadow-inner resize-none h-32" placeholder="Describa la resolución técnica para el archivo histórico..." value={res} onChange={e => setRes(e.target.value)} />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowFin(false)} className="flex-1 py-5 font-black uppercase text-[11px] text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Volver</button>
                        <button onClick={() => onFinalize(res)} disabled={!res.trim()} className="flex-[2] bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black uppercase text-xs shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">Archivar y Finalizar Caso</button>
                    </div>
                </div>
            ) : (
                <div className="p-8 bg-white border-t space-y-6 shrink-0 shadow-2xl">
                    <div className="flex gap-4">
                        <input className="flex-1 px-8 py-5 bg-slate-100 rounded-[1.8rem] font-bold text-sm outline-none focus:ring-8 focus:ring-blue-100 shadow-inner transition-all border border-slate-200" placeholder="Escriba su mensaje aquí..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && msg.trim() && (onSendMessage(msg), setMsg(''))} />
                        <button onClick={() => { if(msg.trim()) { onSendMessage(msg); setMsg(''); } }} className="p-6 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"><LucideSend size={24}/></button>
                    </div>
                    {isAdmin && sr.stage !== ServiceStage.FINISHED && (
                        <button onClick={() => setShowFin(true)} className="w-full py-5 bg-slate-950 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                            Cerrar Ticket con Dictamen Técnico
                        </button>
                    )}
                </div>
            )}
          </div>
        </div>
    );
};
