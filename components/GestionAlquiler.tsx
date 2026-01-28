
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
  RentalPriceHistory, VehicleStatus, RentalPago, RentalReplacementEntry, OwnershipType 
} from '../types';
import { 
  format, parseISO, endOfMonth, eachMonthOfInterval, 
  getDaysInMonth, differenceInDays, addDays, isAfter, isBefore, isSameDay, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

  const handleFieldUpdate = (field: keyof AdministrativeData, value: any) => {
    onUpdate({ ...adminData, [field]: value });
  };

  const handleNestedFieldUpdate = (parent: string, field: string, value: any) => {
    onUpdate({ 
        ...adminData, 
        [parent]: { ...(adminData as any)[parent], [field]: value } 
    });
  };

  const expirationInfo = useMemo(() => {
    if (!adminData.fechaFinContrato) return null;
    const today = startOfDay(new Date());
    const endDate = startOfDay(parseISO(adminData.fechaFinContrato));
    const diff = differenceInDays(endDate, today);

    if (diff > 0) return { label: `Faltan ${diff} días para finalizar`, color: 'bg-emerald-100 text-emerald-700', isUrgent: diff <= 7 };
    if (diff === 0) return { label: 'El contrato finaliza hoy', color: 'bg-amber-100 text-amber-700', isUrgent: true };
    return { label: `Contrato excedido por ${Math.abs(diff)} días`, color: 'bg-rose-100 text-rose-700', isUrgent: true };
  }, [adminData.fechaFinContrato]);

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

      const relevantPrices = priceTimeline.filter(p => {
        const pDate = parseISO(p.date);
        return (isAfter(pDate, monthStart) || isSameDay(pDate, monthStart)) && 
               (isBefore(pDate, monthEnd) || isSameDay(pDate, monthEnd));
      });

      if (relevantPrices.length === 0) {
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
      } else {
        let currentPoint = isAfter(startDate, monthStart) ? startDate : monthStart;
        relevantPrices.forEach((price, idx) => {
          const nextPricePoint = relevantPrices[idx+1] ? parseISO(relevantPrices[idx+1].date) : null;
          const effectiveEnd = nextPricePoint ? addDays(nextPricePoint, -1) : (isBefore(endDate, monthEnd) ? endDate : monthEnd);
          const vigentes = differenceInDays(effectiveEnd, currentPoint) + 1;
          
          if (vigentes > 0) {
            const activePriceBefore = [...priceTimeline].reverse().find(p => isBefore(parseISO(p.date), currentPoint) || isSameDay(parseISO(p.date), currentPoint)) || priceTimeline[0];
            const costoDiario = activePriceBefore.monthlyCost / daysInMonth;
            periodos.push({
              id: `P-${format(currentPoint, 'yyyyMMdd')}`,
              fechaInicio: format(currentPoint, 'yyyy-MM-dd'),
              fechaFin: format(effectiveEnd, 'yyyy-MM-dd'),
              diasDelMes: daysInMonth,
              diasVigentes: vigentes,
              costoMensual: activePriceBefore.monthlyCost,
              costoDiario,
              costoAcumulado: costoDiario * vigentes,
              estadoPago: 'pendiente'
            });
          }
          if (nextPricePoint) currentPoint = nextPricePoint;
        });
      }
    });

    return periodos.reverse();
  }, [adminData]);

  const totalTeoricoAcumulado = periodosCalculados.reduce((acc, p) => acc + p.costoAcumulado, 0);
  const totalAbonadoReal = adminData.rental_pagos?.reduce((acc, p) => acc + p.monto, 0) || 0;

  // --- REPLACEMENT LOGIC ---
  const filteredAvailableVehicles = useMemo(() => {
    return vehicles.filter(v => 
        v.plate !== vehicle.plate && 
        v.status === VehicleStatus.ACTIVE &&
        v.plate.toLowerCase().includes(replacementSearch.toLowerCase())
    ).slice(0, 5);
  }, [vehicles, vehicle.plate, replacementSearch]);

  const handleLinkReplacement = (replacementUnit: Vehicle) => {
    if (!replacementReason) {
        alert("Indique el motivo de la sustitución");
        return;
    }

    const entry: RentalReplacementEntry = {
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        originalPlate: vehicle.plate,
        replacementPlate: replacementUnit.plate,
        reason: replacementReason,
        status: 'ACTIVE'
    };

    // 1. Actualizar Unidad Principal
    const updatedAdminPrincipal = {
        ...adminData,
        rental_linkedPlate: replacementUnit.plate,
        rental_replacementHistory: [...(adminData.rental_replacementHistory || []), entry]
    };
    onUpdate(updatedAdminPrincipal);
    if (onStatusChange) onStatusChange(VehicleStatus.MAINTENANCE);

    // 2. Actualizar Unidad de Reemplazo (Herencia de Datos)
    const updatedAdminReplacement: AdministrativeData = {
        ...(replacementUnit.adminData || adminData),
        regimen: OwnershipType.RENTED,
        proveedorAlquiler: adminData.proveedorAlquiler,
        valorAlquilerMensual: adminData.valorAlquilerMensual,
        rental_isReplacement: true,
        rental_linkedPlate: vehicle.plate,
        rental_replacementHistory: [...(replacementUnit.adminData?.rental_replacementHistory || []), entry]
    };
    updateVehicle({ ...replacementUnit, adminData: updatedAdminReplacement });

    setShowReplacementModal(false);
    addNotification(`Sustitución técnica vinculada: ${replacementUnit.plate}`, "success");
    logAudit('RENTAL_REPLACEMENT', 'VEHICLE', vehicle.plate, `Unidad reemplazada por ${replacementUnit.plate} - Motivo: ${replacementReason}`);
  };

  const handleUnlinkReplacement = () => {
    if (!adminData.rental_linkedPlate) return;
    const replacementPlate = adminData.rental_linkedPlate;
    const replacementUnit = vehicles.find(v => v.plate === replacementPlate);

    if (confirm(`¿Finalizar reemplazo de ${replacementPlate} y reintegrar unidad original?`)) {
        // 1. Limpiar Principal
        const updatedHistory = (adminData.rental_replacementHistory || []).map(h => 
            h.replacementPlate === replacementPlate ? { ...h, status: 'FINISHED' as const, returnDate: format(new Date(), 'yyyy-MM-dd') } : h
        );
        handleFieldUpdate('rental_linkedPlate', undefined);
        handleFieldUpdate('rental_replacementHistory', updatedHistory);
        if (onStatusChange) onStatusChange(VehicleStatus.ACTIVE);

        // 2. Limpiar Reemplazo
        if (replacementUnit) {
            const updatedAdminRepl = {
                ...replacementUnit.adminData!,
                rental_isReplacement: false,
                rental_linkedPlate: undefined
            };
            updateVehicle({ ...replacementUnit, status: VehicleStatus.ACTIVE, adminData: updatedAdminRepl });
        }

        addNotification("Unidad original reintegrada al servicio.");
        logAudit('RENTAL_RESTORE', 'VEHICLE', vehicle.plate, `Unidad original reintegrada. Fin de reemplazo ${replacementPlate}`);
    }
  };

  // --- EXPORTS ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("REPORTE DE PERÍODOS DE ALQUILER", 14, 20);
    doc.setFontSize(10); doc.text(`UNIDAD: ${vehicle.plate} | PROVEEDOR: ${adminData.proveedorAlquiler || 'N/A'}`, 14, 30);
    
    autoTable(doc, {
      startY: 45,
      head: [['Vigencia Inicio', 'Vigencia Fin', 'Días', 'Canon Mensual', 'Costo Diario', 'Total']],
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
    doc.save(`Periodos_Alquiler_${vehicle.plate}.pdf`);
  };

  const exportToExcel = () => {
    const data = periodosCalculados.map(p => ({
      'Inicio': p.fechaInicio,
      'Fin': p.fechaFin,
      'Días': p.diasVigentes,
      'Canon Mensual': p.costoMensual,
      'Costo Diario': p.costoDiario,
      'Total': p.costoAcumulado
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Periodos");
    XLSX.writeFile(workbook, `Periodos_Alquiler_${vehicle.plate}.xlsx`);
  };

  const handleConfirmDevolucion = () => {
    if (!returnDate) return;
    if (adminData.fechaInicioContrato && isBefore(parseISO(returnDate), parseISO(adminData.fechaInicioContrato))) {
        alert("La fecha de devolución no puede ser anterior a la fecha de inicio.");
        return;
    }
    handleFieldUpdate('fechaFinContrato', returnDate);
    if (onStatusChange) {
        onStatusChange(VehicleStatus.RETURNED);
    }
    setShowDevolucionModal(false);
  };

  const handleAddRentalPayment = () => {
    if (!newRentalPayment.monto || !newRentalPayment.nroComprobante) {
      alert("Por favor complete Monto y Nro Comprobante");
      return;
    }
    const payment: RentalPago = {
      id: Date.now().toString(),
      nroComprobante: newRentalPayment.nroComprobante || '',
      monto: Number(newRentalPayment.monto),
      fechaPago: newRentalPayment.fechaPago || format(new Date(), 'yyyy-MM-dd'),
      periodoNombre: newRentalPayment.periodoNombre || '',
      // Fix: Changed 'notas' to 'notes' to match RentalPago interface definition
      notes: newRentalPayment.notes || ''
    };
    const updatedPagos = [...(adminData.rental_pagos || []), payment].sort((a, b) => parseISO(b.fechaPago).getTime() - parseISO(a.fechaPago).getTime());
    handleFieldUpdate('rental_pagos', updatedPagos);
    setIsAddingPayment(false);
    setNewRentalPayment({
      nroComprobante: '',
      monto: adminData.valorAlquilerMensual || 0,
      fechaPago: format(new Date(), 'yyyy-MM-dd'),
      periodoNombre: format(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase()
    });
  };

  const handleDeleteRentalPayment = (id: string) => {
    if (!confirm("¿Eliminar registro de pago?")) return;
    const updatedPagos = (adminData.rental_pagos || []).filter(p => p.id !== id);
    handleFieldUpdate('rental_pagos', updatedPagos);
  };

  const exportPaymentsPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("REPORTE DE PAGOS DE ALQUILER", 14, 20);
    doc.setFontSize(10); doc.text(`UNIDAD: ${vehicle.plate} | PROVEEDOR: ${adminData.proveedorAlquiler || 'N/A'}`, 14, 30);
    doc.text(`TOTAL ABONADO: $${totalAbonadoReal.toLocaleString()}`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Fecha', 'Comprobante', 'Período', 'Monto']],
      body: adminData.rental_pagos?.map(p => [format(parseISO(p.fechaPago), 'dd/MM/yyyy'), p.nroComprobante, p.periodoNombre || '-', `$${p.monto.toLocaleString()}`]) || [],
      headStyles: { fillColor: [79, 70, 229] },
      theme: 'grid'
    });
    doc.save(`Pagos_Alquiler_${vehicle.plate}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SECCIÓN 1: DATOS DEL PROVEEDOR */}
      <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200 shadow-inner bg-indigo-50/10' : 'border-slate-100 shadow-sm'}`}>
         <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3 border-b pb-4 mb-8"><LucideUser className="text-indigo-600"/> Datos del Proveedor y Contacto</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa Proveedora</label>
               <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={adminData.proveedorAlquiler || ''} onChange={e => handleFieldUpdate('proveedorAlquiler', e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Persona de Contacto</label>
               <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={adminData.rentalProviderContact || ''} onChange={e => handleFieldUpdate('rentalProviderContact', e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Directo</label>
               <input disabled={!editMode} type="email" className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-indigo-600 underline'}`} value={adminData.rentalProviderEmail || ''} onChange={e => handleFieldUpdate('rentalProviderEmail', e.target.value)} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono / WhatsApp</label>
               <input disabled={!editMode} className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={adminData.rentalProviderPhone || ''} onChange={e => handleFieldUpdate('rentalProviderPhone', e.target.value)} />
            </div>
         </div>
      </section>

      {/* SECCIÓN NUEVA: SUSTITUCIÓN TÉCNICA (REEMPLAZO) */}
      <section className={`p-10 rounded-[3.5rem] border transition-all ${adminData.rental_linkedPlate ? 'bg-blue-900 text-white shadow-2xl border-blue-500' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl shadow-lg ${adminData.rental_linkedPlate ? 'bg-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <LucideShuffle size={28}/>
                </div>
                <div>
                    <h4 className={`text-lg font-black uppercase italic tracking-tighter ${adminData.rental_linkedPlate ? 'text-white' : 'text-slate-800'}`}>Sustitución Técnica</h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${adminData.rental_linkedPlate ? 'text-blue-300' : 'text-slate-400'}`}>Gestión de Unidades de Reemplazo</p>
                </div>
            </div>
            {!adminData.rental_linkedPlate ? (
                <button onClick={() => setShowReplacementModal(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all">
                    <LucideLink size={16}/> Vincular Reemplazo
                </button>
            ) : (
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-blue-300">Unidad de Sustitución Activa</p>
                        <p className="text-2xl font-black italic tracking-tighter">{adminData.rental_linkedPlate}</p>
                    </div>
                    <button onClick={handleUnlinkReplacement} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all" title="Reintegrar Unidad Original">
                        <LucideRotateCcw size={20}/>
                    </button>
                </div>
            )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className={`bg-white p-10 rounded-[3.5rem] border transition-all ${editMode ? 'border-indigo-200' : 'border-slate-100 shadow-sm'}`}>
           <div className="flex justify-between items-center border-b pb-4 mb-8">
                <h4 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-3"><LucideCalendar className="text-indigo-600"/> Registro de Contrato</h4>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Número de Contrato</label>
                 <div className="relative">
                    <LucideHash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input disabled={!editMode} type="text" className={`w-full pl-8 pr-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={adminData.rental_nroContrato || ''} onChange={e => handleFieldUpdate('rental_nroContrato', e.target.value)} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">CONDICION DE PAGO X DIAS</label>
                 <div className="relative">
                    <LucideClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input 
                      disabled={!editMode} 
                      type="number" 
                      min="0"
                      onFocus={(e) => e.target.select()} 
                      className={`w-full pl-8 pr-4 py-3 rounded-xl font-black border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-500'}`} 
                      value={adminData.configuracionPagos?.periodoPagoDias ?? 30} 
                      onChange={e => handleNestedFieldUpdate('configuracionPagos', 'periodoPagoDias', e.target.value === '' ? 0 : Number(e.target.value))} 
                    />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Inicio Alquiler</label>
                 <input disabled={!editMode} type="date" className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} value={adminData.fechaInicioContrato || ''} onChange={e => handleFieldUpdate('fechaInicioContrato', e.target.value)} />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Canon Inicial Mensual</label>
                 <div className="relative">
                    <LucideDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input 
                      disabled={!editMode} 
                      type="number" 
                      min="0"
                      onFocus={(e) => e.target.select()} 
                      className={`w-full pl-8 pr-4 py-3 rounded-xl font-black border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent'}`} 
                      value={adminData.valorAlquilerMensual ?? 0} 
                      onChange={e => handleFieldUpdate('valorAlquilerMensual', e.target.value === '' ? 0 : Number(e.target.value))} 
                    />
                 </div>
              </div>
              <div className="space-y-1 col-span-2">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Finalización / Devolución</label>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input 
                            disabled={!editMode} 
                            type="date" 
                            className={`w-full px-4 py-3 rounded-xl font-bold border ${editMode ? 'bg-white border-indigo-200' : 'bg-slate-50 border-transparent text-slate-400 italic'}`} 
                            value={adminData.fechaFinContrato || ''} 
                            onChange={e => {
                                if (adminData.fechaInicioContrato && isBefore(parseISO(e.target.value), parseISO(adminData.fechaInicioContrato))) {
                                    alert("La fecha de fin no puede ser anterior al inicio."); return;
                                }
                                handleFieldUpdate('fechaFinContrato', e.target.value);
                            }} 
                            placeholder="En curso..." 
                        />
                    </div>
                    {editMode && !adminData.fechaFinContrato && (
                        <button onClick={() => setShowDevolucionModal(true)} className="px-6 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                            <LucideRotateCcw size={14}/> Informar Devolución
                        </button>
                    )}
                 </div>
                 {expirationInfo && (
                    <div className={`mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-fadeIn ${expirationInfo.color} ${expirationInfo.isUrgent ? 'animate-pulse' : ''}`}>
                        <LucideTimer size={14}/> {expirationInfo.label}
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* BALANCE OPERATIVO */}
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
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase">Estado Contrato</p>
                        <p className={`text-[10px] font-black uppercase italic ${adminData.fechaFinContrato ? 'text-rose-500' : 'text-blue-500'}`}>
                        {adminData.fechaFinContrato ? `FINALIZADO EL ${format(parseISO(adminData.fechaFinContrato), 'dd/MM/yyyy')}` : 'VIGENTE (AUDITORÍA ACTIVA)'}
                        </p>
                    </div>
                    <LucideShieldCheck className={adminData.fechaFinContrato ? 'text-slate-700' : 'text-blue-500'} size={24}/>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => setShowPriceModal(true)} className="py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    <LucideTrendingUp size={14}/> Ajustar Canon
                </button>
                <button onClick={() => setShowPaymentsModal(true)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <LucideCreditCard size={14}/> Ver Pagos
                </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <LucideHistory size={20} className="text-slate-400"/>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detalle de Períodos Calculados</h4>
           </div>
           <div className="flex gap-2">
              <button onClick={exportToPDF} disabled={periodosCalculados.length === 0} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"><LucideFileText size={14}/> PDF</button>
              <button onClick={exportToExcel} disabled={periodosCalculados.length === 0} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"><LucideFileSpreadsheet size={14}/> EXCEL</button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Vigencia Período</th>
                <th className="px-10 py-6 text-center">Días</th>
                <th className="px-10 py-6 text-right">Canon Mensual</th>
                <th className="px-10 py-6 text-right">Costo Diario</th>
                <th className="px-10 py-6 text-right">Total Acumulado</th>
                <th className="px-10 py-6 text-center">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {periodosCalculados.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors group">
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${p.fechaFin === format(new Date(), 'yyyy-MM-dd') ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-400'}`}></div>
                        <p className="font-black text-slate-700 text-xs uppercase">{format(parseISO(p.fechaInicio), 'dd MMM yy', {locale: es})} → {format(parseISO(p.fechaFin), 'dd MMM yy', {locale: es})}</p>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center"><p className="text-xs font-bold text-slate-400">{p.diasVigentes} <span className="text-[9px] uppercase">/ {p.diasDelMes}</span></p></td>
                  <td className="px-10 py-6 text-right"><p className="font-black text-slate-600 text-xs">${p.costoMensual.toLocaleString()}</p></td>
                  <td className="px-10 py-6 text-right"><p className="font-bold text-slate-400 text-[10px]">${p.costoDiario.toFixed(2)}</p></td>
                  <td className="px-10 py-6 text-right"><p className="font-black text-emerald-600 text-sm">${p.costoAcumulado.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></td>
                  <td className="px-10 py-6 text-center"><button disabled className={`p-2 rounded-lg transition-all bg-slate-50 text-slate-200`}><LucideFileText size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VINCULACIÓN DE REEMPLAZO */}
      {showReplacementModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border-t-[12px] border-indigo-600">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl"><LucideShuffle size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Sustitución Técnica de Unidad</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asignar vehículo de reemplazo del proveedor</p>
                        </div>
                    </div>
                    <button onClick={() => setShowReplacementModal(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX/></button>
                </div>
                
                <div className="p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Motivo de la Sustitución</label>
                        <textarea 
                            rows={2} 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 resize-none"
                            placeholder="Ej: Ingreso a Taller por reparación de caja de cambios..."
                            value={replacementReason}
                            onChange={e => setReplacementReason(e.target.value)}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="relative">
                            <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                            <input 
                                type="text" 
                                placeholder="Buscar unidad disponible por patente..." 
                                className="w-full pl-14 pr-6 py-5 bg-white border-2 border-indigo-50 rounded-2xl font-black text-xl uppercase outline-none focus:border-indigo-600 transition-all"
                                value={replacementSearch}
                                onChange={e => setReplacementSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {filteredAvailableVehicles.map(v => (
                                <button 
                                    key={v.plate}
                                    onClick={() => handleLinkReplacement(v)}
                                    className="w-full p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-3xl flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 transition-colors">
                                            {v.plate.substring(0,2)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">{v.plate}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.make} {v.model}</p>
                                        </div>
                                    </div>
                                    <LucideArrowRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" size={28}/>
                                </button>
                            ))}
                            {replacementSearch && filteredAvailableVehicles.length === 0 && (
                                <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No se encontraron unidades disponibles</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-slate-50 border-t flex items-center gap-4">
                    <LucideInfo className="text-indigo-400 shrink-0" size={20}/>
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase">La unidad seleccionada heredarará las condiciones comerciales (Proveedor y Canon) de la unidad principal mientras dure la sustitución.</p>
                </div>
           </div>
        </div>
      )}

      {/* MODAL DE PAGOS */}
      {showPaymentsModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn my-auto border-t-[12px] border-indigo-600">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><LucideReceipt size={24}/></div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Historial de Pagos Alquiler</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Relación con Proveedor: {adminData.proveedorAlquiler || 'SIN NOMBRE'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportPaymentsPDF} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase"><LucideDownload size={16}/> PDF</button>
                    <button onClick={() => setShowPaymentsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><LucideX/></button>
                </div>
             </div>

             <div className="p-10 space-y-8">
                {isAddingPayment ? (
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 animate-fadeIn space-y-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h4 className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-2"><LucidePlus className="text-indigo-600"/> Registrar Pago de Alquiler</h4>
                            <button onClick={() => setIsAddingPayment(false)} className="text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Nro Comprobante</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl font-black bg-white border border-slate-200 outline-none" value={newRentalPayment.nroComprobante} onChange={e => setNewRentalPayment({...newRentalPayment, nroComprobante: e.target.value})} placeholder="Ej: F-0001-..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Monto Pagado ($)</label>
                                <input 
                                  type="number" 
                                  min="0"
                                  onFocus={(e) => e.target.select()} 
                                  className="w-full px-4 py-3 rounded-xl font-black bg-white border border-slate-200 outline-none" 
                                  value={newRentalPayment.monto ?? 0} 
                                  onChange={e => setNewRentalPayment({...newRentalPayment, monto: e.target.value === '' ? 0 : Number(e.target.value)})} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Pago</label>
                                <input type="date" className="w-full px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 outline-none" value={newRentalPayment.fechaPago} onChange={e => setNewRentalPayment({...newRentalPayment, fechaPago: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Período / Notas</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 outline-none" value={newRentalPayment.periodoNombre} onChange={e => setNewRentalPayment({...newRentalPayment, periodoNombre: e.target.value.toUpperCase()})} />
                            </div>
                        </div>
                        <button onClick={handleAddRentalPayment} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                            <LucideCheck size={18}/> Guardar Registro de Pago
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingPayment(true)}
                        className={`w-full py-6 rounded-[2rem] border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-3 transition-all`}
                    >
                        <LucidePlus size={24}/> Cargar Pago Realizado (Factura / Recibo)
                    </button>
                )}

                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Fecha</th>
                                    <th className="px-8 py-4">Comprobante</th>
                                    <th className="px-8 py-4">Período / Detalle</th>
                                    <th className="px-8 py-4 text-right">Importe Pagado ($)</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {adminData.rental_pagos?.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 font-bold text-xs text-slate-500">{format(parseISO(p.fechaPago), 'dd/MM/yyyy')}</td>
                                        <td className="px-8 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-black text-[10px] uppercase">{p.nroComprobante}</span></td>
                                        <td className="px-8 py-4 font-black text-xs text-slate-700 uppercase tracking-tighter">{p.periodoNombre || 'S/REF'}</td>
                                        <td className="px-8 py-4 text-right font-black text-emerald-600 text-sm">${p.monto.toLocaleString()}</td>
                                        <td className="px-8 py-4 text-right">
                                            <button onClick={() => handleDeleteRentalPayment(p.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><LucideTrash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {(!adminData.rental_pagos || adminData.rental_pagos.length === 0) && (
                                    <tr><td colSpan={5} className="p-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No se han registrado pagos reales aún</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-950 text-white">
                                <tr>
                                    <td colSpan={3} className="px-8 py-6 font-black uppercase text-xs italic">Inversión Real Acumulada (Suma de Pagos)</td>
                                    <td className="px-8 py-6 text-right font-black text-xl text-emerald-400 italic">${totalAbonadoReal.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODALES EXISTENTES */}
      {showDevolucionModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-t-[12px] border-rose-600">
            <div className="p-10 space-y-8 text-center">
               <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6"><LucideRotateCcw size={36}/></div>
               <h3 className="text-2xl font-black text-slate-800 uppercase italic">Finalizar Alquiler</h3>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Devolución Física (Requerido)</label>
                  <input type="date" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black text-xl text-center outline-none focus:ring-4 focus:ring-rose-100" value={returnDate} onChange={e => setReturnDate(e.target.value)} required />
               </div>
               <button onClick={handleConfirmDevolucion} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"><LucideCheck size={18}/> Finalizar y Dar de Baja</button>
               <button onClick={() => setShowDevolucionModal(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center"><h3 className="text-xl font-black uppercase italic">Ajustar Valor Mensual</h3><button onClick={() => setShowPriceModal(false)}><LucideX/></button></div>
            <div className="p-10 space-y-6">
               <input 
                type="number" 
                min="0"
                onFocus={(e) => e.target.select()} 
                placeholder="Nuevo Canon ($)" 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xl outline-none" 
                value={newPrice.cost} 
                onChange={e => setNewPrice({...newPrice, cost: e.target.value === '' ? '' : Number(e.target.value).toString()})} 
               />
               <input type="date" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newPrice.date} onChange={e => setNewPrice({...newPrice, date: e.target.value})} />
               <button onClick={() => { const history = [...(adminData.rentalPriceHistory || [])]; history.push({ id: Date.now().toString(), date: newPrice.date, monthlyCost: Number(newPrice.cost) }); handleFieldUpdate('rentalPriceHistory', history); setShowPriceModal(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-700 transition-all"><LucideCheck size={18}/> Aplicar Ajuste Técnico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
