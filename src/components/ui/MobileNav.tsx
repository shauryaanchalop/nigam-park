import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Car, 
  BarChart3, 
  CalendarCheck, 
  User, 
  LayoutDashboard, 
  QrCode, 
  Video, 
  AlertTriangle, 
  CreditCard 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}

const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon: Icon, label, isActive }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 px-1 sm:px-2 py-1.5 transition-all duration-200 ease-claude min-w-0 flex-1 touch-manipulation min-h-[48px] active:scale-95 rounded-xl',
          isActive 
            ? 'text-primary font-semibold' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <div className={cn(
          'relative p-1.5 rounded-xl transition-all duration-200 ease-claude',
          isActive && 'bg-primary/10 shadow-sm scale-105'
        )}>
          <Icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'text-primary')} />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <span className={cn(
          'text-[10px] font-medium truncate max-w-full tracking-tight leading-tight',
          isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      </Link>
    );
  }
);

NavItem.displayName = 'NavItem';

export function MobileNav() {
  const location = useLocation();
  const { userRole } = useAuth();
  const pathname = location.pathname;

  // Don't show on auth page or full kiosk mode
  if (pathname === '/auth' || pathname === '/kiosk') {
    return null;
  }

  const isAdmin = userRole === 'admin';
  const isAttendant = userRole === 'attendant';
  const isCitizen = !isAdmin && !isAttendant;
  
  let navItems: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [];

  if (isAdmin) {
    navItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Control' },
      { to: '/vision-dashboard', icon: Video, label: 'Vision AI' },
      { to: '/admin/violations', icon: AlertTriangle, label: 'Alerts' },
      { to: '/admin/parking-lots', icon: Car, label: 'Lots' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  } else if (isAttendant) {
    navItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'POS' },
      { to: '/attendant/checkin', icon: QrCode, label: 'Check-In' },
      { to: '/attendant/performance', icon: BarChart3, label: 'Shifts' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  } else {
    // Citizen / general user
    navItems = [
      { to: '/', icon: Home, label: 'Home' },
      { to: '/citizen', icon: Car, label: 'Parking' },
      { to: '/my-reservations', icon: CalendarCheck, label: 'Bookings' },
      { to: '/monthly-pass', icon: CreditCard, label: 'Pass' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  }

  return (
    <nav className="fixed bottom-2 left-2 right-2 z-50 md:hidden pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto claude-dock px-2 py-1.5 bg-card/90 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-around safe-area-bottom">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.to === '/' 
              ? pathname === '/' 
              : item.to === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.to);

            return (
              <NavItem
                key={item.to + item.label}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

