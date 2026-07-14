'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import Header from '../../../components/Header';
import { 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Building,
  Loader,
  Package,
  Info,
  ArrowLeft,
  Truck,
  Send
} from 'lucide-react';

export default function DualPaymentCheckoutPage() {
  const router = useRouter();
  
  // The pending booking is stored in sessionStorage by the PDP "Book Preservation" button
  const [booking, setBooking] = useState(null);
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Intake Office Hubs
  const [officeAddresses, setOfficeAddresses] = useState([]);
  const [selectedOfficeAddress, setSelectedOfficeAddress] = useState(null);

  // How the customer will send their raw materials to the studio
  // 'SELF_SHIP'  — courier them independently, share tracking after payment
  // 'DROP_AT_HUB' — ship/drop to one of our studio intake hubs
  const [materialShipmentMode, setMaterialShipmentMode] = useState('SELF_SHIP');

  // Tracking details (only relevant when SELF_SHIP is selected)
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [skipTracking, setSkipTracking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: '', contactName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });
  const [addrLoading, setAddrLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Read pending booking from sessionStorage (set by PDP)
      const raw = sessionStorage.getItem('pendingBooking');
      if (!raw) {
        // No pending booking — redirect to shop
        router.replace('/shop');
        return;
      }
      const parsedBooking = JSON.parse(raw);
      setBooking(parsedBooking);

      // 2. Load user addresses and office hubs in parallel
      const [addressData, officeData] = await Promise.all([
        apiClient.get('/addresses'),
        apiClient.get('/office-addresses').catch(() => []) // gracefully handle if not implemented yet
      ]);
      setAddresses(addressData);
      setOfficeAddresses(officeData);

      const defaultAddr = addressData.find(a => a.isDefault) || addressData[0];
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      if (officeData.length > 0) setSelectedOfficeAddress(officeData[0].id);

    } catch (err) { 
      setError(err.message || 'Failed to load booking details.'); 
    } finally { 
      setLoading(false); 
    }
  }, [router]);

  useEffect(() => { 
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData(); 
  }, [loadData, router]);

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const data = await apiClient.post('/addresses', addrForm);
      setAddresses(prev => [...prev, data]);
      setSelectedAddress(data.id);
      setShowAddressForm(false);
      setAddrForm({ label: '', contactName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' });
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setAddrLoading(false); 
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { setError('Please select a delivery address for the finished product.'); return; }
    if (materialShipmentMode === 'DROP_AT_HUB' && !selectedOfficeAddress) {
      setError('Please select a studio intake hub to send your materials to.'); return;
    }
    if (materialShipmentMode === 'SELF_SHIP' && !skipTracking) {
      if (!courierName.trim() || !trackingNumber.trim()) {
        setError('Please enter both Courier Partner and AWB/Tracking number, or skip it for post-payment.');
        return;
      }
    }
    setSubmitting(true); 
    setError(null);
    try {
      const referralCode = localStorage.getItem('referralCode') || null;

      // Build the order payload from sessionStorage booking data
      const payload = {
        productId: booking.productId,
        addressId: selectedAddress,
        selectedOfficeAddressId: materialShipmentMode === 'DROP_AT_HUB' ? selectedOfficeAddress : null,
        materialShipmentMode,
        courierName: (materialShipmentMode === 'SELF_SHIP' && !skipTracking) ? courierName.trim() : null,
        trackingNumber: (materialShipmentMode === 'SELF_SHIP' && !skipTracking) ? trackingNumber.trim() : null,
        customFieldValues: booking.customFieldValues || {},
        referralCode
      };

      const data = await apiClient.post('/checkout/dual-payment', payload);
      
      // Clear the pending booking and referral info after successful order
      sessionStorage.removeItem('pendingBooking');
      localStorage.removeItem('referralCode');
      localStorage.removeItem('referralCapturedAt');
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/order-confirmation?orderId=${data.orderId}`);
      }
    } catch (err) { 
      setError(err.message || 'Failed to place booking. Please try again.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 animate-spin text-primary-pink" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading your project booking...</p>
        </div>
      </div>
    </div>
  );

  if (!booking) return null; // redirecting

  const advanceAmount = parseFloat(booking.advanceAmount || booking.price || 0);
  const finalAmount = parseFloat(booking.finalAmount || 0);
  const totalAmount = parseFloat(booking.totalAmount || advanceAmount);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-bold mb-6">
          <Link href="/" className="hover:text-primary-pink">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href={`/products/${booking.slug}`} className="hover:text-primary-pink">Project</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500">Book Preservation</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-slate-800">Book Custom Project</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1.5">
            Pay the booking advance fee now. Ship your raw materials to our studio. Pay the final balance once your project is ready.
          </p>
        </div>

        {/* Project info banner */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-5 mb-6 flex items-start gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl border border-indigo-100 overflow-hidden shrink-0">
            {booking.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.image} alt={booking.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">{booking.name}</h3>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5 uppercase tracking-wider">Custom Preservation Project</p>
            {booking.customFieldValues && Object.entries(booking.customFieldValues).map(([k, v]) => v ? (
              <p key={k} className="text-[10px] text-slate-400 font-medium mt-0.5">
                <span className="font-bold text-slate-500">{k}:</span> {v.startsWith('http') ? 'File attached' : v}
              </p>
            ) : null)}
          </div>
        </div>

        {/* Dual Payment Info */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-slate-500 font-medium leading-relaxed">
            <span className="font-bold text-slate-700">Two-stage payment: </span>
            You pay the advance booking fee (₹{advanceAmount.toLocaleString('en-IN')}) today to secure your project slot. The final balance 
            (₹{finalAmount.toLocaleString('en-IN')}) will be charged when your preserved arrangement is ready for dispatch.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex items-center gap-2 text-primary-pink text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address & Hub selection */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Delivery Address */}
            <section className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-pink" /> Deliver Finished Product To
                </h2>
                <button 
                  onClick={() => setShowAddressForm(s => !s)} 
                  className="flex items-center gap-1 text-[10px] font-bold text-primary-pink hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={saveAddress} className="mb-5 space-y-3 bg-slate-50 border border-rose-100 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Address</p>
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
                          className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-xs bg-white border border-slate-100 hover:border-slate-200 text-slate-400 rounded-full font-bold transition-colors cursor-pointer">
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
                  <p className="text-xs text-slate-400 py-4 text-center">No saved addresses. Add one above.</p>
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

            {/* ── Material Dispatch Method ──────────────────────────────────── */}
            <section className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="border-b border-slate-50 pb-4 mb-5">
                <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary-pink" /> How Will You Send Us Your Materials?
                </h2>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Your raw flowers, keepsakes, or materials need to reach our studio before work begins.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A — Self-ship with courier */}
                <button
                  type="button"
                  onClick={() => setMaterialShipmentMode('SELF_SHIP')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    materialShipmentMode === 'SELF_SHIP'
                      ? 'border-primary-pink bg-primary-pink-light'
                      : 'border-slate-100 hover:border-rose-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      materialShipmentMode === 'SELF_SHIP' ? 'bg-primary-pink text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Send className="w-4 h-4" />
                    </div>
                    {materialShipmentMode === 'SELF_SHIP' && (
                      <CheckCircle2 className="w-4 h-4 text-primary-pink ml-auto" />
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">I'll Courier My Materials</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                    Ship via any courier to our studio. You'll share the tracking number with us after payment — we'll guide you on the next steps.
                  </p>
                </button>

                {/* Option B — Drop at studio hub */}
                <button
                  type="button"
                  onClick={() => setMaterialShipmentMode('DROP_AT_HUB')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    materialShipmentMode === 'DROP_AT_HUB'
                      ? 'border-primary-pink bg-primary-pink-light'
                      : 'border-slate-100 hover:border-rose-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      materialShipmentMode === 'DROP_AT_HUB' ? 'bg-primary-pink text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Building className="w-4 h-4" />
                    </div>
                    {materialShipmentMode === 'DROP_AT_HUB' && (
                      <CheckCircle2 className="w-4 h-4 text-primary-pink ml-auto" />
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">Drop at a Studio Hub</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                    Ship or hand-deliver your materials to one of our nearest studio intake locations.
                  </p>
                </button>
              </div>

              {/* Hub selector — only shown when DROP_AT_HUB is chosen */}
              {materialShipmentMode === 'DROP_AT_HUB' && (
                <div className="mt-5 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Intake Hub</p>
                  {officeAddresses.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      No studio hubs are currently listed. Please use the courier option above, or contact us for the studio address.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {officeAddresses.map(hub => (
                        <label
                          key={hub.id}
                          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedOfficeAddress === hub.id
                              ? 'border-primary-pink bg-primary-pink-light'
                              : 'border-slate-100 hover:border-rose-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="officeAddress"
                            value={hub.id}
                            checked={selectedOfficeAddress === hub.id}
                            onChange={() => setSelectedOfficeAddress(hub.id)}
                            className="mt-0.5 accent-primary-pink cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-slate-800">{hub.label}</span>
                            <p className="text-slate-500 mt-0.5">{hub.line1}{hub.line2 ? `, ${hub.line2}` : ''}</p>
                            <p className="text-slate-400">{hub.city}, {hub.state} — {hub.pincode}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SELF_SHIP input fields & skip button */}
              {materialShipmentMode === 'SELF_SHIP' && (
                <div className="mt-5 space-y-4 border-t border-slate-50 pt-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Courier Tracking Details</p>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipTracking}
                        onChange={(e) => setSkipTracking(e.target.checked)}
                        className="accent-primary-pink cursor-pointer rounded"
                      />
                      <span>Skip for now (Submit post-payment)</span>
                    </label>
                  </div>

                  {!skipTracking ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Courier Partner *</label>
                        <input
                          value={courierName}
                          onChange={(e) => setCourierName(e.target.value)}
                          placeholder="e.g. Blue Dart, Delhivery, DTDC"
                          className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">AWB / Tracking Number *</label>
                        <input
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="e.g. 1234567890"
                          className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 flex items-start gap-2 animate-in fade-in duration-200">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                        You can skip entering courier details now. You will be able to submit them anytime from your account dashboard/orders history post-payment.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right: Project Booking Summary */}
          <div>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sticky top-24 space-y-5 shadow-sm">
              <h2 className="font-playfair font-bold text-slate-800 text-base border-b border-slate-50 pb-4">Project Booking</h2>

              {/* Pricing breakdown */}
              <div className="space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>Project Total Value</span>
                  <span className="text-slate-800">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Final Balance (Pay later)</span>
                  <span>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Advance due now */}
              <div className="bg-primary-pink-light border border-rose-200 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-extrabold text-primary-pink uppercase tracking-wider">Due Now — Booking Advance</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Secures your project slot</p>
                  </div>
                  <span className="text-xl font-black text-primary-pink">₹{advanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={submitting || !selectedAddress}
                className="flex items-center justify-center gap-2 w-full py-4 bg-primary-pink hover:bg-primary-pink-hover disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? 'Processing...' : `Pay ₹${advanceAmount.toLocaleString('en-IN')} Deposit`}
              </button>
              
              <p className="text-center text-[10px] text-slate-400 font-medium">
                Secured by PhonePe · No hidden charges · Final balance billed after completion
              </p>
              
              <Link
                href={`/products/${booking.slug}`}
                className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-primary-pink font-bold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to product
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
