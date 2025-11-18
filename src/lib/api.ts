import { SolarWindData, CableData, PredictionResult, SimulationParams, SimulationResult, SubsolarPoint } from '@/types/solar';

const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchCables(): Promise<CableData[]> {
  const response = await fetch(`${API_BASE_URL}/cables`);
  if (!response.ok) throw new Error('Failed to fetch cables');
  return response.json();
}

export async function fetchSolarWind(): Promise<SolarWindData> {
  const response = await fetch(`${API_BASE_URL}/solar-wind`);
  if (!response.ok) throw new Error('Failed to fetch solar wind data');
  return response.json();
}

export async function fetchPredictions(): Promise<PredictionResult[]> {
  const response = await fetch(`${API_BASE_URL}/predict`);
  if (!response.ok) throw new Error('Failed to fetch predictions');
  return response.json();
}

export async function runSimulation(params: SimulationParams): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Failed to run simulation');
  return response.json();
}

export async function fetchSubsolarPoint(): Promise<SubsolarPoint> {
  const response = await fetch(`${API_BASE_URL}/subsolar`);
  if (!response.ok) throw new Error('Failed to fetch subsolar point');
  return response.json();
}
