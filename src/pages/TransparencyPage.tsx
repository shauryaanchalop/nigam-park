import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  IndianRupee,
  Car,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GovHeader } from '@/components/ui/GovHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { useDailyTransparency, useZoneTransparency } from '@/hooks/useTransparency';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function TransparencyPage() {
  const [days, setDays] = useState(30);
  const { data: zones, isLoading } = useZoneTransparency(days);
  const { data: daily } = useDailyTransparency(Math.min(days, 30));

  const totals = useMemo(() => {
    const rows = zones ?? [];
    const capacity = rows.reduce((s, r) => s + r.total_capacity, 0);
    const occupied = rows.reduce((s, r) => s + r.current_occupancy, 0);
    return {
      revenue: rows.reduce((s, r) => s + r.total_revenue, 0),
      sessions: rows.reduce((s, r) => s + r.transaction_count, 0),
      capacity,
      occupancy: capacity > 0 ? (occupied / capacity) * 100 : 0,
      zones: rows.length,
    };
  }, [zones]);

  const exportCsv = () => {
    if (!zones || zones.length === 0) {
      toast.error('No published data available yet');
      return;
    }
    const rows = [
      ['Zone', 'Lots', 'Capacity', 'Occupied now', 'Occupancy %', `Revenue (last ${days}d, INR)`, 'Sessions'],
      ...zones.map((z) => [
        z.zone,
        z.lot_count,
        z.total_capacity,
        z.current_occupancy,
        z.occupancy_percent,
        z.total_revenue,
        z.transaction_count,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nigam-park-open-data-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Open data exported');
  };

  const chartData = (zones ?? []).map((z) => ({
    zone: z.zone,
    revenue: z.total_revenue,
    occupancy: z.occupancy_percent,
  }));

  const trendData = (daily ?? []).map((d) => ({
    day: format(parseISO(d.day), 'dd MMM'),
    revenue: d.total_revenue,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Public Transparency Dashboard"
        description="Anonymised, zone-level parking occupancy and revenue data published openly by the Municipal Corporation of Delhi."
        path="/transparency"
      />
      <GovHeader
        title="Public Transparency Dashboard"
        subtitle="Open, anonymised parking data for every Delhi zone"
      />

      <main className="container mx-auto px-4 py-6 space-y-6 flex-1">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" /> Home
          </Link>
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" /> Where your parking fees go
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Published in near real time. No personal data, vehicle numbers or individual
              transactions are ever included.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={days === r.value ? 'default' : 'outline'}
                onClick={() => setDays(r.value)}
              >
                {r.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="w-3 h-3" /> Anonymised at zone level
        </Badge>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={`Revenue (${days}d)`}
            value={`₹${totals.revenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
          />
          <StatCard
            title={`Sessions (${days}d)`}
            value={totals.sessions.toLocaleString('en-IN')}
            icon={Car}
          />
          <StatCard title="Published zones" value={String(totals.zones)} icon={Building2} />
          <StatCard
            title="Occupancy now"
            value={`${totals.occupancy.toFixed(1)}%`}
            icon={BarChart3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by zone</CardTitle>
              <CardDescription>Collected parking fees over the last {days} days</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="zone" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily collection trend</CardTitle>
              <CardDescription>City-wide totals, updated continuously</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No transactions published for this period yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zone-by-zone breakdown</CardTitle>
            <CardDescription>
              Capacity, live utilisation and collections for every MCD parking zone
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (
              <ul className="divide-y">
                {(zones ?? []).map((z) => (
                  <li key={z.zone} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold">{z.zone}</p>
                        <p className="text-xs text-muted-foreground">
                          {z.lot_count} lots · {z.total_capacity} spaces ·{' '}
                          {z.transaction_count.toLocaleString('en-IN')} sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{z.total_revenue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {z.occupancy_percent}% occupied now
                        </p>
                      </div>
                    </div>
                    <Progress value={z.occupancy_percent} className="h-1.5" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
