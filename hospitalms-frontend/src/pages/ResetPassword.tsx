import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Key, Lock, ArrowLeft, Loader2, Save, Activity } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { authApi } from '../api/axiosInstance';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword({ email, token, newPassword });
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Password reset successfully. You can now login.'
      });
      navigate('/login');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to reset password. Please check your token.'
      });
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
            Set New Password
          </h1>
          <p className="text-[14px] text-zinc-500 mt-2 text-center max-w-[300px]">
            Enter the 6-digit confirmation token sent to your email along with your new password.
          </p>
        </div>

        <div className="bg-[#FDFDFD] border border-zinc-200 rounded-[20px] p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">6-Digit Token</label>
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-3.5 py-2.5 pl-10 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                  required
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 bg-white border border-zinc-200 rounded-lg text-[14px] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
              {loading ? 'Resetting...' : 'Save New Password'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors text-[13px] font-medium">
              <ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" />
              Return to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
