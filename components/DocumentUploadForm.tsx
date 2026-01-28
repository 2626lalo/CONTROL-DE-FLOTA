
import React, { useState, useMemo } from 'react';
import { LucideFileText, LucideCamera, LucideUpload, LucideX, LucidePlus, LucideTrash2, LucideBell, LucideCheck, LucideShieldCheck, LucideSettings, LucideCheckCircle, LucideChevronDown, LucideSearch, LucideMessageCircle, LucideMail, LucideAlertTriangle } from 'lucide-react';
import { Vehicle, Document, CustomField, User } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { useApp } from '../context/FleetContext';

interface Props {
  vehicle: Vehicle;
  existingDoc?: Document;
  availableUsers: User[];
  onSave: (doc: Document) => void;
  onCancel: () => void;
}

export const DocumentUploadForm: React.FC<Props> = ({ vehicle, existingDoc, availableUsers, onSave, onCancel }) => {
  const { documentTypes, addDocumentType, addNotification } = useApp();
  const [showDocTypeMenu, setShowDocTypeMenu] = useState(false);
  const isEditing = !!existingDoc;
  
  const [formData, setFormData] = useState<Partial<Document>>({
    id: existingDoc?.id || `DOC-${Date.now()}`,
    type: existingDoc?.type || '',
    name: existingDoc?.name || '',
    documentNumber: existingDoc?.documentNumber || '',
    issueDate: existingDoc?.issueDate || '',
    expirationDate: existingDoc?.expirationDate || '',
    category: existingDoc?.category || 'legal',
    files: existingDoc?.files || [],
    customFields: existingDoc?.customFields || [],
    alertsEnabled: existingDoc?.alertsEnabled ?? true,
    requiredForOperation: existingDoc?.requiredForOperation ?? true,
    alertSettings: existingDoc?.alertSettings || { daysBeforeExpiration: [30, 15, 7], recipients: [] }
  });

  // FILTRADO DINÁMICO: Excluir tipos ya creados en este vehículo (excepto si estamos editando el actual)
  const filteredDocTypes = useMemo(() => {
    const existingTypes = (vehicle.documents || []).map(d => d.type.toUpperCase());
    return documentTypes.filter(type => {
      if (isEditing && type.toUpperCase() === existingDoc?.type.toUpperCase()) return true;
      return !existingTypes.includes(type.toUpperCase());
    });
  }, [documentTypes, vehicle.documents, isEditing, existingDoc]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({
          ...prev,
          files: [...(prev.files || []), {
            id: `FILE-${Date.now()}-${Math.random()}`,
            name: (file as File).name,
            url: compressed,
            fileType: (file as File).type,
            uploadDate: new Date().toISOString(),
            fileSize: (file as File).size
          }]
        }));
      };
      reader.readAsDataURL(file as Blob);
    }
  };

  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { id: Date.now().toString(), name: '', value: '' }]
    }));
  };

  const updateCustomField = (id: string, field: 'name' | 'value', val: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.map(f => f.id === id ? { ...f, [field]: val } : f)
    }));
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.filter(f => f.id !== id)
    }));
  };

  const toggleChannel = (userId: string, channel: 'whatsapp' | 'email') => {
    const recipients = [...(formData.alertSettings?.recipients || [])];
    const existingIndex = recipients.findIndex(r => r.userId === userId);

    if (existingIndex > -1) {
        const currentChannels = [...recipients[existingIndex].channels];
        const channelIndex = currentChannels.indexOf(channel);
        if (channelIndex > -1) currentChannels.splice(channelIndex, 1);
        else currentChannels.push(channel);

        if (currentChannels.length === 0) recipients.splice(existingIndex, 1);
        else recipients[existingIndex] = { ...recipients[existingIndex], channels: currentChannels };
    } else {
        recipients.push({ userId, channels: [channel] });
    }
    setFormData(prev => ({ ...prev, alertSettings: { ...prev.alertSettings!, recipients } }));
  };

  const isChannelActive = (userId: string, channel: 'whatsapp' | 'email') => {
    const rec = formData.alertSettings?.recipients.find(r => r.userId === userId);
    return rec?.channels.includes(channel) || false;
  };

  const handleSaveInternal = () => {
    if (!formData.type) {
        addNotification("Debe indicar el Tipo de Documento", "error");
        return;
    }

    const typeUpper = formData.type.toUpperCase();
    
    // VALIDACIÓN DE UNICIDAD: Evitar duplicados si es un nuevo registro
    if (!isEditing) {
        const alreadyExists = (vehicle.documents || []).some(d => d.type.toUpperCase() === typeUpper);
        if (alreadyExists) {
            addNotification(`El legajo '${typeUpper}' ya existe para esta unidad. Edite el registro existente.`, "error");
            return;
        }
    }

    addDocumentType(formData.type);
    onSave(formData as Document);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full animate-fadeIn border border-slate-100 flex flex-col md:flex-row max-h-[90vh]">
      {/* Sidebar de Notificaciones */}
      <div className="w-full md:w-80 bg-slate-50 p-8 border-r border-slate-100 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">{isEditing ? 'Editar Legajo' : 'Nuevo Legajo'}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuración de Auditoría</p>
        </div>

        <div className="space-y-4">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <LucideBell size={14} className="text-blue-500"/> Notificar a:
          </label>
          <div className="space-y-2">
             {availableUsers.map(u => (
               <div key={u.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black uppercase truncate text-slate-700">{u.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => toggleChannel(u.id, 'whatsapp')} className={`p-2 rounded-xl transition-all ${isChannelActive(u.id, 'whatsapp') ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}><LucideMessageCircle size={14}/></button>
                    <button type="button" onClick={() => toggleChannel(u.id, 'email')} className={`p-2 rounded-xl transition-all ${isChannelActive(u.id, 'email') ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}><LucideMail size={14}/></button>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="p-5 bg-blue-900 rounded-[2rem] text-white space-y-4 shadow-xl">
           <div className="flex items-center gap-3">
             <LucideShieldCheck size={20} className="text-blue-400"/>
             <span className="text-[10px] font-black uppercase">Filtro Crítico</span>
           </div>
           <label className="flex items-center gap-3 cursor-pointer group">
             <input type="checkbox" className="w-5 h-5 rounded-lg border-white/20 bg-white/10 text-blue-500 focus:ring-0" checked={formData.requiredForOperation} onChange={e => setFormData({...formData, requiredForOperation: e.target.checked})}/>
             <span className="text-[9px] font-black uppercase leading-tight">Legajo Bloqueante</span>
           </label>
        </div>
      </div>

      {/* Formulario Principal */}
      <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2 relative">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Documento</label>
             <div className="relative">
                <input 
                  disabled={isEditing}
                  type="text" 
                  className={`w-full px-6 py-4 rounded-2xl font-black uppercase text-xs outline-none transition-all pr-12 ${isEditing ? 'bg-slate-100 border-transparent text-slate-400 italic' : 'bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100'}`} 
                  placeholder={isEditing ? formData.type : "BUSCAR O ESCRIBIR..."} 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value.toUpperCase()})} 
                  onFocus={() => !isEditing && setShowDocTypeMenu(true)}
                />
                {!isEditing && (
                    <button type="button" onClick={() => setShowDocTypeMenu(!showDocTypeMenu)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><LucideChevronDown size={18}/></button>
                )}
                {showDocTypeMenu && !isEditing && (
                    <div className="absolute z-[1100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn">
                        {filteredDocTypes.length > 0 ? filteredDocTypes.map(type => (
                            <div key={type} className="p-4 font-black text-[10px] uppercase text-slate-600 hover:bg-blue-50 cursor-pointer" onClick={() => { setFormData({...formData, type}); setShowDocTypeMenu(false); }}>{type}</div>
                        )) : (
                          <div className="p-4 text-[9px] font-black text-slate-400 uppercase italic">Todos los tipos estándar ya están asignados</div>
                        )}
                    </div>
                )}
             </div>
             {isEditing && <p className="text-[8px] font-black text-slate-400 uppercase ml-4 mt-1 flex items-center gap-1"><LucideAlertTriangle size={8}/> El tipo es inmutable una vez creado</p>}
           </div>
           <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Número (NRO)</label>
             <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})}/>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha Emisión</label>
             <input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
           </div>
           <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Vencimiento</label>
             <input type="date" className="w-full px-6 py-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-black outline-none" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
           </div>
        </div>

        {/* RESTAURACIÓN: CAMPOS PERSONALIZADOS */}
        <div className="space-y-6">
           <div className="flex justify-between items-center border-b pb-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LucideSettings size={14}/> Metadata Adicional</h4>
             <button type="button" onClick={addCustomField} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:text-blue-800"><LucidePlus size={14}/> Añadir Campo</button>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {formData.customFields?.map((field) => (
                <div key={field.id} className="flex gap-4 items-center animate-fadeIn">
                   <input placeholder="Nombre (ej: Aseguradora)" className="flex-1 text-[10px] font-bold p-3 bg-slate-50 border rounded-xl" value={field.name} onChange={e => updateCustomField(field.id, 'name', e.target.value)} />
                   <input placeholder="Valor" className="flex-1 text-[10px] font-bold p-3 bg-white border border-slate-200 rounded-xl" value={field.value} onChange={e => updateCustomField(field.id, 'value', e.target.value)} />
                   <button type="button" onClick={() => removeCustomField(field.id)} className="p-2 text-slate-300 hover:text-rose-500"><LucideTrash2 size={16}/></button>
                </div>
              ))}
              {(!formData.customFields || formData.customFields.length === 0) && (
                <p className="text-[8px] text-slate-400 uppercase text-center py-4 italic">No hay campos personalizados definidos</p>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><LucideCamera size={14}/> Archivos</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.files?.map(file => (
                <div key={file.id} className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 relative group overflow-hidden">
                   <img src={file.url} className="w-full h-full object-cover" alt="Doc"/>
                   <button type="button" onClick={() => setFormData(prev => ({ ...prev, files: prev.files?.filter(f => f.id !== file.id) }))} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"><LucideTrash2 size={12}/></button>
                </div>
              ))}
              <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all text-slate-400">
                 <LucidePlus size={24}/>
                 <span className="text-[8px] font-black uppercase mt-1">Adjuntar</span>
                 <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload}/>
              </label>
           </div>
        </div>

        <div className="pt-10 flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest border border-slate-200">Cancelar</button>
          <button type="button" onClick={handleSaveInternal} className="flex-[2] bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
             <LucideCheckCircle size={18}/> {isEditing ? 'Sincronizar Cambios' : 'Generar Registro Digital'}
          </button>
        </div>
      </div>
    </div>
  );
};
