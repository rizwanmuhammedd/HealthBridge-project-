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
