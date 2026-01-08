import { useEffect, useRef, useState } from 'react';
import { Threat, countryCoords } from '@/data/mockData';

interface ThreatMapProps {
  threats: Threat[];
}

const ThreatMap = ({ threats }: ThreatMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const animationRef = useRef<number>();

  // Convert lat/lng to canvas coordinates
  const toCanvasCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * dimensions.width;
    const y = ((90 - lat) / 180) * dimensions.height;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation state
    let attackLines: {
      source: { x: number; y: number };
      target: { x: number; y: number };
      progress: number;
      severity: string;
    }[] = [];

    // Initialize attack lines from threats
    threats.slice(0, 15).forEach((threat) => {
      const source = toCanvasCoords(threat.source.lat, threat.source.lng);
      const target = toCanvasCoords(threat.target.lat, threat.target.lng);
      attackLines.push({
        source,
        target,
        progress: Math.random(),
        severity: threat.severity,
      });
    });

    const severityColors: Record<string, string> = {
      critical: '#e11d48',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6',
    };

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw world map outline (simplified)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      
      // Draw grid lines
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (dimensions.height / 12) * i);
        ctx.lineTo(dimensions.width, (dimensions.height / 12) * i);
        ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo((dimensions.width / 24) * i, 0);
        ctx.lineTo((dimensions.width / 24) * i, dimensions.height);
        ctx.stroke();
      }

      // Draw country points
      Object.values(countryCoords).forEach((coord) => {
        const { x, y } = toCanvasCoords(coord.lat, coord.lng);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 217, 255, 0.6)';
        ctx.fill();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, 'rgba(0, 217, 255, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw attack lines with animation
      attackLines.forEach((line, index) => {
        line.progress += 0.005;
        if (line.progress > 1) {
          line.progress = 0;
        }

        const currentX = line.source.x + (line.target.x - line.source.x) * line.progress;
        const currentY = line.source.y + (line.target.y - line.source.y) * line.progress;

        // Draw the line trail
        ctx.beginPath();
        ctx.moveTo(line.source.x, line.source.y);
        ctx.lineTo(currentX, currentY);
        
        const gradient = ctx.createLinearGradient(
          line.source.x,
          line.source.y,
          currentX,
          currentY
        );
        const color = severityColors[line.severity] || severityColors.low;
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, color);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the moving dot
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow effect on dot
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        const dotGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 6);
        dotGradient.addColorStop(0, color);
        dotGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = dotGradient;
        ctx.fill();

        // Draw target pulse when reaching destination
        if (line.progress > 0.9) {
          const pulseRadius = (line.progress - 0.9) * 100;
          ctx.beginPath();
          ctx.arc(line.target.x, line.target.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color === '#e11d48' ? '225, 29, 72' : color === '#f97316' ? '249, 115, 22' : '234, 179, 8'}, ${1 - (line.progress - 0.9) * 10})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [threats, dimensions]);

  return (
    <div className="soc-card h-[400px] relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold">Global Threat Map</h3>
        <p className="text-sm text-muted-foreground">Real-time attack visualization</p>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-card/80 backdrop-blur-sm p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-critical" />
          <span className="text-xs">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-info" />
          <span className="text-xs">Low</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
};

export default ThreatMap;
