import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Car, BarChart3, CalendarCheck, User, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200',
        isActive 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <div className={cn(
        'relative p-1 rounded-xl transition-all duration-200',
        isActive && 'bg-primary/10'
      )}>
        <Icon className={cn('w-5 h-5', isActive && 'animate-scale-in')} />
        {isActive && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>
      <span className={cn(
        'text-[10px] font-medium',
        isActive && 'font-semibold'
      )}>
        {label}
      </span>
    </Link>
  );
}

export function MobileNav() {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const pathname = location.pathname;

  // Don't show on auth page
  if (pathname === '/auth') {
    return null;
  }

  const isAdmin = userRole === 'admin';
  const isAttendant = userRole === 'attendant';

  // Citizens are users who are not admin or attendant (including users with no role set yet)
  const isCitizen = !isAdmin && !isAttendant;
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    ...(isAdmin ? [
      { to: '/admin/parking-lots', icon: Car, label: 'Lots' },
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/admin/users', icon: User, label: 'Users' },
    ] : []),
    ...(isCitizen ? [
      { to: '/my-reservations', icon: CalendarCheck, label: 'Bookings' },
      { to: '/parking-history', icon: History, label: 'History' },
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade effect at top */}
      <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl">
        <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
          {navItems.slice(0, 5).map((item) => (
            <NavItem
              key={item.to + item.label}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={
                item.to === '/' 
                  ? pathname === '/' 
                  : pathname.startsWith(item.to)
              }
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
