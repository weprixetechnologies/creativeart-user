'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import { Heart, Loader, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get('/wishlist');
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await apiClient.post('/wishlist', { productId });
      setItems(items.filter(item => item.id !== productId));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      alert(err.message || 'Failed to update wishlist.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader className="w-8 h-8 animate-spin text-[#e04169] mb-3" />
        <p className="text-xs">Loading your wishlist items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#fff0f3] border border-rose-100 rounded-2xl p-4 text-[#e04169] text-xs">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-rose-100 pb-3">
        <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800 flex items-center gap-2.5">
          <Heart className="w-5.5 h-5.5 text-[#e04169]" /> Saved Wishlist
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-semibold">Gifts and preservations you saved for later purchase</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center animate-pulse">
            <Heart className="w-6 h-6 text-rose-200" />
          </div>
          <p className="text-slate-800 font-extrabold text-sm mt-3">Your wishlist is empty</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Explore our catalog and save items you like!</p>
          <Link
            href="/shop"
            className="mt-6 flex items-center gap-1.5 px-6 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full text-xs font-bold transition-all shadow-sm hover:scale-[1.01]"
          >
            Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white border border-slate-100 rounded-3xl p-4 flex flex-col justify-between hover:border-rose-100 hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-3.5">
                <div className="w-full aspect-square bg-[#fafbfc] rounded-2xl overflow-hidden border border-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.mainImage || (item.images?.[0]?.url) || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=300&auto=format&fit=crop'}
                    alt={item.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-[#e04169] transition-colors">{item.name}</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed font-semibold">
                  {item.description}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-slate-850 text-xs sm:text-sm">
                    ₹{(item.price || item.base_price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-slate-50">
                <Link
                  href={`/products/${item.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Options
                </Link>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2.5 text-slate-400 hover:text-[#e04169] hover:bg-[#fff0f3] border border-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
