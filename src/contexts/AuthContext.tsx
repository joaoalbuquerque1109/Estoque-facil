"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserRole } from '@/lib/firestore';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  userRole: string | null;
  loading: boolean;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    userRole: null, 
    loading: true, 
    reauthenticate: () => Promise.reject("AuthProvider not yet mounted.") 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserRole(session.user.id).then(role => setUserRole(role));
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const reauthenticate = async (password: string) => {
    if (!user || !user.email) {
      throw new Error("Nenhum utilizador está logado.");
    }
    
    // Reauthenticate by signing in again
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });
    
    if (error) {
      throw new Error("Falha na reautenticação.");
    }
  };

  const value = { user, userRole, loading, reauthenticate };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}