import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, Clock, AlertCircle, CheckCircle, XCircle,
  Wrench, FileText, Calendar, Download, Filter,
  TrendingUp, Activity, PieChart, BarChart3,
  MessageCircle, Phone, Mail, User as UserIcon, Settings,
  ArrowRight, ArrowLeft, Plus, Edit, Trash2,
  ChevronDown, ChevronUp, Search, RefreshCw,
  MapPin, Send, ShieldCheck, DollarSign,
  Briefcase, Truck, Gauge, History,
  Maximize2, Layout, MoreHorizontal, AlertTriangle,
  CheckCircle2, Lock, Unlock, Zap,
  // FIX: Added missing Info icon to lucide-react imports to resolve "Cannot find name 'Info'" error at line 349.
  Info
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';

// --- CONFIGURACIÓN DE ESTADOS KANBAN ---
const KANBAN_COLUMNS = [
  { id: 'SOLICITADO', label: 'Solicitado', color: 'blue', icon: AlertCircle },
  { id: 'TURNO ASIGNADO', label: 'Turno Asignado', color: 'amber', icon: Calendar },
  { id: 'PRESUPUESTADO', label: 'Presupuestado', color: 'purple', icon: DollarSign },
  { id: 'EN TALLER', label: 'En Taller', color: 'indigo', icon: Wrench },
  { id: 'FINALIZADO', label: 'Finalizado', color: 'emerald', icon: CheckCircle2 },
];

export const MesaDeControlNueva: React.FC = () => {
  const { userData, user: firebaseUser } = useFirebase();
  const navigate = useNavigate();
  
  // Estados de datos
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('TODAS');
  const [filterDate, setFilterDate] = useState('');
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'CHAT' | 'BUDGET' | 'LOGS'>('INFO');
  const [chatMsg, setChatMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. KERNEL DE FILTRADO POR PERFIL (Real-time)
  useEffect(() => {
    if (!userData || !firebaseUser) return;

    setLoading(true);
    const reqRef = collection(db, 'requests');
    let q;

    const userCC = (userData.costCenter || userData.centroCosto?.nombre || '').toUpperCase();

    if (userData.role === 'ADMIN') {
      q = query(reqRef, orderBy('createdAt', 'desc'));
    } else if (userData.role === 'SUPERVISOR') {
      q = query(reqRef, where('costCenter', '==', userCC));
    } else if (userData.role === 'PROVEEDOR') {
      q = query(reqRef, where('providerId', '==', firebaseUser.uid));
    } else if (userData.role === 'AUDITOR') {
      q = query(reqRef, where('stage', '==', 'PRESUPUESTADO'), where('auditStatus', '==', 'pending'));
    } else {
      q = query(reqRef, where('userId', '==', firebaseUser.uid));
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(docs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [userData, firebaseUser]);

  // 2. FILTRADO DE UI (Búsqueda, Prioridad, Fecha)
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = !searchTerm || 
        r.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchPriority = filterPriority === 'TODAS' || r.priority === filterPriority;
      
      let matchDate = true;
      if (filterDate) {
        const reqDate = parseISO(r.createdAt);
        matchDate = isWithinInterval(reqDate, {
          start: startOfDay(new Date(filterDate)),
          end: endOfDay(new Date(filterDate))
        });
      }

      return matchSearch && matchPriority && matchDate;
    });
  }, [requests, searchTerm, filterPriority, filterDate]);

  // 3. LÓGICA DE DRAG & DROP
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (userData.role !== 'ADMIN' && userData.role !== 'SUPERVISOR') return;
    e.dataTransfer.setData('requestId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    const id = e.dataTransfer.getData('requestId');
    const req = requests.find(r => r.id === id);
    if (!req || req.stage === newStage) return;

    const ref = doc(db, 'requests', id);
    const log = {
      estado: newStage,
      fecha: new Date().toISOString(),
      usuario: userData?.nombre || 'SISTEMA',
      comentario: `Movido vía Kanban a ${newStage}`
    };

    await updateDoc(ref, {
      stage: newStage,
      updatedAt: new Date().toISOString(),
      history: [...(req.history || []), log]
    });
    addNotification?.(`Unidad ${req.vehiclePlate} movida a ${newStage}`, 'success');
  };

  // 4. GESTIÓN DE ACCIONES (Firestore)
  const updateRequest = async (updates: any, comment: string) => {
    if (!selectedReq) return;
    const ref = doc(db, 'requests', selectedReq.id);
    const log = {
      estado: updates.stage || selectedReq.stage,
      fecha: new Date().toISOString(),
      usuario: userData?.nombre || 'SISTEMA',
      comentario: comment
    };
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
      history: [...(selectedReq.history || []), log]
    });
    // El onSnapshot actualizará el estado local automáticamente
  };

  const sendChatMessage = async () => {
    if (!chatMsg.trim() || !selectedReq) return;
    const ref = doc(db, 'requests', selectedReq.id);
    const msg = {
      id: Date.now().toString(),
      userId: firebaseUser?.uid,
      userName: userData?.nombre,
      text: chatMsg,
      timestamp: new Date().toISOString(),
      role: userData?.role
    };
    await updateDoc(ref, {
      messages: [...(selectedReq.messages || []), msg]
    });
    setChatMsg('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addNotification = (m: string, t: any) => {
    // Implementación interna rápida si el contexto falla
    console.log(`[NOTIF] ${t}: ${m}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <RefreshCw className="animate-spin text-blue-600" size={48}/>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Sincronizando Mesa de Control...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER PROFESIONAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Layout className="text-blue-600" size={20}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Management Advanced v3.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mesa de Control Nueva</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Filtros */}
          <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input 
                type="text" 
                placeholder="PATENTE / CÓDIGO..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-100 w-40"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="TODAS">TODAS LAS PRIORIDADES</option>
              <option value="URGENTE">URGENTE</option>
              <option value="ALTA">ALTA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="BAJA">BAJA</option>
            </select>
            <input 
              type="date" 
              className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            {(searchTerm || filterPriority !== 'TODAS' || filterDate) && (
              <button 
                onClick={() => { setSearchTerm(''); setFilterPriority('TODAS'); setFilterDate(''); }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <XCircle size={16}/>
              </button>
            )}
          </div>
          <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95">
            <RefreshCw size={20}/>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex gap-6 overflow-x-auto pb-12 custom-scrollbar min-h-[70vh]">
        {KANBAN_COLUMNS.map(col => {
          const colItems = filteredRequests.filter(r => r.stage === col.id);
          const Icon = col.icon;
          
          return (
            <div 
              key={col.id} 
              className="min-w-[320px] w-[320px] flex flex-col gap-5"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center px-5 bg-white py-4 rounded-[1.8rem] shadow-sm border border-slate-100 border-l-8 transition-all" style={{ borderLeftColor: `var(--tw-color-${col.color}-500)` }}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${col.color}-50 text-${col.color}-600`}>
                    <Icon size={16}/>
                  </div>
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 italic">{col.label}</h3>
                </div>
                <span className="bg-slate-900 text-white px-3 py-0.5 rounded-full text-[10px] font-black">{colItems.length}</span>
              </div>

              <div className="flex-1 space-y-4 p-2">
                {colItems.map(item => (
                  <div 
                    key={item.id}
                    draggable={userData.role === 'ADMIN' || userData.role === 'SUPERVISOR'}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={() => { setSelectedReq(item); setActiveTab('INFO'); }}
                    className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
                  >
                    {/* Indicador de Prioridad Lateral */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      item.priority === 'URGENTE' ? 'bg-rose-500' :
                      item.priority === 'ALTA' ? 'bg-amber-500' :
                      item.priority === 'MEDIA' ? 'bg-blue-500' : 'bg-slate-300'
                    }`}></div>

                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase">{item.code}</span>
                      <div className="flex gap-2">
                        {item.messages?.length > 0 && (
                          <div className="flex items-center gap-1 text-slate-300 group-hover:text-blue-500 transition-colors">
                            <MessageCircle size={10}/>
                            <span className="text-[8px] font-black">{item.messages.length}</span>
                          </div>
                        )}
                        <MoreHorizontal size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors"/>
                      </div>
                    </div>

                    <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-none mb-1 group-hover:text-blue-600 transition-colors">{item.vehiclePlate}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-4 italic">{item.specificType || item.mainCategory}</p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 border border-slate-200 uppercase">
                          {item.userName?.charAt(0)}
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[100px]">{item.userName?.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock size={10}/>
                        <span className="text-[8px] font-black uppercase">{format(parseISO(item.createdAt), 'dd MMM', { locale: es })}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="h-32 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center opacity-10">
                    <Zap size={32}/>
                    <p className="text-[8px] font-black uppercase mt-2">Sin actividad</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DETALLE EXPERIMENTAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col md:flex-row h-[90vh]">
            
            {/* PANEL IZQUIERDO: CONTENIDO DINÁMICO */}
            <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
              {/* Header Modal */}
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl"><Car size={32}/></div>
                  <div>
                    <span className="text-blue-400 font-black text-[10px] tracking-widest uppercase mb-1 block">{selectedReq.code}</span>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{selectedReq.vehiclePlate}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase italic text-white/60">
                    SLA: {format(parseISO(selectedReq.createdAt), 'dd/MM HH:mm')} HS
                  </div>
                  <button onClick={() => setSelectedReq(null)} className="p-3 bg-white/5 hover:bg-rose-600 rounded-2xl transition-all shadow-xl"><XCircle size={24}/></button>
                </div>
              </div>

              {/* Tabs de Navegación Modal */}
              <div className="flex gap-8 border-b border-slate-100 px-10 pt-4 shrink-0 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'INFO', label: 'Relevamiento', icon: Info },
                  { id: 'BUDGET', label: 'Cotización', icon: DollarSign },
                  { id: 'CHAT', label: 'Mesa de Diálogo', icon: MessageCircle },
                  { id: 'LOGS', label: 'Trazabilidad', icon: History },
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400'}`}
                  >
                    <tab.icon size={14}/> {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido de Tab */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                {activeTab === 'INFO' && (
                  <div className="space-y-10 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><UserIcon size={12}/> Datos del Solicitante</h4>
                        <div className="space-y-4">
                          <div><p className="text-[8px] font-black text-slate-500 uppercase">Nombre Completo</p><p className="text-sm font-black text-slate-800 uppercase italic">{selectedReq.userName}</p></div>
                          <div><p className="text-[8px] font-black text-slate-500 uppercase">Email Corporativo</p><p className="text-xs font-bold text-slate-500">{selectedReq.userEmail}</p></div>
                          <div className="flex gap-4">
                            <div><p className="text-[8px] font-black text-slate-500 uppercase">C. Costo</p><span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black">{selectedReq.costCenter}</span></div>
                            <div><p className="text-[8px] font-black text-slate-500 uppercase">Prioridad</p><span className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[9px] font-black">{selectedReq.priority}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><Activity size={12}/> Contexto Técnico</h4>
                        <div className="space-y-4">
                          <div><p className="text-[8px] font-black text-slate-500 uppercase">Categoría Principal</p><p className="text-sm font-black text-slate-800 uppercase italic">{selectedReq.mainCategory}</p></div>
                          <div><p className="text-[8px] font-black text-slate-500 uppercase">Odómetro Reportado</p><p className="text-xl font-black text-slate-800 italic">{selectedReq.odometerAtRequest?.toLocaleString()} KM</p></div>
                          <div><p className="text-[8px] font-black text-slate-500 uppercase">Ubicación de Referencia</p><p className="text-xs font-bold text-slate-500 uppercase truncate flex items-center gap-2"><MapPin size={12}/> {selectedReq.location || 'SIN ESPECIFICAR'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10 space-y-4">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">Informe de Necesidad</p>
                        <p className="text-xl font-medium leading-relaxed italic opacity-90">"{selectedReq.description}"</p>
                      </div>
                      <FileText className="absolute -right-8 -bottom-8 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" size={180}/>
                    </div>

                    {/* FOTOS ADJUNTAS */}
                    {selectedReq.attachments?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Maximize2 size={12}/> Evidencia Fotográfica</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedReq.attachments.map((at: any, i: number) => (
                            <div key={i} className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"><img src={at.url} className="w-full h-full object-cover" /></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'BUDGET' && (
                  <div className="space-y-8 animate-fadeIn">
                    {selectedReq.budget ? (
                      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
                        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                          <h4 className="font-black text-slate-800 uppercase italic text-lg flex items-center gap-3"><DollarSign size={20} className="text-emerald-600"/> Cotización del Proveedor</h4>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                            selectedReq.auditStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            selectedReq.auditStatus === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{selectedReq.auditStatus || 'PENDIENTE AUDITORÍA'}</span>
                        </div>
                        <div className="p-10">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-4"><th className="pb-4">Descripción</th><th className="pb-4 text-center">Cant</th><th className="pb-4 text-right">Total</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {selectedReq.budget.items?.map((it: any, i: number) => (
                                <tr key={i} className="text-[10px] font-bold text-slate-600"><td className="py-4 uppercase">{it.descripcion}</td><td className="py-4 text-center">{it.cantidad}</td><td className="py-4 text-right">${it.total.toLocaleString()}</td></tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-900 text-white"><td colSpan={2} className="p-6 font-black uppercase text-xs italic">Inversión Final Cotizada</td><td className="p-6 text-right font-black text-2xl text-emerald-400 italic">${selectedReq.budget.total.toLocaleString()}</td></tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="py-32 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
                        <AlertTriangle size={64} className="mx-auto text-slate-200 mb-6"/>
                        <h4 className="text-xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Presupuesto Cargado</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Esperando cotización del taller asignado</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'LOGS' && (
                  <div className="space-y-6 animate-fadeIn">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><History size={14}/> Log de Cambios y Auditoría Técnica</h4>
                    <div className="space-y-4">
                      {selectedReq.history?.map((h: any, i: number) => (
                        <div key={i} className="flex gap-6 group">
                          <div className="w-1.5 bg-slate-200 group-hover:bg-blue-500 transition-colors rounded-full shrink-0"></div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest italic">{h.estado}</span>
                              <span className="text-[9px] font-bold text-slate-400">{format(parseISO(h.fecha), 'dd MMM yyyy, HH:mm')} HS</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 italic">"{h.comentario}"</p>
                            <p className="text-[8px] font-black text-blue-600 uppercase mt-4">Responsable: {h.usuario}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'CHAT' && (
                  <div className="bg-slate-50 rounded-[3rem] border border-slate-200 flex flex-col h-[500px] overflow-hidden animate-fadeIn">
                    <div className="p-6 border-b bg-white flex justify-between items-center">
                      <div className="flex items-center gap-3"><MessageCircle size={20} className="text-blue-600"/><h5 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Canal de Diálogo Directo</h5></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#fcfdfe]">
                      {selectedReq.messages?.map((m: any) => (
                        <div key={m.id} className={`flex ${m.userId === firebaseUser?.uid ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                          <div className={`max-w-[85%] p-4 rounded-[2rem] shadow-sm border ${
                            m.userId === firebaseUser?.uid ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                          }`}>
                            <p className="text-[7px] font-black uppercase opacity-60 mb-2">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')}</p>
                            <p className="text-[11px] font-medium leading-relaxed italic">"{m.text}"</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef}></div>
                    </div>
                    <div className="p-6 bg-white border-t">
                      <div className="relative">
                        <textarea 
                          rows={2} 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-8 focus:ring-blue-50 shadow-inner resize-none" 
                          placeholder="Escribir mensaje..."
                          value={chatMsg}
                          onChange={e => setChatMsg(e.target.value)}
                        />
                        <button 
                          onClick={sendChatMessage}
                          className="absolute right-3 bottom-3 p-3 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 transition-all active:scale-90"
                        >
                          <Send size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DERECHO: ACCIONES SEGÚN PERFIL */}
            <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-100 p-10 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase italic tracking-[0.2em] border-b pb-2 flex items-center gap-3"><Settings size={16}/> Motor de Gestión</h4>
                  
                  {/* Acciones para ADMIN / SUPERVISOR */}
                  {(userData.role === 'ADMIN' || userData.role === 'SUPERVISOR') && (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedReq.stage === 'SOLICITADO' && (
                        <button 
                          onClick={() => updateRequest({ stage: 'TURNO ASIGNADO', providerId: 'demo-prov', providerName: 'TALLER CENTRAL' }, 'Turno técnico asignado por supervisión')}
                          className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-3"
                        >
                          <Calendar size={18}/> Asignar Turno y Taller
                        </button>
                      )}
                      {selectedReq.stage === 'EN TALLER' && (
                        <button 
                          onClick={() => updateRequest({ stage: 'FINALIZADO' }, 'Cierre administrativo del servicio')}
                          className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                        >
                          <CheckCircle2 size={18}/> Finalizar Gestión
                        </button>
                      )}
                      <button 
                         onClick={() => updateRequest({ stage: 'CANCELADO' }, 'Cancelado por administrador')}
                         className="w-full py-4 text-rose-600 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16}/> Cancelar Ticket
                      </button>
                    </div>
                  )}

                  {/* Acciones para PROVEEDOR */}
                  {userData.role === 'PROVEEDOR' && selectedReq.stage === 'TURNO ASIGNADO' && (
                    <button 
                      onClick={() => updateRequest({ stage: 'PRESUPUESTADO', budget: { total: 45000, items: [{ descripcion: 'SERVICE 10K', cantidad: 1, total: 45000 }] }, auditStatus: 'pending' }, 'Presupuesto cargado por taller')}
                      className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-3"
                    >
                      <DollarSign size={18}/> Cargar Cotización Técnica
                    </button>
                  )}

                  {/* Acciones para AUDITOR */}
                  {userData.role === 'AUDITOR' && selectedReq.stage === 'PRESUPUESTADO' && (
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => updateRequest({ stage: 'EN TALLER', auditStatus: 'approved' }, 'Gasto autorizado por auditoría')}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                      >
                        <ShieldCheck size={18}/> Autorizar Inversión
                      </button>
                      <button 
                        onClick={() => updateRequest({ stage: 'TURNO ASIGNADO', auditStatus: 'rejected' }, 'Presupuesto rechazado por auditoría')}
                        className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                      >
                        <XCircle size={18}/> Rechazar Gasto
                      </button>
                    </div>
                  )}
                </div>

                {/* Info de Taller si aplica */}
                {selectedReq.providerName && (
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-inner space-y-4">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck size={12}/> Establecimiento Asignado</p>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase italic">{selectedReq.providerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SLA Estimado: 48hs</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-10 border-t border-slate-100 flex flex-col gap-4">
                <button onClick={() => setSelectedReq(null)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Regresar a Mesa</button>
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Sesión Cloud Certificada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
