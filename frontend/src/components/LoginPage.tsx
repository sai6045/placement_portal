import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';
import { Building2, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Invalid email or password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email.trim().toLowerCase(), password);
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response received from server.');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || !err.response) {
        setError('Unable to connect to the Placement Portal server. Please check your internet connection or backend server status.');
      } else {
        setError(err.response?.data?.error || err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-20 w-20 rounded-2xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm p-1.5 mx-auto items-center justify-center">
            <img src="/logo.jpg" alt="Rathinam Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">RATHINAM PLACEMENT PORTAL</h1>
          <p className="text-xs text-[#64748B]">Career Development &amp; Placement Cell Authentication</p>
        </div>

        {/* Main Login Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-6 border border-[#E2E8F0]">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-base font-bold text-[#1E293B]">Sign in to your account</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Enter your email and password to access the portal</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-[#64748B]" />
                <input
                  type="email"
                  required
                  placeholder="name@placement.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-medium text-[#1E293B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-[#64748B]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-medium text-[#1E293B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-lg shadow-sm transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
