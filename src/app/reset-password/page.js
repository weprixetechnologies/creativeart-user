'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('Invalid recovery link. Token parameter is missing.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token is missing. Cannot reset password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 hover:border-white/20 transition-all duration-300">
      
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-purple-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent tracking-tight">
          Create New Password
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Set a secure password for your account</p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm flex items-center justify-center">
          <CheckCircle className="w-5 h-5 mr-2 animate-bounce text-emerald-400" />
          Password reset successful! Redirecting to login...
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm text-center leading-relaxed">
          {error}
        </div>
      )}

      {/* Form */}
      {!success && token && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-purple-500/10 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}

      {(!token || success) && (
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center text-zinc-400 hover:text-zinc-300 text-sm font-semibold transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
          <p className="text-sm text-zinc-400">Loading form...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
