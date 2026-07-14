'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import Header from '../../../components/Header';
import { 
  Loader, 
  AlertTriangle, 
  ShoppingBag, 
  Layers,
  ArrowUpDown
} from 'lucide-react';

export default function CategoryListingPage() {
  const { slug } = useParams();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter and Sort states
  const [itemType, setItemType] = useState(''); // 'PRODUCT', 'PROJECT' or ''
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high'
  const [priceRange, setPriceRange] = useState(''); // '', '0-500', '500-2000', '2000+'

  useEffect(() => {
    fetchCategoryAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, itemType, sortBy, priceRange]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories to find the match by slug
      const catsTree = await apiClient.get('/categories');
      const flat = [];
      const flatten = (items) => {
        items.forEach(i => {
          flat.push(i);
          if (i.children) flatten(i.children);
        });
      };
      flatten(catsTree);
      
      const matchedCat = flat.find(c => c.slug === slug);
      if (!matchedCat) {
        setError('Category not found.');
        setLoading(false);
        return;
      }
      setCategory(matchedCat);

      // 2. Fetch products for this category (forces ACTIVE status)
      const params = new URLSearchParams();
      params.append('categoryId', matchedCat.id);
      params.append('status', 'ACTIVE');
      if (itemType) params.append('itemType', itemType);

      let list = await apiClient.get(`/products?${params.toString()}`);
      list = list.data || list;

      // Clientside Filter: Price Range
      if (priceRange) {
        list = list.filter(item => {
          const price = item.item_type === 'PROJECT' ? Number(item.advance_amount) : Number(item.base_price);
          if (priceRange === '0-500') return price <= 500;
          if (priceRange === '500-2000') return price > 500 && price <= 2000;
          if (priceRange === '2000+') return price > 2000;
          return true;
        });
      }

      // Clientside Sort
      if (sortBy === 'newest') {
        list.sort((a, b) => b.id - a.id);
      } else if (sortBy === 'price-low') {
        list.sort((a, b) => {
          const priceA = a.item_type === 'PROJECT' ? Number(a.advance_amount) : Number(a.base_price);
          const priceB = b.item_type === 'PROJECT' ? Number(b.advance_amount) : Number(b.base_price);
          return priceA - priceB;
        });
      } else if (sortBy === 'price-high') {
        list.sort((a, b) => {
          const priceA = a.item_type === 'PROJECT' ? Number(a.advance_amount) : Number(a.base_price);
          const priceB = b.item_type === 'PROJECT' ? Number(b.advance_amount) : Number(b.base_price);
          return priceB - priceA;
        });
      }

      setProducts(list);

    } catch (err) {
      setError(err.message || 'Failed to retrieve catalog listings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-12 w-full space-y-8">
        
        {/* Banner header */}
        {category && (
          <div>
            <div className="flex items-center space-x-2 text-zinc-500 text-xs font-semibold">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-zinc-400">Collections</span>
              <span>/</span>
              <span className="text-purple-400">{category.name}</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2 flex items-center">
              <Layers className="w-6 h-6 mr-2.5 text-purple-500/80" /> {category.name}
            </h1>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-450 text-xs flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" /> {error}
          </div>
        )}

        {/* Sidebar filters + catalog listing container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left panel filters */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-3xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-zinc-800 pb-3">Filters</h3>
              
              {/* Item Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Category Mode</label>
                <div className="flex flex-col space-y-1.5">
                  {[
                    { val: '', label: 'All Items' },
                    { val: 'PRODUCT', label: 'Standard Products' },
                    { val: 'PROJECT', label: 'Custom Projects' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setItemType(opt.val)}
                      className={`text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer
                        ${itemType === opt.val 
                          ? 'bg-purple-600/10 text-purple-400 border border-purple-900/10 font-bold' 
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Ranges */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Price Bracket</label>
                <div className="flex flex-col space-y-1.5">
                  {[
                    { val: '', label: 'Any Price' },
                    { val: '0-500', label: 'Under ₹500' },
                    { val: '500-2000', label: '₹500 - ₹2,000' },
                    { val: '2000+', label: 'Over ₹2,000' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setPriceRange(opt.val)}
                      className={`text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer
                        ${priceRange === opt.val 
                          ? 'bg-purple-600/10 text-purple-400 border border-purple-900/10 font-bold' 
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Sort Results</label>
                <div className="relative">
                  <ArrowUpDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-white appearance-none focus:outline-none"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel products listing grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <Loader className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-zinc-900 rounded-3xl text-zinc-600 bg-zinc-900/10">
                <p className="text-sm font-semibold text-zinc-400">No matching creations found</p>
                <p className="text-xs text-zinc-500 mt-1">Try clearing some filtering options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {products.map((prod) => {
                  const primaryImage = prod.images?.find(img => img.is_primary === 1)?.url 
                    || prod.images?.[0]?.url 
                    || '/favicon.ico';
                  return (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      className="group bg-zinc-900/20 border border-zinc-850 hover:border-zinc-800 rounded-3xl p-4 flex flex-col justify-between hover:bg-zinc-900/40 transition-all duration-200 relative animate-in zoom-in-95 duration-100"
                    >
                      {/* Image Preview */}
                      <div className="w-full h-48 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-850 relative flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage}
                          alt={prod.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute top-3 left-3 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border
                          ${prod.item_type === 'PRODUCT' 
                            ? 'bg-purple-950/40 border-purple-500/20 text-purple-400' 
                            : 'bg-blue-950/40 border-blue-500/20 text-blue-400'}
                        `}>
                          {prod.item_type}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-4 space-y-1">
                        <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors truncate">{prod.name}</h3>
                        <p className="text-zinc-500 text-xs truncate leading-relaxed">{prod.description}</p>
                      </div>

                      {/* Footer pricing */}
                      <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                            {prod.item_type === 'PROJECT' ? 'Advance Payment' : 'Base Price'}
                          </p>
                          <p className="font-extrabold text-sm text-white mt-0.5 font-mono">
                            ₹{prod.item_type === 'PROJECT' ? prod.advance_amount : prod.base_price}
                          </p>
                        </div>

                        <div className="p-2 bg-zinc-950 group-hover:bg-purple-600 text-zinc-400 group-hover:text-white rounded-xl transition-all border border-zinc-850 group-hover:border-transparent">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
