import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  AUTH_REDIRECT_URL,
  PASSWORD_RECOVERY_REDIRECT_URL,
  getSafeAuthErrorMessage,
  validateAuthFields,
} from "@/lib/auth-security";

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
  requestPasswordReset: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const safeError = (message: string) => new Error(message);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error || !data?.length) return null;
    return data.some((entry) => entry.role === "admin") ? "admin" : (data[0].role as UserRole);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    void supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      if (!existingSession?.user) return applySession(null);
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        await supabase.auth.signOut().catch(() => undefined);
        return applySession(null);
      }
      await applySession(existingSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    const validation = validateAuthFields("signup", email, password, fullName);
    if (!validation.valid) return { error: safeError(validation.message!) };

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
    if (error) return { error: safeError(getSafeAuthErrorMessage("signup", error)) };

    if (ref) {
      try {
        const { data: referral } = await supabase.from("referrals").select("id, signups, bonus_credits").eq("code", ref).maybeSingle();
        if (referral) {
          await supabase.from("referral_events").insert({
            referral_id: referral.id,
            event_type: "signup",
            metadata: { ts: new Date().toISOString() },
          });
          await supabase.from("referrals").update({
            signups: (referral.signups ?? 0) + 1,
            bonus_credits: (referral.bonus_credits ?? 0) + 500,
          }).eq("id", referral.id);
        }
      } catch {
        // A indicação é opcional e nunca invalida o cadastro concluído.
      }
    }
    return { error: null, emailConfirmationRequired: !data.session };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const validation = validateAuthFields("login", email, password);
    if (!validation.valid) return { error: safeError(validation.message!) };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? safeError(getSafeAuthErrorMessage("login", error)) : null };
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const validation = validateAuthFields("recovery", email);
    if (!validation.valid) return { error: safeError(validation.message!) };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
    });
    return { error: error ? safeError(getSafeAuthErrorMessage("recovery", error)) : null };
  };

  const signOut = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: safeError(getSafeAuthErrorMessage("logout", error)) };
    setUser(null);
    setSession(null);
    setRole(null);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, isAdmin: role === "admin", isLoading,
      signUp, signIn, signOut, requestPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
