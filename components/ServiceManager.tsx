
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { 
    ServiceRequest, ServiceStage, ServiceCategory, ServiceSubCategory, 
    Budget, InvoiceData, UserRole, VehicleStatus, ChatMessage, Vehicle, ServiceHistory 
} from '../types';
import { analyzeBudgetImage, analyzeInvoiceImage } from '../services/geminiService';
import { 
    LucidePlus, LucideSearch, LucideFileText, LucideFilter, LucideWrench, 
    LucideCalendar, LucideCheckCircle, LucideAlertCircle, LucideArrowRight, 
    LucideClock, LucideMessageSquare, LucideDollarSign, LucideUpload, 
    LucideCamera, LucideImage, LucideLoader, LucideX, LucideSave, 
    LucideTrash2, LucideChevronDown, LucideChevronUp, LucidePaperclip,
    LucideUser, LucideFileCheck, LucideExternalLink, LucideMoreVertical, 
    LucideArrowLeft, LucideSend, LucideFileSpreadsheet, LucideBriefcase,
    LucideZoomIn, LucideDownload, LucideMousePointer2, LucideEye, LucidePhone, LucideCarFront,
    LucideCheckCheck, LucidePlay, LucideHistory, LucideLock, LucideMapPin, LucideCalendarClock, LucideRefreshCw,
    LucideCalculator, LucideRotateCcw, LucideBan, LucideTimer, LucideLogOut, LucideCalendarCheck
} from 'lucide-react';

// --- STAGE COLORS HELPER ---
const getStageColor = (stage: ServiceStage) => {
    switch(stage) {
        case ServiceStage.REQUESTED: return 'bg-purple-100 text-purple-700 border-purple-200';
        case ServiceStage.EVALUATION: return 'bg-blue-100 text-blue-700 border-blue-200';
        case ServiceStage.BUDGETING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case ServiceStage.APPROVAL: return 'bg-orange-100 text-orange-800 border-orange-200';
        case ServiceStage.SCHEDULED: return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        case ServiceStage.IN_WORKSHOP: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case ServiceStage.DELIVERY: return 'bg-green-100 text-green-700 border-green-200';
        case ServiceStage.CANCELLED: return 'bg-slate-100 text-slate-500 border-slate-200';
        default: return 'bg-slate-100 text-slate-700';
    }
};

// --- APPOINTMENT MODAL (ADMIN) ---
const AppointmentModal = ({ 
    initialData, 
    isOpen, 
    onClose, 
    onSave 
}: { 
    initialData?: any, 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (data: { date: string, time: string, provider: string, address: string }) => void 
}) => {
    const [form, setForm] = useState({ date: '', time: '', provider: '', address: '' });

    useEffect(() => {
        if (isOpen && initialData) {
            setForm({
                date: initialData.date || '',
                time: initialData.time || '',
                provider: initialData.provider || '',
                address: initialData.address || ''
            });
        } else if (isOpen) {
            setForm({ date: '', time: '', provider: '', address: '' });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><LucideCalendarClock /> Asignar Turno de Taller</h3>
                    <button onClick={onClose}><LucideX className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Taller / Proveedor</label>
                        <div className="relative">
                            <LucideWrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input 
                                type="text" 
                                className="w-full pl-9 p-2 border rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Taller Oficial Toyota"
                                value={form.provider}
                                onChange={e => setForm({...form, provider: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección / Ubicación</label>
                        <div className="relative">
                            <LucideMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input 
                                type="text" 
                                className="w-full pl-9 p-2 border rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Av. Libertador 1234"
                                value={form.address}
                                onChange={e => setForm({...form, address: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded"
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                            <input 
                                type="time" 
                                className="w-full p-2 border rounded"
                                value={form.time}
                                onChange={e => setForm({...form, time: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSave(form)}
                        disabled={!form.date || !form.provider}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        Confirmar y Enviar Turno
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- BUDGET DETAIL MODAL ---
const BudgetDetailModal = ({ budget, onClose }: { budget: Budget, onClose: () => void }) => {
    const [scale, setScale] = useState(1);
    
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY * -0.001;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 4));
    };

    const handleDownload = () => {
        if (!budget.file) return;
        const link = document.createElement('a');
        link.href = budget.file;
        const ext = budget.file.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
        link.download = `Presupuesto_${budget.provider.replace(/\s+/g, '_')}_${budget.budgetNumber || 'SN'}.${ext}`;
        link.click();
    };

    const isPdf = budget.file?.startsWith('data:application/pdf');

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* LEFT: IMAGE VIEWER */}
                <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col group">
                    <div 
                        className="flex-1 flex items-center justify-center overflow-hidden cursor-move relative"
                        onWheel={handleWheel}
                    >
                        {budget.file ? (
                            isPdf ? (
                                <iframe src={budget.file} className="w-full h-full bg-white" title="PDF Viewer"></iframe>
                            ) : (
                                <img 
                                    src={budget.file} 
                                    className="transition-transform duration-100 ease-out origin-center max-w-full max-h-full object-contain"
                                    style={{ transform: `scale(${scale})` }}
                                    alt="Presupuesto"
                                    draggable={false}
                                />
                            )
                        ) : (
                            <div className="text-white text-center flex flex-col items-center gap-2">
                                <LucideFileText size={48} className="text-slate-600"/>
                                <span>No hay imagen disponible</span>
                            </div>
                        )}
                        
                        {!isPdf && budget.file && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 pointer-events-none backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <LucideMousePointer2 size={12}/> Usar rueda para Zoom ({Math.round(scale * 100)}%)
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: DATA SIDEBAR */}
                <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><LucideFileText size={18}/> Detalle Presupuesto</h3>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <LucideX size={24}/>
                        </button>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Status Banner */}
                        <div className={`p-3 rounded-lg border text-center font-bold uppercase text-sm ${budget.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : budget.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                            {budget.status === 'APPROVED' ? 'Aprobado' : budget.status === 'REJECTED' ? 'Rechazado / Recotizar' : 'Pendiente Revisión'}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Proveedor Detectado</label>
                            <p className="font-bold text-slate-800 text-lg leading-tight">{budget.provider}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Costo Total Estimado</label>
                                <p className="font-mono font-bold text-2xl text-blue-600">
                                    ${budget.totalCost.toLocaleString()}
                                </p>
                            </div>
                            
                            {budget.budgetNumber && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nro Presupuesto</label>
                                    <p className="text-sm font-mono text-slate-700 select-all bg-white border px-2 py-1 rounded w-fit">{budget.budgetNumber}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Detalles / Items</label>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{budget.details}</p>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400 text-center pt-2">
                            Cargado el: {new Date(budget.date).toLocaleDateString()}
                            {budget.approvedBy && <div className="mt-1 text-green-600 font-bold">Aprobado por: {budget.approvedBy}</div>}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100">
                         <button 
                            onClick={handleDownload}
                            className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition"
                         >
                            <LucideDownload size={18}/>
                            Descargar Imagen
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ServiceManager = () => {
    const { serviceRequests, addServiceRequest, updateServiceRequest, deleteServiceRequest, vehicles, updateVehicle, user } = useApp();
    
    // VIEW STATE: LIST, FORM, DETAIL
    const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    // FORM STATE
    const [formData, setFormData] = useState<Partial<ServiceRequest>>({});
    
    // AUTOCOMPLETE STATE FOR VEHICLE SELECTION
    const [plateSearch, setPlateSearch] = useState('');
    const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
    
    // --- DETAIL VIEW STATES ---
    const [newMessage, setNewMessage] = useState('');
    const [isUploadingBudget, setIsUploadingBudget] = useState(false);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [finalizationNote, setFinalizationNote] = useState('');
    
    // --- WORKSHOP EXIT STATES ---
    const [isExitMode, setIsExitMode] = useState(false);
    const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);

    // --- APPOINTMENT STATES ---
    const [isScheduling, setIsScheduling] = useState(false);
    const [isProposingChange, setIsProposingChange] = useState(false);
    const [proposalForm, setProposalForm] = useState({ date: '', time: '', note: '' });

    // INVOICE UPLOAD STATES (For Detail View)
    const [invoiceFile, setInvoiceFile] = useState<string | null>(null);
    const [invoiceData, setInvoiceData] = useState<Partial<InvoiceData>>({});
    const [isAnalyzingInvoice, setIsAnalyzingInvoice] = useState(false);

    // --- PERMISSIONS ---
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
    const isManager = isAdmin || user?.role === UserRole.MANAGER;

    // --- HELPERS ---
    const handleCreateNew = () => {
        setFormData({
            category: ServiceCategory.MAINTENANCE,
            subCategory: ServiceSubCategory.PREVENTIVE,
            preferredDates: [],
            requesterPhone: user?.phone || '' 
        });
        setPlateSearch('');
        setView('FORM');
    };

    const handleSaveRequest = () => {
        if (!formData.vehiclePlate || !formData.description || !formData.category) {
            alert("Complete los campos obligatorios.");
            return;
        }
        if (!formData.requesterPhone) {
            alert("El teléfono de contacto es obligatorio.");
            return;
        }

        const newRequest: ServiceRequest = {
            id: selectedRequest ? selectedRequest.id : `REQ-${Date.now()}`,
            vehiclePlate: formData.vehiclePlate,
            userId: user?.id || 'unknown',
            requesterName: user?.name || 'Usuario',
            requesterEmail: user?.email || '',
            requesterPhone: formData.requesterPhone || '',
            category: formData.category as ServiceCategory,
            subCategory: formData.subCategory || '',
            description: formData.description,
            currentKm: formData.currentKm || 0,
            locationCity: formData.locationCity || '',
            suggestedProvider: formData.suggestedProvider || '',
            preferredDates: formData.preferredDates || [],
            stage: ServiceStage.REQUESTED,
            createdAt: selectedRequest ? selectedRequest.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            budgets: selectedRequest ? selectedRequest.budgets : [],
            logs: selectedRequest ? selectedRequest.logs : [{
                stage: ServiceStage.REQUESTED,
                date: new Date().toISOString(),
                user: user?.name || 'System',
                note: 'Solicitud creada'
            }],
            syncStatus: 'PENDING'
        };

        if (selectedRequest) {
            updateServiceRequest(newRequest);
        } else {
            addServiceRequest(newRequest);
        }
        setView('LIST');
        setFormData({});
    };

    const handleStageChange = (req: ServiceRequest, newStage: ServiceStage, note?: string) => {
        const updated: ServiceRequest = {
            ...req,
            stage: newStage,
            updatedAt: new Date().toISOString(),
            logs: [...req.logs, {
                stage: newStage,
                date: new Date().toISOString(),
                user: user?.name || 'System',
                note: note || `Cambio de estado a ${newStage}`
            }]
        };

        // Capture Entry Date if moving to IN_WORKSHOP
        if (newStage === ServiceStage.IN_WORKSHOP) {
            updated.workshopEntry = {
                date: new Date().toISOString(),
                confirmedBy: user?.name || 'System'
            };
        }

        updateServiceRequest(updated);
        setSelectedRequest(updated);
    };

    // --- APPOINTMENT LOGIC ---
    const handleOpenSchedule = () => {
        setIsScheduling(true);
    };

    const handleSaveAppointment = (apptData: { date: string, time: string, provider: string, address: string }) => {
        if (!selectedRequest) return;
        
        const updated: ServiceRequest = {
            ...selectedRequest,
            stage: ServiceStage.SCHEDULED,
            updatedAt: new Date().toISOString(),
            appointment: {
                ...apptData,
                status: 'CONFIRMED',
                userProposal: undefined // Clear any proposal as admin overrode it or new
            },
            logs: [...selectedRequest.logs, {
                stage: ServiceStage.SCHEDULED,
                date: new Date().toISOString(),
                user: user?.name || 'System',
                note: `Turno asignado en ${apptData.provider} para ${apptData.date}`
            }]
        };
        updateServiceRequest(updated);
        setSelectedRequest(updated);
        setIsScheduling(false);
    };

    const handleUserRequestChange = () => {
        if (!selectedRequest || !proposalForm.date) return;
        
        const updated: ServiceRequest = {
            ...selectedRequest,
            updatedAt: new Date().toISOString(),
            appointment: {
                ...(selectedRequest.appointment!),
                status: 'CHANGE_REQUESTED',
                userProposal: {
                    date: proposalForm.date,
                    time: proposalForm.time || '',
                    note: proposalForm.note
                }
            },
            logs: [...selectedRequest.logs, {
                stage: ServiceStage.SCHEDULED,
                date: new Date().toISOString(),
                user: user?.name || 'System',
                note: `Usuario solicitó cambio de turno`
            }]
        };
        updateServiceRequest(updated);
        setSelectedRequest(updated);
        setIsProposingChange(false);
    };

    const handleAcceptProposal = () => {
        if (!selectedRequest || !selectedRequest.appointment?.userProposal) return;
        
        const proposal = selectedRequest.appointment.userProposal;
        
        const updated: ServiceRequest = {
            ...selectedRequest,
            updatedAt: new Date().toISOString(),
            appointment: {
                ...(selectedRequest.appointment),
                date: proposal.date,
                time: proposal.time,
                status: 'CONFIRMED',
                userProposal: undefined
            },
            logs: [...selectedRequest.logs, {
                stage: ServiceStage.SCHEDULED,
                date: new Date().toISOString(),
                user: user?.name || 'System',
                note: `Admin aceptó cambio de turno a ${proposal.date}`
            }]
        };
        updateServiceRequest(updated);
        setSelectedRequest(updated);
    };

    // --- DELETE / CANCEL LOGIC (HARD DELETE) ---
    const handleDeleteRequest = () => {
        if (!selectedRequest) return;
        const msg = isAdmin 
            ? "¿Está seguro de eliminar esta solicitud definitivamente? Desaparecerá de todos los registros."
            : "¿Está seguro de cancelar su solicitud? Se eliminará del sistema.";

        if (window.confirm(msg)) {
            deleteServiceRequest(selectedRequest.id);
            setView('LIST');
            setSelectedRequest(null);
        }
    };

    // --- DIRECT FINISH LOGIC (Admin) ---
    const handleDirectFinish = () => {
        if (!selectedRequest) return;
        if (!finalizationNote.trim()) {
            alert("Por favor agregue una observación final.");
            return;
        }

        const finishLog = {
            stage: ServiceStage.DELIVERY,
            date: new Date().toISOString(),
            user: user?.name || 'System',
            note: `Finalizado Directamente: ${finalizationNote}`
        };

        const updatedRequest: ServiceRequest = {
            ...selectedRequest,
            stage: ServiceStage.DELIVERY,
            updatedAt: new Date().toISOString(),
            logs: [...selectedRequest.logs, finishLog],
            delivery: {
                date: new Date().toISOString(),
                invoices: [],
                finalCost: 0,
                observations: finalizationNote,
                userSatisfaction: 'OK'
            }
        };

        // Add to Vehicle History
        const vehicle = vehicles.find(v => v.plate === selectedRequest.vehiclePlate);
        if (vehicle) {
            const historyEntry: ServiceHistory = {
                id: `HIST-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'SERVICE',
                description: `Solicitud Finalizada: ${selectedRequest.description} - Obs: ${finalizationNote}`,
                cost: 0,
                attachments: []
            };
            const updatedVehicle = {
                ...vehicle,
                history: [...(vehicle.history || []), historyEntry],
                status: VehicleStatus.ACTIVE
            };
            updateVehicle(updatedVehicle);
        }

        updateServiceRequest(updatedRequest);
        setView('LIST');
        setIsFinalizing(false);
        setFinalizationNote('');
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedRequest) return;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            sender: isAdmin ? 'ADMIN' : 'USER',
            senderName: user?.name || 'Usuario',
            text: newMessage,
            timestamp: new Date().toISOString()
        };
        
        let updated = {
            ...selectedRequest,
            messages: [...(selectedRequest.messages || []), msg]
        };

        updateServiceRequest(updated);
        setSelectedRequest(updated);
        setNewMessage('');
    };

    // --- BUDGET LOGIC ---
    const handleBudgetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedRequest || !e.target.files?.[0]) return;
        setIsUploadingBudget(true);
        const file = e.target.files[0];
        const mimeType = file.type; 
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            // Gemini Analysis
            const analysis = await analyzeBudgetImage(base64.split(',')[1], mimeType);
            
            const newBudget: Budget = {
                id: Date.now().toString(),
                type: selectedRequest.budgets.length === 0 ? 'ORIGINAL' : 'ADDITIONAL',
                file: base64,
                provider: analysis?.provider || 'Proveedor Desconocido',
                totalCost: analysis?.totalCost || 0,
                budgetNumber: analysis?.budgetNumber || '',
                details: analysis?.details || 'Presupuesto adjunto',
                date: new Date().toISOString(),
                status: 'PENDING'
            };

            const updated = {
                ...selectedRequest,
                budgets: [...selectedRequest.budgets, newBudget],
                stage: ServiceStage.BUDGETING, 
                updatedAt: new Date().toISOString()
            };
            
            updateServiceRequest(updated);
            setSelectedRequest(updated);
            setIsUploadingBudget(false);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleDeleteBudget = (budgetId: string) => {
        if (!selectedRequest) return;
        if (!window.confirm("¿Está seguro de eliminar este presupuesto?")) return;

        const updatedBudgets = selectedRequest.budgets.filter(b => b.id !== budgetId);
        
        const updated = {
            ...selectedRequest,
            budgets: updatedBudgets,
            updatedAt: new Date().toISOString()
        };
        
        updateServiceRequest(updated);
        setSelectedRequest(updated);
    };

    const handleBudgetAction = (budgetId: string, action: 'APPROVED' | 'REJECTED' | 'REQUOTE') => {
        if (!selectedRequest) return;
        
        // If Requote, treat as REJECTED in data but allow logic difference if needed later
        const finalStatus: 'APPROVED' | 'REJECTED' = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
        const logNote = action === 'APPROVED' ? 'Presupuesto Aprobado' 
                      : action === 'REQUOTE' ? 'Solicitud de Recotización' 
                      : 'Presupuesto Rechazado';
        
        const newStage = action === 'APPROVED' ? ServiceStage.APPROVAL : selectedRequest.stage;

        const updatedBudgets = selectedRequest.budgets.map(b => 
            b.id === budgetId ? { ...b, status: finalStatus, approvedBy: action === 'APPROVED' ? user?.name : undefined } : b
        );
        
        const updated: ServiceRequest = {
            ...selectedRequest,
            budgets: updatedBudgets,
            stage: newStage,
            updatedAt: new Date().toISOString(),
            logs: [...selectedRequest.logs, {
                 stage: newStage,
                 date: new Date().toISOString(),
                 user: user?.name || 'System',
                 note: logNote
            }]
        };

        updateServiceRequest(updated);
        setSelectedRequest(updated);
    };

    // --- INVOICE LOGIC ---
    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsAnalyzingInvoice(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setInvoiceFile(base64);
            const analysis = await analyzeInvoiceImage(base64.split(',')[1]);
            setInvoiceData({
                invoiceNumber: analysis?.invoiceNumber || '',
                amount: analysis?.amount || 0
            });
            setIsAnalyzingInvoice(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveInvoice = () => {
        if (!selectedRequest || !invoiceFile) return;
        if (!invoiceData.invoiceNumber || !invoiceData.amount) {
            alert("Por favor complete el número y monto de la factura.");
            return;
        }
        const newInvoice: InvoiceData = {
            file: invoiceFile,
            invoiceNumber: invoiceData.invoiceNumber,
            amount: invoiceData.amount
        };
        const currentInvoices = selectedRequest.delivery?.invoices || [];
        const updated = {
            ...selectedRequest,
            delivery: {
                ...selectedRequest.delivery,
                date: selectedRequest.delivery?.date || new Date().toISOString(), // Temporary date until final exit
                invoices: [...currentInvoices, newInvoice],
                finalCost: (selectedRequest.delivery?.finalCost || 0) + newInvoice.amount
            }
        };
        updateServiceRequest(updated);
        setSelectedRequest(updated);
        setInvoiceFile(null);
        setInvoiceData({});
    };

    const handleConfirmExit = () => {
        if (!selectedRequest) return;
        
        // Removed Blocking Invoice Validation
        const totalInvoiced = selectedRequest.delivery?.finalCost || 0;

        if (confirm(`¿Confirmar el egreso del taller con fecha ${exitDate}?\n\nLa unidad pasará a estado FINALIZADO/ENTREGADO y se actualizará su estado operativo a ACTIVO.`)) {
            // Update Vehicle Status
            const vehicle = vehicles.find(v => v.plate === selectedRequest.vehiclePlate);
            if(vehicle) {
                // Add to history
                const daysInWorkshop = calculateDaysInWorkshop(selectedRequest.workshopEntry?.date, exitDate);
                const historyEntry: ServiceHistory = {
                    id: `HIST-${Date.now()}`,
                    date: exitDate,
                    type: 'SERVICE',
                    description: `Servicio Finalizado. Estadia en taller: ${daysInWorkshop} días. Detalle: ${selectedRequest.description}`,
                    cost: totalInvoiced,
                    attachments: selectedRequest.delivery?.invoices.map(i => i.file) || []
                };

                updateVehicle({
                    ...vehicle, 
                    status: VehicleStatus.ACTIVE,
                    history: [...(vehicle.history || []), historyEntry]
                });
            }

            // Update Request
            const updatedRequest: ServiceRequest = {
                ...selectedRequest,
                stage: ServiceStage.DELIVERY,
                updatedAt: new Date().toISOString(),
                delivery: {
                    ...selectedRequest.delivery!,
                    date: exitDate
                },
                logs: [...selectedRequest.logs, {
                    stage: ServiceStage.DELIVERY,
                    date: new Date().toISOString(),
                    user: user?.name || 'System',
                    note: `Egreso de Taller confirmado. Fecha: ${exitDate}`
                }]
            };

            updateServiceRequest(updatedRequest);
            setSelectedRequest(updatedRequest);
            setIsExitMode(false);
        }
    };

    const calculateDaysInWorkshop = (startDateStr?: string, endDateStr?: string) => {
        if (!startDateStr) return 0;
        const start = new Date(startDateStr);
        const end = endDateStr ? new Date(endDateStr) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    // --- RENDER LIST ---
    if (view === 'LIST') {
        const filteredList = serviceRequests.filter(req => {
            if (search && !req.vehiclePlate.toLowerCase().includes(search.toLowerCase()) && !req.requesterName.toLowerCase().includes(search.toLowerCase())) return false;
            const isFinished = req.stage === ServiceStage.DELIVERY || req.stage === ServiceStage.CANCELLED;
            if (!showHistory && isFinished) return false;
            if (showHistory && !isFinished) return false;
            if (!isManager && req.userId !== user?.id) return false;
            return true;
        }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LucideWrench /> Gestión de Servicios
                    </h1>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showHistory ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LucideHistory size={18}/>
                            {showHistory ? 'Volver a Activos' : 'Ver Historial / Finalizados'}
                        </button>
                        <button onClick={handleCreateNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm w-full md:w-auto justify-center">
                            <LucidePlus /> Nueva Solicitud
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por patente, solicitante..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredList.map(req => (
                        <div key={req.id} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${req.stage === ServiceStage.REQUESTED ? 'border-l-4 border-l-purple-500' : ''}`} onClick={() => { setSelectedRequest(req); setView('DETAIL'); }}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-slate-800">{req.vehiclePlate}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${getStageColor(req.stage)}`}>{req.stage}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()} • {req.category}</p>
                                </div>
                                <LucideArrowRight className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{req.description}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t pt-2">
                                <span className="flex items-center gap-1"><LucideUser size={12}/> {req.requesterName}</span>
                                {req.budgets.length > 0 && <span className="flex items-center gap-1 text-green-600 font-bold"><LucideDollarSign size={12}/> Presupuestado</span>}
                            </div>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            {showHistory ? "No hay servicios finalizados." : "No hay solicitudes activas."}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER FORM ---
    if (view === 'FORM') {
        const vehicleSuggestions = vehicles.filter(v => 
            v.status === VehicleStatus.ACTIVE &&
            (plateSearch === '' || 
             v.plate.toLowerCase().includes(plateSearch.toLowerCase()) || 
             v.model.toLowerCase().includes(plateSearch.toLowerCase()))
        );

        return (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full"><LucideArrowLeft /></button>
                    <h2 className="text-xl font-bold text-slate-800">Nueva Solicitud de Servicio</h2>
                </div>
                
                <div className="space-y-4">
                    {/* VEHICLE AUTOCOMPLETE */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehículo (Buscar Patente o Modelo)</label>
                        <div className="relative">
                            <LucideCarFront className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                            <input 
                                type="text"
                                className="w-full pl-10 pr-4 py-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-bold text-slate-700"
                                placeholder="Escriba patente o modelo..."
                                value={plateSearch}
                                onChange={(e) => {
                                    setPlateSearch(e.target.value);
                                    setShowPlateSuggestions(true);
                                    if(e.target.value === '') {
                                        setFormData({...formData, vehiclePlate: ''});
                                    }
                                }}
                                onFocus={() => setShowPlateSuggestions(true)}
                            />
                            {showPlateSuggestions && plateSearch && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto z-50">
                                    {vehicleSuggestions.length > 0 ? (
                                        vehicleSuggestions.map(v => (
                                            <div 
                                                key={v.plate}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                                                onClick={() => {
                                                    setFormData({...formData, vehiclePlate: v.plate, currentKm: v.currentKm});
                                                    setPlateSearch(`${v.plate} - ${v.model}`);
                                                    setShowPlateSuggestions(false);
                                                }}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{v.plate}</p>
                                                    <p className="text-xs text-slate-500">{v.make} {v.model}</p>
                                                </div>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{v.costCenter || 'N/A'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 text-sm">No se encontraron vehículos activos.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value as ServiceCategory})}
                            >
                                {Object.values(ServiceCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub-Categoría</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={formData.subCategory}
                                onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                            >
                                {Object.values(ServiceSubCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción del Problema / Solicitud</label>
                        <textarea 
                            className="w-full p-3 border rounded-lg h-32"
                            placeholder="Describa el problema, ruidos, testigos encendidos, etc..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono Solicitante *</label>
                            <div className="relative">
                                <LucidePhone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: 54911..."
                                    value={formData.requesterPhone || ''}
                                    onChange={(e) => setFormData({...formData, requesterPhone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">KM Actual (Estimado)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded"
                                value={formData.currentKm || ''}
                                onChange={(e) => setFormData({...formData, currentKm: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ciudad / Ubicación</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded"
                                value={formData.locationCity || ''}
                                onChange={(e) => setFormData({...formData, locationCity: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <button onClick={handleSaveRequest} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 mt-4 shadow-lg flex justify-center items-center gap-2">
                        <LucideSave /> Crear Solicitud
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER DETAIL ---
    if (view === 'DETAIL' && selectedRequest) {
        // Calculate Total Approved
        const totalApproved = selectedRequest.budgets
            .filter(b => b.status === 'APPROVED')
            .reduce((acc, b) => acc + b.totalCost, 0);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {viewingBudget && <BudgetDetailModal budget={viewingBudget} onClose={() => setViewingBudget(null)} />}
                
                {/* APPOINTMENT MODAL */}
                <AppointmentModal 
                    isOpen={isScheduling} 
                    onClose={() => setIsScheduling(false)} 
                    onSave={handleSaveAppointment}
                    initialData={selectedRequest.appointment}
                />

                {/* LEFT COL: INFO & WORKFLOW */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedRequest.vehiclePlate}
                                    <span className={`text-xs px-2 py-1 rounded border uppercase ${getStageColor(selectedRequest.stage)}`}>{selectedRequest.stage}</span>
                                </h1>
                                <p className="text-slate-500 text-sm">{selectedRequest.category} - {selectedRequest.subCategory}</p>
                            </div>
                            <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-slate-600"><LucideXCircle size={24}/></button>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                            <p className="text-slate-700 font-medium">{selectedRequest.description}</p>
                            <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><LucideUser size={12}/> {selectedRequest.requesterName}</span>
                                <span className="flex items-center gap-1"><LucidePhone size={12}/> {selectedRequest.requesterPhone || 'S/D'}</span>
                                <span className="flex items-center gap-1"><LucideClock size={12}/> {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><LucideWrench size={12}/> {selectedRequest.currentKm} km</span>
                            </div>
                        </div>

                        {/* APPOINTMENT HISTORY (READ ONLY) - MOVED OUTSIDE MANAGEMENT OPTIONS */}
                        {selectedRequest.stage === ServiceStage.IN_WORKSHOP && selectedRequest.appointment && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4 opacity-80 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        <LucideCalendarCheck size={16}/> Turno Cumplido (Historial)
                                    </h3>
                                    {isAdmin && (
                                        <button onClick={handleOpenSchedule} className="text-xs text-blue-600 underline font-bold hover:text-blue-800">
                                            Editar / Reasignar
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-slate-600 mt-1 flex gap-4">
                                    <span><b>{selectedRequest.appointment.provider}</b></span>
                                    <span>{new Date(selectedRequest.appointment.date + 'T00:00:00').toLocaleDateString()} {selectedRequest.appointment.time}hs</span>
                                </div>
                            </div>
                        )}

                        {/* WORKFLOW STEPS - PROGRESSIVE (HIDDEN IF IN_WORKSHOP OR FINISHED) */}
                        {(selectedRequest.stage !== ServiceStage.IN_WORKSHOP && selectedRequest.stage !== ServiceStage.DELIVERY && selectedRequest.stage !== ServiceStage.CANCELLED) && (
                            <div className="border-t pt-4">
                                <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">Opciones de Gestión</h3>
                                
                                {/* STAGE: REQUESTED */}
                                {selectedRequest.stage === ServiceStage.REQUESTED && (
                                    <div className="space-y-4">
                                        {isAdmin ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button 
                                                    onClick={() => handleStageChange(selectedRequest, ServiceStage.EVALUATION)} 
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
                                                >
                                                    <LucideMessageSquare size={16}/> Iniciar Diálogo / Evaluación
                                                </button>
                                                
                                                <button 
                                                    onClick={handleDeleteRequest} 
                                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition flex items-center gap-2 ml-auto"
                                                >
                                                    <LucideTrash2 size={16}/> Cancelar / Eliminar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={handleDeleteRequest} 
                                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition flex items-center gap-2"
                                                >
                                                    <LucideTrash2 size={16}/> Cancelar Solicitud
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STAGE: EVALUATION */}
                                {selectedRequest.stage === ServiceStage.EVALUATION && isAdmin && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
                                        <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                                            <LucideMessageSquare size={16}/> En proceso de evaluación
                                        </h4>
                                        <p className="text-xs text-blue-700">El canal de chat está abierto. Seleccione cómo avanzar:</p>
                                        
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <button 
                                                onClick={() => handleStageChange(selectedRequest, ServiceStage.BUDGETING)} 
                                                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                                            >
                                                <LucideDollarSign size={16}/> Solicitar Presupuesto
                                            </button>
                                            <button 
                                                onClick={handleOpenSchedule} 
                                                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-700 transition flex items-center justify-center gap-2"
                                            >
                                                <LucideCalendarClock size={16}/> Asignar Turno / Taller
                                            </button>
                                            <button 
                                                onClick={() => setIsFinalizing(true)} 
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                                            >
                                                <LucideCheckCheck size={16}/> Finalizar Servicio
                                            </button>
                                        </div>

                                        {/* Finalize Input Area */}
                                        {isFinalizing && (
                                            <div className="bg-white p-3 rounded-lg border border-green-200 mt-2 animate-fadeIn shadow-sm">
                                                <h4 className="font-bold text-green-800 text-xs mb-2">Finalizar Servicio Directamente</h4>
                                                <textarea 
                                                    className="w-full p-2 border rounded mb-2 text-sm"
                                                    placeholder="Ingrese observación final..."
                                                    value={finalizationNote}
                                                    onChange={(e) => setFinalizationNote(e.target.value)}
                                                ></textarea>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setIsFinalizing(false)} className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                                    <button onClick={handleDirectFinish} className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700">Confirmar</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STAGE: SCHEDULED (APPOINTMENT CARD) */}
                                {selectedRequest.stage === ServiceStage.SCHEDULED && selectedRequest.appointment && (
                                    <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-xl relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-cyan-900 flex items-center gap-2"><LucideCalendarClock /> Turno Asignado</h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${selectedRequest.appointment.status === 'CHANGE_REQUESTED' ? 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                                {selectedRequest.appointment.status === 'CHANGE_REQUESTED' ? 'Solicitud de Cambio' : 'Confirmado'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white p-3 rounded border border-cyan-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Taller / Proveedor</p>
                                                <p className="font-bold text-slate-800 flex items-center gap-2"><LucideWrench size={14}/> {selectedRequest.appointment.provider}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><LucideMapPin size={12}/> {selectedRequest.appointment.address}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded border border-cyan-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Fecha y Hora</p>
                                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                                    <LucideCalendar size={14}/> {selectedRequest.appointment.date ? new Date(selectedRequest.appointment.date + 'T00:00:00').toLocaleDateString() : 'A definir'}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><LucideClock size={12}/> {selectedRequest.appointment.time || '--:--'} hs</p>
                                            </div>
                                        </div>

                                        {/* CHANGE REQUEST DISPLAY FOR ADMIN */}
                                        {selectedRequest.appointment.status === 'CHANGE_REQUESTED' && isAdmin && (
                                            <div className="bg-orange-50 border border-orange-100 p-3 rounded mb-4 text-sm">
                                                <p className="font-bold text-orange-800 mb-1 flex items-center gap-2"><LucideAlertCircle size={14}/> El usuario solicita reprogramar:</p>
                                                <ul className="list-disc list-inside text-orange-700">
                                                    <li>Fecha: <b>{selectedRequest.appointment.userProposal?.date} {selectedRequest.appointment.userProposal?.time}</b></li>
                                                    <li>Nota: {selectedRequest.appointment.userProposal?.note}</li>
                                                </ul>
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={handleAcceptProposal} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">Aceptar Propuesta</button>
                                                    <button onClick={handleOpenSchedule} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50">Reprogramar Manualmente</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* USER CHANGE REQUEST FORM */}
                                        {!isAdmin && !isProposingChange && selectedRequest.appointment.status !== 'CHANGE_REQUESTED' && (
                                            <button onClick={() => setIsProposingChange(true)} className="text-cyan-700 text-xs font-bold underline hover:text-cyan-900 mb-2">Solicitar Cambio de Fecha</button>
                                        )}

                                        {isProposingChange && (
                                            <div className="bg-white p-3 rounded border border-cyan-100 mb-2 animate-fadeIn">
                                                <p className="text-xs font-bold text-slate-500 mb-2">Propuesta de Cambio</p>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <input type="date" className="border rounded p-1 text-xs" value={proposalForm.date} onChange={e => setProposalForm({...proposalForm, date: e.target.value})}/>
                                                    <input type="time" className="border rounded p-1 text-xs" value={proposalForm.time} onChange={e => setProposalForm({...proposalForm, time: e.target.value})}/>
                                                </div>
                                                <input type="text" placeholder="Motivo / Observación" className="border rounded p-2 text-xs w-full mb-2" value={proposalForm.note} onChange={e => setProposalForm({...proposalForm, note: e.target.value})}/>
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setIsProposingChange(false)} className="text-slate-500 text-xs font-bold px-2">Cancelar</button>
                                                    <button onClick={handleUserRequestChange} className="bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded">Enviar Solicitud</button>
                                                </div>
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <div className="flex gap-2 mt-2 pt-2 border-t border-cyan-200">
                                                <button onClick={handleOpenSchedule} className="text-cyan-700 font-bold text-xs hover:underline flex items-center gap-1"><LucideRefreshCw size={12}/> Reprogramar</button>
                                                <button onClick={() => handleStageChange(selectedRequest, ServiceStage.IN_WORKSHOP)} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-2">
                                                    <LucideWrench size={14}/> Ingresar Vehículo a Taller
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STAGE: APPROVAL */}
                                {selectedRequest.stage === ServiceStage.APPROVAL && isAdmin && (
                                    <button onClick={() => handleStageChange(selectedRequest, ServiceStage.SCHEDULED)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-700 transition flex items-center gap-2">
                                        <LucideCalendar size={16}/> Aprobar y Agendar Turno
                                    </button>
                                )}

                                {/* STAGE: SCHEDULED - LEGACY BUTTON (HIDDEN IF APPT EXISTS) */}
                                {selectedRequest.stage === ServiceStage.SCHEDULED && isAdmin && !selectedRequest.appointment && (
                                    <button onClick={() => handleStageChange(selectedRequest, ServiceStage.IN_WORKSHOP)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2">
                                        <LucideWrench size={16}/> Ingresar Vehículo a Taller
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* BUDGETS SECTION (Only visible if stage >= BUDGETING) */}
                    {(selectedRequest.stage !== ServiceStage.REQUESTED && selectedRequest.stage !== ServiceStage.EVALUATION) && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><LucideDollarSign /> Presupuestos</h3>
                                {isAdmin && selectedRequest.stage !== ServiceStage.DELIVERY && (
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition shadow-sm">
                                            <LucideCamera size={14}/>
                                            <span className="hidden sm:inline">Escanear/Foto</span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBudgetUpload} disabled={isUploadingBudget}/>
                                        </label>
                                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition shadow-sm">
                                            {isUploadingBudget ? <LucideLoader className="animate-spin" size={14}/> : <LucideUpload size={14}/>}
                                            <span>Subir Archivo</span>
                                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleBudgetUpload} disabled={isUploadingBudget}/>
                                        </label>
                                    </div>
                                )}
                            </div>
                            
                            {/* TOTAL APPROVED BANNER */}
                            {totalApproved > 0 && (
                                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-2 text-green-800 font-bold">
                                        <LucideCalculator size={20}/>
                                        <span>Total Autorizado:</span>
                                    </div>
                                    <span className="text-xl font-bold text-green-700">${totalApproved.toLocaleString()}</span>
                                </div>
                            )}

                            {selectedRequest.budgets.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">No hay presupuestos cargados.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedRequest.budgets.map(b => (
                                        <div 
                                            key={b.id} 
                                            onClick={() => setViewingBudget(b)}
                                            className="border rounded-lg p-3 flex flex-col gap-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors group relative"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white border rounded flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                                                        {b.file ? <LucideFileText size={20}/> : <LucideAlertCircle size={20}/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700">{b.provider}</p>
                                                        <p className="text-xs text-slate-500">${b.totalCost.toLocaleString()} • {new Date(b.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {b.status === 'APPROVED' ? (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">APROBADO</span>
                                                    ) : b.status === 'REJECTED' ? (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">RECHAZADO</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">PENDIENTE</span>
                                                    )}
                                                    
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteBudget(b.id); }}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Eliminar Presupuesto"
                                                        >
                                                            <LucideTrash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Explicit Actions for Admin on Pending Budgets */}
                                            {b.status === 'PENDING' && isAdmin && (
                                                <div className="flex gap-2 mt-1 pt-2 border-t border-slate-200" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => handleBudgetAction(b.id, 'APPROVED')} 
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                                    >
                                                        <LucideCheckCheck size={14}/> Autorizar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBudgetAction(b.id, 'REQUOTE')} 
                                                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                                    >
                                                        <LucideRotateCcw size={14}/> Recotizar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBudgetAction(b.id, 'REJECTED')} 
                                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                                    >
                                                        <LucideBan size={14}/> Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INVOICE & CLOSING SECTION (Only if IN_WORKSHOP or FINISHED) */}
                    {(selectedRequest.stage === ServiceStage.IN_WORKSHOP || selectedRequest.stage === ServiceStage.DELIVERY) && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LucideFileCheck /> Cierre y Facturación</h3>
                            
                            {/* WORKSHOP EXIT FLOW (Admin Only & Not Finished) */}
                            {selectedRequest.stage === ServiceStage.IN_WORKSHOP && (
                                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-blue-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-bold text-blue-800 flex items-center gap-2"><LucideClock/> Ingreso: {new Date(selectedRequest.workshopEntry?.date || selectedRequest.updatedAt).toLocaleDateString()}</span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                                            {calculateDaysInWorkshop(selectedRequest.workshopEntry?.date)} días en taller
                                        </span>
                                    </div>

                                    {!isExitMode ? (
                                        <button 
                                            onClick={() => setIsExitMode(true)}
                                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <LucideLogOut size={18}/> Registrar Egreso y Finalizar
                                        </button>
                                    ) : (
                                        <div className="bg-white p-4 rounded-lg border border-blue-100 animate-fadeIn space-y-4">
                                            <h4 className="font-bold text-slate-700 text-sm uppercase border-b pb-2">Formulario de Egreso</h4>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Egreso</label>
                                                <div className="flex gap-3 items-center">
                                                    <input 
                                                        type="date" 
                                                        className="border rounded p-2 text-sm font-bold flex-1"
                                                        value={exitDate}
                                                        onChange={(e) => setExitDate(e.target.value)}
                                                    />
                                                    <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded">
                                                        Estadía Total: {calculateDaysInWorkshop(selectedRequest.workshopEntry?.date, exitDate)} días
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Invoice Upload Integrated */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Carga de Facturas (Opcional - Puede cargarse luego)</label>
                                                {!invoiceFile ? (
                                                    <div className="relative">
                                                        <button className="w-full bg-slate-100 text-slate-600 py-3 rounded border-2 border-dashed border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 font-bold text-xs transition-colors">
                                                            <LucideImage size={16}/> Subir Factura / Comprobante
                                                        </button>
                                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleInvoiceUpload} />
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                                        {isAnalyzingInvoice ? (
                                                            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold"><LucideLoader className="animate-spin" size={14}/> Analizando...</div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs font-bold text-green-600">Comprobante detectado</span>
                                                                    <button onClick={() => setInvoiceFile(null)} className="text-red-500"><LucideTrash2 size={14}/></button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input type="text" placeholder="Nro Factura" className="border rounded p-1 text-xs" value={invoiceData.invoiceNumber || ''} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}/>
                                                                    <input type="number" placeholder="Monto Total" className="border rounded p-1 text-xs" value={invoiceData.amount || ''} onChange={e => setInvoiceData({...invoiceData, amount: Number(e.target.value)})}/>
                                                                </div>
                                                                <button onClick={handleSaveInvoice} className="w-full bg-green-600 text-white py-1.5 rounded text-xs font-bold">Guardar Factura</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* List of Loaded Invoices */}
                                                {(selectedRequest.delivery?.invoices || []).length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {selectedRequest.delivery?.invoices.map((inv, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs bg-green-50 p-2 rounded border border-green-100">
                                                                <span className="font-bold text-green-800">{inv.invoiceNumber}</span>
                                                                <span className="font-bold text-slate-700">${inv.amount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        <div className="text-right font-bold text-sm pt-1">Total: ${(selectedRequest.delivery?.finalCost || 0).toLocaleString()}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 pt-2 border-t mt-2">
                                                <button onClick={() => setIsExitMode(false)} className="flex-1 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded">Cancelar</button>
                                                <button 
                                                    onClick={handleConfirmExit}
                                                    className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Confirmar Salida y Finalizar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* List of Invoices (Read Only for History + Add More Option) */}
                            {selectedRequest.stage === ServiceStage.DELIVERY && (
                                <div>
                                    {(selectedRequest.delivery?.invoices || []).length > 0 ? (
                                        <div className="space-y-2 mb-4">
                                            {selectedRequest.delivery?.invoices.map((inv, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 bg-green-50 border border-green-100 rounded text-sm">
                                                    <span className="font-bold text-green-800">Factura {inv.invoiceNumber}</span>
                                                    <span className="font-bold text-slate-700">${inv.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="border-t pt-2 flex justify-between items-center font-bold text-slate-900">
                                                <span>Total Final:</span>
                                                <span>${selectedRequest.delivery?.finalCost.toLocaleString()}</span>
                                            </div>
                                            {selectedRequest.delivery?.date && (
                                                <div className="text-xs text-slate-500 text-right mt-1">
                                                    Fecha Egreso: {new Date(selectedRequest.delivery.date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic mb-4">No hay facturas cargadas.</p>
                                    )}

                                    {/* Upload More Invoices Section for Admin */}
                                    {isAdmin && (
                                        <div className="border-t pt-4 mt-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Agregar Factura Adicional</h4>
                                            {!invoiceFile ? (
                                                <div className="relative">
                                                    <button className="w-full bg-slate-100 text-slate-600 py-2 rounded border border-dashed border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 font-bold text-xs transition-colors">
                                                        <LucidePlus size={14}/> Cargar Comprobante
                                                    </button>
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleInvoiceUpload} />
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                                    {isAnalyzingInvoice ? (
                                                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold"><LucideLoader className="animate-spin" size={14}/> Analizando...</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-green-600">Comprobante detectado</span>
                                                                <button onClick={() => setInvoiceFile(null)} className="text-red-500"><LucideTrash2 size={14}/></button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="text" placeholder="Nro Factura" className="border rounded p-1 text-xs" value={invoiceData.invoiceNumber || ''} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}/>
                                                                <input type="number" placeholder="Monto Total" className="border rounded p-1 text-xs" value={invoiceData.amount || ''} onChange={e => setInvoiceData({...invoiceData, amount: Number(e.target.value)})}/>
                                                            </div>
                                                            <button onClick={handleSaveInvoice} className="w-full bg-green-600 text-white py-1.5 rounded text-xs font-bold">Guardar y Agregar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COL: CHAT & LOGS */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px] overflow-hidden relative">
                        <div className="p-4 border-b bg-slate-50 rounded-t-xl font-bold text-slate-700 flex items-center gap-2">
                            <LucideMessageSquare size={18}/> Comunicación
                        </div>
                        
                        {/* Chat Overlay for REQUESTED stage */}
                        {selectedRequest.stage === ServiceStage.REQUESTED && (
                            <div className="absolute inset-0 z-10 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                <div className="bg-white p-4 rounded-full shadow-md mb-4 text-slate-400">
                                    <LucideLock size={32}/>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">Comunicación Bloqueada</h3>
                                <p className="text-sm text-slate-500 max-w-xs">
                                    El administrador debe iniciar la evaluación ("Iniciar Diálogo") para habilitar el chat con el usuario.
                                </p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {selectedRequest.messages?.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === (isAdmin ? 'ADMIN' : 'USER') ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.sender === (isAdmin ? 'ADMIN' : 'USER') ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none shadow-sm text-slate-700'}`}>
                                        <p className="font-bold text-[10px] opacity-70 mb-1">{msg.senderName}</p>
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1">
                                        {new Date(msg.timestamp).toLocaleString([], {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            ))}
                            {!selectedRequest.messages?.length && (
                                <p className="text-center text-slate-400 text-sm mt-10">No hay mensajes aún.</p>
                            )}
                        </div>
                        <div className="p-3 border-t bg-white rounded-b-xl flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                placeholder="Escribir mensaje..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={selectedRequest.stage === ServiceStage.REQUESTED}
                            />
                            <button 
                                onClick={handleSendMessage} 
                                disabled={selectedRequest.stage === ServiceStage.REQUESTED}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                <LucideSend size={18}/>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-xs uppercase mb-3">Historial de Cambios</h4>
                        <div className="space-y-3 relative border-l-2 border-slate-100 ml-2 pl-4">
                            {selectedRequest.logs.map((log, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-slate-700">{log.stage}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(log.date).toLocaleString()} - {log.user}</p>
                                    {log.note && <p className="text-[10px] text-slate-400 italic mt-0.5">{log.note}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// Internal LucideIcon helper not strictly needed as we import them directly now.
function LucideXCircle({ size }: { size: number }) {
    return <LucideX size={size} className="text-slate-400 hover:text-slate-600" />;
}
