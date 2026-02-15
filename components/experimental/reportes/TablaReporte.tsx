import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { LucideChevronLeft, LucideChevronRight, LucideChevronsUpDown, LucideAlertTriangle, LucideCheckCircle2 } from 'lucide-react';

interface Props {
  data: any[];
  type: string;
}

export const TablaReporte: React.FC<Props> = ({ data, type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (!data || data.length === 0) return (
    <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No se encontraron registros para los filtros aplicados</p>
    </div>
  );

  const getHeaders = () => {
    switch (type) {
      case 'VEHICULOS': return [
        { label: 'Dominio', field: 'plate' },
        { label: 'Marca/Modelo', field: 'make' },
        { label: 'KM Actual', field: 'currentKm' },
        { label: 'Centro Costo', field: 'costCenter' },
        { label: 'Estado', field: 'status' }
      ];
      case 'SERVICIOS': return [
        { label: 'Código', field: 'code' },
        { label: 'Unidad', field: 'vehiclePlate' },
        { label: 'Gestión', field: 'specificType' },
        { label: 'Estado', field: 'stage' },
        { label: 'Fecha', field: 'createdAt' }
      ];
      case 'USUARIOS': return [
        { label: 'Nombre', field: 'nombre' },
        { label: 'Email', field: 'email' },
        { label: 'Rol', field: 'role' },
        { label: 'CC', field: 'costCenter' },
        { label: 'Estado', field: 'estado' }
      ];
      case 'MANTENIMIENTO': return [
        { label: 'Unidad', field: 'plate' },
        { label: 'KM Actual', field: 'currentKm' },
        { label: 'Prox. Service', field: 'nextServiceKm' },
        { label: 'Restante', field: 'nextServiceKm' },
        { label: 'Ciclo', field: 'status' }
      ];
      case 'COSTOS': return [
        { label: 'Unidad', field: 'plate' },
        { label: 'CapEx', field: 'purchaseValue' },
        { label: 'OpEx Acum.', field: 'totalOpex' },
        { label: 'Renting Mes', field: 'costoAlquiler' }
      ];
      default: return [];
    }
  };

  const headers = getHeaders();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {headers.map(h => (
                  <th 
                    key={h.label} 
                    onClick={() => handleSort(h.field)}
                    className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {h.label} <LucideChevronsUpDown size={12}/>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                  {type === 'VEHICULOS' && (
                    <>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs italic">{item.plate}</td>
                      <td className="px-8 py-5 text-xs text-slate-600 font-bold uppercase">{item.make} {item.model}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-700">{item.currentKm?.toLocaleString()} KM</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[9px]">{item.costCenter}</span></td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg font-black text-[9px] uppercase">{item.status}</span></td>
                    </>
                  )}
                  {type === 'SERVICIOS' && (
                    <>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs">{item.code}</td>
                      <td className="px-8 py-5 font-black text-blue-600 text-xs italic">{item.vehiclePlate}</td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{item.specificType}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[9px] uppercase">{item.stage}</span></td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-400">{item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yy') : 'S/N'}</td>
                    </>
                  )}
                  {type === 'USUARIOS' && (
                    <>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs uppercase italic">{item.nombre} {item.apellido}</td>
                      <td className="px-8 py-5 text-xs text-slate-500 font-medium">{item.email}</td>
                      <td className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">{item.role}</td>
                      <td className="px-8 py-5 text-[9px] font-black text-blue-500 uppercase">{item.costCenter || item.centroCosto?.nombre || 'S/N'}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[9px] uppercase">{item.estado}</span></td>
                    </>
                  )}
                  {type === 'MANTENIMIENTO' && (
                    <>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs italic">{item.plate}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-700">{item.currentKm?.toLocaleString()} KM</td>
                      <td className="px-8 py-5 text-xs font-black text-blue-600">{item.nextServiceKm?.toLocaleString()} KM</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-800 italic">{(item.nextServiceKm - item.currentKm)?.toLocaleString()} KM</td>
                      <td className="px-8 py-5">
                        {(item.nextServiceKm - item.currentKm) < 1500 ? (
                          <span className="flex items-center gap-2 text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg animate-pulse">
                            <LucideAlertTriangle size={12}/> URGENTE
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                            <LucideCheckCircle2 size={12}/> CICLO OK
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  {type === 'COSTOS' && (
                    <>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs italic">{item.plate}</td>
                      <td className="px-8 py-5 text-xs font-black text-blue-600">$ {(item.purchaseValue || 0).toLocaleString()}</td>
                      <td className="px-8 py-5 text-xs font-black text-rose-600">$ {(item.totalOpex || 0).toLocaleString()}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-700">$ {(item.adminData?.valorAlquilerMensual || 0).toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-6">
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filas por página:</label>
          <select 
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
          >
            <LucideChevronLeft size={20}/>
          </button>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Página {currentPage} de {totalPages || 1}</span>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
          >
            <LucideChevronRight size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
};