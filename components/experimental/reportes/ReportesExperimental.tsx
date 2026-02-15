import React, { useState, useMemo } from 'react';
import { LucideBarChart3, LucideFileSpreadsheet, LucideFileText, LucideRefreshCw, LucideActivity } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { FiltrosReportes } from './FiltrosReportes';
import { TablaReporte } from './TablaReporte';
import { GraficosReporte } from './GraficosReporte';
import { exportReportToExcel } from './ExportarExcel';
import { exportReportToPDF } from './ExportarPDF';
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';

export const ReportesExperimental: React.FC = () => {
  const { vehicles, serviceRequests, registeredUsers, addNotification } = useApp();
  
  // States de Filtros
  const [type, setType] = useState('VEHICULOS');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costCenter, setCostCenter] = useState('');

  const allCCs = useMemo(() => {
    const set = new Set(vehicles.map(v => v.costCenter).filter(Boolean));
    return Array.from(set).sort();
  }, [vehicles]);

  const filteredData = useMemo(() => {
    let base: any[] = [];
    if (type === 'VEHICULOS') base = vehicles;
    if (type === 'SERVICIOS') base = serviceRequests;
    if (type === 'USUARIOS') base = registeredUsers;
    if (type === 'MANTENIMIENTO') base = vehicles;
    if (type === 'COSTOS') base = vehicles;

    return base.filter(item => {
      // Filtro CC
      if (costCenter && item.costCenter !== costCenter && item.centroCosto?.nombre !== costCenter) return false;
      
      // Filtro Fecha (si aplica al tipo)
      if (type === 'SERVICIOS') {
        const d = parseISO(item.createdAt);
        if (!isWithinInterval(d, { start: startOfDay(parseISO(dateFrom)), end: endOfDay(parseISO(dateTo)) })) return false;
      }
      return true;
    });
  }, [type, dateFrom, dateTo, costCenter, vehicles, serviceRequests, registeredUsers]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
            <LucideBarChart3 size={36}/>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LucideActivity size={18} className="text-blue-600"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Business Intelligence Hub</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Reportes Maestro</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <button 
            onClick={() => exportReportToExcel(filteredData, type, addNotification)}
            className="bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3"
          >
            <LucideFileSpreadsheet size={18}/> Exportar XLSX
          </button>
          <button 
            onClick={() => exportReportToPDF(filteredData, type, addNotification)}
            className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3"
          >
            <LucideFileText size={18}/> Descargar PDF
          </button>
        </div>
      </div>

      <FiltrosReportes 
        type={type} setType={setType}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        costCenter={costCenter} setCostCenter={setCostCenter}
        allCCs={allCCs}
        onReset={() => { setCostCenter(''); setDateFrom(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setDateTo(format(new Date(), 'yyyy-MM-dd')); }}
      />

      <GraficosReporte data={filteredData} type={type} />

      <div className="space-y-6">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Previsualización de Datos</h4>
        <TablaReporte data={filteredData} type={type} />
      </div>
    </div>
  );
};