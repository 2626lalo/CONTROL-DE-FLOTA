import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check, X, Car, FileText, Shield, AlertCircle } from 'lucide-react';
import { analyzeVehicleImage, analyzeDocumentImage, testGeminiConnection } from '../services/geminiService';

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
  const [geminiMessage, setGeminiMessage] = useState('');

  // Verificar conexión con Gemini al cargar
  useEffect(() => {
    checkGeminiConnection();
  }, []);

  const checkGeminiConnection = async () => {
    setGeminiStatus('checking');
    const result = await testGeminiConnection();
    
    if (result.success) {
      setGeminiStatus('connected');
      setGeminiMessage('✅ Conectado a Google AI');
    } else {
      setGeminiStatus('disconnected');
      setGeminiMessage('❌ No conectado: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front' | 'back' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        
        if (imageType === 'document') {
          const result = await analyzeDocumentImage(base64, 'Cédula', file.type);
          setFormData(prev => ({
            ...prev,
            plate: result.plate || prev.plate,
            vin: result.vin || prev.vin,
            motorNum: result.motorNum || prev.motorNum,
            year: result.year || prev.year,
            make: result.make || prev.make,
            model: result.model || prev.model,
            color: result.color || prev.color,
            type: result.type || prev.type,
          }));
        } else {
          const result = await analyzeVehicleImage([base64]);
          setFormData(prev => ({
            ...prev,
            plate: result.plate || prev.plate,
            make: result.make || prev.make,
            model: result.model || prev.model,
            year: result.year || prev.year,
            color: result.color || prev.color,
            type: result.type || prev.type,
            vin: result.vin || prev.vin,
            motorNum: result.motorNum || prev.motorNum,
          }));
        }
        
        setProcessing(prev => ({ ...prev, [imageType]: false }));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(`Error procesando ${imageType}:`, error);
      setProcessing(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Estado de Gemini AI */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              geminiStatus === 'connected' ? 'bg-green-500' : 
              geminiStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              {geminiStatus === 'connected' ? 'Google AI: Conectado' : 
               geminiStatus === 'checking' ? 'Google AI: Verificando...' : 'Google AI: No conectado'}
            </span>
            <span className="text-sm text-gray-600">{geminiMessage}</span>
          </div>
          <button
            type="button"
            onClick={checkGeminiConnection}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition"
          >
            <Check size={14} />
            Probar Conexión
          </button>
        </div>
      </div>

      {/* Sección de Imágenes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Imagen Frontal */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Camera className="h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">Vista Frontal</p>
              <p className="text-sm text-gray-500">Sube foto frontal del vehículo</p>
            </div>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Upload size={18} className="inline mr-2" />
              Subir Imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'front')}
                capture="environment"
              />
            </label>
            {formData.frontImage && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm">Imagen cargada</span>
              </div>
            )}
            {processing.front && (
              <div className="text-blue-600 text-sm">Procesando con AI...</div>
            )}
          </div>
        </div>

        {/* Imagen Trasera */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Camera className="h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">Vista Trasera</p>
              <p className="text-sm text-gray-500">Sube foto trasera del vehículo</p>
            </div>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Upload size={18} className="inline mr-2" />
              Subir Imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'back')}
                capture="environment"
              />
            </label>
            {formData.backImage && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm">Imagen cargada</span>
              </div>
            )}
            {processing.back && (
              <div className="text-blue-600 text-sm">Procesando con AI...</div>
            )}
          </div>
        </div>

        {/* Documento */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">Cédula Vehicular</p>
              <p className="text-sm text-gray-500">Sube foto de la cédula</p>
            </div>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Upload size={18} className="inline mr-2" />
              Subir Documento
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'document')}
                capture="environment"
              />
            </label>
            {formData.documentImage && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm">Documento cargado</span>
              </div>
            )}
            {processing.document && (
              <div className="text-blue-600 text-sm">Procesando con AI...</div>
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
              placeholder="Ej: Toyota"
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
              placeholder="Ej: Corolla"
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
              placeholder="Ej: Blanco"
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
              <option value="Other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de VIN
            </label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1HGCM82633A123456"
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
              placeholder="Ej: MTR123456"
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
              placeholder="Ej: MAPFRE"
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Función de Inteligencia Artificial</p>
            <p className="text-sm text-blue-600">
              Al subir imágenes, Google AI analizará automáticamente los datos del vehículo y llenará los campos correspondientes.
              Puedes revisar y editar la información antes de guardar.
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          <X size={18} className="inline mr-2" />
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Check size={18} className="inline mr-2" />
          Guardar Vehículo
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;
