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
