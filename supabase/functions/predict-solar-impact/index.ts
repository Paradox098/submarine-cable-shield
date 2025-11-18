import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { solarData, cmeData, cables } = await req.json();
    
    console.log('Received prediction request:', { 
      solarDataKeys: Object.keys(solarData || {}),
      cmeData,
      cablesCount: cables?.length 
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch real NASA solar flare data
    const donkiUrl = `https://api.nasa.gov/DONKI/FLR?startDate=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&api_key=DEMO_KEY`;
    
    let nasaFlares = [];
    try {
      const donkiResponse = await fetch(donkiUrl);
      if (donkiResponse.ok) {
        nasaFlares = await donkiResponse.json();
        console.log(`Fetched ${nasaFlares.length} recent solar flares from NASA`);
      }
    } catch (error) {
      console.error('Error fetching NASA data:', error);
    }

    // Prepare comprehensive data for AI analysis
    const analysisData = {
      currentSolarWind: solarData,
      recentFlares: nasaFlares.slice(0, 5), // Most recent 5 flares
      cmeSimulation: cmeData,
      submarineCables: cables.map((c: any) => ({
        id: c.id,
        name: c.name,
        midpoint: {
          lat: c.coordinates[Math.floor(c.coordinates.length / 2)][1],
          lng: c.coordinates[Math.floor(c.coordinates.length / 2)][0]
        }
      }))
    };

    // Use AI to predict impact zones with advanced space weather physics
    const systemPrompt = `You are an expert space weather physicist specializing in solar flare and CME impact predictions on Earth's magnetosphere and infrastructure.

Your task is to analyze solar wind data, recent solar flares, and predict:
1. Geographic coordinates where geomagnetic impacts will be strongest
2. Which submarine cables are most at risk based on their location relative to auroral zones
3. The severity of impacts (critical, high, medium, low)

Consider these factors:
- Solar wind speed and particle density affect magnetospheric compression
- Negative Bz component indicates southward magnetic field (most geoeffective)
- High Kp index correlates with auroral zone expansion
- Cables at higher latitudes (>40° N/S) are more vulnerable during storms
- The subsolar point and midnight sector are key impact zones
- CME arrival time and speed determine shock strength

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "impactZones": [
    {
      "lat": number (-90 to 90),
      "lng": number (-180 to 180),
      "severity": "critical" | "high" | "medium" | "low",
      "radius": number (in km),
      "description": string
    }
  ],
  "cableRisks": [
    {
      "cableId": string,
      "cableName": string,
      "riskScore": number (0 to 1),
      "riskLevel": "critical" | "high" | "medium" | "low",
      "reason": string
    }
  ],
  "analysis": {
    "auroral_zone_extent": string,
    "primary_impact_region": string,
    "estimated_storm_duration_hours": number,
    "confidence": number (0 to 1)
  }
}`;

    const userPrompt = `Analyze this space weather data and predict impact zones:

CURRENT SOLAR WIND DATA:
- Speed: ${solarData.speed} km/s
- Particle Density: ${solarData.density} p/cm³
- Bz Component: ${solarData.bz} nT
- Kp Index: ${solarData.kp}

RECENT NASA SOLAR FLARES:
${nasaFlares.slice(0, 3).map((flare: any) => `
- ${flare.beginTime}: ${flare.classType} class flare
  Location: ${flare.sourceLocation || 'Unknown'}
  Peak Time: ${flare.peakTime}
`).join('\n')}

${cmeData ? `CME SIMULATION:
- Speed: ${cmeData.speed} km/s
- Direction: Lon ${cmeData.longitude}°, Lat ${cmeData.latitude}°
- Expected Arrival: ${cmeData.arrivalTime}
` : ''}

SUBMARINE CABLE LOCATIONS (sample):
${analysisData.submarineCables.slice(0, 10).map((c: any) => `
- ${c.name}: Lat ${c.midpoint.lat.toFixed(2)}°, Lng ${c.midpoint.lng.toFixed(2)}°
`).join('\n')}

Provide detailed predictions for impact zones and cable vulnerabilities.`;

    console.log('Sending analysis to AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent predictions
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const aiContent = aiData.choices[0].message.content;
    console.log('AI analysis:', aiContent);

    // Parse the AI response
    let predictions;
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return fallback predictions
      predictions = createFallbackPredictions(solarData, cables);
    }

    console.log('Returning predictions:', predictions);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-solar-impact:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function createFallbackPredictions(solarData: any, cables: any[]) {
  // Create physics-based fallback predictions
  const kpFactor = solarData.kp / 9;
  const bzFactor = Math.abs(Math.min(solarData.bz, 0)) / 20;
  
  // High-latitude impact zones based on Kp index
  const auroralLatitude = 60 + (kpFactor * 20); // Expands equatorward with higher Kp
  
  const impactZones = [
    {
      lat: auroralLatitude,
      lng: -100,
      severity: kpFactor > 0.7 ? 'critical' : kpFactor > 0.5 ? 'high' : 'medium',
      radius: 1500,
      description: 'North American auroral zone'
    },
    {
      lat: auroralLatitude,
      lng: 60,
      severity: kpFactor > 0.7 ? 'critical' : kpFactor > 0.5 ? 'high' : 'medium',
      radius: 1500,
      description: 'European auroral zone'
    },
    {
      lat: -auroralLatitude,
      lng: 140,
      severity: kpFactor > 0.6 ? 'high' : 'medium',
      radius: 1500,
      description: 'Southern auroral zone'
    }
  ];

  // Calculate cable risks
  const cableRisks = cables.map(cable => {
    const midpoint = cable.coordinates[Math.floor(cable.coordinates.length / 2)];
    const lat = Math.abs(midpoint[1]);
    
    // Higher latitude = higher risk during storms
    const latRisk = Math.min(lat / 90, 1);
    const stormRisk = (kpFactor * 0.6) + (bzFactor * 0.4);
    const riskScore = Math.min((latRisk * 0.5) + (stormRisk * 0.5), 1);
    
    return {
      cableId: cable.id,
      cableName: cable.name,
      riskScore,
      riskLevel: riskScore > 0.7 ? 'critical' : riskScore > 0.5 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
      reason: `Located at ${lat.toFixed(1)}° latitude. ${riskScore > 0.5 ? 'High geomagnetic activity expected.' : 'Moderate conditions.'}`
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  return {
    impactZones,
    cableRisks: cableRisks.slice(0, 20), // Top 20 at-risk cables
    analysis: {
      auroral_zone_extent: `Expanded to ${auroralLatitude.toFixed(1)}° latitude`,
      primary_impact_region: 'High-latitude regions',
      estimated_storm_duration_hours: Math.round(6 + (kpFactor * 12)),
      confidence: 0.75
    }
  };
}
