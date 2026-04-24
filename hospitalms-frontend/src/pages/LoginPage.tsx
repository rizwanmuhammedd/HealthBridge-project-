import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    dateOfBirth: ''
  });

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = mode === 'login' 
        ? await login(form.email, form.password)
        : await register({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            dateOfBirth: form.dateOfBirth
          });

      // Redirect based on role: Patients to Home, others to Dashboard
      if (user && user.role === 'Patient') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your details.';
      addToast({ type: 'error', title: mode === 'login' ? 'Login Failed' : 'Registration Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex items-center justify-center p-4 font-sans text-zinc-900 selection:bg-zinc-200">

      <div className="w-full max-w-[400px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-5 hover:scale-105 transition-transform duration-300">
            <Activity strokeWidth={2} className="w-5 h-5 text-zinc-50" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-center">
            {mode === 'login' ? 'Sign in to GOMEDIC' : 'Create an account'}
          </h1>
          <p className="text-[14px] text-zinc-500 mt-2 text-center">
            {mode === 'login' ? 'Welcome back. Please enter your details.' : 'Join the modern clinical platform today.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#FDFDFD] border border-zinc-200 rounded-[20px] p-6 sm:p-8 shadow-sm">

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-[13px] font-medium text-zinc-700">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-medium text-zinc-700">Password</label>
                {mode === 'login' && (
                  <Link
                    to="/forgot-password"
                    className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPwd ? <EyeOff strokeWidth={1.5} className="w-[18px] h-[18px]" /> : <Eye strokeWidth={1.5} className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <label className="text-[13px] font-medium text-zinc-700">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="1234567890"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <label className="text-[13px] font-medium text-zinc-700">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? (mode === 'login' ? 'Signing in...' : 'Registering...') : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>

            {mode === 'login' && (
              <div className="mt-6">
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#FDFDFD] px-3 text-zinc-400">Or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center [&>div]:!w-full [&>div>div]:!w-full">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        googleLogin(credentialResponse.credential)
                          .then(() => navigate('/dashboard'))
                          .catch((err) => {
                            console.error(err);
                            addToast({ type: 'error', title: 'Google Login Failed', message: 'Could not authenticate with Google.' });
                          });
                      }
                    }}
                    onError={() => {
                      addToast({ type: 'error', title: 'Google Login Failed', message: 'An error occurred during Google Sign-In.' });
                    }}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text="continue_with"
                    auto_select={false}
                  />
                </div>
              </div>
            )}
          </form>

          {/* Toggle Link */}
          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <p className="text-[13px] text-zinc-500">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-1.5 text-zinc-900 font-medium hover:underline underline-offset-2 transition-all"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex justify-center gap-4 py-2 text-[12px] text-zinc-400">
          <span className="hover:text-zinc-600 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-zinc-600 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
