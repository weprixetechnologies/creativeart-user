'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import { Loader, AlertTriangle, ArrowRight, Grid, Sparkles } from 'lucide-react';

const CATEGORY_IMAGES = {
  1: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop', // Personalised Gifts
  2: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=400&auto=format&fit=crop', // Birthday Gifts
  3: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=400&auto=format&fit=crop', // Anniversary Gifts
  4: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400&auto=format&fit=crop', // Flowers
  5: 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?q=80&w=400&auto=format&fit=crop', // Chocolates
  6: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop', // Home Decor
  7: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop', // Gift Hampers
  8: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=400&auto=format&fit=crop', // Combo Offers
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get('/categories');
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1e293b] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Title Block */}
        <div className="text-center max-w-xl mx-auto space-y-3.5 mb-12">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#fff0f3] text-[#e04169] border border-rose-150 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Collection Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-playfair font-black text-slate-850">
            Browse by <span className="text-primary-pink font-playfair italic">Category</span>
          </h1>
          <p className="text-slate-450 text-xs sm:text-sm font-semibold max-w-md mx-auto leading-relaxed">
            Find the perfect handcrafted creations, bespoke preservations, and customizable gifts for your moments.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Loader className="w-9 h-9 animate-spin text-primary-pink" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading collections...</p>
          </div>
        ) : error ? (
          <div className="bg-[#fff0f3] border border-rose-100 rounded-3xl p-6 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-primary-pink mx-auto" />
            <p className="text-xs font-bold text-slate-700 leading-normal">{error}</p>
            <button
              onClick={fetchCategories}
              className="px-5 py-2.5 bg-primary-pink hover:bg-[#c23255] text-white rounded-full text-xs font-bold shadow-sm transition-all"
            >
              Try Again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Grid className="w-12 h-12 mx-auto text-rose-200" />
            <p className="text-xs font-bold uppercase tracking-wider">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {categories.map((cat) => {
              const catImg = cat.photo_url || CATEGORY_IMAGES[cat.id] || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop';
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className="group bg-white border border-slate-100 hover:border-rose-200 rounded-[32px] p-4.5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Category Image */}
                    <div className="w-full aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={catImg}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {/* Category details */}
                    <div className="px-1.5 space-y-1">
                      <h3 className="text-base font-extrabold text-slate-800 tracking-wide group-hover:text-primary-pink transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Explore Collection
                      </p>
                    </div>
                  </div>

                  {/* Arrow Action */}
                  <div className="flex justify-end pt-4 border-t border-slate-50 mt-5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary-pink group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      
    </div>
  );
}
