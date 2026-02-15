import React from 'react';
import { format } from 'date-fns';

interface Props {
  data: any[];
  type: string;
}

export const TablaReporte: React.FC<Props> = ({ data, type }) => {
  if (!data || data.length === 0) return (
    <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No se encontraron registros para los filtros aplicados</p>
    </div>
  );

  const renderHeader = () => {
    switch (type) {
      case 'VEHICULOS': return ['Dominio', 'Marca', 'Modelo', 'KM Actual', 'Centro Costo', 'Estado'];
      case 'SERVICIOS': return ['Código', 'Unidad', 'Tipo Gestión', 'Estado', 'Fecha'];
      case 'USUARIOS': return ['Nombre', 'Email', 'Rol', 'CC', 'Estado'];
      case 'MANTENIMIENTO': return ['Unidad', 'KM Actual', 'Prox. Service', 'Restante', 'Alerta'];
      case 'COSTOS': return ['Unidad', 'CapEx', 'OpEx Hist.', 'Alquiler'];
      default: return [];
    }
  };

  const headers = renderHeader();

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                {type === 'VEHICULOS' && (
                  <>
                    <td className="px-8 py-5 font-black text-slate-800 text-xs italic">{item.plate}</td>
                    <td className="px-8 py-5 text-xs text-slate-600 font-bold uppercase">{item.make}</td>
                    <td className="px-8 py-5 text-xs text-slate-600 font-bold uppercase">{item.model}</td>
                    <td className="px-8 py-5 text-xs font-black text-slate-700">{item.currentKm.toLocaleString()} KM</td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[9px]">{item.costCenter}</span></td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg font-black text-[9px]">{item.status}</span></td>
                  </>
                )}
                {type === 'SERVICIOS' && (
                  <>
                    <td className="px-8 py-5 font-black text-slate-800 text-xs">{item.code}</td>
                    <td className="px-8 py-5 font-black text-blue-600 text-xs italic">{item.vehiclePlate}</td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{item.specificType}</td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[9px]">{item.stage}</span></td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400">{format(new Date(item.createdAt), 'dd/MM/yy')}</td>
                  </>
                )}
                {type === 'USUARIOS' && (
                  <>
                    <td className="px-8 py-5 font-black text-slate-800 text-xs uppercase">{item.nombre} {item.apellido}</td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">{item.email}</td>
                    <td className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">{item.role}</td>
                    <td className="px-8 py-5 text-[9px] font-black text-blue-500 uppercase">{item.costCenter || 'S/N'}</td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[9px]">{item.estado}</span></td>
                  </>
                )}
                {/* Agregando las otras columnas según necesidad */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};