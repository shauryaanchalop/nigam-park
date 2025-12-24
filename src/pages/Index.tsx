import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import AttendantPOS from './AttendantPOS';
import CitizenPortal from './CitizenPortal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import logo from '@/assets/logo.png';

export default function Index() {
  const { user, loading, userRole, isSwitchingRole } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedRole, setDisplayedRole] = useState(userRole);

  // Handle role change with transition
  useEffect(() => {
    if (userRole !== displayedRole && !isSwitchingRole && !loading) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedRole(userRole);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    } else if (!displayedRole && userRole) {
      setDisplayedRole(userRole);
    }
  }, [userRole, displayedRole, isSwitchingRole, loading]);

  // Show loading state during initial load OR during role switching
  if (loading || isSwitchingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center animate-fade-in">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover animate-pulse" />
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full chakra-spinner mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isSwitchingRole ? 'Switching role...' : 'Loading NIGAM-Park...'}
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

  return (
    <div 
      className={`transition-all duration-300 ease-out ${
        isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      {renderDashboard()}
    </div>
  );
}
