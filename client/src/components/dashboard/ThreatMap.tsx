import { useEffect, useRef, useState } from 'react';
import { Threat, countryCoords } from '@/data/mockData';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface ThreatMapProps {
  threats: Threat[];
}

const ThreatMap = ({ threats }: ThreatMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const animationRef = useRef<number>();
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDimensions((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load world map image
    const mapImage = new Image();
    mapImage.src = '/world-map.png';
    let mapLoaded = false;
    mapImage.onload = () => {
      mapLoaded = true;
    };

    // Animation state
    let attackLines: {
      source: { x: number; y: number };
      target: { x: number; y: number };
      progress: number;
      severity: string;
    }[] = [];

    // Helper to map numeric severity to string
    const getSeverityLabel = (s: number) => {
      if (s >= 9) return 'critical';
      if (s >= 7) return 'high';
      if (s >= 4) return 'medium';
      return 'low';
    };

    // Initialize attack lines from threats
    threats.slice(0, 15).forEach((threat) => {
      const source = toCanvasCoords(threat.sourceLat, threat.sourceLng);
      const target = toCanvasCoords(threat.targetLat, threat.targetLng);
      attackLines.push({
        source,
        target,
        progress: Math.random(),
        severity: getSeverityLabel(threat.severity),
      });
    });

    const severityColors: Record<string, string> = {
      critical: '#e11d48',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6',
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background fill based on theme
      ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw world map background
      if (mapLoaded) {
        ctx.globalAlpha = isDark ? 0.3 : 0.15;
        if (!isDark) {
          ctx.filter = 'invert(1) opacity(0.5)';
        }
        ctx.drawImage(mapImage, 0, 0, dimensions.width, dimensions.height);
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
      }

      // Draw attack lines with animation
      attackLines.forEach((line) => {
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
  }, [threats, dimensions, isDark]);

  return (
    <div className="soc-card h-[400px] relative overflow-hidden p-0 border-none">
      <div className="absolute top-4 left-4 z-10">
        <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>Global Threat Map</h3>
        <p className={cn("text-sm", isDark ? "text-cyan-400" : "text-primary")}>Real-time attack visualization</p>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full relative z-0"
      />
    </div>
  );
};

export default ThreatMap;
