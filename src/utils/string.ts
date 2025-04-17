/**
 * Extracts the city name from an address string
 * @param address The full address string
 * @returns The extracted city name or the original address if city can't be determined
 */
export const extractCity = (address: string): string => {
  if (!address) return '';
  
  // Try to find a city based on comma separation
  const parts = address.split(',');
  if (parts.length > 1) {
    // Assume city is the second part of the address (after the street)
    const cityPart = parts[1].trim();
    // If the city part has a postal code, remove it
    return cityPart.replace(/\d{5,}/, '').trim();
  }
  
  return address;
};

// Function to extract city from a full address string
export function extractCityFromAddress(address: string): string {
  if (!address) {
    return '';
  }
  
  // Try to find a city based on comma separation
  const parts = address.split(',');
  if (parts.length > 1) {
    // Assume city is the second part of the address (after the street)
    const cityPart = parts[1].trim();
    // Basic check to avoid returning things like zip codes or country names
    if (cityPart.length > 1 && !/\d/.test(cityPart)) {
      return cityPart;
    }
  }
  
  // Fallback if no city found (or couldn't parse)
  return '';
} 