import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Edit2, 
  ArrowUpRight, 
  Sparkles,
  BarChart2,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRevenueTargets, FacilityTarget } from '@/hooks/useRevenueTargets';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function RevenueTargetWidget() {
  const { progress, trend, facilityTargets, isLoading, setTarget, updateFacilityTarget } = useRevenueTargets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'facilities'>('chart');
  
  // Settings dialog state
  const [dialogTab, setDialogTab] = useState<'roster' | 'edit'>('roster');
  const [targetScope, setTargetScope] = useState<'municipal' | 'facility'>('municipal');
  const [targetType, setTargetType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilityTargets[0]?.id || 'fac-cp-01');
  const [targetAmount, setTargetAmount] = useState('');

  const handleOpenEditForScope = (scope: 'municipal' | 'facility', typeOrId: string, currentAmount: number) => {
    setTargetScope(scope);
    if (scope === 'municipal') {
      setTargetType(typeOrId as 'daily' | 'weekly' | 'monthly');
    } else {
      setSelectedFacilityId(typeOrId);
    }
    setTargetAmount(currentAmount.toString());
    setDialogTab('edit');
    setSettingsOpen(true);
  };

  const handleSaveTarget = async () => {
    if (!targetAmount || isNaN(Number(targetAmount))) return;
    const amount = parseFloat(targetAmount);

    if (targetScope === 'municipal') {
      let date = format(new Date(), 'yyyy-MM-dd');
      if (targetType === 'weekly') {
        date = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      } else if (targetType === 'monthly') {
        date = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      }

      await setTarget.mutateAsync({
        targetType,
        amount,
        date,
      });
    } else {
      await updateFacilityTarget.mutateAsync({
        facilityId: selectedFacilityId,
        newDailyTarget: amount,
      });
    }

    setSettingsOpen(false);
    setTargetAmount('');
    setDialogTab('roster');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 80) return 'bg-primary';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusBadge = (status: FacilityTarget['status']) => {
    switch (status) {
      case 'achieved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Achieved
          </Badge>
        );
      case 'on_track':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            On Track
          </Badge>
        );
      case 'at_risk':
      default:
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-medium">
            <AlertCircle className="w-3 h-3 mr-1" />
            At Risk
          </Badge>
        );
    }
  };

  return (
    <Card className="col-span-full border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 bg-muted/20 border-b border-border/40">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </div>
            Revenue Targets & Performance Benchmarks
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-0.5">
            Municipal NDMC & MCD revenue benchmarks with daily variance and facility tracking
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle Tabs */}
          <div className="inline-flex rounded-lg bg-muted p-1 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                activeTab === 'chart' 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Benchmark Trend
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facilities')}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                activeTab === 'facilities' 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Facility Targets ({facilityTargets.length})
            </button>
          </div>

          {/* Set Targets Dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border/60 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                Manage Targets
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Revenue Target Management
                </DialogTitle>
                <DialogDescription>
                  Review active revenue targets across Delhi municipal zones or update quotas.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as any)} className="w-full mt-2">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="roster">Active Targets Roster</TabsTrigger>
                  <TabsTrigger value="edit">Update Target Quota</TabsTrigger>
                </TabsList>

                {/* Tab 1: Active Targets Roster */}
                <TabsContent value="roster" className="space-y-4 m-0">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Municipal Overall Targets
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Daily Target</span>
                          <p className="text-lg font-bold text-foreground">
                            ₹{(progress?.daily.target || 75000).toLocaleString('en-IN')}
                          </p>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {progress?.daily.percentage || 86}% Achieved Today
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs mt-2 justify-start px-0 text-primary hover:bg-transparent hover:underline"
                          onClick={() => handleOpenEditForScope('municipal', 'daily', progress?.daily.target || 75000)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Target
                        </Button>
                      </div>

                      <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Weekly Target</span>
                          <p className="text-lg font-bold text-foreground">
                            ₹{(progress?.weekly.target || 500000).toLocaleString('en-IN')}
                          </p>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {progress?.weekly.percentage || 83}% Achieved
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs mt-2 justify-start px-0 text-primary hover:bg-transparent hover:underline"
                          onClick={() => handleOpenEditForScope('municipal', 'weekly', progress?.weekly.target || 500000)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Target
                        </Button>
                      </div>

                      <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Monthly Target</span>
                          <p className="text-lg font-bold text-foreground">
                            ₹{(progress?.monthly.target || 2000000).toLocaleString('en-IN')}
                          </p>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {progress?.monthly.percentage || 84}% Achieved
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs mt-2 justify-start px-0 text-primary hover:bg-transparent hover:underline"
                          onClick={() => handleOpenEditForScope('municipal', 'monthly', progress?.monthly.target || 2000000)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Target
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Facility Daily Revenue Targets ({facilityTargets.length} Hubs)
                    </h4>
                    <div className="border border-border/60 rounded-lg overflow-hidden divide-y divide-border/40 bg-card">
                      {facilityTargets.map((fac) => (
                        <div key={fac.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{fac.facilityName}</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                {fac.zone}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Target: <strong className="text-foreground">₹{fac.dailyTarget.toLocaleString('en-IN')}</strong>/day</span>
                              <span>•</span>
                              <span>Today: ₹{fac.dailyActual.toLocaleString('en-IN')}</span>
                              <span>•</span>
                              <span className="font-medium text-primary">{fac.achievementRate}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(fac.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenEditForScope('facility', fac.id, fac.dailyTarget)}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Update Target Form */}
                <TabsContent value="edit" className="space-y-4 m-0">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      Updating targets immediately adjusts municipal real-time achievement percentages, attendant scorecards, and surge pricing thresholds.
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Target Level</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={targetScope === 'municipal' ? 'default' : 'outline'}
                        className="justify-start h-9 text-xs"
                        onClick={() => setTargetScope('municipal')}
                      >
                        Municipal Overall
                      </Button>
                      <Button
                        type="button"
                        variant={targetScope === 'facility' ? 'default' : 'outline'}
                        className="justify-start h-9 text-xs"
                        onClick={() => setTargetScope('facility')}
                      >
                        Specific Parking Facility
                      </Button>
                    </div>
                  </div>

                  {targetScope === 'municipal' ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Target Period</Label>
                      <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Target (Standard: ₹75,000)</SelectItem>
                          <SelectItem value="weekly">Weekly Target (Standard: ₹5,00,000)</SelectItem>
                          <SelectItem value="monthly">Monthly Target (Standard: ₹20,00,000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Select Facility</Label>
                      <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {facilityTargets.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.facilityName} ({f.zone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Target Amount (₹)</Label>
                      <span className="text-[11px] text-muted-foreground">in Indian Rupees</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="e.g. 75000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="font-mono text-base"
                    />
                  </div>

                  {/* Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Quick Presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {targetScope === 'municipal' ? (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTargetAmount('75000')}
                          >
                            ₹75k (Standard Daily)
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTargetAmount('85000')}
                          >
                            ₹85k (Festival Peak Daily)
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTargetAmount('500000')}
                          >
                            ₹5.0L (Weekly)
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTargetAmount('18000')}
                          >
                            ₹18,000 (Hub Target)
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTargetAmount('12000')}
                          >
                            ₹12,000 (Medium Hub)
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setDialogTab('roster')}
                    >
                      Back to Roster
                    </Button>
                    <Button 
                      onClick={handleSaveTarget} 
                      className="flex-1 font-semibold"
                      disabled={!targetAmount || setTarget.isPending || updateFacilityTarget.isPending}
                    >
                      {setTarget.isPending || updateFacilityTarget.isPending ? 'Saving...' : 'Apply Target'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Daily */}
          <div className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Today's Benchmark
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "font-bold text-xs px-2 py-0.5",
                  (progress?.daily.percentage || 0) >= 100 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : (progress?.daily.percentage || 0) >= 80 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                )}
              >
                {progress?.daily.percentage.toFixed(0) || 86}%
              </Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  ₹{(progress?.daily.actual || 64250).toLocaleString('en-IN')}
                </span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  / ₹{(progress?.daily.target || 75000).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>
                  {(progress?.daily.actual || 0) >= (progress?.daily.target || 0) 
                    ? 'Target achieved 🎉' 
                    : `₹${Math.max(0, (progress?.daily.target || 75000) - (progress?.daily.actual || 64250)).toLocaleString('en-IN')} to goal`}
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  +12.4% vs last week
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <Progress 
                value={progress?.daily.percentage || 86} 
                className="h-2 bg-muted"
                indicatorClassName={getProgressColor(progress?.daily.percentage || 86)}
              />
            </div>
          </div>

          {/* Weekly */}
          <div className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                This Week Quota
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "font-bold text-xs px-2 py-0.5",
                  (progress?.weekly.percentage || 0) >= 100 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : (progress?.weekly.percentage || 0) >= 80 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                )}
              >
                {progress?.weekly.percentage.toFixed(0) || 83}%
              </Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  ₹{(progress?.weekly.actual || 412800).toLocaleString('en-IN')}
                </span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  / ₹{(progress?.weekly.target || 500000).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>
                  ₹{Math.max(0, (progress?.weekly.target || 500000) - (progress?.weekly.actual || 412800)).toLocaleString('en-IN')} remaining
                </span>
                <span className="font-medium text-primary">
                  4 of 7 days completed
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <Progress 
                value={progress?.weekly.percentage || 83} 
                className="h-2 bg-muted"
                indicatorClassName={getProgressColor(progress?.weekly.percentage || 83)}
              />
            </div>
          </div>

          {/* Monthly */}
          <div className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                This Month Target
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "font-bold text-xs px-2 py-0.5",
                  (progress?.monthly.percentage || 0) >= 100 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : (progress?.monthly.percentage || 0) >= 80 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                )}
              >
                {progress?.monthly.percentage.toFixed(0) || 84}%
              </Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  ₹{(progress?.monthly.actual || 1680000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  / ₹{(progress?.monthly.target || 2000000).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>
                  ₹{Math.max(0, (progress?.monthly.target || 2000000) - (progress?.monthly.actual || 1680000)).toLocaleString('en-IN')} to monthly goal
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Est. ₹21.4L (+7%)
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <Progress 
                value={progress?.monthly.percentage || 84} 
                className="h-2 bg-muted"
                indicatorClassName={getProgressColor(progress?.monthly.percentage || 84)}
              />
            </div>
          </div>
        </div>

        {/* Tab Content 1: 30-Day Trend vs Target Line */}
        {activeTab === 'chart' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Actual Revenue vs Target Benchmark (30-Day Trajectory)</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Target: ~₹75,000/day
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary" />
                  <span>Actual Revenue (₹)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Target Benchmark (₹)</span>
                </div>
              </div>
            </div>

            <div className="h-60 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    width={55}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue' || name === 'Actual Revenue') {
                        return [`₹${value.toLocaleString('en-IN')}`, 'Actual Revenue'];
                      }
                      if (name === 'target' || name === 'Target Benchmark') {
                        return [`₹${value.toLocaleString('en-IN')}`, 'Target Benchmark'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => format(new Date(label), 'EEEE, dd MMMM yyyy')}
                  />
                  {/* Actual Revenue Area */}
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Actual Revenue"
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#colorRevenueTarget)" 
                    strokeWidth={2.5}
                  />
                  {/* Daily Target Benchmark Reference Line */}
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target Benchmark"
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#10b981', fill: '#ffffff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Benchmark Highlights Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <div>
                <span className="text-[11px] block">Benchmark Success</span>
                <strong className="text-foreground font-semibold">24 of 30 Days (80%)</strong>
              </div>
              <div>
                <span className="text-[11px] block">Average Collection</span>
                <strong className="text-foreground font-semibold">₹61,400 / day</strong>
              </div>
              <div>
                <span className="text-[11px] block">Highest Surge Day</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">₹76,400 (Oct 17)</strong>
              </div>
              <div>
                <span className="text-[11px] block">Fastest Target Hit</span>
                <strong className="text-foreground font-semibold">Connaught Place (14:30)</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Facility Targets Breakdown */}
        {activeTab === 'facilities' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Key Delhi Municipal Facilities — Today's Target Fulfillment
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setTargetScope('facility');
                  setDialogTab('edit');
                  setSettingsOpen(true);
                }}
              >
                <SlidersHorizontal className="w-3 h-3 mr-1" />
                Adjust Facility Quotas
              </Button>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 bg-card">
              {facilityTargets.map((fac) => (
                <div key={fac.id} className="p-3.5 sm:p-4 hover:bg-muted/20 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{fac.facilityName}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 font-normal">
                          {fac.zone}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {fac.spots} bays • {fac.attendantsOnDuty} attendants
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getStatusBadge(fac.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleOpenEditForScope('facility', fac.id, fac.dailyTarget)}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Quota
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Daily Target:</span>
                      <strong className="text-foreground">₹{fac.dailyTarget.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Collected Today:</span>
                      <strong className="text-foreground">₹{fac.dailyActual.toLocaleString('en-IN')}</strong>
                      <span className="text-[11px] text-muted-foreground">
                        ({fac.achievementRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div>
                      <Progress 
                        value={Math.min(fac.achievementRate, 100)} 
                        className="h-2 bg-muted"
                        indicatorClassName={getProgressColor(fac.achievementRate)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
