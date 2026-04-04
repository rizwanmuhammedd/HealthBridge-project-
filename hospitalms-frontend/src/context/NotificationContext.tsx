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
