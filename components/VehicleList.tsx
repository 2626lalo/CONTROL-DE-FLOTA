import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/FleetContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LucidePlus, LucideSearch, LucideLayoutGrid, LucideList, 
  LucideCar, LucideChevronRight, 
  LucideDatabase, LucideFuel,
  LucideTrash2, LucideBox,
  LucideLoader2,
  LucideFileSpreadsheet,
  LucideDownload,
  LucideFilter,
  LucideXCircle,
  LucideRotateCcw,
  LucideMapPin,
  LucideCalendar,
  LucideTags,
  // Added LucideActivity to fix the missing name error on line 295
  LucideActivity
} from 'lucide-react';
import { VehicleStatus, UserRole, Vehicle, OwnershipType } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

const MASTER_ADMIN = 'alewilczek@gmail.com';

export const VehicleList = () => {
  const { user, authenticatedUser, deleteVehicle, addNotification } = useApp();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  
  // ESTADOS DE FILTRADO PRO
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterProvince, setFilterProvince] = useState('');

  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- LÓGICA DE PERMISOS Y SEGURIDAD (KERNEL) ---
  const isMainAdmin = authenticatedUser?.email === MASTER_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  // Acceso a la totalidad de la flota y exportación
  const hasFullFleetAccess = useMemo(() => {
    if (isMainAdmin) return true;
    return isAdmin && user?.permissions?.some(p => p.seccion === 'flota' && p.ver);
  }, [isMainAdmin, isAdmin, user]);

  // Permiso para CREAR registros (NUEVO REQUERIMIENTO)
  const canCreate = useMemo(() => {
    if (isMainAdmin) return true;
    return isAdmin && user?.permissions?.some(p => p.seccion === 'flota' && p.crear);
  }, [isMainAdmin, isAdmin, user]);

  // Permiso para eliminar registros
  const canDelete = useMemo(() => {
    if (isMainAdmin) return true;
    return isAdmin && user?.permissions?.some(p => p.seccion === 'flota' && p.eliminar);
  }, [isMainAdmin, isAdmin, user]);

  const canExport = hasFullFleetAccess;

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'vehicles'));
        const vehiclesList = querySnapshot.docs.map(doc => {
          return { ...doc.data() };
        }) as Vehicle[];
        setVehicles(vehiclesList);
      } catch (error: any) {
        console.error('Error cargando vehículos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!user) return;
    fetchVehicles();
  }, [user]);

  // --- POOL DE DATOS FILTRADO POR SEGURIDAD ---
  const visiblePool = useMemo(() => {
    if (hasFullFleetAccess) return vehicles;
    const myCC = (user?.costCenter || user?.centroCosto?.nombre || '').toUpperCase();
    return vehicles.filter(v => (v.costCenter || '').toUpperCase() === myCC);
  }, [vehicles, hasFullFleetAccess, user]);

  // --- OPCIONES DINÁMICAS PARA FILTROS ---
  const dynamicOptions = useMemo(() => ({
    costCenters: Array.from(new Set(visiblePool.map(v => v.costCenter).filter(Boolean))).sort(),
    makes: Array.from(new Set(visiblePool.map(v => v.make).filter(Boolean))).sort(),
    years: Array.from(new Set(visiblePool.map(v => v.year || v.adminData?.anio).filter(Boolean))).sort((a, b) => Number(b) - Number(a)),
    provinces: Array.from(new Set(visiblePool.map(v => v.province || v.adminData?.provincia).filter(Boolean))).sort()
  }), [visiblePool]);

  // --- FILTRADO DE UI MEJORADO ---
  const filtered = visiblePool.filter(v => {
    const term = search.toLowerCase();
    const plate = v.plate || '';
    const model = v.model || '';
    const make = v.make || '';
    
    const matchesSearch = plate.toLowerCase().includes(term) || 
                          model.toLowerCase().includes(term) || 
                          make.toLowerCase().includes(term);
    
    const matchesStatus = filterStatus === '' || v.status === filterStatus;
    const matchesCC = filterCC === '' || v.costCenter === filterCC;
    const matchesMake = filterMake === '' || v.make === filterMake;
    const matchesYear = filterYear === '' || String(v.year || v.adminData?.anio) === filterYear;
    const matchesProvince = filterProvince === '' || (v.province || v.adminData?.provincia) === filterProvince;

    return matchesSearch && matchesStatus && matchesCC && matchesMake && matchesYear && matchesProvince;
  });

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCC('');
    setFilterMake('');
    setFilterYear('');
    setFilterProvince('');
    addNotification("Filtros restablecidos", "info");
  };

  const handleDeleteConfirm = async () => {
    if (plateToDelete && canDelete) {
        await deleteVehicle(plateToDelete);
        setVehicles(prev => prev.filter(v => v.plate !== plateToDelete));
        setPlateToDelete(null);
    }
  };

  const exportFleetToExcel = () => {
    if (!canExport) return;
    try {
      addNotification("Generando reporte de flota...", "warning");
      const dataToExport = filtered.map(v => ({
        'TIPO': v.type || '',
        'DOMINIO': v.plate || '',
        'MARCA': v.make || '',
        'MODELO': v.model || '',
        'VERCION': v.version || '',
        'AÑO': v.adminData?.anio || v.year || '',
        'OPERANDO P': v.costCenter || v.adminData?.operandoPara || '',
        'ZONA': v.adminData?.zona || '',
        'PROVINCIA': v.province || v.adminData?.provincia || '',
        'SITIO': v.adminData?.sitio || '',
        'USO': v.adminData?.uso || '',
        'DIRECTOR': v.adminData?.directorResponsable || '',
        'CONDUCTOR': v.adminData?.conductorPrincipal || '',
        'ESTADO': v.status || '',
        'PROPIETARIO': v.adminData?.propietario || '',
        'VALOR LEASING': v.adminData?.leasing_cuotaMensual || 0,
        'FECHA ACTIVACION': v.adminData?.fechaInicioContrato || '',
        'FECHA VENCIMIENTO': v.adminData?.fechaFinContrato || '',
        'TARJETA COMBUSTIBLE': v.adminData?.tarjetaCombustible?.numero || '',
        'PIN': v.adminData?.tarjetaCombustible?.pin || '',
        'LIMITE': v.adminData?.tarjetaCombustible?.limiteMensual || 0,
        'UNIDAD ACTIVA': v.adminData?.unidadActiva ? 'SI' : 'NO'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Flota_Corporativa");
      XLSX.writeFile(wb, `Reporte_Flota_Auditada_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      addNotification("Inventario exportado con éxito", "success");
    } catch (error) {
      addNotification("Error al procesar el archivo Excel", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LucideLoader2 className="text-blue-600 animate-spin" size={48} />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Consultando Inventario en la Nube...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-24">
      <ConfirmationModal 
        isOpen={!!plateToDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar permanentemente la unidad ${plateToDelete}? Esta acción borrara todos sus documentos, historial y fotos.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setPlateToDelete(null)}
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <LucideDatabase className="text-blue-600" size={16}/>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {hasFullFleetAccess ? 'Full Asset Management' : 'Mi Centro de Costo'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Flota Corporativa</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canExport && (
            <button 
              onClick={exportFleetToExcel}
              className="bg-emerald-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-emerald-700"
            >
              <LucideFileSpreadsheet size={18}/> Exportar XLSX
            </button>
          )}
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 flex gap-1">
             <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideLayoutGrid size={18}/>
             </button>
             <button onClick={() => setViewMode('TABLE')} className={`hidden md:block p-2 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <LucideList size={18}/>
             </button>
          </div>
          {canCreate && (
            <Link to="/vehicles/new" className="flex-1 md:flex-none bg-blue-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-blue-700">
                <LucidePlus size={18}/> Nueva Unidad
            </Link>
          )}
        </div>
      </div>

      {visiblePool.length > 0 ? (
        <>
          {/* PANEL DE FILTRADO AVANZADO */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="BUSCAR POR PATENTE, MARCA O MODELO..." 
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-700 uppercase text-sm transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="w-full lg:w-auto px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <LucideRotateCcw size={16}/> Limpiar Filtros
                  </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-50">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideTags size={10}/> Marca</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500" value={filterMake} onChange={e => setFilterMake(e.target.value)}>
                        <option value="">Todas</option>
                        {dynamicOptions.makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideCalendar size={10}/> Año</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                        <option value="">Cualquiera</option>
                        {dynamicOptions.years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideMapPin size={10}/> Provincia</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
                        <option value="">Todas</option>
                        {dynamicOptions.provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {hasFullFleetAccess && (
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideBox size={10}/> Centro de Costo</label>
                        <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500" value={filterCC} onChange={e => setFilterCC(e.target.value)}>
                            <option value="">Todos los C.C.</option>
                            {dynamicOptions.costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                        </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1"><LucideActivity size={10}/> Estado</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Cualquiera</option>
                        {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              </div>
          </div>

          {(viewMode === 'GRID' || window.innerWidth < 768) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filtered.map(v => (
                <div key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all group relative">
                   <div className="h-40 md:h-48 bg-slate-100 relative overflow-hidden">
                      {v.images?.front ? <img src={v.images.front} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={v.plate} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-200"><LucideCar size={40} className="opacity-20"/></div>}
                      
                      {canDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPlateToDelete(v.plate); }}
                          className="absolute top-4 left-4 p-3 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-2xl shadow-xl transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
                          title="Eliminar registro"
                        >
                          <LucideTrash2 size={16}/>
                        </button>
                      )}

                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-50' : 'bg-amber-500'} text-white shadow-lg`}>
                        {v.status}
                      </div>
                   </div>
                   <div className="p-6 md:p-8">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{v.plate}</h3>
                        <span className="text-[8px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500">{v.year || v.adminData?.anio}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{v.make} {v.model}</p>
                      <div className="mt-4 md:mt-6 flex justify-between items-center bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Km Acumulado</span>
                         <span className="text-sm md:text-base font-black text-slate-800">{(v.currentKm || 0).toLocaleString()} KM</span>
                      </div>
                   </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                    <LucideSearch size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-black uppercase text-xs">No hay coincidencias con la búsqueda avanzada</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Unidad / Año</th>
                    <th className="px-8 py-6">Marca / Modelo</th>
                    <th className="px-8 py-6">Kilometraje</th>
                    <th className="px-8 py-6">Centro de Costo</th>
                    <th className="px-8 py-6">Provincia</th>
                    <th className="px-8 py-6">Estado</th>
                    <th className="px-8 py-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(v => (
                    <tr key={v.plate} onClick={() => navigate(`/vehicles/detail/${v.plate}`)} className="hover:bg-blue-50/50 cursor-pointer transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <p className="font-black text-slate-800 text-sm uppercase leading-none">{v.plate}</p>
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{v.year || v.adminData?.anio}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{v.make} {v.model}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-700 text-sm">{(v.currentKm || 0).toLocaleString()} KM</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{v.costCenter}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic">{v.province || v.adminData?.provincia}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${v.status === VehicleStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {canDelete && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPlateToDelete(v.plate); }}
                              className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            >
                              <LucideTrash2 size={16}/>
                            </button>
                          )}
                          <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all" size={24}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                <LucideBox size={60}/>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Acceso Restringido</h2>
            <p className="text-slate-400 font-bold text-xs mt-4 max-w-sm leading-relaxed uppercase tracking-widest">
                No se han detectado unidades registradas para su Centro de Costo <span className="text-blue-600">({(user?.costCenter || user?.centroCosto?.nombre || 'S/N').toUpperCase()})</span>.
                Si cree que esto es un error, contacte al Fleet Manager.
            </p>
            {canCreate && (
              <Link to="/vehicles/new" className="mt-10 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all transform active:scale-95 flex items-center gap-3">
                  <LucidePlus size={22}/> Solicitar Alta de Activo
              </Link>
            )}
        </div>
      )}
    </div>
  );
};
