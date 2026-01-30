import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { 
  ServiceRequest, ServiceStage, ServiceCategory, 
  UserRole, ServiceMessage, ServiceHistoryItem,
  Estimate
} from '../types';
import { 
  LucidePlus, LucideSearch, LucideFileText, LucideWrench, 
  LucideChevronRight, LucideX, 
  LucideLayoutGrid, LucideList, LucideShieldCheck, 
  LucideArrowLeft, LucideHistory, LucideGauge,
  LucideAlertTriangle, LucideTrash2,
  LucidePencil, LucideSend, LucideMessageSquare, LucideCheckCircle2,
  LucideTimer, LucideArrowRightCircle,
  LucideBuilding2, LucideDollarSign,
  LucideTruck, LucidePackage, LucideShield,
  LucideCalendar, LucidePhone, LucideRotateCcw,
  LucideCheck, LucideLoader2, LucideCamera,
  LucideBan, LucideRefreshCcw, LucideSparkles,
  LucideZap
} from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTechnicalAdvice, isAiAvailable } from '../services/geminiService';

// --- SUB-COMPONENTE: CHAT DE SERVICIO ---
const ServiceChat = ({ sr, onClose, currentUser, onSendMessage, onFinalize }: { 
    sr: ServiceRequest, 
    onClose: () => void, 
    currentUser: any, 
    onSendMessage: (text: string, isAi?: boolean) => void, 
    onFinalize: (resolution: string) => void 
}) => {
    const [msg, setMsg] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ADMIN_L2 || currentUser?.role === UserRole.MANAGER;

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [sr.messages]);

    const handleSendAction = () => {
        if (!msg.trim()) return;
        onSendMessage(msg);
        setMsg('');
    };

    const handleAiAdviseAction = async () => {
        setIsAiThinking(true);
        try {
            const advice = await getTechnicalAdvice(sr.description, `Unidad ${sr.vehiclePlate}`);
            onSendMessage(advice || "No disponible.", true);
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] animate-fadeIn">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideMessageSquare size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Mesa de Ayuda Técnica</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Caso: {sr.code} • {sr.vehiclePlate}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-rose-500 transition-colors p-2"><LucideX size={24}/></button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/50">
                    {sr.messages?.map(m => (
                        <div key={m.id} className={`flex ${m.userId === currentUser?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`max-w-[80%] p-6 rounded-[2rem] shadow-sm border ${m.userId === currentUser?.id ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : m.isAi ? 'bg-indigo-50 border-indigo-100 text-indigo-900 rounded-tl-none' : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                <div className="flex justify-between items-center gap-4 mb-2">
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${m.userId === currentUser?.id ? 'text-blue-100' : 'text-slate-400'}`}>{m.userName}</span>
                                    <span className={`text-[8px] font-bold ${m.userId === currentUser?.id ? 'text-blue-200' : 'text-slate-300'}`}>{format(parseISO(m.timestamp), 'HH:mm')}</span>
                                </div>
                                <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-white border-t space-y-4 shadow-inner">
                    <div className="flex gap-4">
                        <textarea 
                            className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 resize-none"
                            placeholder="Escriba su respuesta..."
                            rows={2}
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                        />
                        <div className="flex flex-col gap-2">
                            <button onClick={handleSendAction} className="p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95"><LucideSend size={24}/></button>
                            {isAdmin && isAiAvailable() && (
                                <button onClick={handleAiAdviseAction} disabled={isAiThinking} className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50">
                                    {isAiThinking ? <LucideLoader2 className="animate-spin" size={24}/> : <LucideSparkles size={24}/>}
                                </button>
                            )}
                        </div>
                    </div>
                    {isAdmin && (
                        <button onClick={() => { const r = prompt("Dictamen final:"); if(r) onFinalize(r); }} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200">Finalizar Gestión</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const ServiceManager = () => {
  const { serviceRequests, updateServiceStage, updateServiceRequest, deleteServiceRequest, vehicles, user, addNotification } = useApp();
  const [view, setView] = useState<'KANBAN' | 'LIST' | 'DETAIL'>('KANBAN');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chattingRequest, setChattingRequest] = useState<ServiceRequest | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2 || user?.role === UserRole.MANAGER;
  
  const filteredRequests = useMemo(() => serviceRequests.filter(sr => {
    const matchesIdentity = isAdmin || sr.userId === user?.id;
    const matchesSearch = sr.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || sr.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesIdentity && matchesSearch;
  }), [serviceRequests, searchTerm, isAdmin, user]);

  const handleSendMessageInternal = (text: string, isAi = false) => {
    if (!chattingRequest) return;
    
    const newMsg: ServiceMessage = { 
      id: Date.now().toString(), 
      userId: isAi ? 'gemini-ai' : (user?.id || 'guest'), 
      userName: isAi ? 'IA TÉCNICA' : (user?.name || 'Invitado'), 
      text, 
      timestamp: new Date().toISOString(), 
      role: isAi ? UserRole.MANAGER : (user?.role || UserRole.GUEST), 
      isAi 
    };

    const updated: ServiceRequest = { 
      ...chattingRequest, 
      messages: [...(chattingRequest.messages || []), newMsg], 
      // Si el que manda es el ADMIN, incrementar contador para el USUARIO
      unreadUserCount: isAdmin ? (chattingRequest.unreadUserCount || 0) + 1 : chattingRequest.unreadUserCount,
      // Si el que manda es el USUARIO, incrementar contador para el ADMIN
      unreadAdminCount: !isAdmin ? (chattingRequest.unreadAdminCount || 0) + 1 : chattingRequest.unreadAdminCount,
      updatedAt: new Date().toISOString() 
    };

    updateServiceRequest(updated);
    setChattingRequest(updated);
  };

  const handleFinalizeInternal = (resolution: string) => {
    if (!chattingRequest) return;
    updateServiceStage(chattingRequest.id, ServiceStage.FINISHED, `CIERRE: ${resolution}`);
    updateServiceRequest({ 
        ...chattingRequest, 
        resolutionSummary: resolution, 
        stage: ServiceStage.FINISHED, 
        unreadAdminCount: 0, 
        unreadUserCount: 0 
    });
    setChattingRequest(null);
    addNotification("Servicio finalizado exitosamente.");
    setView('KANBAN');
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {chattingRequest && (
        <ServiceChat 
            sr={chattingRequest} 
            onClose={() => setChattingRequest(null)} 
            currentUser={user} 
            onSendMessage={handleSendMessageInternal} 
            onFinalize={handleFinalizeInternal} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div><h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Mantenimiento v36.0</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">OPERACIONES CENTRALIZADAS</p></div>
        <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex gap-1">
                <button onClick={() => setView('KANBAN')} className={`p-3 rounded-xl transition-all ${view === 'KANBAN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideLayoutGrid size={22}/></button>
                <button onClick={() => setView('LIST')} className={`p-3 rounded-xl transition-all ${view === 'LIST' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideList size={22}/></button>
            </div>
        </div>
      </div>

      {view === 'KANBAN' && (
        <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
          {Object.values(ServiceStage).map(stage => {
            const stageRequests = filteredRequests.filter(r => r.stage === stage);
            if (stageRequests.length === 0 && !isAdmin) return null;
            return (
              <div key={stage} className="min-w-[340px] w-[340px] flex flex-col gap-6">
                <div className="flex justify-between items-center px-4"><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stage}</h3><span className="bg-slate-200 text-slate-600 text-[11px] font-black px-3 py-1 rounded-full">{stageRequests.length}</span></div>
                <div className="flex-1 space-y-5 bg-slate-100/50 p-5 rounded-[3rem] border border-slate-200/50 min-h-[500px]">
                  {stageRequests.map(sr => (
                    <div key={sr.id} onClick={() => { setSelectedRequest(sr); setView('DETAIL'); }} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 transition-all cursor-pointer group hover:shadow-xl relative ${sr.unreadAdminCount && isAdmin ? 'border-rose-500' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-5">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100 uppercase tracking-tighter">{sr.code}</span>
                            {isAdmin && (sr.unreadAdminCount || 0) > 0 && <LucideAlertTriangle className="text-rose-500 animate-pulse" size={18}/>}
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{sr.vehiclePlate}</h4>
                        <div className="mt-4 flex items-center gap-3"><LucideBuilding2 size={12} className="text-slate-400"/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sr.costCenter}</p></div>
                        <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2"><LucideTimer size={14} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{differenceInHours(new Date(), parseISO(sr.createdAt))} HS SLA</span></div>
                            <LucideChevronRight size={18} className="text-slate-300 group-hover:text-blue-600"/>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'DETAIL' && selectedRequest && (
        <div className="animate-fadeIn space-y-10">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-10">
                    <button onClick={() => setView('KANBAN')} className="p-6 bg-slate-50 rounded-[1.8rem] hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-800 shadow-sm"><LucideArrowLeft size={28}/></button>
                    <div>
                        <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none mb-3">{selectedRequest.code}</p>
                        <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedRequest.vehiclePlate}</h3>
                    </div>
                </div>
                <button onClick={() => { setChattingRequest(selectedRequest); if(isAdmin) updateServiceRequest({...selectedRequest, unreadAdminCount: 0}); }} className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-blue-500/20"><LucideMessageSquare size={22}/> Mesa de Ayuda Técnica</button>
            </div>
            {/* ... Resto de la lógica de detalle simplificada para estabilidad ... */}
            <div className="p-20 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm font-black uppercase text-slate-400 italic">Cargando Gestión de Flujo Estratégico...</div>
        </div>
      )}
    </div>
  );
};