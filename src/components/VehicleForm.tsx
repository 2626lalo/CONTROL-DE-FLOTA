import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Vehicle, VehicleStatus, OwnershipType, Document as VehicleDocument, ServiceHistory } from '../types';
import { analyzeVehicleImage, analyzeDocumentImage } from '../services/geminiService';
import { Save, ArrowLeft, Upload, Trash2, Loader, Camera, FileText, Image, ScanLine, AlertCircle, Check, RefreshCw, Plus, X, FileUp, Car, Eye } from 'lucide-react';

// Utility functions for image handling
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const compressImage = async (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const base64Data = compressedBase64.split(',')[1];
        
        console.log(`📊 Imagen comprimida: ${file.name}`);
        console.log(`📏 Original: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`📏 Comprimido: ${(base64Data.length * 0.75 / 1024).toFixed(2)} KB`);
        
        resolve(base64Data);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const VehicleForm: React.FC = () => {
  const { plate } = useParams<{ plate?: string }>();
  const navigate = useNavigate();
  const { vehicles, addVehicle, updateVehicle, user, isOnline, notifyError, googleAI } = useApp();
  
  const isEditing = !!plate;
  const existingVehicle = vehicles.find(v => v.plate === plate);
  
  const [loading, setLoading] = useState(false);
  const [processingFrontImage, setProcessingFrontImage] = useState(false);
  const [processingBackImage, setProcessingBackImage] = useState(false);
  const [processingDocument, setProcessingDocument] = useState<string | null>(null);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{file: File, type: string}[]>([]);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const documentCameraInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    motorNumber: '',
    type: 'Other',
    status: VehicleStatus.ACTIVE,
    ownershipType: OwnershipType.COMPANY,
    color: '',
    fuelType: 'Gasolina',
    transmission: 'Manual',
    seats: 5,
    currentMileage: 0,
    lastServiceMileage: 0,
    serviceInterval: 5000,
    insurance: {
      provider: '',
      policyNumber: '',
      expiration: '',
      coverage: ''
    },
    documents: [],
    serviceHistory: [],
    notes: '',
    assignedTo: '',
    location: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'SYNCED'
  });

  // Load existing vehicle data if editing
  useEffect(() => {
    if (isEditing && existingVehicle) {
      setFormData(existingVehicle);
      console.log('📋 Cargando vehículo existente:', existingVehicle);
    }
  }, [isEditing, existingVehicle]);

  // Verificar si Gemini AI está disponible
  useEffect(() => {
    console.log('🔍 Estado de Gemini AI:', {
      isOnline,
      googleAI: googleAI ? 'Disponible' : 'No disponible',
      apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY ? 'Configurada' : 'No configurada'
    });
  }, [isOnline, googleAI]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('insurance.')) {
      const insuranceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        insurance: {
          ...prev.insurance!,
          [insuranceField]: value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: name.includes('Mileage') || name.includes('seats') || name.includes('year') || name.includes('serviceInterval') 
          ? (value === '' ? '' : Number(value)) 
          : value 
      }));
    }
  };

  const handleFrontImageUpload = async (file: File) => {
    if (!file) return;
    
    setProcessingFrontImage(true);
    try {
      console.log('🖼️ Procesando imagen frontal del vehículo...');
      console.log('📁 Archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
      
      setFrontImage(file);
      
      // Verificar si el archivo es una imagen válida
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida');
      }
      
      let compressedBase64: string;
      try {
        compressedBase64 = await compressImage(file, 800, 0.7);
        console.log('✅ Imagen comprimida correctamente');
      } catch (compressError) {
        console.warn('⚠️ Error en compresión, usando imagen original:', compressError);
        compressedBase64 = await fileToBase64(file);
      }
      
      console.log('📸 Enviando imagen frontal a Gemini...');
      
      // Verificar si Gemini AI está disponible
      if (!googleAI) {
        console.warn('⚠️ Gemini AI no está disponible. Modo offline.');
        notifyError('Gemini AI no está disponible. Ingresa los datos manualmente.');
        return;
      }
      
      // Call Gemini API with single image
      const result = await analyzeVehicleImage([compressedBase64]);
      console.log('🔍 Respuesta de Gemini para imagen frontal:', result);
      
      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        plate: result.plate || prev.plate,
        make: result.make || prev.make,
        model: result.model || prev.model,
        year: result.year || prev.year,
        color: result.color || prev.color,
        type: result.type || prev.type,
        vin: result.vin || prev.vin,
        motorNumber: result.motorNum || prev.motorNumber
      }));
      
      console.log('✅ Datos extraídos de imagen frontal:', {
        placa: result.plate,
        marca: result.make,
        modelo: result.model,
        año: result.year,
        color: result.color,
        tipo: result.type
      });
      
      if (!result.plate && !result.make && !result.model) {
        console.warn('⚠️ Gemini no pudo extraer datos significativos de las imágenes');
        notifyError('No se pudieron extraer datos de la imagen. Por favor, ingresa los datos manualmente.');
      } else {
        // Mostrar notificación de éxito
        const successMessage = `Datos extraídos: ${result.plate || 'Placa no detectada'}, ${result.make || ''} ${result.model || ''}`;
        notifyError(successMessage.replace('Error: ', ''));
      }
      
    } catch (error) {
      console.error('❌ Error procesando imagen frontal:', error);
      notifyError(`Error al procesar la imagen frontal: ${error.message || 'Error desconocido'}. Por favor, ingresa los datos manualmente.`);
    } finally {
      setProcessingFrontImage(false);
    }
  };

  const handleBackImageUpload = async (file: File) => {
    if (!file) return;
    
    setProcessingBackImage(true);
    try {
      console.log('🖼️ Procesando imagen posterior de la cédula...');
      console.log('📁 Archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
      
      setBackImage(file);
      
      // Verificar si el archivo es una imagen válida
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida');
      }
      
      let compressedBase64: string;
      try {
        compressedBase64 = await compressImage(file, 800, 0.7);
        console.log('✅ Imagen comprimida correctamente');
      } catch (compressError) {
        console.warn('⚠️ Error en compresión, usando imagen original:', compressError);
        compressedBase64 = await fileToBase64(file);
      }
      
      console.log('📸 Enviando imagen posterior a Gemini...');
      
      // Verificar si Gemini AI está disponible
      if (!googleAI) {
        console.warn('⚠️ Gemini AI no está disponible. Modo offline.');
        notifyError('Gemini AI no está disponible. Ingresa los datos manualmente.');
        return;
      }
      
      // Call Gemini API with single image for cédula
      const result = await analyzeDocumentImage(compressedBase64, 'Cédula', 'image/jpeg');
      console.log('🔍 Respuesta de Gemini para cédula posterior:', result);
      
      // Update form with extracted data from cédula
      const updates: Partial<Vehicle> = {};
      
      if (result.plate) updates.plate = result.plate;
      if (result.vin) updates.vin = result.vin;
      if (result.motorNum) updates.motorNumber = result.motorNum;
      if (result.year) updates.year = result.year;
      if (result.make) updates.make = result.make;
      if (result.model) updates.model = result.model;
      if (result.color) updates.color = result.color;
      if (result.type) updates.type = result.type;
      
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
      
      console.log('✅ Datos extraídos de cédula posterior:', {
        placa: result.plate,
        vin: result.vin,
        numeroMotor: result.motorNum,
        año: result.year,
        marca: result.make,
        modelo: result.model
      });
      
      if (!result.plate && !result.vin && !result.motorNum) {
        console.warn('⚠️ Gemini no pudo extraer datos de la cédula');
        notifyError('No se pudieron extraer datos de la cédula. Por favor, ingresa los datos manualmente.');
      } else {
        // Mostrar notificación de éxito
        const extractedData = [];
        if (result.plate) extractedData.push(`Placa: ${result.plate}`);
        if (result.vin) extractedData.push(`VIN: ${result.vin}`);
        if (result.motorNum) extractedData.push(`Motor: ${result.motorNum}`);
        
        if (extractedData.length > 0) {
          notifyError(`Cédula procesada: ${extractedData.join(', ')}`.replace('Error: ', ''));
        }
      }
      
    } catch (error) {
      console.error('❌ Error procesando imagen posterior:', error);
      notifyError(`Error al procesar la cédula posterior: ${error.message || 'Error desconocido'}. Por favor, ingresa los datos manualmente.`);
    } finally {
      setProcessingBackImage(false);
    }
  };

  const handleDocumentUpload = async (file: File, docType: string = 'Insurance') => {
    setProcessingDocument(docType);
    try {
      console.log(`📄 Procesando documento: ${docType} - ${file.name}`);
      
      // Store uploaded document
      setUploadedDocuments(prev => [...prev, { file, type: docType }]);
      
      const base64Data = await fileToBase64(file);
      const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
      
      console.log(`🚀 Enviando ${docType} a Gemini...`);
      const result = await analyzeDocumentImage(base64Data, docType, mimeType);
      
      console.log('📊 Resultado del documento:', result);
      
      // Update form with extracted document data
      if (docType === 'Insurance') {
        setFormData(prev => ({
          ...prev,
          insurance: {
            ...prev.insurance!,
            provider: result.issuer || prev.insurance?.provider || '',
            policyNumber: result.policyNumber || prev.insurance?.policyNumber || '',
            expiration: result.expirationDate || prev.insurance?.expiration || ''
          },
          year: result.year || prev.year
        }));
      }
      
      // Add document to documents array
      const newDocument: VehicleDocument = {
        id: Date.now().toString(),
        type: docType,
        name: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        expirationDate: result.expirationDate || '',
        verified: result.isValid || false
      };
      
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDocument]
      }));
      
      console.log('✅ Documento procesado exitosamente');
      
    } catch (error) {
      console.error(`❌ Error procesando documento ${docType}:`, error);
      notifyError(`Error al procesar el documento ${docType}`);
    } finally {
      setProcessingDocument(null);
    }
  };

  const removeFrontImage = () => {
    setFrontImage(null);
  };

  const removeBackImage = () => {
    setBackImage(null);
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index) || []
    }));
  };

  // Funciones para activar los inputs
  const triggerFrontCamera = () => {
    frontCameraInputRef.current?.click();
  };

  const triggerFrontFileUpload = () => {
    frontFileInputRef.current?.click();
  };

  const triggerBackCamera = () => {
    backCameraInputRef.current?.click();
  };

  const triggerBackFileUpload = () => {
    backFileInputRef.current?.click();
  };

  const triggerDocumentCamera = () => {
    documentCameraInputRef.current?.click();
  };

  const triggerDocumentFileUpload = () => {
    documentFileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plate || !formData.make || !formData.model) {
      notifyError('Por favor, complete los campos obligatorios: Placa, Marca y Modelo');
      return;
    }
    
    setLoading(true);
    
    try {
      const vehicleData: Vehicle = {
        ...formData,
        id: formData.id || Date.now().toString(),
        plate: formData.plate!,
        make: formData.make!,
        model: formData.model!,
        year: formData.year!,
        vin: formData.vin!,
        motorNumber: formData.motorNumber!,
        type: formData.type!,
        status: formData.status!,
        ownershipType: formData.ownershipType!,
        color: formData.color!,
        fuelType: formData.fuelType!,
        transmission: formData.transmission!,
        seats: formData.seats!,
        currentMileage: formData.currentMileage!,
        lastServiceMileage: formData.lastServiceMileage!,
        serviceInterval: formData.serviceInterval!,
        insurance: formData.insurance!,
        documents: formData.documents || [],
        serviceHistory: formData.serviceHistory || [],
        notes: formData.notes || '',
        assignedTo: formData.assignedTo || '',
        location: formData.location || '',
        createdAt: formData.createdAt!,
        updatedAt: new Date().toISOString(),
        syncStatus: isOnline ? 'SYNCED' : 'PENDING'
      } as Vehicle;
      
      console.log('💾 Guardando vehículo:', vehicleData);
      
      if (isEditing) {
        updateVehicle(vehicleData);
        console.log('✅ Vehículo actualizado');
      } else {
        addVehicle(vehicleData);
        console.log('✅ Vehículo creado');
      }
      
      // Clear uploaded files
      setFrontImage(null);
      setBackImage(null);
      setUploadedDocuments([]);
      
      navigate('/vehicles');
      
    } catch (error) {
      console.error('❌ Error saving vehicle:', error);
      notifyError('Error al guardar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  // Función para probar manualmente el procesamiento
  const testGeminiProcessing = async () => {
    if (!frontImage && !backImage) {
      notifyError('Primero sube al menos una imagen');
      return;
    }
    
    console.log('🧪 Iniciando prueba de procesamiento Gemini...');
    
    if (frontImage) {
      console.log('🧪 Procesando imagen frontal...');
      await handleFrontImageUpload(frontImage);
    }
    
    if (backImage) {
      // Esperar un momento antes de procesar la segunda imagen
      setTimeout(async () => {
        console.log('🧪 Procesando imagen posterior...');
        await handleBackImageUpload(backImage);
      }, 1000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vehicles')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? `Editar Vehículo: ${plate}` : 'Nuevo Vehículo'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <ScanLine size={16} />
            Gemini AI {googleAI ? 'Habilitado' : 'Deshabilitado'}
          </div>
          {googleAI && (
            <button
              type="button"
              onClick={testGeminiProcessing}
              className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition"
            >
              <RefreshCw size={14} />
              Probar Procesamiento
            </button>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección de imágenes obligatorias */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Imágenes del Vehículo *</h2>
            <span className="text-xs text-red-500">(Obligatorias)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Imagen Frontal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-blue-600" />
                <label className="block text-sm font-medium text-slate-700">
                  1. Foto Frontal del Vehículo
                </label>
                {processingFrontImage && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded animate-pulse">
                    <Loader size={12} className="inline animate-spin mr-1" />
                    Procesando...
                  </span>
                )}
              </div>
              
              {frontImage ? (
                <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50/50">
                  <div className="relative">
                    <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={URL.createObjectURL(frontImage)} 
                        alt="Imagen frontal"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setShowImagePreview(URL.createObjectURL(frontImage))}
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 truncate max-w-[200px]">{frontImage.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Subida</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFrontImage}
                        className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {!processingFrontImage && (
                    <button
                      type="button"
                      onClick={() => handleFrontImageUpload(frontImage)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <RefreshCw size={16} />
                      Re-procesar con Gemini AI
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 hover:border-blue-400 transition-colors bg-blue-50/50">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      {processingFrontImage ? (
                        <Loader size={24} className="animate-spin text-blue-600" />
                      ) : (
                        <Camera size={24} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 text-center mb-4">
                      {processingFrontImage ? 'Procesando con Gemini AI...' : 'Selecciona cómo subir la imagen'}
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={triggerFrontCamera}
                        disabled={processingFrontImage}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        <Camera size={20} />
                        <span>Tomar Foto con Cámara</span>
                      </button>
                      
                      <div className="relative flex items-center justify-center">
                        <div className="flex-grow h-px bg-slate-300"></div>
                        <span className="mx-3 text-sm text-slate-500">O</span>
                        <div className="flex-grow h-px bg-slate-300"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={triggerFrontFileUpload}
                        disabled={processingFrontImage}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                      >
                        <Upload size={20} />
                        <span>Subir Archivo desde PC</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Input para tomar foto con cámara */}
                  <input
                    type="file"
                    ref={frontCameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFrontImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  
                  {/* Input para subir archivo */}
                  <input
                    type="file"
                    ref={frontFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFrontImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                Toma una foto de la parte frontal del vehículo para extraer datos automáticamente
              </p>
            </div>

            {/* Imagen Posterior (Cédula) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <label className="block text-sm font-medium text-slate-700">
                  2. Foto Posterior de la Cédula
                </label>
                {processingBackImage && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded animate-pulse">
                    <Loader size={12} className="inline animate-spin mr-1" />
                    Procesando...
                  </span>
                )}
              </div>
              
              {backImage ? (
                <div className="border-2 border-green-300 rounded-xl p-4 bg-green-50/50">
                  <div className="relative">
                    <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={URL.createObjectURL(backImage)} 
                        alt="Cédula posterior"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setShowImagePreview(URL.createObjectURL(backImage))}
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 truncate max-w-[200px]">{backImage.name}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Subida</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeBackImage}
                        className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {!processingBackImage && (
                    <button
                      type="button"
                      onClick={() => handleBackImageUpload(backImage)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <RefreshCw size={16} />
                      Re-procesar con Gemini AI
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-green-300 rounded-xl p-4 hover:border-green-400 transition-colors bg-green-50/50">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      {processingBackImage ? (
                        <Loader size={24} className="animate-spin text-green-600" />
                      ) : (
                        <FileText size={24} className="text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 text-center mb-4">
                      {processingBackImage ? 'Procesando con Gemini AI...' : 'Selecciona cómo subir la imagen'}
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={triggerBackCamera}
                        disabled={processingBackImage}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <Camera size={20} />
                        <span>Tomar Foto con Cámara</span>
                      </button>
                      
                      <div className="relative flex items-center justify-center">
                        <div className="flex-grow h-px bg-slate-300"></div>
                        <span className="mx-3 text-sm text-slate-500">O</span>
                        <div className="flex-grow h-px bg-slate-300"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={triggerBackFileUpload}
                        disabled={processingBackImage}
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                      >
                        <Upload size={20} />
                        <span>Subir Archivo desde PC</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Input para tomar foto con cámara */}
                  <input
                    type="file"
                    ref={backCameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleBackImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  
                  {/* Input para subir archivo */}
                  <input
                    type="file"
                    ref={backFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleBackImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                Toma una foto de la parte posterior de la cédula para extraer VIN y otros datos
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <ScanLine size={18} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Gemini AI en acción</p>
                <p className="text-xs text-blue-600">
                  Ambas imágenes son procesadas por Gemini AI para extraer automáticamente los datos del vehículo.
                  Los campos se llenarán automáticamente después de subir las imágenes. <strong>¡No necesitas llenar manualmente!</strong>
                </p>
                <div className="mt-2 text-xs text-blue-700">
                  <p>Estado: {googleAI ? '✅ Conectado' : '❌ No conectado'}</p>
                  <p>Conexión: {isOnline ? '✅ En línea' : '❌ Sin conexión'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resto del formulario sigue igual... */}
        {/* Sección de información básica */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Información Básica del Vehículo</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Autocompletado por IA</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Placa *
              </label>
              <input
                type="text"
                name="plate"
                value={formData.plate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                placeholder="Se autocompletará con IA"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                placeholder="Se autocompletará con IA"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                placeholder="Se autocompletará con IA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Año
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Se autocompletará con IA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Se autocompletará con IA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Vehículo
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Pickup">Pickup</option>
                <option value="Sedan">Sedán</option>
                <option value="SUV">SUV</option>
                <option value="Van">Van</option>
                <option value="Truck">Camión</option>
                <option value="Other">Otro</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !frontImage || !backImage}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo')}
          </button>
        </div>
      </form>

      {/* Modal para preview de imagen */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vista previa de imagen</h3>
              <button
                onClick={() => setShowImagePreview(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <img 
                src={showImagePreview} 
                alt="Preview" 
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleForm;
