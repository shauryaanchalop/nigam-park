import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import AttendantPOS from './AttendantPOS';
import CitizenPortal from './CitizenPortal';

export default function Index() {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
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
