
import { User, UserRole, Vehicle, Checklist, ServiceRequest, ChecklistItem, AccessoryItem, VehicleStatus, OwnershipType, ServiceCategory, ServiceSubCategory, ServiceStage } from "./types";

export const CHECKLIST_SECTIONS = {
  motor: [
    'Nivel de Agua', 
    'Nivel de Aceite', 
    'Nivel Líquido de Frenos', 
    'Nivel Hidráulico', 
    'Fugas de Aceite',
    'Batería'
  ],
  lights: [
    'Tablero', 
    'Posición', 
    'Baja', 
    'Alta', 
    'Frenos', 
    'Giro Izquierdo', 
    'Giro Derecho', 
    'Balizas', 
    'Retroceso', 
    'Patente'
  ],
  general: [
    'Chapa y Pintura (General)', 
    'Limpieza Interior', 
    'Parabrisas', 
    'Luneta', 
    'Vidrios Laterales', 
    'Neumáticos', 
    'Frenos', 
    'Freno de Mano', 
    'Dirección', 
    'Bocina', 
    'Apoya Cabezas', 
    'Cinturones', 
    'Jaula Antivuelco', 
    'Parasoles', 
    'Cierre de Puertas', 
    'Limpiaparabrisas', 
    'Espejos Retrovisores', 
    'Ruidos Extraños'
  ],
  bodywork: [
    'Capot', 
    'Portón Trasero', 
    'Caja / Caja Térmica', 
    'Puerta Delantera Derecha', 
    'Puerta Delantera Izquierda', 
    'Puerta Trasera Derecha', 
    'Puerta Trasera Izquierda', 
    'Guardabarro Delantero Izquierdo', 
    'Guardabarro Delantero Derecho', 
    'Guardabarro Trasero Derecho', 
    'Guardabarro Trasero Izquierdo', 
    'Paragolpe Delantero', 
    'Paragolpe Trasero'
  ],
  accessories: [
    'Segunda Rueda Auxilio', 
    'Gato', 
    'Llave de Rueda', 
    'Triángulo Reflectivo', 
    'Cono', 
    'Cuña / Calza', 
    'Matafuego 1kg', 
    'Matafuego 5kg', 
    'Botiquín', 
    'Alarma de Retroceso', 
    'Eslinga', 
    'Grillete', 
    'Pala', 
    'Pico', 
    'Pértiga', 
    'Baliza Estroboscópica', 
    'Check Point', 
    'Funda de Asiento', 
    'Cadena para Nieve', 
    'Manta', 
    'Herramientas Básicas', 
    'Linterna', 
    'Spot', 
    'Radio Base', 
    'Starlink', 
    'GPS'
  ]
};

// --- INITIAL USERS (Simulated Team) ---
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Ale Wilczek',
    email: 'alewilczek@gmail.com',
    role: UserRole.ADMIN,
    approved: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=ale',
    createdAt: new Date().toISOString(),
    password: 'lalo',
    phone: '',
    receiveAlerts: true,
    costCenter: 'Gerencia'
  },
  {
    id: 'u2',
    name: 'Juan Perez',
    email: 'juan@flota.com',
    role: UserRole.DRIVER,
    approved: true,
    createdAt: new Date().toISOString(),
    password: '123',
    phone: '5491112345678',
    receiveAlerts: false,
    costCenter: 'Operaciones Norte'
  },
  {
    id: 'u3',
    name: 'Maria Gonzalez',
    email: 'maria@flota.com',
    role: UserRole.MANAGER,
    approved: true,
    createdAt: new Date().toISOString(),
    password: '123',
    phone: '5491187654321',
    receiveAlerts: true,
    costCenter: 'Proyecto Andes'
  }
];

// --- MOCK VEHICLES (6 Varied Examples) ---
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    plate: 'AB123CD',
    make: 'Toyota',
    model: 'Hilux 4x4',
    year: 2023,
    type: 'Pickup',
    ownership: OwnershipType.OWNED,
    status: VehicleStatus.ACTIVE,
    currentKm: 45000,
    serviceIntervalKm: 10000,
    nextServiceKm: 50000,
    lastServiceKm: 40000,
    costCenter: 'Proyecto Andes',
    province: 'Mendoza',
    assignedUser: 'Juan Perez',
    images: {
      front: 'https://images.unsplash.com/photo-1599933222396-48c6922923fa?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [
      { id: 'd1', type: 'INSURANCE', name: 'Seguro La Caja', images: [], uploadedAt: new Date().toISOString(), expirationDate: '2024-12-31', isValid: true }
    ],
    history: [],
    syncStatus: 'SYNCED'
  },
  {
    plate: 'AD456EF',
    make: 'Ford',
    model: 'Ranger Ltd',
    year: 2022,
    type: 'Pickup',
    ownership: OwnershipType.RENTED,
    rentalProvider: 'Rent-A-Truck',
    rentalStartDate: '2023-01-15',
    monthlyRentalCost: 850000,
    status: VehicleStatus.ACTIVE,
    currentKm: 12400,
    serviceIntervalKm: 10000,
    nextServiceKm: 12500, // WARNING: Close to service
    lastServiceKm: 2500,
    costCenter: 'Operaciones Norte',
    province: 'Salta',
    assignedUser: 'Carlos Lopez',
    images: {
      front: 'https://images.unsplash.com/photo-1570176829774-63309e37fb38?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [],
    history: [],
    syncStatus: 'SYNCED'
  },
  {
    plate: 'AF789GH',
    make: 'Volkswagen',
    model: 'Amarok V6',
    year: 2021,
    type: 'Pickup',
    ownership: OwnershipType.LEASING,
    status: VehicleStatus.MAINTENANCE, // IN WORKSHOP
    currentKm: 91500,
    serviceIntervalKm: 10000,
    nextServiceKm: 90000, // OVERDUE
    lastServiceKm: 80000,
    costCenter: 'Gerencia',
    province: 'Neuquén',
    assignedUser: 'Maria Gonzalez',
    images: {
      front: 'https://images.unsplash.com/photo-1605330368524-766324d77760?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [
        { id: 'd2', type: 'VTV_RTO', name: 'RTO Vigente', images: [], uploadedAt: new Date().toISOString(), expirationDate: '2023-10-01', isValid: true } // EXPIRED
    ],
    history: [],
    syncStatus: 'SYNCED'
  },
  {
    plate: 'AG012IJ',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2019,
    type: 'Van',
    ownership: OwnershipType.OWNED,
    status: VehicleStatus.INACTIVE, // RETURNED/SOLD
    currentKm: 150000,
    serviceIntervalKm: 15000,
    nextServiceKm: 155000,
    costCenter: 'Logística Central',
    province: 'Buenos Aires',
    images: {
      front: 'https://images.unsplash.com/photo-1615423689437-1422787c8003?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [],
    history: [],
    syncStatus: 'SYNCED'
  },
  {
    plate: 'AE345KL',
    make: 'Toyota',
    model: 'Etios',
    year: 2020,
    type: 'Sedan',
    ownership: OwnershipType.OWNED,
    status: VehicleStatus.ACTIVE,
    currentKm: 30000,
    serviceIntervalKm: 10000,
    nextServiceKm: 35000,
    costCenter: 'Administración',
    province: 'CABA',
    images: {
      front: 'https://images.unsplash.com/photo-1590362835106-1320965ee926?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [
        { id: 'd3', type: 'INSURANCE', name: 'Poliza Seguros', images: [], uploadedAt: new Date().toISOString(), expirationDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], isValid: true } // Expires in 5 days
    ],
    history: [],
    syncStatus: 'SYNCED'
  },
  {
    plate: 'AC678MN',
    make: 'Ford',
    model: 'F-150 Raptor',
    year: 2024,
    type: 'Pickup',
    ownership: OwnershipType.RENTED,
    rentalProvider: 'Patagonia Rental',
    status: VehicleStatus.ACTIVE,
    currentKm: 5000,
    serviceIntervalKm: 10000,
    nextServiceKm: 10000,
    costCenter: 'Proyecto Minero',
    province: 'Santa Cruz',
    images: {
      front: 'https://images.unsplash.com/photo-1579296530663-b4d293297a7a?auto=format&fit=crop&q=80&w=1000',
      others: []
    },
    documents: [],
    history: [],
    syncStatus: 'SYNCED'
  }
];

// --- MOCK SERVICE REQUESTS (6 Varied Examples) ---
export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'REQ-001',
    vehiclePlate: 'AF789GH',
    userId: 'u1',
    requesterName: 'Maria Gonzalez',
    requesterEmail: 'maria@flota.com',
    requesterPhone: '5491187654321',
    category: ServiceCategory.MAINTENANCE,
    subCategory: ServiceSubCategory.CORRECTIVE,
    description: 'Ruido fuerte en tren delantero y testigo de motor encendido. Servicio de 90k vencido.',
    currentKm: 91500,
    locationCity: 'Neuquén',
    suggestedProvider: 'Concesionario Oficial',
    preferredDates: [],
    stage: ServiceStage.IN_WORKSHOP,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    updatedAt: new Date().toISOString(),
    budgets: [
        { id: 'b1', type: 'ORIGINAL', provider: 'Taller Oficial VW', totalCost: 450000, budgetNumber: 'PRE-9988', details: 'Service 90k + Bujes', date: new Date().toISOString(), status: 'APPROVED', approvedBy: 'Ale Wilczek' }
    ],
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date(Date.now() - 86400000 * 5).toISOString(), user: 'Maria Gonzalez' },
        { stage: ServiceStage.BUDGETING, date: new Date(Date.now() - 86400000 * 4).toISOString(), user: 'Admin' },
        { stage: ServiceStage.IN_WORKSHOP, date: new Date().toISOString(), user: 'Admin' }
    ],
    syncStatus: 'SYNCED'
  },
  {
    id: 'REQ-002',
    vehiclePlate: 'AD456EF',
    userId: 'u2',
    requesterName: 'Carlos Lopez',
    requesterEmail: 'carlos@flota.com',
    requesterPhone: '5491144445555',
    category: ServiceCategory.MAINTENANCE,
    subCategory: ServiceSubCategory.PREVENTIVE,
    description: 'Solicitud de Service 10.000km (Próximo a vencer).',
    currentKm: 12400,
    locationCity: 'Salta',
    suggestedProvider: '',
    preferredDates: [],
    stage: ServiceStage.REQUESTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    budgets: [],
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date().toISOString(), user: 'Carlos Lopez', note: 'Creado desde App' }
    ],
    syncStatus: 'SYNCED'
  },
  {
    id: 'REQ-003',
    vehiclePlate: 'AB123CD',
    userId: 'u2',
    requesterName: 'Juan Perez',
    requesterEmail: 'juan@flota.com',
    requesterPhone: '5491112345678',
    category: ServiceCategory.SERVICES,
    subCategory: ServiceSubCategory.TIRES,
    description: 'Pinchadura neumático trasero derecho. Necesita parche urgente.',
    currentKm: 45000,
    locationCity: 'Mendoza',
    suggestedProvider: 'Gomería El Rutero',
    preferredDates: [],
    stage: ServiceStage.DELIVERY, // Finished
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    budgets: [],
    delivery: {
        date: new Date(Date.now() - 86400000 * 9).toISOString(),
        invoices: [{ file: '', invoiceNumber: '0001-000055', amount: 15000 }],
        finalCost: 15000,
        userSatisfaction: 'OK'
    },
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date(Date.now() - 86400000 * 10).toISOString(), user: 'Juan Perez' },
        { stage: ServiceStage.DELIVERY, date: new Date(Date.now() - 86400000 * 9).toISOString(), user: 'Admin', note: 'Reparación rápida' }
    ],
    syncStatus: 'SYNCED'
  },
  {
    id: 'REQ-004',
    vehiclePlate: 'AE345KL',
    userId: 'u3',
    requesterName: 'Admin',
    requesterEmail: 'admin@flota.com',
    requesterPhone: '',
    category: ServiceCategory.SERVICES,
    subCategory: ServiceSubCategory.INSURANCE,
    description: 'Renovación de Póliza Anual (Vence en 5 días).',
    currentKm: 30000,
    locationCity: 'CABA',
    suggestedProvider: 'Broker Seguros',
    preferredDates: [],
    stage: ServiceStage.SCHEDULED,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    budgets: [],
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date(Date.now() - 86400000 * 2).toISOString(), user: 'System' },
        { stage: ServiceStage.SCHEDULED, date: new Date().toISOString(), user: 'Admin', note: 'Gestión iniciada con Broker' }
    ],
    syncStatus: 'SYNCED'
  },
  {
    id: 'REQ-005',
    vehiclePlate: 'AC678MN',
    userId: 'u1',
    requesterName: 'Ale Wilczek',
    requesterEmail: 'alewilczek@gmail.com',
    requesterPhone: '',
    category: ServiceCategory.PURCHASES,
    subCategory: ServiceSubCategory.PARTS,
    description: 'Compra de equipamiento minero: Pértiga y Jaula interna.',
    currentKm: 5000,
    locationCity: 'Santa Cruz',
    suggestedProvider: 'Equipamientos del Sur',
    preferredDates: [],
    stage: ServiceStage.BUDGETING,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    budgets: [
        { id: 'b2', type: 'ORIGINAL', provider: 'Equipamientos Sur', totalCost: 1200000, budgetNumber: 'Q-2024', details: 'Jaula + Pértiga LED', date: new Date().toISOString(), status: 'PENDING' }
    ],
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date(Date.now() - 86400000 * 1).toISOString(), user: 'Ale Wilczek' },
        { stage: ServiceStage.BUDGETING, date: new Date().toISOString(), user: 'System' }
    ],
    syncStatus: 'SYNCED'
  },
  {
    id: 'REQ-006',
    vehiclePlate: 'AF789GH',
    userId: 'u2',
    requesterName: 'Chofer Auxiliar',
    requesterEmail: 'aux@flota.com',
    requesterPhone: '',
    category: ServiceCategory.MAINTENANCE,
    subCategory: ServiceSubCategory.WASHING,
    description: 'Lavado completo post-viaje a campo.',
    currentKm: 91500,
    locationCity: 'Neuquén',
    suggestedProvider: 'Lavadero Central',
    preferredDates: [],
    stage: ServiceStage.EVALUATION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    budgets: [],
    logs: [
        { stage: ServiceStage.REQUESTED, date: new Date().toISOString(), user: 'Chofer Auxiliar' }
    ],
    syncStatus: 'SYNCED'
  }
];

// --- MOCK CHECKLISTS (6 Varied Examples) ---
const createMockItems = (names: string[], status: 'GOOD'|'BAD'|'REGULAR' = 'GOOD'): ChecklistItem[] => 
    names.map(name => ({ name, status, images: [] }));

const createMockAccessories = (names: string[]): AccessoryItem[] => 
    names.map(name => ({ name, hasIt: true, quantity: 1, status: 'GOOD' }));

export const MOCK_CHECKLISTS: Checklist[] = [
  {
    id: 'CHK-001',
    vehiclePlate: 'AB123CD',
    userId: 'u2',
    userName: 'Juan Perez',
    date: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
    type: 'DAILY',
    km: 45000,
    motor: createMockItems(CHECKLIST_SECTIONS.motor, 'GOOD'),
    lights: createMockItems(CHECKLIST_SECTIONS.lights, 'GOOD'),
    general: createMockItems(CHECKLIST_SECTIONS.general, 'GOOD'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'GOOD'),
    accessories: createMockAccessories(CHECKLIST_SECTIONS.accessories),
    canCirculate: true,
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // Fake pixel
    syncStatus: 'SYNCED'
  },
  {
    id: 'CHK-002',
    vehiclePlate: 'AD456EF',
    userId: 'u2',
    userName: 'Carlos Lopez',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: 'TRIP',
    km: 12400,
    motor: createMockItems(CHECKLIST_SECTIONS.motor, 'GOOD'),
    lights: [
        ...createMockItems(CHECKLIST_SECTIONS.lights.slice(0,5), 'GOOD'),
        { name: 'Giro Izquierdo', status: 'BAD', observation: 'Quemado', images: [] },
        ...createMockItems(CHECKLIST_SECTIONS.lights.slice(6), 'GOOD')
    ],
    general: createMockItems(CHECKLIST_SECTIONS.general, 'REGULAR'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'GOOD'),
    accessories: createMockAccessories(CHECKLIST_SECTIONS.accessories),
    canCirculate: true,
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    syncStatus: 'SYNCED'
  },
  {
    id: 'CHK-003',
    vehiclePlate: 'AF789GH',
    userId: 'u1',
    userName: 'Ale Wilczek',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    type: 'DAILY',
    km: 91500,
    motor: [
        { name: 'Nivel de Aceite', status: 'BAD', observation: 'Muy bajo, posible fuga', images: [] },
        ...createMockItems(CHECKLIST_SECTIONS.motor.slice(1), 'GOOD')
    ],
    lights: createMockItems(CHECKLIST_SECTIONS.lights, 'GOOD'),
    general: createMockItems(CHECKLIST_SECTIONS.general, 'BAD'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'REGULAR'),
    accessories: createMockAccessories(CHECKLIST_SECTIONS.accessories),
    canCirculate: false,
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    syncStatus: 'SYNCED'
  },
  {
    id: 'CHK-004',
    vehiclePlate: 'AB123CD',
    userId: 'u3',
    userName: 'Maria Gonzalez',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    type: 'REPLACEMENT',
    km: 44000,
    motor: createMockItems(CHECKLIST_SECTIONS.motor, 'GOOD'),
    lights: createMockItems(CHECKLIST_SECTIONS.lights, 'GOOD'),
    general: createMockItems(CHECKLIST_SECTIONS.general, 'GOOD'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'GOOD'),
    accessories: createMockAccessories(CHECKLIST_SECTIONS.accessories),
    canCirculate: true,
    receiverName: 'Juan Perez',
    replacementVehiclePlate: 'AE345KL',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    syncStatus: 'SYNCED'
  },
  {
    id: 'CHK-005',
    vehiclePlate: 'AE345KL',
    userId: 'u2',
    userName: 'Juan Perez',
    date: new Date().toISOString(),
    type: 'DAILY',
    km: 30000,
    motor: createMockItems(CHECKLIST_SECTIONS.motor, 'GOOD'),
    lights: createMockItems(CHECKLIST_SECTIONS.lights, 'GOOD'),
    general: createMockItems(CHECKLIST_SECTIONS.general, 'GOOD'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'GOOD'),
    accessories: [
        { name: 'Matafuego 1kg', hasIt: false, quantity: 0, status: 'BAD', observation: 'Faltante' },
        ...createMockAccessories(CHECKLIST_SECTIONS.accessories.slice(1))
    ],
    canCirculate: true,
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    syncStatus: 'SYNCED'
  },
  {
    id: 'CHK-006',
    vehiclePlate: 'AC678MN',
    userId: 'u1',
    userName: 'Ale Wilczek',
    date: new Date().toISOString(),
    type: 'TRIP',
    km: 5000,
    motor: createMockItems(CHECKLIST_SECTIONS.motor, 'GOOD'),
    lights: createMockItems(CHECKLIST_SECTIONS.lights, 'GOOD'),
    general: createMockItems(CHECKLIST_SECTIONS.general, 'GOOD'),
    bodywork: createMockItems(CHECKLIST_SECTIONS.bodywork, 'GOOD'),
    accessories: createMockAccessories(CHECKLIST_SECTIONS.accessories),
    canCirculate: true,
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    syncStatus: 'SYNCED'
  }
];
