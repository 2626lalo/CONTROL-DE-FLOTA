import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../App';
import { ServiceRequest, ServiceCategory, ServiceSubCategory, ServiceStage, Budget, Vehicle, ChatMessage, ServiceHistory, VehicleStatus, UserRole, InvoiceData } from '../types';
import { LucideWrench, LucidePlus, LucideFilter, LucideSearch, LucideCalendar, LucideCheckCircle, LucideAlertTriangle, LucideClock, LucideDollarSign, LucideCamera, LucideImage, LucideLoader, LucideX, LucideMapPin, LucideBuilding2, LucideArrowRight, LucideCheck, LucideHistory, LucideArrowLeft, LucideSend, LucideMinus, LucideMaximize, LucidePlay, LucideAlertOctagon, LucideCalendarClock, LucideMessageSquare, LucidePhone, LucideUser, LucideRefreshCcw, LucideArchive, LucideFileText, LucideTruck, LucideChevronRight, LucideMoreVertical, LucideReceipt, LucideShieldCheck, LucideLayoutGrid, LucideListFilter, LucideXCircle, LucideMail, LucideMenu, LucideLock, LucideChevronDown, LucideAlertCircle, LucideBookOpen, LucideHelpCircle, LucideTrash2, LucideShield, LucideUsers, LucideFileDown, LucideHourglass, LucideDownload, LucideFileSpreadsheet } from 'lucide-react';
import { analyzeBudgetImage, analyzeInvoiceImage } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationModal } from './ConfirmationModal';

// Helper to calculate days between dates
const calculateDaysDiff = (startStr: string, endStr: string = new Date().toISOString()) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Reset hours to compare pure dates
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
};

const getStageColor = (stage: ServiceStage) => {
    switch(stage) {
        case ServiceStage.REQUESTED: return 'bg-blue-100 text-blue-700 border-blue-200';
        case ServiceStage.EVALUATION: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case ServiceStage.SCHEDULED: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case ServiceStage.IN_WORKSHOP: return 'bg-orange-100 text-orange-700 border-orange-200';
        case ServiceStage.BUDGETING: return 'bg-purple-100 text-purple-700 border-purple-200';
        case ServiceStage.APPROVAL: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case ServiceStage.DELIVERY: return 'bg-green-100 text-green-700 border-green-200';
        case ServiceStage.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const getTotalCost = (req: ServiceRequest) => {
    let total = 0;
    if (req.budgets) {
        total += req.budgets
            .filter(b => b.status === 'APPROVED')
            .reduce((sum, b) => sum + b.totalCost, 0);
    }
    if (req.delivery?.invoices) {
        total += req.delivery.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    }
    return total;
};

// ... (ServiceGuideModal component code remains the same) ...
const ServiceGuideModal = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    const steps = [
        {
            title: "1. Solicitud de Servicio",
            icon: <LucidePlus size={32} className="text-blue-500" />,
            role: "Cualquier Usuario (Chofer/Gerente)",
            roleIcon: <LucideUsers size={14}/>,
            desc: "Inicio del proceso. El usuario reporta una falla o necesidad.",
            details: "• Complete la patente, categoría y descripción del problema.\n• Si es posible, agregue KM actual.",
            action: "Acción: Botón 'Solicitar Servicio' > Completar Formulario."
        },
        {
            title: "2. Evaluación y Chat",
            icon: <LucideMessageSquare size={32} className="text-cyan-500" />,
            role: "Admin / Gerente de Flota",
            roleIcon: <LucideShield size={14}/>,
            desc: "Diagnóstico preliminar. Se utiliza el chat para pedir fotos o detalles al chofer.",
            details: "• El Admin revisa la solicitud.\n• Puede chatear con el solicitante antes de enviar al taller.\n• Define si es urgente o puede esperar.",
            action: "Acción: Abrir solicitud > Usar chat > Decidir derivación."
        },
        {
            title: "3. Coordinación y Turno",
            icon: <LucideCalendarClock size={32} className="text-indigo-500" />,
            role: "Admin (Gestión)",
            roleIcon: <LucideShield size={14}/>,
            desc: "Asignación de fecha, hora y proveedor (taller) para el trabajo.",
            details: "• El Admin selecciona el taller y la fecha.\n• Al guardar, el estado cambia a 'Turno Asignado'.\n• El sistema espera que la unidad ingrese al taller.",
            action: "Acción: Sección 'Coordinación' > Ingresar Fecha/Proveedor > Guardar."
        },
        {
            title: "4. Taller y Presupuestos",
            icon: <LucideDollarSign size={32} className="text-purple-500" />,
            role: "Admin (Aprobación)",
            roleIcon: <LucideShield size={14}/>,
            desc: "Gestión de costos. Carga de presupuestos y aprobación de reparaciones.",
            details: "• Se pueden cargar fotos de presupuestos (la IA lee los montos).\n• El Admin debe APROBAR o RECHAZAR cada presupuesto.\n• Esto suma al 'Costo Estimado'.",
            action: "Acción: Botón 'Cargar Presupuesto' > Aprobar."
        },
        {
            title: "5. Finalización y Entrega",
            icon: <LucideCheckCircle size={32} className="text-green-500" />,
            role: "SOLO ADMIN",
            roleIcon: <LucideLock size={14}/>,
            desc: "Paso crítico. Carga de facturas finales y cierre del servicio.",
            details: "PASOS PARA CERRAR CORRECTAMENTE:\n1. Ingrese KM de salida y Fecha.\n2. ¡IMPORTANTE! Cargue la foto de la FACTURA FINAL en el recuadro gris.\n3. Verifique que el 'Total Estimado' sume presupuestos + facturas.\n4. Presione 'FINALIZAR Y ENTREGAR'.",
            action: "Acción: Cargar Factura > Verificar Monto > Finalizar."
        }
    ];

    const current = steps[step - 1];

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><LucideBookOpen size={20}/> Manual de Procedimiento</h3>
                    <button onClick={onClose}><LucideX size={24} className="text-slate-400 hover:text-white"/></button>
                </div>
                
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paso {step} de {totalSteps}</span>
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i + 1 === step ? 'bg-blue-600' : i + 1 < step ? 'bg-blue-200' : 'bg-slate-100'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mb-6 animate-fadeIn">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                            {current.icon}
                        </div>
                        
                        <div className="flex justify-center mb-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 border ${current.role.includes('ADMIN') ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                {current.roleIcon} {current.role}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{current.title}</h2>
                        <p className="text-slate-600 mb-4">{current.desc}</p>
                        
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-left text-sm text-blue-900 mb-4 whitespace-pre-wrap leading-relaxed shadow-inner">
                            <strong>¿Qué hacer aquí?</strong>
                            <br/>
                            {current.details}
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-left text-xs text-white font-mono flex items-center gap-2">
                            <LucideArrowRight size={14} className="text-green-400 shrink-0"/>
                            {current.action}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between">
                    <button 
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                        className="px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    {step < totalSteps ? (
                        <button 
                            onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                        >
                            ¡Entendido!
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (CreateServiceForm and BudgetCard remain the same) ...
const CreateServiceForm = ({ onCancel, onSubmit, vehicles }: { onCancel: () => void, onSubmit: (data: any) => void, vehicles: Vehicle[] }) => {
    // ... existing implementation ...
    const [plate, setPlate] = useState('');
    const [category, setCategory] = useState<ServiceCategory>(ServiceCategory.MAINTENANCE);
    const [subCategory, setSubCategory] = useState('');
    const [description, setDescription] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [currentKm, setCurrentKm] = useState(0);
    const [city, setCity] = useState('');
    const [prefDate, setPrefDate] = useState('');
    const [prefTime, setPrefTime] = useState('MAÑANA');
    
    const selectedVehicle = vehicles.find(v => v.plate === plate);

    useEffect(() => {
        if(selectedVehicle) {
            setCurrentKm(selectedVehicle.currentKm);
            if(selectedVehicle.province && !city) setCity(selectedVehicle.province);
        }
    }, [selectedVehicle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!plate || !description || !category || !subCategory) {
            alert("⚠️ Complete los campos obligatorios.");
            return;
        }
        onSubmit({
            vehiclePlate: plate, category, subCategory, description, contactPhone, currentKm, locationCity: city,
            preferredDates: prefDate ? [{ date: prefDate, timeSlot: prefTime }] : []
        });
    };

    return (
        <div className="flex flex-col h-full bg-white max-w-3xl mx-auto rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-4 animate-fadeIn">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><LucidePlus className="text-blue-400"/> Nueva Solicitud</h2>
                <button onClick={onCancel}><LucideX size={24} className="text-slate-400 hover:text-white"/></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={plate} onChange={e => setPlate(e.target.value)}>
                            <option value="">-- Seleccionar --</option>
                            {vehicles.filter(v => v.status !== 'INACTIVE').map(v => <option key={v.plate} value={v.plate}>{v.plate} - {v.model}</option>)}
                        </select>
                        {selectedVehicle && (
                            <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded border border-blue-100">
                                <LucideHistory size={12}/> Último registrado: {selectedVehicle.currentKm.toLocaleString()} km
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoría</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={category} onChange={e => setCategory(e.target.value as ServiceCategory)}>
                            <option value={ServiceCategory.MAINTENANCE}>Mantenimiento</option>
                            <option value={ServiceCategory.SERVICES}>Servicios / Auxilio</option>
                            <option value={ServiceCategory.PURCHASES}>Compras / Repuestos</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sub-Categoría</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                            <option value="">Seleccione...</option>
                            {category === ServiceCategory.MAINTENANCE && [ServiceSubCategory.PREVENTIVE, ServiceSubCategory.CORRECTIVE, ServiceSubCategory.OFFICIAL].map(s => <option key={s} value={s}>{s}</option>)}
                            {category === ServiceCategory.SERVICES && [ServiceSubCategory.VTV, ServiceSubCategory.TIRES, ServiceSubCategory.WASHING, ServiceSubCategory.GPS, ServiceSubCategory.INSURANCE, ServiceSubCategory.ACCIDENT, ServiceSubCategory.TOWING].map(s => <option key={s} value={s}>{s}</option>)}
                            {category === ServiceCategory.PURCHASES && [ServiceSubCategory.PARTS].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">KM Actual (Al momento)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" 
                            placeholder="0" 
                            value={currentKm} 
                            onChange={e => setCurrentKm(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción del Problema</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalle la solicitud..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teléfono Contacto</label>
                        <input type="tel" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="+54 9..." value={contactPhone} onChange={e => setContactPhone(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ciudad</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Córdoba" value={city} onChange={e => setCity(e.target.value)}/>
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button onClick={onCancel} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition">Cancelar</button>
                <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"><LucideSend size={18}/> Crear Solicitud</button>
            </div>
        </div>
    );
};

interface BudgetCardProps {
    budget: Budget;
    onApprove: () => void;
    onReject: () => void;
    onClick: () => void;
    readOnly?: boolean;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onApprove, onReject, onClick, readOnly }) => (
    <div onClick={onClick} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer group relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${budget.status === 'APPROVED' ? 'bg-green-500' : budget.status === 'REJECTED' ? 'bg-red-500' : 'bg-purple-500'}`}></div>
        <div className="flex justify-between items-start mb-2 pl-2">
            <div>
                <p className="font-bold text-slate-800">{budget.provider}</p>
                <p className="text-xs text-slate-500">{budget.budgetNumber || 'S/N'} • {new Date(budget.date).toLocaleDateString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${budget.status === 'APPROVED' ? 'bg-green-100 text-green-700' : budget.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                {budget.status === 'PENDING' ? 'Pendiente' : budget.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
            </span>
        </div>
        <div className="pl-2 mb-3">
            <p className="text-2xl font-extrabold text-slate-700">${budget.totalCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500 truncate">{budget.details}</p>
        </div>
        
        {budget.status === 'PENDING' && !readOnly && (
            <div className="flex gap-2 pl-2 mt-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={onApprove} className="flex-1 bg-green-50 text-green-700 text-xs font-bold py-2 rounded hover:bg-green-100 border border-green-200">Aprobar</button>
                <button onClick={onReject} className="flex-1 bg-white text-red-600 text-xs font-bold py-2 rounded hover:bg-red-50 border border-red-200">Rechazar</button>
            </div>
        )}
    </div>
);

export const ServiceManager = () => {
    // Added deleteServiceRequest to useApp()
    const { serviceRequests, vehicles, addServiceRequest, updateServiceRequest, updateVehicle, deleteServiceRequest, user } = useApp();
    const location = useLocation();
    
    const [mode, setMode] = useState<'LIST' | 'NEW'>('LIST'); 
    const [statusFilter, setStatusFilter] = useState<ServiceStage | 'ALL'>('ALL');
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null); 
    const [filterPlate, setFilterPlate] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null); 
    const [showGuide, setShowGuide] = useState(false);
    
    // NEW: Export Menu State
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    // ... (State variables for form fields remain the same) ...
    const [chatMessage, setChatMessage] = useState('');
    const [apptDate, setApptDate] = useState('');
    const [apptTime, setApptTime] = useState('');
    const [apptProvider, setApptProvider] = useState('');
    const [apptAddress, setApptAddress] = useState('');
    const [workshopDate, setWorkshopDate] = useState(new Date().toISOString().split('T')[0]);
    const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
    const [exitKm, setExitKm] = useState(0);
    const [deliveryNote, setDeliveryNote] = useState('');

    const [budgetFile, setBudgetFile] = useState<string | null>(null);
    const [budgetData, setBudgetData] = useState({ provider: '', cost: 0, number: '', details: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState<string | null>(null);
    const [newInvoiceData, setNewInvoiceData] = useState({ number: '', amount: 0 });
    const [isAnalyzingInvoice, setIsAnalyzingInvoice] = useState(false);
    
    useEffect(() => {
        if (location.state?.filterPlate) {
            setFilterPlate(location.state.filterPlate);
            setMode('LIST');
        }
    }, [location]);

    useEffect(() => {
        if(selectedRequest) {
            const fresh = serviceRequests.find(r => r.id === selectedRequest.id);
            if (!fresh) { setSelectedRequest(null); return; }
            if(fresh.updatedAt !== selectedRequest.updatedAt) setSelectedRequest(fresh);
        }
    }, [serviceRequests, selectedRequest]);

    useEffect(() => {
        setErrorMsg(null);
    }, [selectedRequest]);

    // ... (Existing Logic Handlers: handleDeleteRequest, addLog, handleCreateSubmit, etc. remain unchanged) ...
    const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            title: "Eliminar Solicitud",
            message: "¿Está seguro? El registro dejará de existir y no podrá recuperarse.",
            onConfirm: () => deleteServiceRequest(id)
        });
    };

    const addLog = (req: ServiceRequest, note: string, newStage?: ServiceStage) => {
        const safeLogs = Array.isArray(req.logs) ? req.logs : [];
        return [...safeLogs, {
            stage: newStage || req.stage,
            date: new Date().toISOString(),
            user: user?.name || 'Sistema',
            note
        }];
    };

    const handleCreateSubmit = (data: any) => {
        const newRequest: ServiceRequest = {
            id: `SR-${Date.now()}`,
            vehiclePlate: data.vehiclePlate,
            userId: user?.id || 'unknown',
            requesterName: user?.name || 'Usuario',
            requesterPhone: data.contactPhone,
            requesterEmail: user?.email || '',
            category: data.category,
            subCategory: data.subCategory,
            description: data.description,
            currentKm: data.currentKm,
            locationCity: data.locationCity,
            preferredDates: data.preferredDates,
            stage: ServiceStage.REQUESTED, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            budgets: [],
            logs: [{ stage: ServiceStage.REQUESTED, date: new Date().toISOString(), user: user?.name || 'Sistema', note: 'Solicitud creada.' }],
            syncStatus: 'PENDING',
            messages: []
        };
        addServiceRequest(newRequest);
        setMode('LIST'); 
    };

    // ... (All other handlers: handleOpenRequest, handleQuickStageChange, etc. remain the same) ...
    const handleOpenRequest = (req: ServiceRequest) => {
        const vehicle = vehicles.find(v => v.plate === req.vehiclePlate);
        const latestKm = vehicle?.currentKm || req.currentKm || 0;

        setExitKm(latestKm);
        setExitDate(new Date().toISOString().split('T')[0]);
        setDeliveryNote('');

        // Populate Appointment Form
        if (req.appointment) {
            setApptDate(req.appointment.date || '');
            setApptTime(req.appointment.time || '');
            setApptProvider(req.appointment.provider || '');
            setApptAddress(req.appointment.address || '');
        } else {
            setApptDate('');
            setApptTime('');
            setApptProvider('');
            setApptAddress('');
        }

        if (req.stage === ServiceStage.REQUESTED) {
            const updatedReq = {
                ...req,
                stage: ServiceStage.EVALUATION,
                updatedAt: new Date().toISOString(),
                logs: addLog(req, "Iniciando proceso de evaluación", ServiceStage.EVALUATION)
            };
            updateServiceRequest(updatedReq);
            setSelectedRequest(updatedReq);
        } else {
            setSelectedRequest(req);
        }
    };

    const handleQuickStageChange = (req: ServiceRequest, newStage: ServiceStage, deliveryData?: any) => {
        // ... implementation as previously defined ...
        setErrorMsg(null);
        try {
            // ADMIN and ADMIN_L2 can change stages
            const isSuperUser = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
            if (!isSuperUser) {
                throw new Error("⛔ ACCESO DENEGADO: Solo los Administradores pueden cambiar etapas críticas.");
            }
            if (req.stage === newStage) return;

            if (newStage === ServiceStage.SCHEDULED) {
                const hasValidAppointment = req.appointment && 
                                            req.appointment.date && 
                                            req.appointment.provider && 
                                            req.appointment.provider !== 'A confirmar';
                
                if (!hasValidAppointment) {
                    throw new Error("⛔ DATOS INCOMPLETOS\n\nNo se puede cambiar a 'Turno Asignado' porque no se han guardado los datos del turno (Fecha/Proveedor).\n\nIngrese a la sección 'Coordinación de Turno', complete los datos y haga clic en GUARDAR.");
                }
            }

            if (newStage === ServiceStage.DELIVERY) {
                // ... validation logic ...
                const errors: string[] = [];
                const warnings: string[] = [];

                const pendingBudgets = (req.budgets || []).filter(b => b.status === 'PENDING');
                if (pendingBudgets.length > 0) {
                    warnings.push(`• Hay ${pendingBudgets.length} presupuesto(s) PENDIENTE(S).`);
                }

                const vehicle = vehicles.find(v => v.plate === req.vehiclePlate);
                if (!vehicle) {
                    errors.push(`• Error crítico: No se encuentra el vehículo ${req.vehiclePlate} en la base de datos.`);
                }

                if (deliveryData) {
                    if (deliveryData.exitKm === 0) {
                         errors.push(`• El KM de Salida no puede ser 0. Indique el kilometraje actual.`);
                    } else {
                        if (req.currentKm && deliveryData.exitKm < req.currentKm) {
                            errors.push(`• El KM de Salida (${deliveryData.exitKm}) no puede ser menor al KM de inicio (${req.currentKm}).`);
                        }
                        if (vehicle && deliveryData.exitKm < vehicle.currentKm) {
                            errors.push(`• El KM de Salida (${deliveryData.exitKm}) es menor al KM actual registrado en la unidad (${vehicle.currentKm}).`);
                        }
                    }
                }

                if (errors.length > 0) {
                    throw new Error("No se puede finalizar el servicio por las siguientes razones:\n\n" + errors.join("\n"));
                }

                let confirmMsg = `¿Confirmar FINALIZACIÓN del servicio para ${req.vehiclePlate}?\n\nLa unidad quedará liberada (ACTIVA) y se generará el historial con ${deliveryData?.exitKm} km.`;
                if (warnings.length > 0) {
                    confirmMsg = "⚠ ADVERTENCIAS DETECTADAS:\n" + warnings.join("\n") + "\n\n¿Desea FORZAR EL CIERRE ADMINISTRATIVO de todas formas?";
                }
                
                if (!confirm(confirmMsg)) return;

                const finalCost = getTotalCost(req); 
                const closureDate = deliveryData?.exitDate ? new Date(deliveryData.exitDate).toISOString() : new Date().toISOString();

                // Calculate Days In Workshop for History
                let stayDurationInfo = '';
                if (req.workshopEntry?.date) {
                    const days = calculateDaysDiff(req.workshopEntry.date, closureDate);
                    stayDurationInfo = ` | Estadía en Taller: ${days} días`;
                }

                const updatedReq: ServiceRequest = {
                    ...req,
                    stage: ServiceStage.DELIVERY,
                    updatedAt: closureDate,
                    delivery: {
                        date: closureDate,
                        finalCost: finalCost,
                        invoices: req.delivery?.invoices || [],
                        observations: deliveryData?.deliveryNote || 'Finalizado desde tablero rápido.'
                    },
                    logs: [...(req.logs || []), {
                        stage: ServiceStage.DELIVERY,
                        date: closureDate,
                        user: user?.name || 'Admin',
                        note: `Servicio Finalizado. Costo: $${finalCost}.${stayDurationInfo}`
                    }]
                };

                if (vehicle) {
                    const newHistory: ServiceHistory = {
                        id: `H-${Date.now()}`,
                        date: closureDate,
                        type: req.category === ServiceCategory.MAINTENANCE ? 'SERVICE' : 'REPAIR',
                        description: `[${req.category}] ${req.subCategory}${stayDurationInfo}`,
                        cost: finalCost,
                        attachments: []
                    };
                    
                    const updatedVehicle = {
                        ...vehicle,
                        status: VehicleStatus.ACTIVE,
                        currentKm: deliveryData?.exitKm || vehicle.currentKm,
                        history: [...(vehicle.history || []), newHistory],
                    };
                    updateVehicle(updatedVehicle);
                }
                
                updateServiceRequest(updatedReq);
                if (selectedRequest && selectedRequest.id === req.id) {
                    setSelectedRequest(updatedReq);
                }

            } else if (newStage === ServiceStage.CANCELLED) {
                
                if(!confirm("¿Confirma la CANCELACIÓN de este servicio?\n\nSi la unidad se encuentra en 'Mantenimiento', volverá a estar 'Activa' para su uso.")) return;

                const updatedReq = {
                    ...req,
                    stage: newStage,
                    updatedAt: new Date().toISOString(),
                    logs: [...(req.logs || []), {
                        stage: newStage,
                        date: new Date().toISOString(),
                        user: user?.name || 'Admin',
                        note: 'Servicio Cancelado por Administrador'
                    }]
                };

                // Free up vehicle
                const vehicle = vehicles.find(v => v.plate === req.vehiclePlate);
                if(vehicle && vehicle.status === VehicleStatus.MAINTENANCE) {
                    updateVehicle({ ...vehicle, status: VehicleStatus.ACTIVE });
                }

                updateServiceRequest(updatedReq);
                if (selectedRequest && selectedRequest.id === req.id) setSelectedRequest(updatedReq);

            } else {
                const updatedReq: ServiceRequest = {
                    ...req,
                    stage: newStage,
                    updatedAt: new Date().toISOString(),
                    logs: [...(req.logs || []), {
                        stage: newStage,
                        date: new Date().toISOString(),
                        user: user?.name || 'Admin',
                        note: `Cambio rápido de etapa a: ${newStage}`
                    }]
                };
                
                updateServiceRequest(updatedReq);
                if (selectedRequest && selectedRequest.id === req.id) {
                    setSelectedRequest(updatedReq);
                }
            }
        } catch (error: any) {
            console.error("Service Update Error:", error);
            setErrorMsg(error.message || "Ocurrió un error desconocido al actualizar el servicio.");
        }
    };

    const handleBudgetDecision = (id: string, action: 'APPROVED' | 'REJECTED') => {
        // ... (existing auto-generate order logic) ...
        if(!selectedRequest) return;
        
        if (action === 'APPROVED') {
            const budget = selectedRequest.budgets.find(b => b.id === id);
            const vehicle = vehicles.find(v => v.plate === selectedRequest.vehiclePlate);
            
            if (budget && vehicle) {
                try {
                    const doc = new jsPDF();
                    const dateStr = new Date().toLocaleDateString();
                    doc.setFontSize(22);
                    doc.setTextColor(0, 51, 153);
                    doc.text("ORDEN DE SERVICIO AUTORIZADA", 105, 20, { align: "center" });
                    doc.setDrawColor(0, 51, 153);
                    doc.line(10, 25, 200, 25);
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Fecha Emisión: ${dateStr}`, 14, 35);
                    doc.text(`ID Solicitud: ${selectedRequest.id}`, 14, 40);
                    doc.text(`Autorizado por: ${user?.name || 'Administrador'}`, 14, 45);
                    doc.setFillColor(245, 245, 245);
                    doc.rect(14, 55, 182, 25, 'F');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont("helvetica", "bold");
                    doc.text("DATOS DE LA UNIDAD", 14, 50);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Dominio (Patente): ${vehicle.plate}`, 20, 65);
                    doc.text(`Marca/Modelo: ${vehicle.make} ${vehicle.model}`, 20, 72);
                    doc.text(`Kilometraje Actual: ${selectedRequest.currentKm || vehicle.currentKm} km`, 110, 65);
                    doc.text(`Año: ${vehicle.year}`, 110, 72);
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text("DETALLE DEL SERVICIO", 14, 95);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Categoría: ${selectedRequest.category}`, 14, 105);
                    doc.text(`Sub-Categoría: ${selectedRequest.subCategory}`, 14, 110);
                    doc.text("Problema Reportado:", 14, 118);
                    const splitDesc = doc.splitTextToSize(selectedRequest.description, 180);
                    doc.text(splitDesc, 14, 123);
                    let yPos = 123 + (splitDesc.length * 5) + 10;
                    doc.setDrawColor(0, 100, 0);
                    doc.setLineWidth(0.5);
                    doc.rect(14, yPos, 182, 40);
                    doc.setFontSize(11);
                    doc.setTextColor(0, 100, 0);
                    doc.setFont("helvetica", "bold");
                    doc.text("PRESUPUESTO APROBADO", 20, yPos + 8);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Proveedor Asignado: ${budget.provider}`, 20, yPos + 18);
                    doc.text(`Nro Presupuesto: ${budget.budgetNumber || 'S/N'}`, 20, yPos + 24);
                    doc.text(`Detalle Trabajo: ${budget.details}`, 20, yPos + 30);
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Monto Autorizado: $${budget.totalCost.toLocaleString()}`, 120, yPos + 25);
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Documento generado automáticamente por Sistema de Control de Flota.", 105, 280, { align: "center" });
                    const pdfBase64 = doc.output('datauristring');
                    const newHistoryItem: ServiceHistory = {
                        id: `WO-${Date.now()}`, 
                        date: new Date().toISOString(),
                        type: selectedRequest.category === ServiceCategory.MAINTENANCE ? 'SERVICE' : 'REPAIR',
                        description: `Orden de Servicio Aprobada - Proveedor: ${budget.provider}\nTrabajo: ${budget.details}`,
                        cost: budget.totalCost,
                        attachments: [pdfBase64]
                    };
                    const updatedVehicle = {
                        ...vehicle,
                        history: [...(vehicle.history || []), newHistoryItem]
                    };
                    updateVehicle(updatedVehicle);
                    alert(`✅ Presupuesto Aprobado.\n\nSe ha generado automáticamente la ORDEN DE SERVICIO y se guardó en el historial de la unidad ${vehicle.plate}.`);
                } catch (error) {
                    console.error("Error generating Service Order PDF:", error);
                    alert("Presupuesto aprobado, pero hubo un error generando el PDF de la orden de servicio.");
                }
            }
        }

        const updatedBudgets = selectedRequest.budgets.map(b => b.id === id ? { ...b, status: action, approvedBy: user?.name } : b);
        updateServiceRequest({ 
            ...selectedRequest, 
            updatedAt: new Date().toISOString(),
            budgets: updatedBudgets, 
            stage: action === 'APPROVED' ? ServiceStage.APPROVAL : selectedRequest.stage, 
            logs: addLog(selectedRequest, `Presupuesto ${action}`) 
        });
    };

    // ... (Invoice Logic, same as before) ...
    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setInvoiceFile(base64); 
            setIsAnalyzingInvoice(true);
            const analysis = await analyzeInvoiceImage(base64.split(',')[1]);
            setNewInvoiceData({ 
                number: analysis?.invoiceNumber || '', 
                amount: analysis?.amount || 0 
            });
            setIsAnalyzingInvoice(false);
        };
        reader.readAsDataURL(file);
    };

    const handleAddInvoice = () => {
        if(!selectedRequest || !invoiceFile || !newInvoiceData.amount) return;
        
        const newInvoice: InvoiceData = {
            file: invoiceFile,
            invoiceNumber: newInvoiceData.number || `S/N-${Date.now()}`,
            amount: newInvoiceData.amount
        };

        const currentDelivery = selectedRequest.delivery || { date: new Date().toISOString(), invoices: [], finalCost: 0 };
        const updatedDelivery = {
            ...currentDelivery,
            invoices: [...(currentDelivery.invoices || []), newInvoice]
        };

        updateServiceRequest({
            ...selectedRequest,
            updatedAt: new Date().toISOString(),
            delivery: updatedDelivery
        });

        setInvoiceFile(null);
        setNewInvoiceData({ number: '', amount: 0 });
    };

    const handleRemoveInvoice = (index: number) => {
        if(!selectedRequest || !selectedRequest.delivery) return;
        const updatedInvoices = selectedRequest.delivery.invoices.filter((_, i) => i !== index);
        
        updateServiceRequest({
            ...selectedRequest,
            updatedAt: new Date().toISOString(),
            delivery: { ...selectedRequest.delivery, invoices: updatedInvoices }
        });
    };

    const handleFinalizeService = () => {
        if (!selectedRequest) return;
        handleQuickStageChange(selectedRequest, ServiceStage.DELIVERY, {
            exitKm,
            exitDate,
            deliveryNote
        });
    };

    const handleStageNavigation = (newStage: ServiceStage) => {
        if (!selectedRequest) return;
        handleQuickStageChange(selectedRequest, newStage);
    };

    const handleSendMessage = () => {
        if (!selectedRequest || !chatMessage.trim()) return;
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2 ? 'ADMIN' : 'USER',
            senderName: user?.name || 'Usuario',
            text: chatMessage,
            timestamp: new Date().toISOString()
        };
        const updatedReq = {
            ...selectedRequest,
            messages: [...(selectedRequest.messages || []), newMessage],
            updatedAt: new Date().toISOString()
        };
        updateServiceRequest(updatedReq);
        setSelectedRequest(updatedReq);
        setChatMessage('');
    };

    const handleConfirmSchedule = (silent = false) => {
        if (!selectedRequest) return;
        if (!apptDate || !apptProvider) { alert("Debe ingresar Fecha y Proveedor para agendar."); return; }
        const updatedReq = {
            ...selectedRequest,
            appointment: {
                date: apptDate,
                time: apptTime || '09:00',
                provider: apptProvider,
                address: apptAddress,
                status: 'CONFIRMED' as const
            },
            updatedAt: new Date().toISOString(),
            stage: (selectedRequest.stage === ServiceStage.REQUESTED || selectedRequest.stage === ServiceStage.EVALUATION) 
                   ? ServiceStage.SCHEDULED 
                   : selectedRequest.stage,
            logs: addLog(selectedRequest, `Turno coordinado: ${apptDate} en ${apptProvider}`)
        };
        updateServiceRequest(updatedReq);
        setSelectedRequest(updatedReq);
        if(!silent) alert("Turno guardado correctamente.");
    };

    const handleWorkshopEntry = () => {
        if (!selectedRequest) return;
        const entryDate = workshopDate || new Date().toISOString().split('T')[0];
        const updatedReq = {
            ...selectedRequest,
            workshopEntry: {
                date: entryDate,
                confirmedBy: user?.name || 'Admin'
            },
            stage: ServiceStage.IN_WORKSHOP,
            updatedAt: new Date().toISOString(),
            logs: addLog(selectedRequest, `Ingreso a Taller confirmado: ${entryDate}`)
        };
        updateServiceRequest(updatedReq);
        setSelectedRequest(updatedReq);
    };

    const handleBudgetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setBudgetFile(base64);
            setIsAnalyzing(true);
            const analysis = await analyzeBudgetImage(base64.split(',')[1]);
            setBudgetData({
                provider: analysis?.provider || '',
                cost: analysis?.totalCost || 0,
                number: analysis?.budgetNumber || '',
                details: analysis?.details || ''
            });
            setIsAnalyzing(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveBudget = () => {
        if (!selectedRequest || !budgetData.cost) return;
        const newBudget: Budget = {
            id: `BG-${Date.now()}`,
            type: 'ORIGINAL',
            file: budgetFile || undefined,
            provider: budgetData.provider || 'S/D',
            budgetNumber: budgetData.number,
            details: budgetData.details || 'Presupuesto cargado',
            totalCost: budgetData.cost,
            date: new Date().toISOString(),
            status: 'PENDING'
        };
        const updatedReq = {
            ...selectedRequest,
            budgets: [...(selectedRequest.budgets || []), newBudget],
            updatedAt: new Date().toISOString(),
            stage: ServiceStage.BUDGETING,
            logs: addLog(selectedRequest, `Nuevo Presupuesto cargado: $${budgetData.cost}`)
        };
        updateServiceRequest(updatedReq);
        setSelectedRequest(updatedReq);
        setBudgetFile(null);
        setBudgetData({ provider: '', cost: 0, number: '', details: '' });
    };

    const renderModalContent = () => {
        if (!selectedRequest) return null;
        
        const isEval = [ServiceStage.REQUESTED, ServiceStage.EVALUATION].includes(selectedRequest.stage);
        const isSched = selectedRequest.stage === ServiceStage.SCHEDULED;
        const isWork = [ServiceStage.IN_WORKSHOP, ServiceStage.BUDGETING, ServiceStage.APPROVAL].includes(selectedRequest.stage);
        const isDeliv = selectedRequest.stage === ServiceStage.DELIVERY || selectedRequest.stage === ServiceStage.CANCELLED;
        const isLocked = isDeliv;
        const isSuperUser = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
                    {/* ... (Modal content identical to previous code, omitted for brevity, ensure all handlers used above are connected) ... */}
                    {/* Re-using same structure as before for the modal content */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedRequest.vehiclePlate}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold uppercase">{selectedRequest.category} - {selectedRequest.subCategory}</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><LucideX size={24}/></button>
                        </div>
                        {errorMsg && (
                            <div className="mb-3 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-start gap-2 animate-pulse">
                                <LucideAlertCircle size={20} className="shrink-0 mt-0.5"/>
                                <div>
                                    <p className="font-bold">No se pudo realizar la acción</p>
                                    <p className="whitespace-pre-wrap">{errorMsg}</p>
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Etapa del Proceso (Control Admin)</label>
                            <div className="relative">
                                <LucideMenu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16}/>
                                <select 
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer ${isLocked ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300 text-slate-700 hover:border-blue-300'}`}
                                    value={selectedRequest.stage}
                                    onChange={(e) => handleStageNavigation(e.target.value as ServiceStage)}
                                    disabled={isLocked || !isSuperUser}
                                >
                                    <optgroup label="Flujo Normal">
                                        <option value={ServiceStage.EVALUATION}>1. Evaluación / Chat</option>
                                        <option value={ServiceStage.SCHEDULED}>2. Coordinación de Turno</option>
                                        <option value={ServiceStage.IN_WORKSHOP}>3. Taller (Recepción)</option>
                                        <option value={ServiceStage.BUDGETING}>3a. Presupuesto</option>
                                        <option value={ServiceStage.APPROVAL}>3b. Aprobación</option>
                                    </optgroup>
                                    <optgroup label="Acción de Cierre">
                                        <option value={ServiceStage.DELIVERY}>✔ FINALIZAR / ENTREGA</option>
                                        <option value={ServiceStage.CANCELLED}>✖ CANCELAR SOLICITUD</option>
                                    </optgroup>
                                </select>
                                {isLocked && <LucideLock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 relative">
                        {isLocked && (
                            <div className="absolute inset-x-0 top-0 bg-red-50 text-red-700 text-xs font-bold text-center py-2 border-b border-red-100 z-10">
                                <LucideLock size={12} className="inline mr-1"/> PROCESO CERRADO - SOLO LECTURA
                            </div>
                        )}
                        {/* Evaluation Chat */}
                        {isEval && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                                    <strong>Problema:</strong> {selectedRequest.description}
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 h-64 overflow-y-auto p-4 space-y-3">
                                    {(() => {
                                        let lastDate = "";
                                        const sortedMessages = [...(selectedRequest.messages || [])].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                                        return sortedMessages.map(msg => {
                                            const msgDate = new Date(msg.timestamp);
                                            const dateStr = msgDate.toLocaleDateString();
                                            const timeStr = msgDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                            const showHeader = lastDate !== dateStr;
                                            lastDate = dateStr;
                                            return (
                                                <React.Fragment key={msg.id}>
                                                    {showHeader && (
                                                        <div className="flex justify-center my-4 sticky top-0 z-10">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm opacity-90">{dateStr}</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] p-2 rounded-lg text-xs shadow-sm ${msg.sender === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>
                                                            <div className="flex justify-between items-center gap-4 mb-1">
                                                                <p className="font-bold opacity-80 text-[9px]">{msg.senderName}</p>
                                                                <p className="opacity-60 text-[9px] font-mono">{timeStr}</p>
                                                            </div>
                                                            <p className="leading-relaxed">{msg.text}</p>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                    {(selectedRequest.messages || []).length === 0 && <p className="text-center text-slate-400 text-xs py-10 italic">No hay mensajes. Inicie la conversación.</p>}
                                </div>
                                {!isLocked && (
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Escribir mensaje..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()}/>
                                        <button onClick={handleSendMessage} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900"><LucideSend size={18}/></button>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Scheduling */}
                        {isSched && (
                            <div className="space-y-6">
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                    <LucideCalendarClock size={32} className="text-indigo-500 mx-auto mb-2"/>
                                    <p className="text-indigo-800 font-bold">Coordinación de Turno</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Fecha</label><input type="date" className="w-full border rounded p-2 text-sm bg-white disabled:bg-slate-100" value={apptDate} onChange={e => setApptDate(e.target.value)} disabled={isLocked}/></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Hora</label><input type="time" className="w-full border rounded p-2 text-sm bg-white disabled:bg-slate-100" value={apptTime} onChange={e => setApptTime(e.target.value)} disabled={isLocked}/></div>
                                    <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Proveedor / Taller</label><input type="text" className="w-full border rounded p-2 text-sm bg-white disabled:bg-slate-100" placeholder="Ej: Concesionario Ford..." value={apptProvider} onChange={e => setApptProvider(e.target.value)} disabled={isLocked}/></div>
                                    <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Dirección del Taller</label><input type="text" className="w-full border rounded p-2 text-sm bg-white disabled:bg-slate-100" placeholder="Ej: Av. San Martín 1234, Ciudad" value={apptAddress} onChange={e => setApptAddress(e.target.value)} disabled={isLocked}/></div>
                                </div>
                                {!isLocked && <button onClick={() => handleConfirmSchedule(false)} className="w-full bg-indigo-600 text-white py-2 rounded font-bold text-sm hover:bg-indigo-700">Guardar Datos de Turno</button>}
                            </div>
                        )}
                        {/* Work & Budget */}
                        {isWork && (
                            <div className="space-y-6">
                                <div className={`flex items-center gap-4 p-3 rounded-lg border ${selectedRequest.workshopEntry ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                    <div className={`p-2 rounded-full ${selectedRequest.workshopEntry ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}><LucideTruck size={20}/></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-slate-700">Ingreso Físico</p>
                                        <p className="text-xs text-slate-500">{selectedRequest.workshopEntry ? `Confirmado: ${selectedRequest.workshopEntry.date}` : 'Pendiente'}</p>
                                        {selectedRequest.workshopEntry && <p className="text-[10px] font-bold text-orange-600 mt-1 flex items-center gap-1"><LucideHourglass size={10}/> Días en Taller: {calculateDaysDiff(selectedRequest.workshopEntry.date)}</p>}
                                    </div>
                                    {!selectedRequest.workshopEntry && !isLocked && (
                                        <div className="flex gap-2">
                                            <input type="date" className="border rounded p-1 text-xs" value={workshopDate} onChange={e => setWorkshopDate(e.target.value)}/>
                                            <button onClick={handleWorkshopEntry} className="bg-orange-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-700">Confirmar</button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-xs text-slate-500 uppercase">Presupuestos</h4>
                                        {!isLocked && (
                                            <label className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700 flex items-center gap-2">
                                                <LucidePlus size={14}/> Cargar <input type="file" className="hidden" accept="image/*" onChange={handleBudgetUpload}/>
                                            </label>
                                        )}
                                    </div>
                                    {budgetFile && !isLocked && (
                                        <div className="bg-purple-50 p-3 rounded border border-purple-200 mb-3 text-xs">
                                            {isAnalyzing ? <span className="flex items-center gap-2"><LucideLoader className="animate-spin"/> Analizando...</span> : (
                                                <div className="flex flex-col gap-2">
                                                    <input type="text" placeholder="Proveedor" className="border rounded p-1" value={budgetData.provider} onChange={e => setBudgetData({...budgetData, provider: e.target.value})}/>
                                                    <input type="number" placeholder="Costo" className="border rounded p-1" value={budgetData.cost} onChange={e => setBudgetData({...budgetData, cost: parseFloat(e.target.value)})}/>
                                                    <button onClick={handleSaveBudget} className="bg-purple-600 text-white p-1 rounded font-bold">Guardar</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedRequest.budgets.map(b => (
                                            <BudgetCard key={b.id} budget={b} onApprove={() => handleBudgetDecision(b.id, 'APPROVED')} onReject={() => handleBudgetDecision(b.id, 'REJECTED')} onClick={() => {}} readOnly={isLocked} />
                                        ))}
                                    </div>
                                </div>
                                {isSuperUser && !isLocked && (
                                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-6">
                                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><LucideCheckCircle size={16}/> Cierre de Servicio</h4>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Salida</label><input type="date" className="w-full border rounded p-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none" value={exitDate} onChange={e => setExitDate(e.target.value)}/></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">KM Salida</label><input type="number" className="w-full border rounded p-2 text-sm bg-white font-bold focus:ring-2 focus:ring-green-500 outline-none" value={exitKm} onChange={e => setExitKm(parseInt(e.target.value))}/></div>
                                        </div>
                                        <div className="mb-3"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones Finales</label><textarea className="w-full border rounded p-2 text-sm bg-white h-20 resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="Detalle de reparación, repuestos, etc..." value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}></textarea></div>
                                        <div className="bg-white p-3 rounded border border-slate-200 mb-4">
                                            <div className="flex justify-between items-center mb-2"><h5 className="font-bold text-xs text-slate-600">FACTURACIÓN FINAL</h5><span className="text-xs font-bold text-green-600">Total Est: ${getTotalCost(selectedRequest).toLocaleString()}</span></div>
                                            <div className="space-y-1 mb-3">
                                                {selectedRequest.delivery?.invoices && selectedRequest.delivery.invoices.map((inv, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                                                        <div className="flex items-center gap-2"><LucideFileText size={14} className="text-blue-500"/><div><span className="font-bold text-slate-700">{inv.invoiceNumber}</span><span className="ml-2 text-slate-500 font-mono">${inv.amount.toLocaleString()}</span></div></div>
                                                        <button onClick={() => handleRemoveInvoice(idx)} className="text-red-400 hover:text-red-600 p-1"><LucideTrash2 size={14}/></button>
                                                    </div>
                                                ))}
                                                {(!selectedRequest.delivery?.invoices || selectedRequest.delivery.invoices.length === 0) && <p className="text-xs text-slate-400 italic">No hay facturas cargadas.</p>}
                                            </div>
                                            {!invoiceFile ? (
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1"><button className="w-full bg-slate-100 text-slate-600 py-1.5 rounded text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1 border border-slate-300"><LucideImage size={12}/> Galería</button><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleInvoiceUpload} /></div>
                                                    <div className="relative flex-1"><button className="w-full bg-slate-100 text-slate-600 py-1.5 rounded text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1 border border-slate-300"><LucideCamera size={12}/> Foto</button><input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleInvoiceUpload} /></div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 p-2 rounded border border-slate-200 animate-fadeIn">
                                                    {isAnalyzingInvoice ? <div className="text-center py-2 text-xs text-blue-600 flex items-center justify-center gap-2"><LucideLoader className="animate-spin" size={14}/> Analizando Comprobante...</div> : (
                                                        <div className="flex gap-2 items-start"><img src={invoiceFile} className="w-10 h-10 object-cover rounded border bg-white" /><div className="flex-1 space-y-1"><input type="text" placeholder="Nro Factura" className="w-full p-1 text-xs border rounded" value={newInvoiceData.number} onChange={e => setNewInvoiceData({...newInvoiceData, number: e.target.value})}/><input type="number" placeholder="Importe $" className="w-full p-1 text-xs border rounded font-bold" value={newInvoiceData.amount || ''} onChange={e => setNewInvoiceData({...newInvoiceData, amount: parseFloat(e.target.value)})}/><div className="flex gap-1 pt-1"><button onClick={() => setInvoiceFile(null)} className="flex-1 bg-white border text-slate-500 py-1 rounded text-[10px] font-bold">Cancelar</button><button onClick={handleAddInvoice} className="flex-1 bg-green-600 text-white py-1 rounded text-[10px] font-bold">Agregar</button></div></div></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={handleFinalizeService} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 transition-transform transform active:scale-95"><LucideCheckCircle size={20}/> FINALIZAR Y ENTREGAR SERVICIO</button>
                                        <p className="text-xs text-center text-slate-500 mt-2">Se actualizará el KM de la unidad y se generará el historial.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {isDeliv && (
                            <div className="space-y-6 text-center">
                                <div className="bg-green-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4"><LucideCheckCircle size={48} className="text-green-500"/></div>
                                <h3 className="text-xl font-bold text-slate-800">Servicio Finalizado / Listo</h3>
                                <p className="text-sm text-slate-500">Costo total (Presupuestos + Facturas): <span className="font-bold text-green-600">${getTotalCost(selectedRequest).toLocaleString()}</span></p>
                                <div className="bg-white p-4 rounded border border-blue-200 text-left relative">
                                    <h4 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2"><LucideReceipt size={16}/> Facturación y Comprobantes</h4>
                                    <div className="space-y-2 mb-3">
                                        {selectedRequest.delivery?.invoices && selectedRequest.delivery.invoices.map((inv, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                                                <div className="flex items-center gap-2"><LucideFileText size={16} className="text-blue-500"/><div><p className="font-bold text-blue-900">{inv.invoiceNumber}</p><p className="text-xs text-blue-600 font-mono">${inv.amount.toLocaleString()}</p></div></div>
                                                {!isLocked && <button onClick={() => handleRemoveInvoice(idx)} className="text-red-400 hover:text-red-600 p-1"><LucideTrash2 size={16}/></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-left space-y-3 bg-white p-4 rounded border border-slate-200 opacity-80">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Fecha Salida</label><input type="date" className="w-full border rounded p-2 text-sm bg-slate-50" value={exitDate} onChange={e => setExitDate(e.target.value)} disabled={true} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">KM Salida</label><input type="number" className="w-full border rounded p-2 text-sm bg-slate-50" value={exitKm} onChange={e => setExitKm(parseInt(e.target.value))} disabled={true} /></div>
                                    <textarea className="w-full border rounded p-2 text-sm bg-slate-50" placeholder="Observaciones finales..." value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} disabled={true}></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                        <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-500 font-bold hover:bg-slate-50 text-sm">Cerrar Ventana</button>
                    </div>
                </div>
            </div>
        );
    };

    // ... (NEW: Define filteredRequests logic)
    const isAdmin = user?.role === UserRole.ADMIN;
    const isMainAdmin = user?.role === UserRole.ADMIN;
    const isManager = user?.role === UserRole.MANAGER;
    const isSuperUser = user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2;
    const userCostCenter = (!isSuperUser && user?.costCenter) ? user.costCenter : null;

    const filteredRequests = serviceRequests.filter(req => {
        if (filterPlate && !req.vehiclePlate.toLowerCase().includes(filterPlate.toLowerCase())) return false;
        if (statusFilter !== 'ALL' && req.stage !== statusFilter) return false;
        if (userCostCenter) {
             const vehicle = vehicles.find(v => v.plate === req.vehiclePlate);
             if (!vehicle || vehicle.costCenter !== userCostCenter) return false;
        } else if (!isSuperUser && !isManager) {
             if (req.userId !== user?.id) return false;
        }
        return true;
    }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // --- EXPORT FUNCTIONS ---
    
    // PDF (Existing logic)
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 153);
        const title = filterPlate ? `Historial de Servicios - Unidad: ${filterPlate}` : "Reporte General de Servicios";
        doc.text(title, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha Generación: ${dateStr}`, 14, 28);
        if (statusFilter !== 'ALL') doc.text(`Filtro Estado: ${statusFilter}`, 14, 34);

        const tableData = filteredRequests.map(r => {
            const cost = getTotalCost(r);
            return [
                new Date(r.createdAt).toLocaleDateString(),
                r.vehiclePlate,
                `${r.category}\n${r.subCategory}`,
                r.description.substring(0, 50) + (r.description.length > 50 ? '...' : ''),
                r.stage,
                `$${cost.toLocaleString()}`
            ];
        });

        const totalCost = filteredRequests.reduce((sum, r) => sum + getTotalCost(r), 0);

        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Patente', 'Tipo/Categoría', 'Descripción', 'Estado', 'Costo Est.']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 153], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25, fontStyle: 'bold' },
                5: { cellWidth: 30, halign: 'right' }
            },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text('Página ' + data.pageNumber, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Costo Total Acumulado: $${totalCost.toLocaleString()}`, 14, finalY);

        doc.save(`reporte_servicios_${filterPlate || 'general'}_${new Date().toISOString().slice(0,10)}.pdf`);
        setShowExportMenu(false);
    };

    // CSV/Excel Export
    const handleExportCSV = () => {
        const headers = ["Fecha", "Patente", "Categoria", "Sub-Categoria", "Descripcion", "Estado", "Costo Estimado", "Solicitante"];
        
        const escape = (val: any) => {
            if (val === undefined || val === null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const dataRows = filteredRequests.map(r => {
            const cost = getTotalCost(r);
            return [
                escape(new Date(r.createdAt).toLocaleDateString()),
                escape(r.vehiclePlate),
                escape(r.category),
                escape(r.subCategory),
                escape(r.description),
                escape(r.stage),
                escape(cost),
                escape(r.requesterName)
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + dataRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_servicios_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    // Email Export
    const handleEmail = () => {
        handleExportPDF(); // Auto download file first
        const subject = encodeURIComponent("Reporte de Servicios Exportado");
        const body = encodeURIComponent("Adjunto encontrará el reporte de servicios solicitado.\n\nNota: Por favor adjunte el archivo PDF que se acaba de descargar.");
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowExportMenu(false);
    };

    if (mode === 'NEW') return <CreateServiceForm onCancel={() => setMode('LIST')} onSubmit={handleCreateSubmit} vehicles={vehicles}/>;

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6 relative">
            {selectedRequest && renderModalContent()}
            {showGuide && <ServiceGuideModal onClose={() => setShowGuide(false)} />}
            
            <ConfirmationModal 
                isOpen={modalConfig.isOpen} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                onConfirm={modalConfig.onConfirm} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
            />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Servicios</h1>
                    <button onClick={() => setShowGuide(true)} className="text-slate-400 hover:text-blue-600"><LucideHelpCircle size={20}/></button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap">
                    <div className="relative">
                        <LucideListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <select 
                            className="w-full sm:w-40 pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ServiceStage | 'ALL')}
                        >
                            <option value="ALL">Todos los Estados</option>
                            <option value={ServiceStage.REQUESTED}>Solicitados</option>
                            <option value={ServiceStage.EVALUATION}>En Evaluación</option>
                            <option value={ServiceStage.SCHEDULED}>Turno Asignado</option>
                            <option value={ServiceStage.IN_WORKSHOP}>En Taller</option>
                            <option value={ServiceStage.BUDGETING}>Presupuestando</option>
                            <option value={ServiceStage.APPROVAL}>Aprobación</option>
                            <option value={ServiceStage.DELIVERY}>Finalizados</option>
                            <option value={ServiceStage.CANCELLED}>Cancelados</option>
                        </select>
                    </div>

                    <div className="relative">
                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Buscar Patente..." 
                            className="w-full sm:w-40 pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterPlate}
                            onChange={(e) => setFilterPlate(e.target.value)}
                        />
                        {filterPlate && (
                            <button onClick={() => setFilterPlate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><LucideX size={14}/></button>
                        )}
                    </div>

                    {/* NEW EXPORT MENU */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition shadow-sm border border-slate-300"
                            title="Opciones de Exportación"
                        >
                            <LucideDownload size={18}/> <span className="hidden sm:inline">Exportar</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1">
                                <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                                    <LucideFileText size={16} /> Exportar PDF
                                </button>
                                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                                    <LucideFileSpreadsheet size={16} /> Exportar Excel/CSV
                                </button>
                                <button onClick={handleEmail} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100">
                                    <LucideMail size={16} /> Enviar por Email
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setMode('NEW')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm"
                    >
                        <LucidePlus size={18}/> <span className="hidden sm:inline">Solicitar Servicio</span><span className="sm:hidden">Nuevo</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRequests.map(req => {
                    const v = vehicles.find(x => x.plate === req.vehiclePlate);
                    const lastMsg = req.messages?.[req.messages.length - 1];
                    const hasUnread = lastMsg?.sender === 'USER';

                    let displayLabel = 'Solicitado';
                    let displayDate = new Date(req.createdAt).toLocaleDateString();
                    let displayIcon = <LucideCalendar size={12}/>;
                    let displayDetail = '';
                    let labelColor = 'text-slate-400';
                    let stripColor = getStageColor(req.stage).split(' ')[0];

                    if (req.stage === ServiceStage.SCHEDULED && req.appointment) {
                        displayLabel = 'Turno Asignado';
                        displayDate = `${new Date(req.appointment.date).toLocaleDateString()} ${req.appointment.time}hs`;
                        displayDetail = `${req.appointment.provider}`;
                        if (req.appointment.address) displayDetail += `\n${req.appointment.address}`;
                        displayIcon = <LucideCalendarClock size={12}/>;
                        labelColor = 'text-indigo-500';
                    } else if (req.stage === ServiceStage.IN_WORKSHOP) {
                        if (req.workshopEntry) {
                            const daysInShop = calculateDaysDiff(req.workshopEntry.date);
                            displayLabel = `EN TALLER (${daysInShop} DÍAS)`;
                            displayDate = `Ingreso: ${new Date(req.workshopEntry.date).toLocaleDateString()}`;
                            displayIcon = <LucideTruck size={12}/>;
                            if (daysInShop > 7) { labelColor = 'text-red-600 font-extrabold animate-pulse'; stripColor = 'bg-red-600'; } 
                            else if (daysInShop > 3) { labelColor = 'text-yellow-600 font-bold'; stripColor = 'bg-yellow-500'; } 
                            else { labelColor = 'text-orange-600 font-bold'; stripColor = 'bg-orange-500'; }
                        } else {
                            displayLabel = 'ESPERANDO INGRESO AL TALLER';
                            displayDate = 'Pendiente Confirmación';
                            displayIcon = <LucideClock size={12}/>;
                            labelColor = 'text-orange-500 animate-pulse font-bold';
                        }
                    } else if (req.stage === ServiceStage.DELIVERY) {
                        displayLabel = 'Finalizado';
                        displayDate = new Date(req.delivery?.date || req.updatedAt).toLocaleDateString();
                        displayIcon = <LucideCheckCircle size={12}/>;
                        labelColor = 'text-green-600';
                    } else if (req.stage === ServiceStage.CANCELLED) {
                        displayLabel = 'Cancelado';
                        displayDate = new Date(req.updatedAt).toLocaleDateString();
                        displayIcon = <LucideXCircle size={12}/>;
                        labelColor = 'text-red-500';
                    }

                    return (
                        <div key={req.id} onClick={() => handleOpenRequest(req)} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${stripColor}`}></div>
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-20">
                                {hasUnread && req.stage === ServiceStage.EVALUATION && <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1 border border-red-700"><LucideMail size={10} /> NUEVO MENSAJE</div>}
                                {isMainAdmin && <button onClick={(e) => handleDeleteRequest(e, req.id)} className="p-1.5 bg-white/80 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-full transition-colors shadow-sm border border-slate-200" title="Eliminar Solicitud"><LucideTrash2 size={14} /></button>}
                            </div>
                            <div className="pl-3 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2 pr-6">
                                        <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{req.vehiclePlate}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${getStageColor(req.stage)}`}>{req.stage === ServiceStage.IN_WORKSHOP ? (req.workshopEntry ? 'EN PROCESO' : 'ESPERA') : req.stage}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{v?.make} {v?.model}</p>
                                </div>
                                <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col justify-end">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase ${labelColor}`}>{displayLabel}</span>
                                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">{displayIcon} {displayDate}</span>
                                            {displayDetail && <span className="text-[10px] text-slate-500 truncate max-w-[140px] font-medium whitespace-pre-wrap" title={displayDetail}>{displayDetail}</span>}
                                        </div>
                                        {!isSuperUser && <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors"><LucideArrowRight size={16}/></div>}
                                    </div>
                                    {isSuperUser && (
                                        <div className="relative mt-1" onClick={e => e.stopPropagation()}>
                                             <select
                                                value={req.stage}
                                                onChange={(e) => handleQuickStageChange(req, e.target.value as ServiceStage)}
                                                disabled={req.stage === ServiceStage.DELIVERY || req.stage === ServiceStage.CANCELLED}
                                                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-sm ${req.stage === ServiceStage.DELIVERY ? 'bg-green-100 text-green-700 border-green-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50 focus:ring-2 focus:ring-blue-100'}`}
                                             >
                                                <option value={ServiceStage.REQUESTED} disabled>Etapa: Solicitado</option>
                                                <option value={ServiceStage.EVALUATION}>1. Evaluación</option>
                                                <option value={ServiceStage.SCHEDULED}>2. Coordinación</option>
                                                <option value={ServiceStage.IN_WORKSHOP}>3. Taller / Ppto</option>
                                                <option value={ServiceStage.DELIVERY}>✔ Finalizar / Entrega</option>
                                                <option value={ServiceStage.CANCELLED}>✖ CANCELAR SOLICITUD</option>
                                             </select>
                                             <LucideChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredRequests.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <LucideListFilter className="mx-auto mb-2 opacity-50" size={32}/>
                        <p>No hay servicios en este estado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};