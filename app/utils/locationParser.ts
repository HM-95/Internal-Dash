interface ParsedLocation {
  city: string | null;
  country: string;
  region: 'United States' | 'Europe' | 'Asia' | 'Middle East' | 'Global';
  isGlobal: boolean;
  rawLocation: string; // Add raw location for display
}

// Simple function to parse location without AI - just use the raw data
export function parseLocationManually(rawLocation: string): ParsedLocation {
  // Handle empty or null location data
  if (!rawLocation || rawLocation.trim() === '') {
    return { 
      city: null, 
      country: 'Global', 
      region: 'Global', 
      isGlobal: true,
      rawLocation: rawLocation || ''
    };
  }

  const location = rawLocation.trim();
  
  // Check if it's clearly not a location
  if (location.includes('based on') || location.includes('analysis') || location.length > 100) {
    return { 
      city: null, 
      country: 'Global', 
      region: 'Global', 
      isGlobal: true,
      rawLocation: location
    };
  }

  // Check for global indicators
  if (location.toLowerCase().includes('global') || location.toLowerCase().includes('worldwide') || location.toLowerCase().includes('international')) {
    return { 
      city: null, 
      country: 'Global', 
      region: 'Global', 
      isGlobal: true,
      rawLocation: location
    };
  }

  // For now, just return the raw location as the display value
  // We'll classify it as Global for filtering purposes
  return {
    city: null,
    country: location, // Use the raw location as country for display
    region: 'Global', // Default to Global for filtering
    isGlobal: false,
    rawLocation: location
  };
}

// Simple AI parsing that just returns the manual parsing result
export async function parseLocationWithAI(rawLocation: string): Promise<ParsedLocation> {
  // For now, just use manual parsing
  return parseLocationManually(rawLocation);
}

export function getDisplayLocation(parsedLocation: ParsedLocation): string {
  // If we have a raw location, display it
  if (parsedLocation.rawLocation && parsedLocation.rawLocation.trim() !== '') {
    return parsedLocation.rawLocation;
  }
  
  // Fallback to the previous logic
  if (parsedLocation.isGlobal || parsedLocation.country === 'Global') {
    return 'Global';
  }
  
  if (parsedLocation.city) {
    return `${parsedLocation.city}, ${parsedLocation.country}`;
  }
  
  return parsedLocation.country;
}

export function normalizeCountry(country: string): string {
  return country; // Just return the country as is
}

export function getRegionForFilter(country: string): string {
  return 'Global'; // Default to Global for now
}

export function getAvailableRegions(): string[] {
  return ['United States', 'Europe', 'Asia', 'Middle East', 'Global'];
} 