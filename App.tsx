import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DashboardExperimental } from './components/experimental/DashboardExperimental';
import { VehicleList } from './components/VehicleList';
import { VehicleDetail } from './components/VehicleDetail';
import { VehicleForm } from './components/VehicleForm';
import { Checklist } from './components/Checklist';
import { DocumentationManager } from './components/DocumentationManager';
import { Reports } from './components/Reports';
import { MantenimientoPredictivo } from './components/experimental/mantenimiento/MantenimientoPredictivo';
import { ReportesExperimental } from './components/experimental/reportes/ReportesExperimental';
import { TestSector } from './components/TestSector';
import { MesaControlExperimental } from './components/experimental/MesaControlExperimental';
import { DashboardAdmin } from './components/DashboardAdmin';
import { UserManagement } from './components/UserManagement';
import { AdminUsers } from './components/AdminUsers';
import { LoginScreen } from './components/LoginScreen';
import { BienesDeUso } from './components/BienesDeUso';
import { MapaFlotaExperimental } from './components/experimental/geolocalizacion/MapaFlotaExperimental';
import { OptimizadorRutas } from './components/experimental/rutas/OptimizadorRutas';
import { ConductoresExperimental } from './components/experimental/conductores/ConductoresExperimental';
import { UpdateNotification } from './components/UpdateNotification';
import { NotificationHandler } from './components/NotificationHandler';

// FIX: Added AppContent component to handle authentication state and centralized routing logic.
const AppContent = () => {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <NotificationHandler />
      <UpdateNotification />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard-pro" element={<DashboardExperimental />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/:plate/edit" element={<VehicleForm />} />
        <Route path="/vehicles/detail/:plate" element={<VehicleDetail />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/documentation" element={<DocumentationManager />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/mantenimiento-predictivo" element={<MantenimientoPredictivo />} />
        <Route path="/reportes-experimental" element={<ReportesExperimental />} />
        <Route path="/test-sector" element={<TestSector />} />
        <Route path="/mesa-experimental" element={<MesaControlExperimental />} />
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/users-management" element={<UserManagement />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/bienes-de-uso" element={<BienesDeUso />} />
        <Route path="/mapa-flota" element={<MapaFlotaExperimental />} />
        <Route path="/optimizador-rutas" element={<OptimizadorRutas />} />
        <Route path="/conductores" element={<ConductoresExperimental />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

// FIX: Defined the main App component and added the required default export to resolve errors in index.tsx and main.tsx.
const App = () => {
  return (
    <FirebaseProvider>
      <FleetProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </FleetProvider>
    </FirebaseProvider>
  );
};

export default App;