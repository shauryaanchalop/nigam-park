import React from 'react';
import { ArrowLeft, ChevronLeft, Home, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/** Routes that are entry points and therefore need no floating back affordance. */
const HIDDEN_ON = ['/', '/home', '/dashboard', '/kiosk'];

export interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  inline?: boolean;
  variant?: 'outline' | 'ghost' | 'secondary' | 'default';
}

export function BackButton({ to, label, className, inline = false, variant }: BackButtonProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  /** Public pages should always fall back to the public home page. */
  const PUBLIC_ROUTES = ['/transparency', '/blog', '/faq', '/contact', '/privacy-policy', '/terms', '/install'];
  const isPublic = PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r));

  const goBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (location.pathname.startsWith('/admin')) {
      navigate('/dashboard');
    } else if (isPublic) {
      navigate('/');
    } else {
      navigate(user ? '/dashboard' : '/');
    }
  };

  if (inline) {
    return (
      <Button
        variant={variant || 'outline'}
        size="sm"
        onClick={goBack}
        aria-label={label || 'Go back'}
        className={cn(
          "h-8 sm:h-8.5 px-3 rounded-lg text-xs font-semibold border border-border/70 bg-card/90 hover:bg-accent hover:text-accent-foreground shadow-xs gap-1.5 inline-flex items-center transition-all active:scale-95 mb-4 group cursor-pointer",
          className
        )}
      >
        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:-translate-x-0.5" />
        <span>{label || 'Back'}</span>
      </Button>
    );
  }

  if (HIDDEN_ON.includes(location.pathname)) return null;

  return (
    <div className="fixed left-3 bottom-20 md:bottom-6 z-40 flex items-center gap-1.5 pointer-events-auto print:hidden bg-card/95 backdrop-blur-md p-1 rounded-full border border-border/80 shadow-lg">
      <Button
        size="sm"
        variant="ghost"
        onClick={goBack}
        aria-label="Go back to the previous page"
        className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 hover:bg-muted text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-primary" />
        <span>Back</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate('/')}
        aria-label="Go to home page"
        className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 hover:bg-muted text-foreground transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Home</span>
      </Button>
      {user && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to dashboard"
          className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 hover:bg-muted text-foreground transition-colors hidden sm:inline-flex cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Dashboard</span>
        </Button>
      )}
    </div>
  );
}

export default BackButton;
