import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LucideFlaskConical, LucideChevronDown, LucidePlusCircle, 
  LucideFileText, LucideSearch, LucideChevronRight, LucideCar,
  LucideArrowLeft, LucideTrash2, LucideUser, LucideCheck, 
  LucideInfo, LucideRotateCcw, LucidePlus, LucideSend, 
  LucideMessageSquare, LucideZap, LucideShield, LucideArrowRightCircle, 
  LucideCheckCircle2, LucideBuilding2, LucideLayoutDashboard, 
  LucideBellRing, LucideTarget, LucideLock, LucideUnlock,
  LucideGauge, LucideAlertTriangle, LucideSettings, LucideMessageCircle
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { ServiceStage, ServiceRequest, UserRole } from '../types';
import { format, parseISO } from 'date-fns';

type LabModule = 'OVERVIEW' | 'NEW_REQ' | 'REQ_LIST';
type ReqStep = 'SELECT_VEHICLE' | 'CONFIRM_DETAILS' | 'SERVICE_SPEC';

export const TestSector = () => {
  const { vehicles, user, serviceRequests, addServiceRequest, updateServiceRequest, updateServiceStage, addNotification, updateVehicleMileage } = useApp();
  
  const [activeModule, setActiveModule] = useState<LabModule>('OVERVIEW');
  const [currentStep, setCurrentStep] = useState<ReqStep>('SELECT_VEHICLE');
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [driverData, setDriverData] = useState({ name: '', phone: '' });

  const [category, setCategory] = useState<string>('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [odometer, setOdometer] = useState<number>(0);
  
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<ServiceRequest | null>(null);
  const [isChatViewActive, setIsChatViewActive] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2 || user?.role === UserRole.MANAGER;

  const accessibleVehicles = useMemo(() => {
    if (isAdmin) return vehicles;
    return vehicles.filter(v => v.costCenter === user?.costCenter);
  }, [vehicles, user, isAdmin]);

  const userRequests = useMemo(() => {
    if (isAdmin) return serviceRequests;
    return serviceRequests.filter(r => r.costCenter === user?.costCenter || r.userId === user?.id);
  }, [serviceRequests, user, isAdmin]);

  const activeUserRequests = useMemo(() => {
    return userRequests.filter(r => r.stage !== ServiceStage.FINISHED && r.stage !== ServiceStage.CANCELLED);
  }, [userRequests]);

  const serviceOptions: Record<string, string[]> = {
    'MANTENIMIENTO PREVENTIVO': ['Service de 10k', 'Service de 20k', 'Revisión General', 'Frenos', 'Distribución'],
    'REPARACIÓN CORRECTIVA': ['Motor', 'Caja de Cambios', 'Suspensión', 'Electricidad', 'Embrague'],
    'NEUMÁTICOS': ['Alineación y Balanceo', 'Cambio de Cubiertas', 'Reparación de Llanta'],
    'OTROS': ['Lavado', 'VTV', 'GNC', 'Carrocería']
  };

  const filteredFleet = useMemo(() => {
    if (!searchQuery) return accessibleVehicles;
    const term = searchQuery.toLowerCase();
    return accessibleVehicles.filter(v => v.plate.toLowerCase().includes(term) || v.model.toLowerCase().includes(term));
  }, [accessibleVehicles, searchQuery]);

  useEffect(() => {
    if (user && !driverData.name) {
      setDriverData({ name: user.name, phone: user.phone || '' });
    }
  }, [user]);

  const handleVehicleSelect = (v: any) => {
    setSelectedVehicle(v);
    setOdometer(v.currentKm);
    setSearchQuery(v.plate);
    setIsSearchOpen(false);
    setCurrentStep('CONFIRM_DETAILS');
  };

  const handleSendRequest = () => {
    if (!selectedVehicle || !category || !serviceType) return;
    const newRequest: ServiceRequest = {
      id: `REQ-${Date.now()}`,
      code: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      vehiclePlate: selectedVehicle.plate,
      userId: user?.id || 'guest',
      userName: driverData.name,
      costCenter: selectedVehicle.costCenter || 'S/A',
      stage: ServiceStage.REQUESTED,
      category: category as any,
      description: description,
      priority: 'MEDIA' as any,
      odometerAtRequest: odometer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      budgets: [], invoices: [], history: [], messages: [],
      images: [],
      isDialogueOpen: false,
      unreadAdminCount: 1, unreadUserCount: 0
    };
    addServiceRequest(newRequest);
    updateVehicleMileage(selectedVehicle.plate, odometer, 'SERVICE');
    addNotification("Solicitud técnica sincronizada con éxito", "success");
    handleReset();
    setActiveModule('OVERVIEW');
  };

  const handleSendMessage = () => {
    if (!selectedRequestDetail || !chatMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
      userName: user?.name || 'Usuario',
      text: chatMessage,
      timestamp: new Date().toISOString(),
      role: user?.role || UserRole.DRIVER
    };
    const updated = {
      ...selectedRequestDetail,
      messages: [...(selectedRequestDetail.messages || []), newMsg],
      unreadAdminCount: !isAdmin ? (selectedRequestDetail.unreadAdminCount || 0) + 1 : 0,
      unreadUserCount: isAdmin ? (selectedRequestDetail.unreadUserCount || 0) + 1 : 0,
      updatedAt: new Date().toISOString()
    };
    updateServiceRequest(updated);
    setSelectedRequestDetail(updated);
    setChatMessage('');
  };

  const handleOpenAlert = (req: ServiceRequest) => {
    const updated = { ...req, unreadUserCount: 0 };
    updateServiceRequest(updated);
    setSelectedRequestDetail(updated);
    setIsChatViewActive(true);
  };

  const handleReset = () => {
    setSelectedVehicle(null);
    setCurrentStep('SELECT_VEHICLE');
    setSearchQuery('');
    setCategory('');
    setServiceType('');
    setDescription('');
    setOdometer(0);
    setSelectedRequestDetail(null);
    setIsChatViewActive(false);
  };

  const isStepDisabled = useMemo(() => {
    if (currentStep === 'SELECT_VEHICLE') return !selectedVehicle;
    if (currentStep === 'CONFIRM_DETAILS') return !driverData.name || !driverData.phone;
    if (currentStep === 'SERVICE_SPEC') return !category || !serviceType || description.trim().length < 3 || odometer <= 0;
    return false;
  }, [currentStep, selectedVehicle, driverData, category, serviceType, description, odometer]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col animate-fadeIn">
      <header className="bg-white border-b border-slate-200 px-10 py-5 flex justify-between items-center z-[100] sticky top-0 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setActiveModule('OVERVIEW'); handleReset(); }}>
           <div className="p-2 bg-slate-900 rounded-lg text-white"><LucideFlaskConical size={18}/></div>
           <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gestión de Servicios</h1>
        </div>
        <div className="relative" ref={moduleMenuRef}>
          <button onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)} className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black uppercase text-[9px] tracking-widest shadow-xl hover:bg-slate-800 transition-all">
            <LucideSettings size={16} className="text-blue-400"/>
            <span>{activeModule === 'OVERVIEW' ? 'Panel Principal' : activeModule === 'NEW_REQ' ? 'Nueva Solicitud' : 'Mis Gestiones'}</span>
            <LucideChevronDown size={14}/>
          </button>
          {isModuleMenuOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn w-[280px]">
              <div className="p-2">
                 <button onClick={() => { setActiveModule('OVERVIEW'); handleReset(); setIsModuleMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${activeModule === 'OVERVIEW' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-500'}`}>
                    <LucideLayoutDashboard size={14}/>
                    <span className="font-black text-[9px] uppercase">Vista General</span>
                 </button>
                 <button onClick={() => { setActiveModule('NEW_REQ'); handleReset(); setIsModuleMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${activeModule === 'NEW_REQ' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-500'}`}>
                    <LucidePlusCircle size={14}/>
                    <span className="font-black text-[9px] uppercase">Nueva Solicitud</span>
                 </button>
                 <button onClick={() => { setActiveModule('REQ_LIST'); handleReset(); setIsModuleMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${activeModule === 'REQ_LIST' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-500'}`}>
                    <LucideFileText size={14}/>
                    <span className="font-black text-[9px] uppercase">Histórico de Gestiones</span>
                 </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-10 pt-8 max-w-[1400px] mx-auto">
          {activeModule === 'OVERVIEW' ? (
            <div className="space-y-10 animate-fadeIn">
               {isChatViewActive && selectedRequestDetail ? (
                 <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <div className="flex items-center gap-6">
                           <button onClick={() => setIsChatViewActive(false)} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm active:scale-95"><LucideArrowLeft size={20}/></button>
                           <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">CENTRO DE RESPUESTA</p>
                              <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Mesa de Diálogo Técnica</h3>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase">Gestión #{selectedRequestDetail.code}</p>
                           <p className="text-xl font-black text-slate-800 italic uppercase">{selectedRequestDetail.vehiclePlate}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl flex flex-col h-[650px] overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/30 custom-scrollbar">
                            {(!selectedRequestDetail.messages || selectedRequestDetail.messages.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                                    <LucideRotateCcw size={64} className="animate-spin-slow mb-6"/>
                                    <p className="text-xs font-black uppercase tracking-widest">Esperando comunicación...</p>
                                </div>
                            ) : (
                                selectedRequestDetail.messages?.map(m => (
                                    <div key={m.id} className={`flex ${m.userId === user?.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                        <div className={`max-w-[75%] p-6 rounded-[2.2rem] shadow-sm border ${m.userId === user?.id ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'}`}>
                                            <p className="text-[8px] font-black uppercase opacity-60 mb-2 flex justify-between gap-4">
                                                <span>{m.userName}</span>
                                                <span className="italic">{format(parseISO(m.timestamp), 'HH:mm')}</span>
                                            </p>
                                            <p className="text-[13px] font-bold leading-relaxed">"{m.text}"</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-10 border-t bg-white relative">
                            {(!isAdmin && !selectedRequestDetail.isDialogueOpen) ? (
                                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                                    <LucideLock size={32} className="text-slate-300"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center px-10">Mesa de diálogo cerrada por el gestor técnico.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <textarea rows={3} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-100 resize-none shadow-inner" placeholder="Escriba su mensaje al administrador..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} />
                                    <button onClick={handleSendMessage} className="absolute right-6 bottom-6 p-5 bg-indigo-600 text-white rounded-2xl shadow-2xl hover:bg-indigo-700 transition-all active:scale-90"><LucideSend size={24}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
               ) : (
                 <>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-10">
                         <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner"><LucideUser size={48}/></div>
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Gestor de Activos</p>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">{user?.name}</h2>
                            <div className="flex gap-4 mt-3">
                               <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest"><LucideShield size={12} className="text-blue-400"/> {user?.role}</div>
                               <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100"><LucideBuilding2 size={12}/> {user?.costCenter || 'Corporativo'}</div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Unidades en Control</p>
                         <div className="flex items-baseline gap-3"><span className="text-6xl font-black italic tracking-tighter">{accessibleVehicles.length}</span><span className="text-sm font-black text-blue-400 uppercase">Activos</span></div>
                         <LucideCar className="absolute -right-10 -bottom-10 opacity-5" size={200}/>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-widest flex items-center gap-3"><LucideBellRing className="text-blue-600"/> Monitoreo de Casos Activos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {activeUserRequests.length > 0 ? activeUserRequests.map(sr => {
                            const unread = (sr.unreadUserCount || 0);
                            const hasUnread = unread > 0;
                            return (
                            <div key={sr.id} onClick={() => handleOpenAlert(sr)} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full ${hasUnread ? 'ring-4 ring-rose-500 border-rose-200' : 'border-slate-200'}`}>
                               {hasUnread && (
                                 <div className="absolute top-6 right-6 px-4 py-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-xl animate-bounce z-10">
                                   <LucideMessageSquare size={12}/> {unread} MENSAJE NUEVO
                                 </div>
                               )}
                               <div className="flex justify-between items-start mb-6">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase">{sr.code}</span>
                                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${sr.stage === ServiceStage.REQUESTED ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{sr.stage}</span>
                               </div>
                               <h4 className="text-3xl font-black text-slate-800 italic uppercase leading-none mb-2 group-hover:text-blue-600 transition-colors">{sr.vehiclePlate}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 truncate">{sr.category}</p>
                               <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                                  {hasUnread ? (
                                    <div className="flex items-center gap-2 text-rose-600 animate-pulse">
                                       <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg"><LucideAlertTriangle size={14}/></div>
                                       <span className="text-[9px] font-black uppercase tracking-widest">¡ALERTA: MENSAJE RECIBIDO!</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-slate-300">
                                       <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><LucideLock size={14}/></div>
                                       <span className="text-[9px] font-black uppercase">En Revisión Técnica</span>
                                    </div>
                                  )}
                                  <LucideChevronRight className="text-slate-300 group-hover:translate-x-2 transition-all"/>
                               </div>
                            </div>
                         )}) : (
                            <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                               <LucideTarget className="mx-auto text-slate-200 mb-4" size={48}/>
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No posee gestiones en curso</p>
                               <button onClick={() => setActiveModule('NEW_REQ')} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all">Nueva Gestión</button>
                            </div>
                         )}
                      </div>
                   </div>
                 </>
               )}
            </div>
          ) : activeModule === 'NEW_REQ' ? (
            <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-10">
                 <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><LucidePlusCircle size={24}/></div>
                 <div><h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Solicitud de Mantenimiento</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PROTOCOLO DE SINCRONIZACIÓN</p></div>
              </div>

              {currentStep === 'SELECT_VEHICLE' && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3"><LucideCar className="text-blue-600"/> 1. Selección de Unidad</h3>
                    <div className="relative" ref={searchRef}>
                      <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                      <input type="text" placeholder="Ingrese Patente o Modelo..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-300 rounded-2xl text-lg font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-sm" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }} onFocus={() => setIsSearchOpen(true)} />
                      {isSearchOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] max-h-64 overflow-y-auto custom-scrollbar animate-fadeIn">
                            {filteredFleet.map(v => (
                              <button key={v.plate} onClick={() => handleVehicleSelect(v)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left">
                                <div><p className="font-black text-slate-900 text-xl leading-none">{v.plate}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{v.make} {v.model}</p></div>
                                <span className="text-[8px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">{v.status}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                </div>
              )}

              {currentStep === 'CONFIRM_DETAILS' && selectedVehicle && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex items-center justify-between group">
                        <div className="flex gap-8 items-center">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">{selectedVehicle.plate.substring(0,2)}</div>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-slate-900 leading-none uppercase italic">{selectedVehicle.plate} • {selectedVehicle.make}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedVehicle.model} • CC: {selectedVehicle.costCenter}</p>
                            </div>
                        </div>
                        <button onClick={() => setCurrentStep('SELECT_VEHICLE')} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><LucideTrash2 size={24}/></button>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 space-y-8">
                        <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideUser className="text-blue-600"/> Responsable Actual</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={driverData.name} onChange={e => setDriverData({...driverData, name: e.target.value})} /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono Sincronizado</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={driverData.phone} onChange={e => setDriverData({...driverData, phone: e.target.value})} /></div>
                        </div>
                    </div>
                </div>
              )}

              {currentStep === 'SERVICE_SPEC' && selectedVehicle && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-white rounded-[3rem] border border-slate-200 p-10 space-y-10 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoría del Evento</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-50 shadow-sm" value={category} onChange={e => { setCategory(e.target.value); setServiceType(''); }} >
                          <option value="">Seleccione Categoría</option>
                          {Object.keys(serviceOptions).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Servicio</label>
                        <select disabled={!category} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-50 shadow-sm" value={serviceType} onChange={e => setServiceType(e.target.value)} >
                          <option value="">Seleccione Tipo</option>
                          {category && serviceOptions[category].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción Técnica Detallada</label>
                      <textarea rows={5} className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-slate-700 outline-none resize-none shadow-inner transition-all focus:bg-white focus:ring-8 focus:ring-blue-50" placeholder="Describa el requerimiento, ruidos o fallas detectadas..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 pt-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kilometraje Actual Auditado</label>
                        <div className="relative">
                          <LucideGauge className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={24}/>
                          <input type="number" onFocus={(e) => e.target.select()} className="w-full pl-16 pr-6 py-5 bg-blue-50 border border-blue-200 rounded-2xl font-black text-3xl text-blue-700 outline-none shadow-inner" value={odometer || ''} onChange={e => setOdometer(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-10 py-6 flex justify-end gap-4 shadow-2xl z-[200]">
                 <button onClick={() => { setActiveModule('OVERVIEW'); handleReset(); }} className="px-10 py-3 rounded-xl font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest">Cancelar Proceso</button>
                 {currentStep !== 'SELECT_VEHICLE' && (<button onClick={() => setCurrentStep(currentStep === 'SERVICE_SPEC' ? 'CONFIRM_DETAILS' : 'SELECT_VEHICLE')} className="px-10 py-3 rounded-xl border border-slate-300 font-black text-slate-700 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">Paso Anterior</button>)}
                 <button 
                    disabled={isStepDisabled} 
                    onClick={() => currentStep === 'SERVICE_SPEC' ? handleSendRequest() : setCurrentStep(currentStep === 'SELECT_VEHICLE' ? 'CONFIRM_DETAILS' : 'SERVICE_SPEC')} 
                    className={`px-12 py-3 rounded-full font-black text-[10px] transition-all uppercase tracking-widest flex items-center gap-3 ${ isStepDisabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white shadow-2xl hover:bg-blue-600 transform active:scale-95'}`}
                 >
                   {currentStep === 'SERVICE_SPEC' ? <><LucideCheck size={16}/> Sincronizar Envío</> : 'Continuar'}
                 </button>
              </footer>
            </div>
          ) : activeModule === 'REQ_LIST' ? (
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
               <div className="p-8 border-b bg-slate-50 flex items-center justify-between"><h3 className="text-xs font-black text-slate-800 uppercase italic tracking-widest">Histórico de Gestiones Realizadas</h3><span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-black">{userRequests.length} Registros</span></div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-100 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr><th className="px-8 py-4">Evento</th><th className="px-8 py-4">Unidad</th><th className="px-8 py-4">Fecha</th><th className="px-8 py-4 text-center">Estado</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {userRequests.map(req => (
                        <tr key={req.id} onClick={() => handleOpenAlert(req)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                           <td className="px-8 py-6"><span className="text-xs font-black text-slate-800">{req.code}</span></td>
                           <td className="px-8 py-6 text-xs font-black text-slate-600 group-hover:text-blue-600 uppercase italic"><div className="flex items-center gap-2">{req.vehiclePlate}{(req.unreadUserCount || 0) > 0 && <LucideZap size={10} className="text-rose-600 animate-bounce"/>}</div></td>
                           <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{format(parseISO(req.createdAt), 'dd/MM/yyyy')}</td>
                           <td className="px-8 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${req.stage === ServiceStage.FINISHED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{req.stage}</span></td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
             </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};