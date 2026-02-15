
import React, { useState, useRef, useEffect } from 'react';
import { 
  LucideMapPin, LucidePlus, LucideTrash2, LucideNavigation, 
  LucideCalculator, LucideSave, LucideX, LucideInfo, LucideArrowRight,
  LucideMoreVertical, LucideGripVertical
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { ComparadorRutas } from './ComparadorRutas';
import { AsignarRuta } from './AsignarRuta';
import { CostosRuta } from './CostosRuta';

// FIX: Declare google global variable to avoid TypeScript errors when the Google Maps SDK is loaded dynamically
declare const google: any;

export const PlanificadorRutas: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { addNotification } = useApp();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  // FIX: Using 'any' type for google.maps.DirectionsResult to resolve namespace existence error
  const [calculatedRoutes, setCalculatedRoutes] = useState<any | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [step, setStep] = useState<'MAP' | 'COMPARE' | 'ASSIGN'>('MAP');

  const mapRef = useRef<HTMLDivElement>(null);
  // FIX: Using 'any' type for google.maps.DirectionsService to resolve namespace existence error
  const directionsService = useRef<any | null>(null);
  // FIX: Using 'any' type for google.maps.DirectionsRenderer to resolve namespace existence error
  const directionsRenderer = useRef<any | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // FIX: Accessing google.maps.Map after global declaration
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -34.6037, lng: -58.3816 },
      zoom: 12,
      styles: [
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "all", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
        { featureType: "landscape", elementType: "all", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "all", stylers: [{ color: "#1e293b" }] },
        { featureType: "water", elementType: "all", stylers: [{ color: "#3b82f6" }, { opacity: 0.2 }] }
      ]
    });

    // FIX: Initializing DirectionsService and DirectionsRenderer from google global
    directionsService.current = new google.maps.DirectionsService();
    directionsRenderer.current = new google.maps.DirectionsRenderer({ map });
  }, []);

  const calculateRoute = () => {
    if (!origin || !destination) {
      addNotification("Origen y Destino son requeridos", "error");
      return;
    }

    const waypoints = stops.map(s => ({ location: s, stopover: true }));

    directionsService.current?.route(
      {
        origin,
        destination,
        waypoints,
        // FIX: Accessing TravelMode from google global
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        optimizeWaypoints: true
      },
      (result: any, status: string) => {
        if (status === 'OK' && result) {
          setCalculatedRoutes(result);
          directionsRenderer.current?.setDirections(result);
          setStep('COMPARE');
        } else {
          addNotification("Fallo al calcular ruta. Verifique las direcciones.", "error");
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-8 animate-fadeIn">
      {/* PANEL LATERAL DE CONFIGURACIÓN */}
      <aside className="w-full md:w-96 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Nueva Ruta</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-rose-500 transition-colors"><LucideX/></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Punto de Partida</label>
            <input 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" 
              placeholder="Origen..." 
              value={origin} 
              onChange={e => setOrigin(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paradas Intermedias</label>
              <button onClick={() => setStops([...stops, ''])} className="text-blue-600 hover:text-blue-800"><LucidePlus size={16}/></button>
            </div>
            {stops.map((stop, idx) => (
              <div key={idx} className="flex gap-2 animate-fadeIn">
                <div className="flex-1 relative">
                  <input 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none" 
                    placeholder={`Parada ${idx+1}...`} 
                    value={stop} 
                    onChange={e => {
                      const next = [...stops];
                      next[idx] = e.target.value;
                      setStops(next);
                    }}
                  />
                </div>
                <button onClick={() => setStops(stops.filter((_, i) => i !== idx))} className="p-4 text-slate-300 hover:text-rose-500"><LucideTrash2 size={16}/></button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Destino Final</label>
            <input 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100" 
              placeholder="Destino..." 
              value={destination} 
              onChange={e => setDestination(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={calculateRoute}
          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <LucideCalculator size={20}/> Calcular Trayectorias
        </button>
      </aside>

      {/* ÁREA DE MAPA / COMPARACIÓN */}
      <section className="flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        {step === 'MAP' && <div ref={mapRef} className="w-full h-full grayscale-[0.5] contrast-[1.1]" />}
        
        {step === 'COMPARE' && calculatedRoutes && (
           <ComparadorRutas 
             routes={calculatedRoutes.routes} 
             onSelect={(idx) => { setSelectedRouteIndex(idx); setStep('ASSIGN'); }}
             onBack={() => setStep('MAP')}
           />
        )}

        {step === 'ASSIGN' && calculatedRoutes && (
           <AsignarRuta 
             route={calculatedRoutes.routes[selectedRouteIndex]}
             onCancel={() => setStep('COMPARE')}
             onConfirm={() => {
                addNotification("Ruta planificada y asignada con éxito", "success");
                onCancel();
             }}
           />
        )}
      </section>
    </div>
  );
};
