import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Save, 
  RefreshCw,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [ward, setWard] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('custom');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Preset avatar styles
  const PRESET_AVATARS = [
    {
      id: 'seal_blue',
      name: 'Municipal Crest (Cyan)',
      icon: '🏛️',
      getUrl: (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'Municipal Admin')}&background=0284c7&color=ffffff&bold=true`
    },
    {
      id: 'shield_teal',
      name: 'Dispatch Shield (Teal)',
      icon: '🛡️',
      getUrl: (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'Dispatch Ops')}&background=0f766e&color=ffffff&bold=true`
    },
    {
      id: 'ops_green',
      name: 'Field Operations (Emerald)',
      icon: '⚡',
      getUrl: (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'Field Ops')}&background=059669&color=ffffff&bold=true`
    },
    {
      id: 'govt_indigo',
      name: 'Command Emblem (Indigo)',
      icon: '🏢',
      getUrl: (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'Command Center')}&background=4f46e5&color=ffffff&bold=true`
    },
    {
      id: 'gold_crest',
      name: 'Honorary Seal (Gold)',
      icon: '⭐',
      getUrl: (n) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'Commissioner')}&background=d97706&color=ffffff&bold=true`
    }
  ];

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setBadge(user.badge || 'Municipal Officer');
      setWard(user.ward || 'Central Municipal HQ');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setError(null);
      setSuccess(false);

      // Check if matches a preset
      const match = PRESET_AVATARS.find(p => p.getUrl(user.name) === user.avatar);
      if (match) {
        setSelectedPreset(match.id);
      } else {
        setSelectedPreset('custom');
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setAvatar(preset.getUrl(name));
  };

  const handleNameChange = (val) => {
    setName(val);
    if (selectedPreset !== 'custom') {
      const activePreset = PRESET_AVATARS.find(p => p.id === selectedPreset);
      if (activePreset) {
        setAvatar(activePreset.getUrl(val));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a valid full name or official title.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Final avatar resolution
      let finalAvatar = avatar;
      if (!finalAvatar || selectedPreset !== 'custom') {
        const activePreset = PRESET_AVATARS.find(p => p.id === selectedPreset) || PRESET_AVATARS[0];
        finalAvatar = activePreset.getUrl(name);
      }

      await updateProfile({
        name: name.trim(),
        badge: badge.trim(),
        ward: ward.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: finalAvatar
      });

      setSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0a192f] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        
        {/* Glow Accent */}
        <div className="absolute -right-24 -top-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0f2438] border-b border-[#1e3857] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
                <span>Edit Officer Profile</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {user?.role === 'admin' ? 'Admin' : 'Citizen'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Customize your official name, municipal badge, and profile emblem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#16304d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10 max-h-[75vh] overflow-y-auto">
          
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2238] to-[#102d4a] border border-cyan-500/30 flex items-center gap-4 shadow-lg">
            <div className="relative shrink-0">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Admin')}&background=0284c7&color=ffffff&bold=true`}
                alt={name || 'Preview'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md shadow-cyan-500/20 bg-slate-800"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Admin')}&background=0284c7&color=ffffff&bold=true`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a192f] flex items-center justify-center text-[10px] text-white">
                ✓
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-slate-100 truncate text-base">
                  {name || 'Municipal Officer'}
                </p>
                <BadgeCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
              <p className="text-xs text-cyan-300 font-medium truncate mt-0.5">
                {badge || 'Municipal Administrator'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{ward || 'Central Municipal HQ'}</span>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Officer profile updated successfully!</span>
            </div>
          )}

          {/* Avatar / Crest Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Choose Profile Emblem / Badge Style
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                        : 'bg-[#0f2438] border-[#1e3857] text-slate-300 hover:bg-[#16304d]'
                    }`}
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{preset.name}</p>
                    </div>
                  </button>
                );
              })}

              {/* Custom URL Choice */}
              <button
                type="button"
                onClick={() => setSelectedPreset('custom')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'custom'
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0f2438] border-[#1e3857] text-slate-300 hover:bg-[#16304d]'
                }`}
              >
                <span className="text-lg">🔗</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Custom Image URL</p>
                </div>
              </button>
            </div>

            {selectedPreset === 'custom' && (
              <div className="mt-2">
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/my-official-photo.jpg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter direct image URL (.png, .jpg, .svg)
                </p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Name / Title *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Municipal Commissioner"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Badge / Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Designation / Badge
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Municipal Lead Dispatcher"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Ward / Office Division */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Department / Office Location
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Central Municipal HQ"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cityfix.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Contact Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-400 text-xs font-mono font-semibold pointer-events-none">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543200"
                  maxLength={10}
                  className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e3857]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#0f2438] hover:bg-[#16304d] text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Officer Profile</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
