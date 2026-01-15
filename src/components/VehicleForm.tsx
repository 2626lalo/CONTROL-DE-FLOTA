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
        
        // Calculate new dimensions while maintaining aspect ratio
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
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 JPEG with specified quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove the data URL prefix
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
  const { vehicles, addVehicle, updateVehicle, user, isOnline, notifyError } = useApp();
  
  const isEditing = !!plate;
  const existingVehicle = vehicles.find(v => v.plate === plate);
  
  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingDocument, setProcessingDocument] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<{file: File, type: string}[]>([]);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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

  const handleVehicleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setProcessingImages(true);
    try {
      console.log('🖼️ Procesando', files.length, 'imágenes del vehículo...');
      
      // Store uploaded files for preview
      const fileArray = Array.from(files);
      setUploadedImages(prev => [...prev, ...fileArray]);
      
      // Convert files to base64 (with compression for large files)
      const base64Images: string[] = [];
      for (let i = 0; i < Math.min(fileArray.length, 3); i++) { // Limit to 3 images
        const file = fileArray[i];
        const compressed = await compressImage(file, 800, 0.7);
        base64Images.push(compressed);
      }
      
      console.log(`📸 Enviando ${base64Images.length} imágenes a Gemini...`);
      
      // Call Gemini API
      const result = await analyzeVehicleImage(base64Images);
      
      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        plate: result.plate || prev.plate,
        make: result.make || prev.make,
        model: result.model || prev.model,
        year: result.year || prev.year,
        vin: result.vin || prev.vin,
        motorNumber: result.motorNum || prev.motorNumber,
        type: result.type || prev.type
      }));
      
      console.log('✅ Datos extraídos de imágenes:', result);
      
      if (!result.plate && !result.make && !result.model) {
        console.warn('⚠️ Gemini no pudo extraer datos significativos de las imágenes');
      }
      
    } catch (error) {
      console.error('❌ Error procesando imágenes:', error);
      notifyError('Error al procesar las imágenes. Por favor, ingresa los datos manualmente.');
    } finally {
      setProcessingImages(false);
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

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index) || []
    }));
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
      setUploadedImages([]);
      setUploadedDocuments([]);
      
      navigate('/vehicles');
      
    } catch (error) {
      console.error('❌ Error saving vehicle:', error);
      notifyError('Error al guardar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerDocumentInput = () => {
    documentInputRef.current?.click();
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
        
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          <ScanLine size={16} />
          Gemini AI Habilitado
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección de información básica */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Información Básica</h2>
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Sedan">Sedán</option>
                <option value="Pickup">Pickup</option>
                <option value="SUV">SUV</option>
                <option value="Van">Van</option>
                <option value="Truck">Camión</option>
                <option value="Other">Otro</option>
              </select>
            </div>
          </div>
          
          {/* Botón para subir imágenes y extraer datos con Gemini */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Extraer datos automáticamente de imágenes
              </label>
              <span className="text-xs text-slate-500">(Cédula/Foto del vehículo)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={processingImages}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${processingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processingImages ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                {processingImages ? 'Procesando...' : 'Subir Imágenes'}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleVehicleImageUpload(e.target.files)}
                className="hidden"
              />
              
              <div className="text-sm text-slate-600">
                {processingImages ? 'Analizando con Gemini AI...' : 'Máx. 3 imágenes'}
              </div>
            </div>
            
            {/* Preview de imágenes subidas */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Imágenes subidas:</h3>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onClick={() => setShowImagePreview(URL.createObjectURL(file))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-slate-500 mt-2">
              Sube fotos de la cédula del vehículo o del vehículo mismo para extraer automáticamente los datos.
            </p>
          </div>
        </div>
        
        {/* Sección de seguro */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Información de Seguro</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Compañía de Seguros
              </label>
              <input
                type="text"
                name="insurance.provider"
                value={formData.insurance?.provider}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número de Póliza
              </label>
              <input
                type="text"
                name="insurance.policyNumber"
                value={formData.insurance?.policyNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vencimiento
              </label>
              <input
                type="date"
                name="insurance.expiration"
                value={formData.insurance?.expiration}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Subir póliza de seguro
              </label>
              <span className="text-xs text-slate-500">(Gemini extraerá datos automáticamente)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={triggerDocumentInput}
                disabled={!!processingDocument}
                className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition ${processingDocument ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processingDocument === 'Insurance' ? <Loader size={18} className="animate-spin" /> : <FileUp size={18} />}
                {processingDocument === 'Insurance' ? 'Procesando...' : 'Subir Póliza'}
              </button>
              
              <input
                type="file"
                ref={documentInputRef}
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleDocumentUpload(e.target.files[0], 'Insurance');
                  }
                }}
                className="hidden"
              />
              
              <div className="text-sm text-slate-600">
                {processingDocument === 'Insurance' ? 'Extrayendo datos...' : 'PDF o imágenes'}
              </div>
            </div>
            
            {/* Preview de documentos subidos */}
            {uploadedDocuments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Documentos subidos:</h3>
                <div className="flex flex-wrap gap-2">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="relative group">
                      <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-2">
                        <FileText size={16} />
                        <span className="text-sm truncate max-w-[150px]">{doc.file.name}</span>
                        <span className="text-xs text-slate-500">({doc.type})</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Información Adicional</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                VIN (Número de chasis)
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número de motor
              </label>
              <input
                type="text"
                name="motorNumber"
                value={formData.motorNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kilometraje actual
              </label>
              <input
                type="number"
                name="currentMileage"
                value={formData.currentMileage}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de combustible
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Gasolina">Gasolina</option>
                <option value="Diésel">Diésel</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</option>
                <option value="GNV">GNV</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Notas adicionales sobre el vehículo..."
            />
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
            disabled={loading}
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
