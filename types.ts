export enum UserRole {
  ADMIN = 'ADMIN',
  ADMIN_L2 = 'ADMIN_L2',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  avatarUrl?: string;
  password?: string;
  createdAt: string;
  costCenter?: string;
  phone?: string;
  receiveAlerts?: boolean;
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVO',
  MAINTENANCE = 'EN TALLER',
  INACTIVE = 'INACTIVO',
  RESERVED = 'RESERVADO',
  SOLD = 'VENDIDO',
  RETURNED = 'DEVUELTO (DISPONIBLE)'
}

export enum OwnershipType {
  OWNED = 'PROPIO',
  RENTED = 'ALQUILADO',
  LEASING = 'LEASING'
}

export enum FuelType {
  NAFTA = 'NAFTA',
  DIESEL = 'DIESEL',
  HIBRIDO = 'HIBRIDO',
  ELECTRICO = 'ELECTRICO',
  GNC = 'GNC'
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMÁTICA'
}

export enum ServiceStage {
  REQUESTED = 'SOLICITADO',
  BUDGETING = 'EN COTIZACIÓN',
  REBUDGETING = 'EN RECOTIZACIÓN',
  AUDITING = 'EN PROCESO DE AUDITORÍA',
  SCHEDULING = 'EN ASIGNACIÓN DE TURNO',
  IN_WORKSHOP = 'EN TALLER',
  EXECUTING = 'EN EJECUCIÓN',
  FINISHED = 'TERMINADO',
  DELIVERY = 'ENTREGADO',
  CANCELLED = 'CANCELADO'
}

export enum ServiceCategory {
  PREVENTIVE = 'MANTENIMIENTO PREVENTIVO',
  CORRECTIVE = 'REPARACIÓN CORRECTIVA',
  BODYWORK = 'CHAPA Y PINTURA',
  TIRES = 'NEUMÁTICOS',
  ACCESSORIES = 'COMPRA DE ACCESORIOS',
  DOCUMENTATION = 'DOCUMENTACIÓN',
  OTHER = 'OTRO'
}

export interface ServiceMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  role: UserRole;
  isAi?: boolean;
}

export interface ServiceHistoryItem {
  id: string;
  date: string;
  userId: string;
  userName: string;
  fromStage: ServiceStage;
  toStage: ServiceStage;
  comment: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Estimate {
  id: string;
  version: number;
  providerId: string;
  providerName: string;
  items: EstimateItem[];
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUOTE';
  createdAt: string;
  imageUrl?: string;
  details?: string;
  approvedBy?: string;
  approvedEmail?: string;
  approvedAt?: string;
  approvedSignature?: string;
  rejectedReason?: string;
  requoteComment?: string;
}

export interface Provider {
  id: string;
  name: string;
  taxId: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  specialty: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  providerId: string;
  documentUrl: string;
  status: 'PENDING' | 'PAID';
}

export interface ServiceRequest {
  id: string;
  code: string;
  vehiclePlate: string;
  userId: string;
  userName: string;
  costCenter: string;
  stage: ServiceStage;
  category: ServiceCategory;
  description: string;
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  odometerAtRequest: number;
  createdAt: string;
  updatedAt: string;
  
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledProvider?: string;
  scheduledLocation?: string;
  scheduledContact?: string;
  scheduledAdminComments?: string;
  
  userSchedulingStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  userProposedDate?: string;
  userSchedulingComments?: string;
  
  entryDate?: string;
  entryDriver?: string;
  entryReceptionist?: string;
  entryComments?: string;
  entryChecklistId?: string;
  
  executionNovelties?: string;
  executionImages?: string[];
  
  conformanceStatus?: 'CONFORME' | 'OBSERVACIONES';
  conformanceComments?: string;
  conformanceDate?: string;
  conformanceSignature?: string;
  
  exitDate?: string;
  budgets: Estimate[];
  invoices: Invoice[];
  history: ServiceHistoryItem[];
  images: string[];
  totalCost?: number;
  messages?: ServiceMessage[];
  resolutionSummary?: string;
  unreadAdminCount?: number;
  unreadUserCount?: number;
  isDialogueOpen?: boolean;
}

export interface MileageLog {
  id: string;
  date: string;
  km: number;
  source: 'CHECKLIST' | 'SERVICE' | 'MANUAL';
  userId: string;
}

export interface Document {
  id: string;
  type: string;
  name?: string;
  documentNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  category: 'legal' | 'technical' | 'operational';
  files?: Array<{
    id: string;
    name: string;
    url: string;
    fileType: string;
    uploadDate: string;
    fileSize: number;
  }>;
  customFields?: Array<{ id: string; name: string; value: string }>;
  alertsEnabled: boolean;
  requiredForOperation: boolean;
  alertSettings?: {
    daysBeforeExpiration: number[];
    recipients: Array<{
      userId: string;
      channels: ('whatsapp' | 'email')[];
    }>;
  };
  notes?: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  type: 'standard' | 'damage';
  category: 'view' | 'incident';
  uploadDate: string;
  title?: string;
  incident?: {
    date: string;
    locationOnVehicle: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    report: string;
    status: 'pending' | 'resolved';
    photos: string[];
    attachments: Array<{
      id: string;
      name: string;
      url: string;
      fileType: string;
    }>;
  };
}

export enum TireStatus {
  NEW = 'NUEVO',
  GOOD = 'BUENO',
  REGULAR = 'REGULAR',
  WORN = 'DESGASTADO',
  CRITICAL = 'CRÍTICO'
}

export interface AccessoryItem {
  name: string;
  isEquipped: boolean;
  quantity: number;
  detail?: string;
}

export interface RentalPriceHistory {
  id: string;
  date: string;
  monthlyCost: number;
}

export interface RentalPago {
  id: string;
  nroComprobante: string;
  monto: number;
  fechaPago: string;
  periodoNombre: string;
  notes?: string;
}

export interface RentalReplacementEntry {
  id: string;
  date: string;
  originalPlate: string;
  replacementPlate: string;
  reason: string;
  status: 'ACTIVE' | 'FINISHED';
  returnDate?: string;
}

export interface PeriodoAlquiler {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  diasDelMes: number;
  diasVigentes: number;
  costoMensual: number;
  costoDiario: number;
  costoAcumulado: number;
  estadoPago: string;
}

export interface LeasingPago {
  id: string;
  nroCuota: number;
  monto: number;
  fechaPago: string;
  referencia: string;
  notas?: string;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export interface ManagedLists {
  operandoPara: string[];
  zona: string[];
  sitio: string[];
  uso: string[];
  director: string[];
  conductor: string[];
  propietario: string[];
  documentTypes?: string[];
}

export interface AdministrativeData {
  regimen: OwnershipType;
  anio: number;
  vigenciaSugerida: number;
  fechaCalculoVigencia: string;
  diasRestantesVigencia: number;
  aniosRestantesVigencia: number;
  operandoPara: string;
  zona: string;
  provincia: string;
  sitio: string;
  uso: string;
  directorResponsable: string;
  conductorPrincipal: string;
  propietario: string;
  tarjetaCombustible: {
    numero: string;
    pin: string;
    proveedor: string;
    limiteMensual: number;
    saldoActual: number;
    fechaVencimiento: string;
    estado: string;
  };
  tarjetaTelepase: {
    numero: string;
    pin: string;
    proveedor: string;
    limiteMensual: number;
    saldoActual: number;
    fechaVencimiento: string;
    estado: string;
  };
  unidadActiva: boolean;
  opcionesListas?: ManagedLists;
  proveedorAlquiler?: string;
  rentalProviderContact?: string;
  rentalProviderEmail?: string;
  rentalProviderPhone?: string;
  valorAlquilerMensual?: number;
  fechaInicioContrato?: string;
  fechaFinContrato?: string;
  rental_nroContrato?: string;
  configuracionPagos?: { periodoPagoDias: number };
  rentalPriceHistory?: RentalPriceHistory[];
  rental_pagos?: RentalPago[];
  rental_linkedPlate?: string;
  rental_replacementHistory?: RentalReplacementEntry[];
  rental_isReplacement?: boolean;
  leasing_estadoContrato?: string;
  leasing_cuotaMensual?: number;
  leasing_moneda?: 'ARS' | 'USD';
  leasing_plazoMeses?: number;
  leasing_tipo?: string;
  leasing_nroContrato?: string;
  leasing_fechaInicio?: string;
  leasing_fechaFin?: string;
  leasing_arrendadorNombre?: string;
  leasing_arrendadorCUIT?: string;
  leasing_arrendadorContacto?: string;
  leasing_arrendadorEmail?: string;
  leasing_valorResidual?: number;
  leasing_opcionCompra?: boolean;
  leasing_precioOpcionCompra?: number;
  leasing_pagos?: LeasingPago[];
}

export interface TireInfo {
  marca: string;
  medidas: string;
  presion: number;
  estado: string;
  ubicacion?: string;
}

export interface StandardAccessory {
  name: string;
  isEquipped: boolean;
  quantity: number;
  detail?: string;
}

export interface FichaTecnica {
  id: string;
  vehiculoId: string;
  patente: string;
  kilometrajeActual: number;
  ultimoServicio: {
    kilometraje: number;
    fecha: string;
    tipoServicio: string;
    observaciones: string;
  };
  kilometrajeRecomendadoServicio: number;
  historialServicios: any[];
  tipoCombustible: string;
  capacidadTanque: number;
  garantiaVigente: boolean;
  vencimientoGarantia: string;
  sistemaTraccion: string;
  tipoTransmision: string;
  neumaticos: {
    delanteroIzquierdo: TireInfo;
    delanteroDerecho: TireInfo;
    traseroIzquierdo: TireInfo;
    traseroDerecho: TireInfo;
  };
  neumaticosAuxiliares: {
    auxiliar1: TireInfo;
    auxiliar2: TireInfo;
  };
  dimensiones: {
    largo: number;
    ancho: number;
    alto: number;
    pesoBruto: number;
    capacidadCarga: number;
  };
  apariencia: {
    color: string;
    ploteado: boolean;
    tipoPloteo: string;
    tipoCaja: string;
    observacionCaja: string;
  };
  sistemaElectrico: {
    bateria: {
      marca: string;
      numeroSerie: string;
      amperaje: number;
      tipo: string;
    };
    alternador: {
      marca: string;
      amperaje: number;
    };
  };
  equipamiento: {
    accesoriosEstandar: StandardAccessory[];
    accesoriosAdicionales: Array<{
      descripcion: string;
      cantidad: number;
      notas?: string;
    }>;
    ruedasAuxilio: number;
    barraAntivuelco: boolean;
    slingas: number;
    grilletes: number;
    conos: number;
    cadenasDesatasco: number;
    tablasDesatasco: number;
    calzas: any[];
    balizaEstroboscopica: number;
    pertigaMinera: boolean;
    balizasTriangulo: number;
    spot: { activo: boolean };
    starlink: boolean;
    radioBase: boolean;
    rastreoSatelital: { activo: boolean };
    cuarta: boolean;
    mantas: number;
    botiquin: boolean;
    matafuegos: any[];
    cajaHerramientas: { tiene: boolean; herramientas: any[] };
    baulHerramientas: boolean;
    bidonCombustible: number;
    criqueGato: number;
    llaveRueda: number;
    trabasSeguridadRuedas: number;
    handi: boolean;
  };
  actualizadoPor: string;
  fechaActualizacion: string;
}

export interface AnalisisServicio {
  kilometrajeActual: number;
  kilometrajeUltimoServicio: number;
  kilometrajeRecomendado: number;
  proximoServicioIntervalo: number;
  proximoServicioHito: number;
  porcentajeUso: number;
  estado: 'ok' | 'atrasado' | 'urgente' | 'pendiente' | 'error_logico';
  alerta: {
    nivel: 'critico' | 'alerta' | 'advertencia' | 'info';
    mensaje: string;
    color: string;
  };
}

export interface Vehicle {
  plate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  motorNum: string;
  type: string;
  version: string;
  color?: string;
  status: VehicleStatus;
  ownership: OwnershipType;
  costCenter: string;
  province: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  currentKm: number;
  serviceIntervalKm: number;
  nextServiceKm: number;
  site?: string;
  zone?: string;
  images: {
    front?: string;
    rear?: string;
    leftSide?: string;
    rightSide?: string;
    list?: VehicleImage[];
  };
  documents: Document[];
  mileageHistory: MileageLog[];
  equipment: any[];
  adminData?: AdministrativeData;
  fichaTecnica?: FichaTecnica;
  purchaseValue?: number;
}

export interface ChecklistItem {
  name: string;
  status: 'GOOD' | 'REGULAR' | 'BAD';
  images?: string[];
  observation?: string;
}

export interface FindingMarker {
  id: number;
  x: number;
  y: number;
  comment: string;
  photo?: string;
}

export interface Checklist {
  id: string;
  vehiclePlate: string;
  userId: string;
  userName: string;
  date: string;
  type: string;
  km: number;
  costCenter?: string;
  canCirculate: boolean;
  motor: ChecklistItem[];
  lights: ChecklistItem[];
  general: ChecklistItem[];
  bodywork: ChecklistItem[];
  accessories: any[];
  damageZones?: string[];
  findingsMarkers?: FindingMarker[];
  signature?: string;
  clarification?: string;
  contactNumber?: string;
  receivedBy?: string;
  receiverSignature?: string;
  generalObservations?: string;
  originSector?: string;
  destinationSector?: string;
  currentLocation?: string;
  currentProvince?: string;
  emailRecipients?: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'VEHICLE' | 'USER' | 'SERVICE' | 'CHECKLIST';
  entityId: string;
  details: string;
}