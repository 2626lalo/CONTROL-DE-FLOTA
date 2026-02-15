import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LucideLayout, LucidePlusCircle, LucideRefreshCw, LucideArrowLeft, 
  LucideShieldCheck, LucideDatabase, LucideCar, LucideSend, 
  LucideActivity, LucideAlertCircle, LucideCheckCircle2, LucideWrench, LucideDollarSign,
  LucideX, LucideInfo, LucideListFilter, LucideSearch, LucideGauge, LucideMapPin, LucideMaximize, LucideHistory, LucideCheck
} from 'lucide-react';
import { useApp } from '../../context/FleetContext';
import { ServiceStage, ServiceRequest, UserRole, MainServiceCategory, Vehicle } from '../../types';
import { KanbanBoard } from './KanbanBoard';
import { DetalleSolicitudExperimental } from './DetalleSolicitudExperimental';
import { FiltrosAvanzados } from './FiltrosAvanzados';
import { BuscadorVehiculos } from './BuscadorVehiculos';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { db } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, updateDoc, arrayUnion, orderBy, setDoc } from 'firebase/firestore';

export const MesaControlExperimental: React.FC = () => {
  const { vehicles, user, registeredUsers, addNotification, checklists } = useApp();
  
  // UI States
  const [activeView, setActiveView] = useState<'BOARD' | 'NEW'>('BOARD');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States para Nueva Solicitud
  const [newReq, setNewReq] = useState({
    vehicle: null as Vehicle | null,
    category: 'MANTENIMIENTO' as MainServiceCategory,
    type: '',
    description: '',
    km: 0,
    location: '',
    priority: 'MEDIA' as any
  });

  // Filtros States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ServiceStage | ''>('');
  const [filterCC, setFilterCC] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [filterDateTo, setFilterDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 1. SINCRONIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
      setLocalRequests(requests);
      setIsLoadingRealtime(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoadingRealtime(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. KERNEL DE SEGURIDAD
  const userRole = user?.role || UserRole.USER;
  const userCC = (user?.costCenter || user?.centroCosto?.nombre || '').toUpperCase();

  const filteredRequests = useMemo(() => {
    return localRequests.filter(r => {
      let canSee = false;
      if (userRole === UserRole.ADMIN) canSee = true;
      else if (userRole === UserRole.SUPERVISOR) canSee = (r.costCenter || '').toUpperCase() === userCC;
      else if (userRole === UserRole.PROVIDER) canSee = r.providerId === user?.id;
      else if (userRole === UserRole.AUDITOR) canSee = r.stage === ServiceStage.BUDGETING || r.auditStatus === 'pending';
      else canSee = r.userId === user?.id;

      if (!canSee) return false;

      const term = searchQuery.toUpperCase();
      const matchSearch = (r.vehiclePlate || '').includes(term) || (r.code || '').toUpperCase().includes(term);
      if (!matchSearch) return false;
      if (filterStatus && r.stage !== filterStatus) return false;
      if (filterCC && r.costCenter !== filterCC) return false;
      if (filterPriority && r.priority !== filterPriority) return false;

      return true;
    });
  }, [localRequests, searchQuery, filterStatus, filterCC, filterPriority, user, userRole, userCC]);

  const kpis = useMemo(() => ({
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.stage === ServiceStage.REQUESTED).length,
    workshop: filteredRequests.filter(r => r.stage === ServiceStage.IN_WORKSHOP).length,
    budgeting: filteredRequests.filter(r => r.stage === ServiceStage.BUDGETING).length,
  }), [filteredRequests]);

  const allCCs = useMemo(() => {
    const set = new Set(localRequests.map(r => r.costCenter).filter(Boolean));
    return Array.from(set).sort();
  }, [localRequests]);

  // 3. HANDLERS DE ACCIÓN
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.vehicle || !newReq.description) {
      addNotification("Complete los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);
    const id = `SR-${Date.now()}`;
    const code = `EV-${Math.floor(10000 + Math.random() * 90000)}`;
    
    try {
      const requestData: ServiceRequest = {
        id,
        code,
        vehiclePlate: newReq.vehicle.plate,
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Usuario',
        userEmail: user?.email || '',
        userPhone: user?.telefono || '',
        costCenter: newReq.vehicle.costCenter || userCC,
        stage: ServiceStage.REQUESTED,
        mainCategory: newReq.category,
        specificType: newReq.type,
        description: newReq.description,
        location: newReq.location,
        odometerAtRequest: newReq.km || newReq.vehicle.currentKm,
        priority: newReq.priority,
        suggestedDates: [],
        attachments: [],
        isDialogueOpen: false,
        messages: [],
        budgets: [],
        history: [{
          id: `H-${Date.now()}`,
          date: new Date().toISOString(),
          userId: user?.id || 'sys',
          userName: user?.nombre || 'Sistema',
          toStage: ServiceStage.REQUESTED,
          comment: 'Apertura de evento técnico desde Mesa Experimental'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'requests', id), requestData);
      addNotification(`Evento ${code} aperturado con éxito`, "success");
      setActiveView('BOARD');
      setNewReq({ vehicle: null, category: 'MANTENIMIENTO', type: '', description: '', km: 0, location: '', priority: 'MEDIA' });
    } catch (error) {
      addNotification("Error al crear solicitud en Cloud", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStage = async (reqId: string, newStage: ServiceStage | string, comment: string, extras: any = {}) => {
    const request = localRequests.find(r => r.id === reqId);
    if (!request) return;

    try {
      const requestRef = doc(db, 'requests', reqId);
      const historyItem = {
        id: `H-${Date.now()}`,
        date: new Date().toISOString(),
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Operador',
        fromStage: request.stage,
        toStage: newStage as ServiceStage,
        comment: comment
      };

      await updateDoc(requestRef, {
        ...extras,
        stage: newStage as ServiceStage,
        updatedAt: new Date().toISOString(),
        history: arrayUnion(historyItem)
      });

      addNotification(`Unidad ${request.vehiclePlate} -> ${newStage}`, "success");
    } catch (error) {
      addNotification("Error al sincronizar cambio", "error");
    }
  };

  // FIX: Added handleSendMessage to process real-time chat messages via Firestore updateDoc and arrayUnion
  const handleSendMessage = async (reqId: string, text: string) => {
    const request = localRequests.find(r => r.id === reqId);
    if (!request || !text.trim()) return;

    try {
      const requestRef = doc(db, 'requests', reqId);
      const newMessage = {
        id: Date.now().toString(),
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Usuario',
        text: text,
        timestamp: new Date().toISOString(),
        role: userRole
      };

      await updateDoc(requestRef, {
        messages: arrayUnion(newMessage)
      });
    } catch (error) {
      console.error("Chat Error:", error);
      addNotification("Error al enviar mensaje", "error");
    }
  };

  const selectedRequest = useMemo(() => localRequests.find(r => r.id === selectedReqId), [localRequests, selectedReqId]);
  
  if (isLoadingRealtime) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <LucideRefreshCw className="animate-spin text-blue-600" size={48}/>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Sincronizando Mesa de Control...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3"><LucideDatabase size={36}/></div>
          <div>
            <div className="flex items-center gap-3 mb-1"><LucideShieldCheck size={18} className="text-blue-600"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Hub Pro v3.8</span></div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mesa de Control</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {activeView === 'BOARD' ? (
            <button 
              onClick={() => setActiveView('NEW')} 
              className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <LucidePlusCircle size={22}/> Apertura de Evento Técnico
            </button>
          ) : (
            <button 
              onClick={() => setActiveView('BOARD')} 
              className="bg-white text-slate-600 px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-200 shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <LucideArrowLeft size={22}/> Volver al Tablero
            </button>
          )}
        </div>
      </div>

      {activeView === 'BOARD' ? (
        <div className="space-y-12 animate-fadeIn">
          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Visibilidad Global', val: kpis.total, icon: LucideActivity, color: 'blue' },
              { label: 'Reportes Nuevos', val: kpis.pending, icon: LucideAlertCircle, color: 'amber' },
              { label: 'En Cotización', val: kpis.budgeting, icon: LucideDollarSign, color: 'purple' },
              { label: 'Ingresados Taller', val: kpis.workshop, icon: LucideWrench, color: 'indigo' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                   <div className={`p-3 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}><kpi.icon size={20}/></div>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mt-6 tracking-tighter">{kpi.val}</h3>
              </div>
            ))}
          </div>

          <FiltrosAvanzados 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterCC={filterCC} setFilterCC={setFilterCC} filterPriority={filterPriority} setFilterPriority={setFilterPriority}
            filterDateFrom={filterDateFrom} setFilterDateFrom={setFilterDateFrom} filterDateTo={filterDateTo} setFilterDateTo={setFilterDateTo}
            allCCs={allCCs} onReset={() => { setSearchQuery(''); setFilterStatus(''); setFilterCC(''); setFilterPriority(''); }}
          />

          <KanbanBoard 
            requests={filteredRequests} 
            onSelect={setSelectedReqId} 
            onMove={(id, stage) => handleUpdateStage(id, stage, `Unidad desplazada vía Kanban a ${stage}`)} 
            role={userRole} 
          />
        </div>
      ) : (
        /* FORMULARIO NUEVA SOLICITUD */
        <div className="max-w-4xl mx-auto animate-fadeIn">
          <form onSubmit={handleCreateRequest} className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12">
            <div className="flex items-center gap-6 border-b pb-8">
               <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl"><LucidePlusCircle size={32}/></div>
               <div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Apertura de Gestión</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Ingreso de Novedad Técnica al Sistema</p>
               </div>
            </div>

            <BuscadorVehiculos 
              vehicles={vehicles} 
              userCC={userCC} 
              isSupervisorOrAdmin={userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR} 
              onSelect={(v) => setNewReq({...newReq, vehicle: v, km: v.currentKm})} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoría Principal</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100"
                    value={newReq.category}
                    onChange={e => setNewReq({...newReq, category: e.target.value as any})}
                  >
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                    <option value="SERVICIO">SERVICIO</option>
                    <option value="COMPRAS">COMPRAS</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Prioridad</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100"
                    value={newReq.priority}
                    onChange={e => setNewReq({...newReq, priority: e.target.value as any})}
                  >
                    <option value="BAJA">BAJA (PROGRAMABLE)</option>
                    <option value="MEDIA">MEDIA (ESTÁNDAR)</option>
                    <option value="ALTA">ALTA (PREFERENTE)</option>
                    <option value="URGENTE">URGENTE (FUERA DE SERVICIO)</option>
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción de Necesidad / Falla Detectada</label>
               <textarea 
                rows={4} 
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all resize-none shadow-inner"
                placeholder="DETALLE EL PROBLEMA O REQUERIMIENTO..."
                value={newReq.description}
                onChange={e => setNewReq({...newReq, description: e.target.value.toUpperCase()})}
                required
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Odómetro Reportado (KM)</label>
                  <div className="relative">
                    <LucideGauge className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input type="number" className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none" value={newReq.km || ''} onChange={e => setNewReq({...newReq, km: Number(e.target.value)})} />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación del Activo</label>
                  <div className="relative">
                    <LucideMapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input type="text" className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none" placeholder="LUGAR O BASE..." value={newReq.location} onChange={e => setNewReq({...newReq, location: e.target.value.toUpperCase()})} />
                  </div>
               </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex gap-4">
               <button type="button" onClick={() => setActiveView('BOARD')} className="flex-1 py-6 rounded-2xl font-black uppercase text-[10px] text-slate-400 tracking-widest hover:bg-slate-50">Cancelar Operación</button>
               <button 
                type="submit" 
                disabled={isSubmitting || !newReq.vehicle}
                className="flex-[2] bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-3xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
               >
                 {isSubmitting ? <LucideRefreshCw className="animate-spin" size={24}/> : <LucideCheck size={24}/>} 
                 Publicar Evento en Mesa
               </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDERIZADO DE VISTA DETALLE */}
      {selectedRequest && (
        <DetalleSolicitudExperimental 
          request={selectedRequest} 
          currentUser={user!} 
          onClose={() => setSelectedReqId(null)}
          onUpdateStage={(stage, comment, extras) => handleUpdateStage(selectedRequest.id, stage, comment, extras)}
          onSendMessage={(text) => handleSendMessage(selectedRequest.id, text)} 
          allUsers={registeredUsers} 
          lastChecklist={checklists.find(c => c.vehiclePlate === selectedRequest.vehiclePlate)}
        />
      )}
    </div>
  );
};
