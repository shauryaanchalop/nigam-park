import React from 'react';
import { LogOut, User, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

export function GovHeader({ title = "NIGAM-Park", subtitle = "Revenue Assurance & Smart Parking System" }: GovHeaderProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const roleLabels = {
    admin: 'MCD Commissioner',
    attendant: 'Parking Attendant',
    citizen: 'Citizen',
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

            {/* Theme Toggle */}
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10" />

            {user && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex"
                  onClick={() => navigate('/my-reservations')}
                >
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  My Reservations
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{roleLabels[userRole ?? 'citizen']}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled className="text-muted-foreground">
                      Logged in as {roleLabels[userRole ?? 'citizen']}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/my-reservations')} className="sm:hidden">
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      My Reservations
                    </DropdownMenuItem>
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
