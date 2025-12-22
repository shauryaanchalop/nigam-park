import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, IndianRupee } from 'lucide-react';
import { useTodayStats } from '@/hooks/useTransactions';

// Sample data for demo
const hourlyData = [
  { hour: '6 AM', revenue: 2400, occupancy: 45 },
  { hour: '8 AM', revenue: 4500, occupancy: 78 },
  { hour: '10 AM', revenue: 6200, occupancy: 92 },
  { hour: '12 PM', revenue: 8100, occupancy: 95 },
  { hour: '2 PM', revenue: 7800, occupancy: 88 },
  { hour: '4 PM', revenue: 9200, occupancy: 96 },
  { hour: '6 PM', revenue: 11500, occupancy: 98 },
  { hour: '8 PM', revenue: 8900, occupancy: 82 },
];

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)'];

export function RevenueChart() {
  const { data: stats } = useTodayStats();

  const paymentData = [
    { name: 'FASTag', value: stats?.fastagCount ?? 0 },
    { name: 'Cash', value: stats?.cashCount ?? 0 },
    { name: 'UPI', value: stats?.upiCount ?? 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue Trend */}
      <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Revenue vs Occupancy Trend</h3>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(221, 83%, 53%)" 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
                name="Revenue (₹)"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="occupancy" 
                stroke="hsl(25, 95%, 53%)" 
                fill="url(#colorOccupancy)" 
                strokeWidth={2}
                name="Occupancy (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Distribution */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Payment Methods</h3>
        </div>
        <div className="h-[250px]">
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
