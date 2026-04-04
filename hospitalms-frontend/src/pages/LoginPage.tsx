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
