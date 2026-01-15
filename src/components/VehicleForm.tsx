import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Vehicle, VehicleStatus, OwnershipType, Document as VehicleDocument, ServiceHistory } from '../types';
import { analyzeVehicleImage, analyzeDocumentImage } from '../services/geminiService';
import { Save, ArrowLeft, Upload, Trash2, Loader, Camera, FileText, Image, ScanLine, AlertCircle, Check, RefreshCw, Plus, X, ZoomIn, XCircle, Building2, History, Paperclip, ExternalLink, Eye, ZoomOut, MousePointer2, Download, Calendar } from 'lucide-react';
import { jsPDF } from "jspdf";

// --- Utilidad para comprimir imágenes ---
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calcular nuevas dimensiones manteniendo la relación de aspecto
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 JPEG con calidad especificada
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        // Quitar el prefijo (ej: "data:image/jpeg;base64,")
        const base64Data = compressedBase64.split(',')[1];

        console.log(`📊 Imagen comprimida: ${file.name}`);
        console.log(`📏 Original: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`📏 Comprimido: ${(base64Data.length * 0.75 / 1024).toFixed(2)} KB`);

        resolve(base64Data);
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

// --- Simple Image Viewer Component (sin cambios) ---
const SimpleImageViewer = ({ url, onClose }: { url: string, onClose: () => void }) => {
    const isPdf = url.startsWith('data:application/pdf');
    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full z-10"><XCircle size={32}/></button>
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {isPdf ? (
                    <iframe src={url} className="w-full h-full bg-white rounded-lg" title="PDF Viewer"></iframe>
                ) : (
                    <img src={url} className="max-w-full max-h-full object-contain" />
                )}
            </div>
        </div>
    );
};

// --- Document Detail Modal (sin cambios) ---
const DocumentDetailModal = ({ doc, onClose, onAddImage, onDeleteImage }: { doc: VehicleDocument, onClose: () => void, onAddImage: (files: FileList) => void, onDeleteImage: (idx: number) => void }) => {
    const [scale, setScale] = useState(1);
    const [currentImgIdx, setCurrentImgIdx] = useState(0);
    const imgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setScale(1); }, [currentImgIdx]);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY * -0.001;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 4));
    };

    const handleDownloadPDF = () => {
        const docName = doc.name || 'Documento';
        const images = doc.images || [];
        
        if (images.length === 0) return;

        if (images.length === 1 && images[0].startsWith('data:application/pdf')) {
            const link = document.createElement('a');
            link.href = images[0];
            link.download = `${docName.replace(/\s+/g, '_')}.pdf`;
            link.click();
            return;
        }

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        images.forEach((img, i) => {
            if (img.startsWith('data:application/pdf')) return;

            if (i > 0) pdf.addPage();
            
            const imgProps = pdf.getImageProperties(img);
            const ratio = imgProps.width / imgProps.height;
            
            const margin = 10;
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);

            let w = availableWidth;
            let h = w / ratio;

            if (h > availableHeight) {
                h = availableHeight;
                w = h * ratio;
            }

            const x = (pageWidth - w) / 2;
            const y = (pageHeight - h) / 2;

            pdf.addImage(img, 'JPEG', x, y, w, h);
        });

        pdf.save(`${docName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const currentUrl = (doc.images && doc.images[currentImgIdx]) ? doc.images[currentImgIdx] : '';
    const isPdf = currentUrl.startsWith('data:application/pdf');

    const getDocTypeLabel = (doc: VehicleDocument) => {
        switch (doc.type) {
            case 'INSURANCE': return 'Seguro';
            case 'VTV_RTO': return 'VTV / RTO';
            case 'TITLE': return 'Cédula / Título';
            case 'IDENTIFICATION': return 'Identificación';
            case 'OTHER': return doc.name; 
            default: return doc.type;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
                
                <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col">
                    <div 
                        ref={imgContainerRef}
                        className="flex-1 flex items-center justify-center overflow-hidden cursor-move relative"
                        onWheel={handleWheel}
                    >
                        {currentUrl ? (
                            isPdf ? (
                                <iframe src={currentUrl} className="w-full h-full bg-white" title="PDF Viewer"></iframe>
                            ) : (
                                <img 
                                    src={currentUrl} 
                                    className="transition-transform duration-100 ease-out origin-center"
                                    style={{ transform: `scale(${scale})` }}
                                    alt="Document"
                                    draggable={false}
                                />
                            )
                        ) : (
                            <div className="text-white text-center">No hay imagen disponible</div>
                        )}
                        
                        {!isPdf && currentUrl && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 pointer-events-none backdrop-blur-sm">
                                <MousePointer2 size={12}/> Usar rueda para Zoom ({Math.round(scale * 100)}%)
                            </div>
                        )}
                    </div>

                    <div className="h-20 bg-black/40 backdrop-blur-md p-2 flex items-center gap-2 overflow-x-auto z-10">
                        {doc.images && doc.images.map((img, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setCurrentImgIdx(idx)}
                                className={`h-16 w-16 min-w-[4rem] rounded border-2 cursor-pointer overflow-hidden relative group ${idx === currentImgIdx ? 'border-blue-500 opacity-100' : 'border-white/30 opacity-60 hover:opacity-100'}`}
                            >
                                {img.startsWith('data:application/pdf') ? (
                                    <div className="w-full h-full bg-white flex items-center justify-center text-red-600"><FileText/></div>
                                ) : (
                                    <img src={img} className="w-full h-full object-cover" />
                                )}
                                {doc.images.length > 1 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteImage(idx); if(idx === currentImgIdx) setCurrentImgIdx(0); }}
                                        className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={10}/>
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        <label className="h-16 w-16 min-w-[4rem] rounded border-2 border-dashed border-white/50 flex flex-col items-center justify-center text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
                            <Plus size={20}/>
                            <span className="text-[9px] font-bold">Agregar</span>
                            <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && onAddImage(e.target.files)} />
                        </label>
                    </div>
                </div>

                <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Detalle Documento</h3>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleDownloadPDF} 
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Descargar como PDF"
                            >
                                <Download size={20}/>
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nombre / Título</label>
                            <p className="font-bold text-slate-800 text-lg leading-tight">{doc.name}</p>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tipo Documento</label>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold inline-block">
                                {getDocTypeLabel(doc)}
                            </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Vencimiento</label>
                                {doc.expirationDate ? (
                                    <p className={`font-mono font-bold text-lg ${new Date(doc.expirationDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                        {new Date(doc.expirationDate).toLocaleDateString()}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No detectado</p>
                                )}
                            </div>
                            
                            {doc.issuer && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Emisor / Entidad</label>
                                    <p className="text-sm font-medium text-slate-700">{doc.issuer}</p>
                                </div>
                            )}

                            {doc.policyNumber && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nro Póliza</label>
                                    <p className="text-sm font-mono text-slate-700 select-all bg-white border px-2 py-1 rounded">{doc.policyNumber}</p>
                                </div>
                            )}
                            
                            {doc.type === 'INSURANCE' && (
                                <div>
                                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Año Modelo (Póliza)</label>
                                     <p className="text-sm font-medium text-slate-700">{doc.year || 'No detectado'}</p>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-slate-400 text-center pt-4">
                            Subido el: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100">
                         <label className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition shadow-lg">
                            <Upload size={18}/>
                            Subir Más Páginas
                            <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && onAddImage(e.target.files)} />
                         </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const INITIAL_FORM: Vehicle = {
    plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'Pickup',
    ownership: OwnershipType.OWNED,
    status: VehicleStatus.ACTIVE,
    currentKm: 0,
    serviceIntervalKm: 10000,
    nextServiceKm: 10000,
    images: { others: [] },
    documents: [],
    history: []
};

export const VehicleForm = () => {
    const { plate } = useParams();
    const navigate = useNavigate();
    const { vehicles, addVehicle, updateVehicle, isDataLoading } = useApp();
    
    const isEdit = !!plate;
    const [formData, setFormData] = useState<Vehicle>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    
    const [cedulaFront, setCedulaFront] = useState<string | null>(null);
    const [cedulaRear, setCedulaRear] = useState<string | null>(null);
    const [newDocType, setNewDocType] = useState<string>('INSURANCE');
    const [customDocName, setCustomDocName] = useState('');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [simplePreviewImage, setSimplePreviewImage] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<VehicleDocument | null>(null);

    // Estados para limpiar memoria
    const [temporaryImages, setTemporaryImages] = useState<string[]>([]);

    useEffect(() => {
        if (isDataLoading) return;
        if (isEdit && plate) {
            const found = vehicles.find(v => v.plate === plate);
            if (found) {
                const safeImages = { 
                    ...found.images,
                    others: found.images.others || [] 
                };
                const safeDocs = (found.documents || []).map(d => ({
                    ...d,
                    images: d.images || []
                }));
                const safeHistory = (found.history || []).map(h => ({
                    ...h,
                    attachments: h.attachments || []
                }));
                setFormData({ ...found, images: safeImages, documents: safeDocs, history: safeHistory });
            } else {
                navigate('/vehicles');
            }
        }
    }, [isEdit, plate, vehicles, navigate, isDataLoading]);

    // Limpiar imágenes temporales para liberar memoria
    useEffect(() => {
        return () => {
            setTemporaryImages([]);
            console.log('🧹 Memoria de imágenes temporales liberada');
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'year' || name === 'currentKm' || name === 'serviceIntervalKm' || name === 'nextServiceKm' || name === 'monthlyRentalCost' || name === 'lastServiceKm'
                ? Number(value) 
                : value
        }));
    };

    const handleCedulaUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'rear') => {
        const file = e.target.files && e.target.files[0]; 
        if (!file) return;

        console.log(`📤 Subiendo cédula (${side}): ${file.name}, tamaño: ${(file.size / 1024).toFixed(2)} KB`);

        try {
            // Comprimir la imagen antes de convertir a base64
            const compressedBase64 = await compressImage(file, 800, 0.6);
            const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
            
            if (side === 'front') {
                setCedulaFront(base64Url);
            } else {
                setCedulaRear(base64Url);
            }

            // Guardar en imágenes temporales para limpiar después
            setTemporaryImages(prev => [...prev, base64Url]);

            const currentFront = side === 'front' ? base64Url : cedulaFront;
            const currentRear = side === 'rear' ? base64Url : cedulaRear;

            // Si ya tenemos ambas imágenes, analizar
            if (currentFront && currentRear) {
                await analyzeCedulaImages(currentFront, currentRear);
            }
        } catch (error) {
            console.error(`❌ Error al procesar la imagen (${side}):`, error);
            alert(`Error al procesar la imagen ${side}. Intenta con una imagen más pequeña.`);
        }
    };

    const analyzeCedulaImages = async (frontUrl: string, rearUrl: string) => {
        setAnalyzing(true);
        console.log('🚀 Iniciando análisis de cédula...');
        
        try {
            // Extraer solo la parte base64 (sin el prefijo data:image/jpeg;base64,)
            const frontBase64 = frontUrl.split(',')[1];
            const rearBase64 = rearUrl.split(',')[1];
            
            console.log('📏 Tamaño de imágenes a analizar:');
            console.log(`  - Frontal: ${(frontBase64.length * 0.75 / 1024).toFixed(2)} KB`);
            console.log(`  - Trasera: ${(rearBase64.length * 0.75 / 1024).toFixed(2)} KB`);
            
            const analysis = await analyzeVehicleImage([frontBase64, rearBase64]);
            console.log('🔍 Resultado del análisis:', analysis);
            
            if (analysis && (analysis.plate || analysis.make || analysis.model)) {
                setFormData(prev => ({
                    ...prev,
                    plate: analysis.plate || prev.plate,
                    make: analysis.make || prev.make,
                    model: analysis.model || prev.model,
                    year: analysis.year || prev.year,
                    vin: analysis.vin || prev.vin,
                    motorNum: analysis.motorNum || prev.motorNum,
                    type: analysis.type || prev.type
                }));
                
                console.log('✅ Datos extraídos correctamente de la cédula');
            } else {
                console.warn('⚠️ No se pudieron extraer datos de la cédula');
                alert('No se pudieron extraer datos automáticamente de la cédula. Por favor, complete los campos manualmente.');
            }
            
            // Actualizar o agregar documento de cédula
            setFormData(prev => {
                const existingIndex = prev.documents.findIndex(d => d.type === 'TITLE' && d.name.includes('Cédula Identificación'));
                const cedulaDoc: VehicleDocument = {
                    id: existingIndex >= 0 ? prev.documents[existingIndex].id : Date.now().toString() + Math.random().toString(36).substr(2, 5), 
                    type: 'TITLE', 
                    name: 'Cédula Identificación (Auto-generado)',
                    images: [frontUrl, rearUrl],
                    uploadedAt: new Date().toISOString(), 
                    expirationDate: '', 
                    issuer: 'Registro Automotor',
                    isValid: true
                };
                let newDocs = [...prev.documents];
                if (existingIndex >= 0) newDocs[existingIndex] = cedulaDoc;
                else newDocs.push(cedulaDoc);
                return { ...prev, documents: newDocs };
            });
            
        } catch (error) {
            console.error('❌ Error en el análisis de la cédula:', error);
            alert('Error al analizar la cédula. Verifique la consola para más detalles.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRetryAnalysis = async () => {
        if (!cedulaFront || !cedulaRear) return;
        await analyzeCedulaImages(cedulaFront, cedulaRear);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files && e.target.files[0]; 
        if (!file) return;
        
        console.log(`📤 Subiendo imagen para ${field}: ${file.name}`);
        
        try {
            const compressedBase64 = await compressImage(file, 800, 0.7);
            const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
            
            setFormData(prev => ({
                ...prev,
                images: { ...prev.images, [field]: base64Url }
            }));
            
            // Limpiar después de 10 segundos
            setTimeout(() => {
                setTemporaryImages(prev => prev.filter(img => img !== base64Url));
            }, 10000);
            
        } catch (error) {
            console.error(`❌ Error al procesar imagen (${field}):`, error);
            alert('Error al procesar la imagen. Intenta con una imagen más pequeña.');
        }
    };

    const handleOtherImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; 
        if (!files || files.length === 0) return;
        
        console.log(`📤 Subiendo ${files.length} imágenes adicionales`);
        
        const newImages: string[] = [];
        const promises = Array.from(files).map(async (file: File) => {
            try {
                const compressedBase64 = await compressImage(file, 600, 0.6);
                const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
                newImages.push(base64Url);
                
                // Limpiar después de 10 segundos
                setTimeout(() => {
                    setTemporaryImages(prev => prev.filter(img => img !== base64Url));
                }, 10000);
            } catch (error) {
                console.error(`❌ Error al procesar imagen ${file.name}:`, error);
            }
        });
        
        await Promise.all(promises);
        
        setFormData(prev => ({ 
            ...prev, 
            images: { 
                ...prev.images, 
                others: [...(prev.images.others || []), ...newImages] 
            } 
        }));
        
        e.target.value = '';
    };

    const removeOtherImage = (index: number) => {
        setFormData(prev => ({ 
            ...prev, 
            images: { 
                ...prev.images, 
                others: (prev.images.others || []).filter((_, i) => i !== index) 
            } 
        }));
    };

    const handleHistoryAttachment = async (e: React.ChangeEvent<HTMLInputElement>, historyId: string) => {
        const file = e.target.files && e.target.files[0]; 
        if (!file) return;
        
        try {
            const compressedBase64 = await compressImage(file, 800, 0.7);
            const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
            
            setFormData(prev => ({
                ...prev,
                history: prev.history.map(h => {
                    if (h.id === historyId) {
                        const attachments = h.attachments || [];
                        return { ...h, attachments: [...attachments, base64Url] };
                    }
                    return h;
                })
            }));
            
            // Limpiar después de 10 segundos
            setTimeout(() => {
                setTemporaryImages(prev => prev.filter(img => img !== base64Url));
            }, 10000);
            
        } catch (error) {
            console.error('❌ Error al procesar adjunto:', error);
            alert('Error al procesar la imagen adjunta.');
        }
        
        e.target.value = '';
    };

    const removeHistoryAttachment = (historyId: string, attachmentIndex: number) => {
        if (!confirm("¿Eliminar este adjunto?")) return;
        setFormData(prev => ({
            ...prev,
            history: prev.history.map(h => {
                if (h.id === historyId) {
                    const attachments = h.attachments || [];
                    return { ...h, attachments: attachments.filter((_, i) => i !== attachmentIndex) };
                }
                return h;
            })
        }));
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; 
        if (!files || files.length === 0) return;
        
        let finalName = '';
        let finalType = newDocType;
        
        if (newDocType === '__CUSTOM__') {
            if (!customDocName.trim()) {
                alert("Por favor ingrese el nombre del documento.");
                e.target.value = '';
                return;
            }
            finalName = customDocName.trim();
            finalType = 'OTHER';
        } else {
            const TYPE_NAMES: Record<string, string> = {
                'INSURANCE': 'Seguro',
                'VTV_RTO': 'VTV / RTO',
                'TITLE': 'Cédula / Título',
                'IDENTIFICATION': 'Identificación'
            };
            finalName = TYPE_NAMES[newDocType] || 'Documento';
        }
        
        const duplicate = formData.documents.find(d => d.type === finalType && d.name.toLowerCase().trim() === finalName.toLowerCase().trim());
        if (duplicate) { 
            alert(`Ya existe un documento "${finalName}".`); 
            e.target.value = ''; 
            return; 
        }
        
        setIsUploadingDoc(true);
        const newImages: string[] = [];
        
        console.log(`📤 Subiendo documento: ${finalName}, ${files.length} archivos`);
        
        // Procesar y comprimir imágenes
        const promises = Array.from(files).map(async (file: File) => {
            try {
                if (file.type === 'application/pdf') {
                    // Para PDFs, leer directamente sin comprimir
                    const reader = new FileReader();
                    return new Promise<string>((resolve) => {
                        reader.onloadend = () => { 
                            if(reader.result) {
                                newImages.push(reader.result as string); 
                            }
                            resolve(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                    });
                } else {
                    // Comprimir imágenes
                    const compressedBase64 = await compressImage(file, 800, 0.6);
                    const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
                    newImages.push(base64Url);
                    return base64Url;
                }
            } catch (error) {
                console.error(`❌ Error al procesar archivo ${file.name}:`, error);
                return '';
            }
        });
        
        await Promise.all(promises);
        
        // Análisis con Gemini
        let analysis: any = {};
        if (newImages.length > 0 && !newImages[0].startsWith('data:application/pdf')) {
            console.log('🔍 Analizando documento con Gemini...');
            try {
                // Pasar solo la primera imagen para análisis
                analysis = await analyzeDocumentImage(newImages[0].split(',')[1], finalType, files[0].type);
                console.log('✅ Análisis completado:', analysis);
            } catch (error) {
                console.error('❌ Error en análisis de documento:', error);
            }
        }
        
        // Manejar conflicto de año para seguros
        if (finalType === 'INSURANCE' && analysis && analysis.year) {
            const currentYear = formData.year;
            const insuranceYear = analysis.year;
            if (currentYear && insuranceYear !== currentYear) {
                const shouldReplace = window.confirm(
                    `⚠️ CONFLICTO DE AÑO DETECTADO\n\n` +
                    `El año actual del vehículo es: ${currentYear}\n` +
                    `El documento de Seguro indica año: ${insuranceYear}\n\n` +
                    `¿Desea actualizar el año del vehículo al indicado en el Seguro (${insuranceYear})?`
                );
                if (shouldReplace) setFormData(prev => ({ ...prev, year: insuranceYear }));
            } else if (!currentYear) {
                 setFormData(prev => ({ ...prev, year: insuranceYear }));
            }
        }

        const newDoc: VehicleDocument = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
            type: finalType as any, 
            name: finalName, 
            images: newImages, 
            uploadedAt: new Date().toISOString(),
            expirationDate: analysis && analysis.expirationDate, 
            issuer: analysis && analysis.issuer, 
            policyNumber: analysis && analysis.policyNumber, 
            clientNumber: analysis && analysis.clientNumber,
            year: analysis && analysis.year
        };
        
        setFormData(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
        setCustomDocName(''); 
        setIsUploadingDoc(false); 
        e.target.value = '';
    };

    const handleDeleteDoc = (docId: string) => {
        if(window.confirm("¿Está seguro que desea eliminar este documento definitivamente?")) {
            setFormData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== docId) }));
        }
    };

    const handleUpdateDocDate = (docId: string, newDate: string) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.map(d => 
                d.id === docId ? { ...d, expirationDate: newDate } : d
            )
        }));
    };

    const handleAddImageToDoc = async (files: FileList) => {
        if (!selectedDoc) return;
        const newImages: string[] = [];
        
        const promises = Array.from(files).map(async (file: File) => {
            try {
                if (file.type === 'application/pdf') {
                    const reader = new FileReader();
                    return new Promise<string>((resolve) => {
                        reader.onloadend = () => { 
                            if(reader.result) {
                                newImages.push(reader.result as string); 
                            }
                            resolve(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                    });
                } else {
                    const compressedBase64 = await compressImage(file, 800, 0.6);
                    const base64Url = `data:image/jpeg;base64,${compressedBase64}`;
                    newImages.push(base64Url);
                    return base64Url;
                }
            } catch (error) {
                console.error(`❌ Error al procesar archivo ${file.name}:`, error);
                return '';
            }
        });
        
        await Promise.all(promises);

        const updatedDoc = {
            ...selectedDoc,
            images: [...(selectedDoc.images || []), ...newImages]
        };
        setSelectedDoc(updatedDoc);
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === updatedDoc.id ? updatedDoc : d)
        }));
    };

    const handleDeleteImageFromDoc = (imgIndex: number) => {
        if (!selectedDoc) return;
        if (!window.confirm("¿Eliminar esta imagen del documento?")) return;
        
        const updatedImages = (selectedDoc.images || []).filter((_, i) => i !== imgIndex);
        const updatedDoc = { ...selectedDoc, images: updatedImages };
        
        setSelectedDoc(updatedDoc);
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === updatedDoc.id ? updatedDoc : d)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.plate || !formData.make || !formData.model) {
            alert("Complete los campos obligatorios (Patente, Marca, Modelo)");
            return;
        }
        setLoading(true);
        if (isEdit) {
            updateVehicle(formData);
        } else {
            if (vehicles.some(v => v.plate === formData.plate)) {
                alert("La patente ya existe.");
                setLoading(false);
                return;
            }
            addVehicle(formData);
        }
        setTimeout(() => {
            navigate('/vehicles');
        }, 500);
    };

    const STANDARD_OWNERSHIPS = [OwnershipType.OWNED, OwnershipType.RENTED, OwnershipType.LEASING];
    const isCustomOwnership = !STANDARD_OWNERSHIPS.includes(formData.ownership as OwnershipType) && formData.ownership !== '';
    const selectValue = isCustomOwnership ? '__OTHER__' : formData.ownership;

    const renderPhotoInput = (label: string, position: 'front' | 'rear' | 'left' | 'right') => {
        const imageSrc = formData.images && formData.images[position];
        if (imageSrc) {
            return (
                <div className="aspect-square relative group bg-slate-100 rounded-lg border border-slate-300 overflow-hidden cursor-pointer" onClick={() => setSimplePreviewImage(imageSrc)}>
                    <img src={imageSrc} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1 backdrop-blur-sm">{label}</div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, images: {...prev.images, [position]: ''}})); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"><X size={14}/></button>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><ZoomIn className="text-white drop-shadow-md" size={32}/></div>
                </div>
            );
        }
        return (
            <div className="aspect-square bg-white border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 transition-colors relative hover:bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-center leading-tight">{label}</span>
                <div className="flex gap-2">
                    <div className="relative group cursor-pointer">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"><Image size={16}/></div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, position)} title="Galería"/>
                    </div>
                    <div className="relative group cursor-pointer">
                        <div className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"><Camera size={16}/></div>
                        <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, position)} title="Cámara"/>
                    </div>
                </div>
            </div>
        );
    };

    if (isDataLoading && !formData.plate && isEdit) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
                <span className="ml-2 font-bold text-slate-600">Cargando unidad...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {simplePreviewImage && <SimpleImageViewer url={simplePreviewImage} onClose={() => setSimplePreviewImage(null)} />}
            {selectedDoc && (
                <DocumentDetailModal 
                    doc={selectedDoc} 
                    onClose={() => setSelectedDoc(null)} 
                    onAddImage={handleAddImageToDoc}
                    onDeleteImage={handleDeleteImageFromDoc}
                />
            )}
            
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/vehicles')} className="p-2 bg-white rounded-full shadow hover:bg-slate-100">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">{isEdit ? `Editar Unidad: ${formData.plate}` : 'Nueva Unidad'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <ScanLine className="text-blue-600"/> Carga Automática (Cédula)
                        </h2>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${cedulaFront ? 'bg-green-50 border-green-300' : 'bg-white border-blue-200'}`}>
                                 <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-center gap-2">
                                     {cedulaFront && <Check size={14} className="text-green-600"/>} Cara Frontal
                                 </p>
                                 {cedulaFront ? (
                                    <div className="relative">
                                        <img src={cedulaFront} className="h-24 w-auto mx-auto object-contain rounded mb-2 border cursor-pointer" onClick={() => setSimplePreviewImage(cedulaFront)}/>
                                        <button type="button" onClick={() => setCedulaFront(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                    </div>
                                 ) : 
                                     <div className="flex justify-center gap-2">
                                         <div className="relative"><button type="button" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center gap-1 text-xs font-bold"><Image size={14}/> Galería</button><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCedulaUpload(e, 'front')} /></div>
                                         <div className="relative"><button type="button" className="bg-slate-700 hover:bg-slate-800 text-white p-2 rounded flex items-center gap-1 text-xs font-bold"><Camera size={14}/> Cámara</button><input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCedulaUpload(e, 'front')} /></div>
                                     </div>
                                 }
                             </div>
                             <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${cedulaRear ? 'bg-green-50 border-green-300' : 'bg-white border-blue-200'}`}>
                                 <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-center gap-2">
                                     {cedulaRear && <Check size={14} className="text-green-600"/>} Cara Trasera
                                 </p>
                                 {cedulaRear ? (
                                    <div className="relative">
                                        <img src={cedulaRear} className="h-24 w-auto mx-auto object-contain rounded mb-2 border cursor-pointer" onClick={() => setSimplePreviewImage(cedulaRear)}/>
                                        <button type="button" onClick={() => setCedulaRear(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                                    </div>
                                 ) : 
                                     <div className="flex justify-center gap-2">
                                         <div className="relative"><button type="button" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center gap-1 text-xs font-bold"><Image size={14}/> Galería</button><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCedulaUpload(e, 'rear')} /></div>
                                         <div className="relative"><button type="button" className="bg-slate-700 hover:bg-slate-800 text-white p-2 rounded flex items-center gap-1 text-xs font-bold"><Camera size={14}/> Cámara</button><input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCedulaUpload(e, 'rear')} /></div>
                                     </div>
                                 }
                             </div>
                         </div>
                         {analyzing && <div className="mt-4 text-center text-blue-600 text-sm font-bold flex items-center justify-center gap-2 bg-white/50 p-2 rounded"><Loader className="animate-spin" size={16}/> Analizando Cédula y Extrayendo datos...</div>}
                         {cedulaFront && cedulaRear && !analyzing && (
                             <div className="mt-3 text-center">
                                 <button type="button" onClick={handleRetryAnalysis} className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center justify-center gap-1 mx-auto">
                                     <RefreshCw size={12}/> Re-analizar imágenes
                                 </button>
                             </div>
                         )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patente *</label>
                            <input type="text" name="plate" required className="w-full p-2 border rounded bg-slate-50 font-mono font-bold uppercase" value={formData.plate} onChange={handleChange} disabled={isEdit} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca *</label>
                            <input type="text" name="make" required className="w-full p-2 border rounded" value={formData.make} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo *</label>
                            <input type="text" name="model" required className="w-full p-2 border rounded" value={formData.model} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label>
                            <input type="number" name="year" className="w-full p-2 border rounded" value={formData.year} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select name="type" className="w-full p-2 border rounded" value={formData.type} onChange={handleChange}>
                                <option value="Sedan">Sedan</option>
                                <option value="Pickup">Pickup</option>
                                <option value="SUV">SUV</option>
                                <option value="Van">Van</option>
                                <option value="Truck">Camión</option>
                                <option value="Other">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VIN / Chasis</label>
                            <input type="text" name="vin" className="w-full p-2 border rounded font-mono text-xs" value={formData.vin || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nro Motor</label>
                            <input type="text" name="motorNum" className="w-full p-2 border rounded font-mono text-xs" value={formData.motorNum || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Camera /> Estado Visual del Vehículo</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {renderPhotoInput('Frente', 'front')}
                        {renderPhotoInput('Trasera', 'rear')}
                        {renderPhotoInput('Lat. Izq', 'left')}
                        {renderPhotoInput('Lat. Der', 'right')}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase flex items-center gap-2"><Plus size={16}/> Otras Fotos (Detalles, Interior, etc)</h4>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            <div className="aspect-square bg-white border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors p-2">
                                <span className="text-[10px] text-blue-600 font-bold text-center leading-tight mb-2">Agregar<br/>Fotos</span>
                                <div className="flex gap-2">
                                    <div className="relative group cursor-pointer" title="Galería">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors border border-blue-200">
                                            <Image size={18}/>
                                        </div>
                                        <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleOtherImageUpload}/>
                                    </div>
                                    <div className="relative group cursor-pointer" title="Cámara">
                                        <div className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"><Camera size={18}/></div>
                                        <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleOtherImageUpload}/>
                                    </div>
                                </div>
                            </div>
                            {formData.images && formData.images.others && formData.images.others.map((img, idx) => (
                                <div key={idx} className="aspect-square relative group cursor-pointer" onClick={() => setSimplePreviewImage(img)}>
                                    <img src={img} className="w-full h-full object-cover rounded-lg border border-slate-300" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeOtherImage(idx); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Building2 size={20}/> Estado y Propiedad
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Operativo</label>
                            <select name="status" className="w-full p-2 border rounded font-bold bg-slate-50" value={formData.status} onChange={handleChange}>
                                <option value={VehicleStatus.ACTIVE}>Activo</option>
                                <option value={VehicleStatus.MAINTENANCE}>En Taller</option>
                                <option value={VehicleStatus.INACTIVE}>Inactivo</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Propiedad</label>
                            <select name="ownership" className="w-full p-2 border rounded bg-slate-50" value={selectValue} onChange={(e) => { const val = e.target.value; if (val === '__OTHER__') { setFormData(prev => ({ ...prev, ownership: '' })); } else { setFormData(prev => ({ ...prev, ownership: val })); } }}>
                                <option value={OwnershipType.OWNED}>Propio</option>
                                <option value={OwnershipType.RENTED}>Alquilado</option>
                                <option value={OwnershipType.LEASING}>Leasing</option>
                                <option value="__OTHER__">Otro (Especificar)</option>
                            </select>
                            {(isCustomOwnership || formData.ownership === '') && (
                                <input type="text" placeholder="Especifique propiedad" className="w-full mt-2 p-2 border border-blue-300 rounded bg-blue-50 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.ownership} onChange={(e) => setFormData(prev => ({ ...prev, ownership: e.target.value }))} />
                            )}
                        </div>
                    </div>
                    {formData.ownership === OwnershipType.RENTED && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proveedor Alquiler</label><input type="text" name="rentalProvider" className="w-full p-2 border rounded bg-white" value={formData.rentalProvider || ''} onChange={handleChange} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Mensual ($)</label><input type="number" name="monthlyRentalCost" className="w-full p-2 border rounded bg-white" value={formData.monthlyRentalCost || ''} onChange={handleChange} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inicio Contrato</label><input type="date" name="rentalStartDate" className="w-full p-2 border rounded bg-white" value={formData.rentalStartDate || ''} onChange={handleChange} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fin Contrato / Devolución</label><input type="date" name="rentalEndDate" className="w-full p-2 border rounded bg-white" value={formData.rentalEndDate || ''} onChange={handleChange} /></div>
                            </div>
                        </div>
                    )}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Centro de Costo</label><input type="text" name="costCenter" className="w-full p-2 border rounded" value={formData.costCenter || ''} onChange={handleChange} placeholder="Ej: Proyecto Andes" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provincia / Ubicación</label><input type="text" name="province" className="w-full p-2 border rounded" value={formData.province || ''} onChange={handleChange} /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario Asignado</label><input type="text" name="assignedUser" className="w-full p-2 border rounded" value={formData.assignedUser || ''} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText /> Documentación Digital</h2>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Documento</label>
                                <select className="w-full p-2 border rounded" value={newDocType} onChange={(e) => setNewDocType(e.target.value)}>
                                    <option value="INSURANCE">Seguro</option>
                                    <option value="VTV_RTO">VTV / RTO</option>
                                    <option value="TITLE">Cédula / Título</option>
                                    <option value="IDENTIFICATION">Identificación</option>
                                    <option value="__CUSTOM__">Otro (Especificar)</option>
                                </select>
                            </div>
                            {newDocType === '__CUSTOM__' && (
                                <div className="flex-1 w-full animate-fadeIn">
                                    <label className="block text-xs font-bold text-slate-400 uppercase block mb-1">Nombre del Documento</label>
                                    <input type="text" className="w-full p-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Permiso de Circulación" value={customDocName} onChange={(e) => setCustomDocName(e.target.value)} autoFocus />
                                </div>
                            )}
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                {/* Camera Button */}
                                <label className={`flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-slate-800 transition ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Camera size={18}/>
                                    <span className="hidden md:inline">Cámara</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleDocUpload} disabled={isUploadingDoc}/>
                                </label>

                                {/* File/PDF Upload Button */}
                                <label className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-blue-700 transition ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {isUploadingDoc ? <Loader className="animate-spin" size={18}/> : <Upload size={18}/>}
                                    <span>{isUploadingDoc ? 'Analizando...' : 'Subir PDF/Foto'}</span>
                                    <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleDocUpload} disabled={isUploadingDoc}/>
                                </label>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2"><span className="font-bold">Nota:</span> La IA analizará la primera página de imágenes o PDFs para detectar fechas.</p>
                    </div>

                    <div className="space-y-3">
                        {formData.documents.map((doc) => (
                            <div 
                                key={doc.id} 
                                className="relative bg-white border rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <div 
                                    className="flex justify-between items-center p-3 cursor-pointer"
                                    onClick={() => setSelectedDoc(doc)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                                            {doc.images && doc.images.length > 0 && doc.images[0].startsWith('data:application/pdf') ? (
                                                <div className="w-full h-full flex items-center justify-center text-red-500"><FileText size={20}/></div>
                                            ) : doc.images && doc.images.length > 0 ? (
                                                <img src={doc.images[0]} className="w-full h-full object-cover" alt="thumbnail"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Image size={20}/></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{doc.name}</p>
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1 items-center">
                                                <span className="bg-slate-100 px-1.5 rounded">{doc.type === 'TITLE' ? 'Cédula' : doc.type === 'INSURANCE' ? 'Seguro' : doc.type === 'VTV_RTO' ? 'VTV/RTO' : doc.type === 'IDENTIFICATION' ? 'Identificación' : doc.type === 'OTHER' ? doc.name : doc.type}</span>
                                                <label className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded cursor-pointer hover:border-blue-300 transition-colors relative z-10" onClick={e => e.stopPropagation()}>
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Vence:</span>
                                                    <input type="date" className={`bg-transparent border-none p-0 text-xs font-bold focus:ring-0 cursor-pointer ${doc.expirationDate && new Date(doc.expirationDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`} value={doc.expirationDate || ''} onChange={(e) => handleUpdateDocDate(doc.id, e.target.value)} />
                                                </label>
                                                {doc.images && doc.images.length > 1 && (<span className="text-blue-500 font-bold">• {doc.images.length} Páginas</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-24"></div>
                                </div>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                                     <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedDoc(doc); }} 
                                        className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded border border-transparent hover:border-blue-100 transition-all flex items-center gap-1"
                                    >
                                        <Eye size={14}/> Ver
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            handleDeleteDoc(doc.id); 
                                        }} 
                                        className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors" 
                                        title="Eliminar Documento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {formData.documents.length === 0 && <p className="text-center text-slate-400 text-sm py-4 italic">No hay documentos cargados.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><History /> Historial de Eventos y Mantenimiento</h2>
                    <div className="space-y-4">
                         {formData.history && formData.history.length > 0 ? (
                            formData.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
                                <div key={item.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 hover:bg-white hover:border-blue-100 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div><p className="font-bold text-slate-800">{new Date(item.date).toLocaleDateString()}</p><p className="text-xs text-slate-500 font-bold uppercase">{item.type === 'SERVICE' ? 'Mantenimiento' : item.type === 'REPAIR' ? 'Reparación' : item.type}</p></div>
                                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm">${item.cost.toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{item.description}</p>
                                    <div className="border-t border-slate-200 pt-2 mt-2">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {item.attachments && item.attachments.map((att, idx) => {
                                                const isPdf = att.startsWith('data:application/pdf');
                                                return (
                                                    <div key={idx} className="relative group">
                                                        {isPdf ? (
                                                             <div onClick={() => setSimplePreviewImage(att)} className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-red-100"><FileText size={16}/><span className="text-[8px] font-bold">PDF</span></div>
                                                        ) : (
                                                            <div onClick={() => setSimplePreviewImage(att)} className="w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer hover:opacity-80"><img src={att} className="w-full h-full object-cover" /></div>
                                                        )}
                                                        <button type="button" onClick={() => removeHistoryAttachment(item.id, idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                                                    </div>
                                                );
                                            })}
                                            <label className="w-12 h-12 flex flex-col items-center justify-center bg-white border border-dashed border-blue-300 rounded text-blue-500 cursor-pointer hover:bg-blue-50 transition-colors" title="Adjuntar Factura/Foto"><Paperclip size={16}/><span className="text-[8px] font-bold mt-0.5">Adjuntar</span><input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleHistoryAttachment(e, item.id)}/></label>
                                        </div>
                                    </div>
                                </div>
                            ))
                         ) : (<p className="text-slate-400 italic text-center py-4">No hay eventos registrados en el historial.</p>)}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/vehicles')} className="px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-8 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{loading ? <Loader className="animate-spin" /> : <Save />} Guardar Unidad</button>
                </div>
            </form>
        </div>
    );
};
