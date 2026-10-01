import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-rose-100 py-10 px-6 sm:px-12 text-center space-y-4 mt-auto">
      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs font-bold text-slate-500 font-sans uppercase tracking-wider">
        <Link href="/shop" className="hover:text-primary-pink transition-colors">Shop</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/about" className="hover:text-primary-pink transition-colors">Our Craft</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/help" className="hover:text-primary-pink transition-colors">FAQ & Support</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/terms-and-conditions" className="hover:text-primary-pink transition-colors">Terms of Service</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/refund-policy" className="hover:text-primary-pink transition-colors">Refund Policy</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/privacy-policy" className="hover:text-primary-pink transition-colors">Privacy Policy</Link>
        <span className="hidden sm:inline">•</span>
        <Link href="/shipping-policy" className="hover:text-primary-pink transition-colors">Shipping Policy</Link>
      </div>
      <p className="text-[11px] text-slate-400">
        © {new Date().getFullYear()} The Creative Arts. Preservations, resin designs and custom handcrafted gifts. All rights reserved.
      </p>
    </footer>
  );
}
