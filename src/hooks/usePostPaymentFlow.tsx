import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startCustomerSetup } from "@/lib/customer-setup";

export function usePostPaymentFlow() {
  const navigate = useNavigate();
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

  const routeToCustomerSetup = () => {
    if (!postPaymentContext) return;
    const { isDepartment, departmentId, agentName } = postPaymentContext;
    if (isDepartment && departmentId) {
      startCustomerSetup(navigate, "department", departmentId, agentName);
    } else {
      startCustomerSetup(navigate, "agent", agentName, agentName);
    }
  };

  const onCompanyOnboardingDone = (hasDept: boolean, deptId?: string) => {
    setShowCompanyOnboarding(false);
    if (hasDept && deptId) {
      setShowDeptSetup(true);
    } else {
      routeToCustomerSetup();
    }
  };

  const onDeptSetupDone = () => {
    setShowDeptSetup(false);
    routeToCustomerSetup();
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
