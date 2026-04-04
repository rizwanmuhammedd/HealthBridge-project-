$ErrorActionPreference = 'Stop'
$root = "hospitalms-frontend"

# 1. Directories
$dirs = @(
    "src/api", "src/components", "src/context", "src/hooks", "src/pages",
    "src/components/layout", "src/components/dashboard", "src/components/ui"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path "$root/$d" | Out-Null
}

# 2. Map of files
$files = @{}

# --- AuthContext.tsx ---
$files["src/context/AuthContext.tsx"] = @'
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type Role = 'Patient' | 'Doctor' | 'Admin' | 'Pharmacist' | 'LabTechnician' | 'Receptionist';

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = 'http://localhost:5000';
const TOKEN_KEY = 'hms_token';
const USER_KEY  = 'hms_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        const parsed: AuthUser = JSON.parse(stored);
        const payload = JSON.parse(atob(parsed.token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    const data = response.data as AuthUser;
    setUser(data);
    localStorage.setItem(USER_KEY,  JSON.stringify(data));
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await axios.post(`${BASE_URL}/api/auth/register`, data);
    await login(data.email, data.password);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
'@

# --- axiosInstance.ts ---
$files["src/api/axiosInstance.ts"] = @'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL  = 'http://localhost:5000';
const TOKEN_KEY = 'hms_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  login:    (email: string, password: string)  => api.post('/api/auth/login', { email, password }),
  register: (data: object)                      => api.post('/api/auth/register', data),
  getUsers: ()                                  => api.get('/api/auth/users'),
};

export const appointmentApi = {
  getMy:       ()              => api.get('/api/appointments/my'),
  getAll:      ()              => api.get('/api/appointments'),
  getByDoctor: (id: number)    => api.get(`/api/appointments/doctor/${id}`),
  book:        (data: object)  => api.post('/api/appointments', data),
  update:      (id: number, data: object) => api.put(`/api/appointments/${id}`, data),
  cancel:      (id: number)    => api.delete(`/api/appointments/${id}/cancel`),
};

export const admissionApi = {
  getAll:    ()                           => api.get('/api/admissions'),
  admit:     (data: object)               => api.post('/api/admissions', data),
  discharge: (id: number, data: object)   => api.put(`/api/admissions/${id}/discharge`, data),
};

export const labApi = {
  getPending:    ()                        => api.get('/api/lab/pending'),
  getByPatient:  (patientId: number)       => api.get(`/api/lab/patient/${patientId}`),
  orderTest:     (data: object)            => api.post('/api/lab', data),
  uploadResult:  (id: number, data: object)=> api.patch(`/api/lab/${id}/result`, data),
};

export const medicineApi = {
  getAll:      ()                          => api.get('/api/medicines'),
  getLowStock: ()                          => api.get('/api/medicines/low-stock'),
  add:         (data: object)              => api.post('/api/medicines', data),
  updateStock: (id: number, qty: number)   => api.patch(`/api/medicines/${id}/stock`, qty),
};

export const prescriptionApi = {
  create:   (data: object)   => api.post('/api/prescriptions', data),
  dispense: (id: number)     => api.post(`/api/prescriptions/${id}/dispense`),
  getAll:   ()               => api.get('/api/prescriptions'),
};

export const billApi = {
  create:  (data: object)               => api.post('/api/bills', data),
  pay:     (id: number, data: object)   => api.post(`/api/bills/${id}/payment`, data),
  getByPatient: (patientId: number)     => api.get(`/api/bills/patient/${patientId}`),
};

export const notificationApi = {
  getMy:        ()         => api.get('/api/notifications'),
  getUnread:    ()         => api.get('/api/notifications/unread-count'),
  markRead:     (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllRead:  ()         => api.patch('/api/notifications/read-all'),
};
'@

# --- useSignalR.ts ---
$files["src/hooks/useSignalR.ts"] = @'
import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5004/hubs/hospital';

export interface SignalREvent {
  event: string;
  handler: (...args: unknown[]) => void;
}

export const useSignalR = (events: SignalREvent[], enabled = true) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const connect = useCallback(async () => {
    const token = localStorage.getItem('hms_token');
    if (!token || !enabled) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?access_token=${token}`, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    events.forEach(({ event, handler }) => {
      connection.on(event, handler);
    });

    try {
      await connection.start();
      connectionRef.current = connection;
    } catch (err) {
      console.warn('SignalR connection failed:', err);
    }
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (connectionRef.current) connectionRef.current.stop();
    };
  }, [connect]);

  return connectionRef;
};
'@

# --- NotificationContext.tsx ---
$files["src/context/NotificationContext.tsx"] = @'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from './AuthContext';
import { AlertTriangle, FlaskConical, BedDouble, Bell, X, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; type: ToastType; title: string; message: string; duration?: number; }
interface NotificationContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error:   <AlertTriangle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info:    <Info className="w-5 h-5 text-blue-400" />,
  };
  return icons[type];
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-l-4 border-emerald-500 bg-slate-900/95',
  error:   'border-l-4 border-red-500 bg-slate-900/95',
  warning: 'border-l-4 border-amber-500 bg-slate-900/95',
  info:    'border-l-4 border-blue-500 bg-slate-900/95',
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl min-w-[320px] max-w-[400px] backdrop-blur-xl text-white animate-slide-in ${toastStyles[toast.type]}`}>
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white">{toast.title}</p>
        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [unreadCount, setUnread]  = useState(0);
  const { isAuthenticated }       = useAuth();

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
    setUnread(c => c + 1);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useSignalR([
    {
      event: 'LowStockAlert',
      handler: (data: any) => addToast({
        type: 'warning', title: '⚠ Low Stock Alert',
        message: `${data.Name} — Only ${data.CurrentStock} units left (min: ${data.MinimumStock})`,
        duration: 8000,
      }),
    },
    {
      event: 'LabResultReady',
      handler: (data: any) => addToast({
        type: data.IsAbnormal ? 'error' : 'success',
        title: data.IsAbnormal ? '🔴 Abnormal Lab Result' : '✅ Lab Result Ready',
        message: data.Message, duration: 7000,
      }),
    },
    {
      event: 'BedStatusChanged',
      handler: (data: any) => addToast({
        type: 'info', title: '🛏 Bed Status Updated',
        message: `Bed ${data.BedNumber} is now ${data.Status}`,
      }),
    },
  ], isAuthenticated);

  return (
    <NotificationContext.Provider value={{ toasts, addToast, removeToast, unreadCount }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => <div key={toast.id} className="pointer-events-auto"><ToastItem toast={toast} onRemove={removeToast} /></div>)}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
'@

# --- MainLayout.tsx ---
$files["src/components/layout/MainLayout.tsx"] = @'
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Calendar, FlaskConical, Pill, Receipt,
  BedDouble, Users, Bell, LogOut, Menu, X, ChevronRight,
  Activity, Search, Settings, Stethoscope
} from 'lucide-react';
import type { Role } from '../../context/AuthContext';

const NAV_ITEMS: Record<Role, { icon: React.ReactNode; label: string; path: string }[]> = {
  Patient: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Calendar className="w-5 h-5" />,         label: 'Appointments', path: '/appointments' },
    { icon: <FlaskConical className="w-5 h-5" />,     label: 'Lab Results',  path: '/lab' },
    { icon: <Receipt className="w-5 h-5" />,          label: 'Bills',        path: '/bills' },
  ],
  Doctor: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Calendar className="w-5 h-5" />,         label: 'Appointments', path: '/appointments' },
    { icon: <BedDouble className="w-5 h-5" />,        label: 'Admissions',   path: '/admissions' },
    { icon: <Pill className="w-5 h-5" />,             label: 'Prescriptions',path: '/prescriptions' },
    { icon: <FlaskConical className="w-5 h-5" />,     label: 'Lab Orders',   path: '/lab' },
  ],
  Admin: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Users className="w-5 h-5" />,            label: 'Staff',        path: '/staff' },
    { icon: <BedDouble className="w-5 h-5" />,        label: 'Beds',         path: '/beds' },
    { icon: <Activity className="w-5 h-5" />,         label: 'Analytics',    path: '/analytics' },
    { icon: <Pill className="w-5 h-5" />,             label: 'Pharmacy',     path: '/pharmacy' },
    { icon: <Receipt className="w-5 h-5" />,          label: 'Billing',      path: '/billing' },
  ],
  Pharmacist: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Pill className="w-5 h-5" />,             label: 'Medicines',    path: '/medicines' },
    { icon: <Receipt className="w-5 h-5" />,          label: 'Prescriptions',path: '/prescriptions' },
  ],
  LabTechnician: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <FlaskConical className="w-5 h-5" />,     label: 'Lab Queue',    path: '/lab' },
  ],
  Receptionist: [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Calendar className="w-5 h-5" />,         label: 'Appointments', path: '/appointments' },
    { icon: <BedDouble className="w-5 h-5" />,        label: 'Admissions',   path: '/admissions' },
    { icon: <Receipt className="w-5 h-5" />,          label: 'Billing',      path: '/billing' },
  ],
};

const ROLE_COLORS: Record<Role, string> = {
  Patient: 'bg-blue-500', Doctor: 'bg-violet-500', Admin: 'bg-rose-500',
  Pharmacist: 'bg-emerald-500', LabTechnician: 'bg-amber-500', Receptionist: 'bg-cyan-500',
};

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = user ? NAV_ITEMS[user.role] : [];
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-[#0f1729] border-r border-white/5 transition-transform duration-300 lg:translate-x-0 lg:relative ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">HealthBridge</p>
              <p className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">HMS Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} onClick={onClose} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <div className="flex items-center gap-3"><span className={location.pathname === item.path ? 'text-white' : 'text-slate-500'}>{item.icon}</span>{item.label}</div>
              {location.pathname === item.path && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-500">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
            </button>
            <div className={`w-9 h-9 rounded-xl ${user ? ROLE_COLORS[user.role] : 'bg-slate-200'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
'@

# --- UI Components index.tsx ---
$files["src/components/ui/index.tsx"] = @'
import React from 'react';
import { X, Loader2 } from 'lucide-react';

export const StatCard: React.FC<any> = ({ title, value, icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(colors as any)[color]}`}>{icon}</div>
    </div>
  );
};

export const Badge: React.FC<any> = ({ variant = 'neutral', children }) => {
  const styles = {
    success: 'bg-emerald-100 text-emerald-700', warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700', info: 'bg-blue-100 text-blue-700', neutral: 'bg-slate-100 text-slate-600'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${(styles as any)[variant]}`}>{children}</span>;
};

export const statusBadge = (s: string) => {
  const m: any = { Scheduled: 'info', Completed: 'success', Admitted: 'warning', Discharged: 'success', Pending: 'warning', Paid: 'success', Available: 'success', Occupied: 'danger' };
  return m[s] || 'neutral';
};

export const Modal: React.FC<any> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${(sizes as any)[size]} bg-white rounded-2xl shadow-2xl border border-white/60 animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export const Button: React.FC<any> = ({ variant = 'primary', size = 'md', loading, children, ...props }) => {
  const v = { primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20', secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200', danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20', ghost: 'text-slate-600 hover:bg-slate-100' };
  const s = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-4 py-2.5 text-sm rounded-xl', lg: 'px-6 py-3 text-sm rounded-xl' };
  return (
    <button {...props} disabled={props.disabled || loading} className={`inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${(v as any)[variant]} ${(s as any)[size]} ${props.className || ''}`}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}{children}
    </button>
  );
};

export const Input: React.FC<any> = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <input {...props} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${error ? 'border-red-400' : 'border-slate-200'}`} />
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

export const Select: React.FC<any> = ({ label, error, options, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <select {...props} className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${error ? 'border-red-400' : 'border-slate-200'}`}>
      {options.map((o:any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const LoadingSpinner: React.FC<any> = ({ message = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-4">
    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-slate-500 font-medium">{message}</p>
  </div>
);

export const EmptyState: React.FC<any> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
    <div className="text-slate-300 mb-2">{icon}</div>
    <p className="font-bold text-slate-700">{title}</p>
    {description && <p className="text-sm text-slate-400">{description}</p>}
  </div>
);

export const PageHeader: React.FC<any> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div><h1 className="text-2xl font-bold text-slate-800">{title}</h1>{subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}</div>
    {action}
  </div>
);

export const Card: React.FC<any> = ({ children, title, action, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
    {(title || action) && <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">{title && <h3 className="font-bold text-slate-800 text-sm">{title}</h3>}{action}</div>}
    <div className="p-5">{children}</div>
  </div>
);

export const ProgressBar: React.FC<any> = ({ value, max, color = 'bg-blue-500' }) => (
  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, Math.round((value/max)*100))}%` }} /></div>
);
'@

# --- DoctorDashboard.tsx ---
$files["src/components/dashboard/DoctorDashboard.tsx"] = @'
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, BedDouble, Pill, FlaskConical, Clock, CheckCircle, Plus, Stethoscope, ChevronRight } from 'lucide-react';
import { StatCard, Card, Badge, statusBadge, Button, Modal, Input, Select, PageHeader, EmptyState, LoadingSpinner } from '../ui';
import { appointmentApi, admissionApi, prescriptionApi, medicineApi } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [apptRes, admRes] = await Promise.all([
        appointmentApi.getByDoctor(user!.userId),
        admissionApi.getAll()
      ]);
      setAppointments(apptRes.data);
      setAdmissions(admRes.data);
    } catch {
      // Demo fallback
      setAppointments([{ id: 1, patientId: 101, appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: '09:00', tokenNumber: 1, status: 'Scheduled' }]);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Dr. ${user?.fullName} 👋`} subtitle="Welcome to your medical portal" action={<Button onClick={() => setAdmitOpen(true)}><Plus className="w-4 h-4" /> Admit Patient</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Appts" value={appointments.length} icon={<Calendar />} color="blue" />
        <StatCard title="Active Admissions" value={admissions.length} icon={<BedDouble />} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Patient Queue">
            {appointments.length === 0 ? <EmptyState title="No appointments" icon={<Calendar />} /> : 
              appointments.map(a => (
                <div key={a.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Patient #{a.patientId}</span>
                    <p className="text-xs text-slate-400">{a.appointmentTime} - Token #{a.tokenNumber}</p>
                  </div>
                  <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedPatient(a.patientId); setPrescribeOpen(true); }}><Pill className="w-3 h-3" /> Prescribe</Button>
                </div>
              ))
            }
          </Card>
        </div>
        <Card title="Active Admissions">
          {admissions.length === 0 ? <EmptyState title="Empty ward" icon={<BedDouble />} /> : 
            admissions.map(a => (
              <div key={a.id} className="p-3 bg-violet-50 rounded-xl mb-2">
                <p className="text-sm font-bold">Patient #{a.patientId}</p>
                <p className="text-xs text-slate-500">Bed #{a.bedId}</p>
              </div>
            ))
          }
        </Card>
      </div>
      <Modal isOpen={admitOpen} onClose={() => setAdmitOpen(false)} title="New Admission"><div className="space-y-4"><Input label="Patient ID" type="number" /><Button className="w-full">Process Admission</Button></div></Modal>
      <Modal isOpen={prescribeOpen} onClose={() => setPrescribeOpen(false)} title="New Prescription"><div className="space-y-4"><Input label="Notes" /><Button className="w-full">Save Prescription</Button></div></Modal>
    </div>
  );
};
export default DoctorDashboard;
'@

# --- AdminDashboard.tsx ---
$files["src/components/dashboard/AdminDashboard.tsx"] = @'
import React, { useState, useEffect } from 'react';
import { Users, BedDouble, Pill, Receipt, Activity, Wifi, WifiOff } from 'lucide-react';
import { StatCard, Card, Badge, PageHeader, LoadingSpinner, ProgressBar } from '../ui';
import { useSignalR } from '../../hooks/useSignalR';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  useSignalR([
    { event: 'LowStockAlert', handler: (d:any) => setAlerts(p => [{ id: Date.now(), msg: `Low Stock: ${d.Name}` }, ...p]) },
    { event: 'BedStatusChanged', handler: (d:any) => setAlerts(p => [{ id: Date.now(), msg: `Bed ${d.BedNumber} status changed` }, ...p]) }
  ]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Hospital Real-time Analytics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bed Occupancy" value="82%" icon={<BedDouble />} color="blue" />
        <StatCard title="Active Staff" value="48" icon={<Users />} color="violet" />
        <StatCard title="Revenue Today" value="₹94k" icon={<Receipt />} color="emerald" />
        <StatCard title="System Alerts" value={alerts.length} icon={<Activity />} color="rose" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{m:'Jan', v:4000}, {m:'Feb', v:3000}, {m:'Mar', v:2000}]}><XAxis dataKey="m" /><YAxis /><Bar dataKey="v" fill="#3b82f6" radius={4} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Live Activity Feed">
          <div className="space-y-3">
            {alerts.map(a => <div key={a.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm font-medium text-red-700">{a.msg}</div>)}
            {alerts.length === 0 && <p className="text-slate-400 text-center py-8">Waiting for live events...</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AdminDashboard;
'@

# --- OtherDashboards.tsx ---
$files["src/components/dashboard/OtherDashboards.tsx"] = @'
import React from 'react';
import { PageHeader, Card, EmptyState } from '../ui';
import { Calendar, Pill, FlaskConical, Receipt } from 'lucide-react';

export const PatientDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="My Health Portal" subtitle="Manage your visits and medical records" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Next Visit"><EmptyState icon={<Calendar />} title="No upcoming visits" /></Card>
      <Card title="Lab Results"><EmptyState icon={<FlaskConical />} title="All results normal" /></Card>
      <Card title="Outstanding Bills"><EmptyState icon={<Receipt />} title="No pending payments" /></Card>
    </div>
  </div>
);

export const PharmacistDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Pharmacy Management" />
    <Card title="Pending Prescriptions"><EmptyState icon={<Pill />} title="Queue is clear" /></Card>
  </div>
);

export const LabTechDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Laboratory Queue" />
    <Card title="Processing"><EmptyState icon={<FlaskConical />} title="No pending samples" /></Card>
  </div>
);

export const ReceptionistDashboard = () => (
  <div className="space-y-6">
    <PageHeader title="Reception Desk" />
    <Card title="Waitlist"><EmptyState icon={<Calendar />} title="No patients waiting" /></Card>
  </div>
);
'@

# --- LoginPage.tsx ---
$files["src/pages/LoginPage.tsx"] = @'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Stethoscope, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const { addToast }        = useNotifications();
  const navigate            = useNavigate();
  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm]       = useState({ email: '', password: '', fullName: '', phone: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone });
      navigate('/dashboard');
    } catch {
      addToast({ type: 'error', title: 'Auth Failed', message: 'Please check your credentials.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30"><Stethoscope className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">HealthBridge HMS</h1>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Register</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && <input type="text" placeholder="Full Name" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500" required />}
            <input type="email" placeholder="email@hospital.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500" required />
            <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500" required />
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
'@

# --- App.tsx ---
$files["src/App.tsx"] = @'
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
'@

# --- config files ---
$files["package.json"] = @'
{
  "name": "healthbridge-hms",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
  "dependencies": {
    "react": "^19.0.0", "react-dom": "^19.0.0", "react-router-dom": "^6.28.0",
    "axios": "^1.7.9", "@microsoft/signalr": "^8.0.7", "lucide-react": "^0.469.0", "recharts": "^2.13.3"
  },
  "devDependencies": {
    "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3", "tailwindcss": "^3.4.17", "autoprefixer": "^10.4.20", "postcss": "^8.4.47", "vite": "^6.0.5"
  }
}
'@

$files["tailwind.config.js"] = @'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { animation: { 'slide-in': 'slideIn 0.3s ease-out', 'scale-in': 'scaleIn 0.2s ease-out' }, keyframes: { slideIn: { from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } }, scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } } } } },
  plugins: [],
};
'@

$files["vite.config.ts"] = @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { port: 5173 } });
'@

$files["src/main.tsx"] = @'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
'@

$files["src/index.css"] = @'
@tailwind base; @tailwind components; @tailwind utilities;
@layer base { body { @apply bg-slate-50 text-slate-900; } }
'@

$files["index.html"] = @'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>HealthBridge HMS</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
'@

$files["postcss.config.js"] = @'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
'@

# 3. Write files
foreach ($f in $files.Keys) {
    $path = "$root/$f"
    $parent = Split-Path $path -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Set-Content -Path $path -Value $files[$f]
}
