'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation: must provide at least email or phone
    if (!email.trim() && !phone.trim()) {
      setError('Please provide either an Email Address or a Phone Number.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        password,
        role: 'CUSTOMER'
      };

      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();

      await apiClient.post('/auth/register', payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 hover:border-white/20 transition-all duration-300">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-purple-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent tracking-tight">
            Join CreativeArt
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Create your customer account</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm flex items-center justify-center">
            <CheckCircle className="w-5 h-5 mr-2 animate-bounce text-emerald-400" />
            Registration successful! Redirecting to login...
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm leading-relaxed text-center">
            {error}
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Email Address (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Phone Number (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-2xl py-3 pl-12 pr-12 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-purple-500/10 flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-zinc-500 text-center text-sm mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors duration-150">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
