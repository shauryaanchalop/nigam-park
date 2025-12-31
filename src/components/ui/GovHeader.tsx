import React, { useState, forwardRef } from 'react';
import { LogOut, User, CalendarCheck, Repeat, Settings, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AccessibilityToggle } from '@/components/ui/AccessibilityWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo.png';

interface GovHeaderProps {
  title?: string;
  subtitle?: string;
}

type DemoRole = 'admin' | 'attendant' | 'citizen';

export const GovHeader = forwardRef<HTMLElement, GovHeaderProps>(
  function GovHeader({ title = "NIGAM-Park", subtitle = "Revenue Assurance & Smart Parking System" }, ref) {
    const { user, userRole, signOut, signIn, setIsSwitchingRole } = useAuth();
    const { profile } = useProfile();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [switchLoading, setSwitchLoading] = useState<DemoRole | null>(null);

    const toggleLanguage = () => {
      setLanguage(language === 'en' ? 'hi' : 'en');
    };

    const roleLabels: Record<string, string> = {
      admin: 'MCD Commissioner',
      attendant: 'Parking Attendant',
      citizen: 'Citizen',
    };

    const getHomeRoute = () => {
      switch (userRole) {
        case 'admin':
          return '/';
        case 'attendant':
          return '/';
        case 'citizen':
        default:
          return '/citizen';
      }
    };

    const handleSwitchRole = async (role: DemoRole) => {
      if (role === userRole) return;
      setSwitchLoading(role);
      setIsSwitchingRole(true, role);

      try {
        // Sign out first
        await supabase.auth.signOut();

        // Call demo-login edge function
        const { data, error } = await supabase.functions.invoke('demo-login', {
          body: { role },
        });

        if (error || !data?.email || !data?.password) {
          toast.error('Failed to switch role');
          setIsSwitchingRole(false);
          setSwitchLoading(null);
          return;
        }

        const { error: signInErr } = await signIn(data.email, data.password);
        if (signInErr) {
          toast.error('Sign in failed');
          setIsSwitchingRole(false);
        } else {
          toast.success(`Switched to ${roleLabels[role]}`);
          // Small delay to let the auth state settle before clearing switching flag
          setTimeout(() => {
            setIsSwitchingRole(false);
            navigate('/');
          }, 100);
        }
      } catch {
        toast.error('Failed to switch role');
        setIsSwitchingRole(false);
      } finally {
        setSwitchLoading(null);
      }
    };

    const isDemoUser = user?.email?.includes('demo.');

    const getInitials = () => {
      if (profile?.full_name) {
        return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      }
      return user?.email?.slice(0, 2).toUpperCase() || 'U';
    };

    return (
      <header ref={ref} className="bg-card border-b border-border">
        {/* Top Government Banner */}
        <div className="gradient-primary px-2 sm:px-4 py-2">
          <div className="container mx-auto flex items-center justify-between gap-2">
            <Link to={user ? getHomeRoute() : '/'} className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity min-w-0 flex-shrink">
              <img src={logo} alt="NIGAM-Park Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-primary-foreground font-bold text-sm sm:text-lg tracking-tight truncate">{title}</h1>
                <p className="text-primary-foreground/80 text-[10px] sm:text-xs truncate hidden xs:block">{subtitle}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                  Municipal Corporation of Delhi
                </Badge>
                <span className="text-primary-foreground/60 text-xs">|</span>
                <span className="text-primary-foreground/80 text-xs">
                  {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>

              {/* Demo Role Switcher */}
              {isDemoUser && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                      <Repeat className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Switch</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {(['admin', 'attendant', 'citizen'] as DemoRole[]).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleSwitchRole(role)}
                        disabled={switchLoading !== null}
                        className={role === userRole ? 'bg-primary/10 font-semibold' : ''}
                      >
                        {switchLoading === role ? (
                          <span className="animate-pulse">Switching...</span>
                        ) : (
                          <>
                            {roleLabels[role]}
                            {role === userRole && <Badge className="ml-auto text-[10px]" variant="secondary">Current</Badge>}
                          </>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              >
                <Languages className="w-4 h-4" />
              </Button>

              {/* Accessibility Toggle */}
              <div className="hidden sm:block">
                <AccessibilityToggle />
              </div>

              {/* Theme Toggle */}
              <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" />

              {user && (
                <>
                  {/* Show My Reservations for citizens (or users without admin/attendant role) */}
                  {(userRole === 'citizen' || (!userRole && user) || (userRole !== 'admin' && userRole !== 'attendant')) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-primary-foreground hover:bg-primary-foreground/10 hidden lg:flex h-8 w-8"
                      onClick={() => navigate('/my-reservations')}
                    >
                      <CalendarCheck className="w-4 h-4" />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8">
                        <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-primary-foreground/30">
                          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                          <AvatarFallback className="text-[10px] sm:text-xs bg-primary-foreground/20 text-primary-foreground">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{profile?.full_name || 'User'}</span>
                          <span className="text-xs text-muted-foreground">{roleLabels[userRole ?? 'citizen']}</span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                      {(userRole === 'citizen' || (!userRole && user) || (userRole !== 'admin' && userRole !== 'attendant')) && (
                        <DropdownMenuItem onClick={() => navigate('/my-reservations')} className="sm:hidden">
                          <CalendarCheck className="w-4 h-4 mr-2" />
                          My Reservations
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!user && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                  onClick={() => navigate('/auth')}
                >
                  <User className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }
);

// Default export for backwards compatibility
export default GovHeader;
