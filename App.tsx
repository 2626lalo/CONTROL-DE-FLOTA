
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { VehicleForm } from './components/VehicleForm';
import { VehicleDetail } from './components/VehicleDetail';
import { Checklist } from './components/Checklist';
import { AdminUsers } from './components/AdminUsers';
import { Reports } from './components/Reports';
import { DocumentationManager } from './components/DocumentationManager';
import { LoginScreen } from './components/LoginScreen';
import { TestSector } from './components/TestSector';
import { UserManagement } from './components/UserManagement';
import { BienesDeUso } from './components/BienesDeUso';
import { DashboardAdmin } from './components/DashboardAdmin';
import { MesaControlExperimental } from './components/experimental/MesaControlExperimental';
import { ReportesExperimental } from './components/experimental/reportes/ReportesExperimental';
import { MantenimientoPredictivo } from './components/experimental/mantenimiento/MantenimientoPredictivo';
import { ConductoresExperimental } from './components/experimental/conductores/ConductoresExperimental';
import { MapaFlotaExperimental } from './components/experimental/geolocalizacion/MapaFlotaExperimental';
import { OptimizadorRutas } from './components/experimental/rutas/OptimizadorRutas';
import { LucideLoader } from 'lucide-react';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: firebaseUser, userData, loading: firebaseLoading } = useFirebase();
  const MASTER_ADMIN = 'alewilczek@gmail.com';

  if (firebaseLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <LucideLoader className="text-blue-500 animate-spin" size={40}/>
      <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest italic">Protocolos de Seguridad...</p>
    </div>
  );

  if (!firebaseUser) return <LoginScreen />;

  const isMaster = firebaseUser.email === MASTER_ADMIN;
  
  // Validación de Estado Cloud (Solo permite ACTIVO y APPROVED, excepto al Master)
  const isApproved = userData?.approved === true;
  const isActive = userData?.estado === 'activo';

  if (!isMaster && (!isApproved || !isActive)) {
    return <LoginScreen />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <FirebaseProvider>
      <FleetProvider>
        <HashRouter>
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/vehicles/new" element={<VehicleForm />} />
              <Route path="/vehicles/detail/:plate" element={<VehicleDetail />} />
              <Route path="/vehicles/:plate/edit" element={<VehicleForm />} />
              <Route path="/bienes-de-uso" element={<BienesDeUso />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/documentation" element={<DocumentationManager />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/users-management" element={<UserManagement />} />
              <Route path="/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reportes-experimental" element={<ReportesExperimental />} />
              <Route path="/mantenimiento-predictivo" element={<MantenimientoPredictivo />} />
              <Route path="/conductores" element={<ConductoresExperimental />} />
              <Route path="/mapa-flota" element={<MapaFlotaExperimental />} />
              <Route path="/optimizador-rutas" element={<OptimizadorRutas />} />
              <Route path="/test-sector" element={<TestSector />} />
              <Route path="/mesa-experimental" element={<MesaControlExperimental />} />
              <Route path="*" element={<Navigate to="/" />}  />
            </Routes>
          </AuthGuard>
        </HashRouter>
      </FleetProvider>
    </FirebaseProvider>
  );
}
