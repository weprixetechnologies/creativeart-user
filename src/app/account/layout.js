'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import { User, LogOut, Package, MapPin, Heart, ShieldAlert, Menu, X, Globe } from 'lucide-react';

export default function AccountLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!storedUser || !token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-4 border-t-[#e04169] border-[#fff0f3] animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verifying session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'My Profile', href: '/account', icon: User },
    { name: 'Order History', href: '/account/orders', icon: Package },
    { name: 'Address Book', href: '/account/addresses', icon: MapPin },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Affiliate Program', href: '/account/affiliate', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1e293b] flex flex-col font-sans">
      <Header />

      {/* Mobile Submenu Trigger Bar */}
      <div className="md:hidden bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between sticky top-[65px] z-30 shadow-sm">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
          {navItems.find(item => item.href === pathname)?.name || 'Account'}
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff0f3] text-[#e04169] rounded-xl text-xs font-bold"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />} Menu
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-rose-100 p-4 space-y-2.5 z-40 relative shadow-sm animate-in fade-in duration-200">
          <div className="bg-[#fff0f3] p-4 rounded-2xl border border-[#fecdd3] mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e04169] text-white flex items-center justify-center font-bold text-lg uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{user.email || user.phone}</p>
            </div>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#e04169] text-white shadow-md'
                    : 'text-slate-500 hover:bg-[#fff0f3] hover:text-[#e04169]'
                }`}
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                {item.name}
              </Link>
            );
          })}
          <div className="border-t border-rose-100 pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-slate-450 hover:text-[#e04169] hover:bg-[#fff0f3] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3 shrink-0" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-3 lg:px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sticky top-24 space-y-6 shadow-sm">
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-rose-100">
              <div className="w-20 h-20 rounded-full bg-[#fff0f3] text-[#e04169] border border-[#fecdd3] flex items-center justify-center font-playfair font-black text-3xl uppercase shadow-inner">
                {user.name.charAt(0)}
              </div>
              <h3 className="mt-4 text-sm font-extrabold text-slate-800 tracking-wide">{user.name}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user.email || 'Mobile User'}</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold bg-[#fef3c7] text-[#d97706] border border-[#fde68a] uppercase tracking-wider mt-2.5 shadow-sm">
                👑 Creative Gold
              </span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                🗓️ Member Since July 2026
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-3">Manage Account</p>
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] ${
                        isActive
                          ? 'bg-[#e04169] text-white shadow-md shadow-rose-600/10'
                          : 'text-slate-500 hover:bg-[#fff0f3] hover:text-[#e04169]'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-rose-100 pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-3 text-slate-455 hover:text-[#e04169] hover:bg-[#fff0f3] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-3 shrink-0" /> Sign Out
              </button>
            </div>

            {user.role !== 'CUSTOMER' && (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-purple-650 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-widest font-sans">Staff Portal</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                      Administrative account enabled. Access staff portals to fulfill tasks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Need Help Card */}
            <div className="bg-[#fff0f3]/70 border border-[#fecdd3] p-4.5 rounded-2xl text-center space-y-2.5">
              <div className="w-9 h-9 rounded-full bg-[#e04169] text-white flex items-center justify-center mx-auto text-xs">
                📞
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest">Need Help?</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">We're here for you</p>
              </div>
              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                className="block w-full py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-[9px] font-bold text-[#e04169] uppercase tracking-wider transition-all"
              >
                Chat with Us
              </a>
            </div>

          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white border border-rose-100/70 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[500px]">
          {children}
        </main>

      </div>
    </div>
  );
}
