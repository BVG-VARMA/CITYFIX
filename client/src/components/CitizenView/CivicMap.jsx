import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  ThumbsUp, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  Search,
  Crosshair,
  Layers,
  Sparkles,
  PlusCircle,
  X,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';
import { reverseGeocode, searchAddress } from '../../utils/geoUtils';

// Fix Leaflet's default icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category Icon SVG generator
const getCategorySvg = (category) => {
  switch (category) {
    case 'pothole':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 3.26-1.25-1.25a2.12 2.12 0 0 0-3 0l-4.5 4.5 4.24 4.25 4.5-4.5a2.12 2.12 0 0 0 0-3Z"/></svg>`;
    case 'streetlight':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`;
    case 'garbage':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
    case 'water_leak':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'traffic_hazard':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
    case 'tree_fallen':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }
};

// Create custom animated Leaflet marker icon
const createCivicPinIcon = (issue) => {
  const isResolved = issue.status === 'resolved';
  const isInProgress = issue.status === 'in_progress';
  
  let haloBg = 'rgba(239, 68, 68, 0.35)';
  let borderColor = '#ef4444';

  if (isResolved) {
    haloBg = 'rgba(16, 185, 129, 0.35)';
    borderColor = '#10b981';
  } else if (isInProgress) {
    haloBg = 'rgba(245, 158, 11, 0.35)';
    borderColor = '#f59e0b';
  }

  const svgInner = getCategorySvg(issue.category);

  const html = `
    <div style="position: relative; width: 36px; height: 36px;">
      <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${haloBg}; animation: marker-pulse 2.2s infinite ease-out;"></div>
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #0f2238;
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        ${svgInner}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-civic-pin',
    html: html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

// Target pin for user clicks on map
const createTargetPinIcon = () => {
  return L.divIcon({
    className: 'custom-target-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px;">
        <div style="position: absolute; inset: -6px; border-radius: 50%; background: rgba(6, 182, 212, 0.45); animation: marker-pulse 1.8s infinite ease-out;"></div>
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #06b6d4;
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #081b33;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Direct Map Hook Capturer
function MapInstanceCapturer({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// Map Click Listener
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function CivicMap({ onOpenReportWithCoords }) {
  const { filteredIssues, userLocation, setUserLocation, detectLocation, setSelectedIssue, upvoteIssue } = useIssues();
  const { t } = useAuth();
  
  const [mapInstance, setMapInstance] = useState(null);
  const [mapCenter, setMapCenter] = useState([userLocation.lat, userLocation.lng]);
  const [zoom, setZoom] = useState(14);
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  
  // Interactive Pin Drop State
  const [clickedPin, setClickedPin] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Synchronize map center when userLocation changes
  useEffect(() => {
    if (userLocation.lat && userLocation.lng) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      if (userLocation.hasLocation) {
        setZoom(15);
        if (mapInstance) {
          mapInstance.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
        }
      }
    }
  }, [userLocation.lat, userLocation.lng, userLocation.hasLocation, mapInstance]);

  // Handle map click to drop a pin
  const handleMapClick = async (latlng) => {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    setClickedPin({
      lat,
      lng,
      address: 'Fetching street name...'
    });

    const res = await reverseGeocode(lat, lng);
    if (res && res.fullAddress) {
      setClickedPin(prev => prev && prev.lat === lat && prev.lng === lng ? {
        ...prev,
        address: res.fullAddress
      } : prev);
    } else {
      setClickedPin(prev => prev && prev.lat === lat && prev.lng === lng ? {
        ...prev,
        address: `Geotag [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
      } : prev);
    }
  };

  // Center on user location with GPS trigger & high priority flyTo
  const handleCenterOnUser = async () => {
    try {
      setIsLocating(true);
      setLocationNotice(null);
      const loc = await detectLocation();
      if (loc && loc.lat && loc.lng) {
        setMapCenter([loc.lat, loc.lng]);
        setZoom(16);
        if (mapInstance) {
          mapInstance.flyTo([loc.lat, loc.lng], 16, { duration: 1.5 });
        }
        setLocationNotice({
          type: 'success',
          text: loc.source === 'gps' 
            ? `📍 GPS Location Locked (±${loc.accuracy || 10}m accuracy)`
            : `📍 Location centered on ${loc.city || 'detected region'}`
        });
        setTimeout(() => setLocationNotice(null), 4000);
      } else {
        setLocationNotice({
          type: 'error',
          text: 'Location permission was denied or unavailable. You can search your city in the search bar.'
        });
        setTimeout(() => setLocationNotice(null), 5000);
      }
    } catch (e) {
      setLocationNotice({
        type: 'error',
        text: 'Could not resolve location. Please allow browser location access.'
      });
      setTimeout(() => setLocationNotice(null), 5000);
    } finally {
      setIsLocating(false);
    }
  };

  // Search Address / Landmark Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setShowResultsDropdown(results.length > 0);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResultsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Result Select
  const handleSelectSearchResult = (result) => {
    setShowResultsDropdown(false);
    setSearchQuery('');
    
    const newCoords = {
      lat: result.lat,
      lng: result.lng,
      hasLocation: true,
      city: result.shortLabel,
      source: 'search'
    };

    setUserLocation(newCoords);
    setMapCenter([result.lat, result.lng]);
    setZoom(16);
    if (mapInstance) {
      mapInstance.flyTo([result.lat, result.lng], 16, { duration: 1.5 });
    }

    // Also drop temporary pin for quick report
    setClickedPin({
      lat: result.lat,
      lng: result.lng,
      address: result.shortLabel
    });
  };

  const categoryMap = {
    pothole: 'cat_pothole',
    streetlight: 'cat_streetlight',
    garbage: 'cat_garbage',
    water_leak: 'cat_water_leak',
    traffic_hazard: 'cat_traffic_hazard',
    tree_fallen: 'cat_tree_fallen',
    other: 'cat_other'
  };

  return (
    <div className="relative isolate z-0 w-full h-[520px] lg:h-[640px] rounded-3xl overflow-hidden border border-[#1e3857] shadow-2xl bg-[#0a1628]">
      
      {/* Floating Top Bar: Location Search + Control Actions */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pointer-events-none">
        
        {/* Search Bar / City Jumper */}
        <div ref={searchContainerRef} className="pointer-events-auto relative w-full sm:w-80 md:w-96">
          <div className="flex items-center bg-[#0a192f]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-500/40 shadow-xl focus-within:border-cyan-400 transition-all">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResultsDropdown(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowResultsDropdown(true);
              }}
              placeholder="Search any city, street, or landmark..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-xs focus:outline-none"
            />
            {isSearching && (
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0 ml-1" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowResultsDropdown(false);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0a192f] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 divide-y divide-[#1e3857]/60">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#16304d] transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">{item.shortLabel}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls & Location Indicator */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0a192f]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#1e3857] shadow-xl self-end sm:self-auto">
          
          {/* Spatial Filter Status Tag */}
          <div className="px-3 py-1 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-cyan-300 hidden md:inline">
              {userLocation.city ? `${userLocation.city}: ` : ''}{filteredIssues.length} {t('issuesActive')}
            </span>
          </div>

          <button
            onClick={() => setShowRadiusCircle(!showRadiusCircle)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showRadiusCircle ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
            title="500m PostGIS spatial query radius"
          >
            {t('radius500mBtn')}
          </button>
          
          <button
            onClick={handleCenterOnUser}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95 disabled:opacity-50"
            title="Find and center on my GPS location"
          >
            <Navigation className={`w-3.5 h-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : t('myLocationBtn')}</span>
          </button>
        </div>

      </div>

      {/* Location Status Notice Banner */}
      {locationNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[450] pointer-events-none transition-all duration-300">
          <div className={`px-4 py-2 rounded-2xl backdrop-blur-md shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
            locationNotice.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
          }`}>
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span>{locationNotice.text}</span>
          </div>
        </div>
      )}

      {/* Floating Bottom Hint: Click on map to drop pin */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none hidden sm:block">
        <div className="bg-[#0a192f]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#1e3857] text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>💡 <strong>Tip:</strong> Click anywhere on the map to pin and report an issue</span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapInstanceCapturer onMapReady={setMapInstance} />
        <MapUpdater center={mapCenter} zoom={zoom} />
        <MapEventsHandler onMapClick={handleMapClick} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Location Radar Marker */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: 'user-pin',
            html: `
              <div style="position: relative; width: 26px; height: 26px;">
                <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: marker-pulse 2s infinite;"></div>
                <div style="width: 26px; height: 26px; border-radius: 50%; background: #06b6d4; border: 3px solid white; box-shadow: 0 0 14px #06b6d4; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
                </div>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })}
        >
          <Popup>
            <div className="text-slate-100 text-xs py-1">
              <p className="font-bold text-cyan-400 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" /> {userLocation.source === 'gps' ? t('yourGPSFix') : (userLocation.city ? `Detected Area (${userLocation.city})` : t('yourGPSFix'))}
              </p>
              <p className="text-slate-300 mt-1 font-mono text-[11px]">
                [{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}]
              </p>
              {userLocation.accuracy && (
                <p className="text-[10px] text-cyan-400 mt-0.5">
                  Accuracy: ±{userLocation.accuracy}m
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* 500m PostGIS Query Radius Overlay */}
        {showRadiusCircle && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.08,
              dashArray: '6, 6',
              weight: 1.5
            }}
          />
        )}

        {/* Clicked / Dropped Location Pin Marker */}
        {clickedPin && (
          <Marker
            position={[clickedPin.lat, clickedPin.lng]}
            icon={createTargetPinIcon()}
          >
            <Popup autoPan={true} className="civic-custom-popup">
              <div className="w-60 text-slate-100 p-1 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#1e3857]">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5" /> Selected Location
                  </span>
                  <button
                    onClick={() => setClickedPin(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-xs text-slate-200 leading-snug">
                  {clickedPin.address}
                </p>

                <p className="text-[10px] text-slate-400 font-mono">
                  [{clickedPin.lat.toFixed(5)}, {clickedPin.lng.toFixed(5)}]
                </p>

                <div className="pt-1 flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      if (onOpenReportWithCoords) {
                        onOpenReportWithCoords({
                          lat: clickedPin.lat,
                          lng: clickedPin.lng,
                          address: clickedPin.address
                        });
                      }
                      setClickedPin(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Report Issue Here</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserLocation({
                        lat: clickedPin.lat,
                        lng: clickedPin.lng,
                        hasLocation: true,
                        city: clickedPin.address,
                        source: 'manual'
                      });
                      setClickedPin(null);
                    }}
                    className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    Set as my focal point
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Issue Pins */}
        {filteredIssues.map((issue) => {
          const transKey = categoryMap[issue.category];
          const catLabel = transKey ? t(transKey) : (issue.categoryLabel || issue.category);

          return (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={createCivicPinIcon(issue)}
            >
              <Popup className="civic-custom-popup">
                <div className="w-64 sm:w-72 text-slate-100 p-1">
                  
                  {/* Photo Header */}
                  {(issue.resolvedPhotoUrl || issue.photoUrl) && (
                    <div className="relative h-28 rounded-xl overflow-hidden mb-2.5 bg-slate-900 border border-[#1e3857]">
                      <img
                        src={issue.resolvedPhotoUrl || issue.photoUrl}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                        {catLabel}
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          issue.status === 'resolved'
                            ? 'bg-emerald-500/90 text-white'
                            : issue.status === 'in_progress'
                            ? 'bg-amber-500/90 text-slate-950'
                            : 'bg-rose-500/90 text-white'
                        }`}>
                          {issue.status === 'resolved' ? (issue.resolvedPhotoUrl ? '✓ Fixed Photo' : t('resolved')) : issue.status === 'in_progress' ? t('inProgress') : t('open')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <h4 className="font-semibold text-sm text-slate-100 leading-snug">
                    {issue.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 py-1.5 border-y border-[#1e3857]">
                    <span className="truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {issue.address}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => upvoteIssue(issue.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16304d] hover:bg-[#1e4168] text-slate-200 text-xs font-semibold transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{issue.upvotes || 0} {t('upvotes')}</span>
                    </button>

                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <span>{t('trackIssueBtn')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
