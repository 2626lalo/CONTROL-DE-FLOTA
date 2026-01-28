
import React, { useState, useRef } from 'react';
import { 
  LucideFlaskConical, LucideMaximize2, LucideLayout, 
  LucideInfo, LucideZap, LucideFileSearch, LucideScaling,
  LucideUpload, LucideTrash2, LucideMapPin, LucideEraser,
  LucideCrosshair, LucideCamera, LucideMessageSquare, LucideX
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface Marker {
  id: number;
  x: number; // Porcentaje de ancho
  y: number; // Porcentaje de alto
  comment: string;
  photo?: string;
}

export const TestSector = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setMarkers([]); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !uploadedImage) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Date.now(),
      x,
      y,
      comment: ''
    };

    setMarkers([...markers, newMarker]);
  };

  const updateMarkerField = (id: number, field: keyof Marker, value: any) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleMarkerPhoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      updateMarkerField(id, 'photo', compressed);
    };
    reader.readAsDataURL(file);
  };

  const deleteMarker = (id: number) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const clearMarkers = () => setMarkers([]);
  const resetCanvas = () => {
    setUploadedImage(null);
    setMarkers([]);
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Cabecera de Módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideFlaskConical className="text-indigo-500" size={24}/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Laboratorio de Mapeo de Daños</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Sector de Pruebas</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Documentación Técnica de Hallazgos</p>
        </div>
        
        <div className="flex gap-3">
          {uploadedImage && (
            <button 
              onClick={clearMarkers}
              className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl flex items-center gap-3 font-black uppercase text-[9px] tracking-widest hover:bg-amber-200 transition-all shadow-sm"
            >
              <LucideEraser size={18}/> Limpiar Todo
            </button>
          )}
          <button 
            onClick={resetCanvas}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black uppercase text-[9px] tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            {uploadedImage ? <LucideTrash2 size={18} className="text-rose-400"/> : <LucideUpload size={18} className="text-blue-400"/>}
            <span>{uploadedImage ? 'Quitar Imagen' : 'Subir Plano'}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        
        {/* LIENZO DE INTERACCIÓN */}
        <div className="bg-white p-2 rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden relative group">
           {!uploadedImage ? (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="bg-slate-50 p-20 rounded-[3.8rem] flex flex-col items-center justify-center min-h-[500px] border-4 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group/upload"
             >
                <div className="p-8 bg-white rounded-[2.5rem] shadow-xl text-slate-300 group-hover/upload:text-blue-500 group-hover/upload:scale-110 transition-all mb-6">
                  <LucideUpload size={48}/>
                </div>
                <p className="text-xl font-black text-slate-400 uppercase italic tracking-tighter group-hover/upload:text-blue-600 transition-colors">Subir Imagen para Mapeo de Siniestro</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Toque para seleccionar archivo</p>
             </div>
           ) : (
             <div className="bg-slate-950 p-8 rounded-[3.8rem] relative overflow-hidden flex items-center justify-center min-h-[600px]">
                
                <div className="absolute top-10 left-10 z-20 flex flex-col gap-3 pointer-events-none">
                   <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                     <LucideCrosshair size={12}/> Mapa de Daños v3.2
                   </div>
                </div>

                <div 
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className="relative z-10 w-full max-w-5xl cursor-crosshair shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
                >
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-auto block select-none" />
                  
                  {/* RENDER DE MARCADORES NUMERADOS */}
                  {markers.map((marker, index) => (
                    <div 
                      key={marker.id}
                      className="absolute w-8 h-8 -ml-4 -mt-4 bg-rose-600 border-2 border-white rounded-full shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-fadeIn flex items-center justify-center text-[10px] font-black text-white"
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
             </div>
           )}
        </div>

        {/* LISTADO DINÁMICO DE COMENTARIOS Y FOTOS */}
        {uploadedImage && markers.length > 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 flex-1"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registro de Hallazgos ({markers.length})</h3>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markers.map((marker, index) => (
                <div key={marker.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all border-t-8 border-t-rose-500">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg italic shadow-lg">
                          {index + 1}
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punto de Control</p>
                      </div>
                      <button onClick={() => deleteMarker(marker.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <LucideX size={18}/>
                      </button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                         <LucideMessageSquare size={10}/> Descripción de Daño
                       </label>
                       <textarea 
                         rows={2}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:ring-4 focus:ring-rose-50 resize-none"
                         placeholder="Describa el daño detectado..."
                         value={marker.comment}
                         onChange={e => updateMarkerField(marker.id, 'comment', e.target.value)}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                         <LucideCamera size={10}/> Evidencia Fotográfica
                       </label>
                       <div className="flex items-center gap-3">
                          {marker.photo ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 group/img shadow-inner">
                               <img src={marker.photo} className="w-full h-full object-cover" alt="Damage evidence" />
                               <button 
                                 onClick={() => updateMarkerField(marker.id, 'photo', undefined)}
                                 className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                               >
                                 <LucideTrash2 size={14}/>
                               </button>
                            </div>
                          ) : (
                            <label className="w-full py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all text-slate-300">
                               <LucideCamera size={24}/>
                               <span className="text-[8px] font-black uppercase mt-1">Capturar Foto</span>
                               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleMarkerPhoto(marker.id, e)} />
                            </label>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
