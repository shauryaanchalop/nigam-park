import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GovHeader } from '@/components/ui/GovHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Pencil, Trash2, Zap, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParkingLots } from '@/hooks/useParkingLots';
import { cn } from '@/lib/utils';

interface SurgePricingRule {
  id: string;
  lot_id: string | null;
  min_occupancy_percent: number;
  max_occupancy_percent: number;
  multiplier: number;
  is_active: boolean;
  created_at: string;
}

interface RuleFormData {
  lot_id: string | null;
  min_occupancy_percent: number;
  max_occupancy_percent: number;
  multiplier: number;
  is_active: boolean;
}

export default function AdminSurgePricing() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SurgePricingRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    lot_id: null,
    min_occupancy_percent: 70,
    max_occupancy_percent: 100,
    multiplier: 1.5,
    is_active: true,
  });

  const { data: parkingLots } = useParkingLots();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['surge-pricing-rules-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surge_pricing_rules')
        .select('*')
        .order('min_occupancy_percent', { ascending: true });
      if (error) throw error;
      return data as SurgePricingRule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const { error } = await supabase
        .from('surge_pricing_rules')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules'] });
      toast.success('Surge pricing rule created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create rule: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RuleFormData> }) => {
      const { error } = await supabase
        .from('surge_pricing_rules')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules'] });
      toast.success('Surge pricing rule updated');
      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update rule: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('surge_pricing_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-rules'] });
      toast.success('Surge pricing rule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete rule: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      lot_id: null,
      min_occupancy_percent: 70,
      max_occupancy_percent: 100,
      multiplier: 1.5,
      is_active: true,
    });
  };

  const handleEdit = (rule: SurgePricingRule) => {
    setEditingRule(rule);
    setFormData({
      lot_id: rule.lot_id,
      min_occupancy_percent: rule.min_occupancy_percent,
      max_occupancy_percent: rule.max_occupancy_percent,
      multiplier: Number(rule.multiplier),
      is_active: rule.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (formData.min_occupancy_percent >= formData.max_occupancy_percent) {
      toast.error('Min occupancy must be less than max occupancy');
      return;
    }
    if (formData.multiplier < 1) {
      toast.error('Multiplier must be at least 1.0');
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getLotName = (lotId: string | null) => {
    if (!lotId) return 'All Lots (Global)';
    const lot = parkingLots?.find(l => l.id === lotId);
    return lot?.name || 'Unknown Lot';
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 2) return 'bg-destructive text-destructive-foreground';
    if (multiplier >= 1.5) return 'bg-warning text-warning-foreground';
    if (multiplier > 1) return 'bg-primary/20 text-primary';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader 
        title="Surge Pricing Management" 
        subtitle="Configure dynamic pricing rules"
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Info Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">How Surge Pricing Works</p>
                <p className="text-muted-foreground">
                  When a parking lot reaches the specified occupancy percentage, the base hourly rate is multiplied by the surge multiplier. 
                  Global rules apply to all lots unless a lot-specific rule exists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">{rules?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Rules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">{rules?.filter(r => r.is_active).length || 0}</p>
              <p className="text-sm text-muted-foreground">Active Rules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold">{rules?.filter(r => Number(r.multiplier) >= 2).length || 0}</p>
              <p className="text-sm text-muted-foreground">High Surge (2x+)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">G</span>
              </div>
              <p className="text-2xl font-bold">{rules?.filter(r => !r.lot_id).length || 0}</p>
              <p className="text-sm text-muted-foreground">Global Rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pricing Rules</CardTitle>
              <CardDescription>Manage surge pricing multipliers based on occupancy</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingRule(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Surge Pricing Rule'}</DialogTitle>
                  <DialogDescription>
                    Configure when and how much to increase parking prices based on occupancy.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Apply To</Label>
                    <Select
                      value={formData.lot_id || 'global'}
                      onValueChange={(value) => setFormData({ ...formData, lot_id: value === 'global' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parking lot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">All Lots (Global Rule)</SelectItem>
                        {parkingLots?.map(lot => (
                          <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Occupancy (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.min_occupancy_percent}
                        onChange={(e) => setFormData({ ...formData, min_occupancy_percent: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Occupancy (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.max_occupancy_percent}
                        onChange={(e) => setFormData({ ...formData, max_occupancy_percent: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Price Multiplier</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      E.g., 1.5 = 50% price increase, 2.0 = double the price
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingRule ? 'Update' : 'Create'} Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
            ) : rules?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No surge pricing rules configured</p>
                <p className="text-sm">Create your first rule to enable dynamic pricing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parking Lot</TableHead>
                      <TableHead>Occupancy Range</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules?.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!rule.lot_id && (
                              <Badge variant="outline" className="text-xs">Global</Badge>
                            )}
                            <span className="font-medium">{getLotName(rule.lot_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {rule.min_occupancy_percent}% – {rule.max_occupancy_percent}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-mono', getMultiplierColor(Number(rule.multiplier)))}>
                            {Number(rule.multiplier).toFixed(1)}x
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this surge pricing rule. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(rule.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
