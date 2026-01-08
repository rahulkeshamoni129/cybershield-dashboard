import { Server, Database, Shield, Cpu, HardDrive, Network } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const systemMetrics = [
  { name: 'Firewall', icon: Shield, status: 'healthy', uptime: 99.99, load: 23 },
  { name: 'IDS/IPS', icon: Network, status: 'healthy', uptime: 99.95, load: 45 },
  { name: 'SIEM', icon: Server, status: 'warning', uptime: 98.5, load: 78 },
  { name: 'Database', icon: Database, status: 'healthy', uptime: 99.99, load: 34 },
  { name: 'CPU Cluster', icon: Cpu, status: 'healthy', uptime: 100, load: 56 },
  { name: 'Storage', icon: HardDrive, status: 'healthy', uptime: 100, load: 67 },
];

const statusColors = {
  healthy: 'text-accent',
  warning: 'text-warning',
  critical: 'text-destructive',
};

const SystemHealth = () => {
  return (
    <div className="soc-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">System Health</h3>
        <p className="text-sm text-muted-foreground">Infrastructure status</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {systemMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.name}
              className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', statusColors[metric.status])} />
                <span className="text-sm font-medium">{metric.name}</span>
                <div
                  className={cn(
                    'ml-auto w-2 h-2 rounded-full',
                    metric.status === 'healthy' && 'bg-accent',
                    metric.status === 'warning' && 'bg-warning animate-pulse',
                    metric.status === 'critical' && 'bg-destructive animate-pulse'
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono text-accent">{metric.uptime}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Load</span>
                  <span className="font-mono">{metric.load}%</span>
                </div>
                <Progress
                  value={metric.load}
                  className={cn(
                    'h-1',
                    metric.load > 80 && '[&>div]:bg-destructive',
                    metric.load > 60 && metric.load <= 80 && '[&>div]:bg-warning'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemHealth;
