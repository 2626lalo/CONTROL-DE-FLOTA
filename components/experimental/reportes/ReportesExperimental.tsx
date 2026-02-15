import React, { useState, useMemo, useEffect } from 'react';
import { LucideBarChart3, LucideFileSpreadsheet, LucideFileText, LucideRefreshCw, LucideActivity, LucideLoader2 } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { FiltrosReportes } from './FiltrosReportes';
import { TablaReporte } from './TablaReporte';
import { GraficosReporte } from './GraficosReporte';
import { exportReportToExcel } from './ExportarExcel';
import { exportReportToPDF } from './ExportarPDF';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { collection, getDocs, query, where, orderBy, Query } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export const ReportesExperimental: React.FC = () => {
  const { addNotification, vehicles: contextVehicles, serviceRequests: contextServices, registeredUsers: contextUsers } = useApp();
  
  // States de Datos
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States de Filtros
  const [type, setType] = useState('VEHICULOS');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costCenter, setCostCenter] = useState('');
  const [status, setStatus] = useState('');

  const allCCs = useMemo(() => {
    const set = new Set(contextVehicles.map(v => v.costCenter).filter(Boolean));
    return Array.from(set).sort();
  }, [contextVehicles]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let collectionName = '';
      
      switch(type) {
        case 'VEHICULOS':
        case 'MANTENIMIENTO':
        case 'COSTOS':
          collectionName = 'vehicles';
          break;
        case 'SERVICIOS':
          collectionName = 'requests';
          break;
        case 'USUARIOS':
          collectionName = 'users';
          break;
        default:
          collectionName = 'vehicles';
      }
      
      let queryRef: Query = collection(db, collectionName);
      
      // Aplicar filtros de Firestore si es posible (en producción es mejor)
      // Para este prototipo, cargamos y filtramos localmente para asegurar compatibilidad total con el esquema
      const snapshot = await getDocs(queryRef);
      const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrado Local Avanzado
      data = rawData.filter(item => {
        // Filtro CC
        if (costCenter) {
          const itemCC = (item.costCenter || item.centroCosto?.nombre || '').toUpperCase();
          if (itemCC !== costCenter.toUpperCase()) return false;
        }

        // Filtro Estado
        if (status) {
          const itemStatus = (item.status || item.stage || item.estado || '').toUpperCase();
          if (itemStatus !== status.toUpperCase()) return false;
        }
        
        // Filtro Fecha (si aplica al tipo)
        const dateField = item.createdAt || item.fechaRegistro || item.fechaCarga;
        if (dateField && (type === 'SERVICIOS' || type === 'USUARIOS')) {
          const d = parseISO(dateField);
          const start = startOfDay(parseISO(dateFrom));
          const end = endOfDay(parseISO(dateTo));
          if (d < start || d > end) return false;
        }

        return true;
      });
      
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      addNotification('Error al cargar datos de Firestore', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [type, dateFrom, dateTo, costCenter, status]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] space-y-10 animate-fadeIn p-4 md:p-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-950 text-white rounded-[2rem] shadow-2xl rotate-3">
            <LucideBarChart3 size={36}/>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LucideActivity size={18} className="text-blue-600"/>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Advanced Business Intelligence</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Módulo de Reportes</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <button 
            disabled={loading || reportData.length === 0}
            onClick={() => exportReportToExcel(reportData, type, addNotification)}
            className="bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <LucideFileSpreadsheet size={18}/> Excel
          </button>
          <button 
            disabled={loading || reportData.length === 0}
            onClick={() => exportReportToPDF(reportData, type, addNotification)}
            className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <LucideFileText size={18}/> PDF
          </button>
          <button 
            onClick={loadReportData}
            className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"
          >
            <LucideRefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <FiltrosReportes 
        type={type} setType={setType}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        costCenter={costCenter} setCostCenter={setCostCenter}
        status={status} setStatus={setStatus}
        allCCs={allCCs}
        onReset={() => { setCostCenter(''); setStatus(''); setDateFrom(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setDateTo(format(new Date(), 'yyyy-MM-dd')); }}
        resultCount={reportData.length}
      />

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 animate-pulse">
           <LucideLoader2 size={64} className="text-blue-600 animate-spin"/>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando Base de Datos...</p>
        </div>
      ) : (
        <div className="space-y-12 animate-fadeIn">
          <GraficosReporte data={reportData} type={type} />
          
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Vista Previa de Registros</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{reportData.length} resultados encontrados</p>
            </div>
            <TablaReporte data={reportData} type={type} />
          </div>
        </div>
      )}
    </div>
  );
};