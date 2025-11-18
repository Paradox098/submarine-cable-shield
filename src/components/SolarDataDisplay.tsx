import { SolarWindData } from '@/types/solar';
import { Activity, Wind, Compass } from 'lucide-react';

interface SolarDataDisplayProps {
  data: SolarWindData | null;
  isLoading: boolean;
}

const getKpColor = (kp: number) => {
  if (kp < 3) return 'text-success';
  if (kp < 5) return 'text-warning';
  if (kp < 7) return 'text-critical';
  return 'text-critical';
};

const getKpLabel = (kp: number) => {
  if (kp < 3) return 'Quiet';
  if (kp < 5) return 'Active';
  if (kp < 7) return 'Storm';
  return 'Severe Storm';
};

export const SolarDataDisplay = ({ data, isLoading }: SolarDataDisplayProps) => {
  if (isLoading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-secondary/50 rounded-lg" />
        <div className="h-20 bg-secondary/50 rounded-lg" />
        <div className="h-20 bg-secondary/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Solar Wind Speed</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{data.speed.toFixed(1)} km/s</div>
      </div>

      <div className="bg-secondary/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Particle Density</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{data.density.toFixed(2)} p/cm³</div>
      </div>

      <div className="bg-secondary/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Bz Component</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{data.bz.toFixed(2)} nT</div>
      </div>

      <div className="bg-secondary/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Kp Index</span>
          <span className={`text-xs font-semibold ${getKpColor(data.kp)}`}>
            {getKpLabel(data.kp)}
          </span>
        </div>
        <div className={`text-2xl font-bold ${getKpColor(data.kp)}`}>
          {data.kp.toFixed(1)}
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              data.kp < 3 ? 'bg-success' : data.kp < 5 ? 'bg-warning' : 'bg-critical'
            }`}
            style={{ width: `${Math.min((data.kp / 9) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
