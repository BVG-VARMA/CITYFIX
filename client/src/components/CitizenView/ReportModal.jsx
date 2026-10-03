import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation, 
  Flame, 
  Hammer, 
  Zap, 
  Trash2, 
  Droplets, 
  Car, 
  Trees, 
  ArrowRight,
  Info,
  Search,
  Crosshair,
  RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { reverseGeocode, searchAddress } from '../../utils/geoUtils';

// Draggable report pin icon
const createReportPinIcon = () => {
  return L.divIcon({
    className: 'report-marker-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; inset: -5px; border-radius: 50%; background: rgba(6, 182, 212, 0.45); animation: marker-pulse 1.8s infinite;"></div>
        <div style="
          width: 34px; 
          height: 34px; 
          border-radius: 50%; 
          background: #06b6d4; 
          border: 3px solid #ffffff; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #081b33;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

function MiniMapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

function MiniMapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function ReportModal({ isOpen, onClose, onRequireAuth, initialCoords }) {
  const { userLocation, createIssue, setSelectedIssue } = useIssues();
  const { user, isAuthenticated, t } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(userLocation.lat);
  const [longitude, setLongitude] = useState(userLocation.lng);
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Address search inside modal
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressContainerRef = useRef(null);

  // State for live GPS status
  const [gpsStatus, setGpsStatus] = useState(null); // 'locating' | 'locked' | 'error'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Initialize coordinates and address
  useEffect(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      setLatitude(initialCoords.lat);
      setLongitude(initialCoords.lng);
      if (initialCoords.address) {
        setAddress(initialCoords.address);
      } else {
        reverseGeocode(initialCoords.lat, initialCoords.lng).then(res => {
          if (res && res.fullAddress) setAddress(res.fullAddress);
        });
      }
    } else if (userLocation.lat && userLocation.lng) {
      setLatitude(userLocation.lat);
      setLongitude(userLocation.lng);
      if (!address) {
        reverseGeocode(userLocation.lat, userLocation.lng).then(res => {
          if (res && res.fullAddress) setAddress(res.fullAddress);
        });
      }
    }
  }, [isOpen, initialCoords, userLocation.lat, userLocation.lng]);

  // Check duplicate reports when category or coordinates change
  useEffect(() => {
    let active = true;
    async function checkNearbyDuplicates() {
      try {
        if (!latitude || !longitude || !category) return;
        const res = await api.checkDuplicates(latitude, longitude, category);
        if (active) {
          if (res.hasPotentialDuplicates) {
            setDuplicateWarning(res.candidates[0]);
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch (e) {
        // silent fail
      }
    }

    const timer = setTimeout(checkNearbyDuplicates, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [latitude, longitude, category]);

  // Address search debouncer
  const handleAddressInputChange = (val) => {
    setAddress(val);
    if (!val || val.length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    setIsSearchingAddress(true);
    const timer = setTimeout(async () => {
      const results = await searchAddress(val);
      setAddressSuggestions(results);
      setIsSearchingAddress(false);
      setShowAddressDropdown(results.length > 0);
    }, 400);

    return () => clearTimeout(timer);
  };

  // Close address dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target)) {
        setShowAddressDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update pin position and reverse geocode
  const updatePinPosition = async (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsStatus(null);

    const res = await reverseGeocode(lat, lng);
    if (res && res.fullAddress) {
      setAddress(res.fullAddress);
    }
  };

  // Select search suggestion
  const handleSelectAddressSuggestion = (item) => {
    setAddress(item.shortLabel);
    setLatitude(item.lat);
    setLongitude(item.lng);
    setShowAddressDropdown(false);
  };

  if (!isOpen) return null;

  // Handle Photo File Pick
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-detect GPS with High Accuracy + Reverse Geocoding
  const handleAutoGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(accuracy);
        setGpsStatus('locked');

        // Reverse geocode
        const res = await reverseGeocode(lat, lng);
        if (res && res.fullAddress) {
          setAddress(res.fullAddress);
        } else {
          setAddress(`GPS Fix [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus('error');
        setError('Could not get exact GPS location. Please click on the mini-map to drop the pin.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        setError('Please sign in or create a citizen account to submit reports.');
      }
      return;
    }

    if (!title.trim()) {
      setError('Please provide a brief title for the issue');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('address', address || 'Geotagged Location');
      
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (photoPreview) {
        formData.append('photoUrl', photoPreview);
      }

      const created = await createIssue(formData);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      onClose();
      setSelectedIssue(created);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please sign in or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0a192f] border border-[#1e3857] rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1e3857] bg-[#0f2438]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
                {t('reportModalTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('reportModalSubtitle')}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-200 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-300">
                    {t('duplicateDetectedTitle')} ({duplicateWarning.distanceMeters}m {t('away')})
                  </h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    {t('duplicateDetectedMsg')} ("<span className="font-semibold text-white">{duplicateWarning.title}</span>")
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              {t('step1Photo')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-[#1e3857] flex items-center justify-center group">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg">
                        {t('changePhoto')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 hover:bg-slate-800/40 transition-colors">
                    <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Click to upload or take a photo</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP supported</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-2 bg-[#0f2438]/50 p-4 rounded-2xl border border-[#1e3857]">
                <label className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16304d] hover:bg-[#1e4168] text-slate-100 font-semibold text-xs border border-[#1e3857] transition-all">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>{t('snapPhotoBtn')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Photo is geotagged with your exact pin coordinates and pushed live to municipal dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              {t('step2Category')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'pothole', labelKey: 'cat_pothole', icon: Hammer },
                { id: 'streetlight', labelKey: 'cat_streetlight', icon: Zap },
                { id: 'garbage', labelKey: 'cat_garbage', icon: Trash2 },
                { id: 'water_leak', labelKey: 'cat_water_leak', icon: Droplets },
                { id: 'traffic_hazard', labelKey: 'cat_traffic_hazard', icon: Car },
                { id: 'tree_fallen', labelKey: 'cat_tree_fallen', icon: Trees }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-[#0f2438]/60 border-[#1e3857] text-slate-300 hover:bg-[#16304d]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(cat.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Mini-Map & Geolocation Pin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('step3Location')}</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGPS}
                disabled={gpsStatus === 'locating'}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/25 transition-all"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                <span>{gpsStatus === 'locating' ? 'Locking GPS...' : t('autoCaptureGPS')}</span>
              </button>
            </div>
            
            {/* Address Search / Input Bar with Autocomplete */}
            <div ref={addressContainerRef} className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  placeholder="Type street address or landmark (updates pin location)..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {isSearchingAddress && (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin absolute right-3.5 top-3" />
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showAddressDropdown && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a192f] border border-cyan-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-[#1e3857]/60">
                  {addressSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAddressSuggestion(item)}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#16304d] transition-colors flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-100 truncate">{item.shortLabel}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.displayName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Embedded Interactive Mini-Map */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[#1e3857] bg-[#07111e] shadow-inner">
              <MapContainer
                center={[latitude, longitude]}
                zoom={15}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <MiniMapUpdater center={[latitude, longitude]} />
                <MiniMapClickHandler onLocationChange={updatePinPosition} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />

                <Marker
                  position={[latitude, longitude]}
                  draggable={true}
                  icon={createReportPinIcon()}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      updatePinPosition(position.lat, position.lng);
                    }
                  }}
                />
              </MapContainer>

              {/* Overlay Hint on Mini-Map */}
              <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex items-center justify-between z-[400] text-[10px]">
                <span className="bg-[#0a192f]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1e3857] text-slate-300">
                  🎯 Drag pin or click map to adjust location
                </span>
                <span className="bg-[#0a192f]/90 backdrop-blur-md px-2 py-1 rounded-lg border border-[#1e3857] text-cyan-400 font-mono">
                  [{Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}]
                </span>
              </div>
            </div>
          </div>

          {/* Title & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('issueSummaryTitle')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole on main road"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('priority')}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="low">{t('priorityLow')}</option>
                <option value="medium">{t('priorityMedium')}</option>
                <option value="high">{t('priorityHigh')}</option>
                <option value="critical">{t('priorityCritical')}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {t('detailedDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('descPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#1e3857] flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Socket.io Real-time Push</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#16304d] transition-colors"
              >
                {t('cancelBtn')}
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>{t('submitReportBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
