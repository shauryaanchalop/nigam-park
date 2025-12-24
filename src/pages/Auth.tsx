import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn, UserPlus, User, Play, KeyRound, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
type AuthView = 'main' | 'forgot-password' | 'reset-sent' | 'verify-otp';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('main');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

  // OTP verification state
  const [otpValue, setOtpValue] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setAuthView('reset-sent');
        toast.success('Password reset email sent!');
      }
    } catch (err) {
      toast.error('Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!signupEmail) {
      toast.error('Please enter your email first');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: signupEmail,
        options: {
          shouldCreateUser: true,
          data: { full_name: signupName },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        setOtpType('email');
        setAuthView('verify-otp');
        toast.success('Verification code sent to your email!');
      }
    } catch (err) {
      toast.error('Failed to send verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!signupPhone) {
      toast.error('Please enter your phone number first');
      return;
    }

    // Format phone number for India
    const formattedPhone = signupPhone.startsWith('+') ? signupPhone : `+91${signupPhone}`;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
          data: { full_name: signupName },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        setOtpType('phone');
        setAuthView('verify-otp');
        toast.success('Verification code sent to your phone!');
      }
    } catch (err) {
      toast.error('Failed to send verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const verifyParams = otpType === 'email' 
        ? { email: signupEmail, token: otpValue, type: 'email' as const }
        : { phone: signupPhone.startsWith('+') ? signupPhone : `+91${signupPhone}`, token: otpValue, type: 'sms' as const };

      const { error } = await supabase.auth.verifyOtp(verifyParams);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account verified successfully!');
        setAuthView('main');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
    { role: 'attendant' as DemoRole, label: 'Attendant Demo', icon: Shield, description: 'POS terminal access' },
    { role: 'citizen' as DemoRole, label: 'Citizen Demo', icon: User, description: 'Public portal access' },
  ];

  // Forgot Password View
  if (authView === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="gradient-primary py-4">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <img src={logo} alt="NIGAM-Park Logo" className="w-10 h-10 rounded-full object-cover" />
            <div className="text-center">
              <h1 className="text-primary-foreground font-bold text-xl">NIGAM-Park</h1>
              <p className="text-primary-foreground/80 text-xs">Municipal Corporation of Delhi</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 mb-2"
                onClick={() => setAuthView('main')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Email Sent View
  if (authView === 'reset-sent') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="gradient-primary py-4">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <img src={logo} alt="NIGAM-Park Logo" className="w-10 h-10 rounded-full object-cover" />
            <div className="text-center">
              <h1 className="text-primary-foreground font-bold text-xl">NIGAM-Park</h1>
              <p className="text-primary-foreground/80 text-xs">Municipal Corporation of Delhi</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to <strong>{resetEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setAuthView('main')}>
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // OTP Verification View
  if (authView === 'verify-otp') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="gradient-primary py-4">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <img src={logo} alt="NIGAM-Park Logo" className="w-10 h-10 rounded-full object-cover" />
            <div className="text-center">
              <h1 className="text-primary-foreground font-bold text-xl">NIGAM-Park</h1>
              <p className="text-primary-foreground/80 text-xs">Municipal Corporation of Delhi</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 mb-2"
                onClick={() => setAuthView('main')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                {otpType === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                Verify Your {otpType === 'email' ? 'Email' : 'Phone'}
              </CardTitle>
              <CardDescription>
                Enter the 6-digit code we sent to {otpType === 'email' ? signupEmail : signupPhone}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button 
                className="w-full" 
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpValue.length !== 6}
              >
                {verifyingOtp ? 'Verifying...' : 'Verify Code'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <Button 
                  variant="link" 
                  className="px-0 h-auto"
                  onClick={otpType === 'email' ? handleSendEmailOtp : handleSendPhoneOtp}
                  disabled={isSubmitting}
                >
                  Resend
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Auth View
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {demoButtons.map(({ role, label, icon: Icon, description }) => (
                  <Button
                    key={role}
                    variant="outline"
                    className="h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-accent/10 hover:border-accent transition-all"
                    onClick={() => handleDemoLogin(role)}
                    disabled={demoLoading !== null}
                  >
                    {demoLoading === role ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-primary" />
                    )}
                    <span className="font-semibold text-sm whitespace-nowrap">{label}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">{description}</span>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 h-auto text-xs"
                          onClick={() => {
                            setResetEmail(loginEmail);
                            setAuthView('forgot-password');
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
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
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      Continue with Google
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
                      <div className="flex gap-2">
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleSendEmailOtp}
                          disabled={isSubmitting || !signupEmail}
                          className="shrink-0"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="9876543210"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleSendPhoneOtp}
                          disabled={isSubmitting || !signupPhone}
                          className="shrink-0"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      </div>
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
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      Continue with Google
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
