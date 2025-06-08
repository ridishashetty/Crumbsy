// Simplified distance calculation between ZIP codes
// In a real application, you would use a proper geocoding service like Google Maps API

interface ZipCodeCoordinate {
  zip: string;
  lat: number;
  lng: number;
}

// Sample ZIP code coordinates (in a real app, this would be a comprehensive database)
const zipCodeCoordinates: ZipCodeCoordinate[] = [
  { zip: '10001', lat: 40.7505, lng: -73.9934 }, // NYC
  { zip: '10002', lat: 40.7157, lng: -73.9877 },
  { zip: '10003', lat: 40.7316, lng: -73.9890 },
  { zip: '90210', lat: 34.0901, lng: -118.4065 }, // Beverly Hills
  { zip: '90211', lat: 34.0836, lng: -118.4006 },
  { zip: '94102', lat: 37.7849, lng: -122.4094 }, // San Francisco
  { zip: '94103', lat: 37.7749, lng: -122.4194 },
  { zip: '60601', lat: 41.8781, lng: -87.6298 }, // Chicago
  { zip: '60602', lat: 41.8796, lng: -87.6355 },
  { zip: '33101', lat: 25.7617, lng: -80.1918 }, // Miami
  { zip: '33102', lat: 25.7743, lng: -80.1937 },
  { zip: '75201', lat: 32.7767, lng: -96.7970 }, // Dallas
  { zip: '75202', lat: 32.7831, lng: -96.8067 },
  { zip: '98101', lat: 47.6062, lng: -122.3321 }, // Seattle
  { zip: '98102', lat: 47.6205, lng: -122.3212 },
  { zip: '02101', lat: 42.3601, lng: -71.0589 }, // Boston
  { zip: '02102', lat: 42.3584, lng: -71.0598 },
  { zip: '30301', lat: 33.7490, lng: -84.3880 }, // Atlanta
  { zip: '30302', lat: 33.7537, lng: -84.3901 },
];

// Haversine formula to calculate distance between two points on Earth
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get coordinates for a ZIP code
function getZipCoordinates(zipCode: string): { lat: number; lng: number } | null {
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  const found = zipCodeCoordinates.find(coord => coord.zip === cleanZip);
  
  if (found) {
    return { lat: found.lat, lng: found.lng };
  }
  
  // Fallback: estimate coordinates based on ZIP code patterns
  const zipNum = parseInt(cleanZip);
  
  // Very rough approximation based on ZIP code ranges
  if (zipNum >= 10000 && zipNum <= 19999) {
    // Northeast (NY, PA, etc.)
    return { lat: 40.7 + (zipNum - 10000) * 0.0001, lng: -74.0 + (zipNum - 10000) * 0.0001 };
  } else if (zipNum >= 20000 && zipNum <= 29999) {
    // Southeast (DC, VA, etc.)
    return { lat: 38.9 + (zipNum - 20000) * 0.0001, lng: -77.0 + (zipNum - 20000) * 0.0001 };
  } else if (zipNum >= 30000 && zipNum <= 39999) {
    // South (GA, FL, etc.)
    return { lat: 33.7 + (zipNum - 30000) * 0.0001, lng: -84.4 + (zipNum - 30000) * 0.0001 };
  } else if (zipNum >= 40000 && zipNum <= 49999) {
    // Midwest (KY, OH, etc.)
    return { lat: 39.1 + (zipNum - 40000) * 0.0001, lng: -84.5 + (zipNum - 40000) * 0.0001 };
  } else if (zipNum >= 50000 && zipNum <= 59999) {
    // Central (IA, MN, etc.)
    return { lat: 44.0 + (zipNum - 50000) * 0.0001, lng: -93.3 + (zipNum - 50000) * 0.0001 };
  } else if (zipNum >= 60000 && zipNum <= 69999) {
    // Great Lakes (IL, WI, etc.)
    return { lat: 41.9 + (zipNum - 60000) * 0.0001, lng: -87.6 + (zipNum - 60000) * 0.0001 };
  } else if (zipNum >= 70000 && zipNum <= 79999) {
    // South Central (TX, LA, etc.)
    return { lat: 32.8 + (zipNum - 70000) * 0.0001, lng: -96.8 + (zipNum - 70000) * 0.0001 };
  } else if (zipNum >= 80000 && zipNum <= 89999) {
    // Mountain (CO, UT, etc.)
    return { lat: 39.7 + (zipNum - 80000) * 0.0001, lng: -104.9 + (zipNum - 80000) * 0.0001 };
  } else if (zipNum >= 90000 && zipNum <= 99999) {
    // Pacific (CA, WA, etc.)
    return { lat: 34.1 + (zipNum - 90000) * 0.0001, lng: -118.4 + (zipNum - 90000) * 0.0001 };
  }
  
  return null;
}

export function calculateDistance(zip1: string, zip2: string): number {
  const coord1 = getZipCoordinates(zip1);
  const coord2 = getZipCoordinates(zip2);
  
  if (!coord1 || !coord2) {
    // Fallback to simple numeric difference if coordinates not found
    const num1 = parseInt(zip1.replace(/\D/g, ''));
    const num2 = parseInt(zip2.replace(/\D/g, ''));
    const diff = Math.abs(num1 - num2);
    return Math.floor(diff / 100); // Very rough approximation
  }
  
  const distance = haversineDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
  return Math.round(distance);
}