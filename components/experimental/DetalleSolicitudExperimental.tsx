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
        providerName: allUsers.find(u => u.id === data.providerId)?.nombre
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

  const handleProcessIngreso = () => {
    const comment = `ACTA DE INGRESO: Taller [${ingresoData.workshop}] - Receptor [${ingresoData.receptor}] - Obs: ${ingresoData.obs}`;
    onUpdateStage(ServiceStage.IN_WORKSHOP, comment);
    setShowIngresoModal(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
      {/* SUB-MODALES DE ACCIÓN */}
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

      {showIngresoModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border-t-[12px] border-blue-600 flex flex-col">
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4"><div className="p-3 bg-blue-600 rounded-2xl shadow-xl"><LucideWrench size={24}/></div><h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Acta de Ingreso a Taller</h3></div>
               <button onClick={() => setShowIngresoModal(false)} className="p-2 text-white hover:text-rose-500 transition-all"><LucideX size={24}/></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto">
               <div className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 ${isChecklistUpToDate ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  {isChecklistUpToDate ? <LucideShieldCheck className="text-emerald-600" size={36}/> : <LucideShieldAlert className="text-rose-600 animate-pulse" size={36}/>}
                  <div><h4 className="font-black text-slate-800 uppercase text-xs italic">{isChecklistUpToDate ? 'Inspección Vigente (Hoy)' : 'ATENCIÓN: Falta Inspección'}</h4><p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{isChecklistUpToDate ? 'Se permite el ingreso a taller según protocolo.' : 'Debe realizar el checklist antes de ingresar.'}</p></div>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Taller Receptor</label><input className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" value={ingresoData.workshop} onChange={e => setIngresoData({...ingresoData, workshop: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Receptor Autorizado</label><input className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" value={ingresoData.receptor} onChange={e => setIngresoData({...ingresoData, receptor: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Observaciones de Entrega</label><textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-100 resize-none" rows={3} value={ingresoData.obs} onChange={e => setIngresoData({...ingresoData, obs: e.target.value})} /></div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowIngresoModal(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px]">Cancelar</button>
              <button disabled={!isChecklistUpToDate || !ingresoData.workshop || !ingresoData.receptor} onClick={handleProcessIngreso} className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all disabled:opacity-30">Confirmar Ingreso a Taller</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL DOSSIER */}
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-7xl overflow-hidden border-t-[12px] border-blue-600 flex flex-col md:flex-row h-[90vh]">
        <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
          {/* Header */}
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

          {/* Navigation */}
          <div className="flex gap-10 border-b border-slate-100 px-10 pt-6 shrink-0 bg-slate-50/50">
            {[
              { id: 'INFO', label: 'Relevamiento', icon: LucideInfo },
              { id: 'CHAT', label: 'Mesa de Diálogo', icon: LucideMessageCircle },
              { id: 'LOGS', label: 'Trazabilidad', icon: LucideHistory },
              { id: 'BUDGET', label: 'Cotización', icon: LucideDollarSign },
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
                   <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-200 space-y-8">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b pb-3"><LucideUser size={14}/> Solicitante Autorizado</h4>
                      <div className="space-y-6">
                         <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Nombre</p><p className="text-lg font-black text-slate-800 uppercase italic">{request.userName}</p></div>
                         <div className="grid grid-cols-2 gap-6">
                            <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">C. Costo</p><span className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic">{request.costCenter}</span></div>
                            <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Prioridad</p><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic ${request.priority === 'URGENTE' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{request.priority}</span></div>
                         </div>
                      </div>
                   </div>
                   <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-200 space-y-8">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b pb-3"><LucideActivity size={14}/> Contexto de Falla</h4>
                      <div className="space-y-6">
                         <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Categoría</p><p className="text-lg font-black text-slate-800 uppercase italic">{request.mainCategory} / {request.specificType}</p></div>
                         <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">KM Auditado</p><p className="text-2xl font-black text-slate-800 italic">{request.odometerAtRequest?.toLocaleString()} KM</p></div>
                      </div>
                   </div>
                </div>
                <div className="p-12 bg-slate-950 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] italic">Informe de Necesidad</p>
                    <p className="text-2xl font-medium leading-relaxed italic opacity-90">"{request.description}"</p>
                  </div>
                  <LucideFileText className="absolute -right-12 -bottom-12 text-white opacity-5" size={260}/>
                </div>
                {request.attachments?.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b pb-3"><LucideMaximize size={16}/> Evidencia Fotográfica</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {request.attachments.map((at: any, i: number) => (
                        <div key={i} className="aspect-video bg-slate-100 rounded-[2.5rem] overflow-hidden border-2 border-slate-50 shadow-inner group cursor-pointer relative">
                          <img src={at.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'CHAT' && <ChatServicio messages={request.messages || []} currentUser={currentUser} onSendMessage={onSendMessage} />}
            {activeTab === 'LOGS' && <HistorialServicio history={request.history || []} />}
            {activeTab === 'BUDGET' && (
               <div className="space-y-10 animate-fadeIn">
                 {request.budget ? (
                   <div className="bg-white border-4 border-slate-50 rounded-[4rem] shadow-2xl overflow-hidden">
                     <div className="p-10 bg-slate-50 border-b flex justify-between items-center">
                       <h4 className="font-black text-slate-800 uppercase italic text-xl tracking-tighter">Cotización Técnica</h4>
                       <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${request.auditStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-amber-50 text-amber-700 border-amber-500 animate-pulse'}`}>{request.auditStatus || 'EN AUDITORÍA'}</span>
                     </div>
                     <div className="p-12">
                       <table className="w-full text-left">
                         <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b pb-6"><th className="pb-6">Descripción</th><th className="pb-6 text-center">Cant</th><th className="pb-6 text-right">Total</th></tr></thead>
                         <tbody className="divide-y divide-slate-100">{request.budget.items?.map((it: any, i: number) => (<tr key={i} className="text-xs font-bold text-slate-700"><td className="py-6 uppercase">{it.descripcion}</td><td className="py-6 text-center font-black">{it.cantidad}</td><td className="py-6 text-right font-black text-slate-900">${it.total.toLocaleString()}</td></tr>))}</tbody>
                         <tfoot><tr className="bg-slate-950 text-white"><td colSpan={2} className="p-10 font-black uppercase text-xs italic">Inversión Final Auditada</td><td className="p-10 text-right font-black text-4xl text-emerald-400 italic">${request.budget.total.toLocaleString()}</td></tr></tfoot>
                       </table>
                     </div>
                   </div>
                 ) : <div className="py-40 text-center bg-slate-50 rounded-[5rem] border-4 border-dashed border-slate-100"><LucideDollarSign size={80} className="mx-auto text-slate-200 mb-8"/><h4 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Esperando Carga de Presupuesto</h4></div>}
               </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: ACCIONES SEGÚN ROL */}
        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-100 p-12 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-[0.3em] border-b pb-3 flex items-center gap-3"><LucideShield size={18} className="text-blue-600"/> Centro de Control</h4>
              <div className="grid grid-cols-1 gap-4">
                 {/* ACCIONES SUPERVISOR / ADMIN */}
                 {isSupervisorOrAdmin && (
                   <>
                     {request.stage === ServiceStage.REQUESTED && (
                        <button onClick={() => setShowAssignTurn(true)} className="w-full py-6 bg-amber-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-amber-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideCalendar size={22}/> Asignar Turno y Taller</button>
                     )}
                     {request.stage === ServiceStage.SCHEDULING && (
                        <button onClick={() => setShowIngresoModal(true)} className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideClipboardCheck size={22}/> Procesar Ingreso a Taller</button>
                     )}
                     {request.stage === ServiceStage.IN_WORKSHOP && (
                        <button onClick={() => onUpdateStage(ServiceStage.FINISHED, 'Cierre definitivo de servicio')} className="w-full py-6 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideCheckCircle2 size={22}/> Finalizar Gestión</button>
                     )}
                     <button onClick={() => onUpdateStage(ServiceStage.CANCELLED, 'Cancelación por administrador')} className="w-full py-5 text-rose-600 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"><LucideTrash2 size={18}/> Cancelar Solicitud</button>
                   </>
                 )}

                 {/* ACCIONES PROVEEDOR */}
                 {isProvider && request.stage === ServiceStage.SCHEDULING && (
                    <button onClick={() => setShowIngresoModal(true)} className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideClipboardCheck size={22}/> Firmar Acta de Ingreso</button>
                 )}
                 {isProvider && request.stage === ServiceStage.IN_WORKSHOP && (
                    <button onClick={() => setShowLoadBudget(true)} className="w-full py-6 bg-purple-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-purple-700 transition-all flex items-center justify-center gap-4 active:scale-95"><LucideDollarSign size={22}/> Cargar Presupuesto Técnico</button>
                 )}

                 {/* ACCIONES AUDITOR */}
                 {isAuditor && request.stage === ServiceStage.BUDGETING && (
                    <div className="grid grid-cols-1 gap-4">
                       <button onClick={() => onUpdateStage(ServiceStage.IN_WORKSHOP, 'Gasto autorizado por auditoría', { auditStatus: 'approved' })} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><LucideShieldCheck size={22}/> Autorizar Inversión</button>
                       <button onClick={() => onUpdateStage(ServiceStage.SCHEDULING, 'Presupuesto rechazado para re-cotización', { auditStatus: 'rejected' })} className="w-full py-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"><LucideX size={22}/> Rechazar Cotización</button>
                    </div>
                 )}
              </div>
            </div>

            {request.providerName && (
              <div className="p-8 bg-white rounded-[3rem] border border-slate-200 shadow-inner space-y-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucideBriefcase size={14} className="text-blue-500"/> Establecimiento Asignado</p>
                <div>
                  <p className="text-lg font-black text-slate-800 uppercase italic leading-none">{request.providerName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">SLA Estimado: 48 HORAS</p>
                </div>
              </div>
            )}
          </div>
          <div className="pt-10 border-t border-slate-100 text-center"><p className="text-[7px] text-slate-300 font-bold uppercase">Enterprise Fleet Management System v3.0-EXP</p></div>
        </div>
      </div>
    </div>
  );
};