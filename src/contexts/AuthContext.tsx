import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { z } from 'zod';

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
});

export const DEMO_ACCOUNTS: Record<AppRole, { email: string; name: string; role: AppRole }> = {
  admin: {
    email: 'demo.admin@nigampark.gov.in',
    name: 'MCD Commissioner',
    role: 'admin',
  },
  attendant: {
    email: 'demo.attendant@nigampark.gov.in',
    name: 'Parking Attendant (South Zone)',
    role: 'attendant',
  },
  citizen: {
    email: 'demo.citizen@nigampark.gov.in',
    name: 'Rajesh Sharma',
    role: 'citizen',
  },
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  isSwitchingRole: boolean;
  targetRole: AppRole | null;
  setIsSwitchingRole: (value: boolean, targetRole?: AppRole | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginAsDemo: (role: AppRole) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createDemoUserAndSession = (role: AppRole, email?: string, name?: string) => {
  const config = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.citizen;
  const userEmail = email || config.email;
  const userName = name || config.name;
  const mockUser: User = {
    id: `demo-${role}-user`,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: userName },
    aud: 'authenticated',
    confirmation_sent_at: '',
    recovery_sent_at: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    email: userEmail,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    is_anonymous: false,
  };
  const mockSession: Session = {
    access_token: `demo-token-${role}`,
    refresh_token: `demo-refresh-${role}`,
    expires_in: 86400 * 7,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
    token_type: 'bearer',
    user: mockUser,
  };
  return { mockUser, mockSession };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isSwitchingRole, setIsSwitchingRoleState] = useState(false);
  const [targetRole, setTargetRole] = useState<AppRole | null>(null);

  const setIsSwitchingRole = (value: boolean, newTargetRole?: AppRole | null) => {
    setIsSwitchingRoleState(value);
    setTargetRole(value ? (newTargetRole ?? null) : null);
  };

  const loginAsDemo = async (role: AppRole) => {
    const { mockUser, mockSession } = createDemoUserAndSession(role);
    try {
      localStorage.setItem('nigam_demo_session', JSON.stringify({ user: mockUser, session: mockSession, role }));
    } catch {
      // LocalStorage may be unavailable
    }
    setUser(mockUser);
    setSession(mockSession);
    setUserRole(role);
  };

  useEffect(() => {
    // 1. Check for stored demo session first
    let hasDemoSession = false;
    try {
      const raw = localStorage.getItem('nigam_demo_session');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.user && saved?.role) {
          setUser(saved.user);
          setSession(saved.session || null);
          setUserRole(saved.role);
          setLoading(false);
          hasDemoSession = true;
        }
      }
    } catch {
      localStorage.removeItem('nigam_demo_session');
    }

    // 2. Set up auth state listener
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const res = supabase.auth.onAuthStateChange((event, session) => {
        if (!hasDemoSession) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(() => {
              fetchUserRole(session.user.id, session.user.email);
            }, 0);
          } else {
            setUserRole(null);
          }
        }
      });
      subscription = res.data?.subscription || null;
    } catch {
      // Ignore if supabase cannot initialize
    }

    // 3. Check for existing Supabase session if not in demo mode
    if (!hasDemoSession) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchUserRole(session.user.id, session.user.email);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string, userEmail?: string | null) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data?.role) {
        setUserRole(data.role as AppRole);
        return;
      }
    } catch {
      // Table may not exist yet or request failed
    }

    // Fallback for demo users
    if (userEmail) {
      if (userEmail.includes('admin')) {
        setUserRole('admin');
      } else if (userEmail.includes('attendant')) {
        setUserRole('attendant');
      } else {
        setUserRole('citizen');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const lowerEmail = email.toLowerCase().trim();
    const isDemoAccount = lowerEmail.includes('demo') || Object.values(DEMO_ACCOUNTS).some(d => d.email.toLowerCase() === lowerEmail);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        localStorage.removeItem('nigam_demo_session');
        return { error: null };
      }

      // If Supabase failed and it's a demo account or network fetch failed, use demo fallback
      const errMsg = error?.message || '';
      const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('fetch failed');

      if (isDemoAccount || isNetworkError) {
        const detectedRole: AppRole = lowerEmail.includes('admin')
          ? 'admin'
          : lowerEmail.includes('attendant')
          ? 'attendant'
          : 'citizen';
        await loginAsDemo(detectedRole);
        return { error: null };
      }

      return { error: (error as Error) || new Error('Invalid email or password') };
    } catch (err: any) {
      if (isDemoAccount || err?.message?.includes('Failed to fetch')) {
        const detectedRole: AppRole = lowerEmail.includes('admin')
          ? 'admin'
          : lowerEmail.includes('attendant')
          ? 'attendant'
          : 'citizen';
        await loginAsDemo(detectedRole);
        return { error: null };
      }
      return { error: (err as Error) || new Error('Failed to sign in') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Validate input
    try {
      signUpSchema.parse({ email, password, fullName });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { error: new Error(validationError.errors[0].message) };
      }
      return { error: validationError as Error };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        // Fallback for offline demo experience
        if (error.message.includes('Failed to fetch')) {
          const { mockUser, mockSession } = createDemoUserAndSession('citizen', email, fullName);
          localStorage.setItem('nigam_demo_session', JSON.stringify({ user: mockUser, session: mockSession, role: 'citizen' }));
          setUser(mockUser);
          setSession(mockSession);
          setUserRole('citizen');
          return { error: null };
        }
        return { error: error as Error };
      }

      return { error: null };
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        const { mockUser, mockSession } = createDemoUserAndSession('citizen', email, fullName);
        localStorage.setItem('nigam_demo_session', JSON.stringify({ user: mockUser, session: mockSession, role: 'citizen' }));
        setUser(mockUser);
        setSession(mockSession);
        setUserRole('citizen');
        return { error: null };
      }
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('nigam_demo_session');
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      isSwitchingRole,
      targetRole,
      setIsSwitchingRole,
      signIn,
      loginAsDemo,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
