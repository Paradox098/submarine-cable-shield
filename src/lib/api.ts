import { SolarWindData, CableData, PredictionResult, SimulationParams, SimulationResult, SubsolarPoint } from '@/types/solar';

// Real data sources
const CABLES_URL = 'https://raw.githubusercontent.com/opengeos/leafmap/master/examples/data/cable_geo.geojson';
const NOAA_SOLAR_WIND_MAG_URL = 'https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json';
const NOAA_SOLAR_WIND_SPEED_URL = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
const NOAA_KP_INDEX_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';

export async function fetchCables(): Promise<CableData[]> {
  const response = await fetch(CABLES_URL);
  if (!response.ok) throw new Error('Failed to fetch cables');
  const geojson = await response.json();
  
  // Convert GeoJSON to our cable format
  return geojson.features.map((feature: any, index: number) => ({
    id: feature.properties?.id || `cable-${index}`,
    name: feature.properties?.name || `Cable ${index + 1}`,
    coordinates: feature.geometry.type === 'LineString' 
      ? feature.geometry.coordinates 
      : feature.geometry.coordinates[0], // Handle MultiLineString
    owners: feature.properties?.owners || [],
    rfs: feature.properties?.rfs || 'Unknown',
  }));
}

export async function fetchSolarWind(): Promise<SolarWindData> {
  try {
    // Fetch solar wind data from NOAA
    const [magResponse, speedResponse, kpResponse] = await Promise.all([
      fetch(NOAA_SOLAR_WIND_MAG_URL),
      fetch(NOAA_SOLAR_WIND_SPEED_URL),
      fetch(NOAA_KP_INDEX_URL),
    ]);
    
    if (!magResponse.ok || !speedResponse.ok || !kpResponse.ok) {
      throw new Error('Failed to fetch solar wind data');
    }
    
    const magData = await magResponse.json();
    const speedData = await speedResponse.json();
    const kpData = await kpResponse.json();
    
    // Get the latest Kp index (last entry in array)
    const latestKp = kpData[kpData.length - 1];
    
    return {
      speed: parseFloat(speedData.WindSpeed) || 400,
      density: parseFloat(speedData.Density) || 5,
      bz: parseFloat(magData.Bz) || 0,
      kp: parseFloat(latestKp?.kp_index) || 2,
      timestamp: magData.TimeStamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching solar wind data:', error);
    // Return mock data as fallback
    return {
      speed: 420 + Math.random() * 100,
      density: 5 + Math.random() * 3,
      bz: -2 + Math.random() * 4,
      kp: 2 + Math.random() * 2,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchPredictions(): Promise<PredictionResult[]> {
  try {
    // Get current solar conditions
    const solarData = await fetchSolarWind();
    const cables = await fetchCables();
    
    // Calculate risk based on solar conditions
    const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
      if (score > 0.7) return 'critical';
      if (score > 0.5) return 'high';
      if (score > 0.3) return 'medium';
      return 'low';
    };
    
    // Simple prediction algorithm based on Kp index and Bz component
    const predictions = cables.map(cable => {
      // Higher Kp and negative Bz = higher risk
      const kpFactor = Math.min(solarData.kp / 9, 1);
      const bzFactor = Math.abs(Math.min(solarData.bz, 0)) / 20;
      const randomFactor = Math.random() * 0.2; // Add some variation
      
      const impactScore = Math.min((kpFactor * 0.6 + bzFactor * 0.3 + randomFactor), 1);
      
      return {
        cable_id: cable.id,
        cable_name: cable.name,
        impact_score: impactScore,
        risk_level: getRiskLevel(impactScore),
        estimated_impact_time: impactScore > 0.5 
          ? new Date(Date.now() + Math.random() * 7200000).toISOString() // Within 2 hours
          : undefined,
      };
    });
    
    return predictions;
  } catch (error) {
    console.error('Error generating predictions:', error);
    return [];
  }
}

export async function runSimulation(params: SimulationParams): Promise<SimulationResult> {
  try {
    const cables = await fetchCables();
    
    // Calculate arrival time based on CME speed (simple model)
    const distanceToEarthKm = 150000000; // 1 AU in km
    const travelTimeHours = distanceToEarthKm / params.cme_speed / 3600;
    const arrivalTime = new Date(new Date(params.start_time).getTime() + travelTimeHours * 3600000);
    
    // Calculate impact based on CME parameters
    const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
      if (score > 0.7) return 'critical';
      if (score > 0.5) return 'high';
      if (score > 0.3) return 'medium';
      return 'low';
    };
    
    const predictions = cables.map(cable => {
      // Calculate if cable is in CME path based on longitude/latitude
      const cableMidLng = cable.coordinates[Math.floor(cable.coordinates.length / 2)][0];
      const cableMidLat = cable.coordinates[Math.floor(cable.coordinates.length / 2)][1];
      
      // Angular distance from CME direction
      const lngDiff = Math.abs(cableMidLng - params.direction_longitude);
      const latDiff = Math.abs(cableMidLat - params.direction_latitude);
      const angularDistance = Math.sqrt(lngDiff * lngDiff + latDiff * latDiff);
      
      // Speed factor (faster = more dangerous)
      const speedFactor = Math.min((params.cme_speed - 400) / 2600, 1);
      
      // Proximity factor (closer to CME direction = higher risk)
      const proximityFactor = Math.max(0, 1 - angularDistance / 180);
      
      const impactScore = Math.min(speedFactor * 0.6 + proximityFactor * 0.4, 1);
      
      return {
        cable_id: cable.id,
        cable_name: cable.name,
        impact_score: impactScore,
        risk_level: getRiskLevel(impactScore),
        estimated_impact_time: impactScore > 0.3 ? arrivalTime.toISOString() : undefined,
      };
    });
    
    return {
      arrival_time: arrivalTime.toISOString(),
      predictions: predictions.sort((a, b) => b.impact_score - a.impact_score),
    };
  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
}

export async function fetchSubsolarPoint(): Promise<SubsolarPoint> {
  // Calculate subsolar point based on current time
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Simple solar declination calculation
  const latitude = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  // Longitude based on time of day
  const hoursFromMidnight = now.getUTCHours() + now.getUTCMinutes() / 60;
  const longitude = (hoursFromMidnight / 24) * 360 - 180;
  
  return {
    latitude,
    longitude,
  };
}
