'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { password };
      if (loginMethod === 'email') {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      const res = await apiClient.post('/auth/login', payload);
      // Save tokens
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.user));

      // Redirect to account dashboard
      router.push('/account');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-white/20">
        
        {/* Title / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-purple-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent tracking-tight">
            CreativeArt
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === 'email'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => { setLoginMethod('email'); setError(''); }}
          >
            Email Address
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === 'phone'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => { setLoginMethod('phone'); setError(''); }}
          >
            Phone Number
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm leading-relaxed text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {loginMethod === 'email' ? (
            <div className="space-y-2">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Password</label>
              <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 text-xs transition-colors duration-150">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/35 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-purple-500/10 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-zinc-500 text-center text-sm mt-8">
          Don't have an account?{' '}
          <Link href="/register" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors duration-150">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}
