import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check, X, Car, FileText, Shield, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { analyzeVehicleImage, analyzeDocumentImage, testGeminiConnection, getGeminiStatus } from '../services/geminiService';

interface VehicleFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    plate: initialData?.plate || '',
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || '',
    color: initialData?.color || '',
    type: initialData?.type || 'Sedan',
    vin: initialData?.vin || '',
    motorNum: initialData?.motorNum || '',
    insuranceCompany: initialData?.insuranceCompany || '',
    policyNumber: initialData?.policyNumber || '',
    expirationDate: initialData?.expirationDate || '',
    frontImage: null as File | null,
    backImage: null as File | null,
    documentImage: null as File | null,
  });

  const [processing, setProcessing] = useState({
    front: false,
    back: false,
    document: false,
  });

  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [geminiMessage, setGeminiMessage] = useState('Verificando conexión con Google AI...');
  const [lastTestTime, setLastTestTime] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);

  // Verificar conexión con Gemini al cargar
  useEffect(() => {
    checkGeminiConnection();
  }, []);

  const checkGeminiConnection = async () => {
    setTestingConnection(true);
    setGeminiStatus('checking');
    setGeminiMessage('Probando conexión con Google AI...');
    
    const result = await testGeminiConnection();
    const status = await getGeminiStatus();
    
    if (result.success) {
      setGeminiStatus('connected');
      setGeminiMessage(`✅ Conectado a Google AI - ${result.message}`);
    } else {
      setGeminiStatus('disconnected');
      setGeminiMessage(`❌ ${result.error || 'No se pudo conectar a Google AI'}`);
    }
    
    setLastTestTime(new Date().toLocaleTimeString());
    setTestingConnection(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front' | 'back' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño de archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor, sube una imagen menor a 5MB.');
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, sube solo archivos de imagen.');
      return;
    }

    // Actualizar el estado del archivo
    setFormData(prev => ({
      ...prev,
      [`${imageType}Image`]: file
    }));

    // Procesar con Gemini AI
    setProcessing(prev => ({ ...prev, [imageType]: true }));

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        let result;
        if (imageType === 'document') {
          result = await analyzeDocumentImage(base64, 'Cédula', file.type);
        } else {
          result = await analyzeVehicleImage([base64]);
        }
        
        if (result.success && result.data) {
          // Actualizar solo los campos que tengan datos
          const updates: any = {};
          
          Object.keys(result.data).forEach(key => {
            const value = result.data[key];
            if (value !== null && value !== undefined && value !== '') {
              updates[key] = value;
            }
          });
          
          setFormData(prev => ({
            ...prev,
            ...updates
          }));
          
          // Mostrar notificación de éxito
          if (Object.keys(updates).length > 0) {
            alert(`✅ Se extrajeron ${Object.keys(updates).length} campos automáticamente. Revísalos y edita si es necesario.`);
          } else {
            alert('ℹ️ No se pudieron extraer datos automáticamente. Por favor, completa los campos manualmente.');
          }
        } else {
          alert(`⚠️ ${result.error || 'No se pudieron extraer datos automáticamente. Completa los campos manualmente.'}`);
        }
        
        setProcessing(prev => ({ ...prev, [imageType]: false }));
      };
      
      reader.onerror = () => {
        alert('Error al leer el archivo. Intenta de nuevo.');
        setProcessing(prev => ({ ...prev, [imageType]: false }));
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(`Error procesando ${imageType}:`, error);
      alert(`Error al procesar la imagen: ${error.message || 'Error desconocido'}`);
      setProcessing(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.plate.trim()) {
      alert('Por favor, ingresa el número de placa.');
      return;
    }
    
    if (!formData.make.trim()) {
      alert('Por favor, ingresa la marca del vehículo.');
      return;
    }
    
    if (!formData.model.trim()) {
      alert('Por favor, ingresa el modelo del vehículo.');
      return;
    }
    
    if (!formData.year) {
      alert('Por favor, ingresa el año del vehículo.');
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const removeImage = (imageType: 'front' | 'back' | 'document') => {
    setFormData(prev => ({
      ...prev,
      [`${imageType}Image`]: null
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Estado de Gemini AI */}
      <div className={`p-4 rounded-lg mb-4 ${
        geminiStatus === 'connected' ? 'bg-green-50 border border-green-200' : 
        geminiStatus === 'checking' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              geminiStatus === 'connected' ? 'bg-green-100' : 
              geminiStatus === 'checking' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {geminiStatus === 'connected' ? (
                <Wifi size={20} className="text-green-600" />
              ) : geminiStatus === 'checking' ? (
                <RefreshCw size={20} className="text-yellow-600 animate-spin" />
              ) : (
                <WifiOff size={20} className="text-red-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  geminiStatus === 'connected' ? 'text-green-800' : 
                  geminiStatus === 'checking' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {geminiStatus === 'connected' ? 'Google AI: Conectado' : 
                   geminiStatus === 'checking' ? 'Google AI: Verificando...' : 'Google AI: No conectado'}
                </span>
                {lastTestTime && (
                  <span className="text-xs text-gray-500">({lastTestTime})</span>
                )}
              </div>
              <p className={`text-sm ${
                geminiStatus === 'connected' ? 'text-green-700' : 
                geminiStatus === 'checking' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {geminiMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={checkGeminiConnection}
            disabled={testingConnection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              testingConnection 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {testingConnection ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Probar Conexión
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sección de Imágenes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Imagen Frontal */}
        <div className={`border-2 ${formData.frontImage ? 'border-green-300' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
          <div className="flex flex-col items-center gap-3">
            {formData.frontImage ? (
              <>
                <div className="relative w-full">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage('front')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate max-w-full">
                  {formData.frontImage.name}
                </p>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium">Vista Frontal</p>
                  <p className="text-xs text-gray-500 mt-1">Sube foto frontal del vehículo</p>
                </div>
              </>
            )}
            
            <label className={`cursor-pointer px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              formData.frontImage 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <Upload size={18} />
              {formData.frontImage ? 'Cambiar Imagen' : 'Subir Imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'front')}
                capture="environment"
                disabled={processing.front}
              />
            </label>
            
            {processing.front && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                Procesando con AI...
              </div>
            )}
          </div>
        </div>

        {/* Imagen Trasera */}
        <div className={`border-2 ${formData.backImage ? 'border-green-300' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
          <div className="flex flex-col items-center gap-3">
            {formData.backImage ? (
              <>
                <div className="relative w-full">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage('back')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate max-w-full">
                  {formData.backImage.name}
                </p>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium">Vista Trasera</p>
                  <p className="text-xs text-gray-500 mt-1">Sube foto trasera del vehículo</p>
                </div>
              </>
            )}
            
            <label className={`cursor-pointer px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              formData.backImage 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <Upload size={18} />
              {formData.backImage ? 'Cambiar Imagen' : 'Subir Imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'back')}
                capture="environment"
                disabled={processing.back}
              />
            </label>
            
            {processing.back && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                Procesando con AI...
              </div>
            )}
          </div>
        </div>

        {/* Documento */}
        <div className={`border-2 ${formData.documentImage ? 'border-green-300' : 'border-dashed border-gray-300'} rounded-lg p-4`}>
          <div className="flex flex-col items-center gap-3">
            {formData.documentImage ? (
              <>
                <div className="relative w-full">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage('document')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate max-w-full">
                  {formData.documentImage.name}
                </p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium">Cédula Vehicular</p>
                  <p className="text-xs text-gray-500 mt-1">Sube foto de la cédula</p>
                </div>
              </>
            )}
            
            <label className={`cursor-pointer px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              formData.documentImage 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <Upload size={18} />
              {formData.documentImage ? 'Cambiar Documento' : 'Subir Documento'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'document')}
                capture="environment"
                disabled={processing.document}
              />
            </label>
            
            {processing.document && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                Procesando con AI...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del Vehículo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Car size={20} />
          Información del Vehículo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa *
            </label>
            <input
              type="text"
              name="plate"
              value={formData.plate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: ABC123"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: Toyota, Ford, Chevrolet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: Corolla, F-150, Silverado..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1900"
              max="2030"
              placeholder="Ej: 2023"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color *
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: Blanco, Negro, Rojo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Vehículo *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Sedan">Sedán</option>
              <option value="SUV">SUV</option>
              <option value="Pickup">Pickup</option>
              <option value="Van">Van</option>
              <option value="Truck">Camión</option>
              <option value="Motorcycle">Motocicleta</option>
              <option value="Other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de VIN (Chasis)
            </label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1HGCM82633A123456"
              maxLength={17}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Motor
            </label>
            <input
              type="text"
              name="motorNum"
              value={formData.motorNum}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: MTR123456789"
            />
          </div>
        </div>
      </div>

      {/* Información del Seguro */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} />
          Información del Seguro
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compañía Aseguradora
            </label>
            <input
              type="text"
              name="insuranceCompany"
              value={formData.insuranceCompany}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: MAPFRE, Seguros Equinoccial, QBE..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Póliza
            </label>
            <input
              type="text"
              name="policyNumber"
              value={formData.policyNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: POL-123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Nota sobre AI */}
      {geminiStatus === 'connected' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Función de Inteligencia Artificial Activada</p>
              <p className="text-sm text-blue-600 mt-1">
                Al subir imágenes, Google AI analizará automáticamente los datos del vehículo y llenará los campos correspondientes.
                Puedes revisar y editar la información antes de guardar.
              </p>
              <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
                <li>Sube fotos claras y bien iluminadas para mejores resultados</li>
                <li>La cédula vehicular debe ser legible</li>
                <li>El procesamiento toma 3-10 segundos por imagen</li>
                <li>Siempre verifica los datos extraídos automáticamente</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          {geminiStatus === 'connected' ? '✅ Google AI disponible para procesamiento' : '⚠️ Google AI no disponible - Completa manualmente'}
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Check size={18} />
            Guardar Vehículo
          </button>
        </div>
      </div>
    </form>
  );
};

export default VehicleForm;
