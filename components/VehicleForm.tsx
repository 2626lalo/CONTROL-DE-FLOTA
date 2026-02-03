import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/FleetContext';
import { Vehicle, VehicleStatus, OwnershipType, FuelType, TransmissionType, AdministrativeData } from '../types';
import { 
  LucideArrowLeft, LucideCar, LucideCheck, LucideCamera, LucideTrash2, 
  LucideRefreshCw, LucideFingerprint, LucideUser, LucideMapPin, LucideLayers,
  LucideHash, LucideBuilding2, LucideCpu, LucideSettings2, LucideBattery, 
  LucideGlobe, LucideTruck, LucideCrown, LucideCreditCard, LucideLock, 
  LucideDollarSign, LucideCalendarDays, LucideTimerReset, LucideClock, LucidePercent,
  LucideHandshake, LucideFileCheck, LucideFileCheck2, LucideGauge, LucideShieldCheck
} from 'lucide-react';

export const VehicleForm = () => {
  const { plate } = useParams();
  const navigate = useNavigate();
  const { vehicles, addVehicle, updateVehicle, addNotification, logAudit, vehicleVersions } = useApp();
  const isEdit = !!plate;

  const [formData, setFormData] = useState<any>({
    plate: '', make: '', model: '', year: new Date().getFullYear(), type: 'Pickup', version: '',
    color: '', ownership: OwnershipType.OWNED, status: VehicleStatus.ACTIVE,
    currentKm: 0, serviceIntervalKm: 10000, nextServiceKm: 10000,
    costCenter: '', vin: '', motorNum: '', province: 'Mendoza',
    fuelType: FuelType.DIESEL, transmission: TransmissionType.MANUAL,
    ownerName: '', ownerAddress: '',
    site: '', zone: '', usageType: '', director: '', driver: '', activationDate: '', expirationDate: '',
    fuelCardNumber: '', pinCombustible: '', telepaseNumber: '', pinTelepase: '',
    rentalProvider: '', rentalStartDate: '', rentalEndDate: '', rentalMonthlyCost: 0, rentalPaymentCycle: 30,
    leasing: { 
      provider: '', contractNumber: '', startDate: '', endDate: '', monthlyCost: 0, residualValue: 0,
      leaseType: 'financial', currency: 'USD', paymentFrequency: 'monthly', allowedAnnualMileage: 20000,
      interestRate: 0, purchaseOption: true, maintenanceResponsibility: 'lessee', totalValue: 0,
      excessMileageRate: 0, leaseTerm: 36
    },
    images: { front: '', rear: '', leftSide: '', rightSide: '', list: [] }, 
    documents: [], mileageHistory: []
  });

  useEffect(() => {
    if (isEdit) {
      const found = vehicles.find(v => v.plate === plate);
      if (found) {
        // Cargar datos anidados en el estado plano del formulario
        setFormData({
          ...found,
          site: found.adminData?.sitio || '',
          zone: found.adminData?.zona || '',
          director: found.adminData?.directorResponsable || '',
          driver: found.adminData?.conductorPrincipal || '',
          rentalProvider: found.adminData?.proveedorAlquiler || ''
        });
      }
    }
  }, [isEdit, plate, vehicles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate) return addNotification("Patente obligatoria", "error");
    if (!formData.version) return addNotification("Debe seleccionar una Versión", "warning");
    
    // RECONSTRUCCIÓN ESTRUCTURAL PARA INTEGRIDAD DE DATOS
    const structuredVehicle: Vehicle = {
      ...formData,
      adminData: {
        ...(formData.adminData || {}),
        regimen: formData.ownership,
        anio: formData.year,
        sitio: formData.site,
        zona: formData.zone,
        directorResponsable: formData.director,
        conductorPrincipal: formData.driver,
        proveedorAlquiler: formData.rentalProvider,
        provincia: formData.province,
        tarjetaCombustible: formData.adminData?.tarjetaCombustible || { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
        tarjetaTelepase: formData.adminData?.tarjetaTelepase || { numero: '', pin: '', proveedor: '', limiteMensual: 0, saldoActual: 0, fechaVencimiento: '', estado: 'activa' },
        unidadActiva: formData.adminData?.unidadActiva ?? true
      }
    };

    if (isEdit) { 
      updateVehicle(structuredVehicle); 
      logAudit('UPDATE', 'VEHICLE', formData.plate, 'Actualización de ficha integral'); 
    } else { 
      addVehicle(structuredVehicle); 
      logAudit('CREATE', 'VEHICLE', formData.plate, 'Alta de activo en inventario corporativo'); 
    }
    navigate('/vehicles');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn pb-24 px-4">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/vehicles')} className="flex items-center gap-3 text-slate-500 hover:text-slate-800 font-black uppercase text-[10px] tracking-widest group">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 group-hover:shadow-xl transition-all"><LucideArrowLeft size={20}/></div> VOLVER AL LISTADO
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-white space-y-10">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-blue-400 border-b border-white/10 pb-4 flex items-center gap-3"><LucideSettings2 size={24}/> Identificación Estratégica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Patente</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-black text-4xl uppercase outline-none focus:ring-4 focus:ring-blue-500/30 text-blue-400" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Marca</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Modelo</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Versión Sistema</label>
                    <select className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none appearance-none" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {vehicleVersions.map(v => <option key={v} value={v} className="text-slate-900">{v}</option>)}
                    </select>
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
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Centro Costo</label>
                    <input type="text" className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Tracción</label>
                    <select className="w-full px-8 py-5 rounded-[2rem] border border-white/10 bg-white/5 font-bold uppercase outline-none" value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value as any})}>
                        <option value={TransmissionType.MANUAL}>MANUAL</option>
                        <option value={TransmissionType.AUTOMATIC}>AUTOMÁTICA</option>
                    </select>
                </div>
            </div>
        </div>

        {formData.ownership === OwnershipType.LEASING && (
          <div className="bg-gradient-to-br from-indigo-700 to-violet-900 p-12 rounded-[3.5rem] shadow-2xl text-white space-y-10 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/20 pb-4">
               <h3 className="text-xl font-black uppercase italic tracking-widest flex items-center gap-3"><LucideFileCheck2 size={24}/> Gestión Integral de Leasing</h3>
               <span className="bg-white/20 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Contrato Bancario Activo</span>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-100 uppercase ml-4">Empresa Leasing</label>
                        <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 font-bold outline-none" value={formData.leasing?.provider} onChange={e => setFormData({...formData, leasing: {...formData.leasing!, provider: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-100 uppercase ml-4">Canon Mensual ($)</label>
                        <input type="number" onFocus={(e) => e.target.select()} className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 font-black outline-none" value={formData.leasing?.monthlyCost} onChange={e => setFormData({...formData, leasing: {...formData.leasing!, monthlyCost: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-100 uppercase ml-4">Valor Residual</label>
                        <input type="number" onFocus={(e) => e.target.select()} className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 font-black outline-none" value={formData.leasing?.residualValue} onChange={e => setFormData({...formData, leasing: {...formData.leasing!, residualValue: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-100 uppercase ml-4">Límite Km Anual</label>
                        <input type="number" onFocus={(e) => e.target.select()} className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 font-black outline-none" value={formData.leasing?.allowedAnnualMileage} onChange={e => setFormData({...formData, leasing: {...formData.leasing!, allowedAnnualMileage: Number(e.target.value)}})} />
                    </div>
                </div>
            </div>
          </div>
        )}

        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-slate-800 border-b pb-4 flex items-center gap-3"><LucideBuilding2 className="text-blue-500"/> Administración de Destino</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Sitio / Base</label>
                    <input type="text" className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Zona Operativa</label>
                    <input type="text" className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">KM Inicial</label>
                    <input type="number" onFocus={(e) => e.target.select()} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-black outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.currentKm} onChange={e => setFormData({...formData, currentKm: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Año Fabricación</label>
                    <input type="number" onFocus={(e) => e.target.select()} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 font-black outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} />
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/vehicles')} className="px-12 py-6 rounded-[2.5rem] font-black text-slate-400 uppercase text-[11px] tracking-widest hover:text-slate-600">Cancelar</button>
          <button type="submit" className="px-20 py-6 rounded-[2.5rem] font-black bg-slate-900 text-white hover:bg-blue-600 shadow-2xl transition-all uppercase text-xs tracking-widest transform active:scale-95">
            {isEdit ? 'Actualizar Ficha Técnica' : 'Sincronizar Alta de Unidad'}
          </button>
        </div>
      </form>
    </div>
  );
};