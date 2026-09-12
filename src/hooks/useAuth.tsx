import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_REDIRECT_URL } from "@/lib/auth-security";

type UserRole = "admin" | "customer";

interface AuthResult {
  error: Error | null;
  emailConfirmationRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error || !data?.length) return null;
    return data.some((entry) => entry.role === "admin")
      ? "admin"
      : (data[0].role as UserRole);
  };

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      const nextRole = await loadRole(nextSession.user.id);
      if (!mounted) return;
      setRole(nextRole);
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;

      if (!existingSession?.user) {
        await applySession(null);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error || !data.user) {
        await supabase.auth.signOut().catch(() => undefined);
        await applySession(null);
        return;
      }

      await applySession(existingSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    const { getStoredReferral } = await import("@/lib/referral");
    const ref = getStoredReferral();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: AUTH_REDIRECT_URL,
        data: { full_name: fullName.trim(), ref_code: ref ?? null },
      },
    });

    if (!error && ref) {
      try {
        const { data: referral } = await supabase
          .from("referrals")
          .select("id, signups, bonus_credits")
          .eq("code", ref)
          .maybeSingle();
        if (referral) {
          await supabase.from("referral_events").insert({
            referral_id: referral.id,
            event_type: "signup",
            metadata: { ts: new Date().toISOString() },
          });
          await supabase
            .from("referrals")
            .update({
              signups: (referral.signups ?? 0) + 1,
              bonus_credits: (referral.bonus_credits ?? 0) + 500,
            })
            .eq("id", referral.id);
        }
      } catch {
        // O cadastro não deve falhar se o registro opcional de indicação falhar.
      }
    }

    return { error, emailConfirmationRequired: !error && !data.session };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  };

  const signOut = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setRole(null);
    }
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "admin",
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
