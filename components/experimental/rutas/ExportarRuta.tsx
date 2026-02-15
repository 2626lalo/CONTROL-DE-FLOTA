
import React from 'react';
import { LucideShare2, LucideNavigation, LucideSend, LucideFileText, LucideLink } from 'lucide-react';

interface Props {
  origin: string;
  destination: string;
}

export const ExportarRuta: React.FC<Props> = ({ origin, destination }) => {
  const gMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

  const shareViaWhatsApp = () => {
    const text = `Ruta FleetPro Asignada: ${origin} -> ${destination}. Abrir en Google Maps: ${gMapsUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><LucideShare2 size={12}/> Canal de Despacho</h5>
      <div className="grid grid-cols-1 gap-3">
        <a 
          href={gMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-lg"
        >
          <LucideNavigation size={16}/> Enviar a Google Maps
        </a>
        <a 
          href={wazeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
        >
          <LucideLink size={16} className="text-blue-500"/> Abrir en Waze
        </a>
        <button 
          onClick={shareViaWhatsApp}
          className="w-full py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
        >
          <LucideSend size={16}/> Compartir WhatsApp
        </button>
      </div>
    </div>
  );
};
