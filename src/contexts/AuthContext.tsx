"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UserRole = "Admin" | "Operator";

interface AuthContextType {
  user: SupabaseUser | null;
  userRole: UserRole | null;
  loading: boolean;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  reauthenticate: () => Promise.resolve(),
});

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar role em profiles:", error);
    return "Operator";
  }

  if (data?.role === "Admin" || data?.role === "Operator") {
    return data.role;
  }

  return "Operator";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setUser(session.user);

      try {
        const resolvedRole = await fetchUserRole(session.user.id);

        if (!isMounted) {
          return;
        }

        setUserRole(resolvedRole);
      } catch (error) {
        console.error("Erro ao sincronizar sessao:", error);

        if (!isMounted) {
          return;
        }

        setUserRole("Operator");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const syncCurrentSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await syncSession(session);
      } catch (error) {
        console.error("Erro ao atualizar sessao atual:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void syncCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void syncCurrentSession();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const reauthenticate = async (password: string) => {
    if (!user?.email) {
      throw new Error("Nao ha usuario autenticado para revalidar.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || data.user.id !== user.id) {
      throw new Error("Falha ao confirmar a identidade do usuario.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, reauthenticate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
