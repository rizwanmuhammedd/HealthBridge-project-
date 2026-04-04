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
