
import React, { useState } from 'react';
import { LucideSearch, LucideUser, LucideChevronRight, LucidePhone, LucideMail, LucideCar } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { UserRole } from '../../../types';

interface Props {
  onSelectDriver: (id: string) => void;
  limit?: number;
}

export const ListaConductores: React.FC<Props> = ({ onSelectDriver, limit }) => {
  const { registeredUsers } = useApp();
  const [search, setSearch] = useState('');

  // Filtramos usuarios que puedan ser conductores (USER o CONDUCTOR)
  const drivers = registeredUsers.filter(u => 
    u.role === UserRole.USER || (u as any).role === 'CONDUCTOR'
  ).filter(u => 
    u.nombre.toLowerCase().includes(search.toLowerCase()) || 
    u.apellido.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const displayDrivers = limit ? drivers.slice(0, limit) : drivers;

  return (
    <div className="space-y-6">
      {!limit && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="relative">
            <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            <input 
              type="text" 
              placeholder="BUSCAR CONDUCTOR POR NOMBRE O EMAIL..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">Identidad</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Centro de Costo</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayDrivers.map(d => (
                <tr key={d.id} onClick={() => onSelectDriver(d.id)} className="hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase">
                        {d.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase italic leading-none">{d.nombre} {d.apellido}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Legajo Cloud: {d.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                        <LucidePhone size={12}/> {d.telefono || 'S/N'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[9px] font-medium italic">
                        <LucideMail size={12}/> {d.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-white border border-slate-200 text-[9px] font-black uppercase text-blue-600 rounded-lg italic">
                      {d.costCenter || (d as any).centroCosto?.nombre || 'S/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <LucideChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all ml-auto" size={24}/>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center font-black text-slate-200 uppercase tracking-widest italic">No se encontraron conductores registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
