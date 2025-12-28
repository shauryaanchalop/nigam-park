import React from 'react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users,
  Medal,
  Star,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GovHeader } from '@/components/ui/GovHeader';
import { useAttendantPerformance, useAdminAttendantPerformance } from '@/hooks/useAttendantPerformance';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function AttendantPerformance() {
  const { user } = useAuth();
  
  
  const { myPerformance, dailyTarget, isLoading } = useAttendantPerformance();
  const { leaderboard, performanceHistory, isLoading: isLoadingAdmin } = useAdminAttendantPerformance();

  const todayProgress = myPerformance?.today.collections 
    ? Math.min((myPerformance.today.collections / dailyTarget) * 100, 100)
    : 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Performance Dashboard" 
        subtitle="Attendant Metrics & Leaderboard"
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Today's Progress */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Target Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-foreground">
                    ₹{myPerformance?.today.collections.toLocaleString('en-IN') || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of ₹{dailyTarget.toLocaleString('en-IN')} target
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{todayProgress.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {myPerformance?.today.transactions || 0} transactions
                  </p>
                </div>
              </div>
              <Progress value={todayProgress} className="h-3" />
              {todayProgress >= 100 && (
                <Badge className="bg-success text-success-foreground">
                  <Trophy className="w-3 h-3 mr-1" />
                  Target Achieved!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    ₹{myPerformance?.today.collections.toLocaleString('en-IN') || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {myPerformance?.today.transactions || 0} txns
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">
                    ₹{myPerformance?.week.collections.toLocaleString('en-IN') || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {myPerformance?.week.transactions || 0} txns
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    ₹{myPerformance?.month.collections.toLocaleString('en-IN') || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {myPerformance?.month.transactions || 0} txns
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Daily Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Collections']}
                    labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                  />
                  <Bar 
                    dataKey="collections" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Weekly Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No performance data available yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Attendant</TableHead>
                    <TableHead className="text-right">Collections</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow 
                      key={entry.user_id}
                      className={entry.rank <= 3 ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium">
                        {getRankBadge(entry.rank)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {entry.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <span>{entry.full_name || 'Attendant'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{entry.total_collections.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.transaction_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {entry.efficiency_score} txn/hr
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
