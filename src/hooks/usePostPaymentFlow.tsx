import { useState, useEffect } from "react";

export function usePostPaymentFlow() {
  const [postPaymentContext, setPostPaymentContext] = useState<{
    agentName: string;
    isDepartment: boolean;
    agentCount: number;
    departmentId?: string;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDeptSetup, setShowDeptSetup] = useState(false);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("clauthor_post_payment_onboarding");
    if (!raw) return;
    sessionStorage.removeItem("clauthor_post_payment_onboarding");
    try {
      setPostPaymentContext(JSON.parse(raw));
      setShowCelebration(true);
    } catch { /* ignore */ }
  }, []);

  const onCelebrationComplete = () => {
    setShowCelebration(false);
    setShowCompanyOnboarding(true);
  };

  const onCompanyOnboardingDone = (hasDept: boolean, deptId?: string) => {
    setShowCompanyOnboarding(false);
    if (hasDept && deptId) {
      setShowDeptSetup(true);
    }
  };

  const onDeptSetupDone = () => {
    setShowDeptSetup(false);
  };

  const clearPostPayment = () => setPostPaymentContext(null);

  return {
    postPaymentContext,
    showCelebration,
    showDeptSetup,
    showCompanyOnboarding,
    setShowCompanyOnboarding,
    onCelebrationComplete,
    onCompanyOnboardingDone,
    onDeptSetupDone,
    clearPostPayment,
  };
}
