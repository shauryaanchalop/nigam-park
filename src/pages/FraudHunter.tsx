import { GovHeader } from '@/components/ui/GovHeader';
import { FraudAlertFeed } from '@/components/fraud/FraudAlertFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFraudAlerts } from '@/hooks/useFraudAlerts';
import { SimulationSidebar } from '@/components/simulation/SimulationSidebar';

export default function FraudHunter() {
  const { user, userRole, loading } = useAuth();
  const { alerts } = useFraudAlerts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="chakra-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  // Calculate stats
  const criticalAlerts = alerts?.filter(a => a.severity === 'CRITICAL').length || 0;
  const highAlerts = alerts?.filter(a => a.severity === 'HIGH').length || 0;
  const estimatedLeakage = criticalAlerts * 500 + highAlerts * 200; // Simulated calculation

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-destructive" />
            Fraud Hunter
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered real-time fraud detection and revenue leakage prevention
          </p>
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
