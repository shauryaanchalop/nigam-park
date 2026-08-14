import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/** Routes that are entry points and therefore need no back affordance. */
const HIDDEN_ON = ['/', '/home', '/dashboard', '/kiosk', '/auth'];

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (HIDDEN_ON.includes(location.pathname)) return null;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(user ? '/dashboard' : '/');
  };

  return (
    <div className="fixed left-3 bottom-20 md:bottom-6 z-40 flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={goBack}
        aria-label="Go back to the previous page"
        className="shadow-lg border bg-background/90 backdrop-blur gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => navigate(user ? '/dashboard' : '/')}
        aria-label={user ? 'Go to dashboard' : 'Go to home page'}
        className="shadow-lg border bg-background/90 backdrop-blur gap-1.5"
      >
        {user ? <LayoutDashboard className="w-4 h-4" /> : <Home className="w-4 h-4" />}
        <span className="hidden sm:inline">{user ? 'Dashboard' : 'Home'}</span>
      </Button>
    </div>
  );
}

export default BackButton;
