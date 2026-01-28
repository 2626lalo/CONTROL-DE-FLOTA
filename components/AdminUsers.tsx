
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { User, UserRole, VehicleImage } from '../types';
import { 
  LucideTrash, LucideCheckCircle, LucideShieldAlert, LucideUser, LucideXCircle, 
  LucideBuilding2, LucideChevronDown, LucideAlertTriangle, LucideRefreshCcw, 
  LucideTrash2, LucideAlertCircle, LucideDownload, LucideFileText, 
  LucideFileSpreadsheet, LucideMail, LucidePhone, LucideBell, LucideDatabase, 
  LucideUpload, LucideHardDrive, LucideSave, LucideInfo, LucideCrown,
  LucideSettings2, LucideMessageSquare, LucideBellRing, LucideX, LucideShieldCheck, 
  LucideZap, LucideImage, LucideSearch, LucideCrosshair, LucideSparkles
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { databaseService } from '../services/databaseService';
import { GOLDEN_MASTER_SNAPSHOT } from '../constants';
import { compressImage } from '../utils/imageCompressor';

export const AdminUsers = () => {
    const { registeredUsers, updateUser, deleteUser, vehicles, updateVehicle, checklists, serviceRequests, user, restoreGoldenMaster, addNotification, masterFindingsImage, setMasterFindingsImage } = useApp();
    
    const MAIN_ADMIN_EMAIL = 'alewilczek@gmail.com';
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;

    const handleApproval = (userId: string, approved: boolean) => {
        const userToUpdate = registeredUsers.find(u => u.id === userId);
        if (userToUpdate && userToUpdate.email !== MAIN_ADMIN_EMAIL) {
            updateUser({ ...userToUpdate, approved });
        }
    };

    const handleMasterDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            setMasterFindingsImage(compressed);
            addNotification("Plano maestro de hallazgos actualizado para toda la flota", "success");
        };
        reader.readAsDataURL(file);
    };

    const handleExportBackup = () => {
        const backup = databaseService.exportFullBackup();
        const blob = new Blob([backup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Flota_Enterprise_Backup_v19.3.0.json`;
        a.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">Administración Estratégica</h1>
                    <p className="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-2">Versión de Sistema: {GOLDEN_MASTER_SNAPSHOT.version}</p>
                </div>
            </div>
            
            {/* GESTIÓN DE PLANO MAESTRO GLOBAL */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-slate-950 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideCrosshair size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Maestro de Planos Técnicos (Global)</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Configuración del plano único de hallazgos para toda la flota</p>
                        </div>
                    </div>
                    <div className="hidden md:flex bg-white/5 px-4 py-2 rounded-xl border border-white/10 items-center gap-3">
                         <LucideInfo className="text-blue-400" size={16}/>
                         <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Este plano se utilizará en todos los<br/>Checklists de Inspección Operativa.</p>
                    </div>
                </div>

                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Cargar Nuevo Plano de Hallazgos</label>
                            <label className="w-full py-12 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                                <LucideUpload size={48} className="text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-4"/>
                                <span className="text-sm font-black text-slate-400 uppercase group-hover:text-blue-600 tracking-tighter">Click para seleccionar plano maestro</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase mt-2">Formatos sugeridos: JPG, PNG (Diagrama Técnico)</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleMasterDiagramUpload} />
                            </label>
                        </div>
                        
                        <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><LucideShieldCheck size={20}/></div>
                            <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                                Al cargar una imagen aquí, se habilitará automáticamente la "Sección F: Gestión de Hallazgos" en cada nueva inspección para todas las unidades.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                             <LucideSparkles size={14} className="text-amber-500"/> Previsualización del Plano Vigente
                         </h4>
                         
                         {masterFindingsImage ? (
                             <div className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-inner">
                                <img src={masterFindingsImage} className="w-full h-full object-contain" alt="Master Plan" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => {
                                            if(confirm("¿Eliminar el plano maestro global? Esto deshabilitará la sección de hallazgos en los checklists.")) {
                                                setMasterFindingsImage(null);
                                                addNotification("Plano maestro removido", "warning");
                                            }
                                        }}
                                        className="p-4 bg-rose-600 text-white rounded-2xl shadow-2xl hover:scale-110 transition-all flex items-center gap-2 font-black text-[10px] uppercase"
                                    >
                                        <LucideTrash2 size={18}/> Purgar Plano Maestro
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest">
                                    GESTIÓN DE HALLAZGOS ACTIVA
                                </div>
                             </div>
                         ) : (
                             <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center space-y-4">
                                <LucideImage size={48} className="text-slate-100"/>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center">No se ha definido un plano maestro global.<br/>La sección de hallazgos permanecerá inactiva.</p>
                             </div>
                         )}
                    </div>
                </div>
            </div>
            
            {isMainAdmin && (
              <div className="bg-gradient-to-r from-slate-950 to-indigo-950 rounded-[3rem] p-10 border border-blue-500/30 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <LucideZap className="text-amber-400" size={24}/>
                           <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">Golden Master Recovery</h2>
                           <span className="bg-amber-400 text-slate-900 px-3 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest">Snapshot v19.3.0</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xl">
                          Restauración completa a la versión funcional 19.3.0-STABLE. Este proceso recupera el Checklist integral con mapeo de hallazgos globales, el visor de registros y toda la arquitectura de gestión actual.
                        </p>
                     </div>
                     <button onClick={restoreGoldenMaster} className="px-8 py-5 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-amber-400 transition-all transform active:scale-95">
                        <LucideRefreshCcw size={20}/> Hard Reset v19.3.0
                     </button>
                  </div>
              </div>
            )}

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Directorio de Usuarios Autorizados</h3>
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">{registeredUsers.length} Activos</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 font-black tracking-widest">
                            <tr>
                                <th className="px-10 py-6">Identidad</th>
                                <th className="px-10 py-6">Rol de Acceso</th>
                                <th className="px-10 py-6 text-right">Estado Approval</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {registeredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-800 uppercase text-xs">{u.name}</td>
                                    <td className="px-10 py-6 font-bold text-slate-400 text-[10px] uppercase tracking-wider">{u.role}</td>
                                    <td className="px-10 py-6 text-right">
                                        <button onClick={() => handleApproval(u.id, !u.approved)} className={`p-3 rounded-2xl transition-all ${u.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 hover:scale-110'}`}>
                                            {u.approved ? <LucideCheckCircle size={18}/> : <LucideXCircle size={18}/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Bóveda de Datos Corporativos</h2>
                    <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Exportación compatible con Auditoría v19.3.0</p>
                </div>
                <button onClick={handleExportBackup} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-900/40 relative z-10">
                    <LucideSave size={18}/> Exportar Snapshot JSON v19.3
                </button>
                <LucideDatabase className="absolute -right-10 -bottom-10 opacity-5 text-white" size={200}/>
            </div>
        </div>
    );
};
