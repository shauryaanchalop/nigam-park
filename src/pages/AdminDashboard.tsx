import React from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  Car, 
  AlertTriangle, 
  Bell, 
  Users, 
  BarChart3, 
  MapPinned, 
  Eye,
  Activity,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: lots } = useParkingLots();
  const { data: stats } = useTodayStats();
  const { unresolvedCount, fraudAlerts } = useAlerts();
  const navigate = useNavigate();

  const totalCapacity = lots?.reduce((sum, lot) => sum + lot.capacity, 0) ?? 0;
  const totalOccupancy = lots?.reduce((sum, lot) => sum + lot.current_occupancy, 0) ?? 0;
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  // Simulated leakage based on fraud alerts
  const estimatedLeakage = fraudAlerts.length * 150;

  const quickActions = [
    { label: 'Vision AI', icon: Eye, href: '/vision-dashboard', color: 'primary' },
    { label: 'Fraud Hunter', icon: AlertTriangle, href: '/fraud-hunter', color: 'destructive' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'accent' },
    { label: 'Manage Lots', icon: MapPinned, href: '/admin/parking-lots', color: 'success' },
    { label: 'Users', icon: Users, href: '/admin/users', color: 'primary' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="NIGAM-Park Command Center" 
        subtitle="MCD Revenue Assurance Dashboard"
      />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        {/* Hero Section with Live Status */}
        <div className="relative mb-6 sm:mb-8">
          <div className="mesh-gradient absolute inset-0 rounded-2xl opacity-50" />
          <Card className="relative border-0 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Live Status */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                    <div className="w-2 h-2 rounded-full bg-success live-indicator" />
                    <span className="text-sm font-medium text-success">System Live</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Last updated:</span>
                    <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {fraudAlerts.length > 0 && (
                    <Badge variant="destructive" className="animate-pulse gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      {fraudAlerts.length} Alert{fraudAlerts.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Quick Actions - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-primary/5 hover:border-primary/30"
                    >
                      <Link to={action.href}>
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Actions - Mobile Horizontal Scroll */}
              <div className="lg:hidden mt-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
                <div className="flex gap-2 pb-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0 whitespace-nowrap"
                    >
                      <Link to={action.href}>
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Revenue Today"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            subtitle={`${stats?.transactionCount ?? 0} transactions`}
            icon={IndianRupee}
            trend="up"
            trendValue="+12%"
            variant="success"
            compact={true}
            onClick={() => navigate('/admin/analytics')}
          />
          <StatCard
            title="Occupancy"
            value={`${occupancyPercentage}%`}
            subtitle={`${totalOccupancy}/${totalCapacity} spots`}
            icon={Car}
            variant="default"
            compact={true}
          />
          <StatCard
            title="Leakage"
            value={`₹${estimatedLeakage.toLocaleString('en-IN')}`}
            subtitle={`${fraudAlerts.length} fraud cases`}
            icon={AlertTriangle}
            variant="danger"
            compact={true}
            onClick={() => navigate('/fraud-hunter')}
          />
          <StatCard
            title="Alerts"
            value={unresolvedCount}
            subtitle="Pending action"
            icon={Bell}
            variant={unresolvedCount > 0 ? 'warning' : 'default'}
            compact={true}
          />
        </div>

        {/* Main Dashboard Grid - Improved Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Map Section */}
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Card className="h-full overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                      <MapPinned className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    Parking Network
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {lots?.length ?? 0} locations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
                  <ParkingMap />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vigilance Feed */}
          <div className="xl:col-span-1 order-1 xl:order-2">
            <Card className="h-full overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  Live Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[280px] sm:h-[350px] lg:h-[400px] overflow-hidden">
                  <VigilanceFeed />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <RevenueChart />
          </CardContent>
        </Card>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden mobile-action-bar">
        {quickActions.slice(0, 5).map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <action.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{action.label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>

      {/* Simulation Sidebar */}
      <SimulationSidebar />
    </div>
  );
}
