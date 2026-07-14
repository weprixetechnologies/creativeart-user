'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import { Loader, AlertTriangle, Gift, Copy, Check, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/coupons');
      setOffers(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load active offers.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1e293b] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Title Block */}
        <div className="text-center max-w-xl mx-auto space-y-3.5 mb-12">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#fff0f3] text-[#e04169] border border-rose-150 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Coupon Discounts
          </span>
          <h1 className="text-3xl sm:text-4xl font-playfair font-black text-slate-855">
            Active Deals & <span className="text-primary-pink font-playfair italic">Offers</span>
          </h1>
          <p className="text-slate-450 text-xs sm:text-sm font-semibold max-w-sm mx-auto leading-relaxed">
            Apply these coupon codes at checkout to unlock savings on your order.
          </p>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Loader className="w-9 h-9 animate-spin text-primary-pink" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading offers...</p>
          </div>
        ) : error ? (
          <div className="bg-[#fff0f3] border border-rose-100 rounded-3xl p-6 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-primary-pink mx-auto" />
            <p className="text-xs font-bold text-slate-700 leading-normal">{error}</p>
            <button
              onClick={fetchOffers}
              className="px-5 py-2.5 bg-primary-pink hover:bg-[#c23255] text-white rounded-full text-xs font-bold shadow-sm transition-all"
            >
              Try Again
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-4 bg-white border border-slate-100 rounded-[32px] p-10 max-w-md mx-auto shadow-sm">
            <Gift className="w-12 h-12 mx-auto text-rose-200" />
            <div>
              <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">No Active Coupons</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Check back later for seasonal promotions and discount codes!</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary-pink hover:bg-[#c23255] text-white rounded-full text-xs font-bold shadow-sm transition-all hover:scale-[1.01]"
            >
              Shop Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => {
              const expiryDate = offer.expires_at 
                ? new Date(offer.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Never Expires';
              const isPercentage = offer.type === 'PERCENTAGE';
              const valueFormatted = isPercentage ? `${parseFloat(offer.value)}%` : `₹${parseFloat(offer.value)}`;

              return (
                <div
                  key={offer.id}
                  className="bg-white border border-slate-100 hover:border-rose-150 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative background circle */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#fff0f3]/40 z-0 pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#fff0f3] flex items-center justify-center text-primary-pink border border-rose-100">
                        <Gift className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Promotion Code</span>
                        <h3 className="font-extrabold text-slate-805 text-sm sm:text-base leading-none capitalize mt-1.5">
                          Save {valueFormatted} On Your Cart
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold py-1">
                        <span className="text-slate-400">Minimum Order Value</span>
                        <span className="text-slate-705 font-bold">
                          {offer.min_order_value ? `₹${parseFloat(offer.min_order_value).toLocaleString('en-IN')}` : 'No Minimum'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold py-1 border-t border-slate-50">
                        <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Expiry Date</span>
                        <span className="text-slate-705 font-bold">{expiryDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Copy Coupon Action footer */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-2.5 mt-6 relative z-10">
                    <div className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2 font-mono font-black text-sm text-center text-slate-800 tracking-wider">
                      {offer.code}
                    </div>
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      className={`flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        copiedCode === offer.code
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                          : 'bg-primary-pink text-white hover:bg-[#c23255] shadow-sm shadow-rose-600/10'
                      }`}
                    >
                      {copiedCode === offer.code ? (
                        <><Check className="w-3.5 h-3.5" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 py-10 text-center">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          © 2026 CreativeArt by Tannu. Handcrafted resin decorations & flower preservation.
        </p>
      </footer>
    </div>
  );
}
