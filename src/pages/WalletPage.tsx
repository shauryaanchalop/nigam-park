import React, { useMemo, useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ShieldCheck,
  ChevronLeft,
  Gift,
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, isLoading, ledger, ledgerLoading, applyTransaction, updateSettings } = useWallet();
  const [amount, setAmount] = useState('500');

  const monthSpend = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return ledger
      .filter((e) => e.transaction_type === 'debit' && new Date(e.created_at) >= start)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [ledger]);

  const monthTopups = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return ledger
      .filter((e) => e.transaction_type !== 'debit' && new Date(e.created_at) >= start)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [ledger]);

  const handleTopUp = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await applyTransaction.mutateAsync({
        amount: value,
        type: 'topup',
        description: 'Wallet top-up (UPI)',
      });
      toast.success(`₹${value} added to your parking wallet`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Top-up failed');
    }
  };

  const downloadStatement = () => {
    if (ledger.length === 0) {
      toast.error('No wallet activity to export yet');
      return;
    }
    const rows = [
      ['Date', 'Type', 'Description', 'Amount (INR)', 'Balance After (INR)'],
      ...ledger.map((e) => [
        format(parseISO(e.created_at), 'yyyy-MM-dd HH:mm'),
        e.transaction_type,
        (e.description ?? '').replace(/,/g, ' '),
        (e.transaction_type === 'debit' ? '-' : '+') + Number(e.amount).toFixed(2),
        Number(e.balance_after).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nigam-park-wallet-statement-${format(new Date(), 'yyyy-MM')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Statement downloaded');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader title="Parking Wallet" subtitle="Prepaid balance & auto-debit" />
        <main className="container mx-auto px-4 py-16 text-center">
          <WalletIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to use your parking wallet</h1>
          <p className="text-muted-foreground mb-6">
            Keep a prepaid balance, pay in one tap and download monthly statements.
          </p>
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </main>
      </div>
    );
  }

  const balance = Number(wallet?.balance ?? 0);
  const lowBalance = balance < Number(wallet?.low_balance_threshold ?? 100);

  return (
    <div className="min-h-screen bg-background">
      <GovHeader title="Parking Wallet" subtitle="Prepaid balance, auto-debit & statements" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/citizen">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to portal
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Balance card */}
          <Card className="lg:col-span-2 overflow-hidden border-primary/20">
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90 flex items-center gap-2">
                    <WalletIcon className="w-4 h-4" /> Available balance
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-40 mt-2" />
                  ) : (
                    <p className="text-4xl font-bold mt-2">₹{balance.toFixed(2)}</p>
                  )}
                </div>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="w-3 h-3" /> MCD Secured
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div className="rounded-lg bg-background/15 p-3">
                  <p className="opacity-90">Spent this month</p>
                  <p className="text-lg font-semibold">₹{monthSpend.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-background/15 p-3">
                  <p className="opacity-90">Loaded this month</p>
                  <p className="text-lg font-semibold">₹{monthTopups.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {lowBalance && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  Low balance — top up to keep auto-debit working at exit gates.
                </div>
              )}
              <div>
                <Label htmlFor="topup-amount">Add money</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="topup-amount"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter amount"
                  />
                  <Button onClick={handleTopUp} disabled={applyTransaction.isPending}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_AMOUNTS.map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(String(value))}
                    >
                      ₹{value}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wallet settings</CardTitle>
              <CardDescription>Control how your balance is used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Auto-debit on exit</p>
                  <p className="text-xs text-muted-foreground">
                    Parking fees are deducted automatically when you check out.
                  </p>
                </div>
                <Switch
                  checked={!!wallet?.auto_debit}
                  onCheckedChange={(checked) => updateSettings.mutate({ auto_debit: checked })}
                />
              </div>
              <Separator />
              <div>
                <Label htmlFor="threshold" className="text-sm">
                  Low balance alert (₹)
                </Label>
                <Input
                  id="threshold"
                  className="mt-2"
                  inputMode="numeric"
                  defaultValue={String(wallet?.low_balance_threshold ?? 100)}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isFinite(value) && value >= 0) {
                      updateSettings.mutate({ low_balance_threshold: value });
                    }
                  }}
                />
              </div>
              <Separator />
              <Button variant="outline" className="w-full" onClick={downloadStatement}>
                <Download className="w-4 h-4 mr-2" /> Download statement
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/loyalty">
                  <Gift className="w-4 h-4 mr-2" /> Convert loyalty points
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wallet activity</CardTitle>
            <CardDescription>Every top-up and parking payment, newest first</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {ledgerLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : ledger.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No wallet activity yet. Add money to get started.
              </p>
            ) : (
              <ul className="divide-y">
                {ledger.map((entry) => {
                  const isDebit = entry.transaction_type === 'debit';
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-6 py-4">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          isDebit ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                        )}
                      >
                        {isDebit ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {entry.description ?? (isDebit ? 'Parking payment' : 'Wallet top-up')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(entry.created_at), 'dd MMM yyyy, HH:mm')} ·{' '}
                          {entry.transaction_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'font-semibold text-sm',
                            isDebit ? 'text-destructive' : 'text-success'
                          )}
                        >
                          {isDebit ? '-' : '+'}₹{Number(entry.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bal ₹{Number(entry.balance_after).toFixed(2)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
