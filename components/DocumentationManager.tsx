import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/FleetContext';
import { useSearchParams } from 'react-router-dom';
import { ImageZoomModal } from './ImageZoomModal';
import { DocumentUploadForm } from './DocumentUploadForm';
import { 
  LucideFileText, LucidePlus, LucideClock, LucideAlertCircle, 
  LucideShield, LucideShieldAlert, LucidePrinter, 
  LucidePencil, LucideBellRing, LucideBellOff, LucideTags, 
  LucideInfo, LucideTrash2, LucideShieldCheck, LucideX,
  LucideCheckSquare, LucideSquare, LucideImage,
  LucideDownload, LucideEye, LucideFileCheck, LucideCheck, LucideMinus, LucideAlertTriangle
} from 'lucide-react';
import { Document, Vehicle } from '../types';
import { differenceInDays, parseISO, startOfDay, format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  vehiclePlate?: string; 
}

interface ReportSelection {
  docId: string;
  selected: boolean;
  includeImages: boolean;
}

export const DocumentationManager: React.FC<Props> = ({ vehiclePlate }) => {
  const { vehicles, updateVehicle, addNotification, logAudit, registeredUsers, deleteDocument } = useApp();
  const [searchParams] = useSearchParams();
  const plateFromUrl = searchParams.get('plate');

  const [selectedPlate, setSelectedPlate] = useState<string | null>(vehiclePlate || plateFromUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | undefined>(undefined);
  const [zoomedImage, setZoomedImage] = useState<{url: string, label: string} | null>(null);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSelections, setReportSelections] = useState<ReportSelection[]>([]);

  useEffect(() => {
    if (vehiclePlate) setSelectedPlate(vehiclePlate);
  }, [vehiclePlate]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.plate === selectedPlate);
  }, [vehicles, selectedPlate]);

  useEffect(() => {
    if (isReportModalOpen && selectedVehicle) {
      setReportSelections(selectedVehicle.documents.map(d => ({
        docId: d.id,
        selected: true,
        includeImages: d.files && d.files.length > 0
      })));
    }
  }, [isReportModalOpen, selectedVehicle]);

  const handleSaveDocument = (docData: Document) => {
    if (!selectedVehicle) return;
    const targetId = String(docData.id);
    const currentDocs = [...(selectedVehicle.documents || [])];
    const index = currentDocs.findIndex(d => String(d.id) === targetId);
    
    let updatedDocs = index > -1 
      ? currentDocs.map(d => String(d.id) === targetId ? docData : d)
      : [...currentDocs, docData];

    updateVehicle({ ...selectedVehicle, documents: updatedDocs });
    
    setIsUploading(false);
    setEditingDoc(undefined);
    addNotification("Legajo procesado correctamente", "success");
    logAudit(index > -1 ? 'UPDATE_DOC' : 'ADD_DOC', 'VEHICLE', selectedVehicle.plate, `Tipo: ${docData.type}`);
  };

  const handleDeleteDocInternal = (id: string, type: string) => {
    if (!selectedVehicle) return;
    if (window.confirm(`¿Desea eliminar permanentemente el legajo: ${type.toUpperCase()}?`)) {
      deleteDocument(selectedPlate!, id);
    }
  };

  const getExpirationStatus = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === "" || dateStr === "undefined") {
        return { 
          label: 'PERMANENTE', 
          color: 'bg-slate-900 border-slate-800 text-slate-400', 
          icon: LucideShield, 
          message: 'REGISTRO SIN VENCIMIENTO',
          days: null 
        };
    }
    try {
      const expirationDate = parseISO(dateStr);
      const today = startOfDay(new Date());
      const diff = differenceInDays(expirationDate, today);

      if (diff < 0) return { 
        label: 'CADUCADO', 
        color: 'bg-rose-600 border-rose-700 text-white', 
        icon: LucideShieldAlert, 
        message: `VENCIDO HACE ${Math.abs(diff)} DÍAS`, 
        days: diff 
      };
      if (diff === 0) return { 
        label: 'VENCE HOY', 
        color: 'bg-orange-50 border-orange-600 text-white', 
        icon: LucideAlertCircle, 
        message: 'PLAZO LEGAL CADUCA HOY', 
        days: 0 
      };
      if (diff <= 30) return { 
        label: 'POR VENCER', 
        color: 'bg-amber-500 border-amber-600 text-amber-950', 
        icon: LucideClock, 
        message: `FALTAN ${diff} DÍAS PARA VENCER`, 
        days: diff 
      };
      return { 
        label: 'VIGENTE', 
        color: 'bg-emerald-600 border-emerald-700 text-white', 
        icon: LucideShieldCheck, 
        message: `VENCE EN ${diff} DÍAS`, 
        days: diff 
      };
    } catch {
      return { label: 'ERROR TÉCNICO', color: 'bg-slate-200', icon: LucideAlertCircle, message: 'FECHA INVÁLIDA', days: null };
    }
  };

  const generateAdvancedPDF = async () => {
    if (!selectedVehicle) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("DOSSIER TÉCNICO DOCUMENTAL", 15, 25);
    doc.setFontSize(10); doc.text(`UNIDAD: ${selectedVehicle.plate} | EMISIÓN: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 35);

    const docsToExport = selectedVehicle.documents.filter(d => 
        reportSelections.find(s => s.docId === d.id && s.selected)
    );

    autoTable(doc, {
      startY: 55,
      head: [['TIPO', 'NÚMERO', 'VENCIMIENTO', 'ESTADO']],
      body: docsToExport.map(d => [
        d.type.toUpperCase(), 
        d.documentNumber || 'S/N', 
        d.expirationDate || 'PERMANENTE', 
        getExpirationStatus(d.expirationDate).label
      ]),
      theme: 'grid', 
      headStyles: { fillColor: [30, 41, 59] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    for (const d of docsToExport) {
      const selection = reportSelections.find(s => s.docId === d.id);
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setTextColor(30, 41, 59); doc.setFontSize(14); doc.text(`DETALLE LEGAJO: ${d.type.toUpperCase()}`, 15, currentY);
      currentY += 10;

      if (d.customFields && d.customFields.length > 0) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text("Metadata Adicional:", 15, currentY); currentY += 7;
        d.customFields.forEach(f => { 
            doc.setFont('helvetica', 'normal'); doc.text(`• ${f.name}: ${f.value}`, 20, currentY); currentY += 5; 
        });
        currentY += 5;
      }

      if (selection?.includeImages && d.files && d.files.length > 0) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text("Evidencia Fotográfica:", 15, currentY); currentY += 10;
        let imgX = 15;
        for (const file of d.files) {
          if (currentY > 220) { doc.addPage(); currentY = 20; }
          try { 
              doc.addImage(file.url, 'JPEG', imgX, currentY, 85, 65); 
              imgX += 95; 
              if (imgX > 150) { imgX = 15; currentY += 75; } 
          } catch (e) {
              console.error("Error agregando imagen al PDF", e);
          }
        }
        if (imgX !== 15) currentY += 80;
      }
      currentY += 10; 
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY); 
      currentY += 15;
    }

    doc.save(`Dossier_${selectedVehicle.plate}_${Date.now()}.pdf`);
    setIsReportModalOpen(false);
    addNotification("Reporte PDF generado correctamente.", "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {zoomedImage && <ImageZoomModal url={zoomedImage.url} label={zoomedImage.label} onClose={() => setZoomedImage(null)} />}
      
      {isUploading && selectedVehicle && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <DocumentUploadForm 
             vehicle={selectedVehicle} 
             existingDoc={editingDoc} 
             availableUsers={registeredUsers} 
             onSave={handleSaveDocument} 
             onCancel={() => { setIsUploading(false); setEditingDoc(undefined); }} 
           />
        </div>
      )}

      {isReportModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn border-t-[12px] border-blue-600 flex flex-col max-h-[90vh]">
                <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <LucidePrinter className="text-blue-400" size={32}/>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Exportación Selectiva de Dossier</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Configuración de Reporte Técnico para Unidad {selectedVehicle.plate}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReportModalOpen(false)} className="text-white hover:text-rose-500 transition-colors"><LucideX/></button>
                </div>

                <div className="p-8 bg-slate-50 border-b flex justify-between items-center shrink-0">
                    <div className="flex gap-4">
                        <button onClick={() => setReportSelections(prev => prev.map(s => ({...s, selected: true})))} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all">
                            <LucideCheckSquare size={14} className="text-blue-600"/> Seleccionar Todo
                        </button>
                        <button onClick={() => setReportSelections(prev => prev.map(s => ({...s, selected: false})))} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all">
                            <LucideSquare size={14} className="text-slate-400"/> Desmarcar Todo
                        </button>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        {reportSelections.filter(s => s.selected).length} Legajos Seleccionados
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
                    {selectedVehicle.documents.map(doc => {
                        const selection = reportSelections.find(s => s.docId === doc.id);
                        if (!selection) return null;

                        return (
                            <div key={doc.id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${selection.selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 opacity-60'}`}>
                                <div className="flex items-center gap-5">
                                    <button onClick={() => setReportSelections(prev => prev.map(s => s.docId === doc.id ? {...s, selected: !s.selected} : s))} className="transition-transform active:scale-90">
                                        {selection.selected ? 
                                            <LucideCheckSquare size={24} className="text-blue-600"/> : 
                                            <LucideSquare size={24} className="text-slate-300"/>
                                        }
                                    </button>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 uppercase italic">{doc.type}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">NRO: {doc.documentNumber || 'S/N'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    {doc.files && doc.files.length > 0 && (
                                        <button 
                                            onClick={() => selection.selected && setReportSelections(prev => prev.map(s => s.docId === doc.id ? {...s, includeImages: !s.includeImages} : s))}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${!selection.selected ? 'cursor-not-allowed opacity-20' : selection.includeImages ? 'bg-emerald-50 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            <LucideImage size={16}/>
                                            <span className="text-[9px] font-black uppercase">{selection.includeImages ? 'Imágenes Incluidas' : 'Sin Imágenes'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0">
                    <button onClick={() => setIsReportModalOpen(false)} className="flex-1 py-5 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button 
                        onClick={generateAdvancedPDF} 
                        disabled={!reportSelections.some(s => s.selected)}
                        className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
                    >
                        <LucideDownload size={20}/> Procesar y Descargar Reporte
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic uppercase leading-none">
            <LucideFileText className="text-blue-600" size={32}/> Auditoría Legajos
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">Control Legal y Alertas de Vencimiento</p>
        </div>

        {selectedVehicle && (
          <div className="flex gap-2">
             <button onClick={() => setIsReportModalOpen(true)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all">
                <LucidePrinter size={18}/> Exportar Reporte
             </button>
             <button onClick={() => { setEditingDoc(undefined); setIsUploading(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:bg-blue-700 shadow-2xl transition-all">
                <LucidePlus size={20}/> Nuevo Legajo
             </button>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {(selectedVehicle.documents || []).length === 0 && (
              <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                 <LucideFileText size={64} className="mx-auto text-slate-100 mb-6"/>
                 <p className="text-slate-300 font-black uppercase text-xs tracking-widest italic">No hay documentos registrados para esta unidad</p>
              </div>
            )}
            
            {(selectedVehicle.documents || []).map(doc => {
            const status = getExpirationStatus(doc.expirationDate);
            const StatusIcon = status.icon;

            return (
                <div key={doc.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
                    <div className="bg-slate-950 p-6 flex justify-between items-center relative overflow-hidden">
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                              {doc.type.toUpperCase().includes('VTV') ? '🚗' : doc.type.toUpperCase().includes('SEGURO') ? '🛡️' : '📄'}
                          </div>
                          <div>
                              <h4 className="text-sm font-black text-white uppercase italic tracking-tight leading-none">{doc.type}</h4>
                              <p className="text-[8px] font-bold text-blue-400 uppercase mt-1">NRO: {doc.documentNumber || 'S/NUMERACIÓN'}</p>
                          </div>
                      </div>
                      
                      {doc.alertsEnabled === true ? (
                        <div className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/30 animate-pulse">
                          <LucideBellRing size={12}/>
                          <span className="text-[7px] font-black uppercase">Alertas ON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white/5 text-slate-600 px-3 py-1.5 rounded-xl border border-white/10 opacity-50">
                          <LucideBellOff size={12}/>
                          <span className="text-[7px] font-black uppercase">Manual</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 space-y-5">
                      <div className={`p-4 rounded-2xl border flex flex-col justify-center transition-all shadow-sm ${status.color}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StatusIcon size={20}/>
                                <div>
                                    <p className="text-[10px] font-black uppercase italic leading-none">{status.label}</p>
                                    <p className="text-[8px] font-bold uppercase opacity-80 mt-1">{status.message}</p>
                                </div>
                            </div>
                            {status.days !== null && (
                                <div className="text-right">
                                    <p className="text-[14px] font-black italic">{Math.abs(status.days)}</p>
                                    <p className="text-[7px] font-black uppercase opacity-70">DÍAS</p>
                                </div>
                            )}
                          </div>
                      </div>

                      {doc.customFields && doc.customFields.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2"><LucideTags size={10}/> Ficha Técnica</p>
                           <div className="grid grid-cols-1 gap-1.5">
                              {doc.customFields.map((field) => (
                                <div key={field.id} className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100">
                                   <span className="text-[9px] font-black text-slate-400 uppercase truncate pr-2">{field.name}:</span>
                                   <span className="text-[10px] font-bold text-slate-800 uppercase text-right truncate">{field.value}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                          {(doc.files || []).map(file => (
                              <div key={file.id} className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative cursor-zoom-in hover:border-blue-500 transition-all shadow-sm" onClick={() => setZoomedImage({url: file.url, label: doc.type})}>
                                  <img src={file.url} className="w-full h-full object-cover" alt="Doc"/>
                              </div>
                          ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                      <button 
                          onClick={(e) => { e.stopPropagation(); setEditingDoc(doc); setIsUploading(true); }} 
                          className="flex-[2] bg-white text-slate-800 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2"
                      >
                          <LucidePencil size={14}/> Editar
                      </button>
                      
                      <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteDocInternal(doc.id, doc.type); 
                          }} 
                          className="flex-1 bg-rose-50 text-rose-600 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm flex items-center justify-center gap-2"
                      >
                          <LucideTrash2 size={14}/>
                      </button>
                    </div>
                </div>
            );
            })}
        </div>
      )}
    </div>
  );
};
