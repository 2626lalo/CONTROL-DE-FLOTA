
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider, useApp } from './context/FleetContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { VehicleForm } from './components/VehicleForm';
import { VehicleDetail } from './components/VehicleDetail';
import { Checklist } from './components/Checklist';
import { ServiceManager } from './components/ServiceManager';
import { AdminUsers } from './components/AdminUsers';
import { Reports } from './components/Reports';
import { DocumentationManager } from './components/DocumentationManager';
import { LoginScreen } from './components/LoginScreen';
import { TestSector } from './components/TestSector';
import { LucideLoader } from 'lucide-react';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDataLoading } = useApp();
  if (isDataLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <LucideLoader className="text-blue-500 animate-spin" size={40}/>
      <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Sincronizando Base de Datos...</p>
    </div>
  );
  if (!user) return <LoginScreen />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <FleetProvider>
      <HashRouter>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/new" element={<VehicleForm />} />
            <Route path="/vehicles/detail/:plate" element={<VehicleDetail />} />
            <Route path="/vehicles/:plate/edit" element={<VehicleForm />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/service" element={<ServiceManager />} />
            <Route path="/documentation" element={<DocumentationManager />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/test-sector" element={<TestSector />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthGuard>
      </HashRouter>
    </FleetProvider>
  );
}
