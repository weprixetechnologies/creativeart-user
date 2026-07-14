'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import Header from '../../components/Header';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  MapPin,
  CreditCard,
  Tag,
  ShoppingBag,
  Phone,
  User,
  Download,
  Loader2
} from 'lucide-react';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);
  const [pollErrorCount, setPollErrorCount] = useState(0);

  // Fetch helper
  const fetchOrder = async () => {
    try {
      const data = await apiClient.get(`/orders/${orderId}`);
      setOrder(data);
      setPollErrorCount(0);

      // Determine if polling should continue (Prepaid & still created/pending/awaiting check)
      const primaryPayment = data.payments && data.payments[0];
      const isPrepaid = primaryPayment && primaryPayment.gateway === 'PHONEPE';
      const isPaymentPending = primaryPayment && (primaryPayment.status === 'CREATED' || primaryPayment.status === 'PENDING');
      const isOrderPlaced = data.status === 'PLACED'; // For prepaid orders, it becomes PAID on webhook success

      if (isPrepaid && (isPaymentPending || isOrderPlaced) && data.status !== 'CANCELLED') {
        setPollingActive(true);
      } else {
        setPollingActive(false);
      }
    } catch (err) {
      setPollErrorCount(prev => prev + 1);
      if (pollErrorCount > 5) {
        setPollingActive(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetchOrder();
  }, [orderId]);

  // Polling hook
  useEffect(() => {
    if (!pollingActive || !orderId) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 2000);
    return () => clearInterval(interval);
  }, [pollingActive, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-pink animate-spin mb-4" />
        <p className="text-slate-500 font-sans font-medium text-xs">Loading order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="font-playfair text-xl font-bold text-slate-800 mb-2">Order Not Found</h1>
          <p className="text-slate-550 text-xs mb-6 leading-relaxed">
            We couldn't locate your order details. If you recently completed checkout, your payment might still be processing.
          </p>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold text-xs shadow-sm transition-all"
          >
            Go to My Orders
          </Link>
        </div>
      </div>
    );
  }

  // Derive status states
  const primaryPayment = order.payments && order.payments[0];
  const isCod = primaryPayment && primaryPayment.gateway === 'COD';
  const isPrepaid = primaryPayment && primaryPayment.gateway === 'PHONEPE';
  const paymentStatus = primaryPayment ? primaryPayment.status : 'PENDING';

  // Overall display flags
  const isSuccess = isCod || (isPrepaid && (order.status === 'PAID' || paymentStatus === 'CAPTURED'));
  const isFailed = isPrepaid && (order.status === 'CANCELLED' || paymentStatus === 'FAILED');
  const isPending = isPrepaid && !isSuccess && !isFailed;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 font-sans flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-6">
          {/* Header Status Card */}
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 text-center shadow-sm">
            {isSuccess && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
                <div>
                  <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-slate-850">
                    {isCod ? 'Order Placed!' : 'Payment Successful!'}
                  </h1>
                  <p className="text-slate-550 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                    {isCod
                      ? `Thank you for your order. We've received your request and will ship it soon. Please keep ₹${order.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} cash ready upon delivery.`
                      : `Thank you for your payment. Your order number is ${order.orderNumber}. A confirmation mail has been sent.`}
                  </p>
                </div>
              </div>
            )}

            {isFailed && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-9 h-9 text-rose-500" />
                </div>
                <div>
                  <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-rose-600">
                    Payment Failed
                  </h1>
                  <p className="text-slate-550 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                    We were unable to process your prepaid transaction. Please check your bank status or attempt payment again.
                  </p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
                <div>
                  <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-slate-800">
                    Awaiting Payment Confirmation
                  </h1>
                  <p className="text-slate-550 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                    We are waiting for payment verification from PhonePe. This page will update automatically in a few moments.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Col: Order Summary & Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Order Items */}
              <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary-pink" /> Items Ordered
                </h2>
                <div className="divide-y divide-slate-50">
                  {order.items && order.items.map(item => (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productNameSnapshot}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🎁</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xs text-slate-800 truncate">{item.productNameSnapshot}</h3>
                        {item.variantSku && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SKU: {item.variantSku}</p>
                        )}
                        {/* Custom fields choices snapshot */}
                        {item.customFieldValues && Object.keys(item.customFieldValues).length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {Object.entries(item.customFieldValues).map(([key, f]) => (
                              <p key={key} className="text-[9px] text-slate-500 font-medium">
                                <span className="text-slate-400">{f.label}:</span> {f.value}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-555 mt-1">
                          ₹{item.unitPrice.toLocaleString('en-IN')} × {item.qty}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-slate-800">
                          ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Delivery Address & Method */}
              <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Delivery Address */}
                  <div>
                    <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-pink" /> Delivery Address
                    </h2>
                    {order.address ? (
                      <div className="text-xs text-slate-550 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3 h-3 text-slate-400" />
                          {order.address.contactName}
                        </div>
                        <p className="pl-4 leading-relaxed">
                          {order.address.line1}
                          {order.address.line2 ? `, ${order.address.line2}` : ''}
                        </p>
                        <p className="pl-4">
                          {order.address.city}, {order.address.state} — {order.address.pincode}
                        </p>
                        <div className="flex items-center gap-1.5 pl-4 pt-1 text-[10px] text-slate-400 font-semibold">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {order.address.phone}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Address details unavailable.</p>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary-pink" /> Payment Method
                    </h2>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 font-medium">Mode:</span>
                        <span className="font-bold text-slate-800">
                          {isCod ? 'Cash on Delivery (COD)' : 'Prepaid Online'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Payment Status:</span>
                        <span className={`font-bold uppercase ${isSuccess ? 'text-emerald-600' : isFailed ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                          {isSuccess ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Col: Totals Summary & Actions */}
            <div className="space-y-6">
              <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Summary</h2>

                <div className="space-y-2.5 text-xs text-slate-550 font-bold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-800">₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>−₹{order.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18% inclusive)</span>
                    <span className="text-slate-800">₹{order.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-slate-800">Free</span>
                  </div>
                  <div className="border-t border-slate-50 pt-3 flex justify-between items-baseline font-bold text-slate-800">
                    <span className="font-playfair text-sm">Total</span>
                    <span className="text-base sm:text-lg font-sans font-black text-primary-pink">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 space-y-2">
                  <Link
                    href="/account/orders"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold text-xs transition-colors cursor-pointer"
                  >
                    View My Orders
                  </Link>

                  {isSuccess && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1'}/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 rounded-full font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Invoice
                    </a>
                  )}
                </div>
              </section>

              <div className="text-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-primary-pink transition-colors"
                >
                  Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-pink animate-spin" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
