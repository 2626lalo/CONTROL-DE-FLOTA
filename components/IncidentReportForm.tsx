
import React, { useState } from 'react';
import { 
    LucideCalendar, LucideMapPin, LucideAlertTriangle, LucideFileText, 
    LucideX, LucideSave, LucideCamera, LucideTrash2, LucideFilePlus,
    LucideImage, LucideFileSpreadsheet, LucideFileDown, LucidePlus, LucidePaperclip
} from 'lucide-react';
import { VehicleImage } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface Props {
  // Fix: Changed data type to any to match the construction logic in VehicleImageManager.tsx
  onSave: (data: any) => void;
  onCancel: () => void;
}

// Fix: Completed component implementation to return valid JSX and resolve type assignment errors
export const IncidentReportForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'minor' as any,
    report: '',
    photos: [] as string[],
    attachments: [] as Array<{ name: string; url: string; fileType: string; id: string }>
  });

  // Fix: Implemented handleImageCapture to process and compress incident photos
  // Added explicit type cast to File[] for e.target.files conversion to resolve unknown type errors on loop variables
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, compressed]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Fix: Implemented handleFileAttachment to allow attaching related documents (PDF/Images)
  // Added explicit type cast to File[] for e.target.files conversion to resolve unknown type errors on loop variables
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment = {
          id: `ATT-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: reader.result as string,
          fileType: file.type
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Fix: Implemented form submission logic to validate and save incident data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.report) {
      alert("Complete los campos obligatorios");
      return;
    }
    onSave(formData);
  };

  // Fix: Added return statement with full JSX implementation for the incident reporting UI
  return (
    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
      <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-600 rounded-2xl shadow-lg"><LucideAlertTriangle size={24}/></div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Reporte de Incidente</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Documentación de Novedades</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-white hover:text-rose-500 transition-colors"><LucideX size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ubicación Daño</label>
            <div className="relative">
              <LucideMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-rose-100" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})} placeholder="Eje: Frontal..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha</label>
            <div className="relative">
              <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-rose-100" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Severidad</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['minor', 'moderate', 'severe', 'critical'].map(sev => (
              <button key={sev} type="button" onClick={() => setFormData({...formData, severity: sev})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.severity === sev ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>{sev}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Informe</label>
          <textarea rows={3} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-100 resize-none" value={formData.report} onChange={e => setFormData({...formData, report: e.target.value})} placeholder="Descripción del hecho..." />
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideCamera size={14}/> Evidencia ({formData.photos.length})</h4>
          <div className="flex flex-wrap gap-4">
            {formData.photos.map((p, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 relative group"><img src={p} className="w-full h-full object-cover" /><button type="button" onClick={() => setFormData(prev => ({...prev, photos: prev.photos.filter((_, idx) => idx !== i)}))} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><LucideTrash2 size={16}/></button></div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-300 transition-all"><LucidePlus size={24}/><input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture}/></label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucidePaperclip size={14}/> Adjuntos ({formData.attachments.length})</h4>
          <div className="space-y-2">
            {formData.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex items-center gap-3 overflow-hidden"><LucideFileText className="text-rose-500 shrink-0" size={16}/><span className="text-[10px] font-bold text-slate-600 truncate uppercase">{att.name}</span></div><button type="button" onClick={() => setFormData(prev => ({...prev, attachments: prev.attachments.filter(a => a.id !== att.id)}))} className="p-1 text-slate-400 hover:text-rose-500"><LucideTrash2 size={14}/></button></div>
            ))}
            <label className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 text-slate-400 font-black uppercase text-[10px]"><LucideFilePlus size={18}/> Adjuntar Acta / PDF<input type="file" accept=".pdf,image/*" multiple className="hidden" onChange={handleFileAttachment}/></label>
          </div>
        </div>
      </form>

      <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
        <button type="button" onClick={onCancel} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancelar</button>
        <button onClick={handleSubmit} className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"><LucideSave size={18}/> Guardar Registro</button>
      </div>
    </div>
  );
};
