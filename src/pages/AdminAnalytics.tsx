import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, IndianRupee, Car, Calendar, BarChart3, 
  ArrowUpRight, ArrowDownRight, ChevronLeft, AlertTriangle, Clock, CalendarIcon,
  Brain
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GovHeader } from '@/components/ui/GovHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  useRevenueAnalytics, 
  useOccupancyAnalytics, 
  useReservationAnalytics,
  useSummaryStats,
  useOverstayReport,
  useOverstayTrends,
  TimeRange,
  OverstayTrendRange
} from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { RevenueForecastChart } from '@/components/analytics/RevenueForecastChart';
import { FraudDetectionPanel } from '@/components/analytics/FraudDetectionPanel';
import { UsageHeatmap } from '@/components/analytics/UsageHeatmap';
import { OccupancyPredictionChart } from '@/components/analytics/OccupancyPredictionChart';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [overstayDate, setOverstayDate] = useState<Date>(new Date());
  const [overstayTrendRange, setOverstayTrendRange] = useState<OverstayTrendRange>('weekly');
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(timeRange);
  const { data: occupancyData, isLoading: occupancyLoading } = useOccupancyAnalytics();
  const { data: reservationStats } = useReservationAnalytics(timeRange);
  const { data: summaryStats } = useSummaryStats();
  const { data: overstayReport, isLoading: overstayLoading } = useOverstayReport(overstayDate);
  const { data: overstayTrends, isLoading: overstayTrendsLoading } = useOverstayTrends(overstayTrendRange);
  
  const isToday = format(overstayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const paymentMethodData = revenueData ? [
    { name: 'FASTag', value: revenueData.reduce((sum, d) => sum + d.fastag, 0) },
    { name: 'Cash', value: revenueData.reduce((sum, d) => sum + d.cash, 0) },
    { name: 'UPI', value: revenueData.reduce((sum, d) => sum + d.upi, 0) },
    { name: 'Overstay Fee', value: revenueData.reduce((sum, d) => sum + d.overstayFee, 0) },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Analytics & Reports" 
        subtitle="Revenue and Occupancy Insights"
      />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{(summaryStats?.todayRevenue ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  (summaryStats?.revenueChange ?? 0) >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {(summaryStats?.revenueChange ?? 0) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(summaryStats?.revenueChange ?? 0)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{(summaryStats?.weekRevenue ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{(summaryStats?.avgDailyRevenue ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <IndianRupee className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservations</p>
                  <p className="text-2xl font-bold">{reservationStats?.total ?? 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {reservationStats?.completed ?? 0} completed, {reservationStats?.cancelled ?? 0} cancelled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>
                Revenue over time by payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="displayDate" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="fastag" name="FASTag" fill="hsl(var(--primary))" stackId="a" />
                    <Bar dataKey="cash" name="Cash" fill="hsl(var(--warning))" stackId="a" />
                    <Bar dataKey="upi" name="UPI" fill="hsl(var(--success))" stackId="a" />
                    <Bar dataKey="overstayFee" name="Overstay Fee" fill="hsl(var(--destructive))" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Revenue distribution by payment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Occupancy Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Current Occupancy by Lot
            </CardTitle>
            <CardDescription>
              Real-time parking lot utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {occupancyLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="lotName" type="category" width={150} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${props.payload.occupancy}/${props.payload.capacity} (${value}%)`,
                      'Occupancy'
                    ]}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Overstay Trends Chart */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-destructive" />
                  Overstay Fee Trends
                </CardTitle>
                <CardDescription>
                  Revenue from overstay penalties over time
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Tabs value={overstayTrendRange} onValueChange={(v) => setOverstayTrendRange(v as OverstayTrendRange)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="weekly" className="text-xs px-3">7 Days</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs px-3">30 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="text-right hidden sm:block">
                  <p className="text-lg font-bold text-destructive">
                    ₹{(overstayTrends?.totalAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {overstayTrends?.totalCount ?? 0} vehicles • Avg ₹{overstayTrends?.avgPerDay ?? 0}/day
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {overstayTrendsLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !overstayTrends?.data?.length ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>No overstay data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={overstayTrends.data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="displayDate" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'amount' ? `₹${value.toLocaleString('en-IN')}` : `${value} vehicles`,
                      name === 'amount' ? 'Revenue' : 'Vehicles'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Revenue" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" name="Vehicles" fill="hsl(var(--destructive) / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border sm:hidden">
              <div className="text-center">
                <p className="text-lg font-bold text-destructive">₹{(overstayTrends?.totalAmount ?? 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{overstayTrends?.totalCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Vehicles</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">₹{overstayTrends?.avgPerDay ?? 0}</p>
                <p className="text-xs text-muted-foreground">Avg/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overstay Report */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Overstay Report
                </CardTitle>
                <CardDescription>
                  Vehicles that incurred overstay fees
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !overstayDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(overstayDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={overstayDate}
                      onSelect={(date) => date && setOverstayDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">
                    ₹{(overstayReport?.totalAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {overstayReport?.totalVehicles ?? 0} vehicles
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {overstayLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !overstayReport?.records?.length ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                <p>No overstay fees recorded {isToday ? 'today' : `on ${format(overstayDate, 'MMM d, yyyy')}`}</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {overstayReport.records.map((record) => (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold text-sm">{record.vehicle_number}</p>
                          <Badge variant="destructive" className="text-[10px]">
                            Overstay
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {record.parking_lots?.name} • {record.parking_lots?.zone}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(record.created_at), 'h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">₹{record.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Reservation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reservation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{reservationStats?.total ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{reservationStats?.confirmed ?? 0}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{reservationStats?.checkedIn ?? 0}</p>
                <p className="text-sm text-muted-foreground">Checked In</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{reservationStats?.completed ?? 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{reservationStats?.cancelled ?? 0}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
              Total reservation revenue: <span className="font-semibold text-foreground">₹{(reservationStats?.totalRevenue ?? 0).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Analytics Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">AI-Powered Insights</h2>
            <Badge variant="secondary">Beta</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Forecast */}
            <RevenueForecastChart />
            
            {/* Fraud Detection */}
            <FraudDetectionPanel />
          </div>

          {/* Occupancy Prediction */}
          <div className="mb-6">
            <OccupancyPredictionChart />
          </div>
          
          {/* Usage Heatmap */}
          <UsageHeatmap />
        </div>
      </main>
    </div>
  );
}
