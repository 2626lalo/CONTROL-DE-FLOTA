
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

// --- INITIAL USERS (Clean State: Only Main Admin) ---
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Ale Wilczek',
    email: 'alewilczek@gmail.com',
    role: UserRole.ADMIN,
    approved: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Ale+Wilczek&background=0D8ABC&color=fff',
    createdAt: new Date().toISOString(),
    password: 'lalo',
    phone: '',
    receiveAlerts: true,
    costCenter: 'Gerencia'
  }
];

// --- EMPTY ARRAYS FOR CLEAN START ---
export const INITIAL_VEHICLES: Vehicle[] = [];
export const MOCK_REQUESTS: ServiceRequest[] = [];
export const MOCK_CHECKLISTS: Checklist[] = [];
