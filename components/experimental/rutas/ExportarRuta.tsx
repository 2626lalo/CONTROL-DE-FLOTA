
import React from 'react';
import { LucideShare2, LucideNavigation, LucideSend, LucideFileText, LucideLink, LucideMap, LucideExternalLink, LucideSmartphone } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';

interface Props {
  origin: string;
  destination: string;
  paradas?: string[];
}

export const ExportarRuta: React.FC<Props> = ({ origin, destination, paradas = [] }) => {
  const { addNotification } = useApp();

  const generarLinkGoogleMaps = () => {
    const waypoints = paradas.length > 0 ? `&waypoints=${paradas.map(p => encodeURIComponent(p)).join('|')}` : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints}&travelmode=driving`;
  };

  const generarLinkWaze = () => {
    // Waze suele ir solo al destino, pero permite deep linking al destino final
    return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
  };

  const shareViaWhatsApp = () => {
    const text = `🚛 RUTA FLEETPRO ASIGNADA\n\n📍 Origen: ${origin}\n🏁 Destino: ${destination}\n\n📍 Iniciar Navegación: ${generarLinkGoogleMaps()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    addNotification("Enlace compartido vía WhatsApp", "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-3 border-b pb-4">
         <LucideSmartphone className="text-blue-600" size={18}/>
         <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Canales de Despacho Digital</h5>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <a 
          href={generarLinkGoogleMaps()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 group"
        >
          <LucideNavigation size={18} className="group-hover:rotate-45 transition-transform"/> Enviar a Google Maps
        </a>
        
        <div className="grid grid-cols-2 gap-4">
            <a 
            href={generarLinkWaze()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
            >
            <LucideLink size={14} className="text-blue-500"/> Waze
            </a>
            <button 
            onClick={shareViaWhatsApp}
            className="py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
            >
            <LucideSend size={14}/> WhatsApp
            </button>
        </div>

        <button 
          onClick={() => addNotification("Generando bitácora PDF...", "warning")}
          className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
        >
          <LucideFileText size={16}/> Descargar Bitácora Técnica
        </button>
      </div>
    </div>
  );
};
