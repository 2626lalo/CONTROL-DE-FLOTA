
import React, { useState, useEffect, useMemo } from 'react';
import { LucideBriefcase, LucideCheck, LucideWrench, LucideLayers, LucideHandshake, LucideFileCheck2, LucideRefreshCw, LucideClock, LucideSettings2, LucideDollarSign, LucidePlus, LucideTrash2, LucideCreditCard, LucideMapPin, LucideUser, LucideTarget, LucideCpu, LucideBox, LucideNavigation, LucideX, LucideArchive, LucideShoppingBag, LucideAlertTriangle, LucideCalendarClock, LucideTimer, LucideShield } from 'lucide-react';
import { Vehicle, AdministrativeData, OwnershipType, ManagedLists, VehicleStatus } from '../types';
import { GestionAlquiler } from './GestionAlquiler';
import { GestionLeasing } from './GestionLeasing';
import { useApp } from '../context/FleetContext';
import { startOfYear, endOfYear, differenceInDays, format } from 'date-fns';

interface DynamicSelectorProps {
    label: string;
    icon: any;
    value: string;
    listName: keyof ManagedLists;
    fieldPath: string;
    editMode: boolean;
    options: string[];
    onUpdateField: (path: string, value: string) => void;
    onManageList: (listName: keyof ManagedLists, value: string, action: 'ADD' | 'REMOVE') => void;
}

const DynamicSelector: React.FC<DynamicSelectorProps> = ({ 
    label, icon: Icon, value, listName, fieldPath, editMode, options, onUpdateField, onManageList 
}) => {
    const [showList, setShowList] = useState(false);

    return (
        <div className="space-y-1 relative group">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Icon size={10}/> {label}
            </label>
            <div className="relative">
                <input 
                    disabled={!editMode}
                    type="text"
                    autoComplete="off"
                    className={`w-full px-4 py-3 rounded-xl font-bold outline-none border transition-all ${editMode ? 'bg-white border-indigo-200 focus:border-indigo-600 shadow-sm' : 'bg-slate-50 border-transparent text-slate-500'}`}
                    value={value || ''}
                    onChange={e => onUpdateField(fieldPath, e.target.value)}
                    onFocus={() => editMode && setShowList(true)}
                    onBlur={() => setTimeout(() => setShowList(false), 200)}
                />
                
                {editMode && showList && options && options.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn">
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-2">Sugerencias guardadas</p>
                        </div>
                        {options.map((item, idx) => (
                            <div 
                                key={`${item}-${idx}`} 
                                className="flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors cursor-pointer group/item"
                                onClick={() => {
                                    onUpdateField(fieldPath, item);
                                    setShowList(false);
                                }}
                            >
                                <span className="text-[10px] font-bold text-slate-700 uppercase">{item}</span>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onManageList(listName, item, 'REMOVE'); 
                                    }} 
                                    className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100"
                                >
                                    <LucideX size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const RegimenPropiedadAdmin: React.FC<{ vehicle: Vehicle; onUpdate: (v: Vehicle) => void; isAdmin: boolean }> = ({ vehicle, onUpdate, isAdmin }) => {
  const { addNotification, logAudit } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'GENERAL' | 'ALQUILER' | 'LEASING' | 'LEASING_HISTORY'>('GENERAL');
  const [editMode, setEditMode] = useState(false);
  const currentYear = new Date().getFullYear();

  const [rootFields, setRootFields] = useState({
    type: vehicle.type || 'Pick up',
    make: vehicle.make || '',
    model: vehicle.model || '',
    version: vehicle.version || '',
    status: vehicle.status || VehicleStatus.ACTIVE
  });

  const [adminData, setAdminData] = useState<AdministrativeData>(vehicle.adminData || {
    regimen: vehicle.ownership,
    anio: vehicle.year,
    vigenciaSugerida: 10,
    fechaCalculoVigencia: new Date().toISOString(),
    diasRestantesVigencia: 0,
    aniosRestantesVigencia: 0,
    operandoPara: '',
    zona: '',
    provincia: vehicle.province || '',
    sitio: '',
    uso: '',
    directorResponsable: '',
    conductorPrincipal: '',
    propietario: '',
    tarjetaCombustible: { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
    tarjetaTelepase: { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
    unidadActiva: true,
    opcionesListas: {
      operandoPara: [], zona: [], sitio: [], uso: [], director: [], conductor: [], propietario: []
    }
  });

  useEffect(() => {
    if (vehicle.adminData) setAdminData(vehicle.adminData);
    setRootFields({
        type: vehicle.type || 'Pick up',
        make: vehicle.make || '',
        model: vehicle.model || '',
        version: vehicle.version || '',
        status: vehicle.status || VehicleStatus.ACTIVE
    });
  }, [vehicle]);

  const cicloCalculado = useMemo(() => {
    const hoy = new Date();
    const fabricacion = adminData.anio || currentYear;
    const vidaUtilAnios = adminData.vigenciaSugerida || 10;
    
    const fechaInicio = startOfYear(new Date(fabricacion, 0, 1));
    const fechaFin = endOfYear(new Date(fabricacion + vidaUtilAnios - 1, 11, 31));
    
    const totalDias = Math.max(1, differenceInDays(fechaFin, fechaInicio));
    const diasTranscurridos = differenceInDays(hoy, fechaInicio);
    const diasRestantes = differenceInDays(fechaFin, hoy);
    
    const porcentajeUso = Math.min(100, Math.max(0, (diasTranscurridos / totalDias) * 100));
    const isExcedido = diasRestantes < 0;
    const aniosExcedidos = isExcedido ? Math.abs(Math.floor(diasRestantes / 365.25)) : 0;

    return {
      diasRestantes,
      porcentajeUso,
      isExcedido,
      aniosExcedidos,
      fechaFin: format(fechaFin, 'dd/MM/yyyy'),
      color: isExcedido ? 'bg-rose-600' : (porcentajeUso > 90 ? 'bg-amber-500' : 'bg-emerald-500')
    };
  }, [adminData.anio, adminData.vigenciaSugerida, currentYear]);

  const handleUpdateField = (path: string, value: any) => {
    setAdminData(prev => {
      const newState = { ...prev };
      const keys = path.split('.');
      let current: any = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = Array.isArray(current[keys[i]]) ? [...current[keys[i]]] : { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const manageList = (listName: keyof ManagedLists, value: string, action: 'ADD' | 'REMOVE') => {
    setAdminData(prev => {
        const currentList = prev.opcionesListas?.[listName] || [];
        let newList = [...currentList];
        if (action === 'ADD') {
            if (value && !currentList.includes(value)) newList.push(value);
            else return prev;
        } else {
            newList = newList.filter(item => item !== value);
        }
        return {
            ...prev,
            opcionesListas: { ...prev.opcionesListas!, [listName]: newList }
        };
    });
  };

  const saveChanges = () => {
    onUpdate({ 
      ...vehicle, 
      ...rootFields,
      adminData: adminData, 
      ownership: adminData.regimen, 
      province: adminData.provincia 
    });
    setEditMode(false);
    addNotification?.("Configuración administrativa sincronizada", "success");
  };

  const handlePurchaseFromLeasing = (finalPrice: number) => {
    const updatedAdminData: AdministrativeData = {
      ...adminData,
      regimen: OwnershipType.OWNED,
      leasing_estadoContrato: 'comprado'
    };

    onUpdate({
      ...vehicle,
      ...rootFields,
      ownership: OwnershipType.OWNED,
      purchaseValue: finalPrice,
      adminData: updatedAdminData
    });

    setAdminData(updatedAdminData);
    setActiveSubTab('GENERAL');
    logAudit('PURCHASE_EXERCISE', 'VEHICLE', vehicle.plate, `Opción de compra ejercida por $${finalPrice.toLocaleString()}`);
    addNotification?.("¡Adquisición confirmada! La unidad es ahora propiedad de la empresa.", "success");
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className={`p-5 rounded-[2rem] shadow-2xl transition-all duration-500 ${editMode ? 'bg-indigo-600 text-white scale-110 rotate-6' : 'bg-slate-900 text-white'}`}>
             <LucideBriefcase size={32}/>
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Gestión Administrativa Pro</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Configuración Patrimonial y Operativa</p>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => editMode ? saveChanges() : setEditMode(true)} className={`px-10 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 transition-all ${editMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {editMode ? <LucideCheck size={20}/> : <LucideWrench size={20}/>} {editMode ? 'Confirmar Cambios' : 'Editar Administrativo'}
           </button>
           {editMode && <button onClick={() => setEditMode(false)} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>}
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-hide">
         <button onClick={() => setActiveSubTab('GENERAL')} className={`pb-4 px-6 text-[10px] font-black uppercase italic tracking-widest transition-all border-b-4 shrink-0 flex items-center gap-2 ${activeSubTab === 'GENERAL' ? 'border-indigo-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
            <LucideLayers size={16}/> General y Control
         </button>
         {adminData.regimen === OwnershipType.RENTED && (
            <button onClick={() => setActiveSubTab('ALQUILER')} className={`pb-4 px-6 text-[10px] font-black uppercase italic tracking-widest transition-all border-b-4 shrink-0 flex items-center gap-2 ${activeSubTab === 'ALQUILER' ? 'border-indigo-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
              <LucideHandshake size={16}/> Gestión de Alquiler
            </button>
         )}
         {adminData.regimen === OwnershipType.LEASING && (
            <button onClick={() => setActiveSubTab('LEASING')} className={`pb-4 px-6 text-[10px] font-black uppercase italic tracking-widest transition-all border-b-4 shrink-0 flex items-center gap-2 ${activeSubTab === 'LEASING' ? 'border-indigo-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
              <LucideFileCheck2 size={16}/> Gestión Leasing
            </button>
         )}
         {adminData.leasing_estadoContrato === 'comprado' && adminData.regimen === OwnershipType.OWNED && (
            <button onClick={() => setActiveSubTab('LEASING_HISTORY')} className={`pb-4 px-6 text-[10px] font-black uppercase italic tracking-widest transition-all border-b-4 shrink-0 flex items-center gap-2 ${activeSubTab === 'LEASING_HISTORY' ? 'border-indigo-600 text-slate-800' : 'border-transparent text-slate-400'}`}>
              <LucideArchive size={16}/> Antecedente Leasing
            </button>
         )}
      </div>

      {activeSubTab === 'ALQUILER' ? (
        <GestionAlquiler 
            vehicle={vehicle} 
            adminData={adminData} 
            onUpdate={setAdminData} 
            editMode={editMode}
            onStatusChange={(newStatus) => setRootFields(prev => ({...prev, status: newStatus}))}
        />
      ) : (activeSubTab === 'LEASING' || activeSubTab === 'LEASING_HISTORY') ? (
        <GestionLeasing 
            vehicle={vehicle} 
            adminData={adminData} 
            onUpdate={setAdminData} 
            onPurchaseConfirmed={handlePurchaseFromLeasing}
            editMode={editMode && activeSubTab === 'LEASING'} 
        />
      ) : (
        <div className="space-y-12 animate-fadeIn">
          <section className={`p-10 rounded-[3.5rem] border transition-all ${editMode ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 shadow-sm'}`}>
             <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4 mb-8"><LucideTarget className="text-indigo-600"/> Control de Propiedad</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Régimen Actual</label>
                   <div className={`grid gap-2 ${editMode ? 'grid-cols-3' : 'grid-cols-1'}`}>
                      {Object.values(OwnershipType)
                        .filter(type => editMode || adminData.regimen === type)
                        .map(type => (
                          <button 
                            key={type} 
                            disabled={!editMode} 
                            onClick={() => handleUpdateField('regimen', type)} 
                            className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${adminData.regimen === type ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                          >
                            {type}
                          </button>
                        ))
                      }
                   </div>
                </div>
                <DynamicSelector label="Propietario / Titular" icon={LucideUser} value={adminData.propietario} listName="propietario" fieldPath="propietario" editMode={editMode} options={adminData.opcionesListas?.propietario || []} onUpdateField={handleUpdateField} onManageList={manageList} />
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-200 shadow-sm">
                   <span className="text-[10px] font-black text-slate-500 uppercase">Unidad Activa</span>
                   <button disabled={!editMode} onClick={() => handleUpdateField('unidadActiva', !adminData.unidadActiva)} className={`w-12 h-6 rounded-full transition-all relative ${adminData.unidadActiva ? 'bg-emerald-50 shadow-lg shadow-emerald-200' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${adminData.unidadActiva ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
             {adminData.regimen === OwnershipType.OWNED && vehicle.purchaseValue && (
                <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between animate-fadeIn">
                   <div>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Inversión en CapEx</p>
                      <h5 className="text-2xl font-black text-slate-800 italic">ADQUIRIDA POR ${vehicle.purchaseValue.toLocaleString()}</h5>
                   </div>
                   <LucideShoppingBag className="text-emerald-300" size={40}/>
                </div>
             )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 shadow-sm'} space-y-6`}>
                <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideNavigation className="text-indigo-500"/> Asignación y Destino</h4>
                <div className="grid grid-cols-2 gap-4">
                   <DynamicSelector label="Operando Para" icon={LucideTarget} value={adminData.operandoPara} listName="operandoPara" fieldPath="operandoPara" editMode={editMode} options={adminData.opcionesListas?.operandoPara || []} onUpdateField={handleUpdateField} onManageList={manageList} />
                   <DynamicSelector label="Zona Operativa" icon={LucideMapPin} value={adminData.zona} listName="zona" fieldPath="zona" editMode={editMode} options={adminData.opcionesListas?.zona || []} onUpdateField={handleUpdateField} onManageList={manageList} />
                   <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado Operativo</p>
                        <select 
                            disabled={!editMode}
                            className={`w-full px-4 py-3 rounded-xl font-black text-xs uppercase outline-none border transition-all ${editMode ? 'bg-white border-indigo-200 focus:border-indigo-600' : 'bg-indigo-50 border-transparent text-indigo-600'}`}
                            value={rootFields.status}
                            onChange={e => setRootFields({...rootFields, status: e.target.value as VehicleStatus})}
                        >
                            {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                   </div>
                   <DynamicSelector label="Conductor Principal" icon={LucideUser} value={adminData.conductorPrincipal} listName="conductor" fieldPath="conductorPrincipal" editMode={editMode} options={adminData.opcionesListas?.conductor || []} onUpdateField={handleUpdateField} onManageList={manageList} />
                </div>
             </section>
             
             <section className={`p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-700 ${cicloCalculado.isExcedido ? 'bg-rose-950 text-white' : 'bg-white text-slate-900 shadow-sm border border-slate-100'}`}>
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <LucideRefreshCw className={`${cicloCalculado.isExcedido ? 'text-rose-400 animate-spin-slow' : 'text-indigo-400'}`} size={32}/>
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter">Ciclo de Activo</h4>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 ${cicloCalculado.isExcedido ? 'bg-rose-600 text-white animate-pulse shadow-xl' : 'bg-slate-900 text-white'}`}>
                        {cicloCalculado.isExcedido ? <LucideAlertTriangle size={14}/> : <LucideShield size={14}/>}
                        {cicloCalculado.isExcedido ? 'Vigencia Excedida' : 'Unidad en Vigencia'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 relative z-10 mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Año Unidad</p>
                        {editMode ? (
                            <input 
                                type="number" 
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-2xl text-blue-600 outline-none"
                                value={adminData.anio}
                                onChange={e => handleUpdateField('anio', Number(e.target.value))}
                            />
                        ) : (
                            <p className="text-5xl font-black italic tracking-tighter">{adminData.anio}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Vigencia Funcional (Años)</p>
                        {editMode ? (
                            <input 
                                type="number" 
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-2xl text-blue-600 outline-none"
                                value={adminData.vigenciaSugerida}
                                onChange={e => handleUpdateField('vigenciaSugerida', Number(e.target.value))}
                            />
                        ) : (
                            <p className="text-5xl font-black italic tracking-tighter text-indigo-400">{adminData.vigenciaSugerida}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado de Amortización Operativa</p>
                            <h5 className={`text-xl font-black italic ${cicloCalculado.isExcedido ? 'text-rose-400' : 'text-blue-600'}`}>
                                {cicloCalculado.isExcedido 
                                    ? `EXCEDIDA POR ${cicloCalculado.aniosExcedidos} ANIOS Y ${Math.abs(cicloCalculado.diasRestantes % 365)} DIAS` 
                                    : `CUENTA REGRESIVA: ${cicloCalculado.diasRestantes.toLocaleString()} DIAS RESTANTES`}
                            </h5>
                        </div>
                        <p className="text-xs font-black">{Math.round(cicloCalculado.porcentajeUso)}%</p>
                    </div>
                    
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 shadow-lg ${cicloCalculado.color}`} 
                            style={{ width: `${cicloCalculado.porcentajeUso}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <LucideCalendarClock size={16} className="text-slate-400"/>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Fecha Límite de Operación Estándar: <span className="text-indigo-600 italic font-black">{cicloCalculado.fechaFin}</span>
                        </p>
                    </div>
                </div>

                <LucideTimer className={`absolute -right-12 -bottom-12 opacity-5 ${cicloCalculado.isExcedido ? 'text-rose-500' : 'text-slate-400'}`} size={240}/>
             </section>
          </div>
        </div>
      )}
    </div>
  );
};
