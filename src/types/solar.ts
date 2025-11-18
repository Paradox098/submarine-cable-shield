export interface SolarWindData {
  speed: number;
  density: number;
  bz: number;
  kp: number;
  timestamp: string;
}

export interface CableData {
  id: string;
  name: string;
  coordinates: [number, number][];
  owners: string[];
  rfs: string;
}

export interface PredictionResult {
  cable_id: string;
  cable_name: string;
  impact_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_impact_time?: string;
}

export interface SimulationParams {
  start_time: string;
  cme_speed: number;
  direction_longitude: number;
  direction_latitude: number;
}

export interface SimulationResult {
  arrival_time: string;
  predictions: PredictionResult[];
}

export interface SubsolarPoint {
  latitude: number;
  longitude: number;
}
