import React, { useState, useRef } from 'react';
import { 
  LucideFlaskConical, LucideUpload, LucideTrash2, LucideCrosshair, 
  LucideInfo, LucideZap, LucideScaling, LucideMessageSquare, 
  LucideCamera, LucideX, LucideSave, LucideSparkles, LucideAlertTriangle
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface Marker {
  id: number;
  x: number;
  y: number;
  comment: string;
  photo?: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
}

export const TestSector = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setMarkers([]); 
        setSelectedMarkerId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !uploadedImage) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Date.now(),
      x,
      y,
      comment: '',
      severity: 'minor'
    };

    setMarkers([...markers, newMarker]);
    setSelectedMarkerId(newMarker.id);
  };

  const updateMarker = (id: number, updates: Partial<Marker>) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleMarkerPhoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      updateMarker(id, { photo: compressed });
    };
    reader.readAsDataURL(file);
  };

  const deleteMarker = (id: number) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  const selectedMarker = markers.find(m => m.id === selectedMarkerId);

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Cabecera Técnica */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
               <LucideFlaskConical size={20}/>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ambiente de Desarrollo Experimental</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Sector de Pruebas</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <LucideSparkles size={12} className="text-amber-500"/> Protocolo: Mapeo Cartográfico de Siniestros
          </p>
        </div>
        
        <div className="flex gap-4">
          {uploadedImage && (
            <button 
              onClick={() => { setUploadedImage(null); setMarkers([]); }}
              className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
            >
              <LucideTrash2 size={18}/> Limpiar Mesa
            </button>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-950 text-white px-10 py-5 rounded-[1.8rem] flex items-center gap-4 font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
          >
            <LucideUpload size={22} className="text-blue-400"/> 
            <span>{uploadedImage ? 'Cambiar Base Visual' : 'Cargar Capa de Mapeo'}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* LIENZO CENTRAL */}
        <div className="xl:col-span-3">
          <div className="bg-slate-950 p-2 rounded-[4rem] shadow-2xl border-4 border-slate-900 relative overflow-hidden group">
             {!uploadedImage ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="bg-slate-900/50 p-20 rounded-[3.8rem] flex flex-col items-center justify-center min-h-[600px] border-4 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer group/upload"
               >
                  <div className="p-10 bg-slate-800 rounded-[3rem] shadow-2xl text-slate-600 group-hover/upload:text-blue-400 group-hover/upload:scale-110 transition-all mb-8 border border-white/5">
                    <LucideCrosshair size={64}/>
                  </div>
                  <p className="text-2xl font-black text-slate-500 uppercase italic tracking-tighter group-hover/upload:text-white transition-colors">Digitalizar Superficie</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-4">Sube un plano técnico o foto de unidad para iniciar</p>
               </div>
             ) : (
               <div className="relative animate-fadeIn flex flex-col">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center text-white">
                     <div className="flex items-center gap-4">
                        <div className="bg-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Mapping Mode Active</div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Puntos: {markers.length}</span>
                     </div>
                     <div className="p-2 bg-white/5 rounded-lg border border-white/10 cursor-help" title="Click para marcar hallazgo">
                        <LucideInfo size={16} className="text-slate-500"/>
                     </div>
                  </div>

                  <div 
                    ref={containerRef}
                    onClick={handleImageClick}
                    className="relative p-10 flex items-center justify-center min-h-[700px] cursor-crosshair"
                  >
                    <img 
                      src={uploadedImage} 
                      alt="Base" 
                      className="w-full max-w-5xl h-auto block select-none shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-3xl border border-white/10" 
                    />
                    
                    {markers.map((marker, index) => (
                      <div 
                        key={marker.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(marker.id); }}
                        className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-xs font-black text-white transition-all cursor-pointer hover:scale-125 z-30 ${
                          selectedMarkerId === marker.id ? 'bg-indigo-600 scale-125 ring-8 ring-indigo-500/20' : 
                          marker.severity === 'critical' ? 'bg-rose-600 animate-bounce' : 'bg-slate-900'
                        }`}
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* Rejilla técnica */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               </div>
             )}
          </div>
        </div>

        {/* PANEL DE CONTROL */}
        <div className="xl:col-span-1 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col h-full min-h-[600px]">
              <div className="border-b pb-6 mb-6">
                 <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-3">
                    <LucideZap className="text-indigo-600"/> Inspección Focal
                 </h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detalle de puntos detectados</p>
              </div>

              {!selectedMarker ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-40">
                   <LucideCrosshair size={48} className="text-slate-200"/>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selecciona un marcador para editar su ficha técnica</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-fadeIn space-y-8">
                   <div className="flex justify-between items-center bg-slate-950 p-6 rounded-[2rem] text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg">
                           {markers.findIndex(m => m.id === selectedMarkerId) + 1}
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Hallazgo ID:</p>
                           <p className="text-xs font-bold mt-1 uppercase">LOG_{selectedMarker.id.toString().slice(-4)}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteMarker(selectedMarker.id)} className="p-3 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all">
                        <LucideTrash2 size={18}/>
                      </button>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Severidad</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['minor', 'moderate', 'severe', 'critical'].map(sev => (
                          <button 
                            key={sev} 
                            onClick={() => updateMarker(selectedMarker.id, { severity: sev as any })}
                            className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all border ${selectedMarker.severity === sev ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                        <LucideMessageSquare size={12} className="text-indigo-500"/> Comentario Técnico
                      </label>
                      <textarea 
                        rows={4}
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-bold text-sm text-slate-700 outline-none focus:ring-8 focus:ring-indigo-50 resize-none shadow-inner"
                        placeholder="Describa el daño detectado..."
                        value={selectedMarker.comment}
                        onChange={e => updateMarker(selectedMarker.id, { comment: e.target.value })}
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                        <LucideCamera size={14} className="text-indigo-500"/> Evidencia Fotográfica
                      </label>
                      <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 group">
                         {selectedMarker.photo ? (
                           <>
                             <img src={selectedMarker.photo} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={() => updateMarker(selectedMarker.id, { photo: undefined })} className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl">
                                   <LucideTrash2 size={20}/>
                                </button>
                             </div>
                           </>
                         ) : (
                           <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-slate-300">
                              <LucideCamera size={32} className="mb-2"/>
                              <span className="text-[9px] font-black uppercase">Capturar</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleMarkerPhoto(selectedMarker.id, e)} />
                           </label>
                         )}
                      </div>
                   </div>

                   <button className="mt-auto w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                      <LucideSave size={18}/> Validar Punto
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
               <h4 className="text-3xl font-black uppercase italic tracking-tighter text-blue-400 mb-6">Fase Experimental: Mapeo v4.2</h4>
               <p className="text-slate-300 font-medium leading-relaxed mb-8">
                 Este prototipo permite geolocalizar daños físicos sobre una superficie digitalizada. Al finalizar el pulido, esta función se integrará en el proceso de Inspección Diaria para generar reportes gráficos de siniestralidad.
               </p>
               <div className="flex gap-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                     <LucideAlertTriangle size={18} className="text-amber-400"/>
                     <span className="text-[10px] font-black uppercase tracking-widest">Alerta Temprana de Siniestros</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                     <LucideScaling size={18} className="text-emerald-400"/>
                     <span className="text-[10px] font-black uppercase tracking-widest">Escalado Proporcional Activo</span>
                  </div>
               </div>
            </div>
            <div className="flex justify-center lg:justify-end">
               <LucideFlaskConical size={240} className="text-white opacity-10 animate-pulse"/>
            </div>
         </div>
         <LucideCrosshair className="absolute -bottom-20 -left-20 opacity-5 text-white" size={400}/>
      </div>
    </div>
  );
};