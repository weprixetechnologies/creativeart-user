'use client';

import { useState, useEffect } from 'react';
import { User, ShieldCheck, Bell, Save } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  
  // Notification Preferences state
  const [preferences, setPreferences] = useState({
    emailConfirmation: true,
    smsShipping: true,
    customOrderAlerts: true
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedPrefs = localStorage.getItem('notification_preferences');
    if (storedPrefs) {
      setPreferences(JSON.parse(storedPrefs));
    }
  }, []);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl sm:text-2xl font-playfair font-bold text-slate-800 flex items-center gap-2">
          Welcome back, {user.name}!
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-semibold">Manage your profile details and notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center border-b border-slate-100 pb-3">
            <User className="w-4 h-4 mr-2 text-[#e04169]" /> General Info
          </h3>
          
          <div className="space-y-3.5 text-xs font-bold text-slate-550 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Name</span>
              <span className="text-slate-800 font-bold">{user.name}</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Email Address</span>
              <span className="text-slate-800">{user.email || 'Not provided'}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Phone Number</span>
              <span className="text-slate-800">{user.phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Security / System status */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 mr-2 text-[#e04169]" /> Account Security
          </h3>

          <div className="space-y-3.5 text-xs font-bold text-slate-550 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Access Level</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fff0f3] text-[#e04169] text-[9px] font-bold border border-rose-200 uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Account Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100 uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Member Since</span>
              <span className="text-slate-800 font-semibold">July 2026</span>
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4 md:col-span-2 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 mr-2 text-[#e04169]" /> Notification Preferences
          </h3>

          <form onSubmit={handleSavePreferences} className="space-y-5 pt-1">
            <div className="space-y-4 text-xs font-bold text-slate-500">
              <label className="flex items-start gap-3.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={preferences.emailConfirmation}
                  onChange={e => setPreferences(p => ({ ...p, emailConfirmation: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded border-rose-200 text-[#e04169] focus:ring-[#e04169] accent-[#e04169] cursor-pointer"
                />
                <div>
                  <p className="text-slate-850 group-hover:text-[#e04169] transition-colors">Order billing emails</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-normal">Receive invoices, status alerts and payments details via email.</p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 cursor-pointer group select-none border-t border-slate-50 pt-4">
                <input
                  type="checkbox"
                  checked={preferences.smsShipping}
                  onChange={e => setPreferences(p => ({ ...p, smsShipping: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded border-rose-200 text-[#e04169] focus:ring-[#e04169] accent-[#e04169] cursor-pointer"
                />
                <div>
                  <p className="text-slate-850 group-hover:text-[#e04169] transition-colors">SMS delivery courier notifications</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-normal">Get instant courier SMS with live Shiprocket tracking link upon order dispatch.</p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 cursor-pointer group select-none border-t border-slate-50 pt-4">
                <input
                  type="checkbox"
                  checked={preferences.customOrderAlerts}
                  onChange={e => setPreferences(p => ({ ...p, customOrderAlerts: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 rounded border-rose-200 text-[#e04169] focus:ring-[#e04169] accent-[#e04169] cursor-pointer"
                />
                <div>
                  <p className="text-slate-850 group-hover:text-[#e04169] transition-colors">Custom project materials updates</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-normal">Receive updates immediately once custom flowers/materials are received and unpacked at the studio.</p>
                </div>
              </label>
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-600 font-bold bg-emerald-55/10 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                Notification preferences updated successfully!
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-3 bg-[#e04169] hover:bg-[#c23255] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
