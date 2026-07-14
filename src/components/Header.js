'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '../lib/api-client';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Heart,
  ChevronDown,
  LogOut,
  Sparkles,
  Gift,
  HelpCircle,
  MapPin,
  Menu,
  X
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch categories for navbar dropdown
    apiClient.get('/categories')
      .then(setCategories)
      .catch(err => console.error('Failed to load nav categories:', err));

    // Get active user session
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkSession();

    // Sync counts
    updateCartCount();
    updateWishlistCount();

    // Event listeners for updates across actions
    const handleStorageEvent = () => {
      updateCartCount();
      updateWishlistCount();
      checkSession();
    };
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('cart-updated', updateCartCount);
    window.addEventListener('wishlist-updated', updateWishlistCount);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('wishlist-updated', updateWishlistCount);
    };
  }, []);

  const updateCartCount = () => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const items = JSON.parse(cart);
        const count = items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  const updateWishlistCount = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setWishlistCount(0);
      return;
    }
    try {
      const wl = await apiClient.get('/wishlist');
      setWishlistCount(wl.length);
    } catch (e) {
      setWishlistCount(0);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      router.push('/login');
    }
  };

  const occasions = [
    { name: 'Birthday', href: '/shop?occasion=Birthday' },
    { name: 'Anniversary', href: '/shop?occasion=Anniversary' },
    { name: 'Valentine\'s Day', href: '/shop?occasion=Valentine\'s Day' },
    { name: 'Diwali', href: '/shop?occasion=Diwali' },
    { name: 'Wedding', href: '/shop?occasion=Wedding' },
    { name: 'New Year', href: '/shop?occasion=New Year' }
  ];

  return (
    <div className="w-full bg-white z-50 sticky top-0 shadow-sm border-b border-rose-100">
      {/* 1. Pink Top Shipping Alert Bar */}
      <div className="bg-primary-pink text-white py-2 px-6 sm:px-12 text-[11px] sm:text-xs font-medium tracking-wide flex justify-between items-center transition-colors">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" /> FREE SHIPPING on orders above ₹999
          </span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">COD Available</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] sm:text-xs">
          <Link href="/account/orders" className="hover:underline flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Track Order
          </Link>
          <span>|</span>
          <Link href="/help" className="hover:underline flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Help
          </Link>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none group shrink-0">
          <div className="relative flex flex-col items-start leading-none pt-0.5">
            <span className="font-playfair font-bold text-lg sm:text-2xl tracking-wider text-slate-800 flex items-center gap-1 group-hover:text-primary-pink transition-colors">
              CREATIVE ART
              {/* Pink Flower SVG */}
              <svg className="w-4 h-4 sm:w-5 h-5 text-primary-pink fill-current" viewBox="0 0 24 24">
                <path d="M12 2C11.5 5 9.5 7 6.5 7.5 7 9.5 9 11.5 12 12 12 12.5 12 14.5 12 22 12.5 14.5 14.5 12.5 17.5 12 17 10 15 8 12 7.5 12.5 5 12.5 2 12 2Z"/>
                <circle cx="12" cy="9.5" r="2.5" className="text-white fill-current"/>
              </svg>
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 font-sans tracking-widest pl-1">
              by Tannu
            </span>
          </div>
        </Link>

        {/* Navigation links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-600 font-sans uppercase tracking-wider">
          <Link 
            href="/" 
            className={`transition-colors hover:text-primary-pink ${pathname === '/' ? 'text-primary-pink border-b-2 border-primary-pink pb-1' : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/shop" 
            className={`transition-colors hover:text-primary-pink ${pathname === '/shop' ? 'text-primary-pink border-b-2 border-primary-pink pb-1' : ''}`}
          >
            Shop
          </Link>
          <Link 
            href="/categories" 
            className={`transition-colors hover:text-primary-pink ${pathname === '/categories' ? 'text-primary-pink border-b-2 border-primary-pink pb-1' : ''}`}
          >
            Categories
          </Link>
          <Link 
            href="/shop?category=personalised" 
            className={`transition-colors hover:text-primary-pink ${pathname.includes('category=personalised') ? 'text-primary-pink border-b-2 border-primary-pink pb-1' : ''}`}
          >
            Customised
          </Link>
          <Link 
            href="/offers" 
            className={`transition-colors hover:text-primary-pink text-rose-500 font-extrabold flex items-center gap-1 ${pathname === '/offers' ? 'border-b-2 border-primary-pink pb-1' : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-pink animate-spin" /> Offers
          </Link>
        </nav>

        {/* Header Action Items */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Search Trigger */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1 bg-slate-50 border border-rose-100 rounded-full px-2.5 py-1.5 w-44 sm:w-60 absolute right-0 -top-4 shadow-sm animate-in slide-in-from-right-3 duration-200 z-50">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-600 hover:text-primary-pink transition-colors rounded-full hover:bg-slate-50 cursor-pointer"
                title="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            )}
          </div>


          {/* Wishlist */}
          <Link 
            href="/account/wishlist" 
            className="p-2 text-slate-600 hover:text-primary-pink transition-colors rounded-full hover:bg-slate-50 relative"
            title="Wishlist"
          >
            <Heart className="w-4.5 h-4.5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-pink text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link 
            href="/cart" 
            className="p-2 text-slate-600 hover:text-primary-pink transition-colors rounded-full hover:bg-slate-50 relative shrink-0"
            title="Cart"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-pink text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account Option (Desktop) */}
          <div className="hidden md:flex flex-col items-start justify-center ml-2 border-l border-slate-100 pl-4">
            {user ? (
              <Link href="/account" className="flex flex-col hover:opacity-80 transition-opacity text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Hi, {user.name.split(' ')[0]}</span>
                <span className="text-xs font-bold text-slate-800 leading-tight">Visit Account</span>
              </Link>
            ) : (
              <button onClick={() => window.dispatchEvent(new Event('show-login-modal'))} className="flex flex-col hover:opacity-80 transition-opacity text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Welcome</span>
                <span className="text-xs font-bold text-slate-800 leading-tight">Sign In / Register</span>
              </button>
            )}
          </div>
          {/* Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-primary-pink focus:outline-none hover:bg-slate-50 rounded-full"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Navigation Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-rose-100 bg-white p-4 space-y-3 flex flex-col font-sans uppercase font-bold text-xs tracking-wider z-50 animate-in slide-in-from-top-3 duration-200">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname === '/' ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
          >
            Home
          </Link>
          <Link 
            href="/shop" 
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname === '/shop' ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
          >
            Shop
          </Link>
          <Link 
            href="/categories" 
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname === '/categories' ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
          >
            Categories
          </Link>
          <Link 
            href="/shop?category=personalised" 
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname.includes('category=personalised') ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
          >
            Customised
          </Link>
          <Link 
            href="/offers" 
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink text-rose-500 rounded-xl transition-all flex items-center gap-1.5 ${pathname === '/offers' ? 'bg-primary-pink-light text-rose-600' : ''}`}
          >
            Offers
          </Link>
          <div className="my-2 border-t border-rose-100"></div>
          {user ? (
            <>
              <Link 
                href="/account" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname === '/account' ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
              >
                My Account
              </Link>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="text-left px-4 py-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all text-slate-700"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 hover:bg-primary-pink-light hover:text-primary-pink rounded-xl transition-all ${pathname === '/login' ? 'bg-primary-pink-light text-primary-pink' : 'text-slate-700'}`}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
