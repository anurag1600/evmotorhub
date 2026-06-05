'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'viewer';
  is_active: boolean;
}

interface AdminContextType {
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Fetch admin user data
        const { data } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data) {
          setAdminUser(data as AdminUser);
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Use async IIFE to avoid deadlock
      (async () => {
        if (session?.user) {
          const { data } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (data) {
            setAdminUser(data as AdminUser);
          } else {
            setAdminUser(null);
          }
        } else {
          setAdminUser(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminUser(null);
  };

  return (
    <AdminContext.Provider value={{
      session,
      adminUser,
      loading,
      isAdmin: !!adminUser && adminUser.is_active,
      logout,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
