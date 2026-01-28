
import React, { useState, useCallback } from 'react';
import { Vehicle, FichaTecnica as FichaType, StandardAccessory } from '../types';
import { useFichaTecnica } from '../hooks/useFichaTecnica';
import { useApp } from '../context/FleetContext';
import { 
  LucideCar, LucideSettings, LucideHammer, LucideWrench, LucideFuel, LucideBattery, 
  LucideDisc, LucideCalculator, LucidePlus, LucideTrash2,
  LucideDownload, LucideCheck, LucideAlertTriangle, LucideRadio, 
  LucideZap, LucidePackage, LucideLifeBuoy, LucideBrain, LucideSettings2,
  LucideChevronRight, LucideChevronLeft, LucideEye, LucideEyeOff, LucideSparkles, LucideX,
  LucideSave, LucideInfo, LucideClipboardCheck, LucideScale, LucidePalette,
  LucideBox, LucideThermometer, LucideThermometerSnowflake, LucideTarget, LucideHistory,
  LucideShieldCheck, LucideShieldAlert, LucideShield, LucideSquare, LucideCheckSquare,
  LucideArrowUpCircle, LucideMessageSquare
} from 'lucide-react';

interface Props {
  vehicle: Vehicle;
  onSave: (updatedVehicle: Vehicle) => void;
}

export const FichaTecnica: React.FC<Props> = ({ vehicle, onSave }) => {
  const { ficha, loading, analisisServicio, isAiLoading, setFicha } = useFichaTecnica({ vehiculo: vehicle });
  const { addNotification } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'neumaticos' | 'equipamiento'>('general');
  
  const [tireIdx, setTireIdx] = useState(0);
  const tireKeys = ['delanteroIzquierdo', 'delanteroDerecho', 'traseroIzquierdo', 'traseroDerecho'] as const;

  const updateField = useCallback((path: string, value: any) => {
    setFicha(prev => {
      if (!prev) return prev;
      const newState = { ...prev };
      const keys = path.split('.');
      let current: any = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return { ...newState };
    });
  }, [setFicha]);

  if (loading || !ficha) return <div className="p-20 text-center font-black uppercase text-slate-300 animate-pulse">Sincronizando Base de Datos Técnica...</div>;

  const handleGlobalSave = () => {
    if (analisisServicio?.estado === 'error_logico') {
      addNotification("No se puede guardar: Corrija la inconsistencia de Kilometraje.", "error");
      return;
    }
    onSave({ ...vehicle, currentKm: ficha.kilometrajeActual, fichaTecnica: ficha });
    setEditMode(false);
    addNotification?.("Configuración técnica de unidad guardada", "success");
  };

  const toggleStandardEquipped = (idx: number) => {
      if (!editMode) return;
      const newList = [...ficha.equipamiento.accesoriosEstandar];
      newList[idx].isEquipped = !newList[idx].isEquipped;
      if (newList[idx].isEquipped && (newList[idx].quantity || 0) < 1) {
          newList[idx].quantity = 1;
      }
      updateField('equipamiento.accesoriosEstandar', newList);
  };

  const updateStandardQuantity = (idx: number, qty: number) => {
      if (!editMode) return;
      const newList = [...ficha.equipamiento.accesoriosEstandar];
      newList[idx].quantity = Math.max(1, qty);
      updateField('equipamiento.accesoriosEstandar', newList);
  };

  const updateStandardDetail = (idx: number, detail: string) => {
      if (!editMode) return;
      const newList = [...ficha.equipamiento.accesoriosEstandar];
      newList[idx].detail = detail;
      updateField('equipamiento.accesoriosEstandar', newList);
  };

  const promoteToStandard = (idx: number) => {
    if (!editMode) return;
    const specialAcc = ficha.equipamiento.accesoriosAdicionales[idx];
    if (!specialAcc.descripcion) {
        addNotification("El accesorio debe tener una descripción para promoverse", "warning");
        return;
    }

    const newStandard: StandardAccessory = {
        name: specialAcc.descripcion.toUpperCase(),
        isEquipped: true,
        quantity: specialAcc.cantidad,
        detail: specialAcc.notas
    };

    const newStandardList = [...ficha.equipamiento.accesoriosEstandar, newStandard];
    const newSpecialList = ficha.equipamiento.accesoriosAdicionales.filter((_, i) => i !== idx);

    updateField('equipamiento.accesoriosEstandar', newStandardList);
    updateField('equipamiento.accesoriosAdicionales', newSpecialList);
    addNotification(`"${newStandard.name}" promovido a Dotación Estándar`, "success");
  };

  const nextTire = () => setTireIdx(prev => (prev + 1) % 4);
  const prevTire = () => setTireIdx(prev => (prev - 1 + 4) % 4);

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className={`p-5 rounded-[2rem] shadow-2xl transition-all duration-500 ${editMode ? 'bg-blue-600 text-white scale-110 rotate-6' : 'bg-slate-900 text-white'}`}><LucideSettings2 size={32}/></div>
           <div><h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Ficha Técnica Empresarial</h3><p className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-all ${editMode ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>{editMode ? '• MODO EDICIÓN ACTIVO' : 'Vista de Consulta'}</p></div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => editMode ? handleGlobalSave() : setEditMode(true)} className={`px-10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 transition-all transform active:scale-95 ${editMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{editMode ? <LucideCheck size={20}/> : <LucideWrench size={20}/>}{editMode ? 'Confirmar Guardado' : 'Editar Ficha'}</button>
           {editMode && <button onClick={() => setEditMode(false)} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>}
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-100 overflow-x-auto pb-1 scrollbar-hide">
         {[{ id: 'general', label: 'Gestión y Motor', icon: LucideCar }, { id: 'neumaticos', label: 'Rodado / Auxilios', icon: LucideDisc }, { id: 'equipamiento', label: 'Equipamiento Especial', icon: LucideHammer }].map(tab => (
           <button key={tab.id} onClick={() => setActiveSection(tab.id as any)} className={`pb-5 px-8 text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center gap-3 border-b-4 transition-all ${activeSection === tab.id ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><tab.icon size={16}/> {tab.label}</button>
         ))}
      </div>

      <div className="space-y-10">
         {activeSection === 'general' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12">
                    <h4 className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideCalculator className="text-blue-600"/> Gestión de Mantenimiento</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                       <div className="space-y-3"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">KM Actual Unidad</label><div className={`p-1.5 rounded-[1.5rem] border transition-all ${editMode ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-50' : 'bg-slate-50 border-slate-100'}`}><input disabled={!editMode} type="number" onFocus={(e) => e.target.select()} className="w-full px-5 py-4 font-black text-xl md:text-2xl text-slate-800 bg-transparent outline-none" value={ficha.kilometrajeActual || 0} onChange={e => updateField('kilometrajeActual', Number(e.target.value))} /></div></div>
                       <div className="space-y-3"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">KM Último Service</label><div className={`p-1.5 rounded-[1.5rem] border transition-all ${editMode ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-50' : 'bg-slate-50 border-slate-100'}`}><input disabled={!editMode} type="number" onFocus={(e) => e.target.select()} className="w-full px-5 py-4 font-black text-xl md:text-2xl text-slate-800 bg-transparent outline-none" value={ficha.ultimoServicio.kilometraje || 0} onChange={e => updateField('ultimoServicio.kilometraje', Number(e.target.value))} /></div></div>
                    </div>
                    <div className="p-10 bg-slate-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                       <div className="relative z-10 space-y-6"><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Análisis de Ciclo Crítico</p><h5 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight" style={{color: analisisServicio?.alerta.color}}>{analisisServicio?.alerta.mensaje}</h5>
                          {analisisServicio?.estado !== 'error_logico' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"><div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><LucideHistory size={10}/> Próximo Service</p><p className="text-xl font-black text-white">{analisisServicio?.proximoServicioIntervalo.toLocaleString()} KM</p></div><div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30"><p className="text-[8px] font-black text-blue-400 uppercase mb-1 flex items-center gap-1"><LucideTarget size={10}/> Recomendado</p><p className="text-xl font-black text-white">{analisisServicio?.proximoServicioHito.toLocaleString()} KM</p></div></div>
                          )}
                       </div><LucideAlertTriangle className="absolute -right-12 -bottom-12 opacity-5" size={240} style={{color: analisisServicio?.alerta.color}}/>
                    </div>
                 </div>
                 <div className="space-y-10"><div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10"><h4 className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideFuel className="text-rose-500"/> ESPECIFICACIONES MOTOR</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Combustible</label><select disabled={!editMode} className={`w-full px-6 py-5 rounded-[1.5rem] font-black uppercase text-[11px] outline-none transition-all ${editMode ? 'bg-white border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent text-slate-600'}`} value={ficha.tipoCombustible} onChange={e => updateField('tipoCombustible', e.target.value)}><option value="diesel">DIESEL</option><option value="nafta">NAFTA</option><option value="electrico">ELÉCTRICO</option></select></div><div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Capacidad Carga (KG)</label><input disabled={!editMode} type="number" onFocus={(e) => e.target.select()} className={`w-full px-6 py-5 rounded-[1.5rem] font-black text-xl outline-none transition-all ${editMode ? 'bg-white border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent'}`} value={ficha.dimensiones.capacidadCarga} onChange={e => updateField('dimensiones.capacidadCarga', Number(e.target.value))} /></div></div>
                    </div>
                    <div className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 shadow-sm ${ficha.garantiaVigente ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}><h4 className="text-lg font-black text-slate-800 uppercase italic mb-8">Estado de Garantía</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><select disabled={!editMode} className={`w-full px-6 py-4 rounded-[1.5rem] font-black uppercase text-[11px] outline-none ${editMode ? 'bg-white border-blue-500' : 'bg-transparent'}`} value={ficha.garantiaVigente ? 'true' : 'false'} onChange={e => updateField('garantiaVigente', e.target.value === 'true')}><option value="true">VIGENTE</option><option value="false">VENCIDA</option></select><input disabled={!editMode} type="text" placeholder="Obs / Vencimiento" className={`w-full px-6 py-4 rounded-[1.5rem] font-bold text-xs outline-none ${editMode ? 'bg-white border-blue-500' : 'bg-transparent'}`} value={ficha.vencimientoGarantia || ''} onChange={e => updateField('vencimientoGarantia', e.target.value)} /></div></div>
                 </div>
              </div>
           </div>
         )}

         {activeSection === 'neumaticos' && (
           <div className="space-y-12 animate-fadeIn"><div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl space-y-10"><div className="relative flex items-center justify-center py-10"><button onClick={prevTire} className="absolute left-0 p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><LucideChevronLeft size={32}/></button><div className="w-full max-w-xl p-10 rounded-[3.5rem] bg-white/5 border border-white/10 animate-fadeIn"><p className="text-blue-400 font-black uppercase tracking-widest italic mb-6">{tireKeys[tireIdx].replace(/([A-Z])/g, ' $1')}</p>
                       <div className="space-y-6"><input disabled={!editMode} placeholder="Marca" className={`w-full px-8 py-5 rounded-[2rem] font-black text-white bg-white/10 outline-none`} value={ficha.neumaticos[tireKeys[tireIdx]].marca} onChange={e => updateField(`neumaticos.${tireKeys[tireIdx]}.marca`, e.target.value)} /><input disabled={!editMode} placeholder="Medidas" className={`w-full px-8 py-5 rounded-[2rem] font-black text-white bg-white/10 outline-none`} value={ficha.neumaticos[tireKeys[tireIdx]].medidas} onChange={e => updateField(`neumaticos.${tireKeys[tireIdx]}.medidas`, e.target.value)} /><div className="grid grid-cols-2 gap-4"><input disabled={!editMode} type="number" onFocus={(e) => e.target.select()} placeholder="PSI" className={`w-full px-8 py-5 rounded-[2rem] font-black text-blue-400 bg-white/10 text-center outline-none`} value={ficha.neumaticos[tireKeys[tireIdx]].presion} onChange={e => updateField(`neumaticos.${tireKeys[tireIdx]}.presion`, Number(e.target.value))} /><select disabled={!editMode} className={`w-full px-4 py-5 rounded-[2rem] font-black text-white bg-slate-800 outline-none`} value={ficha.neumaticos[tireKeys[tireIdx]].estado} onChange={e => updateField(`neumaticos.${tireKeys[tireIdx]}.estado`, e.target.value)}><option value="nuevo">NUEVO</option><option value="usado">USADO OK</option><option value="desgastado">DESGASTADO</option><option value="critico">CRÍTICO</option></select></div></div>
                    </div><button onClick={nextTire} className="absolute right-0 p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><LucideChevronRight size={32}/></button></div></div></div>
         )}

         {activeSection === 'equipamiento' && (
           <div className="space-y-12 animate-fadeIn">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                 <div className="flex items-center gap-6 border-b pb-8">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner"><LucideClipboardCheck size={36}/></div>
                    <div><h4 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Dotación de Seguridad Estándar</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Configuración de Inventario Fijo para Inspección</p></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ficha.equipamiento.accesoriosEstandar?.map((item, idx) => (
                       <div key={idx} className={`p-8 rounded-[2.5rem] border transition-all duration-300 space-y-6 ${item.isEquipped ? 'bg-white border-blue-600 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => toggleStandardEquipped(idx)} disabled={!editMode} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${item.isEquipped ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-200'}`}>
                                    {item.isEquipped ? <LucideCheckSquare size={28}/> : <LucideSquare size={28}/>}
                                </button>
                                <div>
                                    <p className={`text-[12px] font-black uppercase tracking-tighter leading-tight ${item.isEquipped ? 'text-slate-800' : 'text-slate-400'}`}>{item.name}</p>
                                    <p className={`text-[8px] font-bold uppercase ${item.isEquipped ? 'text-blue-600' : 'text-slate-300'}`}>{item.isEquipped ? 'Elemento Equipado' : 'No Asignado'}</p>
                                </div>
                            </div>
                            {item.isEquipped && (
                                <div className="bg-slate-100 rounded-xl p-2 flex items-center gap-2 border border-slate-200">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">CANT:</label>
                                    <input 
                                        disabled={!editMode} 
                                        type="number" 
                                        min="1" 
                                        onFocus={(e) => e.target.select()} 
                                        className="w-12 bg-transparent border-none text-slate-800 font-black text-center outline-none text-lg" 
                                        value={item.quantity} 
                                        onChange={e => updateStandardQuantity(idx, Number(e.target.value))} 
                                    />
                                </div>
                            )}
                          </div>
                          
                          {item.isEquipped && (
                              <div className="space-y-2 animate-fadeIn">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                      <LucideMessageSquare size={10}/> Detalles / Especificaciones
                                  </label>
                                  <input 
                                    disabled={!editMode}
                                    placeholder="Marca, vencimiento, estado puntual..."
                                    className={`w-full px-4 py-3 rounded-xl text-[10px] font-bold outline-none border transition-all ${editMode ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white' : 'bg-transparent border-transparent text-slate-500 italic'}`}
                                    value={item.detail || ''}
                                    onChange={e => updateStandardDetail(idx, e.target.value)}
                                  />
                              </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                 <div className="flex justify-between items-center border-b pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.5rem]"><LucidePackage size={36}/></div>
                        <div><h4 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Accesorios Especiales</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Personalización de Unidad</p></div>
                    </div>
                    {editMode && (
                        <button onClick={() => updateField('equipamiento.accesoriosAdicionales', [...ficha.equipamiento.accesoriosAdicionales, { descripcion: '', cantidad: 1, notas: '' }])} className="px-8 py-4 bg-emerald-600 text-white rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-emerald-700 shadow-2xl transition-all">
                            <LucidePlus size={18}/> Nuevo Registro
                        </button>
                    )}
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    {ficha.equipamiento.accesoriosAdicionales.map((acc, idx) => (
                         <div key={idx} className={`p-8 rounded-[3rem] border flex flex-col md:flex-row gap-8 animate-fadeIn transition-all duration-500 ${editMode ? 'bg-white border-emerald-500 shadow-2xl ring-4 ring-emerald-50' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex-1 space-y-4">
                                <input disabled={!editMode} placeholder="Descripción del accesorio..." className={`w-full bg-transparent font-black text-slate-800 uppercase italic text-lg outline-none border-b-2 ${editMode ? 'border-emerald-200 focus:border-emerald-600' : 'border-transparent'}`} value={acc.descripcion} onChange={e => { const nl = [...ficha.equipamiento.accesoriosAdicionales]; nl[idx].descripcion = e.target.value; updateField('equipamiento.accesoriosAdicionales', nl); }} />
                                <input disabled={!editMode} placeholder="Notas adicionales..." className={`w-full px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none`} value={acc.notas || ''} onChange={e => { const nl = [...ficha.equipamiento.accesoriosAdicionales]; nl[idx].notas = e.target.value; updateField('equipamiento.accesoriosAdicionales', nl); }} />
                            </div>
                            <div className="flex md:flex-col items-center justify-between gap-4 md:w-44">
                                <div className="text-center">
                                    <label className="text-[8px] font-black text-slate-400 uppercase">Cantidad</label>
                                    <input disabled={!editMode} type="number" min="1" onFocus={(e) => e.target.select()} className="w-20 text-center font-black text-2xl outline-none" value={acc.cantidad} onChange={e => { const nl = [...ficha.equipamiento.accesoriosAdicionales]; nl[idx].cantidad = Math.max(1, Number(e.target.value)); updateField('equipamiento.accesoriosAdicionales', nl); }} />
                                </div>
                                {editMode && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => promoteToStandard(idx)} 
                                            className="p-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase shadow-sm"
                                            title="Promover a Estándar"
                                        >
                                            <LucideArrowUpCircle size={18}/> Agregar
                                        </button>
                                        <button 
                                            onClick={() => { const nl = ficha.equipamiento.accesoriosAdicionales.filter((_, i) => i !== idx); updateField('equipamiento.accesoriosAdicionales', nl); }} 
                                            className="p-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                                            title="Eliminar"
                                        >
                                            <LucideTrash2 size={20}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                         </div>
                    ))}
                    {ficha.equipamiento.accesoriosAdicionales.length === 0 && (
                        <div className="py-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No hay accesorios adicionales registrados</p>
                        </div>
                    )}
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
