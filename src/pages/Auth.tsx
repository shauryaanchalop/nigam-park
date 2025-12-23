import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn, UserPlus, Users, UserCheck, User, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
});

type DemoRole = 'admin' | 'attendant' | 'citizen';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full chakra-spinner mx-auto" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({ 
        email: signupEmail, 
        password: signupPassword,
        fullName: signupName,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully! You are now logged in as a Citizen.');
    }
  };

  const handleDemoLogin = async (role: DemoRole) => {
    setDemoLoading(role);
    
    try {
      // Call edge function to ensure demo user exists
      const { data, error } = await supabase.functions.invoke('demo-login', {
        body: { role },
      });

      if (error) {
        console.error('Demo login error:', error);
        toast.error('Failed to setup demo account. Please try again.');
        setDemoLoading(null);
        return;
      }

      if (data?.email && data?.password) {
        // Sign in with the demo credentials
        const { error: signInError } = await signIn(data.email, data.password);
        
        if (signInError) {
          toast.error('Failed to sign in with demo account');
        } else {
          const roleLabels = {
            admin: 'MCD Commissioner',
            attendant: 'Parking Attendant',
            citizen: 'Citizen',
          };
          toast.success(`Welcome! Logged in as ${roleLabels[role]}`);
        }
      }
    } catch (err) {
      console.error('Demo login error:', err);
      toast.error('Demo login failed. Please try again.');
    } finally {
      setDemoLoading(null);
    }
  };

  const demoButtons = [
    { role: 'admin' as DemoRole, label: 'Admin Demo', icon: Shield, description: 'Full dashboard access' },
    { role: 'attendant' as DemoRole, label: 'Attendant Demo', icon: UserCheck, description: 'POS terminal access' },
    { role: 'citizen' as DemoRole, label: 'Citizen Demo', icon: User, description: 'Public portal access' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header Banner */}
      <div className="gradient-primary py-4">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <img src={logo} alt="NIGAM-Park Logo" className="w-10 h-10 rounded-full object-cover" />
          <div className="text-center">
            <h1 className="text-primary-foreground font-bold text-xl">NIGAM-Park</h1>
            <p className="text-primary-foreground/80 text-xs">Municipal Corporation of Delhi</p>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Demo Mode Card */}
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg">Demo Mode</CardTitle>
              </div>
              <CardDescription>
                Try the system instantly with pre-configured accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoButtons.map(({ role, label, icon: Icon, description }) => (
                  <Button
                    key={role}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-accent/10 hover:border-accent"
                    onClick={() => handleDemoLogin(role)}
                    disabled={demoLoading !== null}
                  >
                    {demoLoading === role ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    <span className="font-medium text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Main Auth Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome to NIGAM-Park</CardTitle>
              <CardDescription>
                Revenue Assurance & Smart Parking System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      New users are registered as Citizens. Contact an administrator to request elevated access.
                    </p>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-muted-foreground">
        <p>© 2026 Municipal Corporation of Delhi. All rights reserved.</p>
      </div>
    </div>
  );
}
