import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Calendar, FlaskConical, Pill, Receipt,
  BedDouble, Users, Bell, LogOut, Menu, X, ChevronRight,
  Activity, Settings, Stethoscope, Home, CalendarDays,
  AlertTriangle, Info, Plus
} from 'lucide-react';
import type { Role } from '../../context/AuthContext';

const NAV_ITEMS: Record<Role, { icon: React.ReactNode; label: string; path: string; action?: string }[]> = {
  Patient: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Plus strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Book Appointment', path: '/dashboard?book=true' },
    { icon: <Calendar strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'My Appointments', path: '/appointments' },
    { icon: <Pill strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'My Prescriptions', path: '/prescriptions' },
    { icon: <Receipt strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Bills & Payments', path: '/bills' },
  ],
  Doctor: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <CalendarDays strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'My Schedule', path: '/schedule' },
    { icon: <Calendar strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Appointments', path: '/appointments' },
    { icon: <BedDouble strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Admissions', path: '/admissions' },
    { icon: <Pill strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Prescriptions', path: '/prescriptions' },
  ],
  Admin: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Staff', path: '/staff' },
    { icon: <BedDouble strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Beds', path: '/beds' },
    { icon: <Activity strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Analytics', path: '/analytics' },
    { icon: <Pill strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Pharmacy', path: '/pharmacy' },
    { icon: <Receipt strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Billing', path: '/billing' },
  ],
  Pharmacist: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Pill strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Medicines', path: '/medicines' },
    { icon: <Receipt strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Prescriptions', path: '/prescriptions' },
  ],
  LabTechnician: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FlaskConical strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Lab Queue', path: '/lab' },
  ],
  Receptionist: [
    { icon: <LayoutDashboard strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Calendar strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Appointments', path: '/appointments' },
    { icon: <BedDouble strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Admissions', path: '/admissions' },
    { icon: <Receipt strokeWidth={1.5} className="w-[18px] h-[18px]" />, label: 'Billing', path: '/billing' },
  ],
};

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = user ? NAV_ITEMS[user.role] : [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-emerald-500/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col bg-[#FDFDFD] border-r border-[#E5E5E5] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:relative ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#F4F4F5] border border-[#E5E5E5] flex items-center justify-center">
              <Activity strokeWidth={1.5} className="w-4 h-4 text-zinc-800" />
            </div>
            <div>
              <p className="text-[#18181B] font-semibold text-[15px] tracking-tight">GOMEDIC</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-zinc-800 transition-colors"><X strokeWidth={1.5} className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto w-full">
          {user?.role === 'Patient' && (
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-zinc-100 text-zinc-900 hover:bg-zinc-200 mb-6"
            >
              <div className="flex items-center gap-3 text-[13px]">
                <Home strokeWidth={1.5} className="w-[18px] h-[18px]" />
                <span>Return to Home</span>
              </div>
            </Link>
          )}

          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-3">Menu</div>

          {navItems.map(item => {
            const isActive = location.pathname.split('?')[0] === item.path.split('?')[0];
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition-all w-full
                  ${isActive
                    ? 'bg-zinc-100/80 text-zinc-900 font-medium'
                    : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700 transition-colors'}>{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-1">
          <Link
            to="/profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors ${location.pathname === '/profile' ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'}`}
          >
            <Settings strokeWidth={1.5} className="w-[18px] h-[18px]" /> Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 transition-colors text-[14px]"
          >
            <LogOut strokeWidth={1.5} className="w-[18px] h-[18px]" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="flex h-[100dvh] bg-[#FAFAFA] font-sans text-zinc-900 overflow-hidden selection:bg-zinc-200">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP NAVBAR */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-500 hover:text-zinc-900 transition-colors">
              <Menu strokeWidth={1.5} className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all ${notifOpen ? 'bg-zinc-200 text-zinc-900' : 'bg-transparent hover:bg-zinc-200/50 text-zinc-500 hover:text-zinc-900'}`}
              >
                <Bell strokeWidth={1.5} className="w-[18px] h-[18px]" />
                {unreadCount > 0 && <span className="absolute 1 top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FAFAFA] rounded-full" />}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FDFDFD] border border-[#E5E5E5] rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] z-50 overflow-hidden transform origin-top-right">
                    <div className="px-5 py-4 border-b border-[#E5E5E5] bg-transparent flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900 text-[14px]">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                          <Bell strokeWidth={1} className="w-8 h-8 text-zinc-300 mb-2" />
                          <p className="text-zinc-500 text-[13px]">You're all caught up.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setNotifOpen(false);
                              if (n.relatedEntityType === 'Prescription' && n.relatedEntityId) {
                                navigate(`/dashboard?prescriptionId=${n.relatedEntityId}`);
                              }
                            }}
                            className={`px-5 py-4 cursor-pointer transition-colors hover:bg-zinc-50 flex gap-3 ${!n.isRead ? 'bg-zinc-50/80' : ''}`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'error' ? <AlertTriangle strokeWidth={1.5} className="w-[18px] h-[18px] text-red-500" /> : <Info strokeWidth={1.5} className="w-[18px] h-[18px] text-zinc-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] leading-snug mb-1 ${!n.isRead ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <p className="text-[11px] text-zinc-400 mt-2">
                                {new Date(n.sentAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!n.isRead && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div
              onClick={() => navigate('/profile')}
              className={`w-8 h-8 rounded-full border border-zinc-200 bg-white cursor-pointer hover:bg-zinc-50 transition-colors flex items-center justify-center text-zinc-700 font-medium text-[13px] overflow-hidden`}
            >
              {user?.profileImageUrl && user.role !== 'Admin' ? (
                <img src={user.profileImageUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </div>
        </header>

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 overflow-y-auto w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;