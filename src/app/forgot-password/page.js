'use client';

import { useState } from 'react';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import { Mail, Phone, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetToken('');

    try {
      const payload = {};
      if (method === 'email') {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      const res = await apiClient.post('/auth/forgot-password', payload);
      setSuccess(true);
      // Capture the mock reset token returned by backend for easy local testing
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset instructions. User may not exist.');
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
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent tracking-tight">
            Reset Password
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Get recovery link for your account</p>
        </div>

        {/* Success / Reset Link display */}
        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm leading-relaxed text-center">
              Recovery request processed successfully!
            </div>
            {resetToken && (
              <div className="p-5 bg-black/45 border border-purple-500/20 rounded-2xl space-y-3">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider block">Testing / Mock Helper:</span>
                <p className="text-zinc-300 text-xs leading-relaxed">Since email dispatch is mocked in dev, you can use the direct link below to reset your password:</p>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-xl text-xs transition-colors duration-150 shadow"
                >
                  Reset Password Now
                </Link>
              </div>
            )}
            <Link
              href="/login"
              className="flex items-center justify-center text-rose-400 hover:text-rose-300 text-sm font-semibold transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm text-center">
                {error}
              </div>
            )}

            {/* Switch Method */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  method === 'email'
                    ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => { setMethod('email'); setError(''); }}
              >
                Use Email
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  method === 'phone'
                    ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => { setMethod('phone'); setError(''); }}
              >
                Use Phone
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {method === 'email' ? (
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-purple-500/10 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Send Recovery Link'
                )}
              </button>
            </form>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-zinc-400 hover:text-zinc-300 text-sm font-semibold transition-colors duration-150"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
