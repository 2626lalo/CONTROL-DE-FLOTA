
import React, { useState, useEffect } from 'react';
import { LucideCreditCard, LucideCalendar, LucideShieldAlert, LucideCheckCircle, LucideCamera, LucideRefreshCw, LucideFileUp, LucideLoader2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { db, storage } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useApp } from '../../../context/FleetContext';

interface Props {
  driverId: string;
}

export const LicenciasConductor: React.FC<Props> = ({ driverId }) => {
  const { addNotification } = useApp();
  const [licencia, setLicencia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    const fetchLic = async () => {
        try {
            const docRef = doc(db, 'licencias', driverId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setLicencia(snap.data());
            } else {
                // Default si no tiene cargada
                setLicencia({
                    numero: 'DNI-' + driverId.substring(0, 8),
                    clase: 'PROFESIONAL',
                    vencimiento: '2024-12-31',
                    imagen: ''
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    fetchLic();
  }, [driverId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newDate) {
        addNotification("Seleccione archivo e indique nueva fecha", "warning");
        return;
    }

    setLoading(true);
    try {
        const fileRef = ref(storage, `licencias/${driverId}/${Date.now()}.jpg`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        const updatedLic = {
            ...licencia,
            vencimiento: newDate,
            imagen: url,
            ultimoCambio: new Date().toISOString()
        };

        await updateDoc(doc(db, 'licencias', driverId), updatedLic);
        setLicencia(updatedLic);
        setIsRenewing(false);
        addNotification("Licencia renovada correctamente", "success");
    } catch (err) {
        addNotification("Error al cargar documento", "error");
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-300 font-black uppercase text-[10px]">Auditando Legajo Legal...</div>;

  const daysToExpire = differenceInDays(parseISO(licencia.vencimiento), new Date());
  const severity = daysToExpire < 15 ? 'RED' : daysToExpire < 30 ? 'YELLOW' : 'GREEN';

  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 animate-fadeIn">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><LucideCreditCard size={24}/></div>
          <h4 className="text-xl font-black text-slate-800 uppercase italic leading-none">Estatus de Licencia Legal</h4>
        </div>
        <button onClick={() => setIsRenewing(!isRenewing)} className={`px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-3 ${isRenewing ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl'}`}>
          {isRenewing ? <LucideRefreshCw size={14}/> : <LucideFileUp size={14}/>} {isRenewing ? 'Cancelar' : 'Renovar'}
        </button>
      </div>

      {isRenewing ? (
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200 animate-fadeIn space-y-6">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nueva Fecha de Vencimiento</label>
                <input type="date" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black outline-none shadow-sm" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <label className="w-full py-10 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-700 shadow-2xl transition-all">
                <LucideCamera size={32}/>
                <span>Capturar Nueva Licencia (Dorso)</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categoría / Clase</p>
                        <p className="text-lg font-black text-slate-800 uppercase italic mt-1">{licencia.clase}</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl font-black text-sm border border-slate-100">C1</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nro de Documento</p>
                    <p className="text-xl font-black text-slate-800 uppercase italic mt-1 tracking-tighter">{licencia.numero}</p>
                </div>
            </div>

            <div className={`p-8 rounded-[3rem] border-2 flex flex-col justify-between transition-all relative overflow-hidden group ${
                severity === 'RED' ? 'bg-rose-50 border-rose-200' : severity === 'YELLOW' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
                <div className="flex justify-between items-center relative z-10">
                    <LucideCalendar className={`${severity === 'RED' ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} size={28}/>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        severity === 'RED' ? 'bg-rose-600 text-white' : 'bg-white text-slate-800'
                    }`}>
                        {severity === 'RED' ? 'CRÍTICO' : 'VIGENCIA OK'}
                    </span>
                </div>
                <div className="relative z-10">
                    <p className={`text-[10px] font-black uppercase mt-6 ${severity === 'RED' ? 'text-rose-700' : 'text-slate-500'}`}>Plazo Legal Caduca</p>
                    <h5 className="text-4xl font-black italic tracking-tighter text-slate-800 mt-2 leading-none">{format(parseISO(licencia.vencimiento), 'dd/MM/yyyy')}</h5>
                    <div className="flex items-center gap-2 mt-6">
                        {severity === 'RED' ? <LucideShieldAlert className="text-rose-600" size={16}/> : <LucideCheckCircle className="text-emerald-600" size={16}/>}
                        <p className="text-[10px] font-black uppercase text-slate-600 italic tracking-widest">
                        {daysToExpire < 0 ? 'VENCIDO TOTAL' : `RESTAN ${daysToExpire} DÍAS`}
                        </p>
                    </div>
                </div>
                <LucideCreditCard className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000" size={200}/>
            </div>
        </div>
      )}
    </div>
  );
};
