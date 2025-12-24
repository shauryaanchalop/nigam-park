import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import AdminDashboard from './AdminDashboard';
import AttendantPOS from './AttendantPOS';
import CitizenPortal from './CitizenPortal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const roleLabels: Record<string, string> = {
  admin: 'MCD Commissioner',
  attendant: 'Parking Attendant',
  citizen: 'Citizen Portal',
};

export default function Index() {
  const { user, loading, userRole } = useAuth();
  const { profile } = useProfile();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const initialRoleRef = useRef(userRole);

  // Show welcome message on first load
  useEffect(() => {
    if (!hasShownWelcome && profile?.full_name && userRole && !loading) {
      const userName = profile.full_name.split(' ')[0];
      toast.success(`Welcome back, ${userName}!`, {
        description: `${roleLabels[userRole] || 'Dashboard'}`,
        duration: 3000,
      });
      setHasShownWelcome(true);
    }
  }, [userRole, profile, hasShownWelcome, loading]);

  // Update initial role reference
  useEffect(() => {
    if (userRole && !initialRoleRef.current) {
      initialRoleRef.current = userRole;
    }
  }, [userRole]);

  // Show loading state during initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center animate-fade-in relative z-10">
          <img 
            src={logo} 
            alt="NIGAM-Park" 
            className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" 
          />
          
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full chakra-spinner mx-auto mb-4" />
          
          <p className="text-muted-foreground">Loading NIGAM-Park...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render view based on user role
  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'attendant':
        return <AttendantPOS />;
      case 'citizen':
      default:
        return <CitizenPortal />;
    }
  };

  return renderDashboard();
}
