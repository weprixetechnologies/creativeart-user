'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../lib/api-client';
import Header from '../components/Header';
import { 
  Sparkles, 
  ArrowRight, 
  ShoppingBag,
  Loader,
  AlertTriangle,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  PhoneCall,
  Check,
  Quote
} from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [banners, setBanners] = useState([]);
  const [imagerizedSections, setImagerizedSections] = useState([]);
  const [googleReviews, setGoogleReviews] = useState({ rating: 0, total: 0, reviews: [] });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  // Static images mapping for categories to match homepage.png circles
  const categoryImages = {
    'personalised-gifts': 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?q=80&w=200&auto=format&fit=crop',
    'birthday-gifts': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=200&auto=format&fit=crop',
    'anniversary-gifts': 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=200&auto=format&fit=crop',
    'flowers': 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=200&auto=format&fit=crop',
    'chocolates': 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?q=80&w=200&auto=format&fit=crop',
    'home-decor': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=200&auto=format&fit=crop',
    'gift-hampers': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop',
    'combo-offers': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=200&auto=format&fit=crop'
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  useEffect(() => {
    if (googleReviews.reviews && googleReviews.reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReviewIndex(prev => (prev + 1) % googleReviews.reviews.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [googleReviews.reviews]);

  const fetchHomeData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const cats = await apiClient.get('/categories');
      setCategories(cats);

      // Fetch banners
      try {
        const activeBanners = await apiClient.get('/banners');
        setBanners(activeBanners.data || activeBanners);
      } catch (err) {
        console.error('Failed to load banners', err);
      }

      // Fetch imagerized sections
      try {
        const sectionsRes = await apiClient.get('/imagerized-sections');
        setImagerizedSections(sectionsRes.data || sectionsRes);
      } catch (err) {
        console.error('Failed to load imagerized sections', err);
      }

      // Fetch google reviews
      try {
        const reviewData = await apiClient.get('/reviews/google');
        setGoogleReviews({
          rating: reviewData.data?.rating || 0,
          total: reviewData.data?.user_ratings_total || 0,
          reviews: reviewData.data?.reviews || []
        });
      } catch (err) {
        console.error('Failed to load google reviews', err);
      }

      // 2. Fetch active products
      const prodsRes = await apiClient.get('/products?limit=8');
      setProducts(prodsRes.data || prodsRes);

      // 3. Fetch wishlist
      const token = localStorage.getItem('accessToken');
      if (token) {
        const wl = await apiClient.get('/wishlist');
        setWishlist(wl.map(w => w.id));
      }
    } catch (err) {
      setError(err.message || 'Failed to load homepage assets.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
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

    // Standard add to cart logic (for simple items from home page)
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

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmailSubscribed(true);
    setTimeout(() => setEmailSubscribed(false), 4000);
  };

  const occasionsList = [
    { name: 'Birthday', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=400&auto=format&fit=crop', href: '/shop?occasion=Birthday' },
    { name: 'Anniversary', image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop', href: '/shop?occasion=Anniversary' },
    { name: 'Valentine\'s Day', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop', href: '/shop?occasion=Valentine\'s Day' },
    { name: 'Diwali', image: 'https://images.unsplash.com/photo-1605884976458-450f38b09333?q=80&w=400&auto=format&fit=crop', href: '/shop?occasion=Diwali' },
    { name: 'New Year', image: 'https://images.unsplash.com/photo-1546738222-79f6920f04c6?q=80&w=400&auto=format&fit=crop', href: '/shop?occasion=New Year' }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      {/* Hero Showcase Section */}
      {banners.length > 0 && (
        <section className="relative w-full overflow-hidden group bg-slate-100 px-[30px] pt-[10px]">
          <div className="relative w-full rounded-2xl overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`transition-opacity duration-1000 w-full ${index === currentBannerIndex ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'}`}
              >
                {banner.link_url ? (
                  <Link href={banner.link_url} className="w-full block">
                    <img src={banner.image_url} alt="Banner" className="w-full h-auto block" />
                  </Link>
                ) : (
                  <img src={banner.image_url} alt="Banner" className="w-full h-auto block" />
                )}
              </div>
            ))}
          </div>
          {/* Controls */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentBannerIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Floating success notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 w-full">

        {/* 1. Shop by Category Circles Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-rose-100 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800">
                Shop by <span className="text-primary-pink font-playfair italic">Category</span>
              </h2>
            </div>
            <Link 
              href="/shop" 
              className="text-xs text-primary-pink hover:text-primary-pink-hover font-bold flex items-center transition-colors"
            >
              View All Categories <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-6 h-6 animate-spin text-primary-pink" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories found in database.</p>
          ) : (
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-transparent">
              {categories.map((cat) => {
                const coverImage = cat.photo_url || categoryImages[cat.slug] || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=200&auto=format&fit=crop';
                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.id}`}
                    className="group flex flex-col items-center text-center shrink-0 w-24 sm:w-28 snap-start cursor-pointer"
                  >
                    {/* Circle Image Wrapper */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-rose-100 p-0.5 bg-white group-hover:border-primary-pink group-hover:scale-105 transition-all duration-300 shadow-sm relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={cat.name}
                        className="object-cover w-full h-full rounded-full"
                      />
                    </div>
                    {/* Title */}
                    <h3 className="mt-3 text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-primary-pink transition-colors leading-tight line-clamp-2 max-w-[90px] uppercase tracking-wider">
                      {cat.name.replace(' Gifts', '')}
                    </h3>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Dynamic Imagerized Sections */}
        {imagerizedSections.map((section) => {
          let parsedImages = [];
          try {
             parsedImages = typeof section.images === 'string' ? JSON.parse(section.images) : section.images;
          } catch(e) {}
          
          let gridCols = 'grid-cols-1';
          if (section.layout === 'layout_2') gridCols = 'grid-cols-1 md:grid-cols-2';
          if (section.layout === 'layout_3') gridCols = 'grid-cols-1 sm:grid-cols-3';
          if (section.layout === 'layout_4') gridCols = 'grid-cols-2 md:grid-cols-4';

          return (
            <section key={section.id} className="space-y-6">
              {section.title && (
                <div className="flex justify-between items-end border-b border-rose-100 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800">
                      {section.title}
                    </h2>
                  </div>
                </div>
              )}
              <div className={`grid ${gridCols} gap-4 sm:gap-6`}>
                {parsedImages.map((img, i) => (
                  <div key={i} className="w-full h-auto rounded-2xl overflow-hidden shadow-sm group border border-slate-100 aspect-[4/3] sm:aspect-auto">
                    {img.linkUrl ? (
                      <Link href={img.linkUrl} className="w-full h-full block">
                        <img src={img.imageUrl} alt={`${section.title || 'Section'} image ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                    ) : (
                      <img src={img.imageUrl} alt={`${section.title || 'Section'} image ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* 2. Best Sellers Grid Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-rose-100 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800">
                Best <span className="text-primary-pink font-playfair italic">Sellers</span>
              </h2>
            </div>
            <Link 
              href="/shop" 
              className="text-xs text-primary-pink hover:text-primary-pink-hover font-bold flex items-center transition-colors"
            >
              View All Best Sellers <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-primary-pink text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="w-8 h-8 animate-spin text-primary-pink" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 border border-slate-100 bg-white rounded-3xl text-slate-450">
              <p className="text-xs">No products currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((prod) => {
                const primaryImage = prod.images?.[0]?.url 
                  || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop';
                const isWished = wishlist.includes(prod.id);
                const isProject = prod.item_type === 'PROJECT';
                
                // Static ratings for realistic display
                const dummyReviews = [
                  { count: 128, avg: 4.9 },
                  { count: 96, avg: 4.8 },
                  { count: 73, avg: 4.9 },
                  { count: 57, avg: 4.7 },
                  { count: 42, avg: 4.9 },
                  { count: 88, avg: 4.8 },
                  { count: 64, avg: 4.7 },
                  { count: 38, avg: 4.9 }
                ];
                const reviewStats = dummyReviews[prod.id % dummyReviews.length] || { count: 45, avg: 4.8 };
                
                const originalPrice = isProject 
                  ? Math.round(parseFloat(prod.total_amount) * 1.45) 
                  : Math.round(parseFloat(prod.base_price) * 1.45);
                  
                const displayedPrice = isProject 
                  ? prod.advance_amount 
                  : prod.base_price;

                let totalStock = 0;
                if (!isProject && prod.variants && prod.variants.length > 0) {
                  totalStock = prod.variants.reduce((sum, v) => sum + (parseInt(v.stock_qty) || 0), 0);
                }
                const isOutOfStock = !isProject && totalStock <= 0;

                return (
                  <Link
                    key={prod.id}
                    href={`/products/${prod.slug}`}
                    className={`group bg-white border border-slate-100 hover:border-rose-100 rounded-3xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative ${isOutOfStock ? '' : 'cursor-pointer'}`}
                    onClick={(e) => {
                      if (isOutOfStock) e.preventDefault();
                    }}
                  >
                    {/* Image Preview Container */}
                    <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryImage}
                        alt={prod.name}
                        className={`object-cover w-full h-full transition-transform duration-300 ${isOutOfStock ? 'grayscale opacity-70' : 'group-hover:scale-105'}`}
                        loading="lazy"
                      />
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      {/* Wishlist Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(prod.id, e)}
                        className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-sm hover:scale-110 transition-transform bg-white/90 border border-slate-100 text-slate-400 hover:text-rose-500 z-20`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWished ? 'text-primary-pink fill-primary-pink' : ''}`} />
                      </button>

                      {/* Tag badges */}
                      <span className={`absolute top-2.5 left-2.5 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border bg-white/95
                        ${isProject 
                          ? 'border-indigo-200 text-indigo-500' 
                          : 'border-rose-200 text-primary-pink'}
                      `}>
                        {isProject ? 'PROJECT' : 'PRODUCT'}
                      </span>
                    </div>

                    {/* Meta details */}
                    <div className="mt-3.5 space-y-1">
                      {/* Rating block */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-[10px] text-slate-500 font-bold ml-1">{reviewStats.avg}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({reviewStats.count})</span>
                      </div>
                      
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-primary-pink transition-colors truncate">{prod.name}</h3>
                      <p className="text-slate-450 text-[10px] sm:text-xs line-clamp-1 leading-relaxed font-medium">{prod.description}</p>
                    </div>

                    {/* Footer pricing info */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-800">
                            ₹{displayedPrice}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{originalPrice}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
                          {isProject ? 'Advance Deposit' : 'Base Price'}
                        </span>
                      </div>

                      {/* Add To Cart trigger */}
                      {isProject ? (
                        <div className="p-2 sm:px-3 sm:py-1.5 bg-primary-pink-light border border-rose-200 text-primary-pink rounded-xl text-[10px] font-bold tracking-wider hover:bg-primary-pink hover:text-white transition-all uppercase flex items-center justify-center">
                          Book
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(prod, e)}
                          className={`p-2 rounded-xl transition-all border ${isOutOfStock ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary-pink-light hover:bg-primary-pink text-primary-pink hover:text-white border-rose-100'}`}
                          title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Value Props Row */}
        <section className="bg-primary-pink-light/40 border border-primary-pink-border rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-pink border border-rose-100">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800">Free Shipping</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">On orders above ₹999</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-pink border border-rose-100">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800">Secure Payments</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">100% safe & SSL encrypted</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-pink border border-rose-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800">Premium Quality</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">Sourced and made with love</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-pink border border-rose-100">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800">24/7 Support</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">We are here to help you</p>
            </div>
          </div>
        </section>

        {/* 4. Google Testimonials Carousel */}
        {googleReviews.reviews && googleReviews.reviews.length > 0 && (
          <section className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -z-10 translate-y-1/3 -translate-x-1/4" />
            
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800">
                What Our <span className="text-primary-pink font-playfair italic">Customers Say</span>
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <span className="flex text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </span>
                <span>{googleReviews.rating} on Google</span>
                <span>({googleReviews.total} reviews)</span>
              </div>
            </div>

            <div className="relative w-full overflow-hidden" style={{ minHeight: '220px' }}>
              {googleReviews.reviews.map((review, index) => (
                <div
                  key={index}
                  className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out ${index === currentReviewIndex ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-8 z-0'}`}
                >
                  <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 px-4">
                    <Quote className="w-8 h-8 text-rose-200" />
                    <p className="text-sm sm:text-base text-slate-600 italic font-medium leading-relaxed">
                      "{review.text}"
                    </p>
                    <div className="flex flex-col items-center pt-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm mb-2 bg-slate-100">
                        <img 
                          src={review.profile_photo_url} 
                          alt={review.author_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=random`; }}
                        />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">{review.author_name}</h4>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Dots */}
            {googleReviews.reviews.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-6">
                {googleReviews.reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentReviewIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentReviewIndex ? 'bg-primary-pink w-6' : 'bg-rose-200 hover:bg-primary-pink-light'}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. Gifts by Occasion Grid */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-rose-100 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800">
                Gifts for Every <span className="text-primary-pink font-playfair italic">Occasion</span>
              </h2>
            </div>
            <Link 
              href="/shop" 
              className="text-xs text-primary-pink hover:text-primary-pink-hover font-bold flex items-center transition-colors"
            >
              View All Occasions <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {occasionsList.map((occ) => (
              <Link
                key={occ.name}
                href={occ.href}
                className="group relative h-48 rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer flex flex-col justify-end p-4"
              >
                {/* Background Image overlay */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={occ.image}
                  alt={occ.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10" />
                
                {/* Caption text */}
                <div className="relative z-20 space-y-1">
                  <h3 className="font-playfair text-sm sm:text-base font-bold text-white leading-tight">
                    {occ.name}
                  </h3>
                  <span className="inline-block text-[10px] font-bold text-primary-pink uppercase tracking-widest group-hover:underline">
                    Shop Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Newsletter Sign Up banner */}
        <section className="bg-primary-pink-light/35 border border-rose-100 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="font-playfair text-lg sm:text-xl font-bold text-slate-800">Never miss an update!</h3>
            <p className="text-xs text-slate-500 max-w-md leading-normal">Subscribe to get notifications on special offers, new collection arrivals & customized gifting tips.</p>
          </div>
          
          <form onSubmit={handleSubscribe} className="flex max-w-md w-full items-center gap-2">
            {emailSubscribed ? (
              <p className="text-xs font-bold text-emerald-500 py-3 pl-3">✓ Thank you for subscribing! Keep an eye on your inbox.</p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 bg-white border border-rose-200 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full text-xs font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer shrink-0"
                >
                  Subscribe
                </button>
              </>
            )}
          </form>
        </section>

      </main>

      {/* Elegant Footer */}
      <footer className="bg-white border-t border-rose-100 py-10 px-6 sm:px-12 text-center space-y-4">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-xs font-bold text-slate-500 font-sans uppercase tracking-wider">
          <Link href="/shop" className="hover:text-primary-pink transition-colors">Shop</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-primary-pink transition-colors">Our Craft</Link>
          <span>•</span>
          <Link href="/help" className="hover:text-primary-pink transition-colors">FAQ & Support</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-primary-pink transition-colors">Terms of Service</Link>
        </div>
        <p className="text-[11px] text-slate-400">
          © 2026 CreativeArt by Tannu. Preservations, resin designs and custom handcrafted gifts. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
