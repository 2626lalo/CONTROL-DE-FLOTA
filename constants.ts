import { User, UserRole, Vehicle, FuelType, VehicleStatus, OwnershipType, TransmissionType } from "./types";

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
    version: 'SRX PACK 4X4',
    fuelType: FuelType.DIESEL,
    status: VehicleStatus.ACTIVE,
    ownership: OwnershipType.OWNED,
    currentKm: 12500,
    serviceIntervalKm: 10000,
    nextServiceKm: 20000,
    costCenter: 'Operaciones',
    province: 'Mendoza',
    transmission: TransmissionType.AUTOMATIC,
    images: { 
        front: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=1000',
        list: [] 
    },
    documents: [],
    mileageHistory: [],
    // FIX: Removed non-existent property 'equipment' to match Vehicle interface
    purchaseValue: 65000000,
    adminData: {
        regimen: OwnershipType.OWNED,
        anio: 2024,
        vigenciaSugerida: 10,
        fechaCalculoVigencia: new Date().toISOString(),
        diasRestantesVigencia: 3650,
        aniosRestantesVigencia: 10,
        operandoPara: 'Empresa Constructora S.A.',
        zona: 'Cuyo',
        provincia: 'Mendoza',
        sitio: 'Base Central',
        uso: 'Operativo Altura',
        directorResponsable: 'Ing. Perez',
        conductorPrincipal: 'Juan Chofer',
        propietario: 'Empresa Constructora S.A.',
        tarjetaCombustible: { numero: '1234-5678', pin: '0000', proveedor: 'YPF', limiteMensual: 500000, saldoActual: 500000, fechaVencimiento: '2028-12-31', estado: 'activa' },
        tarjetaTelepase: { numero: '9999-0000', pin: '1111', proveedor: 'Autopistas', limiteMensual: 50000, saldoActual: 50000, fechaVencimiento: '2028-12-31', estado: 'activa' },
        unidadActiva: true,
        opcionesListas: {
            operandoPara: ['Empresa Constructora S.A.', 'Subcontratista A'],
            zona: ['Cuyo', 'Pampa', 'Patagonia'],
            sitio: ['Base Central', 'Obrador Norte'],
            uso: ['Operativo Altura', 'Gerencia', 'Logística'],
            director: ['Ing. Perez', 'Lic. Gomez'],
            conductor: ['Juan Chofer', 'Pedro Conductor'],
            // FIX: Removed documentTypes which is not a valid property of ManagedLists
            propietario: ['Empresa Constructora S.A.', 'Leasing Corp']
        }
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
    checklists: [],
    requests: [],
    providers: [],
    masterFindingsImage: null,
    versions: [
      "CABINA DOBLE 4X4 PACK", 
      "X-GEAR 4X4 AT 2.3 D CD", 
      "SW4 6 MT", 
      "CONFORTLINE 1.4 AT", 
      "2.0 XLI L/20 CVT", 
      "916 EV", 
      "1519-48", 
      "LA 4X2", 
      "TDI SRV AUT L12", 
      "2,4 STX 3 FILAS FULL L/11", 
      "FURGON TERMICO", 
      "2,2 TDI FURGON LARGO L/15"
    ],
    docTypes: ['CEDULA', 'TITULO', 'VTV', 'SEGURO', 'SENASA', 'ALQUILER', 'PERMISO MUNICIPAL', 'RUTA', 'MATAFUEGO 1KG', 'MATAFUEGO 5KG']
  }
};