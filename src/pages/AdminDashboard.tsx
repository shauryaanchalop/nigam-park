import React from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Car, AlertTriangle, Bell, Users, BarChart3, MapPinned } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { StatCard } from '@/components/ui/StatCard';
import { VigilanceFeed } from '@/components/dashboard/VigilanceFeed';
import { ParkingMap } from '@/components/dashboard/ParkingMap';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { SimulationSidebar } from '@/components/simulation/SimulationSidebar';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useTodayStats } from '@/hooks/useTransactions';
import { useAlerts } from '@/hooks/useAlerts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { data: lots } = useParkingLots();
  const { data: stats } = useTodayStats();
  const { unresolvedCount, fraudAlerts } = useAlerts();

  const totalCapacity = lots?.reduce((sum, lot) => sum + lot.capacity, 0) ?? 0;
  const totalOccupancy = lots?.reduce((sum, lot) => sum + lot.current_occupancy, 0) ?? 0;
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  // Simulated leakage based on fraud alerts
  const estimatedLeakage = fraudAlerts.length * 150; // ₹150 per potential fraud

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="NIGAM-Park Command Center" 
        subtitle="MCD Revenue Assurance Dashboard"
      />

      <main className="container mx-auto px-4 py-6">
        {/* Live Indicator & Admin Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString('en-IN')}
            </span>
            {fraudAlerts.length > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="destructive" className="animate-pulse">
                  {fraudAlerts.length} Active Fraud Alert{fraudAlerts.length > 1 ? 's' : ''}
                </Badge>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/vision-dashboard">
                <Car className="w-4 h-4" />
                Vision AI
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/fraud-hunter">
                <AlertTriangle className="w-4 h-4" />
                Fraud Hunter
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/admin/analytics">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/admin/parking-lots">
                <MapPinned className="w-4 h-4" />
                Manage Lots
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/admin/users">
                <Users className="w-4 h-4" />
                Manage Users
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Revenue Today"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            subtitle={`${stats?.transactionCount ?? 0} transactions`}
            icon={IndianRupee}
            trend="up"
            trendValue="+12% from yesterday"
            variant="success"
          />
          <StatCard
            title="Active Occupancy"
            value={`${totalOccupancy}/${totalCapacity}`}
            subtitle={`${occupancyPercentage}% capacity`}
            icon={Car}
            variant="default"
          />
          <StatCard
            title="Leakage Detected"
            value={`₹${estimatedLeakage.toLocaleString('en-IN')}`}
            subtitle={`${fraudAlerts.length} potential fraud cases`}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Pending Alerts"
            value={unresolvedCount}
            subtitle="Requires attention"
            icon={Bell}
            variant={unresolvedCount > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map - 2 columns */}
          <div className="lg:col-span-2">
            <ParkingMap />
          </div>

          {/* Vigilance Feed - 1 column */}
          <div className="lg:col-span-1">
            <VigilanceFeed />
          </div>
        </div>

        {/* Charts Section */}
        <RevenueChart />
      </main>

      {/* Simulation Sidebar */}
      <SimulationSidebar />
    </div>
  );
}
