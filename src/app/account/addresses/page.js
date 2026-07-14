'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import { MapPin, Plus, Trash2, AlertCircle, Loader } from 'lucide-react';

const emptyForm = { label: '', contactName: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', phone: '' };

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient.get('/addresses');
      setAddresses(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError(null);
    try {
      const data = await apiClient.post('/addresses', form);
      setAddresses(prev => [...prev, data]);
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const setDefault = async (id) => {
    try {
      await apiClient.patch(`/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    } catch (err) { alert(err.message); }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4 border-b border-rose-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800 flex items-center gap-2.5">
            <MapPin className="w-5.5 h-5.5 text-[#e04169]" /> Address Book
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Manage your saved delivery addresses</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-[#fafbfc] border border-rose-100 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top-3 duration-250">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-rose-100 pb-2">New Delivery Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'contactName', label: 'Contact Name *', placeholder: 'Full name for delivery' },
              { key: 'phone', label: 'Phone *', placeholder: '+91 XXXXX XXXXX' },
              { key: 'label', label: 'Label', placeholder: 'Home / Work / Other' },
              { key: 'line1', label: 'Address Line 1 *', placeholder: 'Street / Building' },
              { key: 'line2', label: 'Address Line 2', placeholder: 'Apartment, Floor etc.' },
              { key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' },
              { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' },
              { key: 'pincode', label: 'Pincode *', placeholder: '400001' },
              { key: 'country', label: 'Country', placeholder: 'India' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={key === 'contactName' || key === 'phone' || key === 'line1' || key === 'city' || key === 'state' || key === 'pincode'}
                  className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-[#e04169] transition-all"
                />
              </div>
            ))}
          </div>
          {formError && (
            <p className="text-xs text-[#e04169] bg-[#fff0f3] border border-rose-100 rounded-xl px-3.5 py-2.5">{formError}</p>
          )}
          <div className="flex gap-2.5 pt-2 border-t border-rose-100">
            <button 
              type="button" 
              onClick={() => { setShowForm(false); setFormError(null); }} 
              className="px-5 py-2.5 bg-white border-2 border-[#e04169] text-[#e04169] hover:bg-[#fff0f3] rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={formLoading} 
              className="px-6 py-2.5 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              {formLoading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-[#e04169]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-10 h-10 text-[#e04169]" />
          <p className="text-xs font-bold text-slate-450">{error}</p>
          <button onClick={fetchAddresses} className="text-[#e04169] text-xs hover:underline font-bold">Retry</button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center text-slate-450">
          <MapPin className="w-12 h-12 text-rose-200 opacity-80 animate-pulse" />
          <p className="text-xs font-bold">No saved addresses yet. Click Add Address above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-white border rounded-3xl p-5 hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col justify-between ${
                addr.isDefault ? 'border-[#e04169] ring-2 ring-[#fff0f3]' : 'border-slate-100'
              }`}
            >
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-800 text-sm">{addr.label || 'Address'}</span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-1 text-[9px] bg-[#fff0f3] text-[#e04169] px-2.5 py-0.5 rounded-full border border-rose-200 font-extrabold uppercase tracking-wider">
                      Default
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 font-medium">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-xs text-slate-450 font-bold">{addr.city}, {addr.state} — {addr.pincode}</p>
                  {addr.phone && <p className="text-[10px] text-slate-455 font-bold mt-1">📞 {addr.phone}</p>}
                </div>
              </div>

              <div className="flex justify-end items-center gap-4 w-full border-t border-slate-50 pt-3.5 mt-4 text-[10px] font-bold uppercase tracking-wider">
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="text-slate-400 hover:text-[#e04169] transition-colors cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="p-1 text-slate-450 hover:text-[#e04169] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
