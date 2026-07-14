'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Globe,
  Copy,
  CheckCircle,
  Coins,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  Info,
  ShieldCheck
} from 'lucide-react';

export default function AffiliatePage() {
  const [profile, setProfile] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);

  // Application form state
  const [referralCode, setReferralCode] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchProfile = async () => {
    try {
      const pData = await apiClient.get('/affiliate/me');
      setProfile(pData);

      if (pData && pData.status === 'APPROVED') {
        const [cData, linkData] = await Promise.all([
          apiClient.get('/affiliate/commissions'),
          apiClient.get('/affiliate/referral-link')
        ]);
        setCommissions(cData);
        setReferralLink(linkData.link);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/affiliate/apply', {
        referralCode,
        payoutNotes
      });
      fetchProfile();
    } catch (err) {
      setError(err.message || 'Application failed. Code might be taken.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-t-[#e04169] border-slate-100 animate-spin" />
      </div>
    );
  }

  // 1. Not an affiliate yet (or rejected)
  if (!profile || profile.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5 font-playfair">
            <Globe className="w-6 h-6 text-[#e04169]" />
            Join the Affiliate Network
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Recommend CreativeArt & earn commissions on every order referred by you!
          </p>
        </div>

        {profile?.status === 'REJECTED' && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs space-y-1">
            <p className="font-extrabold uppercase tracking-wide">Application Rejected</p>
            <p className="font-medium text-rose-550">Reason: {profile.rejectionReason || 'Does not meet program criteria.'}</p>
          </div>
        )}

        <form onSubmit={handleApply} className="bg-white border border-rose-100 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1.5 uppercase tracking-wide">
                Desired Referral Code *
              </label>
              <input
                type="text"
                placeholder="e.g. AMAN10"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e04169]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                This code will be used by your friends/followers during checkout. It must be unique.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1.5 uppercase tracking-wide">
                Payout Preferred Method & Notes
              </label>
              <textarea
                placeholder="e.g. UPI ID (aman@okaxis) or Bank Details..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e04169]"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                Provide details of where you wish to receive payouts. Payouts are made monthly.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#e04169] hover:bg-[#c93256] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest rounded-full transition-colors cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    );
  }

  // 2. Application pending approval
  if (profile.status === 'PENDING' || profile.status === 'SUSPENDED') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto text-3xl">
          ⏳
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800 font-playfair">
            {profile.status === 'SUSPENDED' ? 'Affiliate Profile Suspended' : 'Application Under Review'}
          </h2>
          <p className="text-xs text-slate-450 mt-1.5 leading-normal">
            {profile.status === 'SUSPENDED'
              ? 'Your affiliate profile has been temporarily suspended by the administration. Please contact support.'
              : 'Our administration team is currently reviewing your affiliate application. You will receive an email notification once approved.'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Approved affiliate dashboard
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5 font-playfair">
            <Globe className="w-6 h-6 text-[#e04169]" />
            Affiliate Partner Console
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Refer clients, track commission logs, and manage payment details.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5" /> Approved Affiliate
        </span>
      </div>

      {/* Share / Copy Referral Link */}
      <div className="bg-gradient-to-r from-rose-50 to-[#fff0f3] border border-rose-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[9px] text-[#e04169] font-extrabold uppercase tracking-widest">Your Partner referral link</span>
          <p className="text-xs text-slate-500 font-medium">Earn commission when users visit via your link or enter code <strong className="font-mono text-[#e04169] text-sm">{profile.referralCode}</strong> during checkout.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="bg-white border border-rose-150 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-700 w-full md:w-60 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 bg-[#e04169] hover:bg-[#c93256] text-white rounded-2xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Balance</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-slate-800 font-sans">₹{profile.summary.pending.toLocaleString('en-IN')}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">To be confirmed after order delivery</p>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed Balance</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-[#e04169] font-sans">₹{profile.summary.confirmed.toLocaleString('en-IN')}</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">Eligible for payouts</p>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Paid Out</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-black text-slate-800 font-sans">₹{profile.summary.paid.toLocaleString('en-IN')}</span>
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">Lifetime processed earnings</p>
        </div>
      </div>

      {/* Commissions History table */}
      <div className="bg-white border border-rose-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#e04169]" /> Referral Commissions History
        </h3>

        {commissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No referral sales or commissions recorded yet. Keep sharing! 🚀
          </div>
        ) : (
          <div className="overflow-x-auto border border-rose-50 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-rose-50/20">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Referral Rate</th>
                  <th className="py-3 px-4">Your Earnings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-xs text-slate-700">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-rose-50/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">#{comm.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      {comm.commissionType === 'PERCENTAGE' ? `${comm.commissionValue}%` : `₹${comm.commissionValue}`}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#e04169]">₹{comm.commissionAmount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        comm.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        comm.status === 'PAID' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        comm.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(comm.confirmedAt || comm.cancelledAt || comm.paidAt || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
