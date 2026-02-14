import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/FleetContext';
import { User, UserRole, Vehicle, OwnershipType, FuelType, TransmissionType, VehicleStatus } from '../types';
import { 
  LucideCheckCircle, LucideXCircle, 
  LucideRefreshCcw, LucideTrash2, 
  LucideFileSpreadsheet, LucideMail, LucideDatabase, 
  LucideUpload, LucideSave, LucideInfo, 
  LucideX, LucideZap, LucideImage, LucideCrosshair, LucideSparkles,
  LucideLoader2, LucideDownload, LucideHistory, LucideCheckCircle2
} from 'lucide-react';
import { GOLDEN_MASTER_SNAPSHOT } from '../constants';
import { compressImage } from '../utils/imageCompressor';
import { databaseService } from '../services/databaseService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export const AdminUsers = () => {
    const { vehicles, bulkUpsertVehicles, user, restoreGoldenMaster, addNotification, masterFindingsImage, setMasterFindingsImage, lastBulkLoadDate } = useApp();
    
    const [users, setUsers] = useState<any[]>([]);
    const MAIN_ADMIN_EMAIL = 'alewilczek@gmail.com';
    const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [showSuccessBadge, setShowSuccessBadge] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users from Firestore:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleApproval = async (userId: string, approved: boolean) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate && userToUpdate.email !== MAIN_ADMIN_EMAIL) {
            try {
                await updateDoc(doc(db, 'users', userId), { approved });
                // Actualizar estado local para reflejar el cambio
                setUsers(users.map(u => 
                    u.id === userId ? { ...u, approved } : u
                ));
                addNotification(approved ? "Usuario aprobado" : "Aprobación revocada", "success");
            } catch (error) {
                console.error("Error updating user approval:", error);
                addNotification("Error al actualizar estado", "error");
            }
        }
    };

    const handleMasterDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            setMasterFindingsImage(compressed);
            addNotification("Plano maestro de hallazgos actualizado", "success");
        };
        reader.readAsDataURL(file);
    };

    const downloadTemplate = () => {
        const headers = [
            'TIPO', 'DOMINIO', 'MARCA', 'MODELO', 'VERCION', 'ADICIONALES', 'AÑO', 
            'OPERANDO P', 'ZONA', 'PROVINCIA', 'SITIO', 'USO', 'DIRECTOR', 
            'CONDUCTOR', 'ESTADO', 'PROPIETARIO', 'VALOR LEASING', 
            'FECHA ACTIVACION', 'FECHA VENCIMIENTO', 'TARJETA COMBUSTIBLE', 
            'PIN', 'LIMITE', 'UNIDAD ACTIVA'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Flota");
        XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Flota.xlsx");
    };

    const handleBulkExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBulkLoading(true);
        setShowSuccessBadge(false);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                const mappedVehicles: Vehicle[] = jsonData.map(row => {
                    const plate = String(row.DOMINIO || row.DOMINIO || '').toUpperCase().trim();
                    if (!plate) return null;

                    return {
                        plate: plate,
                        make: String(row.MARCA || 'GENERICO').toUpperCase(),
                        model: String(row.MODELO || 'GENERICO').toUpperCase(),
                        year: Number(row.AÑO || new Date().getFullYear()),
                        vin: 'S/N',
                        motorNum: 'S/N',
                        type: String(row.TIPO || 'Pickup'),
                        version: String(row.VERCION || 'ESTANDAR').toUpperCase(),
                        status: (row.ESTADO || VehicleStatus.ACTIVE) as VehicleStatus,
                        ownership: (row['VALOR LEASING'] ? OwnershipType.LEASING : row['OPERANDO P'] ? OwnershipType.RENTED : OwnershipType.OWNED),
                        costCenter: String(row['OPERANDO P'] || 'SIN ASIGNAR'),
                        province: String(row.PROVINCIA || 'Mendoza'),
                        transmission: TransmissionType.MANUAL,
                        fuelType: FuelType.DIESEL,
                        currentKm: 0,
                        serviceIntervalKm: 10000,
                        nextServiceKm: 10000,
                        images: { list: [] },
                        documents: [],
                        mileageHistory: [],
                        adminData: {
                            regimen: (row['VALOR LEASING'] ? OwnershipType.LEASING : row['OPERANDO P'] ? OwnershipType.RENTED : OwnershipType.OWNED),
                            anio: Number(row.AÑO || new Date().getFullYear()),
                            vigenciaSugerida: 10,
                            fechaCalculoVigencia: new Date().toISOString(),
                            diasRestantesVigencia: 0,
                            aniosRestantesVigencia: 0,
                            operandoPara: String(row['OPERANDO P'] || ''),
                            zona: String(row.ZONA || ''),
                            provincia: String(row.PROVINCIA || ''),
                            sitio: String(row.SITIO || ''),
                            uso: String(row.USO || ''),
                            directorResponsable: String(row.DIRECTOR || ''),
                            conductorPrincipal: String(row.CONDUCTOR || ''),
                            propietario: String(row.PROPIETARIO || ''),
                            tarjetaCombustible: {
                                numero: String(row['TARJETA COMBUSTIBLE'] || ''),
                                pin: String(row.PIN || ''),
                                proveedor: 'YPF',
                                limiteMensual: Number(row.LIMITE || 0),
                                saldoActual: Number(row.LIMITE || 0),
                                fechaVencimiento: '',
                                estado: 'activa'
                            },
                            tarjetaTelepase: { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
                            unidadActiva: String(row['UNIDAD ACTIVA']).toUpperCase() === 'SI' || row['UNIDAD ACTIVA'] === true,
                            leasing_cuotaMensual: Number(row['VALOR LEASING'] || 0),
                            fechaInicioContrato: row['FECHA ACTIVACION'] ? String(row['FECHA ACTIVACION']) : undefined,
                            fechaFinContrato: row['FECHA VENCIMIENTO'] ? String(row['FECHA VENCIMIENTO']) : undefined,
                            leasing_estadoContrato: row['VALOR LEASING'] ? 'activo' : undefined,
                            opcionesListas: {
                                operandoPara: [], zona: [], sitio: [], uso: [], director: [], conductor: [], propietario: []
                            }
                        }
                    } as Vehicle;
                }).filter((v): v is Vehicle => v !== null);

                if (mappedVehicles.length > 0) {
                    bulkUpsertVehicles(mappedVehicles);
                    addNotification(`Sincronización masiva exitosa: ${mappedVehicles.length} unidades procesadas.`, "success");
                    setShowSuccessBadge(true);
                    setTimeout(() => setShowSuccessBadge(false), 5000);
                } else {
                    addNotification("El archivo no contiene datos válidos o el formato de columnas es incorrecto.", "error");
                }
            } catch (error) {
                console.error("Excel Parsing Error:", error);
                addNotification("Fallo crítico al leer el archivo Excel.", "error");
            } finally {
                setIsBulkLoading(false);
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
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
            
            {/* CARGA MASIVA EXCEL */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-indigo-900 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><LucideFileSpreadsheet size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Carga Masiva de Activos (Excel)</h3>
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Sincronización integral de inventario via planilla</p>
                        </div>
                    </div>
                    <button 
                        onClick={downloadTemplate}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-white/10 shadow-lg"
                    >
                        <LucideDownload size={16}/> Descargar Plantilla Modelo
                    </button>
                </div>

                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Cargue el archivo Excel para importar o actualizar unidades. <span className="font-black text-indigo-600">Si el DOMINIO ya existe</span>, el sistema actualizará automáticamente los datos administrativos sin crear duplicados.
                        </p>
                        
                        <div className="relative group">
                            <label className={`w-full py-12 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isBulkLoading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                                {isBulkLoading ? (
                                    <LucideLoader2 size={48} className="text-indigo-500 animate-spin mb-4"/>
                                ) : showSuccessBadge ? (
                                    <LucideCheckCircle2 size={48} className="text-emerald-500 animate-bounce mb-4"/>
                                ) : (
                                    <LucideUpload size={48} className="text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-4"/>
                                )}
                                <span className="text-sm font-black text-slate-400 uppercase group-hover:text-indigo-600 tracking-tighter">
                                    {isBulkLoading ? 'Sincronizando...' : showSuccessBadge ? '¡Proceso Finalizado!' : 'Seleccionar Planilla Excel'}
                                </span>
                                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleBulkExcelUpload} disabled={isBulkLoading} />
                            </label>
                            
                            {showSuccessBadge && (
                                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-fadeIn flex items-center gap-3">
                                    <LucideCheckCircle size={20}/>
                                    <span className="font-black uppercase text-[10px] tracking-widest italic">Archivo cargado correctamente</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <LucideInfo size={20}/>
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Registro de Operaciones</h4>
                        </div>
                        
                        {lastBulkLoadDate && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 animate-fadeIn">
                                <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
                                    <LucideHistory size={18}/>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Última Carga Masiva Realizada</p>
                                    <p className="text-xs font-black text-slate-800 uppercase italic">
                                        {format(parseISO(lastBulkLoadDate), "dd 'de' MMMM 'de' yyyy, HH:mm'hs'", { locale: es })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <ul className="space-y-3 pt-2">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">DOMINIO: Único campo obligatorio e inmutable.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">UNIDAD ACTIVA: Utilice SI / NO.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* RESTO DE LA SECCIÓN ADMINISTRATIVA */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-slate-950 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideCrosshair size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Maestro de Planos Técnicos</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plano único de hallazgos para toda la flota</p>
                        </div>
                    </div>
                </div>
                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <label className="w-full py-12 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all group">
                        <LucideUpload size={48} className="text-slate-300 group-hover:text-blue-500 transition-all mb-4"/>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-tighter">Actualizar Plano Maestro</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleMasterDiagramUpload} />
                    </label>
                    <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200">
                        {masterFindingsImage ? <img src={masterFindingsImage} className="w-full h-full object-contain" /> : <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-[10px]">Sin plano cargado</div>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Directorio de Usuarios Autorizados</h3>
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">{users.length} Activos</span>
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
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-800 uppercase text-xs">{u.nombre}</td>
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
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Copia de Seguridad Corporativa</h2>
                    <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Exportación total del ecosistema</p>
                </div>
                <button onClick={handleExportBackup} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl relative z-10">
                    <LucideSave size={18}/> Exportar Snapshot JSON
                </button>
                <LucideDatabase className="absolute -right-10 -bottom-10 opacity-5 text-white" size={200}/>
            </div>
        </div>
    );
};
