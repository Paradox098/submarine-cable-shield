import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSolarWind, fetchPredictions } from '@/lib/api';
import { SolarDataDisplay } from './SolarDataDisplay';
import { CableList } from './CableList';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const RealTimeMode = () => {
  const [isPredicting, setIsPredicting] = useState(false);

  const { data: solarData, isLoading: solarLoading } = useQuery({
    queryKey: ['solar-wind'],
    queryFn: fetchSolarWind,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: predictions, isLoading: predictionsLoading, refetch } = useQuery({
    queryKey: ['predictions'],
    queryFn: fetchPredictions,
    enabled: false, // Only fetch when button is clicked
  });

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      await refetch();
      toast.success('Predictions updated successfully');
    } catch (error) {
      toast.error('Failed to fetch predictions');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Current Solar Conditions</h3>
        <SolarDataDisplay data={solarData || null} isLoading={solarLoading} />
      </div>

      <div>
        <Button
          onClick={handlePredict}
          disabled={isPredicting || solarLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan"
        >
          {isPredicting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Predict Now
            </>
          )}
        </Button>
      </div>

      {predictions && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">High-Risk Cables</h3>
          <CableList predictions={predictions} isLoading={predictionsLoading} />
        </div>
      )}
    </div>
  );
};
