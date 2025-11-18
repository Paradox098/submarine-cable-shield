import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { runSimulation } from '@/lib/api';
import { SimulationParams } from '@/types/solar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CableList } from './CableList';
import { Loader2, Play, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const SimulationMode = () => {
  const [params, setParams] = useState<SimulationParams>({
    start_time: new Date().toISOString(),
    cme_speed: 1000,
    direction_longitude: 0,
    direction_latitude: 0,
  });

  const [arrivalTime, setArrivalTime] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: runSimulation,
    onSuccess: (data) => {
      setArrivalTime(data.arrival_time);
      toast.success('Simulation completed successfully');
    },
    onError: () => {
      toast.error('Failed to run simulation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(params);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="start-time" className="text-foreground">Start Time</Label>
          <Input
            id="start-time"
            type="datetime-local"
            value={params.start_time.slice(0, 16)}
            onChange={(e) =>
              setParams({ ...params, start_time: new Date(e.target.value).toISOString() })
            }
            className="bg-secondary/50 border-primary/20 text-foreground"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="cme-speed" className="text-foreground">CME Speed</Label>
            <span className="text-sm text-primary font-semibold">{params.cme_speed} km/s</span>
          </div>
          <Slider
            id="cme-speed"
            min={400}
            max={3000}
            step={50}
            value={[params.cme_speed]}
            onValueChange={(value) => setParams({ ...params, cme_speed: value[0] })}
            className="py-4"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-foreground">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              min={-180}
              max={180}
              value={params.direction_longitude}
              onChange={(e) =>
                setParams({ ...params, direction_longitude: parseFloat(e.target.value) })
              }
              className="bg-secondary/50 border-primary/20 text-foreground"
            />
            <p className="text-xs text-muted-foreground">-180° to 180°</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-foreground">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              min={-90}
              max={90}
              value={params.direction_latitude}
              onChange={(e) =>
                setParams({ ...params, direction_latitude: parseFloat(e.target.value) })
              }
              className="bg-secondary/50 border-primary/20 text-foreground"
            />
            <p className="text-xs text-muted-foreground">-90° to 90°</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-warning hover:bg-warning/90 text-white shadow-glow-orange"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Simulation
            </>
          )}
        </Button>
      </form>

      {arrivalTime && (
        <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-4 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Predicted Arrival Time</span>
          </div>
          <div className="text-xl font-bold text-primary">
            {new Date(arrivalTime).toLocaleString()}
          </div>
        </div>
      )}

      {mutation.data && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Simulation Results</h3>
          <CableList predictions={mutation.data.predictions} isLoading={false} />
        </div>
      )}
    </div>
  );
};
