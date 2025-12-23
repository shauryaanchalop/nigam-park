import { useState } from 'react';
import { GovHeader } from '@/components/ui/GovHeader';
import { FraudAlertFeed } from '@/components/fraud/FraudAlertFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, TrendingDown, DollarSign, AlertTriangle, Volume2, VolumeX, Bell, BellOff, Zap, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFraudAlerts } from '@/hooks/useFraudAlerts';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { SimulationSidebar } from '@/components/simulation/SimulationSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FraudAlert } from '@/types/ai-modules';
import logo from '@/assets/logo.png';

export default function FraudHunter() {
  const { user, userRole, loading } = useAuth();
  const { alerts, createFraudAlert } = useFraudAlerts();
  const { isMuted, toggleMute, playAlertSound, sendBrowserNotification, notificationPermission, requestNotificationPermission } = useAlertNotifications();
  const isInitialLoad = useRef(true);
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  // Separate subscription for sound/browser notifications and email (only on FraudHunter page)
  useEffect(() => {
    // Mark initial load as complete after first render
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 1000);

    const channel = supabase
      .channel('fraud-alerts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts',
        },
        async (payload) => {
          const newAlert = payload.new as FraudAlert;
          
          if (isInitialLoad.current) return;
          
          // Play sound and send browser notification for critical/high alerts
          if (newAlert.severity === 'CRITICAL') {
            playAlertSound();
            sendBrowserNotification(
              '🚨 CRITICAL FRAUD ALERT',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-${newAlert.id}`
            );
            
            // Send email notification for critical alerts
            try {
              await supabase.functions.invoke('send-fraud-alert-email', {
                body: {
                  alertId: newAlert.id,
                  severity: newAlert.severity,
                  location: newAlert.location,
                  description: newAlert.description,
                },
              });
              console.log('Email notification sent for critical alert');
            } catch (error) {
              console.error('Failed to send email notification:', error);
            }
          } else if (newAlert.severity === 'HIGH') {
            sendBrowserNotification(
              '⚠️ High Priority Alert',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-${newAlert.id}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [playAlertSound, sendBrowserNotification]);

  const handleTestCriticalAlert = async () => {
    setIsTestingAlert(true);
    
    const testLocations = ['Zone A - Main Entry', 'Zone B - Exit Gate', 'Zone C - VIP Area', 'Zone D - Staff Parking'];
    const testDescriptions = [
      'Unauthorized vehicle detected bypassing payment barrier',
      'Multiple failed payment attempts from same terminal',
      'Suspicious cash handling pattern detected',
      'Vehicle mismatch between entry and exit records',
    ];
    
    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    const randomDescription = testDescriptions[Math.floor(Math.random() * testDescriptions.length)];
    
    try {
      await createFraudAlert.mutateAsync({
        severity: 'CRITICAL',
        location: randomLocation,
        description: randomDescription,
        metadata: { isTest: true, triggeredAt: new Date().toISOString() },
      });
      
      toast.success('Test critical alert created', {
        description: 'Sound, browser notification, and email will be triggered.',
      });
    } catch (error) {
      console.error('Failed to create test alert:', error);
      toast.error('Failed to create test alert');
    } finally {
      setIsTestingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <div className="chakra-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  // Calculate stats
  const criticalAlerts = alerts?.filter(a => a.severity === 'CRITICAL').length || 0;
  const highAlerts = alerts?.filter(a => a.severity === 'HIGH').length || 0;
  const estimatedLeakage = criticalAlerts * 500 + highAlerts * 200;

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      toast.success('Browser notifications enabled');
    } else if (permission === 'denied') {
      toast.error('Notification permission denied. Please enable in browser settings.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-destructive" />
              Fraud Hunter
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered real-time fraud detection and revenue leakage prevention
            </p>
          </div>
          
          {/* Notification Controls */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleTestCriticalAlert}
                    disabled={isTestingAlert}
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {isTestingAlert ? 'Creating...' : 'Test Alert'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Create a test critical alert to verify notifications
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMuted ? "outline" : "default"}
                    size="icon"
                    onClick={toggleMute}
                    className={isMuted ? "text-muted-foreground" : ""}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? 'Unmute alert sounds' : 'Mute alert sounds'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={notificationPermission === 'granted' ? "default" : "outline"}
                    size="icon"
                    onClick={handleEnableNotifications}
                    className={notificationPermission !== 'granted' ? "text-muted-foreground" : ""}
                  >
                    {notificationPermission === 'granted' ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {notificationPermission === 'granted' 
                    ? 'Browser notifications enabled' 
                    : 'Enable browser notifications'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                  <p className="text-3xl font-bold text-destructive">{criticalAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-3xl font-bold text-warning">{highAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Active</p>
                  <p className="text-3xl font-bold">{alerts?.length || 0}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Est. Leakage</p>
                  <p className="text-3xl font-bold text-destructive">₹{estimatedLeakage.toLocaleString()}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fraud Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <FraudAlertFeed />
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  Recovery Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Prevented Today</p>
                  <p className="text-2xl font-bold text-success">₹12,450</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">₹2,34,500</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-2xl font-bold text-primary">94.2%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Critical alerts automatically send email notifications to administrators.
                </p>
                <div className="flex items-center gap-2 p-2 bg-success/10 rounded text-success text-sm">
                  <Bell className="w-4 h-4" />
                  Email alerts active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Detection Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Zone A - Main Entry', 'Zone B - Exit Gate', 'Zone C - VIP Area'].map((zone, i) => (
                    <div key={zone} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{zone}</span>
                      <span className={`text-xs font-medium ${i === 0 ? 'text-destructive' : 'text-success'}`}>
                        {i === 0 ? '2 alerts' : 'Clear'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SimulationSidebar />
    </div>
  );
}
