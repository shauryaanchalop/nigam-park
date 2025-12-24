import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  compact = false,
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border hover:border-primary/30',
    success: 'border-success/30 hover:border-success/50',
    warning: 'border-warning/30 hover:border-warning/50',
    danger: 'border-destructive/30 hover:border-destructive/50',
    accent: 'border-accent/30 hover:border-accent/50',
  };

  const iconBgStyles = {
    default: 'bg-primary/10',
    success: 'bg-success/15',
    warning: 'bg-warning/15',
    danger: 'bg-destructive/15',
    accent: 'bg-accent/15',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    accent: 'text-accent',
  };

  const glowStyles = {
    default: '',
    success: 'hover:shadow-[0_8px_30px_-8px_hsl(var(--success)/0.3)]',
    warning: 'hover:shadow-[0_8px_30px_-8px_hsl(var(--warning)/0.3)]',
    danger: 'hover:shadow-[0_8px_30px_-8px_hsl(var(--destructive)/0.3)]',
    accent: 'hover:shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.3)]',
  };

  return (
    <div 
      className={cn(
        'stat-card-premium group',
        variantStyles[variant],
        glowStyles[variant],
        onClick && 'cursor-pointer',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={cn(
            "font-medium text-muted-foreground truncate",
            compact ? "text-xs" : "text-xs sm:text-sm"
          )}>
            {title}
          </p>
          <p className={cn(
            "font-bold text-foreground tracking-tight",
            compact ? "text-lg" : "text-xl sm:text-2xl lg:text-3xl"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-muted-foreground truncate",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1.5 font-medium',
              compact ? "text-[10px]" : "text-xs",
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {trend === 'up' && <TrendingUp className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />}
              {trend === 'down' && <TrendingDown className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
          'group-hover:scale-110 group-hover:rotate-3',
          iconBgStyles[variant],
          compact ? 'p-2' : 'p-2.5 sm:p-3'
        )}>
          <Icon className={cn(
            iconStyles[variant],
            compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6"
          )} />
        </div>
      </div>
      
      {onClick && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>View details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
}
