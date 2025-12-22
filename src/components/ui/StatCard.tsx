import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
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
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/10 border-success/30',
    warning: 'bg-warning/10 border-warning/30',
    danger: 'bg-destructive/10 border-destructive/30',
    accent: 'bg-accent/10 border-accent/30',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-destructive/20 text-destructive',
    accent: 'bg-accent/20 text-accent',
  };

  return (
    <div className={cn(
      'rounded-lg border p-4 data-card',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          iconStyles[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
