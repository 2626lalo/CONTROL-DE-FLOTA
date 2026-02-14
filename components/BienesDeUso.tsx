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
  // FIX: Added missing icons reported as missing on lines 316 and 338
  LucideCreditCard, LucideShieldAlert
} from 'lucide-react';
import { useApp } from '../context/FleetContext';
import { BienDeUso } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { compressImage } from '../utils/imageCompressor';
import { ImageZoomModal } from './ImageZoomModal';

export const BienesDeUso = () => {
  const { bienesDeUso, bulkUpsertBienes, deleteBien, addNotification, costCenters } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  
  // Estados para el formulario manual y visualización
  const [showForm, setShowForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Partial<BienDeUso> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BienDeUso | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

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

  const stats = useMemo(() => {
    const totalNeto = bienesDeUso.reduce((acc, b) => acc + (b.valorNeto || 0), 0);
    return [
      { label: 'Total Activos', val: bienesDeUso.length, icon: LucideBox, color: 'blue' },
      { label: 'En Servicio', val: bienesDeUso.filter(b => b.estado === 'Operativo').length, icon: LucideShieldCheck, color: 'emerald' },
      { label: 'Patrimonio Neto', val: `$${totalNeto.toLocaleString()}`, icon: LucideDollarSign, color: 'indigo' },
      { label: 'En Alquiler', val: bienesDeUso.filter(b => b.esAlquiler).length, icon: LucideTrendingUp, color: 'rose' },
    ];
  }, [bienesDeUso]);

  const filteredBienes = useMemo(() => {
    const term = searchTerm.toUpperCase();
    return bienesDeUso.filter(b => 
        b.id.toUpperCase().includes(term) || 
        b.descripcion.toUpperCase().includes(term) || 
        b.centroCosto.toUpperCase().includes(term)
    );
  }, [bienesDeUso, searchTerm]);

  const handleOpenForm = (e: React.MouseEvent, bien?: BienDeUso) => {
    e.stopPropagation();
    setEditingBien(bien ? { ...bien, imagenes: bien.imagenes || [] } : { ...initialBien });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingBien) return;
    const files = Array.from(e.target.files) as File[];
    
    addNotification(`Procesando ${files.length} imágenes...`, "warning");
    
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
      setEditingBien(prev => {
        if (!prev) return null;
        return {
          ...prev,
          imagenes: [...(prev.imagenes || []), compressedUrl]
        };
      });
    }
    addNotification("Imágenes optimizadas y cargadas", "success");
  };

  const removeImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!editingBien) return;
    const newList = [...(editingBien.imagenes || [])];
    newList.splice(index, 1);
    setEditingBien({ ...editingBien, imagenes: newList });
  };

  const handleSaveManual = (e: React.FormEvent) => {
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

    bulkUpsertBienes([finalBien]);
    addNotification(editingBien.fechaCarga ? "Activo actualizado correctamente" : "Nuevo activo registrado exitosamente", "success");
    setShowForm(false);
    setEditingBien(null);
  };

  const downloadTemplate = () => {
    const headers = [
        'ID BIEN', 'CENTRO COSTO', 'DESCRIPCION', 'MARCA', 'MEDIDA', 'METROS', 
        'MATRICULA', 'PROPIEDAD', 'ES ALQUILER (SI/NO)', 'COSTO ALQUILER', 
        'VALOR NETO', 'OBSERVACIONES', 'AREA', 'UBICACION', 'USO', 'PESO', 
        'PROVEEDOR', 'ESTADO'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Bienes");
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Bienes.xlsx");
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
                addNotification(`¡Sincronización exitosa! ${mappedBienes.length} bienes cargados.`, "success");
                setShowSuccessBadge(true);
                setTimeout(() => {
                  setShowSuccessBadge(false);
                  setShowBulkUpload(false);
                }, 3000);
            } else {
                addNotification("No se detectaron datos procesables en el archivo.", "error");
            }
        } catch (error) {
            addNotification("Error crítico en la lectura del archivo Excel.", "error");
        } finally {
            setIsBulkLoading(false);
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm(`¿Está seguro de eliminar permanentemente el activo ${id}? Esta acción se puede deshacer.`)) {
          deleteBien(id);
          addNotification("Activo eliminado del inventario", "warning");
      }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      {/* Modal de Detalle Completo */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingRecord(null)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-fadeIn flex flex-col border-t-[12px] border-blue-600 my-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl"><LucideBox size={32}/></div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{viewingRecord.descripcion}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">ID ACTIVO: {viewingRecord.id}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={(e) => { setViewingRecord(null); handleOpenForm(e, viewingRecord); }} className="p-4 bg-white/10 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-xl"><LucideEdit3 size={20}/></button>
                <button onClick={() => setViewingRecord(null)} className="p-4 bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl"><LucideX size={20}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
              {/* Galería de Imágenes en Detalle */}
              {viewingRecord.imagenes && viewingRecord.imagenes.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideImage size={14} className="text-blue-500"/> Registro Visual del Activo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {viewingRecord.imagenes.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 relative group cursor-zoom-in" onClick={() => setZoomedImage({url: img, label: viewingRecord.descripcion})}>
                        <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <LucideMaximize size={24} className="text-white"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 border-4 border-dashed border-slate-100 rounded-[3rem] text-center">
                  <LucideCamera size={48} className="mx-auto text-slate-200 mb-4"/>
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Sin evidencia fotográfica registrada</p>
                </div>
              )}

              {/* Matriz de Datos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideInfo size={14}/> Identificación Técnica</h5>
                  <div className="space-y-4">
                    {[
                      { label: 'Marca', val: viewingRecord.marca, icon: LucideTarget },
                      { label: 'Medida', val: viewingRecord.medida, icon: LucideScale },
                      { label: 'Metros', val: `${viewingRecord.metros} m`, icon: LucideActivity },
                      { label: 'Matrícula', val: viewingRecord.matricula, icon: LucideHash }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span>
                        <span className="text-xs font-bold text-slate-700 uppercase italic">{d.val || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideMapPin size={14}/> Logística y Uso</h5>
                  <div className="space-y-4">
                    {[
                      { label: 'Centro de Costo', val: viewingRecord.centroCosto, icon: LucideLayers },
                      { label: 'Ubicación', val: viewingRecord.ubicacion, icon: LucideMapPin },
                      { label: 'Área', val: viewingRecord.area, icon: LucideAnchor },
                      { label: 'Uso Predominante', val: viewingRecord.uso, icon: LucideHardDrive }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span>
                        <span className="text-xs font-bold text-slate-700 uppercase italic">{d.val || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideDollarSign size={14}/> Gestión Financiera</h5>
                  <div className="space-y-4">
                    {[
                      { label: 'Propiedad', val: viewingRecord.propiedad, icon: LucideShieldCheck },
                      { label: 'Régimen', val: viewingRecord.esAlquiler ? 'ALQUILER (OPEX)' : 'PROPIO (CAPEX)', icon: LucideTrendingUp },
                      { label: 'Valor Neto', val: `$${(viewingRecord.valorNeto || 0).toLocaleString()}`, icon: LucideDollarSign },
                      { label: 'Canon Mensual', val: viewingRecord.esAlquiler ? `$${(viewingRecord.costoAlquiler || 0).toLocaleString()}` : 'N/A', icon: LucideCreditCard }
                    ].map((d, i) => (
                      <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${d.label === 'Valor Neto' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><d.icon size={10}/> {d.label}</span>
                        <span className={`text-xs font-black uppercase italic ${d.label === 'Valor Neto' ? 'text-blue-600' : 'text-slate-700'}`}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observaciones y Estado */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-8 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2"><LucideFileText size={14}/> Notas de Campo</h5>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 min-h-[120px] text-sm font-bold text-slate-500 italic leading-relaxed shadow-inner">
                      {viewingRecord.observaciones ? `"${viewingRecord.observaciones}"` : "Sin anotaciones técnicas adicionales para este activo."}
                    </div>
                 </div>
                 <div className="lg:col-span-4 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2"><LucideActivity size={14}/> Estatus Operativo</h5>
                    <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center justify-center text-center gap-4 shadow-xl ${viewingRecord.estado === 'Operativo' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'}`}>
                        {viewingRecord.estado === 'Operativo' ? <LucideShieldCheck size={48}/> : <LucideShieldAlert size={48} className="animate-pulse"/>}
                        <div>
                          <p className="text-2xl font-black uppercase italic tracking-tighter">{viewingRecord.estado}</p>
                          <p className="text-[9px] font-bold uppercase opacity-60">Condición Actual en Base</p>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"><LucideShieldCheck className="text-blue-600" size={14}/> Certificación Técnica FleetPro v37.0</p>
               <button onClick={() => setViewingRecord(null)} className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"><LucideX size={18}/> Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideWarehouse className="text-blue-600" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Management System</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Bienes de Uso</h1>
          <p className="text-slate-500 font-bold mt-2 text-xs uppercase tracking-widest">Gestión técnica y financiera de activos industriales</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 ${showBulkUpload ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'}`}
            >
                <LucideFileSpreadsheet size={20}/> {showBulkUpload ? 'Cerrar Importador' : 'Carga Masiva'}
            </button>
            <button 
                onClick={(e) => handleOpenForm(e)}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
                <LucidePlus size={20}/> Nuevo Activo
            </button>
        </div>
      </div>

      {/* Importador Excel */}
      {showBulkUpload && (
          <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl animate-fadeIn space-y-10 relative overflow-hidden">
             <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><LucideUpload size={32}/></div>
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Importación Inteligente</h3>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Sincronización masiva de planilla corporativa</p>
                    </div>
                </div>
                <button onClick={downloadTemplate} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-white/10 shadow-lg"><LucideDownload size={16}/> Plantilla Modelo</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <label className={`w-full py-16 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all ${isBulkLoading ? 'bg-indigo-800/50 border-indigo-400' : 'bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10'}`}>
                    {isBulkLoading ? <LucideLoader2 size={64} className="text-indigo-400 animate-spin mb-4"/> : showSuccessBadge ? <LucideCheckCircle2 size={64} className="text-emerald-400 animate-bounce mb-4"/> : <LucideUpload size={64} className="text-indigo-400 mb-4"/>}
                    <span className="text-sm font-black text-indigo-200 uppercase">{isBulkLoading ? 'Procesando registros...' : showSuccessBadge ? '¡Sincronizado!' : 'Seleccionar Archivo Excel'}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkExcelUpload} disabled={isBulkLoading} />
                </label>
                <div className="bg-indigo-950/50 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400"><LucideInfo size={20}/><h4 className="text-[10px] font-black uppercase tracking-widest">Requisitos del archivo</h4></div>
                    <ul className="space-y-2 text-[9px] font-bold text-indigo-200 uppercase">
                        <li>• ID BIEN: Único identificador obligatorio.</li>
                        <li>• CAMPOS TÉCNICOS: Peso (kg), Metros, Medida.</li>
                        <li>• ALQUILER: Indicar "SI" para habilitar canon mensual.</li>
                        <li>• VALOR NETO: Numérico sin símbolos de moneda.</li>
                    </ul>
                </div>
             </div>
          </div>
      )}

      {/* Formulario Modal de Nuevo Activo */}
      {showForm && editingBien && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
              <form onSubmit={handleSaveManual} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex flex-col border-t-[12px] border-blue-600 my-auto" onClick={e => e.stopPropagation()}>
                  <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><LucidePlus size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase italic tracking-tighter">Ficha Técnica de Activo</h3>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ingreso Individual a Base de Datos</p>
                          </div>
                      </div>
                      <button type="button" onClick={() => setShowForm(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX size={24}/></button>
                  </div>
                  
                  <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      {/* Identificación */}
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">ID Bien</label>
                          <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.id} onChange={e => setEditingBien({...editingBien, id: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Descripción General</label>
                          <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.descripcion} onChange={e => setEditingBien({...editingBien, descripcion: e.target.value.toUpperCase()})} />
                      </div>

                      {/* Especificaciones */}
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Marca</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.marca} onChange={e => setEditingBien({...editingBien, marca: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Medida</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.medida} onChange={e => setEditingBien({...editingBien, medida: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Matrícula / Serie</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.matricula} onChange={e => setEditingBien({...editingBien, matricula: e.target.value.toUpperCase()})} />
                      </div>

                      {/* Logística */}
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Centro de Costo</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black uppercase text-xs" value={editingBien.centroCosto} onChange={e => setEditingBien({...editingBien, centroCosto: e.target.value})}>
                              {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Ubicación Actual</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.ubicacion} onChange={e => setEditingBien({...editingBien, ubicacion: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Área Responsable</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.area} onChange={e => setEditingBien({...editingBien, area: e.target.value.toUpperCase()})} />
                      </div>

                      {/* Multimedia */}
                      <div className="col-span-3 space-y-4 border-y border-slate-100 py-8 my-4 bg-slate-50/50 rounded-[2rem] px-6">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <LucideCamera size={14} className="text-blue-500"/> Registro Fotográfico Multi-Archivo
                            </label>
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">{editingBien.imagenes?.length || 0} Fotos</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                           {editingBien.imagenes?.map((img, idx) => (
                             <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-white relative group border border-slate-200 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button type="button" onClick={() => setZoomedImage({url: img, label: `Evidencia ${idx+1}`})} className="p-2 bg-white text-slate-800 rounded-lg shadow-xl hover:bg-blue-600 hover:text-white transition-all"><LucideMaximize size={14}/></button>
                                  <button type="button" onClick={(e) => removeImage(e, idx)} className="p-2 bg-rose-600 text-white rounded-lg shadow-xl hover:bg-rose-700 transition-all"><LucideTrash2 size={14}/></button>
                                </div>
                             </div>
                           ))}
                           <label className="aspect-square rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white text-slate-300 transition-all hover:border-blue-300 group">
                              <LucidePlus size={32} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[8px] font-black uppercase mt-1">Añadir Fotos</span>
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                           </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Uso Predominante</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.uso} onChange={e => setEditingBien({...editingBien, uso: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Estado Físico</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100" value={editingBien.estado} onChange={e => setEditingBien({...editingBien, estado: e.target.value})}>
                              <option value="Operativo">Operativo</option>
                              <option value="Reparación">En Reparación</option>
                              <option value="Baja">De Baja</option>
                              <option value="Stock">En Stock</option>
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Proveedor Origen</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.proveedor} onChange={e => setEditingBien({...editingBien, proveedor: e.target.value.toUpperCase()})} />
                      </div>

                      {/* Financiero */}
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo Propiedad</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase text-xs" value={editingBien.propiedad} onChange={e => setEditingBien({...editingBien, propiedad: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="flex items-center gap-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-[9px] font-black text-blue-600 uppercase">Es Alquiler</span>
                          <input type="checkbox" className="w-6 h-6 rounded border-blue-300 text-blue-600 focus:ring-0" checked={editingBien.esAlquiler} onChange={e => setEditingBien({...editingBien, esAlquiler: e.target.checked})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Costo Alquiler ($)</label>
                          <input type="number" disabled={!editingBien.esAlquiler} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black text-xs disabled:opacity-30" value={editingBien.costoAlquiler} onChange={e => setEditingBien({...editingBien, costoAlquiler: Number(e.target.value)})} />
                      </div>

                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Valor Neto ($)</label>
                          <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black text-xs" value={editingBien.valorNeto} onChange={e => setEditingBien({...editingBien, valorNeto: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Peso Estimado (kg)</label>
                          <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black text-xs" value={editingBien.peso} onChange={e => setEditingBien({...editingBien, peso: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Metros Lineales</label>
                          <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black text-xs" value={editingBien.metros} onChange={e => setEditingBien({...editingBien, metros: Number(e.target.value)})} />
                      </div>

                      <div className="col-span-3 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Observaciones Técnicas</label>
                          <textarea rows={3} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-100" value={editingBien.observaciones} onChange={e => setEditingBien({...editingBien, observaciones: e.target.value})} />
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                      <button type="submit" className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                          <LucideSave size={20}/> Sincronizar con Base de Datos
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className={`p-3 rounded-xl bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}><s.icon size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mt-6 tracking-tighter">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Tabla Integral con Scroll Doble y Límite Visual de 10 registros */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
          <div className="relative w-full max-w-lg">
            <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por ID, descripción o centro de costo..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm uppercase"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="p-4 bg-white text-slate-400 rounded-2xl hover:text-blue-600 transition-all border border-slate-200"><LucideFilter size={20}/></button>
          </div>
        </div>

        {/* Contenedor con scroll vertical limitado a aproximadamente 10 filas (~65px cada una) */}
        <div className="overflow-x-auto overflow-y-auto max-h-[660px] custom-scrollbar border-b border-slate-100">
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
                <th className="px-6 py-6"><LucideHardDrive size={14} className="inline mr-2"/> Uso</th>
                <th className="px-6 py-6"><LucideScale size={14} className="inline mr-2"/> Peso (kg)</th>
                <th className="px-6 py-6"><LucideUser size={14} className="inline mr-2"/> Proveedor</th>
                <th className="px-6 py-6 text-center"><LucideActivity size={14} className="inline mr-2"/> Estado</th>
                <th className="px-8 py-6 text-right sticky right-0 bg-slate-900 z-40 shadow-[-2px_0_10px_rgba(0,0,0,0.2)]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBienes.map(item => (
                <tr 
                  key={item.id} 
                  className="hover:bg-blue-50/40 transition-all group cursor-pointer"
                  onClick={() => setViewingRecord(item)}
                >
                  <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-blue-50/40 z-20 min-w-[400px] shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${item.esAlquiler ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-900 text-white border-slate-800'}`}>
                        {item.id.substring(0, 2)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm uppercase italic truncate leading-none">{item.descripcion}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-widest">ID: {item.id}</p>
                      </div>
                      {item.imagenes && item.imagenes.length > 0 && (
                        <div className="ml-auto flex -space-x-2">
                           {item.imagenes.slice(0, 3).map((foto, fidx) => (
                             <div key={fidx} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setZoomedImage({url: foto, label: item.descripcion}); }}>
                                <img src={foto} className="w-full h-full object-cover" />
                             </div>
                           ))}
                           {item.imagenes.length > 3 && (
                             <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[7px] font-black">+{item.imagenes.length - 3}</div>
                           )}
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
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${item.esAlquiler ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {item.esAlquiler ? 'Renting' : 'Propio'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm font-black text-rose-600 italic">${(item.costoAlquiler || 0).toLocaleString()}</td>
                  <td className="px-6 py-6 text-sm font-black text-blue-600 italic">${(item.valorNeto || 0).toLocaleString()}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase">{item.area}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-700 uppercase italic">{item.ubicacion}</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-600 uppercase">{item.uso}</td>
                  <td className="px-6 py-6 text-[11px] font-black text-slate-700">{item.peso} kg</td>
                  <td className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase">{item.proveedor}</td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      item.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right sticky right-0 bg-white group-hover:bg-blue-50/40 z-20 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => handleOpenForm(e, item)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all bg-white border border-slate-100 rounded-xl shadow-sm"><LucideEdit3 size={16}/></button>
                      <button onClick={(e) => handleConfirmDelete(e, item.id)} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all bg-white border border-slate-100 rounded-xl shadow-sm"><LucideTrash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBienes.length === 0 && (
                <tr>
                  <td colSpan={18} className="py-40 text-center sticky left-0 w-full bg-white">
                    <LucideBox size={64} className="mx-auto text-slate-100 mb-6"/>
                    <p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">No se encontraron registros para la búsqueda aplicada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Salud Patrimonial</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Asset Liquidity Analytics</p>
            <div className="space-y-8">
                <div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">
                        <span>Disponibilidad Operativa Global</span>
                        <span>{bienesDeUso.length > 0 ? Math.round((bienesDeUso.filter(b => b.estado === 'Operativo').length / bienesDeUso.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                        <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/50"
                            style={{ width: `${bienesDeUso.length > 0 ? (bienesDeUso.filter(b => b.estado === 'Operativo').length / bienesDeUso.length) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>
          </div>
          <LucideTrendingUp className="absolute -right-10 -bottom-10 opacity-5" size={260}/>
        </div>

        <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
          <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-3 border-b pb-4"><LucideCalendar className="text-blue-600"/> Cronograma de Auditoría</h4>
          <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl shrink-0">
                  <p className="text-[10px] font-black uppercase opacity-60">JUN</p>
                  <p className="text-3xl font-black leading-none">15</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Relevamiento Físico Programado</p>
                <h5 className="text-lg font-black text-slate-800 uppercase italic mt-1">Auditoría de Stock Patrimonial</h5>
              </div>
          </div>
          <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-[0.98]">Exportar Reporte de Auditoría</button>
        </div>
      </div>
    </div>
  );
};