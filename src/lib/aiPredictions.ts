import { supabase } from '@/integrations/supabase/client';
import { SolarWindData, CableData, SimulationParams } from '@/types/solar';

export interface ImpactZone {
  lat: number;
  lng: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  radius: number;
  description: string;
}

export interface CableRisk {
  cableId: string;
  cableName: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface PredictionAnalysis {
  auroral_zone_extent: string;
  primary_impact_region: string;
  estimated_storm_duration_hours: number;
  confidence: number;
}

export interface AIPrediction {
  impactZones: ImpactZone[];
  cableRisks: CableRisk[];
  analysis: PredictionAnalysis;
}

export async function getAIPredictions(
  solarData: SolarWindData,
  cables: CableData[],
  cmeData?: SimulationParams
): Promise<AIPrediction> {
  const { data, error } = await supabase.functions.invoke('predict-solar-impact', {
    body: {
      solarData,
      cables,
      cmeData: cmeData ? {
        speed: cmeData.cme_speed,
        longitude: cmeData.direction_longitude,
        latitude: cmeData.direction_latitude,
        arrivalTime: cmeData.start_time
      } : null
    }
  });

  if (error) {
    console.error('Error getting AI predictions:', error);
    throw error;
  }

  return data as AIPrediction;
}
