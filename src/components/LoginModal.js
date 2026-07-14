'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useRouter } from 'next/navigation';

export default function LoginModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleShowModal = () => {
      setIsOpen(true);
      setError('');
    };
    
    window.addEventListener('show-login-modal', handleShowModal);
    
    return () => {
      window.removeEventListener('show-login-modal', handleShowModal);
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    // Trigger custom event just in case callers want to know if it was dismissed
    window.dispatchEvent(new Event('login-modal-closed'));
  };

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

      // Close modal
      setIsOpen(false);
      
      // Dispatch success event to let listeners (e.g. Add to Cart) know
      window.dispatchEvent(new Event('login-success'));

      // If the current route is /login, we should push somewhere else
      if (window.location.pathname === '/login') {
        router.push('/account');
      }

    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={handleClose} 
      />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title / Logo */}
        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-pink-500/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex p-1 bg-slate-50 rounded-xl mb-6 border border-slate-100">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 uppercase tracking-wider ${
              loginMethod === 'email'
                ? 'bg-white text-primary-pink shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setLoginMethod('email'); setError(''); }}
          >
            Email
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 uppercase tracking-wider ${
              loginMethod === 'phone'
                ? 'bg-white text-primary-pink shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setLoginMethod('phone'); setError(''); }}
          >
            Phone
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm leading-relaxed text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {loginMethod === 'email' ? (
            <div className="space-y-2">
              <label className="text-slate-600 text-xs font-bold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-pink focus:ring-1 focus:ring-primary-pink transition-all duration-200"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-slate-600 text-xs font-bold uppercase tracking-wider block">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-pink focus:ring-1 focus:ring-primary-pink transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-600 text-xs font-bold uppercase tracking-wider block">Password</label>
              <Link href="/forgot-password" onClick={handleClose} className="text-primary-pink hover:text-primary-pink-hover font-bold text-xs transition-colors duration-150">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-11 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-pink focus:ring-1 focus:ring-primary-pink transition-all duration-200"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
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
            className="w-full mt-2 bg-primary-pink hover:bg-primary-pink-hover text-white font-bold tracking-widest uppercase text-xs rounded-2xl py-4 transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-slate-500 text-center text-sm font-medium mt-8">
          Don't have an account?{' '}
          <Link href="/register" onClick={handleClose} className="text-primary-pink hover:text-primary-pink-hover font-bold transition-colors duration-150">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}
