// FIX: Added useMemo to React imports to resolve line 51 error
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { Vehicle, VehicleStatus, OwnershipType, FuelType, TransmissionType } from '../types';
import { 
  LucideArrowLeft, LucideCar, LucideCheck, LucideCamera, LucideTrash2, 
  LucideRefreshCw, LucideSettings2, LucideHash, 
  LucideCpu, LucideCreditCard, LucideLock, LucideDollarSign, 
  LucideFileCheck2, LucideScanText, LucideLoader2, LucideUser,
  LucideMapPin, LucideImage, LucideEdit3, LucideRefreshCcw, LucideMaximize
} from 'lucide-react';
import { analyzeDocumentImage, isAiAvailable } from '../services/geminiService';
import { compressImage } from '../utils/imageCompressor';
import { ImageZoomModal } from './ImageZoomModal';

export const VehicleForm = () => {
  const { plate } = useParams();
  const navigate = useNavigate();
  const { vehicles, addVehicle, updateVehicle, addNotification, logAudit, vehicleVersions } = useApp();
  const isEdit = !!plate;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cedulaFront, setCedulaFront] = useState<string | null>(null);
  const [cedulaBack, setCedulaBack] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);

  const [formData, setFormData] = useState<any>({
    plate: '', make: '', model: '', year: new Date().getFullYear(), type: 'Pickup', version: '',
    color: '', ownership: OwnershipType.OWNED, status: VehicleStatus.ACTIVE,
    currentKm: 0, serviceIntervalKm: 10000, nextServiceKm: 10000,
    costCenter: '', vin: '', motorNum: '', province: 'Mendoza',
    fuelType: FuelType.DIESEL, transmission: TransmissionType.MANUAL,
    ownerName: '', ownerAddress: '',
    images: { front: '', rear: '', leftSide: '', rightSide: '', list: [] }, 
    documents: [], mileageHistory: []
  });

  useEffect(() => {
    if (isEdit) {
      const found = vehicles.find(v => v.plate === plate);
      if (found) {
        setFormData({ 
            ...found, 
            ownerName: found.adminData?.propietario || '',
            ownerAddress: found.adminData?.direccion || ''
        });
      }
    }
  }, [isEdit, plate, vehicles]);

  // FIX: isFormValid now uses useMemo which is correctly imported
  const isFormValid = useMemo(() => {
    return (
      formData.plate.trim() !== '' &&
      formData.version.trim() !== '' &&
      formData.ownerName.trim() !== '' &&
      formData.ownerAddress.trim() !== ''
    );
  }, [formData.plate, formData.version, formData.ownerName, formData.ownerAddress]);

  const runAnalysis = async (base64: string, side: 'Frente' | 'Dorso') => {
    if (!isAiAvailable()) {
      addNotification("Asistente IA no configurado. Cargue los datos manualmente.", "warning");
      return;
    }

    setIsAnalyzing(true);
    addNotification(`Analizando ${side.toUpperCase()} de cédula...`, "warning");
    
    const result = await analyzeDocumentImage(base64, side);
    
    if (result.success && result.data) {
      setFormData(prev => {
        const newData = { ...prev };
        const extracted = result.data;

        const isValidData = (val: any) => val && val.length > 5 && !['S/N', 'N/A', 'SIN DATOS', '---'].includes(val.toUpperCase());

        if (isValidData(extracted.vin)) newData.vin = extracted.vin.toUpperCase();
        if (isValidData(extracted.motorNum)) newData.motorNum = extracted.motorNum.toUpperCase();

        if (side === 'Frente') {
          if (extracted.plate) newData.plate = extracted.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (extracted.make) newData.make = extracted.make.toUpperCase();
          if (extracted.model) newData.model = extracted.model.toUpperCase();
        } else {
          if (extracted.titular) newData.ownerName = extracted.titular.toUpperCase();
          if (extracted.ownerAddress) newData.ownerAddress = extracted.ownerAddress.toUpperCase();
        }
        
        return newData;
      });
      addNotification(`Datos del ${side} interpretados correctamente`, "success");
    } else {
      addNotification(`No se pudo leer el ${side}. Verifique la nitidez de la imagen.`, "error");
    }
    setIsAnalyzing(false);
  };

  const handleCedulaUpload = async (side: 'Frente' | 'Dorso', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = await compressImage(reader.result as string);
      if (side === 'Frente') setCedulaFront(base64);
      else setCedulaBack(base64);

      await runAnalysis(base64, side);
    };
    reader.readAsDataURL(file);
  };

  const handleReAnalyze = async (side: 'Frente' | 'Dorso') => {
    const img = side === 'Frente' ? cedulaFront : cedulaBack;
    if (img) {
      await runAnalysis(img, side);
    } else {
      addNotification(`No hay imagen de ${side} para re-evaluar`, "warning");
    }
  };

  const handleDeleteCedula = (side: 'Frente' | 'Dorso') => {
    if (side === 'Frente') setCedulaFront(null);
    else setCedulaBack(null);
    addNotification(`${side} de cédula eliminado`, "warning");
  };

  const scrollToField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plate) {
      addNotification("La Patente es obligatoria", "error");
      scrollToField('field-plate');
      return;
    }
    if (!formData.version) {
      addNotification("Debe seleccionar una Versión", "warning");
      scrollToField('field-version');
      return;
    }
    if (!formData.ownerName) {
      addNotification("El Titular es obligatorio", "error");
      scrollToField('field-owner');
      return;
    }
    if (!formData.ownerAddress) {
      addNotification("La Dirección es obligatoria", "error");
      scrollToField('field-address');
      return;
    }
    
    const structuredVehicle: Vehicle = {
      ...formData,
      adminData: {
        ...(formData.adminData || {}),
        regimen: formData.ownership,
        anio: formData.year,
        provincia: formData.province,
        tarjetaCombustible: formData.adminData?.tarjetaCombustible || { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
        tarjetaTelepase: formData.adminData?.tarjetaTelepase || { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
        unidadActiva: formData.adminData?.unidadActiva ?? true,
        propietario: formData.ownerName,
        direccion: formData.ownerAddress
      }
    };

    if (isEdit) { 
      updateVehicle(structuredVehicle); 
      logAudit('UPDATE', 'VEHICLE', formData.plate, 'Actualización de ficha integral'); 
      addNotification("Unidad actualizada correctamente", "success");
    } else { 
      addVehicle(structuredVehicle); 
      logAudit('CREATE', 'VEHICLE', formData.plate, 'Alta de activo en inventario corporativo'); 
      addNotification("Unidad sincronizada en flota corporativa", "success");
    }
    navigate('/vehicles');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn pb-24 px-4">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/vehicles')} className="flex items-center gap-3 text-slate-500 hover:text-slate-800 font-black uppercase text-[10px] tracking-widest group">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 group-hover:shadow-xl transition-all"><LucideArrowLeft size={20}/></div> VOLVER AL LISTADO
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {!isEdit && (
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                  {isAnalyzing ? <LucideLoader2 className="animate-spin" size={28}/> : <LucideScanText size={28}/>}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Carga de Cédula Digital</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {isAnalyzing ? 'Interpretando documentos...' : 'La IA completará los datos por usted'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  Imagen Frontal (Patente/Marca/Modelo)
                </label>
                <div className="relative group aspect-[1.6/1] bg-slate-900 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center transition-all hover:border-blue-400">
                  {cedulaFront ? (
                    <>
                      <img src={cedulaFront} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all gap-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setZoomedImage({url: cedulaFront, label: 'Cédula Frente'})} className="bg-white text-slate-800 p-3 rounded-xl shadow-2xl hover:bg-blue-600 hover:text-white transition-all">
                            <LucideMaximize size={18}/>
                          </button>
                          <label className="cursor-pointer bg-white text-slate-800 p-3 rounded-xl shadow-2xl hover:bg-blue-600 hover:text-white transition-all">
                            <LucideEdit3 size={18}/>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCedulaUpload('Frente', e)} />
                          </label>
                          <button type="button" onClick={() => handleDeleteCedula('Frente')} className="bg-rose-600 text-white p-3 rounded-xl shadow-2xl hover:bg-rose-700 transition-all">
                            <LucideTrash2 size={18}/>
                          </button>
                        </div>
                        <button type="button" onClick={() => handleReAnalyze('Frente')} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-2xl hover:bg-indigo-700 transition-all">
                          <LucideRefreshCcw size={16}/> Re-evaluar Lectura
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-all">
                      <LucideCamera size={48} className="text-slate-600 mb-4 group-hover:scale-110 transition-transform"/>
                      <span className="text-xs font-black text-slate-400 uppercase">Capturar Frente</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCedulaUpload('Frente', e)} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  Imagen Trasera (VIN/Chasis/Motor/Titular)
                </label>
                <div className="relative group aspect-[1.6/1] bg-slate-900 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center transition-all hover:border-blue-400">
                  {cedulaBack ? (
                    <>
                      <img src={cedulaBack} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all gap-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setZoomedImage({url: cedulaBack, label: 'Cédula Dorso'})} className="bg-white text-slate-800 p-3 rounded-xl shadow-2xl hover:bg-blue-600 hover:text-white transition-all">
                            <LucideMaximize size={18}/>
                          </button>
                          <label className="cursor-pointer bg-white text-slate-800 p-3 rounded-xl shadow-2xl hover:bg-blue-600 hover:text-white transition-all">
                            <LucideEdit3 size={18}/>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCedulaUpload('Dorso', e)} />
                          </label>
                          <button type="button" onClick={() => handleDeleteCedula('Dorso')} className="bg-rose-600 text-white p-3 rounded-xl shadow-2xl hover:bg-rose-700 transition-all">
                            <LucideTrash2 size={18}/>
                          </button>
                        </div>
                        <button type="button" onClick={() => handleReAnalyze('Dorso')} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-2xl hover:bg-indigo-700 transition-all">
                          <LucideRefreshCcw size={16}/> Re-evaluar Lectura
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-all">
                      <LucideCamera size={48} className="text-slate-600 mb-4 group-hover:scale-110 transition-transform"/>
                      <span className="text-xs font-black text-slate-400 uppercase">Capturar Dorso</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCedulaUpload('Dorso', e)} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-white space-y-10">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-blue-400 border-b border-white/10 pb-4 flex items-center gap-3"><LucideSettings2 size={24}/> Identificación Estratégica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Patente</label>
                    <input id="field-plate" type="text" className={`w-full px-8 py-5 rounded-[2rem] border bg-white/5 font-black text-4xl uppercase outline-none focus:ring-4 transition-all ${!formData.plate.trim() ? 'border-rose-500/30' : 'border-white/10 focus:ring-blue-500/30 text-blue-400'}`} value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Marca</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Modelo</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2"><LucideHash size={12}/> Chasis / VIN</label>
                    <input type="text" className="w-full px-8 py-4 rounded-2xl border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} placeholder="S/N" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2"><LucideCpu size={12}/> Número de Motor</label>
                    <input type="text" className="w-full px-8 py-4 rounded-2xl border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.motorNum} onChange={e => setFormData({...formData, motorNum: e.target.value.toUpperCase()})} placeholder="S/N" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2"><LucideUser size={12}/> Titular</label>
                    <input id="field-owner" type="text" className={`w-full px-8 py-4 rounded-2xl border bg-white/5 font-bold uppercase outline-none focus:ring-4 transition-all ${!formData.ownerName.trim() ? 'border-rose-500/30' : 'border-white/10 focus:ring-blue-500/30'}`} value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value.toUpperCase()})} placeholder="NOMBRE DEL TITULAR" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2"><LucideMapPin size={12}/> Dirección</label>
                    <input id="field-address" type="text" className={`w-full px-8 py-4 rounded-2xl border bg-white/5 font-bold uppercase outline-none focus:ring-4 transition-all ${!formData.ownerAddress.trim() ? 'border-rose-500/30' : 'border-white/10 focus:ring-blue-500/30'}`} value={formData.ownerAddress} onChange={e => setFormData({...formData, ownerAddress: e.target.value.toUpperCase()})} placeholder="DOMICILIO LEGAL" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Régimen Patrimonial</label>
                    <select className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-black uppercase outline-none text-blue-400" value={formData.ownership} onChange={e => setFormData({...formData, ownership: e.target.value as any})}>
                        <option value={OwnershipType.OWNED}>PROPIO (CAPEX)</option>
                        <option value={OwnershipType.RENTED}>ALQUILER (OPEX)</option>
                        <option value={OwnershipType.LEASING}>LEASING (FINANCIERO)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Versión Sistema</label>
                    <select id="field-version" className={`w-full px-8 py-5 rounded-[2rem] border bg-white/5 font-bold uppercase outline-none appearance-none transition-all focus:ring-4 ${!formData.version.trim() ? 'border-rose-500/30' : 'border-white/10 focus:ring-blue-500/30'}`} value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {vehicleVersions.map(v => <option key={v} value={v} className="text-slate-900">{v}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Centro Costo</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})} />
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/vehicles')} className="px-12 py-6 rounded-[2.5rem] font-black text-slate-400 uppercase text-[11px] tracking-widest hover:text-slate-600">Cancelar</button>
          <button 
            type="submit" 
            disabled={!isFormValid}
            className={`px-20 py-6 rounded-[2.5rem] font-black transition-all uppercase text-xs tracking-widest transform active:scale-95 ${isFormValid ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
          >
            {isEdit ? 'Actualizar Ficha Técnica' : 'Sincronizar Alta de Unidad'}
          </button>
        </div>
      </form>
    </div>
  );
};
