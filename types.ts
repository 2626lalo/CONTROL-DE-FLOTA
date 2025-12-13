
export enum UserRole {
  ADMIN = 'ADMIN',       // Nivel Alto: Todo acceso + Borrado
  ADMIN_L2 = 'ADMIN_L2', // Nivel 2: Todo acceso - Sin Borrado
  MANAGER = 'MANAGER',   // Nivel Medio: Gestión de Flota/Servicios
  DRIVER = 'DRIVER',     // Nivel Bajo: Checklist, Ver Unidad
  GUEST = 'GUEST'        // Sin Nivel: Pendiente
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  avatarUrl?: string;
  password?: string; // For simulation only
  createdAt: string;
  costCenter?: string;
  phone?: string; // WhatsApp Number
  receiveAlerts?: boolean; // Toggle for notifications
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export enum OwnershipType {
  OWNED = 'OWNED',
  RENTED = 'RENTED',
  LEASING = 'LEASING'
}

export interface Document {
  id: string;
  type: 'INSURANCE' | 'VTV_RTO' | 'TITLE' | 'IDENTIFICATION' | 'OTHER';
  name: string;
  images: string[]; // Changed from url: string to support multiple pages
  expirationDate?: string;
  issuer?: string; 
  uploadedAt: string;
  // New fields for extended extraction
  policyNumber?: string;
  clientNumber?: string;
  isValid?: boolean;
}

export interface RentalCostHistory {
  date: string; // Fecha de inicio de la nueva tarifa
  cost: number; // Costo mensual
}

export interface RentalSession {
  startDate: string;
  endDate: string;
  provider: string;
  totalCost: number;
  notes?: string;
}

// Common interface for syncable items
export interface SyncableItem {
    syncStatus?: 'PENDING' | 'SYNCED';
}

export interface Vehicle extends SyncableItem {
  plate: string; // Primary Key
  make: string;
  model: string;
  year: number;
  vin?: string;
  motorNum?: string; // Engine Number
  type: string; // Pickup, Sedan, Truck
  ownership: string; // Changed from OwnershipType to string to allow custom values
  status: VehicleStatus;
  
  // Rented specifics
  rentalProvider?: string;
  rentalStartDate?: string;
  rentalEndDate?: string; // If present, vehicle is returned
  monthlyRentalCost?: number; // Current monthly cost
  rentalCostHistory?: RentalCostHistory[]; // History of cost changes
  rentalSessions?: RentalSession[]; // Archived rental periods

  // Operational
  currentKm: number;
  lastServiceKm?: number;
  lastServiceDate?: string; // Date of last service
  lastServiceProvider?: string; // New field: Provider of last service
  serviceIntervalKm: number; // User defined interval (default 10000)
  nextServiceKm: number; // Auto-calc
  costCenter?: string;
  province?: string; // New field
  assignedUser?: string; // Driver or responsible person
  
  // Visuals
  images: {
    front?: string;
    rear?: string;
    left?: string;
    right?: string;
    others?: string[]; // Unlimited additional images
  };

  documents: Document[];
  history: ServiceHistory[];
}

export interface ServiceHistory {
  id: string;
  date: string;
  type: 'SERVICE' | 'REPAIR' | 'CHECKLIST' | 'RENTAL_FEE';
  description: string;
  cost: number;
  attachments: string[]; // URLs
}

// --- CHECKLIST TYPES ---

export interface ChecklistItem {
  name: string;
  status: 'GOOD' | 'REGULAR' | 'BAD';
  observation?: string;
  images?: string[]; // Multiple images
  customData?: { [key: string]: string }; // For specific data like Battery Brand, Serial, etc.
}

export interface AccessoryItem {
  name: string;
  hasIt: boolean;
  quantity: number;
  status: 'GOOD' | 'REGULAR' | 'BAD';
  observation?: string;
  expirationDate?: string; // For Extinguishers
  image?: string; // Image of the accessory (e.g. Scan evidence)
}

export interface Checklist extends SyncableItem {
  id: string;
  vehiclePlate: string;
  userId: string; // Who generated it
  userName: string;
  date: string;
  type: 'DAILY' | 'TRIP' | 'REPLACEMENT';
  km: number;
  
  // Auto-populated Info
  insuranceCompany?: string;
  insuranceExpiration?: string;
  
  // Sections
  motor: ChecklistItem[];
  lights: ChecklistItem[];
  general: ChecklistItem[];
  bodywork: ChecklistItem[]; // Chapa y pintura
  accessories: AccessoryItem[];
  
  canCirculate: boolean;
  signature?: string; // Base64 signature of receiver
  receiverName?: string; // If handover
  replacementVehiclePlate?: string; // If type is REPLACEMENT
}

// --- SERVICE WORKFLOW TYPES ---

export enum ServiceCategory {
  MAINTENANCE = 'MANTENIMIENTO',
  SERVICES = 'SERVICIOS',
  PURCHASES = 'COMPRAS'
}

export enum ServiceSubCategory {
  // Maintenance
  CORRECTIVE = 'Correctivo',
  PREVENTIVE = 'Preventivo',
  OFFICIAL = 'Preventivo - Concesionario Oficial',
  // Services
  RENTAL = 'Alquiler de Vehículos',
  ASSISTANCE = 'Asistencia Móvil',
  TIRES = 'Gomería',
  GPS = 'GPS',
  WASHING = 'Lavado',
  LOGISTICS = 'Logística',
  INSURANCE = 'Seguro',
  ACCIDENT = 'Siniestro',
  TOWING = 'Traslado',
  VTV = 'VTV / RTO',
  // Purchases
  PARTS = 'Compra de Repuestos'
}

export enum ServiceStage {
  REQUESTED = 'SOLICITADO',
  EVALUATION = 'EN EVALUACIÓN', // New Stage for Chat/Triage
  BUDGETING = 'PRESUPUESTO',
  APPROVAL = 'APROBACIÓN',
  SCHEDULED = 'TURNO ASIGNADO',
  IN_WORKSHOP = 'EN TALLER', // Recepción
  DELIVERY = 'ENTREGA / FINALIZADO',
  CANCELLED = 'CANCELADO'
}

export interface WorkflowLog {
  stage: ServiceStage;
  date: string;
  user: string;
  note?: string;
}

export interface Budget {
  id: string;
  type: 'ORIGINAL' | 'ADDITIONAL';
  file?: string; // Image/PDF
  provider: string;
  budgetNumber?: string; // New field for Budget Number
  details: string;
  totalCost: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedBy?: string; // Nombre del usuario que aprobó
}

export interface InvoiceData {
    file: string;
    invoiceNumber: string;
    amount: number;
}

export interface ChatMessage {
    id: string;
    sender: 'ADMIN' | 'USER';
    senderName: string;
    text: string;
    timestamp: string;
}

export interface ServiceRequest extends SyncableItem {
  id: string; // Unique ID
  vehiclePlate: string;
  userId: string; // Creator ID
  
  // Requester Info
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;

  // Classification
  category: ServiceCategory;
  subCategory: ServiceSubCategory | string;
  description: string;

  // Context
  currentKm?: number;
  locationCity: string;
  suggestedProvider?: string;
  
  // Scheduling Preferences
  preferredDates: { date: string, timeSlot: 'MAÑANA' | 'TARDE' | 'TODO EL DÍA' }[];

  // Workflow Data
  stage: ServiceStage;
  createdAt: string;
  updatedAt: string;
  
  budgets: Budget[]; // Array to support additional budgets
  
  appointment?: {
    date: string;
    time: string;
    address: string;
    provider: string;
    status: 'PENDING' | 'CONFIRMED' | 'CHANGE_REQUESTED';
    userProposal?: {
        date: string;
        time: string;
        note?: string;
    };
  };

  workshopEntry?: {
    date: string;
    confirmedBy: string;
  };

  delivery?: {
    date: string;
    invoices: InvoiceData[]; // Structured invoice data
    finalCost: number; // Sum of approved budgets OR sum of invoices
    observations?: string;
    userSatisfaction?: 'OK' | 'PROBLEM';
  };

  logs: WorkflowLog[];
  
  // Chat
  messages?: ChatMessage[];
}
