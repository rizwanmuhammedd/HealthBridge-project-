import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProfilePage from './pages/ProfilePage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import DoctorDashboard from './components/dashboard/DoctorDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import {
  PatientDashboard,
  PharmacistDashboard,
  ReceptionistDashboard,
  LabTechDashboard,
} from './components/dashboard/OtherDashboards';
import { LoadingSpinner } from './components/ui';
import type { Role } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { EnquiryChat } from './components/chat/EnquiryChat';

const GOOGLE_CLIENT_ID = "104772244409-p0oo36ksq9fv90q2msniar58sieafigq.apps.googleusercontent.com";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Loading GOMEDIC…" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const DashboardRouter: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  
  const dashboards: Record<Role, React.ReactNode> = {
    Patient: <PatientDashboard />,
    Doctor: <DoctorDashboard />,
    Admin: <AdminDashboard />,
    Pharmacist: <PharmacistDashboard />,
    LabTechnician: <Navigate to="/" replace />,
    Receptionist: <ReceptionistDashboard />,
  };
  
  return <>{dashboards[user.role]}</>;
};

function AppContent() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardRouter />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        <Route path="/appointments" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/bills" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/billing" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/admissions" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/prescriptions" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/medicines" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/staff" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/pharmacy" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/beds" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><MainLayout><DashboardRouter /></MainLayout></PrivateRoute>} />
        <Route path="/schedule" element={<PrivateRoute><MainLayout><DoctorSchedulePage /></MainLayout></PrivateRoute>} />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user?.role === 'Patient' && <EnquiryChat />}
    </>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AppContent />
          </GoogleOAuthProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
