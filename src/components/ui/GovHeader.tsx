import React, { useState } from 'react';
import { LogOut, User, CalendarCheck, Repeat, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
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

export function GovHeader({ title = "NIGAM-Park", subtitle = "Revenue Assurance & Smart Parking System" }: GovHeaderProps) {
  const { user, userRole, signOut, signIn } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [switchLoading, setSwitchLoading] = useState<DemoRole | null>(null);

  const roleLabels: Record<string, string> = {
    admin: 'MCD Commissioner',
    attendant: 'Parking Attendant',
    citizen: 'Citizen',
  };

  const handleSwitchRole = async (role: DemoRole) => {
    if (role === userRole) return;
    setSwitchLoading(role);

    try {
      // Sign out first
      await supabase.auth.signOut();

      // Call demo-login edge function
      const { data, error } = await supabase.functions.invoke('demo-login', {
        body: { role },
      });

      if (error || !data?.email || !data?.password) {
        toast.error('Failed to switch role');
        setSwitchLoading(null);
        return;
      }

      const { error: signInErr } = await signIn(data.email, data.password);
      if (signInErr) {
        toast.error('Sign in failed');
      } else {
        toast.success(`Switched to ${roleLabels[role]}`);
        navigate('/');
      }
    } catch {
      toast.error('Failed to switch role');
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
    <header className="bg-card border-b border-border">
      {/* Top Government Banner */}
      <div className="gradient-primary px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NIGAM-Park Logo" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-primary-foreground font-bold text-lg tracking-tight">{title}</h1>
              <p className="text-primary-foreground/80 text-xs">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2">
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
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 gap-1">
                    <Repeat className="w-4 h-4" />
                    <span className="hidden sm:inline">Switch Role</span>
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

            {/* Theme Toggle */}
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10" />

            {user && (
              <>
                {/* Show My Reservations for citizens (or users without admin/attendant role) */}
                {(userRole === 'citizen' || (!userRole && user) || (userRole !== 'admin' && userRole !== 'attendant')) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex"
                    onClick={() => navigate('/my-reservations')}
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    My Reservations
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 gap-2 pl-1">
                      <Avatar className="w-7 h-7 border-2 border-primary-foreground/30">
                        <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                        <AvatarFallback className="text-xs bg-primary-foreground/20 text-primary-foreground">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{profile?.full_name || roleLabels[userRole ?? 'citizen']}</span>
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
                size="sm" 
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/auth')}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
