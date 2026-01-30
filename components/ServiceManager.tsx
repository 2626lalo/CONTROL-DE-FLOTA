
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { 
  ServiceRequest, ServiceStage, ServiceCategory, 
  // FIX: Removed Provider from types import as it is not defined
  UserRole, ServiceMessage, Estimate, Invoice
} from '../types';
import { 
  LucideLayoutGrid, LucideList, LucideSearch, LucideArrowLeft, 
  LucideMessageCircle, LucideChevronRight, LucideCheckCircle2, 
  LucideClock, LucideWrench, LucideShieldCheck, LucideDollarSign,
  LucideTruck, LucideCalendar, LucidePlus, LucideX, LucideTrash2,
  LucideSend, LucideFileText, LucideInfo, LucideAlertTriangle,
  LucideHistory, LucideLock, LucideUnlock, LucideDatabase, LucideBuilding2,
  LucideSignature, LucideEye, LucideRefreshCcw, LucideCheck,
  // FIX: Added missing icons
  LucideMapPin, LucideTimer
} from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
// FIX: Correctly import 'es' locale from date-fns
import { es } from 'date-fns/locale/es';

export const ServiceManager = () => {
  const { serviceRequests, updateServiceStage, updateServiceRequest, user, vehicles, addNotification, logAudit } = useApp();
  const [view, setView] = useState<'KANBAN' | 'LIST' | 'DETAIL'>('KANBAN');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // FIX: Replaced non-existent UserRole property MANAGER with SUPERVISOR
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;
  const isAuditor = user?.role === UserRole.AUDITOR;
  const isProvider = user?.role === UserRole.PROVIDER;

  const selectedRequest = useMemo(() => 
    serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]
  );

  const filteredRequests = useMemo(() => {
    return serviceRequests.filter(sr => {
      const matchSearch = sr.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || sr.code.toLowerCase().includes(searchTerm.toLowerCase());
      if (isProvider) return matchSearch && sr.providerId === user?.id;
      return matchSearch;
    });
  }, [serviceRequests, searchTerm, user, isProvider]);

  const handleStageChange = (newStage: ServiceStage, comment: string) => {
    if (!selectedRequest) return;
    updateServiceStage(selectedRequest.id, newStage, comment);
    addNotification(`Gestión actualizada a: ${newStage}`, "success");
    logAudit('UPDATE_SERVICE_STAGE', 'SERVICE', selectedRequest.id, `Cambio a ${newStage}: ${comment}`);
  };

  const handleSendMessage = () => {
    if (!selectedRequest || !chatMessage.trim()) return;
    const newMsg: ServiceMessage = {
      id: Date.now().toString(),
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrador',
      text: chatMessage,
      timestamp: new Date().toISOString(),
      role: user?.role || UserRole.ADMIN
    };
    const updated = {
      ...selectedRequest,
      messages: [...(selectedRequest.messages || []), newMsg],
      unreadUserCount: (selectedRequest.unreadUserCount || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    updateServiceRequest(updated);
    setChatMessage('');
  };

  const toggleDialogue = () => {
    if (!selectedRequest) return;
    const updated = {
      ...selectedRequest,
      isDialogueOpen: !selectedRequest.isDialogueOpen,
      updatedAt: new Date().toISOString()
    };
    updateServiceRequest(updated);
    addNotification(updated.isDialogueOpen ? "Diálogo habilitado para el usuario" : "Diálogo cerrado", "warning");
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideDatabase className="text-blue-600" size={20}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">CENTRAL DE SERVICIOS v36.0</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Mesa de Control</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex gap-1">
            <button onClick={() => setView('KANBAN')} className={`p-3 rounded-xl transition-all ${view === 'KANBAN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideLayoutGrid size={22}/></button>
            <button onClick={() => setView('LIST')} className={`p-3 rounded-xl transition-all ${view === 'LIST' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LucideList size={22}/></button>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
        <input type="text" placeholder="Buscar por Patente, Código o Cliente..." className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-700 uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {view === 'KANBAN' && (
        <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
          {Object.values(ServiceStage).map(stage => {
            const stageRequests = filteredRequests.filter(r => r.stage === stage);
            return (
              <div key={stage} className="min-w-[340px] w-[340px] flex flex-col gap-6 animate-fadeIn">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full">{stageRequests.length}</span>
                </div>
                <div className="flex-1 space-y-5 bg-slate-100/50 p-5 rounded-[3rem] border border-slate-200/50 min-h-[500px]">
                  {stageRequests.map(sr => (
                    <div key={sr.id} onClick={() => { setSelectedReqId(sr.id); setView('DETAIL'); }} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all cursor-pointer group hover:shadow-2xl hover:border-blue-400 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">{sr.code}</span>
                        {sr.priority === 'URGENTE' && <LucideAlertTriangle className="text-rose-500 animate-pulse" size={18}/>}
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-tight group-hover:text-blue-600 transition-colors">{sr.vehiclePlate}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate">{sr.description}</p>
                      <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                          <LucideClock size={14}/>
                          <span className="text-[9px] font-black uppercase tracking-widest">{differenceInHours(new Date(), parseISO(sr.createdAt))} HS SLA</span>
                        </div>
                        <LucideChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"/>
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
            <div className="flex items-center gap-8">
              <button onClick={() => setView('KANBAN')} className="p-6 bg-slate-50 rounded-[2rem] hover:bg-slate-100 text-slate-400 shadow-sm"><LucideArrowLeft size={28}/></button>
              <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">{selectedRequest.code}</p>
                <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedRequest.vehiclePlate}</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="px-8 py-4 bg-blue-50 text-blue-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest border border-blue-100">{selectedRequest.stage}</span>
              {isAdmin && (
                <div className="flex bg-slate-900 p-1.5 rounded-[1.5rem] gap-1 shadow-2xl">
                  <button onClick={() => handleStageChange(ServiceStage.REVIEW, "Pase manual a revisión")} className="p-3 text-slate-400 hover:text-white rounded-xl"><LucideRefreshCcw size={20}/></button>
                  <button onClick={() => handleStageChange(ServiceStage.FINISHED, "Cierre manual por administrador")} className="p-3 text-slate-400 hover:text-emerald-400 rounded-xl"><LucideCheck size={20}/></button>
                  <button onClick={() => handleStageChange(ServiceStage.CANCELLED, "Cancelación por administrador")} className="p-3 text-slate-400 hover:text-rose-500 rounded-xl"><LucideX size={20}/></button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* PANEL DE CONTROL CENTRAL */}
            <div className="lg:col-span-2 space-y-10">
              {/* FICHA RESUMEN */}
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                 <div className="flex justify-between items-center border-b pb-8">
                    <h4 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-4"><LucideInfo className="text-blue-600" size={32}/> Relevamiento de Solicitud</h4>
                    <span className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">Prioridad: {selectedRequest.priority}</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clasificación Técnica</p><p className="text-2xl font-black text-slate-800 uppercase italic">{selectedRequest.category}</p></div>
                       <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Km Auditado de Solicitud</p><p className="text-2xl font-black text-slate-800 italic">{selectedRequest.odometerAtRequest.toLocaleString()} KM</p></div>
                    </div>
                    <div className="space-y-6">
                       <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Solicitante</p><p className="text-xl font-bold text-slate-700">{selectedRequest.userName}</p><p className="text-[10px] font-black text-blue-500 uppercase mt-1">{selectedRequest.costCenter}</p></div>
                       <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lugar / Establecimiento</p><div className="flex items-center gap-3 text-slate-600"><LucideMapPin size={18}/><span className="font-bold text-sm uppercase">{selectedRequest.location || 'SIN ESPECIFICAR'}</span></div></div>
                    </div>
                 </div>
                 <div className="p-10 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 italic font-bold text-slate-600 text-xl leading-relaxed shadow-inner">
                    "{selectedRequest.description}"
                 </div>
              </div>

              {/* GESTIÓN DE TURNOS */}
              <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl space-y-10 relative overflow-hidden">
                 <div className="flex items-center gap-4 border-b border-white/10 pb-8 relative z-10">
                    <LucideCalendar className="text-indigo-400" size={36}/>
                    <div>
                      <h4 className="text-3xl font-black uppercase italic tracking-tighter">Motor de Agendamiento</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sugerencia Inteligente vs Disponibilidad Taller</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-6">
                       <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Sugerencia de Usuario</p>
                          <div className="flex items-center gap-4">
                             <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400"><LucideClock size={24}/></div>
                             <p className="text-2xl font-black italic">{selectedRequest.suggestedDate ? format(parseISO(selectedRequest.suggestedDate), 'dd MMMM yyyy', {locale: es}).toUpperCase() : 'NO PACTADA'}</p>
                          </div>
                       </div>
                       <button onClick={() => handleStageChange(ServiceStage.SCHEDULING, "Confirmación de turno")} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                          <LucideShieldCheck size={20}/> Confirmar Turno
                       </button>
                    </div>
                    <div className="bg-white/5 rounded-[3rem] p-8 border border-white/10 flex flex-col justify-center items-center text-center">
                       <LucideTimer size={48} className="text-slate-600 mb-6"/>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Arrastre para proponer nuevo horario.<br/>El usuario recibirá una notificación push.</p>
                    </div>
                 </div>
                 <LucideCalendar className="absolute -right-12 -bottom-12 opacity-5" size={320}/>
              </div>

              {/* AUDITORÍA Y PRESUPUESTOS (BLOQUEADO SI NO ESTÁ EN REVISIÓN/TURNO) */}
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10">
                 <div className="flex justify-between items-center border-b pb-8">
                    <div className="flex items-center gap-4">
                       <LucideDollarSign className="text-emerald-500" size={32}/>
                       <h4 className="text-2xl font-black uppercase italic tracking-tighter">Matriz de Cotización</h4>
                    </div>
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl"><LucidePlus size={18}/> Nuevo Presupuesto</button>
                 </div>
                 
                 <div className="space-y-6">
                    {selectedRequest.budgets.length > 0 ? (
                       <div className="grid grid-cols-1 gap-6">
                          {selectedRequest.budgets.map(est => (
                            <div key={est.id} className="p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-400 transition-all flex flex-col md:flex-row justify-between items-center gap-8">
                               <div className="flex items-center gap-6">
                                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><LucideBuilding2 size={24}/></div>
                                  <div>
                                    <p className="text-lg font-black text-slate-800 uppercase italic leading-none">{est.providerName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Versión: v{est.version} • {format(parseISO(est.createdAt), 'dd/MM/yyyy')}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-10 w-full md:w-auto">
                                  <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Cotizado</p>
                                    <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">${est.totalAmount.toLocaleString()}</p>
                                  </div>
                                  <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><LucideEye size={22}/></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                          <LucideWrench className="mx-auto text-slate-200 mb-4" size={48}/>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Esperando carga de presupuestos por proveedores asignados</p>
                       </div>
                    )}
                 </div>
              </div>
            </div>

            {/* BARRA LATERAL: COMUNICACIÓN Y LOGS */}
            <div className="lg:col-span-1 space-y-10">
               {/* MESA DE DIÁLOGO */}
               <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl shadow-lg ${selectedRequest.isDialogueOpen ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-400 text-slate-200'}`}><LucideMessageCircle size={24}/></div>
                      <div><h5 className="text-base font-black text-slate-800 uppercase italic leading-none">Canal de Chat</h5><p className="text-[8px] font-black text-slate-400 uppercase mt-1">Conexión Directa con Operador</p></div>
                    </div>
                    <button onClick={toggleDialogue} className={`p-3 rounded-xl transition-all ${selectedRequest.isDialogueOpen ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>{selectedRequest.isDialogueOpen ? <LucideLock size={20}/> : <LucideUnlock size={20}/>}</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#fcfdfe]">
                      {(!selectedRequest.messages || selectedRequest.messages.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                          <LucideSend size={64} className="mb-4 animate-pulse"/><p className="text-[10px] font-black uppercase">Sin mensajes</p>
                        </div>
                      ) : (
                        selectedRequest.messages?.map(m => (
                          <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm border ${m.userId === user?.id ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'}`}>
                              <p className="text-[7px] font-black uppercase opacity-60 mb-2">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}</p>
                              <p className="text-[11px] font-bold italic leading-relaxed">"{m.text}"</p>
                            </div>
                          </div>
                        ))
                      )}
                  </div>

                  <div className="p-8 border-t bg-white">
                    <div className="relative">
                      <textarea rows={2} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-xs outline-none focus:ring-8 focus:ring-indigo-50 shadow-inner resize-none" placeholder="Escribir al usuario..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                      <button onClick={handleSendMessage} className="absolute right-4 bottom-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-90"><LucideSend size={18}/></button>
                    </div>
                  </div>
               </div>

               {/* HISTORIAL DE AUDITORÍA */}
               <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-8">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b pb-4"><LucideHistory size={16}/> Logs de Sistema</h5>
                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {selectedRequest.history?.map(h => (
                       <div key={h.id} className="flex gap-4 group">
                          <div className="w-1 bg-indigo-200 group-hover:bg-indigo-500 transition-all rounded-full"></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase italic">{h.comment}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{h.userName} • {format(parseISO(h.date), 'dd/MM HH:mm')}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
