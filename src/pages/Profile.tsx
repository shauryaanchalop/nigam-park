import React, { useState, useRef, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, Car, Bell, Phone, Mail, Edit2, Plus, Trash2, Star, ArrowLeft, Camera, Loader2, X, Settings, Send, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useSavedVehicles, useUserPreferences } from '@/hooks/useProfile';
import { GovHeader } from '@/components/ui/GovHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/ui/ImageCropper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const vehicleSchema = z.object({
  vehicle_number: z.string()
    .min(6, 'Vehicle number too short')
    .max(15, 'Vehicle number too long')
    .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/, 'Invalid vehicle number format (e.g., DL01AB1234)'),
  vehicle_name: z.string().max(50).optional(),
  vehicle_type: z.enum(['car', 'bike', 'suv', 'truck']),
});

export default function Profile() {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is citizen (show vehicles tab only for citizens)
  const isCitizen = userRole === 'citizen' || !userRole;
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { vehicles, isLoading: vehiclesLoading, addVehicle, updateVehicle, deleteVehicle } = useSavedVehicles();
  const { preferences, isLoading: preferencesLoading, updatePreferences } = useUserPreferences();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: '',
    vehicle_name: '',
    vehicle_type: 'car',
    is_primary: false,
  });
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>({});

  // Admin settings state
  const [adminPhone, setAdminPhone] = useState('');
  const [testSmsNumber, setTestSmsNumber] = useState('');
  const [sendingTestSms, setSendingTestSms] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for cropping)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create URL for cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;

    setUploadingAvatar(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar', { description: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !profile?.avatar_url) return;

    setUploadingAvatar(true);
    try {
      // Delete from storage
      const fileName = `${user.id}/avatar.jpg`;
      await supabase.storage.from('avatars').remove([fileName]);

      // Update profile
      await updateProfile.mutateAsync({ avatar_url: null });
      toast.success('Avatar removed');
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync(profileForm);
    setEditingProfile(false);
  };

  const handleAddVehicle = async () => {
    setVehicleErrors({});
    
    const result = vehicleSchema.safeParse({
      ...vehicleForm,
      vehicle_number: vehicleForm.vehicle_number.toUpperCase().replace(/\s/g, ''),
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setVehicleErrors(errors);
      return;
    }

    await addVehicle.mutateAsync({
      vehicle_number: result.data.vehicle_number,
      vehicle_name: result.data.vehicle_name || undefined,
      vehicle_type: result.data.vehicle_type,
      is_primary: vehicleForm.is_primary,
    });
    
    setVehicleDialogOpen(false);
    setVehicleForm({ vehicle_number: '', vehicle_name: '', vehicle_type: 'car', is_primary: false });
  };

  const handleSetPrimary = async (id: string) => {
    await updateVehicle.mutateAsync({ id, is_primary: true });
  };

  const handleDeleteVehicle = async (id: string) => {
    await deleteVehicle.mutateAsync(id);
  };

  const handlePreferenceChange = async (key: string, value: boolean | number) => {
    await updatePreferences.mutateAsync({ [key]: value });
  };

  const handleSendTestSms = async () => {
    if (!testSmsNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setSendingTestSms(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testSmsNumber,
          message: '✅ NIGAM-Park Test SMS\n\nThis is a test message to verify your Twilio integration is working correctly.\n\nTimestamp: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          type: 'general',
        },
      });

      if (error) throw error;
      toast.success('Test SMS sent successfully!');
    } catch (error: any) {
      console.error('Test SMS error:', error);
      toast.error('Failed to send test SMS', { description: error.message });
    } finally {
      setSendingTestSms(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    
    // Validate
    const errors: Record<string, string> = {};
    if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordForm.newPassword.length > 100) {
      errors.newPassword = 'Password must be less than 100 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error('Failed to update password', { description: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <GovHeader title="My Profile" subtitle="Manage your account settings" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className={`grid w-full ${isCitizen ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            {isCitizen && (
              <TabsTrigger value="vehicles" className="gap-2">
                <Car className="w-4 h-4" />
                <span className="hidden sm:inline">Vehicles</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>Your personal details and contact information</CardDescription>
                  </div>
                  {!editingProfile && (
                    <Button variant="outline" size="sm" onClick={handleEditProfile}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 w-20 bg-muted rounded-full mx-auto" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                ) : (
                  <>
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 pb-4 border-b">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                              <Camera className="w-4 h-4 mr-2" />
                              Upload new photo
                            </DropdownMenuItem>
                            {profile?.avatar_url && (
                              <DropdownMenuItem 
                                onClick={handleRemoveAvatar}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove photo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground">Click the camera icon to upload or remove photo</p>
                    </div>

                    {/* Image Cropper */}
                    <ImageCropper
                      open={cropperOpen}
                      onOpenChange={setCropperOpen}
                      imageSrc={selectedImageSrc}
                      onCropComplete={handleCropComplete}
                      aspectRatio={1}
                    />

                    {editingProfile ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input value={user.email || ''} disabled className="bg-muted" />
                          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingProfile(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone Number</p>
                            <p className="font-medium">{profile?.phone || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email Address</p>
                            <p className="font-medium">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Password Change Section */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5" />
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              placeholder="Enter new password"
                              className={passwordErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          {passwordErrors.newPassword && (
                            <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              placeholder="Confirm new password"
                              className={passwordErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          {passwordErrors.confirmPassword && (
                            <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>
                        <Button 
                          onClick={handleChangePassword} 
                          disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab - Only for Citizens */}
          {isCitizen && (
            <TabsContent value="vehicles">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        Saved Vehicles
                      </CardTitle>
                      <CardDescription>Manage your registered vehicles for quick booking</CardDescription>
                    </div>
                    <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Vehicle
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Vehicle</DialogTitle>
                          <DialogDescription>
                            Enter your vehicle details to save it for quick booking
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                            <Input
                              id="vehicle_number"
                              value={vehicleForm.vehicle_number}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value.toUpperCase() })}
                              placeholder="DL01AB1234"
                              className={vehicleErrors.vehicle_number ? 'border-destructive' : ''}
                            />
                            {vehicleErrors.vehicle_number && (
                              <p className="text-xs text-destructive">{vehicleErrors.vehicle_number}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicle_name">Vehicle Name (Optional)</Label>
                            <Input
                              id="vehicle_name"
                              value={vehicleForm.vehicle_name}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_name: e.target.value })}
                              placeholder="My Swift, Office Car, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicle_type">Vehicle Type</Label>
                            <Select
                              value={vehicleForm.vehicle_type}
                              onValueChange={(value) => setVehicleForm({ ...vehicleForm, vehicle_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="car">🚗 Car</SelectItem>
                                <SelectItem value="bike">🏍️ Bike</SelectItem>
                                <SelectItem value="suv">🚙 SUV</SelectItem>
                                <SelectItem value="truck">🚛 Truck</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="is_primary"
                              checked={vehicleForm.is_primary}
                              onCheckedChange={(checked) => setVehicleForm({ ...vehicleForm, is_primary: checked })}
                            />
                            <Label htmlFor="is_primary">Set as primary vehicle</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddVehicle} disabled={addVehicle.isPending}>
                            {addVehicle.isPending ? 'Adding...' : 'Add Vehicle'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {vehiclesLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded-lg" />
                      ))}
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No vehicles saved yet</p>
                      <p className="text-sm">Add your vehicles for quick parking reservations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">
                              {vehicle.vehicle_type === 'bike' ? '🏍️' : vehicle.vehicle_type === 'suv' ? '🚙' : vehicle.vehicle_type === 'truck' ? '🚛' : '🚗'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-mono font-semibold">{vehicle.vehicle_number}</p>
                                {vehicle.is_primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              {vehicle.vehicle_name && (
                                <p className="text-sm text-muted-foreground">{vehicle.vehicle_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!vehicle.is_primary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetPrimary(vehicle.id)}
                                disabled={updateVehicle.isPending}
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {vehicle.vehicle_number} from your saved vehicles?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteVehicle(vehicle.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to receive updates and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive booking confirmations and updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences?.email_notifications ?? true}
                        onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                        disabled={updatePreferences.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Get real-time alerts on your browser</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences?.push_notifications ?? true}
                        onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                        disabled={updatePreferences.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive important alerts via SMS (requires phone number)</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences?.sms_notifications ?? false}
                        onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
                        disabled={updatePreferences.isPending || !profile?.phone}
                      />
                    </div>

                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Parking Expiry Reminder</p>
                          <p className="text-sm text-muted-foreground">Get notified before your parking time expires</p>
                        </div>
                      </div>
                      <Select
                        value={String(preferences?.reminder_before_expiry ?? 30)}
                        onValueChange={(value) => handlePreferenceChange('reminder_before_expiry', parseInt(value))}
                        disabled={updatePreferences.isPending}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes before</SelectItem>
                          <SelectItem value="30">30 minutes before</SelectItem>
                          <SelectItem value="60">1 hour before</SelectItem>
                          <SelectItem value="0">Don't remind me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
            <div className="space-y-6">
              {/* Admin Phone Setting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Admin Alert Settings
                  </CardTitle>
                  <CardDescription>Configure phone number for receiving fraud and system alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Admin Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="admin-phone"
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1"
                      />
                      <Button variant="outline" disabled>
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This phone number will receive critical fraud alerts and system notifications.
                      Contact support to update the admin phone number.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SMS Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Test SMS Integration
                  </CardTitle>
                  <CardDescription>Verify that Twilio SMS is configured correctly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-sms">Send Test SMS To</Label>
                    <div className="flex gap-2">
                      <Input
                        id="test-sms"
                        type="tel"
                        value={testSmsNumber}
                        onChange={(e) => setTestSmsNumber(e.target.value)}
                        placeholder="Enter phone number (e.g., 9876543210)"
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendTestSms}
                        disabled={sendingTestSms || !testSmsNumber}
                      >
                        {sendingTestSms ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Test
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A test message will be sent to verify your Twilio configuration is working.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
