/**
 * Utility functions for Geocoding, IP Geolocation, and Address Resolution
 * Using OpenStreetMap Nominatim and Free IP Geolocation APIs
 */

/**
 * Fetch approximate user location using public IP geolocation as fallback
 * if browser navigator.geolocation is blocked or unavailable
 */
export async function getIpLocation() {
  const providers = [
    async () => {
      const res = await fetch('https://freeipapi.com/api/json');
      if (!res.ok) throw new Error('freeipapi failed');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          city: data.cityName || data.regionName || 'Detected Region',
          country: data.countryName || 'India',
          source: 'ip'
        };
      }
      throw new Error('Invalid freeipapi data');
    },
    async () => {
      const res = await fetch('https://ipapi.is/json/');
      if (!res.ok) throw new Error('ipapi.is failed');
      const data = await res.json();
      if (data && data.location && data.location.latitude && data.location.longitude) {
        return {
          lat: parseFloat(data.location.latitude),
          lng: parseFloat(data.location.longitude),
          city: data.location.city || data.location.state || 'Detected Region',
          country: data.location.country || '',
          source: 'ip'
        };
      }
      throw new Error('Invalid ipapi.is data');
    }
  ];

  for (const provider of providers) {
    try {
      const location = await provider();
      if (location && location.lat && location.lng) {
        return location;
      }
    } catch (e) {
      // try next provider
    }
  }

  return null;
}

/**
 * Reverse Geocode coordinates to a clean address string
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;

    const addressObj = data.address || {};
    const road = addressObj.road || addressObj.pedestrian || addressObj.street || addressObj.path || '';
    const neighbourhood = addressObj.neighbourhood || addressObj.suburb || addressObj.residential || '';
    const city = addressObj.city || addressObj.town || addressObj.village || addressObj.state_district || addressObj.county || '';
    const state = addressObj.state || '';
    const postcode = addressObj.postcode || '';

    // Construct a concise, user-friendly address
    const parts = [];
    if (road) parts.push(road);
    if (neighbourhood && neighbourhood !== road) parts.push(neighbourhood);
    if (city && city !== neighbourhood) parts.push(city);
    if (state && !parts.includes(state)) parts.push(state);

    const cleanAddress = parts.length > 0 ? parts.join(', ') : (data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `Location [${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}]`);

    return {
      fullAddress: cleanAddress,
      displayName: data.display_name,
      city: city || 'City',
      postcode
    };
  } catch (err) {
    console.warn('Reverse geocode error:', err);
    return null;
  }
}

/**
 * Forward Geocode an address/city/landmark query to coordinates
 */
export async function searchAddress(query) {
  if (!query || !query.trim()) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const addressObj = item.address || {};
      const road = addressObj.road || addressObj.pedestrian || addressObj.street || '';
      const suburb = addressObj.suburb || addressObj.neighbourhood || '';
      const city = addressObj.city || addressObj.town || addressObj.village || addressObj.state_district || '';
      const state = addressObj.state || '';

      const parts = [];
      if (road) parts.push(road);
      if (suburb) parts.push(suburb);
      if (city) parts.push(city);
      if (state) parts.push(state);

      const label = parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 3).join(',');

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        shortLabel: label,
        type: item.type || item.class
      };
    });
  } catch (err) {
    console.warn('Forward geocode search error:', err);
    return [];
  }
}
