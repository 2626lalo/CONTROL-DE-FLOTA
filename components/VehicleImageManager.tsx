
import React, { useState } from 'react';
import { 
    LucideCamera, LucidePlus, LucideImage, LucideAlertTriangle, LucideMaximize, 
    LucideTrash2, LucideDownload, LucideX, LucideClock, LucideShieldCheck,
    LucideFileText, LucideFileSpreadsheet, LucidePaperclip, LucideFileDown,
    LucideSparkles, LucideInfo
} from 'lucide-react';
import { Vehicle, VehicleImage } from '../types';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import { IncidentReportForm } from './IncidentReportForm';
import { ImageZoomModal } from './ImageZoomModal';
import { compressImage } from '../utils/imageCompressor';

interface Props {
  vehicle: Vehicle;
  onUpdate: (updatedVehicle: Vehicle) => void;
}

export const VehicleImageManager: React.FC<Props> = ({ vehicle, onUpdate }) => {
  const platform = usePlatformDetection();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

  const standardViews = [
    { id: 'front', label: 'Vista Frontal', key: 'front' },
    { id: 'rear', label: 'Vista Trasera', key: 'rear' },
    { id: 'left_side', label: 'Lateral Izquierdo', key: 'leftSide' },
    { id: 'right_side', label: 'Lateral Derecho', key: 'rightSide' }
  ];

  const handleStandardUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      const updatedVehicle = {
        ...vehicle,
        images: { ...vehicle.images, [key]: compressed }
      };
      onUpdate(updatedVehicle);
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      const newImg: VehicleImage = {
        id: `ADD-${Date.now()}`,
        url: compressed,
        type: 'standard',
        category: 'view',
        uploadDate: new Date().toISOString(),
        title: 'Foto Adicional'
      };
      onUpdate({ ...vehicle, images: { ...vehicle.images, list: [...(vehicle.images.list || []), newImg] } });
    };
    reader.readAsDataURL(file);
  };

  const updateAdditionalTitle = (id: string, newTitle: string) => {
    const newList = (vehicle.images.list || []).map(img => img.id === id ? { ...img, title: newTitle } : img);
    onUpdate({ ...vehicle, images: { ...vehicle.images, list: newList } });
  };

  const handleSaveIncident = (data: any) => {
    const newIncident: VehicleImage = {
      id: `INC-${Date.now()}`,
      url: data.photos[0] || '', // Principal
      type: 'damage',
      category: 'incident',
      uploadDate: new Date().toISOString(),
      incident: {
        date: data.date,
        locationOnVehicle: data.location,
        severity: data.severity,
        report: data.report,
        status: 'pending',
        photos: data.photos,
        attachments: data.attachments
      }
    };

    onUpdate({ ...vehicle, images: { ...vehicle.images, list: [...(vehicle.images.list || []), newIncident] } });
    setShowIncidentForm(false);
  };

  const handleDeleteAsset = (id: string) => {
    if (!confirm("¿Eliminar este registro permanentemente?")) return;
    const updatedList = (vehicle.images.list || []).filter(img => img.id !== id);
    onUpdate({ ...vehicle, images: { ...vehicle.images, list: updatedList } });
  };

  const downloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      {showIncidentForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <IncidentReportForm onSave={handleSaveIncident} onCancel={() => setShowIncidentForm(false)} />
        </div>
      )}

      {/* RELEVAMIENTO ESTÁNDAR */}
      <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Relevamiento Fotográfico Estándar</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vistas de Identificación Obligatorias</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {standardViews.map(view => {
            const url = (vehicle.images as any)[view.key];
            return (
              <div key={view.id} className="space-y-3">
                <div className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 overflow-hidden relative group cursor-pointer shadow-inner">
                  {url ? (
                    <>
                      <img src={url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                        <button onClick={() => setZoomedImage({url, label: view.label})} className="p-3 bg-white text-slate-800 rounded-2xl shadow-xl"><LucideMaximize size={20}/></button>
                        <label className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-blue-500 transition-all">
                          <LucideCamera size={20}/><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleStandardUpload(view.key, e)} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all">
                      <LucideImage size={32} className="text-slate-200 mb-2"/><span className="text-[9px] font-black text-slate-400 uppercase text-center px-4">{view.label}</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleStandardUpload(view.key, e)} />
                    </label>
                  )}
                </div>
                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{view.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOTOS ADICIONALES Y PLANO DE HALLAZGOS */}
      <section className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-200 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Galería de Activos y Diagramas</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cargas Dinámicas para Reportes Especiales</p>
          </div>
          <div className="flex gap-3">
              <div className="bg-blue-600/10 px-4 py-3 rounded-2xl border border-blue-600/20 flex items-center gap-3">
                 <LucideInfo className="text-blue-600" size={18}/>
                 <p className="text-[8px] font-black text-blue-800 uppercase leading-tight">Para habilitar Mapeo de Daños,<br/> titule una imagen como: <span className="text-blue-600 font-black italic underline">registro hallazgos</span></p>
              </div>
              <label className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 cursor-pointer hover:bg-blue-600 transition-all">
                 <LucidePlus size={18}/> Subir Archivo
                 <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalUpload} />
              </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {(vehicle.images.list || []).filter(img => img.category === 'view').map(img => {
             const isSpecial = img.title?.toLowerCase().trim() === 'registro hallazgos';
             return (
               <div key={img.id} className={`p-4 rounded-[2.5rem] transition-all group ${isSpecial ? 'bg-indigo-600 shadow-2xl ring-4 ring-indigo-100' : 'bg-white shadow-sm border border-slate-100 hover:shadow-xl'}`}>
                  <div className="aspect-video rounded-[1.8rem] overflow-hidden relative shadow-inner mb-4">
                    <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      <button onClick={() => setZoomedImage({url: img.url, label: img.title || 'Foto'})} className="p-3 bg-white rounded-xl text-slate-800 shadow-lg"><LucideMaximize size={16}/></button>
                      <button onClick={() => handleDeleteAsset(img.id)} className="p-3 bg-rose-600 rounded-xl text-white shadow-lg hover:bg-rose-500"><LucideTrash2 size={16}/></button>
                    </div>
                    {isSpecial && (
                        <div className="absolute top-3 left-3 bg-indigo-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                           <LucideSparkles size={10}/> Plano de Hallazgos v3.0
                        </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[8px] font-black uppercase tracking-widest ml-2 flex items-center gap-1 ${isSpecial ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {isSpecial ? 'Nombre de Función Crítica' : 'Título de Referencia'}
                    </label>
                    <input 
                      className={`w-full px-4 py-2 rounded-xl font-black uppercase text-[10px] outline-none border transition-all ${isSpecial ? 'bg-white/10 border-white/20 text-white focus:bg-white focus:text-indigo-600' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`}
                      value={img.title || ''}
                      onChange={e => updateAdditionalTitle(img.id, e.target.value)}
                      placeholder="Ej: registro hallazgos"
                    />
                  </div>
               </div>
             );
           })}
           {(vehicle.images.list || []).filter(img => img.category === 'view').length === 0 && (
               <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                   <LucideImage size={48} className="mx-auto text-slate-100 mb-4"/>
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Cargue planos o fotos adicionales aquí</p>
               </div>
           )}
        </div>
      </section>

      {/* NOVEDADES Y DAÑOS */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-rose-400 flex items-center gap-3"><LucideAlertTriangle size={28}/> Siniestralidad y Documentos de Campo</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Buffer Integral de Registro de Eventos</p>
          </div>
          <button onClick={() => setShowIncidentForm(true)} className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 shadow-xl transition-all"><LucidePlus size={20}/> Registrar Nuevo Daño</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(vehicle.images.list || []).filter(img => img.category === 'incident').map(inc => (
              <div key={inc.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-800 uppercase italic text-base leading-tight">{inc.incident?.locationOnVehicle}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 flex items-center gap-2"><LucideClock size={12}/> {inc.incident?.date}</p>
                      </div>
                      <button onClick={() => handleDeleteAsset(inc.id)} className="text-slate-300 hover:text-rose-500"><LucideTrash2 size={16}/></button>
                    </div>

                    <p className="text-xs text-slate-500 font-medium italic border-l-4 border-rose-100 pl-4">"{inc.incident?.report}"</p>

                    {inc.incident?.photos && inc.incident.photos.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Evidencia Fotográfica ({inc.incident.photos.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {inc.incident.photos.map((p, i) => (
                                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 cursor-zoom-in" onClick={() => setZoomedImage({url: p, label: `Evidencia ${i+1}`})}>
                                        <img src={p} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {inc.incident?.attachments && inc.incident.attachments.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucidePaperclip size={12}/> Documentos de Soporte</p>
                            <div className="grid grid-cols-1 gap-2">
                                {inc.incident.attachments.map(att => (
                                    <div key={att.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between group/att">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {att.fileType.includes('pdf') ? <LucideFileText className="text-rose-500" size={16}/> : <LucideFileSpreadsheet className="text-emerald-500" size={16}/>}
                                            <span className="text-[9px] font-bold text-slate-600 truncate uppercase">{att.name}</span>
                                        </div>
                                        <button onClick={() => downloadFile(att.url, att.name)} className="p-2 bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                            <LucideFileDown size={14}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className={`p-4 text-center font-black uppercase text-[10px] tracking-[0.2em] ${inc.incident?.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    Severidad: {inc.incident?.severity}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};
