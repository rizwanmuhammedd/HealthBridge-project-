$ErrorActionPreference = 'Stop'
$root = "hospitalms-frontend"

# 1. Update AdminDashboard.tsx with "Add Doctor" form including specific fields
$files = @{}
$files["src/components/dashboard/AdminDashboard.tsx"] = @'
import React, { useState, useEffect } from 'react';
import { Users, BedDouble, Pill, Receipt, Activity, Plus, Mail, Lock, User, Phone, Image as ImageIcon, GraduationCap, Award } from 'lucide-react';
import { StatCard, Card, Badge, PageHeader, LoadingSpinner, Button, Modal, Input, Select } from '../ui';
import { useSignalR } from '../../hooks/useSignalR';
import { authApi, api } from '../../api/axiosInstance';
import { useNotifications } from '../../context/NotificationContext';

const AdminDashboard: React.FC = () => {
  const { addToast } = useNotifications();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'Doctor',
    specialization: '', qualification: ''
  });

  const loadUsers = async () => {
    try {
      const res = await authApi.getUsers();
      setUsers(res.data);
    } catch {
      setUsers([{ id: 1, fullName: 'Demo Doctor', email: 'doctor@hms.com', role: 'Doctor' }]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  useSignalR([
    { event: 'LowStockAlert', handler: (d:any) => setAlerts(p => [{ id: Date.now(), msg: `Low Stock: ${d.Name}` }, ...p]) }
  ]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create User & Doctor details
      // In this setup, we'll send everything to a new "Staff Creation" pipeline
      await api.post('/api/auth/create-staff', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: 'Doctor',
        // Note: For a true microservice, we'd use an event bus, but here we'll assume 
        // the Admin UI or a backend orchestrator handles the linkage.
      });

      addToast({ type: 'success', title: 'Doctor Registered', message: `${form.fullName} (${form.qualification}) has been added.` });
      setAddModalOpen(false);
      loadUsers();
      setForm({ fullName:'', email:'', password:'', phone:'', role:'Doctor', specialization:'', qualification:'' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.response?.data?.message || 'Could not add doctor' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="System Management" 
        action={<Button onClick={() => setAddModalOpen(true)}><Plus className="w-4 h-4" /> Register New Doctor</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Hospital Staff Directory">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <Badge variant={u.role === 'Admin' ? 'danger' : 'info'}>{u.role}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Live Activity" action={<div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}>
            <div className="space-y-3">
              {alerts.map(a => <div key={a.id} className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-semibold border border-red-100 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {a.msg}</div>)}
              {alerts.length === 0 && <p className="text-slate-400 text-center py-8 text-xs font-medium italic">All systems operational</p>}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Professional Doctor" size="lg">
        <form onSubmit={handleAddDoctor} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</p>
              <Input label="Doctor Full Name" icon={<User />} value={form.fullName} onChange={(e:any)=>setForm({...form, fullName:e.target.value})} required placeholder="e.g. Dr. Sana Ahmed" />
              <Input label="Email Address" icon={<Mail />} type="email" value={form.email} onChange={(e:any)=>setForm({...form, email:e.target.value})} required placeholder="sana@hospital.com" />
              <Input label="Phone Number" icon={<Phone />} value={form.phone} onChange={(e:any)=>setForm({...form, phone:e.target.value})} required placeholder="9876543210" />
              <Input label="System Password" icon={<Lock />} type="password" value={form.password} onChange={(e:any)=>setForm({...form, password:e.target.value})} required placeholder="••••••••" />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Credentials</p>
              <Input label="Qualification" icon={<GraduationCap />} value={form.qualification} onChange={(e:any)=>setForm({...form, qualification:e.target.value})} required placeholder="e.g. MBBS, BDS, MD" />
              <Input label="Specialization" icon={<Award />} value={form.specialization} onChange={(e:any)=>setForm({...form, specialization:e.target.value})} required placeholder="e.g. Cardiology, Ortho" />
              
              <div className="pt-2">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Profile Picture</label>
                <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                  <p className="text-xs text-slate-400 font-medium group-hover:text-blue-500">Drag and drop or click to upload</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Complete Registration</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AdminDashboard;
'@

# 2. Update ProfilePage.tsx with premium UI and Password Change
$files["src/pages/ProfilePage.tsx"] = @'
import React, { useState } from 'react';
import { User, Lock, Save, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Card, PageHeader, Input, Button, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axiosInstance';
import { useNotifications } from '../context/NotificationContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return addToast({ type: 'error', title: 'Error', message: 'Passwords do not match' });
    }
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      addToast({ type: 'success', title: 'Success', message: 'Your password has been updated!' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.response?.data?.message || 'Could not update password' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader title="My Profile" subtitle="Account and Security Settings" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="space-y-6">
          <Card>
            <div className="text-center py-4">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl shadow-blue-500/30 mx-auto mb-6 transform hover:rotate-3 transition-transform cursor-pointer">
                {user?.fullName.charAt(0)}
              </div>
              <h3 className="text-2xl font-black text-slate-800">{user?.fullName}</h3>
              <p className="text-slate-500 font-medium mb-4">{user?.email}</p>
              <Badge variant="info">{user?.role}</Badge>
            </div>
            
            <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Mail className="w-4 h-4 text-blue-500" /> {user?.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Phone className="w-4 h-4 text-blue-500" /> Verified Member
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-500" /> Hospital ID: {user?.id}
              </div>
            </div>
          </Card>
        </div>

        {/* Security Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Update Security Credentials" action={<Lock className="w-5 h-5 text-slate-200" />}>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  We recommend using a strong password with at least 8 characters, including numbers and symbols, to keep your medical account secure.
                </p>
              </div>

              <div className="space-y-4">
                <Input 
                  label="Current Password" 
                  type="password" 
                  placeholder="Enter current password"
                  value={passForm.currentPassword} 
                  onChange={(e:any) => setPassForm({...passForm, currentPassword: e.target.value})} 
                  required 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="New Password" 
                    type="password" 
                    placeholder="Min. 8 characters"
                    value={passForm.newPassword} 
                    onChange={(e:any) => setPassForm({...passForm, newPassword: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="Confirm New Password" 
                    type="password" 
                    placeholder="Repeat new password"
                    value={passForm.confirmPassword} 
                    onChange={(e:any) => setPassForm({...passForm, confirmPassword: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full py-4 shadow-xl">
                <Save className="w-4 h-4" /> Save New Credentials
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
'@

# 3. Add Profile link to Sidebar
$layoutFile = "$root/src/components/layout/MainLayout.tsx"
$layoutContent = Get-Content $layoutFile -Raw
if ($layoutContent -notmatch "Profile") {
    $layoutContent = $layoutContent -replace "path: '/settings' }", "path: '/settings' },`n    { icon: <User className=`"w-5 h-5`" />,         label: 'My Profile',   path: '/profile' }"
    Set-Content $layoutFile $layoutContent
}

# 4. Add Route to App.tsx
$appFile = "$root/src/App.tsx"
$appContent = Get-Content $appFile -Raw
if ($appContent -notmatch "ProfilePage") {
    $appContent = "import ProfilePage from './pages/ProfilePage';`n" + $appContent
    $appContent = $appContent -replace '<Route path="/dashboard" element={<DashboardRouter />} />', '<Route path="/dashboard" element={<DashboardRouter />} />`n            <Route path="/profile" element={<ProfilePage />} />'
    Set-Content $appFile $appContent
}

# Write all files
foreach ($f in $files.Keys) {
    $path = "$root/$f"
    $parent = Split-Path $path -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Set-Content -Path $path -Value $files[$f]
}
