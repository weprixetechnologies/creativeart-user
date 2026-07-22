'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import { 
  MapPin, 
  Tag, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader,
  Package,
  ArrowLeft
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PREPAID');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: '', contactName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });
  const [addrLoading, setAddrLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Read cart from localStorage (same source as Header + Cart page)
      let cartObj = { items: [] };
      const raw = localStorage.getItem('cart');
      if (raw) {
        try {
          const parsedItems = JSON.parse(raw);
          cartObj = {
            items: parsedItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.name,
              image: item.image,
              qty: item.quantity || 1,
              unitPriceSnapshot: parseFloat(item.price || 0),
              customFieldValues: item.customFieldValues || {}
            }))
          };
        } catch {}
      }

      // 2. Fetch user addresses
      const addressData = await apiClient.get('/addresses');
      
      // 3. Fetch settings
      const settingsData = await apiClient.get('/settings').catch(() => ({ data: {} }));
      
      setCart(cartObj);
      setAddresses(addressData);
      setSettings(settingsData.data || {});
      const defaultAddr = addressData.find(a => a.isDefault) || addressData[0];
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const applyCoupons = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(null);
    try {
      const data = await apiClient.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderAmount: subtotal
      });
      setCouponData(data);
    } catch (err) {
      setCouponData(null);
      setCouponError(err.message);
    } finally { setCouponLoading(false); }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const data = await apiClient.post('/addresses', addrForm);
      setAddresses(prev => [...prev, data]);
      setSelectedAddress(data.id);
      setShowAddressForm(false);
      setAddrForm({ label: '', contactName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });
    } catch (err) { alert(err.message); }
    finally { setAddrLoading(false); }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { setError('Please select a delivery address.'); return; }
    setSubmitting(true); setError(null);
    try {
      const raw = localStorage.getItem('cart');
      const items = (raw ? JSON.parse(raw) : []).map(item => ({
        productId: Number(item.productId),
        variantId: item.variantId ? Number(item.variantId) : null,
        name: item.name || 'Product',
        price: parseFloat(item.price || 0),
        quantity: Number(item.quantity || 1),
        customFieldValues: item.customFieldValues || {}
      }));

      const referralCode = localStorage.getItem('referralCode') || null;

      const payload = {
        addressId: selectedAddress,
        couponCode: couponCode.trim().toUpperCase() || null,
        items,
        paymentMethod,
        referralCode
      };
      const data = await apiClient.post('/checkout/standard', payload);
      
      // Clear cart and referral from localStorage on success
      localStorage.removeItem('cart');
      localStorage.removeItem('referralCode');
      localStorage.removeItem('referralCapturedAt');
      window.dispatchEvent(new Event('cart-updated'));

      // Redirection logic based on payment method
      if (paymentMethod === 'COD') {
        router.push(`/order-confirmation?orderId=${data.orderId}`);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/order-confirmation?orderId=${data.orderId}`);
      }
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const subtotal = cart?.items?.reduce((acc, i) => acc + i.unitPriceSnapshot * i.qty, 0) || 0;
  const discount = couponData?.discount || 0;
  const tax = ((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;

  if (loading) return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 animate-spin text-primary-pink" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading secure checkout...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-bold mb-6">
          <Link href="/" className="hover:text-primary-pink">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href="/cart" className="hover:text-primary-pink">Cart</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500">Checkout</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-slate-800">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1.5">Review your items, apply a coupon, and choose your delivery address.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex items-center gap-2 text-primary-pink text-xs font-bold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Address */}
            <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-pink" /> Delivery Address
                </h2>
                <button 
                  onClick={() => setShowAddressForm(s => !s)} 
                  className="flex items-center gap-1 text-[10px] font-bold text-primary-pink hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={saveAddress} className="mb-5 space-y-3 bg-slate-50 border border-rose-100 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Address Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'contactName', label: 'Contact Name *', placeholder: 'Full name for delivery' },
                      { key: 'phone', label: 'Phone', placeholder: '+91 XXXXX XXXXX' },
                      { key: 'label', label: 'Label', placeholder: 'Home / Work / Other' },
                      { key: 'line1', label: 'Address Line 1 *', placeholder: 'Street / Building' },
                      { key: 'line2', label: 'Address Line 2', placeholder: 'Apartment, Floor etc.' },
                      { key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' },
                      { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' },
                      { key: 'pincode', label: 'Pincode *', placeholder: '400001' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
                        <input
                          value={addrForm[key]}
                          onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-xs bg-white border border-slate-100 hover:border-slate-200 text-slate-450 rounded-full font-bold transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" disabled={addrLoading} className="px-5 py-2 text-xs bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                      {addrLoading ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No saved addresses. Add one above to continue.</p>
                ) : addresses.map(addr => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddress === addr.id
                        ? 'border-primary-pink bg-primary-pink-light'
                        : 'border-slate-100 hover:border-rose-100 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-0.5 accent-primary-pink cursor-pointer"
                    />
                    <div className="text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{addr.label || 'Address'}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-white border border-rose-200 text-primary-pink px-1.5 py-0.5 rounded font-bold">Default</span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-slate-400">{addr.city}, {addr.state} — {addr.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment Method Selector */}
            <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="border-b border-slate-50 pb-4 mb-5">
                <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-pink" /> Payment Method
                </h2>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Choose your preferred payment mode for this order.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prepaid Online Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PREPAID')}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'PREPAID'
                      ? 'border-primary-pink bg-primary-pink-light ring-1 ring-primary-pink/25'
                      : 'border-slate-100 hover:border-rose-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💳</span>
                    {paymentMethod === 'PREPAID' && (
                      <CheckCircle2 className="w-4 h-4 text-primary-pink ml-auto" />
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">Online Payment</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                    Pay securely online using Cards, UPI, Netbanking or Wallets (PhonePe).
                  </p>
                </button>

                {/* Cash on Delivery (COD) */}
                {settings?.cod_enabled === true && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-primary-pink bg-primary-pink-light ring-1 ring-primary-pink/25'
                        : 'border-slate-100 hover:border-rose-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💵</span>
                      {paymentMethod === 'COD' && (
                        <CheckCircle2 className="w-4 h-4 text-primary-pink ml-auto" />
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                      Pay with cash directly to the delivery agent upon receiving your package.
                    </p>
                  </button>
                )}
              </div>
            </section>

            {/* Coupon / Promo Code */}
            <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="border-b border-slate-50 pb-4 mb-4">
                <h2 className="font-bold text-slate-850 text-xs sm:text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-pink" /> Coupon / Promo Code
                </h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponData(null); setCouponError(null); }}
                  placeholder="Enter coupon code (e.g. SAVE10)"
                  className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                />
                <button
                  onClick={applyCoupons}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-5 py-2.5 bg-primary-pink hover:bg-primary-pink-hover disabled:opacity-50 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponData && (
                <div className="mt-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Coupon applied! You save ₹{couponData.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              )}
              {couponError && (
                <div className="mt-3 bg-rose-50 border border-rose-100 text-primary-pink rounded-xl p-3 flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-primary-pink" />
                  {couponError}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sticky top-24 space-y-5 shadow-sm">
              <h2 className="font-playfair font-bold text-slate-800 text-base border-b border-slate-50 pb-4">Order Summary</h2>
              
              <div className="space-y-3.5">
                {cart?.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-350" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-700 truncate">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Quantity: {item.qty}</p>
                    </div>
                    <span className="shrink-0 font-bold text-slate-800">
                      ₹{(item.unitPriceSnapshot * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>−₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18% inclusive)</span>
                  <span className="text-slate-800">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4">
                <div className="flex justify-between items-baseline font-bold text-slate-800">
                  <span className="font-playfair text-sm sm:text-base">Order Total</span>
                  <span className="text-xl sm:text-2xl font-black text-primary-pink font-sans">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={submitting || !selectedAddress}
                className="flex items-center justify-center gap-2 w-full py-4 bg-primary-pink hover:bg-primary-pink-hover disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                {submitting 
                  ? (paymentMethod === 'COD' ? 'Placing Order...' : 'Processing Payment...') 
                  : (paymentMethod === 'COD' ? 'Confirm COD Order' : `Pay ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Now`)}
              </button>

              <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                {paymentMethod === 'COD' ? 'Pay cash upon delivery' : 'Secured by PhonePe'} · Free Standard Shipping · All prices in INR
              </p>

              <Link
                href="/cart"
                className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-primary-pink font-bold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
