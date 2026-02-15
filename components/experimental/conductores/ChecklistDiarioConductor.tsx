import React, { useState, useRef, useEffect } from 'react';
import { LucideClipboardCheck, LucideCheck, LucideAlertTriangle, LucideCamera, LucideSave, LucideTruck, LucideGauge, LucideLocate, LucideX, LucideEraser, LucideShieldCheck, LucideRefreshCw } from 'lucide-react';
import { useApp } from '../../../context/FleetContext';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const SignaturePad = ({ onEnd, label }: { onEnd: (base64: string) => void, label: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            }
        }
    }, []);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const rect = canvas?.getBoundingClientRect();
        if (ctx && rect) {
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            ctx.beginPath(); ctx.moveTo(x, y);
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const rect = canvas?.getBoundingClientRect();
        if (ctx && rect) {
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            ctx.lineTo(x, y); ctx.stroke();
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
            <div className="border-2 border-slate-200 rounded-[2rem] bg-slate-50 relative overflow-hidden h-40">
                <canvas 
                    ref={canvasRef} className="w-full h-full touch-none" 
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => { setIsDrawing(false); onEnd(canvasRef.current?.toDataURL() || ''); }}
                />
                <button type="button" onClick={() => { const ctx = canvasRef.current?.getContext('2d'); ctx?.clearRect(0,0,800,400); onEnd(''); }} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg text-slate-400 hover:text-rose-500"><LucideEraser size={16}/></button>
            </div>
        </div>
    );
};

export const ChecklistDiarioConductor: React.FC = () => {
  const { user, vehicles, addNotification } = useApp();
  const [km, setKm] = useState(0);
  const [plate, setPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [signature, setSignature] = useState('');
  
  const [items, setItems] = useState([
    { id: 'neumaticos', label: 'Estado y Presión de Neumáticos', status: 'OK' },
    { id: 'luces', label: 'Luces (Altas, Bajas, Giros, Freno)', status: 'OK' },
    { id: 'frenos', label: 'Sistema de Frenos (Tacto y Nivel)', status: 'OK' },
    { id: 'fluidos', label: 'Niveles (Aceite y Líquido de Limpia)', status: 'OK' },
    { id: 'limpieza', label: 'Higiene y Desinfección Interna', status: 'OK' },
    { id: 'docs', label: 'Documentación Vigente a Bordo', status: 'OK' },
  ]);

  // RASTREO SATELITAL EN TIEMPO REAL (ORQUESTADOR)
  useEffect(() => {
    if (!plate || plate.length < 6) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await addDoc(collection(db, 'ubicaciones'), {
            vehiclePlate: plate,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            velocidad: Math.round((pos.coords.speed || 0) * 3.6), // Convertir a km/h
            direccion: pos.coords.heading || 0,
            timestamp: new Date().toISOString(),
            precision: pos.coords.accuracy,
            conductorId: user?.id
          });
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch (error) {
          console.error('Telemetría Error:', error);
        }
      },
      (err) => console.error("GPS Signal Loss:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [plate, user?.id]);

  const toggleStatus = (id: string) => {
    setItems(items.map(it => it.id === id ? { ...it, status: it.status === 'OK' ? 'NOVEDAD' : 'OK' } : it));
  };

  const handleSave = async () => {
    if (!plate || !km || !signature) {
        addNotification("Complete todos los campos y firme el reporte", "error");
        return;
    }

    setIsSubmitting(true);
    try {
      // 1. Guardar Checklist
      await addDoc(collection(db, 'checklistsConductores'), {
        conductorId: user?.id,
        userName: user?.nombre,
        vehiclePlate: plate,
        kilometraje: km,
        items,
        signature,
        ubicacion: location,
        fecha: new Date().toISOString(),
        novedades: items.some(i => i.status === 'NOVEDAD')
      });

      // 2. Sincronizar KM con Vehículo si es mayor
      const v = vehicles.find(v => v.plate === plate);
      if (v && km > v.currentKm) {
        await updateDoc(doc(db, 'vehicles', plate), {
            currentKm: km,
            updatedAt: new Date().toISOString()
        });
      }

      addNotification("Inspección diaria sincronizada con éxito", "success");
      setPlate(''); setKm(0); setSignature('');
    } catch (err) {
      addNotification("Error al guardar inspección técnica", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-fadeIn pb-20">
      <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-8">
           <div className="p-5 bg-blue-600 rounded-[2rem] shadow-3xl animate-pulse"><LucideClipboardCheck size={40}/></div>
           <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Mi Control Diario</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2"><LucideShieldCheck size={14} className="text-emerald-500"/> Protocolo de Seguridad Corporativa</p>
           </div>
        </div>
        <LucideTruck className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000" size={280}/>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><LucideTruck size={14} className="text-blue-500"/> Patente Unidad</label>
               <input className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-2xl uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all text-slate-800" placeholder="ABC 123" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><LucideGauge size={14} className="text-indigo-500"/> KM Auditado</label>
               <input type="number" onFocus={e => e.target.select()} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] font-black text-2xl outline-none focus:ring-8 focus:ring-blue-50 transition-all text-indigo-600" value={km || ''} onChange={e => setKm(Number(e.target.value))} />
            </div>
         </div>

         <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b pb-4 mb-8 flex items-center gap-2"><LucideCheck size={16} className="text-emerald-600"/> Inspección de Sistemas Críticos</h4>
            <div className="grid grid-cols-1 gap-4">
                {items.map(it => (
                  <button 
                    key={it.id} 
                    type="button"
                    onClick={() => toggleStatus(it.id)}
                    className={`p-6 rounded-[2.5rem] border-2 flex justify-between items-center transition-all ${
                      it.status === 'OK' ? 'bg-white border-slate-100 hover:border-emerald-200' : 'bg-rose-50 border-rose-200 shadow-xl'
                    }`}
                  >
                    <span className={`font-black uppercase text-xs italic tracking-tight ${it.status === 'OK' ? 'text-slate-600' : 'text-rose-700'}`}>{it.label}</span>
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 transition-all ${it.status === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-600 text-white shadow-lg'}`}>
                       {it.status === 'OK' ? <LucideCheck size={18}/> : <LucideAlertTriangle size={18}/>}
                       <span className="text-[9px] font-black">{it.status}</span>
                    </div>
                  </button>
                ))}
            </div>
         </div>

         <div className="space-y-8 pt-6">
            <SignaturePad label="Firma de Conformidad del Chofer" onEnd={setSignature} />
            
            {location && (
                <div className="p-5 bg-slate-900 rounded-3xl flex items-center justify-between text-white animate-fadeIn">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-xl shadow-lg animate-pulse"><LucideLocate size={18}/></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Coordenadas Sincronizadas</p>
                        <p className="text-[10px] font-bold italic">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                      </div>
                   </div>
                   <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase">GPS ONLINE</span>
                </div>
            )}
         </div>

         <div className="pt-10 border-t border-slate-100 flex flex-col gap-6">
            <button 
                onClick={handleSave} 
                disabled={isSubmitting}
                className="w-full py-8 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-widest shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
               {isSubmitting ? <LucideRefreshCw className="animate-spin" size={24}/> : <LucideSave size={24}/>} 
               Finalizar y Enviar Reporte
            </button>
            <p className="text-[9px] font-black text-slate-300 uppercase text-center tracking-[0.4em] italic">Rastreo Satelital Sincronizado</p>
         </div>
      </div>
    </div>
  );
};