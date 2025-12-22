// Mock travel time estimation based on simulated distance
// In production, this would use Google Maps Distance Matrix API

export function estimateTravelTime(lotLat: number, lotLng: number): { 
  minutes: number; 
  distance: string;
  traffic: 'light' | 'moderate' | 'heavy';
} {
  // Simulate user location around Delhi center (28.6139, 77.2090)
  const userLat = 28.6139 + (Math.random() - 0.5) * 0.1;
  const userLng = 77.2090 + (Math.random() - 0.5) * 0.1;
  
  // Calculate approximate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lotLat - userLat) * Math.PI / 180;
  const dLng = (lotLng - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(lotLat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Estimate travel time (assuming average speed of 20-30 km/h in Delhi traffic)
  const trafficMultipliers = {
    light: 1,
    moderate: 1.5,
    heavy: 2.2,
  };
  
  // Randomly assign traffic condition with weighted probability
  const rand = Math.random();
  const traffic: 'light' | 'moderate' | 'heavy' = 
    rand < 0.2 ? 'light' : 
    rand < 0.6 ? 'moderate' : 
    'heavy';
  
  const baseSpeed = 25; // km/h
  const adjustedSpeed = baseSpeed / trafficMultipliers[traffic];
  const minutes = Math.round((distance / adjustedSpeed) * 60);
  
  return {
    minutes: Math.max(5, Math.min(45, minutes)), // Clamp between 5-45 mins
    distance: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`,
    traffic,
  };
}
