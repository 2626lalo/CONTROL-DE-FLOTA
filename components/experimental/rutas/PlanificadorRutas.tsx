
import React, { useState, useRef, useEffect } from 'react';
import { 
  LucideMapPin, LucidePlus, LucideTrash2, LucideNavigation, 
  LucideCalculator, LucideSave, LucideX, LucideInfo, LucideArrowRight,
  LucideMoreVertical, LucideGripVertical, LucideSearch
} from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { Autocomplete, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { ComparadorRutas } from './ComparadorRutas';
import { AsignarRuta } from './AsignarRuta';

declare const google: any;

export const PlanificadorRutas: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { addNotification } = useApp();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [directionsResponse, setDirectionsResponse] = useState<any | null>(null);
  const [step, setStep] = useState<'MAP' | 'COMPARE' | 'ASSIGN'>('MAP');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const originRef = useRef<any>(null);
  const destRef = useRef<any>(null);

  const calculateRoute = () => {
    if (!origin || !destination) {
      addNotification("Origen y Destino son obligatorios", "error");
      return;
    }
    setStep('COMPARE');
  };

  const handleDirectionsCallback = (response: any, status: string) => {
    if (status === 'OK' && response) {
      setDirectionsResponse(response);
    } else {
      addNotification("Error al calcular ruta. Verifique las direcciones.", "error");
      setStep('MAP');
    }
  };

  const moveStop = (fromIndex: number, toIndex: number) => {
    const newStops = [...stops];
    const [moved] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, moved);
    setStops(newStops);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-8 animate-fadeIn">
      {/* PANEL LATERAL */}
      <aside className="w-full md:w-96 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
             <LucideNavigation className="text-blue-600" size={20}/>
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Planificador</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-rose-500 transition-colors"><LucideX/></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Punto de Partida</label>
            <Autocomplete 
              onLoad={ref => originRef.current = ref}
              onPlaceChanged={() => originRef.current && setOrigin(originRef.current.getPlace().formatted_address)}
            >
              <input 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-inner" 
                placeholder="ORIGEN..." 
                value={origin} 
                onChange={e => setOrigin(e.target.value)}
              />
            </Autocomplete>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paradas Intermedias ({stops.length}/10)</label>
              <button 
                onClick={() => stops.length < 10 && setStops([...stops, ''])} 
                className="text-blue-600 hover:text-blue-800 p-1"
                disabled={stops.length >= 10}
              >
                <LucidePlus size={18}/>
              </button>
            </div>
            <div className="space-y-3">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex gap-2 animate-fadeIn group">
                  <div className="flex flex-col gap-1 justify-center py-2 px-1">
                    {idx > 0 && <button onClick={() => moveStop(idx, idx-1)} className="text-slate-300 hover:text-blue-600 transition-colors"><LucideArrowRight className="-rotate-90" size={12}/></button>}
                    {idx < stops.length - 1 && <button onClick={() => moveStop(idx, idx+1)} className="text-slate-300 hover:text-blue-600 transition-colors"><LucideArrowRight className="rotate-90" size={12}/></button>}
                  </div>
                  <Autocomplete 
                    className="flex-1"
                    onPlaceChanged={() => {
                        const newStops = [...stops];
                        // @ts-ignore
                        newStops[idx] = window.event.target.value; 
                        setStops(newStops);
                    }}
                  >
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
                  </Autocomplete>
                  <button onClick={() => setStops(stops.filter((_, i) => i !== idx))} className="p-4 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><LucideTrash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Destino Final</label>
            <Autocomplete
              onLoad={ref => destRef.current = ref}
              onPlaceChanged={() => destRef.current && setDestination(destRef.current.getPlace().formatted_address)}
            >
              <input 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-100 shadow-inner" 
                placeholder="DESTINO..." 
                value={destination} 
                onChange={e => setDestination(e.target.value)}
              />
            </Autocomplete>
          </div>
        </div>

        <button 
          onClick={calculateRoute}
          disabled={!origin || !destination}
          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
        >
          <LucideCalculator size={20}/> Calcular Trayectorias
        </button>
      </aside>

      {/* ÁREA DE RESULTADOS */}
      <section className="flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        {step === 'MAP' && (
          <div className="h-full flex items-center justify-center bg-slate-50 p-12 text-center">
             <div className="space-y-6 max-w-sm opacity-30">
                <LucideMapPin size={64} className="mx-auto text-blue-600 animate-bounce"/>
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Configure el origen y destino para previsualizar la trayectoria óptima.</p>
             </div>
          </div>
        )}
        
        {step === 'COMPARE' && (
          <>
            <DirectionsService
              options={{
                origin,
                destination,
                waypoints: stops.filter(s => s).map(s => ({ location: s, stopover: true })),
                travelMode: 'DRIVING',
                provideRouteAlternatives: true,
                optimizeWaypoints: true
              }}
              callback={handleDirectionsCallback}
            />
            {directionsResponse && (
              <ComparadorRutas 
                routes={directionsResponse.routes} 
                onSelect={(idx) => { setSelectedRouteIndex(idx); setStep('ASSIGN'); }}
                onBack={() => { setStep('MAP'); setDirectionsResponse(null); }}
              />
            )}
          </>
        )}

        {step === 'ASSIGN' && directionsResponse && (
           <AsignarRuta 
             route={directionsResponse.routes[selectedRouteIndex]}
             onCancel={() => setStep('COMPARE')}
             onConfirm={() => {
                addNotification("Logística despachada y notificada", "success");
                onCancel();
             }}
           />
        )}
      </section>
    </div>
  );
};
