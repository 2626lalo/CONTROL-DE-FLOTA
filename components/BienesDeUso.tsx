import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  LucideWarehouse, LucidePlus, LucideSearch, LucideFilter, 
  LucideBox, LucideWrench, LucideCpu, LucideShieldCheck, 
  LucideTrendingUp, LucideDollarSign, LucideCalendar, 
  LucideClock,
  LucideMoreVertical, LucideTrash2, LucideEdit3, LucideFileSpreadsheet,
  LucideDownload, LucideUpload, LucideLoader2, LucideCheckCircle2, LucideInfo, LucideX,
  LucideTags, LucideMapPin, LucideTruck, LucideSave, LucideScale, LucideImage,
  LucideLayers, LucideActivity, LucideHardDrive, LucideAnchor,
  LucideTarget, LucideHash, LucideRefreshCw, LucideUser, LucideUserCheck,
  LucideFileText, LucideCamera, LucideMaximize, LucideEye,
  LucideCreditCard, LucideShieldAlert, LucideRotateCcw
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { BienDeUso } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { compressImage } from '../utils/imageCompressor';
import { ImageZoomModal } from './ImageZoomModal';
import { ConfirmationModal } from './ConfirmationModal';

const MASTER_ADMIN = 'alewilczek@gmail.com';

export const BienesDeUso = () => {
  const { bienesDeUso, bulkUpsertBienes, deleteBien, addNotification, vehicles, authenticatedUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DE FILTRADO AVANZADO
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCC, setFilterCC] = useState('');
  const [filterRegimen, setFilterRegimen] = useState<'TODOS' | 'PROPIO' | 'ALQUILER'>('TODOS');
  const [filterArea, setFilterArea] = useState('');

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Partial<BienDeUso> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BienDeUso | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const isMainAdmin = authenticatedUser?.email === MASTER_ADMIN;
  const canExport = isMainAdmin || authenticatedUser?.permissions?.some(p => p.seccion === 'flota' && p.ver);

  const initialBien: Partial<BienDeUso> = {
    id: '', 
    centroCosto: 'CENTRAL', 
    descripcion: '', 
    marca: '', 
    medida: '', 
    metros: 0,
    matricula: '', 
    propiedad: 'EMPRESA', 
    esAlquiler: false, 
    costoAlquiler: 0,
    valorNeto: 0, 
    observaciones: '', 
    area: '', 
    ubicacion: '', 
    uso: '', 
    peso: 0,
    imagenes: [], 
    proveedor: '', 
    estado: 'Operativo'
  };

  // Obtener listas únicas para los selectores de filtro
  const uniqueCCs = useMemo(() => Array.from(new Set(bienesDeUso.map(b => b.centroCosto))).sort(), [bienesDeUso]);
  const uniqueAreas = useMemo(() => Array.from(new Set(bienesDeUso.map(b => b.area))).filter(Boolean).sort(), [bienesDeUso]);
  const costCentersList = useMemo(() => {
    const fromVehicles = Array.from(new Set(vehicles.map(v => v.costCenter).filter(Boolean)));
    return Array.from(new Set([...fromVehicles, ...uniqueCCs])).sort();
  }, [vehicles, uniqueCCs]);

  // FILTRADO DINÁMICO
  const filteredBienes = useMemo(() => {
    return bienesDeUso.filter(b => {
        const term = searchTerm.toUpperCase();
        const matchesSearch = !searchTerm || 
            b.id.toUpperCase().includes(term) || 
            b.descripcion.toUpperCase().includes(term) || 
            b.marca.toUpperCase().includes(term) ||
            b.matricula.toUpperCase().includes(term);
        
        const matchesStatus = !filterStatus || b.estado === filterStatus;
        const matchesCC = !filterCC || b.centroCosto === filterCC;
        const matchesArea = !filterArea || b.area === filterArea;
        const matchesRegimen = filterRegimen === 'TODOS' || 
            (filterRegimen === 'ALQUILER' ? b.esAlquiler : !b.esAlquiler);

        return matchesSearch && matchesStatus && matchesCC && matchesArea && matchesRegimen;
    });
  }, [bienesDeUso, searchTerm, filterStatus, filterCC, filterArea, filterRegimen]);

  const stats = useMemo(() => {
    const totalNeto = filteredBienes.reduce((acc, b) => acc + (b.valorNeto || 0), 0);
    const totalAlquiler = filteredBienes.reduce((acc, b) => acc + (b.costoAlquiler || 0), 0);
    const rentalCount = filteredBienes.filter(b => b.esAlquiler).length;

    return [
      { label: 'Activos Registrados', val: filteredBienes.length, icon: LucideBox, color: 'blue' },
      { label: 'Unidades de Alquiler', val: rentalCount, icon: LucideRefreshCw, color: 'rose' },
      { label: 'Valorización CapEx', val: `$${totalNeto.toLocaleString()}`, icon: LucideDollarSign, color: 'indigo' },
      { label: 'Inversión OpEx (Mes)', val: `$${totalAlquiler.toLocaleString()}`, icon: LucideTrendingUp, color: 'emerald' },
    ];
  }, [filteredBienes]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterCC('');
    setFilterRegimen('TODOS');
    setFilterArea('');
    addNotification("Filtros restablecidos", "info");
  };

  const handleOpenForm = (e: React.MouseEvent, bien?: BienDeUso) => {
    e.stopPropagation();
    setEditingBien(bien ? { ...bien, imagenes: bien.imagenes || [] } : { ...initialBien });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingBien) return;
    const files = Array.from(e.target.files) as File[];
    addNotification(`Procesando ${files.length} imágenes...`, "warning");
    const compressedImages = [];
    for (const file of files) {
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          resolve(compressed);
        };
        reader.readAsDataURL(file);
      });
      const compressedUrl = await promise;
      compressedImages.push(compressedUrl);
    }
    setEditingBien(prev => prev ? { ...prev, imagenes: [...(prev.imagenes || []), ...compressedImages] } : null);
    addNotification("Imágenes cargadas", "success");
  };

  const removeImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!editingBien) return;
    const newList = [...(editingBien.imagenes || [])];
    newList.splice(index, 1);
    setEditingBien({ ...editingBien, imagenes: newList });
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBien?.id || !editingBien?.descripcion) {
      addNotification("ID y Descripción son obligatorios", "error");
      return;
    }
    const finalBien: BienDeUso = {
      ...(editingBien as BienDeUso),
      id: editingBien.id!.toUpperCase().trim(),
      fechaCarga: editingBien.fechaCarga || new Date().toISOString()
    };
    await bulkUpsertBienes([finalBien]);
    addNotification(editingBien.fechaCarga ? "Registro actualizado" : "Nuevo activo registrado", "success");
    setShowForm(false);
    setEditingBien(null);
  };

  const exportBienesToExcel = () => {
    if (!canExport) return;
    try {
      addNotification("Generando reporte de activos...", "warning");
      const dataToExport = filteredBienes.map(b => ({
        'ID BIEN': b.id,
        'CENTRO COSTO': b.centroCosto,
        'DESCRIPCION': b.descripcion,
        'MARCA': b.marca,
        'MEDIDA': b.medida,
        'METROS': b.metros,
        'MATRICULA': b.matricula,
        'PROPIEDAD': b.propiedad,
        'ES ALQUILER (SI/NO)': b.esAlquiler ? 'SI' : 'NO',
        'COSTO ALQUILER': b.costoAlquiler,
        'VALOR NETO': b.valorNeto,
        'AREA': b.area,
        'UBICACION': b.ubicacion,
        'USO': b.uso,
        'PROVEEDOR': b.proveedor,
        'ESTADO': b.estado
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario_Bienes");
      XLSX.writeFile(wb, `Inventario_Bienes_Uso_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      addNotification("Reporte exportado con éxito", "success");
    } catch (e) {
      addNotification("Error al exportar Excel", "error");
    }
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
            const mappedBienes: BienDeUso[] = jsonData.map((row): BienDeUso | null => {
                const getVal = (possibleKeys: string[]) => {
                  const key = Object.keys(row).find(k => possibleKeys.includes(k.toUpperCase().trim()));
                  return key ? row[key] : undefined;
                };
                const id = String(getVal(['ID BIEN', 'IDBIENES', 'ID', 'CODIGO']) || '').toUpperCase().trim();
                if (!id) return null;
                return {
                    id: id,
                    centroCosto: String(getVal(['CENTRO COSTO', 'CENTRO_COSTO', 'CC']) || 'CENTRAL').toUpperCase(),
                    descripcion: String(getVal(['DESCRIPCION', 'NOMBRE']) || 'SIN DESCRIPCION').toUpperCase(),
                    marca: String(getVal(['MARCA']) || 'S/M').toUpperCase(),
                    medida: String(getVal(['MEDIDA']) || 'N/A'),
                    metros: Number(getVal(['METROS']) || 0),
                    matricula: String(getVal(['MATRICULA', 'PLACA']) || 'S/N').toUpperCase(),
                    propiedad: String(getVal(['PROPIEDAD']) || 'EMPRESA').toUpperCase(),
                    esAlquiler: String(getVal(['ES ALQUILER (SI/NO)', 'DE_ALQUILER', 'ALQUILER']) || '').toUpperCase().includes('SI'),
                    costoAlquiler: Number(getVal(['COSTO ALQUILER', 'COSTO_ALQUILER']) || 0),
                    valorNeto: Number(getVal(['VALOR NETO', 'VALOR_NETO']) || 0),
                    observaciones: String(getVal(['OBSERVACIONES', 'NOTAS']) || ''),
                    area: String(getVal(['AREA']) || '').toUpperCase(),
                    ubicacion: String(getVal(['UBICACION']) || '').toUpperCase(),
                    uso: String(getVal(['USO']) || '').toUpperCase(),
                    peso: Number(getVal(['PESO']) || 0),
                    imagenes: [],
                    proveedor: String(getVal(['PROVEEDOR']) || 'S/P').toUpperCase(),
                    estado: String(getVal(['ESTADO']) || 'Operativo'),
                    fechaCarga: new Date().toISOString()
                };
            }).filter((b): b is BienDeUso => b !== null);
            if (mappedBienes.length > 0) {
                bulkUpsertBienes(mappedBienes);
                addNotification(`${mappedBienes.length} bienes cargados.`, "success");
                setShowSuccessBadge(true);
                setTimeout(() => { setShowSuccessBadge(false); setShowBulkUpload(false); }, 3000);
            }
        } catch (error) { addNotification("Error en Excel", "error"); } finally { setIsBulkLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteConfirm = async () => {
      if (itemToDelete) {
          await deleteBien(itemToDelete);
          addNotification("Activo removido permanentemente", "warning");
          setItemToDelete(null);
      }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      <ConfirmationModal 
        isOpen={!!itemToDelete}
        title="Eliminar Activo"
        message={`¿Está seguro de que desea eliminar permanentemente el activo ${itemToDelete}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
        isDanger={true}
      />

      {/* MODAL DE FORMULARIO MANUAL (ALTA/EDICIÓN) */}
      {showForm && editingBien && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col border-t-[12px] border-blue-600 my-auto" onClick={e => e.stopPropagation()}>
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucideBox size={24}/></div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">{editingBien.fechaCarga ? `Editando Activo: ${editingBien.id}` : 'Alta de Nuevo Bien'}</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-white hover:text-rose-500"><LucideX size={24}/></button>
             </div>
             <form onSubmit={handleSaveManual} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">ID BIEN (Único)</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.id} onChange={e => setEditingBien({...editingBien, id: e.target.value.toUpperCase()})} placeholder="EJ: BU-1029" required disabled={!!editingBien.fechaCarga}/>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Descripción / Nombre</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.descripcion} onChange={e => setEditingBien({...editingBien, descripcion: e.target.value.toUpperCase()})} placeholder="EJ: CONTENEDOR TÉRMICO" required/>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Marca</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.marca} onChange={e => setEditingBien({...editingBien, marca: e.target.value.toUpperCase()})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Matrícula / Serie</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.matricula} onChange={e => setEditingBien({...editingBien, matricula: e.target.value.toUpperCase()})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">C. Costo</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase outline-none" value={editingBien.centroCosto} onChange={e => setEditingBien({...editingBien, centroCosto: e.target.value})}>
                      <option value="">ELIJA C.C.</option>
                      {costCentersList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase outline-none" value={editingBien.estado} onChange={e => setEditingBien({...editingBien, estado: e.target.value})}>
                      <option value="Operativo">OPERATIVO</option>
                      <option value="Stock">EN STOCK</option>
                      <option value="Reparación">EN REPARACIÓN</option>
                      <option value="Baja">BAJA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Régimen Patrimonial</h4>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setEditingBien({...editingBien, esAlquiler: false})} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] transition-all border ${!editingBien.esAlquiler ? 'bg-blue-600 text-white shadow-lg border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>Bien Propio</button>
                        <button type="button" onClick={() => setEditingBien({...editingBien, esAlquiler: true})} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] transition-all border ${editingBien.esAlquiler ? 'bg-rose-600 text-white shadow-lg border-rose-600' : 'bg-white text-slate-400 border-slate-200'}`}>Renting / Alquiler</button>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Neto ($)</label>
                        <input type="number" onFocus={e => e.target.select()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-blue-600 outline-none" value={editingBien.valorNeto} onChange={e => setEditingBien({...editingBien, valorNeto: Number(e.target.value)})}/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Canon Mes ($)</label>
                        <input type="number" onFocus={e => e.target.select()} className={`w-full px-4 py-3 border rounded-xl font-black outline-none ${editingBien.esAlquiler ? 'bg-white border-rose-200 text-rose-600' : 'bg-slate-100 border-transparent text-slate-300 opacity-50'}`} value={editingBien.costoAlquiler} onChange={e => setEditingBien({...editingBien, costoAlquiler: Number(e.target.value)})} disabled={!editingBien.esAlquiler}/>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideCamera size={14}/> Registro Visual ({editingBien.imagenes?.length || 0})</h4>
                   <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {editingBien.imagenes?.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-200">
                          <img src={img} className="w-full h-full object-cover" />
                          <button type="button" onClick={(e) => removeImage(e, idx)} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><LucideTrash2 size={12}/></button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-slate-300">
                        <LucidePlus size={24}/>
                        <span className="text-[8px] font-black uppercase mt-1">Adjuntar</span>
                        <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload}/>
                      </label>
                   </div>
                </div>
                
                <div className="p-8 bg-slate-50 border-t flex gap-4 mt-10">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                    <LucideSave size={18}/> {editingBien.fechaCarga ? 'Actualizar Registro' : 'Generar Alta Patrimonial'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingRecord(null)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-fadeIn flex flex-col border-t-[12px] border-blue-600 my-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl"><LucideBox size={32}/></div>
                <div><h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{viewingRecord.descripcion}</h3><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">ID ACTIVO: {viewingRecord.id}</p></div>
              </div>
              <div className="flex gap-3"><button onClick={(e) => { setViewingRecord(null); handleOpenForm(e, viewingRecord); }} className="p-4 bg-white/10 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-xl"><LucideEdit3 size={20}/></button><button onClick={() => setViewingRecord(null)} className="p-4 bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl"><LucideX size={20}/></button></div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
              {viewingRecord.imagenes && viewingRecord.imagenes.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideImage size={14} className="text-blue-500"/> Registro Visual</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{viewingRecord.imagenes.map((img, idx) => (<div key={idx} className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 relative group cursor-zoom-in" onClick={() => setZoomedImage({url: img, label: viewingRecord.descripcion})}><img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><LucideMaximize size={24} className="text-white"/></div></div>))}</div>
                </div>
              ) : <div className="p-10 border-4 border-dashed border-slate-100 rounded-[3rem] text-center"><LucideCamera size={48} className="mx-auto text-slate-200 mb-4"/><p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Sin evidencia fotográfica</p></div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6"><h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideInfo size={14}/> Técnica</h5><div className="space-y-4">{[{ label: 'Marca', val: viewingRecord.marca, icon: LucideTarget }, { label: 'Medida', val: viewingRecord.medida, icon: LucideScale }, { label: 'Metros', val: `${viewingRecord.metros} m`, icon: LucideActivity }, { label: 'Matrícula', val: viewingRecord.matricula, icon: LucideHash }].map((d, i) => (<div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span><span className="text-xs font-bold text-slate-700 uppercase italic">{d.val || 'N/A'}</span></div>))}</div></div>
                <div className="space-y-6"><h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideMapPin size={14}/> Logística</h5><div className="space-y-4">{[{ label: 'Centro de Costo', val: viewingRecord.centroCosto, icon: LucideLayers }, { label: 'Ubicación', val: viewingRecord.ubicacion, icon: LucideMapPin }, { label: 'Área', val: viewingRecord.area, icon: LucideAnchor }, { label: 'Uso', val: viewingRecord.uso, icon: LucideHardDrive }].map((d, i) => (<div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span><span className="text-xs font-bold text-slate-700 uppercase italic">{d.val || 'N/A'}</span></div>))}</div></div>
                <div className="space-y-6"><h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideDollarSign size={14}/> Finanzas</h5><div className="space-y-4">{[{ label: 'Propiedad', val: viewingRecord.propiedad, icon: LucideShieldCheck }, { label: 'Régimen', val: viewingRecord.esAlquiler ? 'ALQUILER (OPEX)' : 'PROPIO (CAPEX)', icon: LucideTrendingUp }, { label: 'Valor Neto', val: `$${(viewingRecord.valorNeto || 0).toLocaleString()}`, icon: LucideDollarSign }, { label: 'Canon Mensual', val: viewingRecord.esAlquiler ? `$${(viewingRecord.costoAlquiler || 0).toLocaleString()}` : 'N/A', icon: LucideCreditCard }].map((d, i) => (<div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${d.label === 'Valor Neto' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}><span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span><span className={`text-xs font-black uppercase italic ${d.label === 'Valor Neto' ? 'text-blue-600' : 'text-slate-700'}`}>{d.val}</span></div>))}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2"><LucideWarehouse className="text-blue-600" size={24}/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Management System</span></div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Bienes de Uso</h1>
          <p className="text-slate-500 font-bold mt-2 text-xs uppercase tracking-widest">Control técnico y patrimonial integral</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {canExport && (
              <button 
                onClick={exportBienesToExcel}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 hover:bg-emerald-700 active:scale-95"
              >
                <LucideFileSpreadsheet size={20}/> Exportar Inventario
              </button>
            )}
            <button onClick={() => setShowBulkUpload(!showBulkUpload)} className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 ${showBulkUpload ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'}`}><LucideDownload size={20}/> Carga Masiva</button>
            <button onClick={(e) => handleOpenForm(e)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"><LucidePlus size={20}/> Nuevo Activo</button>
        </div>
      </div>

      {showBulkUpload && (
          <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl animate-fadeIn space-y-10 relative overflow-hidden">
             <div className="flex justify-between items-center relative z-10"><div className="flex items-center gap-5"><div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><LucideUpload size={32}/></div><div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Importación Excel</h3><p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Sincronización masiva de inventario</p></div></div><button onClick={() => { const ws = XLSX.utils.aoa_to_sheet([['ID BIEN', 'CENTRO COSTO', 'DESCRIPCION', 'MARCA', 'MEDIDA', 'METROS', 'MATRICULA', 'PROPIEDAD', 'ES ALQUILER (SI/NO)', 'COSTO ALQUILER', 'VALOR NETO', 'AREA', 'UBICACION', 'USO', 'PROVEEDOR', 'ESTADO']]); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Bienes"); XLSX.writeFile(wb, "Plantilla_Bienes.xlsx"); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] transition-all border border-white/10 shadow-lg"><LucideDownload size={16}/> Plantilla</button></div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"><label className={`w-full py-16 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isBulkLoading ? 'bg-indigo-800/50 border-indigo-400' : 'bg-white/5 border-white/20 hover:border-white/40'}`}><LucideUpload size={64} className="text-indigo-400 mb-4"/><span className="text-sm font-black text-indigo-200 uppercase">{isBulkLoading ? 'Cargando...' : 'Seleccionar Archivo'}</span><input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkExcelUpload} disabled={isBulkLoading} /></label><div className="bg-indigo-950/50 p-8 rounded-[2.5rem] border border-white/10 space-y-4"><div className="flex items-center gap-3 text-indigo-400"><LucideInfo size={20}/><h4 className="text-[10px] font-black uppercase tracking-widest">Tips de Carga</h4></div><ul className="space-y-2 text-[9px] font-bold text-indigo-200 uppercase"><li>• ID BIEN: Único identificador.</li><li>• ALQUILER: SI / NO.</li><li>• VALOR NETO: Numérico sin $ ni puntos de miles.</li></ul></div></div>
          </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p><div className={`p-3 rounded-xl bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}><s.icon size={20}/></div></div>
            <h3 className="text-3xl font-black text-slate-800 mt-6 tracking-tighter">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* SISTEMA DE FILTRADO MEJORADO */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 space-y-6 bg-slate-50/20">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="relative w-full lg:max-w-xl">
              <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text" 
                placeholder="BUSCAR POR ID, DESCRIPCIÓN, MARCA O MATRÍCULA..." 
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-8 focus:ring-blue-100 font-black text-xs uppercase transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
               <button 
                onClick={resetFilters}
                className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200"
               >
                 <LucideRotateCcw size={16}/> Limpiar
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100/50">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Estatus Operativo</label>
                <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="">TODOS LOS ESTADOS</option>
                    <option value="Operativo">OPERATIVO</option>
                    <option value="Reparación">EN REPARACIÓN</option>
                    <option value="Stock">EN STOCK</option>
                    <option value="Baja">DE BAJA</option>
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Régimen Patrimonial</label>
                <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500"
                    value={filterRegimen}
                    onChange={e => setFilterRegimen(e.target.value as any)}
                >
                    <option value="TODOS">TODOS (CAPEX + OPEX)</option>
                    <option value="PROPIO">PROPIO (PROPIEDAD EMPRESA)</option>
                    <option value="ALQUILER">ALQUILER / RENTING</option>
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Centro de Costo</label>
                <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500"
                    value={filterCC}
                    onChange={e => setFilterCC(e.target.value)}
                >
                    <option value="">TODOS LOS C.C.</option>
                    {costCentersList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Área Responsable</label>
                <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase outline-none focus:border-blue-500"
                    value={filterArea}
                    onChange={e => setFilterArea(e.target.value)}
                >
                    <option value="">TODAS LAS ÁREAS</option>
                    {uniqueAreas.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[660px] custom-scrollbar">
          <table className="w-full text-left min-w-[3200px] border-separate border-spacing-0">
            <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] sticky top-0 z-30">
              <tr>
                <th className="px-8 py-6 text-white sticky left-0 bg-slate-900 z-40 shadow-[2px_0_10px_rgba(0,0,0,0.2)]">ID / Descripción</th>
                <th className="px-6 py-6"><LucideLayers size={14} className="inline mr-2"/> C. Costo</th>
                <th className="px-6 py-6"><LucideTarget size={14} className="inline mr-2"/> Marca</th>
                <th className="px-6 py-6"><LucideScale size={14} className="inline mr-2"/> Medida</th>
                <th className="px-6 py-6"><LucideActivity size={14} className="inline mr-2"/> Metros</th>
                <th className="px-6 py-6"><LucideHash size={14} className="inline mr-2"/> Matrícula</th>
                <th className="px-6 py-6"><LucideAnchor size={14} className="inline mr-2"/> Propiedad</th>
                <th className="px-6 py-6"><LucideRefreshCw size={14} className="inline mr-2"/> Alquiler</th>
                <th className="px-6 py-6 text-emerald-400"><LucideDollarSign size={14} className="inline mr-2"/> Canon Mensual</th>
                <th className="px-6 py-6 text-blue-400"><LucideDollarSign size={14} className="inline mr-2"/> Valor Neto</th>
                <th className="px-6 py-6"><LucideMapPin size={14} className="inline mr-2"/> Área</th>
                <th className="px-6 py-6"><LucideMapPin size={14} className="inline mr-2"/> Ubicación</th>
                <th className="px-6 py-6 text-center"><LucideActivity size={14} className="inline mr-2"/> Estado</th>
                <th className="px-8 py-6 text-right sticky right-0 bg-slate-900 z-40 shadow-[-2px_0_10px_rgba(0,0,0,0.2)]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBienes.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-all group cursor-pointer" onClick={() => setViewingRecord(item)}>
                  <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-blue-50/40 z-20 min-w-[400px] shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${item.esAlquiler ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-900 text-white border-slate-800'}`}>{item.id.substring(0, 2)}</div>
                      <div className="overflow-hidden"><p className="font-black text-slate-800 text-sm uppercase italic truncate leading-none">{item.descripcion}</p><p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-widest">ID: {item.id}</p></div>
                      {item.imagenes && item.imagenes.length > 0 && (
                        <div className="ml-auto flex -space-x-2">
                           {item.imagenes.slice(0, 3).map((foto, fidx) => (<div key={fidx} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setZoomedImage({url: foto, label: item.descripcion}); }}><img src={foto} className="w-full h-full object-cover" /></div>))}
                           {item.imagenes.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[7px] font-black">+{item.imagenes.length - 3}</div>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6"><span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100">{item.centroCosto}</span></td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-600 uppercase">{item.marca}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase">{item.medida}</td>
                  <td className="px-6 py-6 text-[11px] font-black text-slate-700">{item.metros} m</td>
                  <td className="px-6 py-6 text-[10px] font-black text-slate-800 uppercase italic">{item.matricula}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase">{item.propiedad}</td>
                  <td className="px-6 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${item.esAlquiler ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{item.esAlquiler ? 'Renting' : 'Propio'}</span></td>
                  <td className="px-6 py-6 text-sm font-black text-rose-600 italic">${(item.costoAlquiler || 0).toLocaleString()}</td>
                  <td className="px-6 py-6 text-sm font-black text-blue-600 italic">${(item.valorNeto || 0).toLocaleString()}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase">{item.area}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-700 uppercase italic">{item.ubicacion}</td>
                  <td className="px-6 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${item.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'}`}>{item.estado}</span></td>
                  <td className="px-8 py-6 text-right sticky right-0 bg-white group-hover:bg-blue-50/40 z-20 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => handleOpenForm(e, item)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all bg-white border border-slate-100 rounded-xl shadow-sm"><LucideEdit3 size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all bg-white border border-slate-100 rounded-xl shadow-sm"><LucideTrash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBienes.length === 0 && (
                <tr><td colSpan={18} className="py-40 text-center sticky left-0 w-full bg-white"><LucideBox size={64} className="mx-auto text-slate-100 mb-6"/><p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">No se encontraron registros</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};