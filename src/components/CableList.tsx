import { PredictionResult } from '@/types/solar';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CableListProps {
  predictions: PredictionResult[];
  isLoading: boolean;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical':
      return 'bg-critical/20 border-critical text-critical';
    case 'high':
      return 'bg-warning/20 border-warning text-warning';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
    case 'low':
      return 'bg-success/20 border-success text-success';
    default:
      return 'bg-muted/20 border-muted text-muted-foreground';
  }
};

export const CableList = ({ predictions, isLoading }: CableListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const highRiskCables = predictions
    .filter((p) => p.risk_level === 'high' || p.risk_level === 'critical')
    .sort((a, b) => b.impact_score - a.impact_score);

  if (highRiskCables.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/20 mb-3">
          <TrendingUp className="w-6 h-6 text-success" />
        </div>
        <p className="text-sm text-muted-foreground">All cables operating normally</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-2">
        {highRiskCables.map((cable) => (
          <div
            key={cable.cable_id}
            className={`p-4 rounded-lg border backdrop-blur-sm ${getRiskColor(cable.risk_level)}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{cable.cable_name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-80">Impact Score</span>
                  <span className="text-sm font-bold">{(cable.impact_score * 100).toFixed(0)}%</span>
                </div>
                {cable.estimated_impact_time && (
                  <div className="mt-1 text-xs opacity-70">
                    ETA: {new Date(cable.estimated_impact_time).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
