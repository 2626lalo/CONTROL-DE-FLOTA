import React, { useState, useEffect, useCallback } from 'react';
import { LucideShield, LucidePlus, LucideTarget, LucideX, LucideTrash2, LucideCheck, LucideBell, LucideSave, LucideLoader2 } from 'lucide-react';
import { GoogleMap, DrawingManager, Polygon, Circle } from '@react-google-maps/api';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useApp } from '../../../context/FleetContext';

// FIX: Declare google global variable to avoid TypeScript errors when using Google Maps SDK members
declare const google: any;

export const GeocercasExperimental: React.FC = () => {
  const { user, vehicles, addNotification } = useApp();
  const [geocercas, setGeocercas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [newGeo, setNewGeo] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [notifIn, setNotifIn] = useState(true);
  const [notifOut, setNotifOut] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'geocercas'), orderBy('fechaCreacion', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setGeocercas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const onPolygonComplete = (polygon: any) => {
    const path = polygon.getPath().getArray().map((latLng: any) => ({
      lat: latLng.lat(),
      lng: latLng.lng()
    }));
    setNewGeo({ type: 'POLYGON', path });
    polygon.setMap(null); // Borrar el dibujo temporal
  };

  const onCircleComplete = (circle: any) => {
    const center = { lat: circle.getCenter().lat(), lng: circle.getCenter().lng() };
    const radius = circle.getRadius();
    setNewGeo({ type: 'CIRCLE', center, radius });
    circle.setMap(null);
  };

  const handleSave = async () => {
    if (!name || !newGeo) {
      addNotification("Complete el nombre y dibuje una zona", "warning");
      return;
    }

    try {
      await addDoc(collection(db, 'geocercas'), {
        nombre: name.toUpperCase(),
        tipo: newGeo.type,
        coordenadas: newGeo.type === 'POLYGON' ? newGeo.path : null,
        center: newGeo.type === 'CIRCLE' ? newGeo.center : null,
        radio: newGeo.type === 'CIRCLE' ? newGeo.radius : null,
        vehiculosAsignados: selectedVehicles,
        reglas: { entrada: notifIn, salida: notifOut },
        creadoPor: user?.id,
        fechaCreacion: new Date().toISOString()
      });
      addNotification("Geocerca activada correctamente", "success");
      setNewGeo(null);
      setName('');
      setSelectedVehicles([]);
      setDrawing(false);
    } catch (err) {
      addNotification("Error al guardar geocerca", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar geocerca?")) return;
    await deleteDoc(doc(db, 'geocercas', id));
    addNotification("Geocerca removida", "warning");
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row animate-fadeIn">
      <aside className="w-full lg:w-96 bg-white border-r border-slate-100 p-8 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center border-b pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
              <LucideShield size={24}/>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 uppercase italic leading-none">Gestión Perimetral</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Zonas de Control Satelital</p>
            </div>
          </div>
          <button 
            onClick={() => setDrawing(!drawing)}
            className={`p-4 rounded-2xl shadow-xl transition-all active:scale-95 ${drawing ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}
          >
            {drawing ? <LucideX size={20}/> : <LucidePlus size={20}/>}
          </button>
        </div>

        {drawing && (
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-indigo-200 space-y-6 animate-fadeIn">
            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <LucidePlus size={14}/> Nueva Definición
            </h5>
            <div className="space-y-4">
               <input 
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500 font-bold uppercase text-xs"
                placeholder="NOMBRE DE LA ZONA..."
                value={name}
                onChange={e => setName(e.target.value)}
               />
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 italic text-[9px] text-blue-600 font-bold leading-relaxed">
                  Use las herramientas de dibujo en el mapa para marcar el perímetro (Círculo o Polígono).
               </div>
               
               <div className="space-y-2">
                 <p className="text-[8px] font-black text-slate-400 uppercase px-2">Unidades Vinculadas</p>
                 <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-white rounded-xl border border-slate-200">
                    {vehicles.map(v => (
                      <label key={v.plate} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer rounded-lg">
                        <input 
                          type="checkbox" 
                          checked={selectedVehicles.includes(v.plate)}
                          onChange={e => e.target.checked ? setSelectedVehicles([...selectedVehicles, v.plate]) : setSelectedVehicles(selectedVehicles.filter(x => x !== v.plate))}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-[10px] font-black uppercase text-slate-600">{v.plate}</span>
                      </label>
                    ))}
                 </div>
               </div>

               <div className="flex gap-2">
                  <button onClick={handleSave} disabled={!name || !newGeo} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg disabled:opacity-30">Activar Geocerca</button>
               </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {geocercas.map(geo => (
            <div key={geo.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        {geo.tipo === 'CIRCLE' ? 'O' : 'Δ'}
                     </div>
                     <div>
                        <h5 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{geo.nombre}</h5>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{geo.vehiculosAsignados?.length || 0} Vehículos vinculados</p>
                     </div>
                  </div>
                  <button onClick={() => handleDelete(geo.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                     <LucideTrash2 size={16}/>
                  </button>
               </div>
               <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${geo.reglas?.entrada ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>IN</span>
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${geo.reglas?.salida ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>OUT</span>
               </div>
            </div>
          ))}
          {geocercas.length === 0 && (
            <div className="py-20 text-center opacity-20">
               <LucideShield size={64} className="mx-auto mb-4"/>
               <p className="text-[10px] font-black uppercase tracking-widest">Sin geocercas activas</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 bg-slate-100 relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: -34.6037, lng: -58.3816 }}
          zoom={12}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {drawing && (
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              onCircleComplete={onCircleComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.POLYGON]
                },
                circleOptions: { fillColor: '#10b981', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#10b981' },
                polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#3b82f6' }
              }}
            />
          )}

          {geocercas.map(geo => (
            <React.Fragment key={geo.id}>
              {geo.tipo === 'POLYGON' && geo.coordenadas && (
                <Polygon 
                  paths={geo.coordenadas}
                  options={{ fillColor: '#3b82f6', fillOpacity: 0.1, strokeWeight: 2, strokeColor: '#3b82f6' }}
                />
              )}
              {geo.tipo === 'CIRCLE' && geo.center && (
                <Circle 
                  center={geo.center}
                  radius={geo.radio}
                  options={{ fillColor: '#10b981', fillOpacity: 0.1, strokeWeight: 2, strokeColor: '#10b981' }}
                />
              )}
            </React.Fragment>
          ))}
        </GoogleMap>
      </main>
    </div>
  );
};