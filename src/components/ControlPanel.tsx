import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealTimeMode } from './RealTimeMode';
import { SimulationMode } from './SimulationMode';
import { Satellite } from 'lucide-react';

export const ControlPanel = () => {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="fixed top-4 left-4 w-96 max-h-[calc(100vh-2rem)] bg-card/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl overflow-hidden z-50">
      <div className="bg-gradient-to-r from-primary/20 to-warning/20 p-6 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Satellite className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Solar Flare Impact Predictor</h2>
            <p className="text-xs text-muted-foreground">Real-time cable monitoring system</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger 
              value="realtime"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Real-Time
            </TabsTrigger>
            <TabsTrigger 
              value="simulation"
              className="data-[state=active]:bg-warning data-[state=active]:text-white"
            >
              Simulation
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-14rem)] p-6">
          <TabsContent value="realtime" className="mt-0">
            <RealTimeMode />
          </TabsContent>

          <TabsContent value="simulation" className="mt-0">
            <SimulationMode />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
