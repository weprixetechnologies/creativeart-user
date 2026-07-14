'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  ChevronRight,
  ShoppingBag,
  Loader
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Read cart from localStorage on mount (same source as Header + PDP)
  useEffect(() => {
    const raw = localStorage.getItem('cart');
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    }
    setLoaded(true);
  }, []);

  // Persist cart whenever items change
  const persist = (newItems) => {
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQty = (index, delta) => {
    const updated = [...items];
    const newQty = (updated[index].quantity || 1) + delta;
    if (newQty < 1) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], quantity: newQty };
    }
    persist(updated);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    persist(updated);
  };

  const subtotal = items.reduce((acc, item) => acc + parseFloat(item.price || 0) * (item.quantity || 1), 0);
  const isEmpty = items.length === 0;

  // All items should be PRODUCT type in this cart (PROJECT items bypass cart entirely)
  const hasProduct = items.some(i => i.itemType === 'PRODUCT');

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-bold mb-6">
          <Link href="/" className="hover:text-primary-pink">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500">Cart</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-6 h-6 text-primary-pink" />
          <h1 className="text-2xl font-playfair font-bold text-slate-800">Your Cart</h1>
          {!isEmpty && (
            <span className="text-xs text-slate-400 font-bold ml-1">
              ({items.reduce((a, i) => a + (i.quantity || 1), 0)} item{items.reduce((a, i) => a + (i.quantity || 1), 0) !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-32">
            <Loader className="w-8 h-8 animate-spin text-primary-pink" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center py-32 gap-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <p className="text-xl font-playfair font-bold text-slate-800 mb-2">Your cart is empty</p>
              <p className="text-xs text-slate-400 font-semibold">Browse our collection and add something beautiful.</p>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-2 px-7 py-3 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold text-xs shadow-sm transition-all hover:scale-[1.01]"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-3.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 flex gap-4 hover:border-rose-100 transition-all shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-bold text-slate-800 text-xs sm:text-sm hover:text-primary-pink transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Variant attrs */}
                    {item.selectedAttrs && Object.keys(item.selectedAttrs).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.selectedAttrs).map(([k, v]) => (
                          <span key={k} className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-slate-500 font-bold">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Custom field values */}
                    {item.customFieldValues && Object.keys(item.customFieldValues).some(k => item.customFieldValues[k]) && (
                      <div className="space-y-0.5">
                        {Object.entries(item.customFieldValues).map(([k, v]) => v ? (
                          <p key={k} className="text-[9px] text-slate-400 font-bold">
                            <span className="text-slate-300">{k}:</span>{' '}
                            {v.startsWith('http') ? (
                              <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary-pink hover:underline">View file</a>
                            ) : v}
                          </p>
                        ) : null)}
                      </div>
                    )}

                    {/* Qty & price */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(index, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-100 bg-slate-50 hover:border-rose-100 hover:bg-primary-pink-light flex items-center justify-center text-slate-500 transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-5 text-center">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQty(index, +1)}
                          className="w-7 h-7 rounded-lg border border-slate-100 bg-slate-50 hover:border-rose-100 hover:bg-primary-pink-light flex items-center justify-center text-slate-500 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-black text-slate-800 text-xs sm:text-sm">
                        ₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sticky top-24 space-y-5 shadow-sm">
                <h2 className="font-playfair font-bold text-slate-800 text-base">Order Summary</h2>

                <div className="space-y-3 text-xs font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.reduce((a, i) => a + (i.quantity || 1), 0)} items)</span>
                    <span className="text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {subtotal >= 999 ? (
                      <span className="text-emerald-600 font-extrabold">FREE</span>
                    ) : (
                      <span className="text-slate-400">Calculated at checkout</span>
                    )}
                  </div>
                  {subtotal < 999 && (
                    <p className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                      Add ₹{(999 - subtotal).toLocaleString('en-IN', { minimumFractionDigits: 0 })} more to unlock free shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between font-black text-slate-800 text-base">
                    <span>Estimated Total</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm hover:scale-[1.01]"
                >
                  Proceed to Checkout <ChevronRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/shop"
                  className="block text-center text-xs text-slate-400 hover:text-primary-pink font-bold transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-rose-100 py-8 px-6 text-center mt-12">
        <p className="text-[11px] text-slate-400">
          © 2026 CreativeArt by Tannu. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
