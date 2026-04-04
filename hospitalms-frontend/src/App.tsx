import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DoctorDashboard from './components/dashboard/DoctorDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import { PatientDashboard, PharmacistDashboard, LabTechDashboard, ReceptionistDashboard } from './components/dashboard/OtherDashboards';
import { LoadingSpinner } from './components/ui';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner message="Loading HealthBridge…" /></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const dashboards: any = { Patient:<PatientDashboard />, Doctor:<DoctorDashboard />, Admin:<AdminDashboard />, Pharmacist:<PharmacistDashboard />, LabTechnician:<LabTechDashboard />, Receptionist:<ReceptionistDashboard /> };
  return user ? dashboards[user.role] : <Navigate to="/login" />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/*" element={<PrivateRoute><MainLayout><Routes>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes></MainLayout></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);
export default App;
