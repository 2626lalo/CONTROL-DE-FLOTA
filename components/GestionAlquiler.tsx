import * as XLSX from 'xlsx';
import React, { useState, useMemo } from 'react';
import { 
  LucideTrendingUp, LucideCalendar, LucideDollarSign, LucideHistory, LucideX, 
  LucideCheck, LucidePlus, LucideFileText, LucideDownload, 
  LucideAlertCircle, LucideBell, LucideTrash2, LucideCalculator, 
  LucideRotateCcw, LucideTimer, LucideFileSpreadsheet, LucideHash, LucideClock, LucideUser,
  LucideCreditCard, LucideReceipt, LucideShieldCheck, LucideShuffle, LucideLink, LucideSearch, LucideArrowRight,
  LucideInfo
} from 'lucide-react';
import { 
  Vehicle, AdministrativeData, PeriodoAlquiler, 
  RentalPriceHistory, VehicleStatus, RentalPago, OwnershipType 
} from '../types';
import { 
  format, parseISO, endOfMonth, eachMonthOfInterval, 
  getDaysInMonth, differenceInDays, addDays, isAfter, isBefore, isSameDay, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/FleetContext';

interface Props {
  vehicle: Vehicle;
  adminData: AdministrativeData;
  onUpdate: (updatedAdmin: AdministrativeData) => void;
  onStatusChange?: (newStatus: VehicleStatus) => void;
  editMode?: boolean;
}

export const GestionAlquiler: React.FC<Props> = ({ vehicle, adminData, onUpdate, onStatusChange, editMode = false }) => {
  const { vehicles, updateVehicle, addNotification, logAudit } = useApp();
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  
  const [replacementSearch, setReplacementSearch] = useState('');
  const [replacementReason, setReplacementReason] = useState('');

  const [newPrice, setNewPrice] = useState({ cost: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [returnDate, setReturnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newRentalPayment, setNewRentalPayment] = useState<Partial<RentalPago>>({
    nroComprobante: '',
    monto: adminData.valorAlquilerMensual || 0,
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    periodoNombre: format(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase()
  });

  const periodosCalculados = useMemo(() => {
    if (!adminData.fechaInicioContrato) return [];
    const startDate = parseISO(adminData.fechaInicioContrato);
    const endDate = adminData.fechaFinContrato ? parseISO(adminData.fechaFinContrato) : endOfMonth(new Date());
    
    let priceTimeline: RentalPriceHistory[] = [
      { id: 'initial', date: adminData.fechaInicioContrato, monthlyCost: adminData.valorAlquilerMensual || 0 },
      ...(adminData.rentalPriceHistory || [])
    ].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    if (isAfter(startDate, endDate)) return [];

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const periodos: PeriodoAlquiler[] = [];

    months.forEach((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth = getDaysInMonth(monthStart);
      const activePrice = [...priceTimeline].reverse().find(p => isBefore(parseISO(p.date), monthStart) || isSameDay(parseISO(p.date), monthStart)) || priceTimeline[0];
      const effectiveStart = isAfter(startDate, monthStart) ? startDate : monthStart;
      const effectiveEnd = isBefore(endDate, monthEnd) ? endDate : monthEnd;
      const vigentes = differenceInDays(effectiveEnd, effectiveStart) + 1;

      if (vigentes > 0) {
          const costoDiario = activePrice.monthlyCost / daysInMonth;
          periodos.push({
            id: `P-${format(monthStart, 'yyyyMM')}`,
            fechaInicio: format(effectiveStart, 'yyyy-MM-dd'),
            fechaFin: format(effectiveEnd, 'yyyy-MM-dd'),
            diasDelMes: daysInMonth,
            diasVigentes: vigentes,
            costoMensual: activePrice.monthlyCost,
            costoDiario,
            costoAcumulado: costoDiario * vigentes,
            estadoPago: 'pendiente'
          });
      }
    });

    return periodos.reverse();
  }, [adminData]);

  const totalTeoricoAcumulado = periodosCalculados.reduce((acc, p) => acc + p.costoAcumulado, 0);
  const totalAbonadoReal = adminData.rental_pagos?.reduce((acc, p) => acc + p.monto, 0) || 0;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("REPORTE DE PERÍODOS DE ALQUILER", 14, 20);
    doc.setFontSize(10); doc.text(`UNIDAD: ${vehicle.plate} | PROVEEDOR: ${adminData.proveedorAlquiler || 'N/A'}`, 14, 30);
    
    autoTable(doc, {
      startY: 45,
      head: [['Inicio', 'Fin', 'Días', 'Canon', 'Diario', 'Total']],
      body: periodosCalculados.map(p => [
        format(parseISO(p.fechaInicio), 'dd/MM/yyyy'),
        format(parseISO(p.fechaFin), 'dd/MM/yyyy'),
        p.diasVigentes.toString(),
        `$${p.costoMensual.toLocaleString()}`,
        `$${p.costoDiario.toFixed(2)}`,
        `$${p.costoAcumulado.toLocaleString(undefined, {minimumFractionDigits: 2})}`
      ]),
      headStyles: { fillColor: [79, 70, 229] },
      theme: 'grid'
    });
    doc.save(`Periodos_Alquiler_${vehicle.plate}_${Date.now()}.pdf`);
    addNotification("Reporte PDF descargado.");
  };

  const handleConfirmDevolucion = () => {
    if (!returnDate) return;
    onUpdate({ ...adminData, fechaFinContrato: returnDate });
    if (onStatusChange) onStatusChange(VehicleStatus.RETURNED);
    setShowDevolucionModal(false);
  };

  const handleAddRentalPayment = () => {
    if (!newRentalPayment.monto || !newRentalPayment.nroComprobante) return;
    const payment: RentalPago = {
      id: Date.now().toString(),
      nroComprobante: newRentalPayment.nroComprobante || '',
      monto: Number(newRentalPayment.monto),
      fechaPago: newRentalPayment.fechaPago || format(new Date(), 'yyyy-MM-dd'),
      periodoNombre: newRentalPayment.periodoNombre || '',
      notes: newRentalPayment.notes || ''
    };
    const updatedPagos = [...(adminData.rental_pagos || []), payment].sort((a, b) => parseISO(b.fechaPago).getTime() - parseISO(a.fechaPago).getTime());
    onUpdate({ ...adminData, rental_pagos: updatedPagos });
    setIsAddingPayment(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SECCIÓN PROVEEDOR */}
      <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200' : 'border-slate-100 shadow-sm'}`}>
         <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4 mb-8"><LucideUser className="text-indigo-600"/> Proveedor de Renting</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa</label>
               <input disabled={!editMode} className="w-full px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.proveedorAlquiler || ''} onChange={e => onUpdate({...adminData, proveedorAlquiler: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Contacto</label>
               <input disabled={!editMode} className="w-full px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.rentalProviderContact || ''} onChange={e => onUpdate({...adminData, rentalProviderContact: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
               <input disabled={!editMode} className="w-full px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.rentalProviderEmail || ''} onChange={e => onUpdate({...adminData, rentalProviderEmail: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono</label>
               <input disabled={!editMode} className="w-full px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.rentalProviderPhone || ''} onChange={e => onUpdate({...adminData, rentalProviderPhone: e.target.value})} />
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200' : 'border-slate-100 shadow-sm'}`}>
           <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4 mb-8"><LucideCalendar className="text-indigo-600"/> Vigencia de Contrato</h4>
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio</label>
                 <input disabled={!editMode} type="date" className="w-full px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.fechaInicioContrato || ''} onChange={e => onUpdate({...adminData, fechaInicioContrato: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Canon Mensual</label>
                 <input disabled={!editMode} type="number" className="w-full px-4 py-3 rounded-xl font-black border border-slate-100 bg-slate-50" value={adminData.valorAlquilerMensual || 0} onChange={e => onUpdate({...adminData, valorAlquilerMensual: Number(e.target.value)})} />
              </div>
              <div className="space-y-1 col-span-2">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin / Devolución</label>
                 <div className="flex gap-4">
                    <input disabled={!editMode} type="date" className="flex-1 px-4 py-3 rounded-xl font-bold border border-slate-100 bg-slate-50" value={adminData.fechaFinContrato || ''} onChange={e => onUpdate({...adminData, fechaFinContrato: e.target.value})} />
                    {editMode && !adminData.fechaFinContrato && (
                        <button onClick={() => setShowDevolucionModal(true)} className="px-6 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-lg hover:bg-rose-700">Devolver</button>
                    )}
                 </div>
              </div>
           </div>
        </section>

        <div className="bg-slate-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-start mb-8">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-blue-400">Balance Operativo</h4>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><LucideCalculator size={24}/></div>
              </div>
              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Abonado Real</p>
                      <p className="text-4xl font-black text-emerald-400 tracking-tighter">${totalAbonadoReal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gasto Teórico</p>
                      <p className="text-xl font-black text-slate-400 tracking-tighter">${totalTeoricoAcumulado.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => setShowPaymentsModal(true)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <LucideCreditCard size={14}/> Ver Pagos
                </button>
                <button onClick={exportToPDF} className="py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    <LucideDownload size={14}/> Exportar Períodos
                </button>
           </div>
        </div>
      </div>

      {/* MODALES */}
      {showDevolucionModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-t-[12px] border-rose-600">
            <div className="p-10 space-y-8 text-center">
               <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto"><LucideRotateCcw size={36}/></div>
               <h3 className="text-2xl font-black text-slate-800 uppercase italic">Confirmar Devolución</h3>
               <input type="date" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black text-xl text-center outline-none" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
               <button onClick={handleConfirmDevolucion} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"><LucideCheck size={18}/> Procesar Baja</button>
               <button onClick={() => setShowDevolucionModal(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentsModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn border-t-[12px] border-indigo-600">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl"><LucideReceipt size={24}/></div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Historial de Pagos</h3>
                </div>
                <button onClick={() => setShowPaymentsModal(false)} className="text-white hover:text-rose-500"><LucideX/></button>
             </div>
             <div className="p-10 space-y-8">
                {isAddingPayment ? (
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input type="text" placeholder="Comprobante" className="w-full p-4 rounded-xl border" value={newRentalPayment.nroComprobante} onChange={e => setNewRentalPayment({...newRentalPayment, nroComprobante: e.target.value})} />
                            <input type="number" placeholder="Monto" className="w-full p-4 rounded-xl border" value={newRentalPayment.monto || ''} onChange={e => setNewRentalPayment({...newRentalPayment, monto: Number(e.target.value)})} />
                            <input type="date" className="w-full p-4 rounded-xl border" value={newRentalPayment.fechaPago} onChange={e => setNewRentalPayment({...newRentalPayment, fechaPago: e.target.value})} />
                            <input type="text" placeholder="Período" className="w-full p-4 rounded-xl border" value={newRentalPayment.periodoNombre} onChange={e => setNewRentalPayment({...newRentalPayment, periodoNombre: e.target.value})} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleAddRentalPayment} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs">Guardar Pago</button>
                            <button onClick={() => setIsAddingPayment(false)} className="px-8 py-4 bg-white text-slate-400 rounded-xl font-black uppercase text-xs border">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingPayment(true)} className="w-full py-6 rounded-3xl border-2 border-dashed border-indigo-200 text-indigo-600 font-black uppercase text-[10px] hover:bg-indigo-50 transition-all">Cargar Pago Realizado</button>
                )}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                            <tr>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Comprobante</th>
                                <th className="px-8 py-4">Período</th>
                                <th className="px-8 py-4 text-right">Importe</th>
                                <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {adminData.rental_pagos?.map(p => (
                                <tr key={p.id}>
                                    <td className="px-8 py-4 text-xs font-bold">{format(parseISO(p.fechaPago), 'dd/MM/yyyy')}</td>
                                    <td className="px-8 py-4 text-xs font-black text-indigo-600">{p.nroComprobante}</td>
                                    <td className="px-8 py-4 text-xs uppercase">{p.periodoNombre}</td>
                                    <td className="px-8 py-4 text-right font-black text-emerald-600">${p.monto.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right">
                                        <button onClick={() => onUpdate({...adminData, rental_pagos: adminData.rental_pagos?.filter(x => x.id !== p.id)})} className="text-slate-300 hover:text-rose-500 transition-colors"><LucideTrash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
