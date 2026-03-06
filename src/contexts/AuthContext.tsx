"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mock admin user para desenvolvimento sem autenticação
const mockAdminUser: SupabaseUser = {
  id: 'mock-admin-id',
  aud: 'authenticated',
  email: 'admin@estoque.local',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'mock' },
  user_metadata: { name: 'Admin' },
  identities: [],
  is_anonymous: false,
} as SupabaseUser;

interface AuthContextType {
  user: SupabaseUser | null;
  userRole: string | null;
  loading: boolean;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    userRole: null, 
    loading: false, 
    reauthenticate: () => Promise.resolve() 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Retorna mock admin sem fazer requisições de autenticação
  const user = mockAdminUser;
  const userRole = 'Admin';
  const loading = false;

  const reauthenticate = async (password: string) => {
    // Mock function - não faz nada
    console.log("Reauthenticate called (mock - no-op)");
  };

  const value = { user, userRole, loading, reauthenticate };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}