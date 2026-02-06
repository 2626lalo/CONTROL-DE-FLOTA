import React, { useState, useMemo } from 'react';
import { 
  LucideFileCheck2, LucideDollarSign, LucideCalendar, LucideBriefcase, 
  LucideX, LucideCheck, LucideInfo, LucideHistory, LucideBuilding, 
  LucideUser, LucideHash, LucideShieldCheck, LucideScale, LucidePercent, 
  LucideClock, LucideAlertCircle, LucideCreditCard, LucidePlus, LucideTrash2,
  LucideTrendingUp, LucideShoppingBag, LucideDownload, LucideFileText
} from 'lucide-react';
import { Vehicle, AdministrativeData, LeasingPago, OwnershipType } from '../types';
import { format, parseISO, differenceInMonths, isAfter } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

interface Props {
  vehicle: Vehicle;
  adminData: AdministrativeData;
  onUpdate: (updatedAdmin: AdministrativeData) => void;
  onPurchaseConfirmed?: (finalPrice: number) => void;
  editMode: boolean;
}

export const GestionLeasing: React.FC<Props> = ({ vehicle, adminData, onUpdate, onPurchaseConfirmed, editMode }) => {
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<LeasingPago>>({
    nroCuota: (adminData.leasing_pagos?.length || 0) + 1,
    monto: adminData.leasing_cuotaMensual || 0,
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    referencia: ''
  });

  const handleUpdate = (field: keyof AdministrativeData, value: any) => {
    onUpdate({ ...adminData, [field]: value });
  };

  const progressMonths = adminData.leasing_pagos?.length || 0;
  const totalMonths = adminData.leasing_plazoMeses || 1;
  const progressPercent = Math.min(100, (progressMonths / totalMonths) * 100);
  
  // CORRECCIÓN INTEGRIDAD: Cálculo financiero sensible a moneda
  const totalPagado = adminData.leasing_pagos?.reduce((acc, p) => acc + p.monto, 0) || 0;
  const currencySymbol = adminData.leasing_moneda === 'USD' ? 'u$s' : '$';

  const isContractFinished = progressMonths >= totalMonths;

  const handleAddPayment = () => {
    if (!newPayment.nroCuota || !newPayment.monto) return;
    const payment: LeasingPago = {
      id: Date.now().toString(),
      nroCuota: Number(newPayment.nroCuota),
      monto: Number(newPayment.monto),
      fechaPago: newPayment.fechaPago || format(new Date(), 'yyyy-MM-dd'),
      referencia: newPayment.referencia || '',
      // FIX: Changed property from 'notas' to 'notes' to match type definition
      notes: newPayment.notes || ''
    };
    const updatedPagos = [...(adminData.leasing_pagos || []), payment].sort((a, b) => a.nroCuota - b.nroCuota);
    handleUpdate('leasing_pagos', updatedPagos);
    setIsAddingPayment(false);
    setNewPayment({
      nroCuota: updatedPagos.length + 1,
      monto: adminData.leasing_cuotaMensual || 0,
      fechaPago: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleDeletePayment = (id: string) => {
    if (!confirm("¿Eliminar este registro de pago?")) return;
    const updatedPagos = (adminData.leasing_pagos || []).filter(p => p.id !== id);
    handleUpdate('leasing_pagos', updatedPagos);
  };

  const exportPaymentsPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("REPORTE HISTÓRICO DE LEASING", 14, 20);
    doc.setFontSize(10); doc.text(`UNIDAD: ${vehicle.plate} | ARRENDADOR: ${adminData.leasing_arrendadorNombre || 'N/A'}`, 14, 30);
    doc.text(`TOTAL AMORTIZADO: ${currencySymbol} ${totalPagado.toLocaleString()}`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Cuota', 'Fecha Pago', 'Referencia', 'Monto']],
      body: adminData.leasing_pagos?.map(p => [`Cuota ${p.nroCuota}`, format(parseISO(p.fechaPago), 'dd/MM/yyyy'), p.referencia || '-', `${currencySymbol} ${p.monto.toLocaleString()}`]) || [],
      headStyles: { fillColor: [79, 70, 229] },
      theme: 'grid'
    });
    
    doc.save(`Leasing_History_${vehicle.plate}.pdf`);
  };

  const confirmPurchaseExercise = () => {
    if (onPurchaseConfirmed) {
      onPurchaseConfirmed(adminData.leasing_precioOpcionCompra || 0);
      setShowPurchaseModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER DE ESTATUS */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className={`p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl transition-transform ${editMode ? 'scale-110' : ''}`}>
             <LucideFileCheck2 size={32}/>
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Gestión Integral de Leasing</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Control Bancario y Amortización Pro</p>
           </div>
        </div>
        <div className="flex gap-4">
            <div className={`px-8 py-4 rounded-3xl text-white text-center shadow-2xl border transition-all ${editMode ? 'bg-slate-800 border-blue-500/50 ring-4 ring-blue-500/10' : 'bg-slate-900 border-white/5'}`}>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Canon Vigente</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xl font-black text-blue-400/50">{currencySymbol}</span>
                  {editMode ? (
                    <input 
                      type="number" 
                      onFocus={(e) => e.target.select()}
                      className="bg-transparent border-none outline-none text-xl font-black text-blue-400 w-28 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={adminData.leasing_cuotaMensual || 0}
                      onChange={e => handleUpdate('leasing_cuotaMensual', Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-xl font-black text-blue-400">{(adminData.leasing_cuotaMensual || 0).toLocaleString()}</p>
                  )}
                </div>
            </div>
            <div className={`px-8 py-4 rounded-3xl text-white text-center shadow-2xl border border-white/5 ${adminData.leasing_estadoContrato === 'activo' ? 'bg-emerald-600' : adminData.leasing_estadoContrato === 'comprado' ? 'bg-blue-600' : 'bg-rose-600'}`}>
                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Estado</p>
                <p className="text-xl font-black uppercase italic">{adminData.leasing_estadoContrato || 'N/R'}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200 shadow-inner' : 'border-slate-100 shadow-sm'} space-y-8`}>
           <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideHash className="text-indigo-600"/> Datos del Contrato</h4>
           <div className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Nro de Contrato / ID</label>
                 <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_nroContrato || ''} onChange={e => handleUpdate('leasing_nroContrato', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio</label>
                    <input type="date" disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_fechaInicio || ''} onChange={e => handleUpdate('leasing_fechaInicio', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin</label>
                    <input type="date" disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_fechaFin || ''} onChange={e => handleUpdate('leasing_fechaFin', e.target.value)} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Plazo (Meses)</label>
                    <input type="number" onFocus={(e) => e.target.select()} disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_plazoMeses || 36} onChange={e => handleUpdate('leasing_plazoMeses', Number(e.target.value))} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo Leasing</label>
                    <select disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_tipo} onChange={e => handleUpdate('leasing_tipo', e.target.value)}>
                        <option value="financiero">FINANCIERO</option>
                        <option value="operativo">OPERATIVO</option>
                    </select>
                 </div>
              </div>
           </div>
        </section>

        <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200 shadow-inner' : 'border-slate-100 shadow-sm'} space-y-8`}>
           <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideBuilding className="text-indigo-600"/> Datos del Arrendador</h4>
           <div className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Razón Social</label>
                 <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_arrendadorNombre || ''} onChange={e => handleUpdate('leasing_arrendadorNombre', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">CUIT</label>
                    <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_arrendadorCUIT || ''} onChange={e => handleUpdate('leasing_arrendadorCUIT', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Contacto Directo</label>
                    <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_arrendadorContacto || ''} onChange={e => handleUpdate('leasing_arrendadorContacto', e.target.value)} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Operativo</label>
                 <input disabled={!editMode} type="email" className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_arrendadorEmail || ''} onChange={e => handleUpdate('leasing_arrendadorEmail', e.target.value)} />
              </div>
           </div>
        </section>

        <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200 shadow-inner' : 'border-slate-100 shadow-sm'} space-y-8`}>
           <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4"><LucideDollarSign className="text-indigo-600"/> Condiciones Financieras</h4>
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Divisa</label>
                    <select disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_moneda} onChange={e => handleUpdate('leasing_moneda', e.target.value as any)}>
                        <option value="ARS">ARS ($)</option>
                        <option value="USD">USD (u$s)</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Residual</label>
                    <input type="number" onFocus={(e) => e.target.select()} disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.leasing_valorResidual || 0} onChange={e => handleUpdate('leasing_valorResidual', Number(e.target.value))} />
                 </div>
              </div>
              <div className="p-6 bg-slate-950 rounded-3xl text-white border border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Opción de Compra</span>
                    <button disabled={!editMode} onClick={() => handleUpdate('leasing_opcionCompra', !adminData.leasing_opcionCompra)} className={`w-10 h-5 rounded-full transition-all relative ${adminData.leasing_opcionCompra ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adminData.leasing_opcionCompra ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
                 {adminData.leasing_opcionCompra && (
                    <div className="space-y-2 animate-fadeIn">
                        <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-2">Precio de Ejercicio</label>
                        <div className="relative">
                            <LucideDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                            <input type="number" onFocus={(e) => e.target.select()} disabled={!editMode} className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-blue-400 outline-none" value={adminData.leasing_precioOpcionCompra || 0} onChange={e => handleUpdate('leasing_precioOpcionCompra', Number(e.target.value))} />
                        </div>
                    </div>
                 )}
              </div>
           </div>
        </section>
      </div>

      {/* DASHBOARD DE AMORTIZACIÓN Y PROGRESO */}
      <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
         <div className="flex items-center gap-6 mb-12 border-b border-white/10 pb-8">
            <LucideHistory className="text-blue-500" size={36}/>
            <div>
                <h4 className="text-3xl font-black uppercase italic tracking-tighter">Cronograma de Amortización</h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Estatus de Ejecución del Contrato Bancario</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuotas Transcurridas</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white italic">{progressMonths}</span>
                    <span className="text-xl font-black text-slate-500 uppercase tracking-tighter">/ {totalMonths} MESES</span>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inversión Acumulada</p>
                <p className="text-4xl font-black text-emerald-400 tracking-tighter">{currencySymbol} {totalPagado.toLocaleString()}</p>
            </div>
            <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progreso del Contrato</p>
                    <p className="text-sm font-black text-blue-400">{Math.round(progressPercent)}%</p>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/20" style={{width: `${progressPercent}%`}}></div>
                </div>
                <div className="flex gap-4 items-center">
                    <LucideClock size={16} className="text-amber-500"/>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {isContractFinished ? 'Contrato finalizado por cumplimiento de plazo' : `Faltan ${totalMonths - progressMonths} cuotas para finalizar el vínculo financiero`}
                    </p>
                </div>
            </div>
         </div>

         <div className="mt-12 p-8 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-center md:text-left">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl"><LucideInfo size={24}/></div>
                <div>
                    <p className="text-lg font-black uppercase italic leading-none text-blue-400">Opción de Compra {adminData.leasing_opcionCompra ? 'DISPONIBLE' : 'NO PACTADA'}</p>
                    <p className="text-[10px] text-slate-300 font-medium italic mt-1">El sistema alertará 60 días antes del vencimiento para la toma de decisión corporativa.</p>
                </div>
            </div>
            <div className="flex gap-4">
              <button 
                  onClick={() => setShowPaymentsModal(true)}
                  className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 hover:bg-blue-50 transition-all active:scale-95"
              >
                  <LucideCreditCard size={18}/> Ver Historial de Pagos
              </button>

              {adminData.leasing_opcionCompra && !isContractFinished && (
                <button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <LucideShoppingBag size={18}/> Ejercer Compra
                </button>
              )}
            </div>
         </div>
      </section>

      {/* MODAL DE COMPRA / TRANSICIÓN */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-t-[12px] border-emerald-600">
              <div className="p-10 space-y-8 text-center">
                 <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><LucideShoppingBag size={48}/></div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Confirmar Adquisición</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">La unidad pasará a ser PROPIEDAD de la empresa</p>
                 </div>
                 
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio de Opción de Compra</p>
                    <p className="text-4xl font-black text-emerald-600 italic tracking-tighter">
                      {currencySymbol} {(adminData.leasing_precioOpcionCompra || 0).toLocaleString()}
                    </p>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[9px] text-slate-500 italic">Al confirmar, el régimen de propiedad cambiará a "PROPIO". El historial de leasing se conservará como antecedente contable.</p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button onClick={confirmPurchaseExercise} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                      <LucideCheck size={20}/> Confirmar Ejercicio de Compra
                    </button>
                    <button onClick={() => setShowPurchaseModal(false)} className="w-full text-slate-400 font-black uppercase text-[10px] py-4">Cancelar Operación</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE PAGOS */}
      {showPaymentsModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn my-auto">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg"><LucideCreditCard size={24}/></div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Historial Financiero Leasing</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auditoría de Cuotas y Amortización</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportPaymentsPDF} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase"><LucideFileText size={16}/> Descargar PDF</button>
                    <button onClick={() => setShowPaymentsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><LucideX/></button>
                </div>
             </div>

             <div className="p-10 space-y-8">
                {isAddingPayment ? (
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 animate-fadeIn space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-2"><LucidePlus className="text-blue-600"/> Registrar Pago de Cuota</h4>
                            <button onClick={() => setIsAddingPayment(false)} className="text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Nro Cuota</label>
                                <input type="number" onFocus={(e) => e.target.select()} className="w-full px-4 py-3 rounded-xl font-black bg-white border border-slate-200 outline-none" value={newPayment.nroCuota} onChange={e => setNewPayment({...newPayment, nroCuota: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Monto Pagado ({adminData.leasing_moneda})</label>
                                <input type="number" onFocus={(e) => e.target.select()} className="w-full px-4 py-3 rounded-xl font-black bg-white border border-slate-200 outline-none" value={newPayment.monto} onChange={e => setNewPayment({...newPayment, monto: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Pago</label>
                                <input type="date" className="w-full px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 outline-none" value={newPayment.fechaPago} onChange={e => setNewPayment({...newPayment, fechaPago: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Ref / Nro Transacción</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 outline-none" value={newPayment.referencia} onChange={e => setNewPayment({...newPayment, referencia: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleAddPayment} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                            <LucideCheck size={18}/> Confirmar Registro Contable
                        </button>
                    </div>
                ) : (
                    <button 
                        disabled={!editMode}
                        onClick={() => setIsAddingPayment(true)}
                        className={`w-full py-6 rounded-[2rem] border-2 border-dashed flex items-center justify-center gap-3 transition-all ${editMode ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'border-slate-100 text-slate-300'}`}
                    >
                        <LucidePlus size={24}/> {editMode ? 'Cargar Nueva Cuota Abonada' : 'Habilite Edición para cargar pagos'}
                    </button>
                )}

                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Nro</th>
                                    <th className="px-8 py-4">Fecha</th>
                                    <th className="px-8 py-4">Referencia</th>
                                    <th className="px-8 py-4 text-right">Importe ({adminData.leasing_moneda})</th>
                                    {editMode && <th className="px-8 py-4"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {adminData.leasing_pagos?.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4"><span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs italic">C{p.nroCuota}</span></td>
                                        <td className="px-8 py-4 font-bold text-xs text-slate-500">{format(parseISO(p.fechaPago), 'dd/MM/yyyy')}</td>
                                        <td className="px-8 py-4 font-black text-xs text-slate-700 uppercase tracking-tighter">{p.referencia || 'S/REF'}</td>
                                        <td className="px-8 py-4 text-right font-black text-slate-800 text-sm">{currencySymbol} {p.monto.toLocaleString()}</td>
                                        {editMode && (
                                            <td className="px-8 py-4 text-right">
                                                <button onClick={() => handleDeletePayment(p.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><LucideTrash2 size={16}/></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {(!adminData.leasing_pagos || adminData.leasing_pagos.length === 0) && (
                                    <tr><td colSpan={5} className="p-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No hay pagos registrados aún</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-950 text-white">
                                <tr>
                                    <td colSpan={3} className="px-8 py-6 font-black uppercase text-xs italic">Total Amortizado a la Fecha</td>
                                    <td className="px-8 py-6 text-right font-black text-xl text-emerald-400 italic">{currencySymbol} {totalPagado.toLocaleString()}</td>
                                    {editMode && <td></td>}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};