export enum UserRole {
  ADMIN = 'administrador',
  USER = 'usuario',
  PROVIDER = 'proveedor',
  AUDITOR = 'auditor',
  SUPERVISOR = 'supervisor'
}

export type UserStatus = 'activo' | 'inactivo' | 'pendiente' | 'suspendido' | 'bloqueado';

export interface Permission {
  id: string;
  seccion: 'dashboard' | 'flota' | 'inspecciones' | 'documentacion' | 'reportes' | 'servicios' | 'usuarios';
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  avatar?: string;
  passwordHash?: string;
  password?: string;
  estado: UserStatus;
  fechaRegistro: string;
  ultimoAcceso?: string;
  intentosFallidos: number;
  approved: boolean;
  centroCosto: {
    id: string;
    nombre: string;
    codigo: string;
  };
  costCenter?: string;
  role: UserRole;
  level: 1 | 2 | 3; // 1: Básico, 2: Intermedio, 3: Full/Manager
  rolesSecundarios: string[];
  permissions?: Permission[];
  notificaciones: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  creadoPor: string;
  fechaCreacion: string;
  actualizadoPor: string;
  fechaActualizacion: string;
  eliminado: boolean;
  fechaEliminacion?: string;
}

export enum ServiceStage {
  REQUESTED = 'SOLICITADO',
  APPOINTMENT_REQUESTED = 'SOLICITANDO TURNO',
  REVIEW = 'EN REVISIÓN',
  SCHEDULING = 'TURNO ASIGNADO',
  RECEPCION = 'RECEPCIÓN',
  IN_WORKSHOP = 'EN TALLER',
  BUDGETING = 'PRESUPUESTANDO',
  EXECUTING = 'EN EJECUCIÓN',
  INVOICING = 'FACTURACIÓN',
  FINISHED = 'FINALIZADO',
  CANCELLED = 'CANCELADO',
  DELIVERY = 'ENTREGADO'
}

export type MainServiceCategory = 'MANTENIMIENTO' | 'SERVICIO' | 'COMPRAS';

export interface SuggestedDate {
  id: string;
  fecha: string;
  turno: 'MAÑANA' | 'TARDE';
  hora?: string;
  nombreTaller?: string;
  direccionTaller?: string;
  mapUrl?: string;
  comentarios?: string;
}

export interface ServiceMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  role: UserRole;
}

export interface ServiceHistoryItem {
  id: string;
  date: string;
  userId: string;
  userName: string;
  fromStage?: ServiceStage;
  toStage: ServiceStage;
  comment: string;
  status?: ServiceStage;
  note?: string;
}

export interface ServiceRequest {
  id: string;
  code: string;
  vehiclePlate: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  costCenter: string;
  stage: ServiceStage;
  mainCategory: MainServiceCategory;
  category?: string;
  specificType: string;
  description: string;
  location: string;
  odometerAtRequest: number;
  suggestedDates: SuggestedDate[];
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  attachments: Array<{ name: string; url: string; type: string }>;
  isDialogueOpen: boolean;
  messages: ServiceMessage[];
  budgets: any[];
  history: ServiceHistoryItem[];
  createdAt: string;
  updatedAt: string;
  totalCost?: number;
  providerId?: string;
  unreadUserCount?: number;
  suggestedDate?: string;
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

export enum ServiceCategory {
  PREVENTIVE = 'MANTENIMIENTO PREVENTIVO',
  CORRECTIVE = 'REPARACIÓN CORRECTIVA',
  BODYWORK = 'CHAPA Y PINTURA',
  TIRES = 'NEUMÁTICOS',
  ACCESSORIES = 'COMPRA DE ACCESORIOS',
  DOCUMENTATION = 'DOCUMENTACIÓN',
  OTHER = 'OTRO'
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
  auditComment?: string;
  auditSignature?: string;
}

export interface ChecklistItem {
  name: string;
  status: 'GOOD' | 'REGULAR' | 'BAD' | undefined;
  observation?: string;
  images?: string[];
  hasIt?: boolean;
}

export interface AccessoryItem {
    name: string;
    isFireExt?: boolean;
    isBotiquin?: boolean;
    quantity: number;
    quantityFound: number;
    status: 'GOOD' | 'REGULAR' | 'BAD' | undefined;
    observation: string;
    images: string[];
    expirationDates?: string[];
    specification?: string;
    isManual?: boolean;
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
  costCenter: string;
  currentProvince: string;
  canCirculate: boolean;
  motor: ChecklistItem[];
  lights: ChecklistItem[];
  general: ChecklistItem[];
  bodywork: ChecklistItem[];
  accessories: AccessoryItem[];
  findingsMarkers?: FindingMarker[];
  signature: string;
  clarification: string;
  generalObservations?: string;
  receivedBy?: string;
  receiverSignature?: string;
  originSector?: string;
  destinationSector?: string;
  emailRecipients?: string[];
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export interface DocumentFile {
    id: string;
    name: string;
    url: string;
    fileType: string;
    uploadDate: string;
    fileSize?: number;
}

export interface Document {
  id: string;
  type: string;
  name?: string;
  documentNumber?: string;
  issueDate?: string;
  expirationDate: string;
  category?: 'legal' | 'technical' | 'other';
  files: DocumentFile[];
  customFields?: CustomField[];
  alertsEnabled?: boolean;
  requiredForOperation?: boolean;
  alertSettings?: {
    daysBeforeExpiration: number[];
    recipients: { userId: string; channels: ('whatsapp' | 'email')[] }[];
  };
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
        status: 'pending' | 'resolved' | 'comprado';
        photos: string[];
        attachments: any[];
    };
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

export interface PeriodoAlquiler {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  diasDelMes: number;
  diasVigentes: number;
  costoMensual: number;
  costoDiario: number;
  costoAcumulado: number;
  estadoPago: 'pendiente' | 'pagado';
}

export interface LeasingPago {
  id: string;
  nroCuota: number;
  monto: number;
  fechaPago: string;
  referencia: string;
  notes?: string;
}

export interface ManagedLists {
  operandoPara: string[];
  zona: string[];
  sitio: string[];
  uso: string[];
  director: string[];
  conductor: string[];
  propietario: string[];
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
      estado: 'activa' | 'bloqueada';
    };
    tarjetaTelepase: {
      numero: string;
      pin: string;
      proveedor: string;
      limiteMensual: number;
      saldoActual: number;
      fechaVencimiento: string;
      estado: 'activa' | 'bloqueada';
    };
    unidadActiva: boolean;
    opcionesListas?: ManagedLists;
    proveedorAlquiler?: string;
    rentalProviderContact?: string;
    rentalProviderEmail?: string;
    rentalProviderPhone?: string;
    fechaInicioContrato?: string;
    fechaFinContrato?: string;
    valorAlquilerMensual?: number;
    rentalPriceHistory?: RentalPriceHistory[];
    rental_pagos?: RentalPago[];
    leasing_nroContrato?: string;
    leasing_fechaInicio?: string;
    leasing_fechaFin?: string;
    leasing_plazoMeses?: number;
    leasing_tipo?: 'financiero' | 'operativo';
    leasing_arrendadorNombre?: string;
    leasing_arrendadorCUIT?: string;
    leasing_arrendadorContacto?: string;
    leasing_arrendadorEmail?: string;
    leasing_moneda?: 'ARS' | 'USD';
    leasing_valorResidual?: number;
    leasing_opcionCompra?: boolean;
    leasing_precioOpcionCompra?: number;
    leasing_estadoContrato?: 'activo' | 'comprado' | 'vencido';
    leasing_cuotaMensual?: number;
    leasing_pagos?: LeasingPago[];
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
    [key: string]: {
      marca: string;
      medidas: string;
      presion: number;
      estado: string;
    };
  };
  neumaticosAuxiliares: any;
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
    accesoriosAdicionales: any[];
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
  estado: 'ok' | 'pendiente' | 'urgente' | 'atrasado' | 'error_logico';
  alerta: {
    nivel: 'info' | 'advertencia' | 'alerta' | 'critico';
    mensaje: string;
    color: string;
  };
}

export interface Invoice {
    id: string;
    number: string;
    amount: number;
    date: string;
    url?: string;
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
  status: VehicleStatus;
  ownership: OwnershipType;
  costCenter: string;
  province: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  currentKm: number;
  serviceIntervalKm: number;
  nextServiceKm: number;
  images: {
    front?: string;
    rear?: string;
    leftSide?: string;
    rightSide?: string;
    list?: VehicleImage[];
  };
  documents: Document[];
  purchaseValue?: number;
  fichaTecnica?: FichaTecnica;
  adminData?: AdministrativeData;
  color?: string;
  mileageHistory?: MileageLog[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'VEHICLE' | 'SERVICE' | 'USER' | 'CHECKLIST';
  entityId: string;
  details: string;
}

export interface MileageLog {
  id: string;
  plate: string;
  km: number;
  date: string;
  source: 'CHECKLIST' | 'SERVICE' | 'MANUAL';
}
