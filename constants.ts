
import { User, UserRole, Vehicle, FuelType, VehicleStatus, OwnershipType, TransmissionType, ServiceStage } from "./types";

export const CHECKLIST_SECTIONS = {
  motor: ['Nivel de Aceite', 'Nivel de Agua', 'Líquido de Frenos', 'Líquido Hidráulico', 'Fugas de Aceite', 'Estado Batería'],
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

// Se dejan vacíos para iniciar producción desde cero
export const MOCK_USERS: User[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const GOLDEN_MASTER_SNAPSHOT = {
  version: "2.5.0-PRODUCTION",
  timestamp: new Date().toISOString(),
  protected: true,
  data: {
    vehicles: [],
    users: [],
    checklists: [],
    requests: [],
    providers: [],
    masterFindingsImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1000',
    versions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"],
    docTypes: ['CEDULA', 'TITULO', 'VTV', 'SEGURO', 'SENASA', 'ALQUILER', 'RUTA', 'MATAFUEGO 1KG', 'MATAFUEGO 5KG', 'BOTIQUÍN']
  }
};
