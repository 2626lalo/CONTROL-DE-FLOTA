import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LucideLayout, LucidePlusCircle, LucideRefreshCw, LucideArrowLeft, 
  LucideShieldCheck, LucideDatabase, LucideCar, LucideSend, 
  LucideActivity, LucideAlertCircle, LucideCheckCircle2, LucideWrench, LucideDollarSign,
  LucideX, LucideInfo, LucideListFilter, LucideSearch, LucideGauge, LucideMapPin, LucideMaximize, LucideHistory
} from 'lucide-react';
import { useApp } from '../../context/FleetContext';
import { ServiceStage, ServiceRequest, UserRole, MainServiceCategory, Vehicle } from '../../types';
import { KanbanBoard } from './KanbanBoard';
import { DetalleSolicitudExperimental } from './DetalleSolicitudExperimental';
import { FiltrosAvanzados } from './FiltrosAvanzados';
import { BuscadorVehiculos } from './BuscadorVehiculos';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';

export const MesaControlExperimental: React.FC = () => {
  const { vehicles, user, registeredUsers, serviceRequests, checklists, addServiceRequest, updateServiceRequest, addNotification } = useApp();
  
  // UI States
  const [activeView, setActiveView] = useState<'BOARD' | 'NEW'>('BOARD');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  
  // Filtros States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ServiceStage | ''>('');
  const [filterCC, setFilterCC] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [filterDateTo, setFilterDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // New Request States
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mainCategory, setMainCategory] = useState<MainServiceCategory>('MANTENIMIENTO');
  const [specificType, setSpecificType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permisos Kernel
  const userRole = user?.role || UserRole.USER;
  const userCC = (user?.centroCosto?.nombre || user?.costCenter || '').toUpperCase();
  const isSupervisorOrAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR;
  const isAuditor = userRole === UserRole.AUDITOR;
  const isProvider = userRole === UserRole.PROVIDER;

  const filteredRequests = useMemo(() => {
    return serviceRequests.filter(r => {
      // 1. Filtrado de Seguridad (Visibilidad por Rol)
      if (isSupervisorOrAdmin) { /* Ver todo */ } 
      else if (isProvider) { if (r.providerId !== user?.id) return false; } 
      else if (isAuditor) { if (r.stage !== ServiceStage.BUDGETING) return false; }
      else { if (r.costCenter?.toUpperCase() !== userCC) return false; }

      // 2. Filtros UI
      const term = searchQuery.toUpperCase();
      const matchSearch = r.vehiclePlate.includes(term) || r.code.toUpperCase().includes(term);
      if (!matchSearch) return false;
      if (filterStatus && r.stage !== filterStatus) return false;
      if (filterCC && r.costCenter !== filterCC) return false;
      if (filterPriority && r.priority !== filterPriority) return false;

      const rDate = parseISO(r.createdAt);
      const start = startOfDay(parseISO(filterDateFrom));
      const end = endOfDay(parseISO(filterDateTo));
      if (!isWithinInterval(rDate, { start, end })) return false;

      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [serviceRequests, searchQuery, filterStatus, filterCC, filterPriority, filterDateFrom, filterDateTo, isSupervisorOrAdmin, isProvider, isAuditor, user?.id, userCC]);

  const kpis = useMemo(() => ({
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.stage === ServiceStage.REQUESTED).length,
    workshop: filteredRequests.filter(r => r.stage === ServiceStage.IN_WORKSHOP).length,
    budgeting: filteredRequests.filter(r => r.stage === ServiceStage.BUDGETING).length,
  }), [filteredRequests]);

  const allCCs = useMemo(() => {
    const set = new Set(serviceRequests.map(r => r.costCenter).filter(Boolean));
    return Array.from(set).sort();
  }, [serviceRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !description.trim() || !specificType) {
      addNotification("Complete todos los campos técnicos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);
    const newRequest: ServiceRequest = {
      id: `SR-${Date.now()}`,
      code: `EV-${Math.floor(10000 + Math.random() * 90000)}`,
      vehiclePlate: selectedVehicle.plate,
      userId: user?.id || 'sys',
      userName: `${user?.nombre || ''} ${user?.apellido || ''}`.trim().toUpperCase(),
      userEmail: user?.email || '',
      userPhone: user?.telefono || '',
      costCenter: (selectedVehicle.costCenter || userCC).toUpperCase(),
      stage: ServiceStage.REQUESTED,
      mainCategory: mainCategory,
      category: specificType,
      specificType: specificType,
      description: description,
      location: location || 'BASE OPERATIVA',
      odometerAtRequest: odometer,
      suggestedDates: [],
      priority: 'MEDIA',
      attachments: [],
      isDialogueOpen: false,
      messages: [],
      budgets: [],
      history: [{
        id: `H-${Date.now()}`,
        date: new Date().toISOString(),
        userId: user?.id || 'sys',
        userName: user?.nombre || 'Usuario',
        toStage: ServiceStage.REQUESTED,
        comment: 'Solicitud aperturada desde Mesa Pro Experimental.'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addServiceRequest(newRequest);
    addNotification("Reporte técnico sincronizado exitosamente", "success");
    setActiveView('BOARD');
    setIsSubmitting(false);
    setSelectedVehicle(null);
    setDescription('');
    setSpecificType('');
  };

  const handleUpdateStage = async (reqId: string, stage: ServiceStage | string, comment: string, extras: any = {}) => {
    const found = serviceRequests.find(r => r.id === reqId);
    if (!found) return;
    const updated = {
      ...found, ...extras, stage: stage as ServiceStage, updatedAt: new Date().toISOString(),
      history: [...(found.history || []), { id: `H-${Date.now()}`, date: new Date().toISOString(), userId: user?.id || 'sys', userName: user?.nombre || 'Sistema', fromStage: found.stage, toStage: stage as ServiceStage, comment }]
    };
    await updateServiceRequest(updated);
    addNotification(`Estado actualizado: ${stage}`, "success");
  };

  const handleSendMessage = async (reqId: string, text: string) => {
    const found = serviceRequests.find(r => r.id === reqId);
    if (!found) return;
    const msg = { id: Date.now().toString(), userId: user?.id || 'sys', userName: user?.nombre || 'Usuario', text, timestamp: new Date().toISOString(), role: userRole };
    await updateServiceRequest({ ...found, messages: [...(found.messages || []), msg] });
  };

  const selectedRequest = useMemo(() => serviceRequests.find(r => r.id === selectedReqId), [serviceRequests, selectedReqId]);
  
  const lastChecklistForSelected = useMemo(() => {
    if (!selectedRequest) return null;
    return [...checklists].filter(c => c.vehiclePlate === selectedRequest.vehiclePlate).sort((a,b) => b.date.localeCompare(a.date))[0] || null;
  }, [checklists, selectedRequest]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8">
      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3"><LucideDatabase size={36}/></div>
          <div><div className="flex items-center gap-3 mb-1"><LucideShieldCheck size={18} className="text-blue-600"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Management Hub Pro v3.0</span></div><h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mesa de Control</h1></div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {activeView === 'BOARD' ? (
            <button onClick={() => setActiveView('NEW')} className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"><LucidePlusCircle size={22}/> Apertura de Evento Técnico</button>
          ) : (
            <button onClick={() => setActiveView('BOARD')} className="bg-white text-slate-600 px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-200 shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"><LucideArrowLeft size={22}/> Volver al Tablero</button>
          )}
          <button className="p-5 bg-white border border-slate-200 rounded-[1.8rem] text-slate-400 hover:text-blue-600 shadow-sm transition-all active:rotate-180 duration-700"><LucideRefreshCw size={24}/></button>
        </div>
      </div>

      {activeView === 'BOARD' && (
        <div className="space-y-12 animate-fadeIn">
          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Visibilidad Global', val: kpis.total, icon: LucideActivity, color: 'blue' },
              { label: 'Reportes Nuevos', val: kpis.pending, icon: LucideAlertCircle, color: 'amber' },
              { label: 'En Cotización', val: kpis.budgeting, icon: LucideDollarSign, color: 'purple' },
              { label: 'Ingresados Taller', val: kpis.workshop, icon: LucideWrench, color: 'indigo' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p><div className={`p-4 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner`}><kpi.icon size={22}/></div></div>
                <h3 className="text-4xl font-black text-slate-800 mt-8 tracking-tighter leading-none">{kpi.val}</h3>
              </div>
            ))}
          </div>

          <FiltrosAvanzados 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterCC={filterCC} setFilterCC={setFilterCC} filterPriority={filterPriority} setFilterPriority={setFilterPriority}
            filterDateFrom={filterDateFrom} setFilterDateFrom={setFilterDateFrom} filterDateTo={filterDateTo} setFilterDateTo={setFilterDateTo}
            allCCs={allCCs} onReset={() => { setSearchQuery(''); setFilterStatus(''); setFilterCC(''); setFilterPriority(''); setFilterDateFrom(format(subDays(new Date(), 90), 'yyyy-MM-dd')); setFilterDateTo(format(new Date(), 'yyyy-MM-dd')); }}
          />

          <KanbanBoard requests={filteredRequests} onSelect={setSelectedReqId} onMove={(id, stage) => handleUpdateStage(id, stage, `Unidad desplazada vía Kanban a ${stage}`)} role={userRole} />
        </div>
      )}

      {activeView === 'NEW' && (
        <div className="max-w-4xl mx-auto animate-fadeIn pb-32">
          <div className="bg-white p-12 rounded-[4rem] shadow-3xl border border-slate-100 space-y-12">
            <div className="flex items-center gap-6 border-b pb-8"><div className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-xl"><LucideCar size={36}/></div><div><h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Nueva Gestión Técnica</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Sincronización de Novedad v3.0</p></div></div>
            
            <BuscadorVehiculos vehicles={vehicles} userCC={userCC} isSupervisorOrAdmin={isSupervisorOrAdmin} onSelect={setSelectedVehicle} />

            {selectedVehicle && (
               <div className="space-y-10 animate-fadeIn">
                  <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center"><div className="relative z-10"><p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Unidad Vinculada</p><h3 className="text-5xl font-black italic tracking-tighter uppercase">{selectedVehicle.plate}</h3><p className="text-sm font-bold text-slate-400 uppercase mt-2">{selectedVehicle.make} {selectedVehicle.model}</p></div><LucideCheckCircle2 className="text-emerald-500 relative z-10" size={80}/><LucideCar className="absolute -right-12 -bottom-12 opacity-5" size={280}/></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['MANTENIMIENTO', 'SERVICIO', 'COMPRAS'].map(cat => (
                      <button key={cat} onClick={() => setMainCategory(cat as any)} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${mainCategory === cat ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
                         {cat === 'MANTENIMIENTO' ? <LucideWrench size={32}/> : cat === 'SERVICIO' ? <LucideActivity size={32}/> : <LucideDatabase size={32}/>}
                         <span className="text-[10px] font-black uppercase">{cat}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo Específico</label><input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-bold uppercase text-xs outline-none focus:border-blue-500" placeholder="EJ: CAMBIO ACEITE..." value={specificType} onChange={e => setSpecificType(e.target.value.toUpperCase())} /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje Actual</label><input type="number" onFocus={e => e.target.select()} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-black text-2xl text-blue-600 outline-none" value={odometer} onChange={e => setOdometer(Number(e.target.value))} /></div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción del Requerimiento</label><textarea rows={4} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-sm outline-none focus:border-blue-500 resize-none shadow-inner" placeholder="DETALLE DE LA NECESIDAD..." value={description} onChange={e => setDescription(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación de Referencia</label><input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] font-bold uppercase text-xs outline-none focus:border-blue-500" value={location} onChange={e => setLocation(e.target.value.toUpperCase())} /></div>
                  <button onClick={handleCreateRequest} disabled={isSubmitting} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-3xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">{isSubmitting ? <LucideRefreshCw className="animate-spin"/> : <LucideSend/>} Publicar Reporte Técnico</button>
               </div>
            )}
          </div>
        </div>
      )}

      {selectedRequest && (
        <DetalleSolicitudExperimental 
          request={selectedRequest} currentUser={user!} onClose={() => setSelectedReqId(null)}
          onUpdateStage={(stage, comment, extras) => handleUpdateStage(selectedRequest.id, stage as ServiceStage, comment, extras)}
          onSendMessage={(text) => handleSendMessage(selectedRequest.id, text)} allUsers={registeredUsers} lastChecklist={lastChecklistForSelected}
        />
      )}
    </div>
  );
};