
import React, { useState } from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';
import { LucideTrash, LucideCheckCircle, LucideShieldAlert, LucideUser, LucideXCircle, LucideBuilding2, LucideChevronDown, LucideAlertTriangle, LucideRefreshCcw, LucideTrash2, LucideAlertCircle, LucideDownload, LucideFileText, LucideFileSpreadsheet, LucideMail, LucidePhone, LucideBell } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AdminUsers = () => {
    // Agregamos 'vehicles' al destructuring para obtener los CC existentes
    const { registeredUsers, updateUser, deleteUser, vehicles, user } = useApp();
    
    const MAIN_ADMIN_EMAIL = 'alewilczek@gmail.com';

    // Modal State
    const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    // Export Menu State
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Obtener lista única de Centros de Costo desde los vehículos cargados
    const uniqueCostCenters = Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean))).sort();

    // Check if current user is Main Admin (Full Access including Delete)
    const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;

    // --- FILTRADO DE SEGURIDAD ---
    const visibleUsers = registeredUsers.filter(targetUser => {
        if (targetUser.email === MAIN_ADMIN_EMAIL) {
            return isMainAdmin; // Solo se muestra si soy yo (el principal)
        }
        return true; 
    });

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, role: newRole });
        }
    };

    const handleApproval = (userId: string, approved: boolean) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, approved });
        }
    };

    const handleCostCenterChange = (userId: string, cc: string) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, costCenter: cc });
        }
    };

    const handleToggleAlerts = (userId: string, currentValue: boolean | undefined) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, receiveAlerts: !currentValue });
        }
    };

    const handlePhoneChange = (userId: string, newPhone: string) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, phone: newPhone });
        }
    };

    const handleFactoryReset = () => {
        setModalConfig({
            isOpen: true,
            title: "⚠ ZONA DE PELIGRO",
            message: "¿Confirma el REINICIO TOTAL?\n\n1. Se ELIMINARÁN todos los Vehículos, Checklists y Servicios.\n2. Se ELIMINARÁN todos los usuarios EXCEPTO al Administrador Principal.\n3. La App quedará vacía para carga manual.",
            onConfirm: () => {
                const allUsers = JSON.parse(localStorage.getItem('fp_users') || '[]');
                const mainAdmin = allUsers.find((u: any) => u.email === MAIN_ADMIN_EMAIL);
                
                const preservedUsers = mainAdmin ? [mainAdmin] : [{
                    id: 'u1',
                    name: 'Ale Wilczek',
                    email: 'alewilczek@gmail.com',
                    role: UserRole.ADMIN,
                    approved: true,
                    password: 'lalo',
                    createdAt: new Date().toISOString()
                }];
                localStorage.setItem('fp_users', JSON.stringify(preservedUsers));
                localStorage.setItem('fp_vehicles', '[]');
                localStorage.setItem('fp_requests', '[]');
                localStorage.setItem('fp_checklists', '[]');
                
                window.location.reload();
            }
        });
    };

    const handleDeleteUser = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: "Eliminar Usuario",
            message: "¿Está seguro? El registro del usuario dejará de existir y perderá el acceso inmediatamente.",
            onConfirm: () => deleteUser(userId)
        });
    };

    // --- EXPORT FUNCTIONS ---
    
    // PDF Export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 153);
        doc.text("Listado de Usuarios Registrados", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha Generación: ${dateStr}`, 14, 28);
        doc.text(`Total Usuarios: ${visibleUsers.length}`, 14, 34);

        const tableData = visibleUsers.map(u => [
            u.name,
            u.email,
            u.phone || 'S/D',
            u.role,
            u.costCenter || 'N/A',
            u.approved ? 'Activo' : 'Pendiente',
            u.receiveAlerts ? 'SI' : 'NO'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Nombre', 'Email', 'Teléfono', 'Rol', 'Centro Costo', 'Estado', 'Alertas']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 153], textColor: 255, fontStyle: 'bold' }
        });

        doc.save(`reporte_usuarios_${new Date().toISOString().slice(0,10)}.pdf`);
        setShowExportMenu(false);
    };

    // CSV/Excel Export
    const handleExportCSV = () => {
        const headers = ["ID", "Nombre", "Email", "Telefono", "Rol", "Centro Costo", "Estado", "Recibe Alertas", "Fecha Alta"];
        
        const escape = (val: any) => {
            if (val === undefined || val === null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const dataRows = visibleUsers.map(u => [
            escape(u.id),
            escape(u.name),
            escape(u.email),
            escape(u.phone),
            escape(u.role),
            escape(u.costCenter || 'N/A'),
            escape(u.approved ? 'ACTIVO' : 'PENDIENTE'),
            escape(u.receiveAlerts ? 'SI' : 'NO'),
            escape(new Date(u.createdAt).toLocaleDateString())
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + dataRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_usuarios_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    // Email Export
    const handleEmail = () => {
        handleExportPDF(); 
        const subject = encodeURIComponent("Reporte de Usuarios de Flota");
        const body = encodeURIComponent("Adjunto encontrará el reporte de usuarios solicitado.\n\nNota: Por favor adjunte el archivo PDF que se acaba de descargar.");
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowExportMenu(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
            <ConfirmationModal 
                isOpen={modalConfig.isOpen} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                onConfirm={modalConfig.onConfirm} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-800">Administración de Usuarios</h1>
                    {!isMainAdmin ? (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-bold border border-yellow-200">
                            MODO GESTIÓN (Restringido)
                        </span>
                    ) : (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-xs font-bold border border-purple-200 flex items-center gap-1">
                            <LucideShieldAlert size={12}/> ACCESO TOTAL (SUPER ADMIN)
                        </span>
                    )}
                </div>

                {/* EXPORT MENU */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="bg-white text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm border border-slate-200"
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
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Teléfono (WhatsApp)</th>
                                <th className="px-6 py-3">Notificaciones WA</th>
                                <th className="px-6 py-3">Centro de Costo (Asignación)</th>
                                <th className="px-6 py-3">Nivel / Rol</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleUsers.map(u => (
                                <tr key={u.id} className={`bg-white border-b hover:bg-slate-50 ${u.id === user?.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            {u.name}
                                            {u.id === user?.id && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">TÚ</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
                                            <LucidePhone size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                            <input 
                                                type="text" 
                                                placeholder="Ej: 54911..." 
                                                className="border rounded pl-7 pr-2 py-1.5 w-32 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={u.phone || ''}
                                                onChange={(e) => handlePhoneChange(u.id, e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleToggleAlerts(u.id, u.receiveAlerts)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${u.receiveAlerts ? 'bg-green-500' : 'bg-slate-200'}`}
                                            title={u.receiveAlerts ? 'Alertas Activadas' : 'Alertas Desactivadas'}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.receiveAlerts ? 'translate-x-6' : 'translate-x-1'}`}/>
                                        </button>
                                        <span className="text-[10px] ml-2 text-slate-500 font-bold">{u.receiveAlerts ? 'ON' : 'OFF'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative w-40">
                                            <LucideBuilding2 size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                            <select 
                                                className="border rounded pl-7 pr-8 py-1.5 w-full text-xs focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-700 font-medium truncate cursor-pointer"
                                                value={u.costCenter || ''}
                                                onChange={(e) => handleCostCenterChange(u.id, e.target.value)}
                                            >
                                                <option value="" className="text-slate-400">-- Ver Todo --</option>
                                                {uniqueCostCenters.map(cc => (
                                                    <option key={cc as string} value={cc as string}>{cc}</option>
                                                ))}
                                            </select>
                                            <LucideChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={u.role} 
                                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                            className="border rounded p-1 text-xs font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                            disabled={u.email === MAIN_ADMIN_EMAIL}
                                        >
                                            <option value={UserRole.ADMIN}>ADMINISTRADOR (Principal)</option>
                                            <option value={UserRole.ADMIN_L2}>ADMINISTRADOR NIVEL 2</option>
                                            <option value={UserRole.MANAGER}>GERENTE (Flota)</option>
                                            <option value={UserRole.DRIVER}>CONDUCTOR (Básico)</option>
                                            <option value={UserRole.GUEST}>INVITADO</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.approved ? (
                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                                <LucideCheckCircle size={12}/> Activo
                                            </span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit animate-pulse">
                                                <LucideShieldAlert size={12}/> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {u.email !== MAIN_ADMIN_EMAIL && (
                                            <>
                                                {!u.approved ? (
                                                    <button onClick={() => handleApproval(u.id, true)} className="text-green-600 hover:underline font-bold text-xs ml-2">Autorizar</button>
                                                ) : (
                                                    <button onClick={() => handleApproval(u.id, false)} className="text-orange-500 hover:underline font-bold text-xs ml-2">Suspender</button>
                                                )}
                                                
                                                {/* DELETE BUTTON IS RESTRICTED TO MAIN ADMIN */}
                                                {isMainAdmin && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 ml-2" title="Eliminar Usuario">
                                                        <LucideTrash size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl text-sm text-blue-800">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-blue-900"><LucideBell size={18}/> Sistema de Alertas Automáticas (WhatsApp)</h3>
                    <ul className="list-disc list-inside ml-2 space-y-1 text-blue-700">
                        <li>Active el interruptor <strong>"Notificaciones WA"</strong> para que el usuario reciba reportes.</li>
                        <li>Debe ingresar un número de teléfono válido con código de país (ej: 54911...).</li>
                        <li>Las alertas se envían desde el Dashboard y se filtran automáticamente según el <strong>Centro de Costo</strong> asignado.</li>
                        <li><strong>Tipos de Alerta:</strong> Documentos Vencidos, Service Requerido (Vencido) y Service Próximo (menos de 1000km).</li>
                    </ul>
                </div>

                {/* FACTORY RESET SECTION - ONLY FOR MAIN ADMIN */}
                {isMainAdmin ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
                                <LucideAlertTriangle /> Zona de Peligro
                            </h3>
                            <p className="text-red-600 text-sm mt-2">
                                <strong>REINICIAR BASE DE DATOS:</strong> Esta acción borrará todos los Vehículos, Checklists y Servicios.
                                <br/><br/>
                                <span className="font-bold text-red-800">ATENCIÓN:</span> Se eliminarán todos los usuarios adicionales, pero <u>SU CUENTA DE ADMINISTRADOR PRINCIPAL SE CONSERVARÁ</u>.
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleFactoryReset}
                                className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <LucideRefreshCcw size={18} /> Reiniciar Base de Datos (Limpiar Todo)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex items-center justify-center">
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                            <LucideShieldAlert/> Zona de Peligro restringida a Admin Principal
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
