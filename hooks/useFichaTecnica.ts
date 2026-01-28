
import { useState, useCallback, useEffect } from 'react';
import { Vehicle, FichaTecnica, AnalisisServicio } from '../types';
import { CHECKLIST_SECTIONS } from '../constants';

interface UseFichaTecnicaProps {
  vehiculo: Vehicle;
}

export const useFichaTecnica = ({ vehiculo }: UseFichaTecnicaProps) => {
  const [ficha, setFicha] = useState<FichaTecnica | null>(null);
  const [loading, setLoading] = useState(true);
  const [analisisServicio, setAnalisisServicio] = useState<AnalisisServicio | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const initFichaTecnica = () => {
      setLoading(true);
      if (vehiculo.fichaTecnica && vehiculo.fichaTecnica.neumaticos) {
        // Migración de datos viejos: Si no tiene accesoriosEstandar, inicializarlos
        if (!vehiculo.fichaTecnica.equipamiento.accesoriosEstandar) {
            vehiculo.fichaTecnica.equipamiento.accesoriosEstandar = CHECKLIST_SECTIONS.accessories.map(name => ({
                name, isEquipped: false, quantity: 1
            }));
        }
        setFicha(vehiculo.fichaTecnica);
      } else {
        const nuevaFicha: FichaTecnica = {
          id: `ficha_${vehiculo.plate}_${Date.now()}`,
          vehiculoId: vehiculo.plate,
          patente: vehiculo.plate,
          kilometrajeActual: vehiculo.currentKm || 0,
          ultimoServicio: { 
            kilometraje: vehiculo.currentKm > 10000 ? vehiculo.currentKm - 5000 : 0, 
            fecha: new Date().toISOString().split('T')[0],
            tipoServicio: 'Mantenimiento Preventivo',
            observaciones: ''
          },
          kilometrajeRecomendadoServicio: 10000,
          historialServicios: [],
          tipoCombustible: 'diesel',
          capacidadTanque: 80,
          garantiaVigente: true,
          vencimientoGarantia: '',
          sistemaTraccion: '4x4',
          tipoTransmision: 'manual',
          neumaticos: {
            delanteroIzquierdo: { marca: '', medidas: '', presion: 35, estado: 'nuevo' },
            delanteroDerecho: { marca: '', medidas: '', presion: 35, estado: 'nuevo' },
            traseroIzquierdo: { marca: '', medidas: '', presion: 35, estado: 'nuevo' },
            traseroDerecho: { marca: '', medidas: '', presion: 35, estado: 'nuevo' },
          },
          neumaticosAuxiliares: {
            auxiliar1: { marca: '', medidas: '', estado: 'nuevo', ubicacion: 'externa', presion: 35 },
            auxiliar2: { marca: '', medidas: '', estado: 'nuevo', ubicacion: 'externa', presion: 35 },
          },
          dimensiones: { largo: 0, ancho: 0, alto: 0, pesoBruto: 0, capacidadCarga: 0 },
          apariencia: { 
            color: vehiculo.color || '', 
            ploteado: false, 
            tipoPloteo: '',
            tipoCaja: 'abierta',
            observacionCaja: ''
          },
          sistemaElectrico: { 
            bateria: { marca: '', numeroSerie: '', amperaje: 80, tipo: 'original' },
            alternador: { marca: '', amperaje: 120 }
          },
          equipamiento: {
            accesoriosEstandar: CHECKLIST_SECTIONS.accessories.map(name => ({
                name, isEquipped: false, quantity: 1
            })),
            ruedasAuxilio: 1, barraAntivuelco: true, slingas: 1, grilletes: 2, conos: 2,
            cadenasDesatasco: 0, tablasDesatasco: 0, calzas: [], balizaEstroboscopica: 0,
            pertigaMinera: false, balizasTriangulo: 2, spot: { activo: false },
            starlink: false, radioBase: false, rastreoSatelital: { activo: false },
            cuarta: false, mantas: 0, botiquin: true, matafuegos: [],
            cajaHerramientas: { tiene: true, herramientas: [] }, baulHerramientas: false,
            bidonCombustible: 0, criqueGato: 1, llaveRueda: 1, trabasSeguridadRuedas: 0,
            handi: false, accesoriosAdicionales: [],
          },
          actualizadoPor: 'system',
          fechaActualizacion: new Date().toISOString(),
        };
        setFicha(nuevaFicha);
      }
      setLoading(false);
    };
    initFichaTecnica();
  }, [vehiculo]);

  const calcularAnalisis = useCallback((fichaData: FichaTecnica): AnalisisServicio => {
    const kmActual = fichaData.kilometrajeActual || 0;
    const kmUltimo = fichaData.ultimoServicio.kilometraje || 0;
    
    if (kmUltimo > kmActual) {
      return {
        kilometrajeActual: kmActual,
        kilometrajeUltimoServicio: kmUltimo,
        kilometrajeRecomendado: 10000,
        proximoServicioIntervalo: kmUltimo + 10000,
        proximoServicioHito: Math.floor(kmActual / 10000) * 10000 + 10000,
        porcentajeUso: 0,
        estado: 'error_logico',
        alerta: {
          nivel: 'critico',
          mensaje: 'ERROR: KM ÚLTIMO SERVICE NO PUEDE SER MAYOR AL ACTUAL',
          color: '#ef4444'
        }
      };
    }

    const proximoServicioIntervalo = kmUltimo + 10000;
    const hitoMasCercano = Math.floor(kmActual / 10000) * 10000;
    const proximoServicioHito = hitoMasCercano + 10000;
    
    let estado: AnalisisServicio['estado'] = 'ok';
    let mensaje = '';
    let color = '#3b82f6';
    
    const restanteIntervalo = proximoServicioIntervalo - kmActual;

    if (restanteIntervalo <= 0) {
      estado = 'atrasado';
      mensaje = `EXCEDIDO POR ${Math.abs(restanteIntervalo).toLocaleString()} KM`;
      color = '#ef4444';
    } else if (restanteIntervalo <= 1500) {
      estado = 'urgente';
      color = '#f97316';
      mensaje = `URGENTE: REALIZAR EN ${restanteIntervalo.toLocaleString()} KM`;
    } else if (restanteIntervalo <= 3000) {
      estado = 'pendiente';
      color = '#eab308';
      mensaje = `PRÓXIMO SERVICE EN ${restanteIntervalo.toLocaleString()} KM`;
    } else {
      estado = 'ok';
      mensaje = `CICLO OK: ${restanteIntervalo.toLocaleString()} KM RESTANTES`;
    }

    const kmRecorridosDesdeUltimo = kmActual - kmUltimo;
    const porcentajeUso = Math.min(100, (kmRecorridosDesdeUltimo / 10000) * 100);

    return {
      kilometrajeActual: kmActual,
      kilometrajeUltimoServicio: kmUltimo,
      kilometrajeRecomendado: 10000,
      proximoServicioIntervalo,
      proximoServicioHito,
      porcentajeUso,
      estado,
      alerta: {
        nivel: estado === 'atrasado' ? 'critico' : estado === 'urgente' ? 'alerta' : estado === 'pendiente' ? 'advertencia' : 'info',
        mensaje,
        color
      }
    };
  }, []);

  useEffect(() => {
    if (ficha) {
      const analisis = calcularAnalisis(ficha);
      setAnalisisServicio(analisis);
    }
  }, [ficha, calcularAnalisis]);

  return { ficha, loading, analisisServicio, isAiLoading, setFicha };
};
