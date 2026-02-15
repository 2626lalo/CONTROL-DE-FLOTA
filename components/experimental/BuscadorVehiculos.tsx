import React, { useState, useMemo } from 'react';
import { LucideSearch, LucideCar, LucideRefreshCw, LucideCheckCircle2 } from 'lucide-react';
import { Vehicle } from '../../types';

interface Props {
  vehicles: Vehicle[];
  userCC: string;
  isSupervisorOrAdmin: boolean;
  onSelect: (v: Vehicle) => void;
  error?: boolean;
}

export const BuscadorVehiculos: React.FC<Props> = ({ vehicles, userCC, isSupervisorOrAdmin, onSelect, error }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const suggestions = useMemo(() => {
    if (!query || selected) return [];
    const term = query.toUpperCase();
    return vehicles.filter(v => {
      const matchCC = isSupervisorOrAdmin || v.costCenter?.toUpperCase() === userCC.toUpperCase();
      return matchCC && (v.plate.includes(term) || v.make.toUpperCase().includes(term) || v.model.toUpperCase().includes(term));
    }).slice(0, 5);
  }, [query, vehicles, userCC, isSupervisorOrAdmin, selected]);

  const handleSelect = (v: Vehicle) => {
    setSelected(v);
    setQuery(v.plate);
    setShowSuggestions(false);
    onSelect(v);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-4 relative w-full animate-fadeIn">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Identificación de Unidad</label>
      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
          {selected ? <LucideCheckCircle2 className="text-emerald-500" size={24}/> : <LucideSearch size={24}/>}
        </div>
        <input 
          type="text" 
          placeholder="BUSCAR PATENTE / MODELO..." 
          className={`w-full pl-16 pr-24 py-6 bg-slate-50 border-2 rounded-[2.5rem] font-black text-2xl uppercase outline-none transition-all ${error ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-100 focus:ring-8 focus:ring-blue-50 focus:bg-white'} ${selected ? 'text-emerald-600 bg-emerald-50/30' : ''}`}
          value={query}
          onChange={e => { setQuery(e.target.value.toUpperCase()); setSelected(null); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
        />
        {selected && (
          <button 
            type="button"
            onClick={handleClear}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all active:scale-90"
          >
            <LucideRefreshCw size={18}/>
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[100] w-full mt-3 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            {suggestions.map(v => (
              <div 
                key={v.plate} 
                onClick={() => handleSelect(v)}
                className="p-6 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-blue-600 transition-colors">
                    <LucideCar size={24}/>
                  </div>
                  <div>
                    <span className="font-black text-2xl italic text-slate-800 uppercase tracking-tighter leading-none">{v.plate}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{v.make} {v.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {v.costCenter}
                  </span>
                  <p className="text-[8px] font-bold text-slate-300 mt-2 uppercase italic">{v.province}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};