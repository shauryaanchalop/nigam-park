import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import AttendantPOS from './AttendantPOS';
import CitizenPortal from './CitizenPortal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import logo from '@/assets/logo.png';

export default function Index() {
  const { user, loading, userRole, isSwitchingRole } = useAuth();

  // Show loading state during initial load OR during role switching
  if (loading || isSwitchingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
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

  // Render view based on user role
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'attendant':
      return <AttendantPOS />;
    case 'citizen':
    default:
      return <CitizenPortal />;
  }
}
