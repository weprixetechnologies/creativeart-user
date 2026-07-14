'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../../lib/api-client';
import {
  ArrowLeft,
  Package,
  CreditCard,
  Clock,
  Download,
  AlertCircle,
  Truck,
  CheckCircle2,
  Building,
  DollarSign,
  Loader
} from 'lucide-react';

const STATUS_META = {
  PLACED: { label: 'Placed', color: 'bg-blue-55/10 border-blue-100 text-blue-600' },
  PAID: { label: 'Paid', color: 'bg-emerald-55/10 border-emerald-100 text-emerald-600' },
  PACKED: { label: 'Packed', color: 'bg-indigo-55/10 border-indigo-100 text-indigo-600' },
  SHIPPED: { label: 'Shipped', color: 'bg-violet-55/10 border-violet-100 text-violet-600' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-55/10 border-teal-100 text-teal-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-rose-55/10 border-rose-100 text-rose-600' },
  REFUNDED: { label: 'Refunded', color: 'bg-orange-55/10 border-orange-100 text-orange-600' },
  BOOKED_PENDING_ADVANCE: { label: 'Pending Advance', color: 'bg-yellow-55/10 border-yellow-100 text-yellow-600' },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-emerald-55/10 border-emerald-100 text-emerald-600' },
  AWAITING_MATERIAL_DISPATCH: { label: 'Awaiting Material', color: 'bg-blue-55/10 border-blue-100 text-blue-600' },
  MATERIAL_IN_TRANSIT: { label: 'Material In Transit', color: 'bg-violet-55/10 border-violet-100 text-violet-600' },
  MATERIAL_RECEIVED: { label: 'Material Received', color: 'bg-teal-55/10 border-teal-100 text-teal-600' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-indigo-55/10 border-indigo-100 text-indigo-600' },
  READY_PENDING_FINAL_PAYMENT: { label: 'Ready for Balance', color: 'bg-amber-55/10 border-amber-100 text-amber-600' },
  FINAL_PAID: { label: 'Final Paid', color: 'bg-emerald-55/10 border-emerald-100 text-emerald-600' },
  ON_HOLD: { label: 'On Hold', color: 'bg-slate-50 border-slate-100 text-slate-500' },
};

const STEPPER_STAGES = [
  { label: 'Deposit Paid' },
  { label: 'Ship Materials' },
  { label: 'In Production' },
  { label: 'Ready & Billed' },
  { label: 'Final Paid' },
  { label: 'Delivered' }
];

const STATUS_TO_STAGE = {
  BOOKED_PENDING_ADVANCE: -1,
  ADVANCE_PAID: 0,
  AWAITING_MATERIAL_DISPATCH: 0,
  MATERIAL_IN_TRANSIT: 1,
  MATERIAL_RECEIVED: 1,
  IN_PRODUCTION: 2,
  READY_PENDING_FINAL_PAYMENT: 3,
  FINAL_PAID: 4,
  PACKED: 4,
  SHIPPED: 4,
  DELIVERED: 5
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'bg-slate-50 border-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [officeAddress, setOfficeAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ship materials form
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipLoading, setShipLoading] = useState(false);
  const [shipError, setShipError] = useState(null);

  // Final payment processing
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState(null);

  // Advance payment retry
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState(null);

  // Delivery notification state
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient.get(`/orders/${orderId}`);
      setOrder(data);

      if (data.selectedOfficeAddressId) {
        const addr = await apiClient.get(`/office-addresses/${data.selectedOfficeAddressId}`);
        setOfficeAddress(addr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    setShipLoading(true);
    setShipError(null);
    try {
      await apiClient.post(`/orders/${orderId}/shipment`, {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim()
      });
      await fetchOrder();
    } catch (err) {
      setShipError(err.message);
    } finally {
      setShipLoading(false);
    }
  };

  const handleFinalPayment = async () => {
    setPayLoading(true);
    setPayError(null);
    try {
      const data = await apiClient.post(`/orders/${orderId}/final-payment`);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        await fetchOrder();
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleAdvancePayment = async () => {
    setAdvLoading(true);
    setAdvError(null);
    try {
      const data = await apiClient.post(`/orders/${orderId}/advance-payment`);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        await fetchOrder();
      }
    } catch (err) {
      setAdvError(err.message);
    } finally {
      setAdvLoading(false);
    }
  };

  const handleNotifyDelivered = async () => {
    setNotifyLoading(true);
    setNotifySuccess(false);
    // Simulating API success for delivery notification
    setTimeout(() => {
      setNotifyLoading(false);
      setNotifySuccess(true);
    }, 1000);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader className="w-8 h-8 animate-spin text-[#e04169]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <AlertCircle className="w-10 h-10 text-[#e04169]" />
      <p className="text-slate-450 text-xs font-bold">{error}</p>
      <button onClick={fetchOrder} className="text-[#e04169] text-xs font-bold hover:underline">Retry</button>
    </div>
  );

  if (!order) return null;

  const currentStageIndex = STATUS_TO_STAGE[order.status] ?? -1;

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-650 transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-playfair font-black text-slate-800">{order.orderNumber}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={order.status} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>
          </div>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1'}/orders/${orderId}/invoice`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 px-4.5 py-2 bg-slate-100 hover:bg-[#fff0f3] hover:text-[#e04169] text-slate-600 rounded-full text-xs font-bold transition-all border border-slate-200/50"
        >
          <Download className="w-3.5 h-3.5" /> Invoice
        </a>
      </div>

      {/* Stepper (Custom Projects Only) */}
      {order.orderType === 'DUAL_PAYMENT' && (
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Project Timeline</h3>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {STEPPER_STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentStageIndex;
              const isActive = idx === currentStageIndex;
              return (
                <div key={idx} className="flex-1 flex flex-row sm:flex-col items-center gap-3 text-left sm:text-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all ${isCompleted
                      ? 'bg-[#e04169] border-[#e04169] text-white shadow-sm shadow-rose-600/10'
                      : 'border-slate-200 bg-white text-slate-400'
                    } ${isActive ? 'animate-pulse ring-2 ring-[#fff0f3]' : ''}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold transition-colors ${isCompleted ? 'text-slate-800 font-extrabold' : 'text-slate-450'}`}>
                      {stage.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Actions Panels */}
      {order.status === 'BOOKED_PENDING_ADVANCE' && (
        <div className="bg-white border border-[#fecdd3] rounded-3xl p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#e04169]" /> Action Required: Pay Booking Deposit
            </h3>
            <p className="text-xs text-slate-450 mt-1 leading-normal font-semibold">
              Your custom project reservation has been placed. Please pay the booking advance fee to activate the order and begin flower preservation.
            </p>
          </div>

          <div className="flex justify-between items-center bg-[#fff0f3]/40 border border-[#fecdd3] p-4 rounded-2xl">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Advance Deposit Due</p>
              <p className="font-black text-slate-850 text-base">
                ₹{parseFloat(order.advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={handleAdvancePayment}
              disabled={advLoading}
              className="px-5 py-2.5 bg-[#e04169] hover:bg-[#c23255] disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
            >
              {advLoading ? 'Processing...' : 'Pay Deposit Now'}
            </button>
          </div>
          {advError && <p className="text-xs text-[#e04169] bg-[#fff0f3] border border-rose-100 rounded-xl px-3 py-2">{advError}</p>}
        </div>
      )}

      {order.status === 'AWAITING_MATERIAL_DISPATCH' && (
        <div className="bg-white border border-[#fecdd3] rounded-3xl p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2.5">
              <Truck className="w-4.5 h-4.5 text-[#e04169]" /> Action Required: Ship Raw Materials
            </h3>
            <p className="text-xs text-slate-450 mt-1 leading-normal font-semibold">
              Please ship your custom material to the chosen intake office. Once shipped, submit tracking details below.
            </p>
          </div>

          {officeAddress && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-1.5 text-xs font-semibold text-slate-550">
              <p className="font-extrabold text-slate-800 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#e04169]" /> Ship To Hub</p>
              <p className="text-[#e04169] font-extrabold">{officeAddress.label}</p>
              <p className="text-slate-600 font-medium">{officeAddress.line1}{officeAddress.line2 ? `, ${officeAddress.line2}` : ''}</p>
              <p className="text-slate-500 font-medium">{officeAddress.city}, {officeAddress.state} — {officeAddress.pincode}</p>
            </div>
          )}

          <form onSubmit={handleShipSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Courier Name</label>
              <input
                type="text"
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                placeholder="e.g. DHL Express, BlueDart"
                className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e04169] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. AWB-9876543"
                className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e04169] transition-all"
                required
              />
            </div>
            {shipError && (
              <p className="text-xs text-[#e04169] sm:col-span-2">{shipError}</p>
            )}
            <button
              type="submit"
              disabled={shipLoading}
              className="sm:col-span-2 py-3 bg-[#e04169] hover:bg-[#c23255] disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
            >
              {shipLoading ? 'Submitting...' : 'Submit Shipment Details'}
            </button>
          </form>
        </div>
      )}

      {order.status === 'READY_PENDING_FINAL_PAYMENT' && (
        <div className="bg-white border border-[#fecdd3] rounded-3xl p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#e04169]" /> Action Required: Pay Balance
            </h3>
            <p className="text-xs text-slate-450 mt-1 leading-normal font-semibold">
              Production is complete and verified. Please pay the remaining balance to dispatch your finished order.
            </p>
          </div>

          <div className="flex justify-between items-center bg-[#fff0f3]/40 border border-[#fecdd3] p-4 rounded-2xl">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Remaining Balance</p>
              <p className="font-black text-slate-850 text-base">
                ₹{parseFloat(order.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={handleFinalPayment}
              disabled={payLoading}
              className="px-5 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
            >
              {payLoading ? 'Processing...' : 'Pay Balance Now'}
            </button>
          </div>
          {payError && <p className="text-xs text-[#e04169] bg-[#fff0f3] border border-rose-100 rounded-xl px-3 py-2">{payError}</p>}
        </div>
      )}

      {order.status === 'SHIPPED' && (
        <div className="bg-white border border-[#fecdd3] rounded-3xl p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#e04169]" /> Have You Received Your Package?
            </h3>
            <p className="text-xs text-slate-450 mt-1 leading-normal font-semibold">
              Your arrangement has been shipped and is in transit. Please notify us once it reaches you.
            </p>
          </div>

          <button
            onClick={handleNotifyDelivered}
            disabled={notifyLoading || notifySuccess}
            className="w-full py-3 bg-[#e04169] hover:bg-[#c23255] disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
          >
            {notifyLoading ? 'Notifying...' : notifySuccess ? 'Delivered Notified' : 'Notify as Delivered'}
          </button>
          {notifySuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 animate-in fade-in duration-200">
              Thank you! We have been notified of the delivery. The status will be updated soon.
            </p>
          )}
        </div>
      )}

      {/* Pricing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Subtotal', val: order.subtotal },
          { label: 'Discount', val: order.discountAmount },
          { label: 'Tax', val: order.taxAmount },
          { label: 'Total Project Cost', val: order.totalAmount, highlight: true },
        ].map(({ label, val, highlight }) => (
          <div key={label} className={`bg-white border rounded-3xl p-4 shadow-sm flex flex-col justify-between ${highlight ? 'border-[#fecdd3] ring-2 ring-[#fff0f3] bg-[#fff0f3]/25 font-bold' : 'border-slate-100'
            }`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-sm font-black ${highlight ? 'text-[#e04169]' : 'text-slate-850'}`}>
              ₹{parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Dual Payment Details (Project Based Only) */}
      {order.orderType === 'DUAL_PAYMENT' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#e04169]" /> Project Payment Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Advance card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1st Installment (Advance)</p>
                <p className="font-extrabold text-slate-850 text-sm mt-1">
                  ₹{parseFloat(order.advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${order.payments?.some(p => p.paymentType === 'ADVANCE' && p.status === 'CAPTURED')
                  ? 'bg-emerald-55/10 text-emerald-600 border border-emerald-100'
                  : 'bg-yellow-55/10 text-yellow-600 border border-yellow-100'
                }`}>
                {order.payments?.some(p => p.paymentType === 'ADVANCE' && p.status === 'CAPTURED') ? 'Paid' : 'Pending'}
              </span>
            </div>

            {/* Final card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">2nd Installment (Final Balance)</p>
                <p className="font-extrabold text-slate-850 text-sm mt-1">
                  ₹{parseFloat(order.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${order.payments?.some(p => p.paymentType === 'FINAL' && p.status === 'CAPTURED')
                  ? 'bg-emerald-55/10 text-emerald-600 border border-emerald-100'
                  : 'bg-yellow-55/10 text-yellow-600 border border-yellow-100'
                }`}>
                {order.payments?.some(p => p.paymentType === 'FINAL' && p.status === 'CAPTURED') ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Package className="w-4 h-4 text-[#e04169]" />
          <h2 className="text-xs font-bold text-slate-850 uppercase tracking-widest">Items Ordered</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-5">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-800 text-sm">{item.productNameSnapshot}</p>
                {item.variantSku && <p className="text-[10px] text-slate-400 font-bold mt-1">SKU: {item.variantSku}</p>}
                {Object.keys(item.customFieldValues || {}).length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {Object.values(item.customFieldValues).map((cf, i) => (
                      <p key={i} className="text-xs text-slate-500">
                        <span className="text-slate-400 font-bold">{cf.label}:</span> {cf.value}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-slate-800 text-sm">
                  ₹{parseFloat(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{item.qty} × ₹{parseFloat(item.unitPrice || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <CreditCard className="w-4 h-4 text-[#e04169]" />
          <h2 className="text-xs font-bold text-slate-850 uppercase tracking-widest">Payment History</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {order.payments?.length === 0 ? (
            <p className="p-5 text-xs text-slate-400 font-semibold">No payment records found.</p>
          ) : order.payments?.map(pay => (
            <div key={pay.id} className="flex items-center justify-between p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{pay.paymentType}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${pay.status === 'CAPTURED' ? 'bg-emerald-55/10 text-emerald-600 border border-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>{pay.status}</span>
                </div>
              </div>
              <p className="font-black text-slate-800 text-sm">
                ₹{parseFloat(pay.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Clock className="w-4 h-4 text-[#e04169]" />
          <h2 className="text-xs font-bold text-slate-850 uppercase tracking-widest">Order Timeline</h2>
        </div>
        <div className="p-5 space-y-4">
          {order.statusHistory?.map((hist, idx) => (
            <div key={hist.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === 0 ? 'bg-[#e04169] animate-pulse ring-2 ring-[#fff0f3]' : 'bg-slate-300'}`} />
                {idx < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2 mb-2" />}
              </div>
              <div className="pb-2">
                <StatusBadge status={hist.toStatus} />
                <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                  {hist.createdAt ? new Date(hist.createdAt).toLocaleString('en-IN') : ''}
                </p>
                {hist.note && <p className="text-xs text-slate-450 mt-1 italic font-semibold">"{hist.note}"</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
