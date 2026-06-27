import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (data && !error && data.length > 0) {
      // Prioritize admin role if user has multiple roles
      const hasAdmin = data.some((r: any) => r.role === "admin");
      setRole(hasAdmin ? "admin" : (data[0].role as UserRole));
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role without blocking the callback
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .then(({ data }) => {
              if (!mounted) return;
              if (data && data.length > 0) {
                const hasAdmin = data.some((r: any) => r.role === "admin");
                setRole(hasAdmin ? "admin" : (data[0].role as UserRole));
              }
              setIsLoading(false);
            });
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .then(({ data }) => {
            if (!mounted) return;
            if (data && data.length > 0) {
              const hasAdmin = data.some((r: any) => r.role === "admin");
              setRole(hasAdmin ? "admin" : (data[0].role as UserRole));
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { getStoredReferral } = await import("@/lib/referral");
    const ref = getStoredReferral();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, ref_code: ref ?? null },
      },
    });
    if (!error && ref) {
      try {
        const { data: r } = await supabase
          .from("referrals")
          .select("id, signups, bonus_credits")
          .eq("code", ref)
          .maybeSingle();
        if (r) {
          await supabase.from("referral_events").insert({
            referral_id: r.id,
            event_type: "signup",
            metadata: { email, ts: new Date().toISOString() },
          });
          await supabase
            .from("referrals")
            .update({
              signups: (r.signups ?? 0) + 1,
              bonus_credits: (r.bonus_credits ?? 0) + 500,
            })
            .eq("id", r.id);
        }
      } catch {/* silent */}
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
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
