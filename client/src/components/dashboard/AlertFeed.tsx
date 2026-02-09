import { Alert } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AlertFeedProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    class: 'threat-critical',
    iconColor: 'text-critical',
    bgGlow: 'bg-critical/5',
  },
  high: {
    icon: AlertCircle,
    class: 'threat-high',
    iconColor: 'text-destructive',
    bgGlow: 'bg-destructive/5',
  },
  medium: {
    icon: Info,
    class: 'threat-medium',
    iconColor: 'text-warning',
    bgGlow: 'bg-warning/5',
  },
  low: {
    icon: CheckCircle2,
    class: 'threat-low',
    iconColor: 'text-info',
    bgGlow: 'bg-info/5',
  },
};

const AlertFeed = ({ alerts }: AlertFeedProps) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="soc-card h-[450px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Live Alert Feed</h3>
          <p className="text-sm text-muted-foreground">{alerts.length} active alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-accent font-medium">LIVE</span>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in',
                  config.bgGlow,
                  'border-border hover:border-primary/30'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-1.5 rounded', `${config.iconColor} bg-current/10`)}>
                    <Icon className={cn('h-4 w-4', config.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-[10px] uppercase', config.class)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {alert.id}
                      </span>
                    </div>

                    <p className="text-sm font-medium truncate">{alert.title}</p>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{alert.source}</span>
                      <span>•</span>
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>

                  <Badge
                    variant={alert.status === 'new' ? 'default' : 'outline'}
                    className="text-[10px] capitalize"
                  >
                    {alert.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AlertFeed;
