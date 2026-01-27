import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'destructive';
  className?: string;
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground bg-muted',
    glow: '',
  },
  primary: {
    icon: 'text-primary bg-primary/20',
    glow: 'shadow-glow-primary',
  },
  accent: {
    icon: 'text-accent bg-accent/20',
    glow: 'shadow-glow-accent',
  },
  warning: {
    icon: 'text-warning bg-warning/20',
    glow: 'shadow-glow-warning',
  },
  destructive: {
    icon: 'text-destructive bg-destructive/20',
    glow: 'shadow-glow-destructive',
  },
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'soc-card relative overflow-hidden group hover:border-primary/30 transition-all duration-300',
        styles.glow,
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 font-mono">{value.toLocaleString()}</p>
          
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trend.isPositive ? 'text-accent' : 'text-destructive'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        
        <div className={cn('p-3 rounded-lg', styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
