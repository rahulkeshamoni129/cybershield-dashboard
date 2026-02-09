import { useEffect, useRef, useState } from 'react';
import { Threat, countryCoords } from '@/data/mockData';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface ThreatMapProps {
  threats: Threat[];
}

interface AttackLine {
  source: { x: number; y: number };
  target: { x: number; y: number };
  progress: number;
  severity: string;
  age: number;
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

    // Load map image
    const mapImage = new Image();
    mapImage.src = '/world-map-simple.svg';
    let mapLoaded = false;
    mapImage.onload = () => { mapLoaded = true; };

    // Track country attack counts and positions
    const countryData = new Map<string, { count: number; lat: number; lng: number }>();

    threats.forEach(threat => {
      const key = threat.sourceCountry;
      const existing = countryData.get(key);
      if (existing) {
        existing.count++;
      } else {
        countryData.set(key, {
          count: 1,
          lat: threat.sourceLat,
          lng: threat.sourceLng
        });
      }
    });


    // Animation state for attack lines
    let attackLines: AttackLine[] = [];

    // Helper function to map severity to label
    const getSeverityLabel = (s: number) => {
      if (s >= 9) return 'critical';
      if (s >= 7) return 'high';
      if (s >= 4) return 'medium';
      return 'low';
    };

    // Initialize with recent threats (last 20)
    threats.slice(0, 20).forEach((threat, idx) => {
      const source = toCanvasCoords(threat.sourceLat, threat.sourceLng);
      const target = toCanvasCoords(threat.targetLat, threat.targetLng);
      attackLines.push({
        source,
        target,
        progress: Math.random() * 0.5, // Stagger initial animations
        severity: getSeverityLabel(threat.severity),
        age: 0
      });
    });


    const severityColors: Record<string, string> = {
      critical: '#e11d48',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6',
    };

    let pulsePhase = 0;

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw World Map
      if (mapLoaded) {
        ctx.save();
        ctx.filter = 'brightness(0) invert(1) opacity(0.2) drop-shadow(0 0 2px #38bdf8)';
        ctx.drawImage(mapImage, 0, 0, dimensions.width, dimensions.height);
        ctx.restore();
      }

      // Draw country markers (pulsing circles showing attack sources)
      pulsePhase += 0.02;
      const pulse = Math.sin(pulsePhase) * 0.3 + 0.7; // 0.4 to 1.0

      countryData.forEach((data, country) => {
        const pos = toCanvasCoords(data.lat, data.lng);
        const baseRadius = Math.min(8 + Math.log(data.count) * 2, 15);
        const radius = baseRadius * pulse;

        // Outer glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius + 4);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fill();

        // Main marker
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw country labels for top 5
      const topCountries = Array.from(countryData.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      topCountries.forEach(([country, data]) => {
        const pos = toCanvasCoords(data.lat, data.lng);

        // Label background
        const text = `${country} (${data.count})`;
        const metrics = ctx.measureText(text);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(pos.x - metrics.width / 2 - 4, pos.y - 25, metrics.width + 8, 16);

        // Label text
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(text, pos.x, pos.y - 13);
      });

      // Update and draw attack lines
      attackLines = attackLines.filter(line => {
        line.progress += 0.008;
        line.age++;

        // Remove completed attacks after fade
        if (line.progress > 1.2) return false;

        const currentX = line.source.x + (line.target.x - line.source.x) * Math.min(line.progress, 1);
        const currentY = line.source.y + (line.target.y - line.source.y) * Math.min(line.progress, 1);

        // Fade out after completion
        const opacity = line.progress > 1 ? Math.max(0, 1 - (line.progress - 1) * 5) : 1;

        // Draw line trail
        ctx.beginPath();
        ctx.moveTo(line.source.x, line.source.y);
        ctx.lineTo(currentX, currentY);

        const color = severityColors[line.severity] || severityColors.low;
        const gradient = ctx.createLinearGradient(
          line.source.x, line.source.y, currentX, currentY
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, color);

        ctx.strokeStyle = gradient;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Moving dot
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        const dotGlow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 6);
        dotGlow.addColorStop(0, color);
        dotGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = dotGlow;
        ctx.fill();

        ctx.globalAlpha = 1;

        return true; // Keep this line
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
    <div className="soc-card h-[400px] relative overflow-hidden p-0 border-none">
      <div className="absolute top-4 left-4 z-10">
        <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>Global Threat Map</h3>
        <p className={cn("text-sm", isDark ? "text-cyan-400" : "text-primary")}>Real-time attack visualization</p>
      </div>

      {/* Severity Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
        <div className="text-xs font-semibold text-slate-300 mb-2">Threat Severity</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#e11d48]"></div>
            <span className="text-xs text-slate-400">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
            <span className="text-xs text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
            <span className="text-xs text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="text-xs text-slate-400">Low</span>
          </div>
        </div>
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
