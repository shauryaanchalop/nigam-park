import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRoleSwitchSound } from '@/hooks/useRoleSwitchSound';
import AdminDashboard from './AdminDashboard';
import AttendantPOS from './AttendantPOS';
import CitizenPortal from './CitizenPortal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Shield, BadgeCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const roleConfig = {
  admin: {
    color: 'hsl(var(--primary))',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary',
    icon: Shield,
    label: 'MCD Commissioner',
  },
  attendant: {
    color: 'hsl(25 95% 53%)',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    icon: BadgeCheck,
    label: 'Parking Attendant',
  },
  citizen: {
    color: 'hsl(142 76% 36%)',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    icon: User,
    label: 'Citizen Portal',
  },
};

export default function Index() {
  const { user, loading, userRole, isSwitchingRole, targetRole } = useAuth();
  const { profile } = useProfile();
  const { playRoleSwitchSound } = useRoleSwitchSound();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedRole, setDisplayedRole] = useState(userRole);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const prevRoleRef = useRef(userRole);

  // Determine slide direction based on role hierarchy
  const getRoleIndex = (role: string | null) => {
    const order = ['citizen', 'attendant', 'admin'];
    return order.indexOf(role || 'citizen');
  };

  // Handle role change with transition
  useEffect(() => {
    if (userRole !== displayedRole && !isSwitchingRole && !loading) {
      const prevIndex = getRoleIndex(prevRoleRef.current);
      const newIndex = getRoleIndex(userRole);
      setSlideDirection(newIndex > prevIndex ? 'right' : 'left');
      setIsTransitioning(true);
      
      // Play sound effect
      playRoleSwitchSound();
      
      const timer = setTimeout(() => {
        setDisplayedRole(userRole);
        prevRoleRef.current = userRole;
        setIsTransitioning(false);
        
        // Show welcome message
        const newRoleConfig = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.citizen;
        const userName = profile?.full_name?.split(' ')[0] || 'there';
        toast.success(`Welcome, ${userName}!`, {
          description: `You're now viewing the ${newRoleConfig.label} dashboard`,
          duration: 3000,
        });
      }, 300);
      return () => clearTimeout(timer);
    } else if (!displayedRole && userRole) {
      setDisplayedRole(userRole);
      prevRoleRef.current = userRole;
      
      // Show initial welcome on first load (only once)
      if (!hasShownWelcome && profile?.full_name) {
        const currentConfig = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.citizen;
        const userName = profile.full_name.split(' ')[0];
        toast.success(`Welcome back, ${userName}!`, {
          description: `${currentConfig.label} dashboard`,
          duration: 3000,
        });
        setHasShownWelcome(true);
      }
    }
  }, [userRole, displayedRole, isSwitchingRole, loading, playRoleSwitchSound, profile, hasShownWelcome]);

  // Use target role during switching, otherwise current role
  const displayRoleForLoading = isSwitchingRole && targetRole ? targetRole : userRole;
  const loadingRoleConfig = roleConfig[displayRoleForLoading as keyof typeof roleConfig] || roleConfig.citizen;
  const LoadingRoleIcon = loadingRoleConfig.icon;

  const currentRoleConfig = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.citizen;

  // Show loading state during initial load OR during role switching
  if (loading || isSwitchingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        {/* Role-specific color accent overlay */}
        <div 
          className="absolute inset-0 opacity-20 transition-colors duration-500"
          style={{ 
            background: `radial-gradient(circle at center, ${loadingRoleConfig.color} 0%, transparent 70%)` 
          }}
        />
        
        <div className="text-center animate-fade-in relative z-10">
          <div className="relative">
            <img 
              src={logo} 
              alt="NIGAM-Park" 
              className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" 
            />
            {/* Role icon badge */}
            <div 
              className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 ${loadingRoleConfig.bgColor} ${loadingRoleConfig.borderColor}`}
              style={{ 
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <LoadingRoleIcon className="w-4 h-4" style={{ color: loadingRoleConfig.color }} />
            </div>
          </div>
          
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full chakra-spinner mx-auto mb-4"
            style={{ borderColor: `${loadingRoleConfig.color} transparent ${loadingRoleConfig.color} ${loadingRoleConfig.color}` }}
          />
          
          <p className="text-muted-foreground">
            {isSwitchingRole ? (
              <span className="flex flex-col items-center gap-1">
                <span>Switching to</span>
                <span 
                  className="font-semibold"
                  style={{ color: loadingRoleConfig.color }}
                >
                  {loadingRoleConfig.label}
                </span>
              </span>
            ) : (
              'Loading NIGAM-Park...'
            )}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render view based on user role with transition
  const renderDashboard = () => {
    switch (displayedRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'attendant':
        return <AttendantPOS />;
      case 'citizen':
      default:
        return <CitizenPortal />;
    }
  };

  const slideOutClass = slideDirection === 'right' 
    ? 'translate-x-[-100%] opacity-0' 
    : 'translate-x-[100%] opacity-0';

  return (
    <div className="relative overflow-hidden">
      {/* Role accent line at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 z-50 transition-all duration-500"
        style={{ backgroundColor: currentRoleConfig.color }}
      />
      
      <div 
        className={`transition-all duration-300 ease-out ${
          isTransitioning ? slideOutClass : 'translate-x-0 opacity-100'
        }`}
      >
        {renderDashboard()}
      </div>
    </div>
  );
}
