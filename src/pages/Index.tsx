import { EarthGlobe } from '@/components/EarthGlobe';
import { ControlPanel } from '@/components/ControlPanel';

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <EarthGlobe />
      <ControlPanel />
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-warning/5 to-transparent" />
      </div>
    </div>
  );
};

export default Index;
