import { User, UserRole, Vehicle, FuelType, VehicleStatus, OwnershipType, TransmissionType, ServiceStage } from "./types";

export const CHECKLIST_SECTIONS = {
  motor: ['Nivel de Agua', 'Nivel de Aceite', 'Líquido de Frenos', 'Líquido Hidráulico', 'Fugas de Aceite', 'Estado Batería'],
  lights: ['Tablero', 'Posición', 'Baja', 'Alta', 'Frenos', 'Giro Izquierdo', 'Giro Derecho', 'Balizas', 'Retroceso'],
  general: ['Limpieza Interior', 'Parabrisas', 'Neumáticos', 'Freno de Mano', 'Dirección', 'Bocina', 'Cinturones', 'Aire Acondicionado', 'Cámara de Retroceso', 'Equipo de Frío'],
  bodywork: ['Capot', 'Puertas', 'Guardabarros', 'Paragolpes', 'Caja / Caja Térmica'],
  accessories: [
    'Rueda Auxilio', 'Gato', 'Llave Rueda', 'Balizas Triángulo', 
    'Matafuego 1kg', 'Matafuego 5kg', 'Botiquín', 'Kit Herramientas',
    'Tabla de Desatasco', 'Mantas', 'Cadenas para nieve/barro',
    'Calzas de Seguridad', 'Baliza Estroboscópica', 'Pértiga', 'Cuarta',
    'Fundas para asiento', 'Bidón de combustible', 'Baúl de herramientas',
    'Pico', 'Pala', 'Conos', 'Eslinga', 'Grilletes', 'Barra Antivuelco',
    'Spot', 'Radio Base', 'Sistema de Rastreo', 'Starlink'
  ]
};

export const MOCK_USERS: User[] = [
  {
    id: 'u-master',
    nombre: 'Ale',
    apellido: 'Wilczek',
    email: 'alewilczek@gmail.com',
    telefono: '+5491100000000',
    role: UserRole.ADMIN,
    rolesSecundarios: [],
    estado: 'activo',
    approved: true,
    fechaRegistro: '2024-01-01T10:00:00Z',
    ultimoAcceso: new Date().toISOString(),
    intentosFallidos: 0,
    password: '12305',
    centroCosto: { id: 'cc-01', nombre: 'Dirección General', codigo: 'DIR-001' },
    costCenter: 'Dirección General',
    permisos: [],
    notificaciones: { email: true, push: true, whatsapp: true },
    creadoPor: 'sistema',
    fechaCreacion: '2024-01-01T10:00:00Z',
    actualizadoPor: 'sistema',
    fechaActualizacion: '2024-01-01T10:00:00Z',
    eliminado: false
  },
  {
    id: 'u-supervisor',
    nombre: 'Marcos',
    apellido: 'Logística',
    email: 'supervisor@empresa.com',
    telefono: '+5491122223333',
    role: UserRole.SUPERVISOR,
    rolesSecundarios: [],
    estado: 'activo',
    approved: true,
    fechaRegistro: '2024-02-15T09:00:00Z',
    password: 'admin',
    centroCosto: { id: 'cc-02', nombre: 'Operaciones Regionales', codigo: 'OP-REG' },
    intentosFallidos: 0,
    permisos: [],
    notificaciones: { email: true, push: true, whatsapp: false },
    creadoPor: 'u-master',
    fechaCreacion: '2024-02-15T09:00:00Z',
    actualizadoPor: 'u-master',
    fechaActualizacion: '2024-02-15T09:00:00Z',
    eliminado: false
  },
  {
    id: 'u-auditor',
    nombre: 'Carla',
    apellido: 'Compliance',
    email: 'auditor@seguridad.com',
    telefono: '+5491144445555',
    role: UserRole.AUDITOR,
    rolesSecundarios: [],
    estado: 'activo',
    approved: true,
    fechaRegistro: '2024-03-10T11:00:00Z',
    password: 'admin',
    centroCosto: { id: 'cc-03', nombre: 'Seguridad e Higiene', codigo: 'SHE-001' },
    intentosFallidos: 0,
    permisos: [],
    notificaciones: { email: true, push: false, whatsapp: true },
    creadoPor: 'u-master',
    fechaCreacion: '2024-03-10T11:00:00Z',
    actualizadoPor: 'u-master',
    fechaActualizacion: '2024-03-10T11:00:00Z',
    eliminado: false
  },
  {
    id: 'u-chofer-1',
    nombre: 'Miguel',
    apellido: 'Chofer',
    email: 'chofer@empresa.com',
    telefono: '+5491166667777',
    role: UserRole.USER,
    rolesSecundarios: [],
    estado: 'activo',
    approved: true,
    fechaRegistro: '2024-04-01T08:00:00Z',
    password: 'admin',
    centroCosto: { id: 'cc-02', nombre: 'Operaciones Regionales', codigo: 'OP-REG' },
    intentosFallidos: 0,
    permisos: [],
    notificaciones: { email: true, push: true, whatsapp: true },
    creadoPor: 'u-master',
    fechaCreacion: '2024-04-01T08:00:00Z',
    actualizadoPor: 'u-master',
    fechaActualizacion: '2024-04-01T08:00:00Z',
    eliminado: false
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    plate: 'AF123JK',
    make: 'Toyota',
    model: 'Hilux SRX 4x4',
    year: 2024,
    vin: '8AJFA12G34H567890',
    motorNum: '1GD-1234567',
    type: 'Pickup',
    version: 'SRX PACK 4X4 AT',
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
    ownership: OwnershipType.OWNED,
    currentKm: 12500,
    serviceIntervalKm: 10000,
    nextServiceKm: 20000,
    costCenter: 'Operaciones Regionales',
    province: 'Mendoza',
    transmission: TransmissionType.AUTOMATIC,
    images: { 
        front: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=1000',
        rear: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&q=80&w=1000',
        list: [] 
    },
    documents: [
        {
            id: 'doc-vtv-1',
            type: 'VTV',
            documentNumber: 'VTV-99822',
            issueDate: '2024-01-10',
            expirationDate: '2025-01-10',
            category: 'technical',
            files: [],
            alertsEnabled: true,
            requiredForOperation: true
        }
    ],
    purchaseValue: 65000000,
    adminData: {
        regimen: OwnershipType.OWNED,
        anio: 2024,
        vigenciaSugerida: 10,
        fechaCalculoVigencia: new Date().toISOString(),
        diasRestantesVigencia: 3600,
        aniosRestantesVigencia: 10,
        operandoPara: 'Operaciones Regionales',
        zona: 'Cuyo',
        provincia: 'Mendoza',
        sitio: 'Base Central',
        uso: 'Operativo Altura',
        directorResponsable: 'Ing. Perez',
        conductorPrincipal: 'Miguel Chofer',
        propietario: 'Empresa S.A.',
        tarjetaCombustible: { numero: '1234-5678', pin: '0000', proveedor: 'YPF', limiteMensual: 500000, saldoActual: 480000, fechaVencimiento: '2028-12-31', estado: 'activa' },
        tarjetaTelepase: { numero: '9999-0000', pin: '1111', proveedor: 'Autopistas', limiteMensual: 50000, saldoActual: 42000, fechaVencimiento: '2028-12-31', estado: 'activa' },
        unidadActiva: true
    }
  },
  {
    plate: 'AB012PO',
    make: 'Nissan',
    model: 'Frontier PRO-4X',
    year: 2022,
    vin: '8AJNS01G23M456789',
    motorNum: 'YS23-99128',
    type: 'Pickup',
    version: 'PRO-4X 4X4 AT',
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.MAINTENANCE,
    ownership: OwnershipType.OWNED,
    currentKm: 95400,
    serviceIntervalKm: 10000,
    nextServiceKm: 100000,
    costCenter: 'Operaciones Regionales',
    province: 'Neuquén',
    transmission: TransmissionType.AUTOMATIC,
    // Fix: Added missing required property 'documents' to satisfy Vehicle interface
    documents: [],
    images: { 
        front: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000', 
        list: [] 
    }
  }
];

export const GOLDEN_MASTER_SNAPSHOT = {
  version: "19.3.0-STABLE",
  timestamp: new Date().toISOString(),
  protected: true,
  data: {
    vehicles: INITIAL_VEHICLES,
    users: MOCK_USERS,
    checklists: [
        {
            id: 'CHK-1',
            vehiclePlate: 'AF123JK',
            userId: 'u-chofer-1',
            userName: 'Miguel Chofer',
            date: '2024-05-10T08:00:00Z',
            type: 'DIARIO',
            km: 12400,
            costCenter: 'Operaciones Regionales',
            currentProvince: 'Mendoza',
            canCirculate: true,
            motor: [
                { name: 'Nivel de Aceite', status: 'GOOD' },
                { name: 'Nivel de Agua', status: 'GOOD' }
            ],
            lights: [
                { name: 'Baja', status: 'GOOD' },
                { name: 'Frenos', status: 'GOOD' }
            ],
            general: [], bodywork: [], accessories: [],
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            clarification: 'MIGUEL CHOFER'
        },
        {
            id: 'CHK-2',
            vehiclePlate: 'AB012PO',
            userId: 'u-chofer-1',
            userName: 'Miguel Chofer',
            date: '2024-05-15T09:30:00Z',
            type: 'POR INGRESO A TALLER',
            km: 95400,
            costCenter: 'Operaciones Regionales',
            currentProvince: 'Neuquén',
            canCirculate: false,
            motor: [], lights: [], general: [], bodywork: [], accessories: [],
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            clarification: 'MIGUEL CHOFER',
            generalObservations: 'Unidad ingresa con choque lateral izquierdo por maniobra en reversa.'
        },
        {
            id: 'CHK-3',
            vehiclePlate: 'AF123JK',
            userId: 'u-master',
            userName: 'Ale Wilczek',
            date: '2024-05-20T11:00:00Z',
            type: 'DIARIO',
            km: 12500,
            costCenter: 'Operaciones Regionales',
            currentProvince: 'Mendoza',
            canCirculate: true,
            motor: [], lights: [], general: [], bodywork: [], accessories: [],
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            clarification: 'ALE WILCZEK',
            generalObservations: 'Unidad en perfecto estado para auditoría semanal.'
        }
    ],
    requests: [
        {
            id: 'SR-1',
            code: 'EV-88421',
            vehiclePlate: 'AF123JK',
            userId: 'u-master',
            userName: 'Ale Wilczek',
            userEmail: 'alewilczek@gmail.com',
            userPhone: '555-1234',
            costCenter: 'Operaciones Regionales',
            stage: ServiceStage.FINISHED,
            mainCategory: 'MANTENIMIENTO',
            specificType: 'PREVENTIVO',
            description: 'Mantenimiento preventivo de los 10.000 KM. Cambio de aceite, filtros y revisión de niveles en concesionario oficial.',
            location: 'Mendoza Base',
            odometerAtRequest: 10000,
            suggestedDates: [],
            priority: 'MEDIA',
            attachments: [],
            isDialogueOpen: false,
            messages: [
                { id: 'm1', userId: 'u-master', userName: 'Ale Wilczek', text: 'Solicito turno para service oficial.', timestamp: '2024-03-01T08:00:00Z', role: UserRole.ADMIN },
                { id: 'm2', userId: 'system', userName: 'Soporte', text: 'Turno confirmado para lunes 04/03.', timestamp: '2024-03-01T10:00:00Z', role: UserRole.ADMIN }
            ],
            budgets: [],
            history: [
                { id: 'h1', date: '2024-03-01T08:00:00Z', toStage: ServiceStage.REQUESTED, comment: 'Ticket abierto por administrador.', userId: 'u-master', userName: 'Ale Wilczek' },
                { id: 'h2', date: '2024-03-05T14:00:00Z', toStage: ServiceStage.FINISHED, comment: 'Servicio realizado satisfactoriamente. Factura cargada.', userId: 'u-master', userName: 'Ale Wilczek' }
            ],
            createdAt: '2024-03-01T08:00:00Z',
            updatedAt: '2024-03-05T14:00:00Z',
            totalCost: 185000
        },
        {
            id: 'SR-2',
            code: 'EV-99210',
            vehiclePlate: 'AB012PO',
            userId: 'u-chofer-1',
            userName: 'Miguel Chofer',
            userEmail: 'chofer@empresa.com',
            userPhone: '555-9988',
            costCenter: 'Operaciones Regionales',
            stage: ServiceStage.IN_WORKSHOP,
            mainCategory: 'MANTENIMIENTO',
            specificType: 'CORRECTIVO-CHAPA',
            description: 'Reparación de impacto trasero izquierdo. Requiere estirado de panel y pintura original por choque contra columna de obrador.',
            location: 'Neuquén Base',
            odometerAtRequest: 95400,
            suggestedDates: [],
            priority: 'ALTA',
            attachments: [],
            isDialogueOpen: true,
            messages: [
                { id: 'msg-1', userId: 'u-chofer-1', userName: 'Miguel Chofer', text: '¿Tienen fecha estimada de entrega? Necesitamos la unidad para el lunes.', timestamp: '2024-05-16T09:00:00Z', role: UserRole.USER }
            ],
            budgets: [
                { id: 'B-1', version: 1, providerId: 'prov-1', providerName: 'Taller El Rayo', totalAmount: 450000, status: 'APPROVED', createdAt: '2024-05-15T12:00:00Z', items: [] }
            ],
            history: [
                { id: 'h1', date: '2024-05-15T10:00:00Z', toStage: ServiceStage.REQUESTED, comment: 'Chofer reporta incidente por checklist de ingreso.', userId: 'u-chofer-1', userName: 'Miguel Chofer' },
                { id: 'h2', date: '2024-05-15T15:00:00Z', toStage: ServiceStage.IN_WORKSHOP, comment: 'Ingreso efectivo a taller chapa y pintura.', userId: 'u-master', userName: 'Ale Wilczek' }
            ],
            createdAt: '2024-05-15T10:00:00Z',
            updatedAt: '2024-05-16T09:00:00Z'
        },
        {
            id: 'SR-3',
            code: 'EV-10022',
            vehiclePlate: 'AE456RT',
            userId: 'u-supervisor',
            userName: 'Marcos Logística',
            userEmail: 'supervisor@empresa.com',
            userPhone: '555-4422',
            costCenter: 'Operaciones Regionales',
            stage: ServiceStage.BUDGETING,
            mainCategory: 'MANTENIMIENTO',
            specificType: 'GOMERÍA',
            description: 'Recambio de 4 neumáticos por desgaste límite detectado en auditoría visual.',
            location: 'Buenos Aires',
            odometerAtRequest: 45000,
            suggestedDates: [],
            priority: 'MEDIA',
            attachments: [],
            isDialogueOpen: false,
            messages: [],
            budgets: [],
            history: [
                { id: 'h1', date: '2024-05-18T11:00:00Z', toStage: ServiceStage.REQUESTED, comment: 'Solicitud enviada para aprobación comercial.', userId: 'u-supervisor', userName: 'Marcos Logística' }
            ],
            createdAt: '2024-05-18T11:00:00Z',
            updatedAt: '2024-05-18T11:00:00Z'
        }
    ],
    providers: [],
    masterFindingsImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1000',
    versions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"],
    docTypes: ['CEDULA', 'TITULO', 'VTV', 'SEGURO', 'SENASA', 'ALQUILER', 'RUTA', 'MATAFUEGO 1KG', 'MATAFUEGO 5KG', 'BOTIQUÍN']
  }
};