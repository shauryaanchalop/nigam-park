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
}

export function BackButton({ to, label, className, inline = false }: BackButtonProps = {}) {
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
        variant="ghost"
        size="sm"
        onClick={goBack}
        aria-label={label || 'Go back'}
        className={cn(
          "mb-4 gap-1.5 text-muted-foreground hover:text-foreground inline-flex items-center transition-colors",
          className
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{label || 'Back'}</span>
      </Button>
    );
  }

  if (HIDDEN_ON.includes(location.pathname)) return null;

  return (
    <div className="fixed left-3 bottom-20 md:bottom-6 z-40 flex items-center gap-2 pointer-events-auto print:hidden">
      <Button
        size="sm"
        variant="secondary"
        onClick={goBack}
        aria-label="Go back to the previous page"
        className="shadow-lg border bg-background/95 backdrop-blur gap-1.5 hover:bg-accent hover:text-accent-foreground text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => navigate('/')}
        aria-label="Go to home page"
        className="shadow-lg border bg-background/95 backdrop-blur gap-1.5 hover:bg-accent hover:text-accent-foreground text-xs"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Button>
      {user && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to dashboard"
          className="shadow-lg border bg-background/95 backdrop-blur gap-1.5 hover:bg-accent hover:text-accent-foreground text-xs"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      )}
    </div>
  );
}

export default BackButton;

