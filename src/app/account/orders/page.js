'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import {
  Package,
  Search,
  ChevronDown,
  Clock,
  ShieldCheck,
  Truck,
  ExternalLink,
  ArrowRight,
  ShoppingBag,
  Loader,
  AlertCircle,
  FileText,
  Eye,
  CreditCard
} from 'lucide-react';

const STATUS_META = {
  PLACED: { label: 'Placed', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  PAID: { label: 'Paid', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  PACKED: { label: 'Packed', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  SHIPPED: { label: 'Shipped', color: 'bg-violet-50 text-violet-650 border-violet-100' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  CANCELLED: { label: 'Cancelled', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  REFUNDED: { label: 'Refunded', color: 'bg-orange-50 text-orange-650 border-orange-100' },
  BOOKED_PENDING_ADVANCE: { label: 'Pending Advance', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  AWAITING_MATERIAL_DISPATCH: { label: 'Awaiting Material', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  MATERIAL_IN_TRANSIT: { label: 'Material In Transit', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  MATERIAL_RECEIVED: { label: 'Material Received', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  READY_PENDING_FINAL_PAYMENT: { label: 'Ready for Balance', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  FINAL_PAID: { label: 'Final Paid', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  ON_HOLD: { label: 'On Hold', color: 'bg-slate-50 text-slate-500 border-slate-100' },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter, search & sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient.get('/orders');
      setOrders(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Compute KPI Dashboard stats
  const kpis = useMemo(() => {
    const stats = {
      total: orders.length,
      transit: 0,
      delivered: 0,
      pendingPay: 0
    };
    orders.forEach(o => {
      if (['SHIPPED', 'MATERIAL_IN_TRANSIT'].includes(o.status)) stats.transit += 1;
      if (o.status === 'DELIVERED') stats.delivered += 1;
      if (['BOOKED_PENDING_ADVANCE', 'READY_PENDING_FINAL_PAYMENT'].includes(o.status)) stats.pendingPay += 1;
    });
    return stats;
  }, [orders]);

  // Handle client-side search, filtering and sorting
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Filter by active pill
    if (activeFilter === 'active') {
      result = result.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    } else if (activeFilter === 'transit') {
      result = result.filter(o => ['SHIPPED', 'MATERIAL_IN_TRANSIT'].includes(o.status));
    } else if (activeFilter === 'delivered') {
      result = result.filter(o => o.status === 'DELIVERED');
    } else if (activeFilter === 'custom') {
      result = result.filter(o => o.orderType === 'DUAL_PAYMENT');
    } else if (activeFilter === 'cancelled') {
      result = result.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status));
    }

    // Filter by search text (number, items names, status)
    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => {
        const matchesNumber = o.orderNumber?.toLowerCase().includes(term);
        const matchesStatus = (STATUS_META[o.status]?.label || o.status)?.toLowerCase().includes(term);
        const matchesItem = o.items?.some(i => i.productNameSnapshot?.toLowerCase().includes(term));
        return matchesNumber || matchesStatus || matchesItem;
      });
    }

    // Sort order
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
    }

    return result;
  }, [orders, activeFilter, searchTerm, sortBy]);

  // Stepper timeline helper
  const renderHorizontalStepper = (order) => {
    const isCustom = order.orderType === 'DUAL_PAYMENT';

    let stages = [];
    let currentIdx = 0;

    if (!isCustom) {
      stages = ['Placed', 'Packed', 'Shipped', 'Delivered'];
      if (['PLACED', 'PAID'].includes(order.status)) currentIdx = 0;
      else if (order.status === 'PACKED') currentIdx = 1;
      else if (order.status === 'SHIPPED') currentIdx = 2;
      else if (order.status === 'DELIVERED') currentIdx = 3;
      else currentIdx = 0;
    } else {
      stages = ['Booked', 'Material', 'Production', 'Ready', 'Delivered'];
      if (order.status === 'BOOKED_PENDING_ADVANCE') currentIdx = -1;
      else if (['ADVANCE_PAID', 'AWAITING_MATERIAL_DISPATCH'].includes(order.status)) currentIdx = 0;
      else if (['MATERIAL_IN_TRANSIT', 'MATERIAL_RECEIVED'].includes(order.status)) currentIdx = 1;
      else if (order.status === 'IN_PRODUCTION') currentIdx = 2;
      else if (['READY_PENDING_FINAL_PAYMENT', 'FINAL_PAID'].includes(order.status)) currentIdx = 3;
      else if (['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status)) currentIdx = 4;
    }

    return (
      <div className="space-y-4">
        {/* Status description */}
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e04169] animate-pulse" />
          {order.status === 'PACKED' && 'Your order is packed and ready for dispatch.'}
          {order.status === 'SHIPPED' && 'Your order is on the way!'}
          {order.status === 'DELIVERED' && 'Your order has been successfully delivered.'}
          {order.status === 'BOOKED_PENDING_ADVANCE' && 'Awaiting booking advance payment.'}
          {order.status === 'AWAITING_MATERIAL_DISPATCH' && 'Awaiting material shipment submission.'}
          {order.status === 'MATERIAL_IN_TRANSIT' && 'Raw materials are in transit to our studio.'}
          {order.status === 'MATERIAL_RECEIVED' && 'Raw materials received at studio. Verifying quality.'}
          {order.status === 'IN_PRODUCTION' && 'Production is underway at our preservation studio.'}
          {order.status === 'READY_PENDING_FINAL_PAYMENT' && 'Production complete. Please pay the balance.'}
          {order.status === 'FINAL_PAID' && 'Balance payment confirmed. Order ready to pack.'}
          {!['PACKED', 'SHIPPED', 'DELIVERED', 'BOOKED_PENDING_ADVANCE', 'AWAITING_MATERIAL_DISPATCH', 'MATERIAL_IN_TRANSIT', 'MATERIAL_RECEIVED', 'IN_PRODUCTION', 'READY_PENDING_FINAL_PAYMENT', 'FINAL_PAID'].includes(order.status) && 'Order processed successfully.'}
        </div>

        {/* Stepper bar */}
        <div className="relative flex items-center justify-between w-full pt-1.5">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#e04169] rounded transition-all duration-500 z-0"
            style={{ width: `${stages.length > 1 ? (Math.max(0, currentIdx) / (stages.length - 1)) * 100 : 0}%` }}
          />
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isCompleted
                  ? 'bg-[#e04169] border-[#e04169] ring-2 ring-rose-100'
                  : 'bg-white border-slate-200'
                  } ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-2.5 ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Delivery Timeline text */}
        <div className="flex items-center justify-between gap-4 pt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>
            Expected Delivery: {order.createdAt ? new Date(new Date(order.createdAt).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
          </span>
          {order.status === 'SHIPPED' && (
            <a
              href="https://track.shiprocket.in/"
              target="_blank"
              rel="noreferrer"
              className="text-[#e04169] hover:underline flex items-center gap-1 font-extrabold"
            >
              Live Tracking <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* Header and Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rose-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-playfair font-black text-slate-800">Order History</h1>
          <p className="text-xs text-slate-450 mt-1 font-semibold">Track, manage and view all your orders in one place.</p>
        </div>

        {/* Search and Sort Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, product..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e04169] transition-all min-w-[220px]"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:border-[#e04169] transition-all cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Card 1: Total Orders */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4.5 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#fff0f3] flex items-center justify-center text-[#e04169] border border-rose-100 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-850 leading-none">{kpis.total}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Orders</p>
            </div>
          </div>

          {/* Card 2: In Transit */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4.5 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-850 leading-none">{kpis.transit}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">In Transit</p>
            </div>
          </div>

          {/* Card 3: Delivered */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4.5 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-850 leading-none">{kpis.delivered}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Delivered</p>
            </div>
          </div>

          {/* Card 4: Pending Action */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4.5 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-850 leading-none">{kpis.pendingPay}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pending Pay</p>
            </div>
          </div>

        </div>
      )}

      {/* Horizontal Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none no-scrollbar">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'active', label: 'Active' },
          { key: 'transit', label: 'In Transit' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'custom', label: 'Custom Orders' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4.5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${activeFilter === filter.key
              ? 'bg-[#e04169] text-white border-[#e04169] shadow-sm shadow-rose-600/10 scale-[1.01]'
              : 'bg-white text-slate-500 border-slate-100 hover:border-rose-100 hover:text-[#e04169]'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List / Loading / Empty handler */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 animate-spin text-[#e04169]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-10 h-10 text-[#e04169]" />
          <p className="text-xs font-bold text-slate-450">{error}</p>
          <button onClick={fetchOrders} className="text-[#e04169] text-xs hover:underline font-bold">Retry</button>
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 text-xs font-bold">No matching orders found.</p>
          <Link href="/shop" className="text-xs text-[#e04169] hover:underline font-bold">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedOrders.map(order => {
            const isDual = order.orderType === 'DUAL_PAYMENT';
            const firstItem = order.items?.[0] || {};

            // Extract custom choices image or defaults
            const itemImg = firstItem.productImage || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=300&auto=format&fit=crop';

            // Find Recipient details or custom choice names
            let recipient = '';
            if (firstItem.customFieldValues) {
              const cfVals = typeof firstItem.customFieldValues === 'string' ? JSON.parse(firstItem.customFieldValues) : firstItem.customFieldValues;
              const nameKey = Object.keys(cfVals).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('text'));
              if (nameKey && cfVals[nameKey]?.value) {
                recipient = `For ${cfVals[nameKey].value}`;
              }
            }
            if (!recipient) {
              recipient = isDual ? 'For Preservation' : 'Gift Item';
            }

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md hover:border-rose-100 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >

                {/* Column 1: Image & Details */}
                <div className="lg:col-span-4 flex items-center gap-4 min-w-0">
                  <div className="w-24 h-24 sm:w-26 sm:h-26 bg-[#fafbfc] rounded-2xl overflow-hidden border border-slate-100 shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={itemImg} alt={firstItem.productNameSnapshot || 'Product'} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider leading-none ${isDual
                        ? 'bg-rose-50 border-rose-100 text-[#e04169]'
                        : 'bg-slate-50 border-slate-200/60 text-slate-505'
                        }`}>
                        {isDual ? 'Custom Project' : 'Standard'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-805 text-sm sm:text-base leading-tight truncate">
                      {firstItem.productNameSnapshot || 'Floral Preservation Order'}
                    </h3>

                    <p className="text-[10px] text-slate-450 font-bold truncate">
                      {recipient}
                    </p>

                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {order.orderNumber} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>

                {/* Column 2: Horizontal Stepper Tracking */}
                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 pt-5 lg:pt-0 lg:px-6">
                  {renderHorizontalStepper(order)}
                </div>

                {/* Column 3: Amount details and quick action actions */}
                <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4 text-right">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Amount</p>
                    <p className="text-base sm:text-lg font-black text-slate-850">
                      ₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Amount breakdown logs */}
                    <div className="text-[9.5px] font-bold text-slate-455 space-y-0.5">
                      {isDual ? (
                        <>
                          <div className="flex justify-end gap-1.5">
                            <span className="text-slate-400">Paid Deposit:</span>
                            <span className="text-slate-700">₹{parseFloat(order.advanceAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <span className="text-slate-400">Balance:</span>
                            <span className="text-[#e04169]">₹{parseFloat(order.finalAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5 text-emerald-600">
                          <CreditCard className="w-3 h-3 shrink-0" />
                          <span>Paid Successful</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap justify-end gap-2 text-[10px] font-bold uppercase tracking-wider">
                    {order.status === 'SHIPPED' && (
                      <a
                        href="https://track.shiprocket.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-4 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full transition-all shadow-sm hover:scale-[1.01]"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track Order
                      </a>
                    )}

                    {order.status === 'READY_PENDING_FINAL_PAYMENT' && (
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center gap-1 px-4.5 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full transition-all shadow-sm hover:scale-[1.01]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pay Balance
                      </Link>
                    )}

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#e04169] hover:border-rose-100 rounded-full transition-all"
                    >
                      Details
                    </Link>

                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1'}/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-[#fff0f3] hover:text-[#e04169] hover:border-rose-100 rounded-full transition-all flex items-center justify-center"
                      title="Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
