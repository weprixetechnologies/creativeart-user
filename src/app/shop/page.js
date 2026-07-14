'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import { 
  Heart, 
  Star, 
  ShoppingBag, 
  Loader,
  AlertTriangle,
  ChevronRight,
  Filter,
  Grid,
  List,
  ChevronDown,
  X,
  Check
} from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // API state
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sidebar Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [maxPriceLimit, setMaxPriceLimit] = useState(30000);
  const [priceRange, setPriceRange] = useState(30000);
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isGrid, setIsGrid] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Sync URL search params
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
    const searchParam = searchParams.get('search');
    if (searchParam) setSearchTerm(searchParam);
  }, [searchParams]);

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const cats = await apiClient.get('/categories');
      setCategories(cats);

      // 2. Fetch all products (limit=100 to allow client-side filtering)
      const prodsRes = await apiClient.get('/products?limit=100');
      const productsList = prodsRes.data || prodsRes;
      setAllProducts(productsList);

      if (productsList.length > 0) {
        const prices = productsList.map(p => parseFloat(p.item_type === 'PROJECT' ? p.total_amount : p.base_price) || 0);
        const maxPrice = Math.max(...prices, 5000);
        const roundedMax = Math.ceil(maxPrice / 1000) * 1000;
        setMaxPriceLimit(roundedMax);
        setPriceRange(roundedMax);
      }

      // 3. Fetch wishlist
      const token = localStorage.getItem('accessToken');
      if (token) {
        const wl = await apiClient.get('/wishlist');
        setWishlist(wl.map(w => w.id));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog items.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await apiClient.post('/wishlist', { productId });
      if (res.inWishlist) {
        setWishlist(prev => [...prev, productId]);
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
      }
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      itemType: product.item_type,
      productType: product.product_type,
      price: parseFloat(product.item_type === 'PROJECT' ? product.advance_amount : product.base_price),
      image: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=300&auto=format&fit=crop',
      variantId: null,
      selectedAttrs: null,
      customFieldValues: null,
      quantity: 1
    };

    const cart = localStorage.getItem('cart');
    let items = [];
    if (cart) {
      try {
        items = JSON.parse(cart);
      } catch (err) {
        items = [];
      }
    }

    // No mixing rule
    const hasProject = items.some(i => i.itemType === 'PROJECT');
    const hasProduct = items.some(i => i.itemType === 'PRODUCT');

    if (product.item_type === 'PROJECT' && hasProduct) {
      alert('You cannot mix projects and standard products in one cart. Please checkout separately.');
      return;
    }
    if (product.item_type === 'PRODUCT' && hasProject) {
      alert('You cannot mix projects and standard products in one cart. Please checkout separately.');
      return;
    }

    const existingIdx = items.findIndex(i => i.productId === cartItem.productId);
    if (existingIdx > -1) {
      items[existingIdx].quantity += 1;
    } else {
      items.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(items));
    setSuccessMsg(`${product.name} added to cart!`);
    window.dispatchEvent(new Event('cart-updated'));

    setTimeout(() => {
      setSuccessMsg('');
    }, 2000);
  };

  // Occasions list mapping
  const occasions = [
    'Birthday',
    'Anniversary',
    'Valentine\'s Day',
    'Diwali',
    'Wedding',
    'New Year',
    'Congratulations',
    'Thank You'
  ];

  // Helper reviews data for realistic design
  const dummyRatings = {
    1: { count: 128, avg: 4.9 },
    2: { count: 96, avg: 4.8 },
    3: { count: 73, avg: 4.9 },
    4: { count: 57, avg: 4.7 },
    5: { count: 42, avg: 4.9 },
    6: { count: 88, avg: 4.8 },
    7: { count: 64, avg: 4.7 },
    8: { count: 38, avg: 4.9 },
    9: { count: 51, avg: 4.8 },
    10: { count: 47, avg: 4.9 },
    11: { count: 29, avg: 4.8 },
    12: { count: 63, avg: 4.9 },
    13: { count: 145, avg: 4.9 }
  };

  const handleOccasionChange = (occ) => {
    if (selectedOccasions.includes(occ)) {
      setSelectedOccasions(selectedOccasions.filter(o => o !== occ));
    } else {
      setSelectedOccasions([...selectedOccasions, occ]);
    }
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedCategory('');
    setPriceRange(maxPriceLimit);
    setSelectedOccasions([]);
    setSortBy('popularity');
    setSearchTerm('');
    setCurrentPage(1);
    router.replace('/shop');
  };

  // Filter & Sort Pipeline
  const filteredProducts = allProducts.filter((product) => {
    // 1. Category Filter
    if (selectedCategory && String(product.category_id) !== String(selectedCategory)) {
      // Also check special case if it is tagged as "personalised"
      if (selectedCategory === 'personalised' && product.product_type !== 'CUSTOMISABLE' && product.item_type !== 'PROJECT') {
        return false;
      }
      if (selectedCategory !== 'personalised') {
        return false;
      }
    }

    // 2. Search Term Filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(s);
      const descMatch = product.description.toLowerCase().includes(s);
      if (!nameMatch && !descMatch) return false;
    }

    // 3. Price Filter (check project total or product base price)
    const price = parseFloat(product.item_type === 'PROJECT' ? product.total_amount : product.base_price);
    if (price > priceRange) return false;

    // 4. Occasion Filter (simulate match by looking at description/name tags)
    if (selectedOccasions.length > 0) {
      const match = selectedOccasions.some(occ => {
        const o = occ.toLowerCase();
        return product.name.toLowerCase().includes(o) || product.description.toLowerCase().includes(o);
      });
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort By logic
    const priceA = parseFloat(a.item_type === 'PROJECT' ? a.total_amount : a.base_price);
    const priceB = parseFloat(b.item_type === 'PROJECT' ? b.total_amount : b.base_price);
    
    if (sortBy === 'price-low') {
      return priceA - priceB;
    } else if (sortBy === 'price-high') {
      return priceB - priceA;
    } else if (sortBy === 'newest') {
      return b.id - a.id;
    } else if (sortBy === 'rating') {
      const rateA = dummyRatings[a.id]?.avg || 4.5;
      const rateB = dummyRatings[b.id]?.avg || 4.5;
      return rateB - rateA;
    }
    // Default popularity: ID order or review counts
    const reviewCountA = dummyRatings[a.id]?.count || 0;
    const reviewCountB = dummyRatings[b.id]?.count || 0;
    return reviewCountB - reviewCountA;
  });

  // Paginated slices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getCategoryCount = (catId) => {
    return allProducts.filter(p => String(p.category_id) === String(catId)).length;
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      {/* 1. Shop Banner */}
      <section className="bg-gradient-to-r from-rose-50/70 via-rose-100/30 to-amber-50/20 py-8 px-6 sm:px-12 border-b border-rose-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-slate-800">
              Shop <span className="text-primary-pink font-playfair italic">Gifts</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Beautiful, meaningful & personalised gifts for every celebration.
            </p>
          </div>
          <div className="relative w-40 h-28 hidden md:block rounded-2xl overflow-hidden shadow-sm border-2 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/hero-gift.jpg" 
              alt="Gifts Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Floating success notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-bold mb-6">
          <Link href="/" className="hover:text-primary-pink">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500">Shop</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: Sidebar Filters */}
          <>
            {/* Mobile overlay */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden transition-opacity" onClick={() => setMobileFiltersOpen(false)} />
            )}
            <aside className={`
              fixed inset-x-0 bottom-0 z-[100] h-[85vh] overflow-y-auto bg-white p-5 rounded-t-3xl shadow-2xl transition-transform duration-300
              ${mobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'}
              lg:relative lg:translate-y-0 lg:h-auto lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none lg:rounded-none lg:z-auto
            `}>
            <div className="bg-white lg:border border-slate-100 lg:rounded-3xl lg:p-5 lg:shadow-sm space-y-6">
              
              {/* Header & Clear Filter */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-primary-pink" /> Filters
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] text-primary-pink hover:text-primary-pink-hover font-extrabold tracking-wider uppercase cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setMobileFiltersOpen(false)} 
                    className="lg:hidden p-1.5 text-slate-400 hover:text-rose-500 rounded-full bg-slate-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Categories filter */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Categories</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                    className={`flex items-center justify-between w-full text-left text-xs py-1.5 font-bold transition-colors ${
                      selectedCategory === '' ? 'text-primary-pink' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="text-[10px] text-slate-400 font-medium">({allProducts.length})</span>
                  </button>
                  {categories.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isActive = String(selectedCategory) === String(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                        className={`flex items-center justify-between w-full text-left text-xs py-1.5 font-bold transition-colors capitalize ${
                          isActive ? 'text-primary-pink' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({count})</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setSelectedCategory('personalised'); setCurrentPage(1); }}
                    className={`flex items-center justify-between w-full text-left text-xs py-1.5 font-bold transition-colors ${
                      selectedCategory === 'personalised' ? 'text-primary-pink' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>Personalised Gifts</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({allProducts.filter(p => p.product_type === 'CUSTOMISABLE' || p.item_type === 'PROJECT').length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-3 border-t border-slate-50 pt-5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  <span>Price Range</span>
                  <span className="text-primary-pink">Up to ₹{priceRange}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPriceLimit}
                  step="500"
                  value={priceRange}
                  onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-pink"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>₹0</span>
                  <span>₹{maxPriceLimit.toLocaleString('en-IN')}+</span>
                </div>
              </div>

              {/* Occasion Filter */}
              <div className="space-y-3 border-t border-slate-50 pt-5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Occasion</h4>
                <div className="space-y-2">
                  {occasions.map((occ) => {
                    const isChecked = selectedOccasions.includes(occ);
                    return (
                      <label key={occ} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleOccasionChange(occ)}
                          className="w-3.5 h-3.5 border-slate-300 rounded text-primary-pink focus:ring-primary-pink accent-primary-pink cursor-pointer"
                        />
                        <span>{occ}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sort By Radios */}
              <div className="space-y-3 border-t border-slate-50 pt-5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Sort By</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Popularity', value: 'popularity' },
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Price: Low to High', value: 'price-low' },
                    { label: 'Price: High to Low', value: 'price-high' },
                    { label: 'Customer Rating', value: 'rating' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sort-option"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={() => { setSortBy(option.value); setCurrentPage(1); }}
                        className="w-3.5 h-3.5 border-slate-300 text-primary-pink focus:ring-primary-pink accent-primary-pink cursor-pointer"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            </aside>
          </>

          {/* RIGHT: Product Listings Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm text-xs font-bold text-slate-500">
              <div>
                {filteredProducts.length === 0 ? (
                  <span>No products found</span>
                ) : (
                  <span>
                    Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Mobile Filter Toggle */}
                <button 
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:text-primary-pink cursor-pointer"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                {/* Sort selector dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-none focus:border-rose-200 cursor-pointer"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>

                {/* Layout Toggle */}
                <div className="flex items-center border border-slate-100 rounded-xl overflow-hidden shrink-0">
                  <button 
                    onClick={() => setIsGrid(true)} 
                    className={`p-1.5 cursor-pointer ${isGrid ? 'bg-primary-pink-light text-primary-pink' : 'bg-transparent text-slate-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsGrid(false)} 
                    className={`p-1.5 cursor-pointer ${!isGrid ? 'bg-primary-pink-light text-primary-pink' : 'bg-transparent text-slate-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-primary-pink text-xs flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0" /> {error}
              </div>
            )}

            {/* Product display */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader className="w-8 h-8 animate-spin text-primary-pink mb-3" />
                <p className="text-xs">Loading catalog items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl text-slate-450 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-bold">No Match Found</p>
                <p className="text-xs">Try clearing some filters or searching for another term.</p>
              </div>
            ) : isGrid ? (
              // GRID LAYOUT
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {currentItems.map((prod) => {
                  const primaryImage = prod.images?.[0]?.url 
                    || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop';
                  const isWished = wishlist.includes(prod.id);
                  const isProject = prod.item_type === 'PROJECT';
                  const reviewStats = dummyRatings[prod.id] || { count: 32, avg: 4.8 };
                  const originalPrice = isProject 
                    ? Math.round(parseFloat(prod.total_amount) * 1.45) 
                    : Math.round(parseFloat(prod.base_price) * 1.45);
                  const displayedPrice = isProject 
                    ? prod.advance_amount 
                    : prod.base_price;

                  return (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      className="group bg-white border border-slate-100 hover:border-rose-100 rounded-3xl p-3 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative cursor-pointer"
                    >
                      {/* Image container */}
                      <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage}
                          alt={prod.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleWishlist(prod.id); }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white/95 border border-slate-100 text-slate-400 hover:text-rose-500 shadow-sm"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWished ? 'text-primary-pink fill-primary-pink' : ''}`} />
                        </button>
                        <span className={`absolute top-2 left-2 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border bg-white/95
                          ${isProject ? 'border-indigo-200 text-indigo-500' : 'border-rose-200 text-primary-pink'}
                        `}>
                          {isProject ? 'PROJECT' : 'PRODUCT'}
                        </span>
                      </div>

                      {/* Detail metadata */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-[10px] text-slate-500 font-bold ml-1">{reviewStats.avg}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({reviewStats.count})</span>
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-800 truncate group-hover:text-primary-pink transition-colors">{prod.name}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-450 line-clamp-1 font-medium">{prod.description}</p>
                      </div>

                      {/* Pricing block */}
                      <div className="mt-4 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-1">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-800">₹{displayedPrice}</span>
                            <span className="text-[9px] text-slate-400 line-through">₹{originalPrice}</span>
                          </div>
                          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
                            {isProject ? 'Advance Deposit' : 'Base Price'}
                          </span>
                        </div>

                        {isProject ? (
                          <div className="p-1.5 sm:px-2.5 sm:py-1 bg-primary-pink-light border border-rose-200 text-primary-pink rounded-xl text-[9px] font-bold tracking-wider hover:bg-primary-pink hover:text-white transition-all uppercase">
                            Book
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(prod, e)}
                            className="p-1.5 bg-primary-pink-light hover:bg-primary-pink text-primary-pink hover:text-white rounded-lg border border-rose-100 transition-all"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // LIST LAYOUT
              <div className="space-y-4">
                {currentItems.map((prod) => {
                  const primaryImage = prod.images?.[0]?.url 
                    || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop';
                  const isWished = wishlist.includes(prod.id);
                  const isProject = prod.item_type === 'PROJECT';
                  const reviewStats = dummyRatings[prod.id] || { count: 32, avg: 4.8 };
                  const originalPrice = isProject 
                    ? Math.round(parseFloat(prod.total_amount) * 1.45) 
                    : Math.round(parseFloat(prod.base_price) * 1.45);
                  const displayedPrice = isProject 
                    ? prod.advance_amount 
                    : prod.base_price;

                  return (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      className="group bg-white border border-slate-100 hover:border-rose-100 rounded-3xl p-4 flex gap-4 hover:shadow-md transition-all duration-200 relative cursor-pointer"
                    >
                      {/* Image container */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage}
                          alt={prod.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute top-2 left-2 text-[7px] px-1 py-0.5 rounded font-bold uppercase tracking-wider border bg-white/95
                          ${isProject ? 'border-indigo-200 text-indigo-500' : 'border-rose-200 text-primary-pink'}
                        `}>
                          {isProject ? 'PROJECT' : 'PRODUCT'}
                        </span>
                      </div>

                      {/* Detail metadata */}
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-xs sm:text-base text-slate-800 group-hover:text-primary-pink transition-colors truncate">{prod.name}</h3>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleWishlist(prod.id); }}
                              className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 shrink-0"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isWished ? 'text-primary-pink fill-primary-pink' : ''}`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="text-[10px] text-slate-500 font-bold ml-1">{reviewStats.avg}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({reviewStats.count} reviews)</span>
                          </div>
                          
                          <p className="text-[11px] sm:text-xs text-slate-450 line-clamp-2 leading-relaxed font-medium">{prod.description}</p>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="flex justify-between items-end gap-4 mt-2">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-xs sm:text-base text-slate-800">₹{displayedPrice}</span>
                              <span className="text-[9px] sm:text-xs text-slate-400 line-through">₹{originalPrice}</span>
                            </div>
                            <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              {isProject ? 'Advance Deposit' : 'Base Price'}
                            </span>
                          </div>

                          {isProject ? (
                            <div className="px-3.5 py-2 bg-primary-pink-light border border-rose-200 text-primary-pink rounded-xl text-[10px] font-bold tracking-wider hover:bg-primary-pink hover:text-white transition-all uppercase flex items-center">
                              Book Project
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(prod, e)}
                              className="px-3.5 py-2 bg-primary-pink-light hover:bg-primary-pink text-primary-pink hover:text-white rounded-xl border border-rose-100 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6 font-bold text-xs uppercase text-slate-500">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-100 hover:border-rose-100 hover:text-primary-pink transition-colors disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-100 cursor-pointer"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-9 h-9 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pNum
                          ? 'bg-primary-pink border-primary-pink text-white shadow-md shadow-rose-600/10'
                          : 'bg-white border-slate-100 hover:border-rose-100 hover:text-primary-pink'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-100 hover:border-rose-100 hover:text-primary-pink transition-colors disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-100 cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 py-10 px-6 sm:px-12 text-center space-y-4 mt-12">
        <p className="text-[11px] text-slate-400">
          © 2026 CreativeArt by Tannu. Preservations, resin designs and custom handcrafted gifts. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <Loader className="w-10 h-10 animate-spin text-primary-pink" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
