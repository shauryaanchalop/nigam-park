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
  Shield,
  Receipt,
  Radio,
  Zap,
  Building2,
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { StatCard } from '@/components/ui/StatCard';
import { VigilanceFeed } from '@/components/dashboard/VigilanceFeed';
import { ParkingMap } from '@/components/dashboard/ParkingMap';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RealTimeOccupancyWidget } from '@/components/dashboard/RealTimeOccupancyWidget';
import { RevenueTargetWidget } from '@/components/admin/RevenueTargetWidget';
import { AdminBroadcastPanel } from '@/components/admin/AdminBroadcastPanel';
import { SurgeRevenueWidget } from '@/components/dashboard/SurgeRevenueWidget';

import { useParkingLots } from '@/hooks/useParkingLots';
import { useTodayStats } from '@/hooks/useTransactions';
import { useAlerts } from '@/hooks/useAlerts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: lots } = useParkingLots();
  const { data: stats } = useTodayStats();
  const { unresolvedCount, fraudAlerts } = useAlerts();
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const totalCapacity = lots?.reduce((sum, lot) => sum + lot.capacity, 0) ?? 0;
  const totalOccupancy = lots?.reduce((sum, lot) => sum + lot.current_occupancy, 0) ?? 0;
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  // Simulated leakage based on fraud alerts
  const estimatedLeakage = fraudAlerts.length * 150;

  const quickActions = [
    { label: t('admin.visionAI'), labelKey: 'visionAI', icon: Eye, href: '/vision-dashboard', color: 'primary' },
    { label: t('admin.fraudHunter'), labelKey: 'fraudHunter', icon: AlertTriangle, href: '/fraud-hunter', color: 'destructive' },
    { label: t('admin.violations'), labelKey: 'violations', icon: AlertTriangle, href: '/admin/violations', color: 'warning' },
    { label: t('admin.fines'), labelKey: 'fines', icon: Receipt, href: '/admin/fines', color: 'warning' },
    { label: t('admin.surgePricing'), labelKey: 'surgePricing', icon: Zap, href: '/admin/surge-pricing', color: 'warning' },
    { label: t('admin.analytics'), labelKey: 'analytics', icon: BarChart3, href: '/admin/analytics', color: 'accent' },
    { label: t('admin.realtime'), labelKey: 'realtime', icon: Radio, href: '/admin/realtime', color: 'primary' },
    { label: t('admin.manageLots'), labelKey: 'manageLots', icon: MapPinned, href: '/admin/parking-lots', color: 'success' },
    { label: t('admin.users'), labelKey: 'users', icon: Users, href: '/admin/users', color: 'primary' },
    { label: t('admin.shifts'), labelKey: 'shifts', icon: Clock, href: '/admin/shifts', color: 'primary' },
    { label: isHindi ? 'लाइव मैप' : 'Live Map', labelKey: 'liveMap', icon: MapPinned, href: '/live-map', color: 'success' },
    { label: t('admin.fleet'), labelKey: 'fleet', icon: Building2, href: '/business-account', color: 'accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title={isHindi ? 'निगम-पार्क कमांड सेंटर' : 'NIGAM-Park Command Center'} 
        subtitle={isHindi ? 'MCD राजस्व आश्वासन डैशबोर्ड' : 'MCD Revenue Assurance Dashboard'}
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
                    <span className="text-sm font-medium text-success">
                      {isHindi ? 'सिस्टम चालू' : 'System Live'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isHindi ? 'अंतिम अपडेट:' : 'Last updated:'}
                    </span>
                    <span>{new Date().toLocaleTimeString(isHindi ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {fraudAlerts.length > 0 && (
                    <Badge variant="destructive" className="animate-pulse gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      {fraudAlerts.length} {isHindi ? 'अलर्ट' : 'Alert'}{fraudAlerts.length > 1 && !isHindi ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Quick Actions - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.labelKey}
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
                      key={action.labelKey}
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
            title={isHindi ? 'आज का राजस्व' : 'Revenue Today'}
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString(isHindi ? 'hi-IN' : 'en-IN')}`}
            subtitle={`${stats?.transactionCount ?? 0} ${isHindi ? 'लेनदेन' : 'transactions'}`}
            icon={IndianRupee}
            trend="up"
            trendValue="+12%"
            variant="success"
            compact={true}
            onClick={() => navigate('/admin/analytics')}
          />
          <StatCard
            title={isHindi ? 'अधिभोग' : 'Occupancy'}
            value={`${occupancyPercentage}%`}
            subtitle={`${totalOccupancy}/${totalCapacity} ${isHindi ? 'स्थान' : 'spots'}`}
            icon={Car}
            variant="default"
            compact={true}
          />
          <StatCard
            title={isHindi ? 'रिसाव' : 'Leakage'}
            value={`₹${estimatedLeakage.toLocaleString(isHindi ? 'hi-IN' : 'en-IN')}`}
            subtitle={`${fraudAlerts.length} ${isHindi ? 'धोखाधड़ी मामले' : 'fraud cases'}`}
            icon={AlertTriangle}
            variant="danger"
            compact={true}
            onClick={() => navigate('/fraud-hunter')}
          />
          <StatCard
            title={isHindi ? 'अलर्ट' : 'Alerts'}
            value={unresolvedCount}
            subtitle={isHindi ? 'लंबित कार्रवाई' : 'Pending action'}
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
                    {isHindi ? 'पार्किंग नेटवर्क' : 'Parking Network'}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {lots?.length ?? 0} {isHindi ? 'स्थान' : 'locations'}
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
          <div className="xl:col-span-1 order-1 xl:order-2 space-y-4 sm:space-y-6">
            {/* Real-Time Occupancy Widget */}
            <RealTimeOccupancyWidget />
            
            <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  {isHindi ? 'लाइव गतिविधि' : 'Live Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[280px] sm:h-[300px] overflow-hidden">
                  <VigilanceFeed />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Revenue Target Widget */}
        <RevenueTargetWidget />

        {/* Surge Revenue Impact Widget */}
        <div className="mb-6">
          <SurgeRevenueWidget />
        </div>

        {/* Broadcast + Revenue Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Broadcast Panel */}
          <div className="lg:col-span-1">
            <AdminBroadcastPanel />
          </div>

          {/* Revenue Chart Section */}
          <Card className="lg:col-span-2 overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                {isHindi ? 'राजस्व विश्लेषण' : 'Revenue Analytics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <RevenueChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}