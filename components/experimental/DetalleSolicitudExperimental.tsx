
import React, { useState, useMemo } from 'react';
import { LucideInfo, LucideMessageCircle, LucideHistory, LucideDollarSign, LucideX, LucideCar, LucideShieldCheck, LucideMaximize, LucideFileText, LucideTrash2, LucideCheckCircle2, LucideCalendar, LucideUser, LucideActivity, LucideMapPin, LucideBriefcase, LucideCheck, LucideShieldAlert, LucideClipboardCheck, LucideWrench, LucideShield } from 'lucide-react';
import { ServiceRequest, User, UserRole, ServiceStage, Checklist } from '../../types';
import { ChatServicio } from './ChatServicio';
import { HistorialServicio } from './HistorialServicio';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { AsignarTurnoExperimental } from './AsignarTurnoExperimental';
import { CargarPresupuestoExperimental } from './CargarPresupuestoExperimental';

interface Props {
  request: ServiceRequest;
  currentUser: User;
  onClose: () => void;
  onUpdateStage: (stage: ServiceStage | string, comment: string, extras?: any) => void;
  onSendMessage: (text: string) => void;
  allUsers: User[];
  lastChecklist?: Checklist | null;
}

export const DetalleSolicitudExperimental: React.FC<Props> = ({ request, currentUser, onClose, onUpdateStage, onSendMessage, allUsers, lastChecklist }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'CHAT' | 'LOGS' | 'BUDGET'>('INFO');
  const [showAssignTurn, setShowAssignTurn] = useState(false);
  const [showLoadBudget, setShowLoadBudget] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [ingresoData, setIngresoData] = useState({ workshop: '', receptor: '', obs: '' });

  const isSupervisorOrAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPERVISOR;
  const isProvider = currentUser.role === UserRole.PROVIDER;
  const isAuditor = currentUser.role === UserRole.AUDITOR;

  const isChecklistUpToDate = useMemo(() => {
    if (!lastChecklist) return false;
    return isSameDay(parseISO(lastChecklist.date), new Date());
  }, [lastChecklist]);

  const handleConfirmTurn = (data: any) => {
    onUpdateStage(ServiceStage.SCHEDULING, `Turno asignado en ${data.nombreTaller}`, { 
        suggestedDates: [...(request.suggestedDates || []), data],
        providerId: data.providerId,
        providerName: allUsers.find(u => u.id === data.providerId)?.nombre,
        turnDate: data.fecha
    });
    setShowAssignTurn(false);
  };

  const handleConfirmBudget = (items: any[], total: number) => {
    onUpdateStage(ServiceStage.BUDGETING, `Presupuesto cargado por $${total.toLocaleString()}`, {
        budget: { items, total, creadoPor: currentUser.nombre, fecha: new Date().toISOString(), estado: 'pendiente' },
        auditStatus: 'pending'
    });
    setShowLoadBudget(false);
  };

  const handleAuditDecision = (approved: boolean) => {
    const comment = approved ? 'Inversión autorizada por Auditoría.' : 'Cotización rechazada por Auditoría.';
    onUpdateStage(approved ? ServiceStage.IN_WORKSHOP : ServiceStage.SCHEDULING, comment, {
        auditStatus: approved ? 'approved' : 'rejected'
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
      {/* SUB-MODALES */}
      {showAssignTurn && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <AsignarTurnoExperimental plate={request.vehiclePlate} providers={allUsers} onCancel={() => setShowAssignTurn(false)} onConfirm={handleConfirmTurn} />
        </div>
      )}

      {showLoadBudget && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <CargarPresupuestoExperimental onCancel={() => setShowLoadBudget(false)} onSave={handleConfirmBudget} />
        </div>
      )}

      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-7xl overflow-hidden border-t-[12px] border-blue-600 flex flex-col md:flex-row h-[90vh]">
        <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
          <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-600 rounded-[1.8rem] shadow-xl"><LucideCar size={36}/></div>
              <div>
                <p className="text-blue-400 font-black text-[12px] tracking-[0.4em] uppercase mb-1">{request.code}</p>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{request.vehiclePlate}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-4 bg-white/10 hover:bg-rose-600 rounded-3xl transition-all shadow-xl"><LucideX size={32}/></button>
          </div>

          <div className="flex gap-10 border-b border-slate-100 px-10 pt-6 shrink-0 bg-slate-50/50">
            {[
              { id: 'INFO', label: 'Detalle', icon: LucideInfo },
              { id: 'CHAT', label: 'Chat Real-time', icon: LucideMessageCircle },
              { id: 'LOGS', label: 'Historial', icon: LucideHistory },
              { id: 'BUDGET', label: 'Presupuesto', icon: LucideDollarSign },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-5 px-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-4 flex items-center gap-3 ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-white">
            {activeTab === 'INFO' && (
              <div className="space-y-12 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-200 space-y-8 shadow-inner">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b pb-3"><LucideUser size={14}/> Solicitante</h4>
                      <p className="text-lg font-black text-slate-800 uppercase italic">{request.userName}</p>
                      <div className="flex gap-4">
                         <span className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">{request.costCenter}</span>
                         <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${request.priority === 'URGENTE' ? 'bg-rose-500 text-white' : 'bg-slate-200'}`}>{request.priority}</span>
                      </div>
                   </div>
                   <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden group shadow-2xl">
                      <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3 relative z-10">Contexto Técnico</h4>
                      <div className="relative z-10">
                         <p className="text-[9px] font-black text-slate-500 uppercase">Categoría</p>
                         <p className="text-lg font-black italic">{request.mainCategory} / {request.specificType}</p>
                      </div>
                      <LucideWrench className="absolute -right-8 -bottom-8 text-white opacity-5 group-hover:scale-110 transition-transform" size={180}/>
                   </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Informe de Necesidad</p>
                  <div className="p-10 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 italic font-bold text-xl leading-relaxed text-slate-600">"{request.description}"</div>
                </div>
              </div>
            )}

            {activeTab === 'CHAT' && <ChatServicio messages={request.messages || []} currentUser={currentUser} onSendMessage={onSendMessage} />}
            {activeTab === 'LOGS' && <HistorialServicio history={request.history || []} />}
            {activeTab === 'BUDGET' && (
               <div className="space-y-10 animate-fadeIn">
                 {request.budget ? (
                   <div className="bg-white border-4 border-slate-50 rounded-[4rem] shadow-2xl overflow-hidden">
                     <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                       <h4 className="font-black uppercase italic text-xl tracking-tighter">Cotización Proveedor</h4>
                       <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${request.auditStatus === 'approved' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500 text-slate-900 border-amber-400 animate-pulse'}`}>{request.auditStatus || 'PENDIENTE AUDITORÍA'}</span>
                     </div>
                     <div className="p-12">
                       <table className="w-full text-left">
                         <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-6"><th className="pb-6">Ítem</th><th className="pb-6 text-center">Cant</th><th className="pb-6 text-right">Monto</th></tr></thead>
                         <tbody className="divide-y divide-slate-100">{request.budget.items?.map((it: any, i: number) => (<tr key={i} className="text-xs font-bold"><td className="py-6 uppercase">{it.descripcion}</td><td className="py-6 text-center font-black">{it.cantidad}</td><td className="py-6 text-right font-black text-slate-900">${it.total.toLocaleString()}</td></tr>))}</tbody>
                         <tfoot><tr className="bg-slate-50"><td colSpan={2} className="p-10 font-black uppercase text-xs italic">Total Inversión Proyectada</td><td className="p-10 text-right font-black text-4xl text-emerald-600 italic">${request.budget.total.toLocaleString()}</td></tr></tfoot>
                       </table>
                     </div>
                   </div>
                 ) : <div className="py-40 text-center bg-slate-50 rounded-[5rem] border-4 border-dashed border-slate-100"><LucideDollarSign size={80} className="mx-auto text-slate-200 mb-8"/><h4 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter leading-none">Esperando Cotización</h4></div>}
               </div>
            )}
          </div>
        </div>

        {/* PANEL DE ACCIONES SEGÚN PERFIL */}
        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-100 p-12 flex flex-col justify-between overflow-y-auto shadow-inner">
          <div className="space-y-12">
            <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-[0.3em] border-b pb-3 flex items-center gap-3"><LucideShield size={18} className="text-blue-600"/> Centro de Control</h4>
            
            <div className="grid grid-cols-1 gap-4">
               {/* ACCIONES SUPERVISOR / ADMIN */}
               {isSupervisorOrAdmin && (
                 <>
                   {request.stage === ServiceStage.REQUESTED && (
                      <button onClick={() => setShowAssignTurn(true)} className="w-full py-6 bg-amber-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] shadow-3xl hover:bg-amber-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideCalendar size={22}/> Asignar Turno Técnico</button>
                   )}
                   {request.stage === ServiceStage.SCHEDULING && (
                      <button onClick={() => setShowIngresoModal(true)} className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideClipboardCheck size={22}/> Procesar Ingreso a Taller</button>
                   )}
                   {request.stage === ServiceStage.IN_WORKSHOP && (
                      <button onClick={() => onUpdateStage(ServiceStage.FINISHED, 'Cierre definitivo de servicio')} className="w-full py-6 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] shadow-3xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideCheckCircle2 size={22}/> Finalizar Gestión</button>
                   )}
                   <button onClick={() => onUpdateStage(ServiceStage.CANCELLED, 'Cancelado por administración')} className="w-full py-4 text-rose-600 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"><LucideTrash2 size={18}/> Cancelar Solicitud</button>
                 </>
               )}

               {/* ACCIONES PROVEEDOR */}
               {isProvider && request.stage === ServiceStage.IN_WORKSHOP && (
                  <button onClick={() => setShowLoadBudget(true)} className="w-full py-6 bg-purple-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] shadow-3xl hover:bg-purple-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideDollarSign size={22}/> Cargar Cotización</button>
               )}

               {/* ACCIONES AUDITOR */}
               {isAuditor && request.stage === ServiceStage.BUDGETING && (
                  <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                     <button onClick={() => handleAuditDecision(true)} className="w-full py-6 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-2xl hover:bg-emerald-700 flex items-center justify-center gap-3"><LucideShieldCheck size={22}/> Autorizar Inversión</button>
                     <button onClick={() => handleAuditDecision(false)} className="w-full py-6 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-2xl hover:bg-rose-700 flex items-center justify-center gap-3"><LucideX size={22}/> Rechazar Cotización</button>
                  </div>
               )}
            </div>

            {request.providerName && (
              <div className="p-8 bg-white rounded-[3rem] border border-slate-200 shadow-sm space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucideBriefcase size={14} className="text-blue-500"/> Establecimiento Asignado</p>
                <div>
                  <p className="text-lg font-black text-slate-800 uppercase italic leading-none">{request.providerName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">SLA Estimado: 48 HORAS</p>
                </div>
              </div>
            )}
          </div>
          <div className="pt-10 border-t border-slate-100 text-center"><p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest italic">FleetCore Enterprise v3.5-EXP</p></div>
        </div>
      </div>
    </div>
  );
};
