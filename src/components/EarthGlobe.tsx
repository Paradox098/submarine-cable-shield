import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCables, fetchSolarWind } from '@/lib/api';
import { getAIPredictions, ImpactZone } from '@/lib/aiPredictions';
import Globe from 'globe.gl';
import { toast } from 'sonner';

export const EarthGlobe = () => {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const [impactZones, setImpactZones] = useState<ImpactZone[]>([]);

  const { data: cables, isLoading, isError } = useQuery({
    queryKey: ['cables'],
    queryFn: fetchCables,
    retry: 2,
  });

  const { data: solarData } = useQuery({
    queryKey: ['solar-wind'],
    queryFn: fetchSolarWind,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load submarine cables');
    }
  }, [isError]);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!solarData || !cables || cables.length === 0) return;
      
      try {
        console.log('Fetching AI predictions...');
        const predictions = await getAIPredictions(solarData, cables);
        console.log('AI predictions received:', predictions);
        setImpactZones(predictions.impactZones || []);
        
        if (predictions.analysis) {
          toast.info(`AI Analysis: ${predictions.analysis.primary_impact_region}`, {
            description: `Storm duration: ${predictions.analysis.estimated_storm_duration_hours}h | Confidence: ${(predictions.analysis.confidence * 100).toFixed(0)}%`
          });
        }
      } catch (error) {
        console.error('Failed to get AI predictions:', error);
      }
    };

    fetchPredictions();
  }, [solarData, cables]);

  useEffect(() => {
    if (!globeEl.current) return;

    const globe = new Globe(globeEl.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('#0a0e1a')
      .atmosphereColor('#00d9ff')
      .atmosphereAltitude(0.2)
      .width(window.innerWidth)
      .height(window.innerHeight);

    globe.pointOfView({ altitude: 2.5 });

    const controls = globe.controls();
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    globeInstance.current = globe;

    const handleResize = () => {
      globe.width(window.innerWidth).height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (globeInstance.current) {
        globeInstance.current._destructor();
      }
    };
  }, []);

  useEffect(() => {
    if (!globeInstance.current || !Array.isArray(cables) || cables.length === 0) return;

    const arcsData = cables.flatMap((cable) => {
      const arcs = [];
      for (let i = 0; i < cable.coordinates.length - 1; i++) {
        arcs.push({
          startLat: cable.coordinates[i][1],
          startLng: cable.coordinates[i][0],
          endLat: cable.coordinates[i + 1][1],
          endLng: cable.coordinates[i + 1][0],
          color: '#00d9ff',
          name: cable.name,
        });
      }
      return arcs;
    });

    globeInstance.current
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .arcStroke(0.5)
      .arcAltitude(0.1)
      .arcLabel('name');

    const pointsData = cables.flatMap((cable) =>
      cable.coordinates.map((coord) => ({
        lat: coord[1],
        lng: coord[0],
        size: 0.2,
        color: '#00d9ff',
        name: cable.name,
      }))
    );

    globeInstance.current
      .pointsData(pointsData)
      .pointColor('color')
      .pointAltitude(0)
      .pointRadius('size')
      .pointLabel('name');
  }, [cables]);

  useEffect(() => {
    if (!globeInstance.current || impactZones.length === 0) return;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical': return '#ff0055';
        case 'high': return '#ff6b35';
        case 'medium': return '#ffd93d';
        case 'low': return '#00ff88';
        default: return '#00d9ff';
      }
    };

    const ringsData = impactZones.map(zone => ({
      lat: zone.lat,
      lng: zone.lng,
      maxR: zone.radius / 100,
      propagationSpeed: 1,
      repeatPeriod: 2000,
      color: getSeverityColor(zone.severity),
      label: zone.description
    }));

    globeInstance.current
      .ringsData(ringsData)
      .ringColor('color')
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod')
      .ringLabel('label');

  }, [impactZones]);

  return (
    <div className="relative w-full h-screen">
      <div ref={globeEl} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground font-semibold">Loading submarine cable data...</p>
          </div>
        </div>
      )}
    </div>
  );
};
