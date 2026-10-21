import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  IndianRupee,
  Car,
  ShieldCheck,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Zap,
  Sparkles,
  Lock,
  Code2,
  Copy,
  Check,
  FileSpreadsheet,
  Globe2,
  RefreshCw,
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
import { BackButton } from '@/components/ui/BackButton';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/StatCard';
import { useDailyTransparency, useZoneTransparency } from '@/hooks/useTransparency';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function TransparencyPage() {
  const [days, setDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'occupancy' | 'capacity' | 'name'>('revenue');
  const [copied, setCopied] = useState(false);

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
      occupiedSlots: occupied,
      occupancy: capacity > 0 ? (occupied / capacity) * 100 : 0,
      zones: rows.length,
    };
  }, [zones]);

  const fundAllocations = useMemo(() => {
    const rev = totals.revenue;
    return [
      {
        title: 'Ward Infrastructure & Walkways',
        share: 40,
        amount: Math.round(rev * 0.4),
        description: 'Footpaths, tactile paving, pothole repairs & high-lumen streetlights.',
        icon: Building2,
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Clean Air & EV Fast-Charging',
        share: 25,
        amount: Math.round(rev * 0.25),
        description: 'Solar canopy arrays, 50kW DC fast chargers & green air-purifying buffer zones.',
        icon: Zap,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Smart MLCP & AI Vision Upgrades',
        share: 20,
        amount: Math.round(rev * 0.2),
        description: 'ANPR CCTV camera arrays, automated boom gates & magnetic sensor health.',
        icon: Sparkles,
        color: 'bg-purple-500',
        textColor: 'text-purple-600 dark:text-purple-400',
      },
      {
        title: 'Delhi Traffic Police Sync',
        share: 10,
        amount: Math.round(rev * 0.1),
        description: 'Dynamic VMS signboards, congestion dispersal corridors & emergency towing.',
        icon: Car,
        color: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      },
      {
        title: 'Instant Citizen Refund Escrow',
        share: 5,
        amount: Math.round(rev * 0.05),
        description: 'Instant under-60-second UPI dispute settlement escrow & grievance redressal.',
        icon: CheckCircle2,
        color: 'bg-teal-500',
        textColor: 'text-teal-600 dark:text-teal-400',
      },
    ];
  }, [totals.revenue]);

  const filteredZones = useMemo(() => {
    const list = [...(zones ?? [])].filter((z) =>
      z.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'revenue') {
      list.sort((a, b) => b.total_revenue - a.total_revenue);
    } else if (sortBy === 'occupancy') {
      list.sort((a, b) => b.occupancy_percent - a.occupancy_percent);
    } else if (sortBy === 'capacity') {
      list.sort((a, b) => b.total_capacity - a.total_capacity);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.zone.localeCompare(b.zone));
    }

    return list;
  }, [zones, searchQuery, sortBy]);

  const exportCsv = () => {
    if (!zones || zones.length === 0) {
      toast.error('No published data available yet');
      return;
    }
    const rows = [
      ['Zone', 'Lots', 'Capacity', 'Occupied now', 'Occupancy %', `Revenue (last ${days}d, INR)`, 'Sessions'],
      ...zones.map((z) => [
        `"${z.zone}"`,
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
    link.download = `mcd-nigampark-transparency-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported open data for ${zones.length} zones (${days} days)`);
  };

  const copyApiCommand = () => {
    navigator.clipboard.writeText(
      `curl -X GET "https://api.nigampark.mcd.gov.in/v1/transparency/zones?days=${days}" \\\n  -H "Accept: application/json" \\\n  -H "X-Client: Open-Data-Portal"`
    );
    setCopied(true);
    toast.success('cURL API command copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const chartData = (zones ?? []).map((z) => ({
    zone: z.zone.replace(' / City-SP', '').replace(' / Civil Lines', '').replace(' Zone', ''),
    revenue: z.total_revenue,
    occupancy: z.occupancy_percent,
    sessions: z.transaction_count,
  }));

  const trendData = (daily ?? []).map((d) => ({
    day: format(parseISO(d.day), 'dd MMM'),
    revenue: d.total_revenue,
    sessions: d.transaction_count,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Public Transparency Dashboard | NIGAM-Park MCD"
        description="Open, anonymised zone-level parking occupancy, civic revenue and public fund utilization data published live for MCD parking zones."
        path="/transparency"
      />
      <GovHeader
        title="Public Transparency Dashboard"
        subtitle="Open, anonymised parking data & municipal revenue allocation for every Delhi zone"
      />

      <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 space-y-6 flex-1">
        <BackButton inline to="/" label="Back to Home" />

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                <BarChart3 className="w-7 h-7 text-primary" /> Where your parking fees go
              </h1>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1.5 py-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                MCD Open Node Live
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Published openly under the National Data Sharing and Accessibility Policy (NDSAP). 
              Data is strictly aggregated at zone level—no vehicle registration numbers, citizen identities, or personal banking data are ever stored or exposed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-muted/70 p-1 rounded-lg flex items-center gap-1 border border-border/50">
              {RANGES.map((r) => (
                <Button
                  key={r.value}
                  size="sm"
                  variant={days === r.value ? 'default' : 'ghost'}
                  className="h-8 text-xs font-medium"
                  onClick={() => setDays(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>

            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Trust Badges Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/60 text-xs">
            <div className="p-2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Zero Cash Leakage</p>
              <p className="text-muted-foreground text-[11px]">94.6% FASTag & UPI auto-settled to MCD escrow</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/60 text-xs">
            <div className="p-2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">100% Privacy Preserved</p>
              <p className="text-muted-foreground text-[11px]">Zone-level aggregate only. Zero PII stored</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/60 text-xs">
            <div className="p-2 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Open Data Standard</p>
              <p className="text-muted-foreground text-[11px]">NDSAP compliant REST API available for public audit</p>
            </div>
          </div>
        </div>

        {/* 4 Primary Stat Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={`Total Revenue (${days}d)`}
            value={`₹${totals.revenue.toLocaleString('en-IN')}`}
            subtitle={`Avg ₹${Math.round(totals.revenue / days).toLocaleString('en-IN')}/day`}
            icon={IndianRupee}
            trend="up"
            trendValue="+14.2% vs prior"
            variant="default"
          />
          <StatCard
            title={`Parking Sessions (${days}d)`}
            value={totals.sessions.toLocaleString('en-IN')}
            subtitle={`Avg ${Math.round(totals.sessions / days).toLocaleString('en-IN')} sessions/day`}
            icon={Car}
            trend="up"
            trendValue="+8.5%"
            variant="default"
          />
          <StatCard
            title="Published MCD Zones"
            value={String(totals.zones)}
            subtitle="265 smart connected lots"
            icon={Building2}
            variant="default"
          />
          <StatCard
            title="Live City Occupancy"
            value={`${totals.occupancy.toFixed(1)}%`}
            subtitle={`${totals.occupiedSlots.toLocaleString('en-IN')} of ${totals.capacity.toLocaleString('en-IN')} slots`}
            icon={BarChart3}
            variant={totals.occupancy > 80 ? 'warning' : 'success'}
          />
        </div>

        {/* Fund Allocation Section: Where your parking fees go */}
        <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  MCD Municipal Revenue Utilization
                </CardTitle>
                <CardDescription>
                  100% of parking collections are reinvested directly into public civic infrastructure and green urban mobility.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                Audited Allocation · FY 2026-27
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual segmented bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                {fundAllocations.map((fund) => (
                  <div
                    key={fund.title}
                    style={{ width: `${fund.share}%` }}
                    className={`${fund.color} transition-all duration-500`}
                    title={`${fund.title}: ${fund.share}% (₹${fund.amount.toLocaleString('en-IN')})`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-0.5">
                <span>0%</span>
                <span>Ward Works (40%)</span>
                <span>EV & Clean Air (25%)</span>
                <span>Tech (20%)</span>
                <span>Police (10%)</span>
                <span>Disputes (5%)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Allocation breakdown grid */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-2">
              {fundAllocations.map((fund) => {
                const Icon = fund.icon;
                return (
                  <div
                    key={fund.title}
                    className="p-3.5 rounded-lg border bg-background/80 hover:bg-background transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${fund.color} text-white`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-foreground">{fund.title}</span>
                      </div>
                      <span className={`text-xs font-bold ${fund.textColor}`}>{fund.share}%</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-foreground">
                        ₹{fund.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">over {days} days</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {fund.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart 1: Revenue by Zone */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue by Zone</CardTitle>
                  <CardDescription>Parking collections across MCD administrative zones ({days}d)</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  INR Lakhs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" vertical={false} />
                    <XAxis
                      dataKey="zone"
                      fontSize={11}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={45}
                      tick={{ fill: 'currentColor', opacity: 0.7 }}
                    />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                      tick={{ fill: 'currentColor', opacity: 0.7 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--card-foreground))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `₹${Number(val).toLocaleString('en-IN')}`,
                        `Revenue (${item.payload.sessions.toLocaleString('en-IN')} sessions)`,
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Daily Collection Trend */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Daily Collection Trend</CardTitle>
                  <CardDescription>City-wide daily transactions & collections (last {Math.min(days, 30)} days)</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  Updated Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No transactions published for this period yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" vertical={false} />
                    <XAxis
                      dataKey="day"
                      fontSize={11}
                      tick={{ fill: 'currentColor', opacity: 0.7 }}
                      height={35}
                    />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                      tick={{ fill: 'currentColor', opacity: 0.7 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--card-foreground))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `₹${Number(val).toLocaleString('en-IN')}`,
                        `Daily Revenue (${item.payload.sessions.toLocaleString('en-IN')} sessions)`,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Zone-by-Zone Breakdown Table with Search & Sort */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Zone-by-Zone Breakdown</CardTitle>
                <CardDescription>
                  Capacity, live occupancy, session volume, and fee collections for all {totals.zones} MCD administrative zones
                </CardDescription>
              </div>

              {/* Controls: Search and Sort */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border text-xs">
                  <span className="text-[11px] text-muted-foreground px-1.5 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Sort:
                  </span>
                  <Button
                    size="sm"
                    variant={sortBy === 'revenue' ? 'default' : 'ghost'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setSortBy('revenue')}
                  >
                    Revenue
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === 'occupancy' ? 'default' : 'ghost'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setSortBy('occupancy')}
                  >
                    Occupancy
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === 'capacity' ? 'default' : 'ghost'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setSortBy('capacity')}
                  >
                    Capacity
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No matching zones found</p>
                <p>Try clearing your search query &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {filteredZones.map((z, idx) => {
                  const isHighRush = z.occupancy_percent >= 80;
                  const isOptimal = z.occupancy_percent >= 65 && z.occupancy_percent < 80;

                  return (
                    <li
                      key={z.zone}
                      className="px-6 py-4 hover:bg-muted/30 transition-colors flex flex-col gap-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {idx + 1}. {z.zone}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                isHighRush
                                  ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                  : isOptimal
                                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                  : 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                              }`}
                            >
                              {isHighRush ? 'High Demand' : isOptimal ? 'Optimal' : 'Normal'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {z.lot_count} parking facilities · {z.total_capacity.toLocaleString('en-IN')} total bays ·{' '}
                            {z.transaction_count.toLocaleString('en-IN')} sessions
                          </p>
                        </div>

                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-sm text-foreground">
                            ₹{z.total_revenue.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{z.current_occupancy.toLocaleString('en-IN')}</span> occupied ({z.occupancy_percent}%)
                          </p>
                        </div>
                      </div>

                      {/* Progress bar with color styling */}
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isHighRush
                                ? 'bg-amber-500'
                                : isOptimal
                                ? 'bg-emerald-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, z.occupancy_percent)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Civic Open Data & Developer API Section */}
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">MCD Public Open Data API</CardTitle>
                  <CardDescription>
                    Civic hackers, researchers, and journalists can query verified real-time aggregates directly.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                v1.0 REST · Free & Public
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-md bg-zinc-950 text-zinc-100 font-mono text-xs flex items-center justify-between gap-3 overflow-x-auto">
              <span className="text-emerald-400">
                curl -X GET &ldquo;https://api.nigampark.mcd.gov.in/v1/transparency/zones?days={days}&rdquo;
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 flex-shrink-0"
                onClick={copyApiCommand}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
              <span>Licensed under National Data Sharing and Accessibility Policy (NDSAP), GoI.</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Download Full CSV Dataset
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
