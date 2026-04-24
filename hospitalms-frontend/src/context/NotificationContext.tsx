import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/axiosInstance';
import { AlertTriangle, FlaskConical, BedDouble, Bell, X, CheckCircle, Info, MailOpen, Trash2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; type: ToastType; title: string; message: string; duration?: number; }

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentAt: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

interface NotificationContextType {
  toasts: Toast[];
  notifications: Notification[];
  unreadCount: number;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationApi.getMy(),
        notificationApi.getUnreadCount()
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s as fallback
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
    fetchNotifications(); // Refresh list when new toast arrives
  }, [fetchNotifications]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const signalrEvents = React.useMemo(() => [
    {
      event: 'LowStockAlert',
      handler: (data: any) => {
        addToast({
          type: 'warning', 
          title: '⚠ Low Stock Alert',
          message: `${data.name || data.Name} — Only ${data.currentStock || data.CurrentStock} units left`,
          duration: 8000,
        });
      },
    },
    {
      event: 'LabResultReady',
      handler: (data: any) => {
        addToast({
          type: (data.isAbnormal || data.IsAbnormal) ? 'error' : 'success',
          title: (data.isAbnormal || data.IsAbnormal) ? '🔴 Abnormal Lab Result' : '✅ Lab Result Ready',
          message: data.message || data.Message, duration: 7000,
        });
      },
    },
    {
      event: 'NewNotification',
      handler: () => fetchNotifications(),
    },
    {
      event: 'ReceiveNotification',
      handler: (data: any) => {
        addToast({
          type: data.type || data.Type || 'info',
          title: data.title || data.Title || 'New Notification',
          message: data.message || data.Message,
        });
        fetchNotifications();
      },
    }
  ], [addToast, fetchNotifications]);

  useSignalR(signalrEvents, isAuthenticated);

  return (
    <NotificationContext.Provider value={{ 
      toasts, 
      notifications, 
      unreadCount, 
      addToast, 
      removeToast, 
      markAsRead, 
      markAllAsRead,
      refreshNotifications: fetchNotifications 
    }}>
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
