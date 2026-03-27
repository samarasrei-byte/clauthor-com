import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import NotificationPanel from "./NotificationPanel";
import QuickActions from "./QuickActions";

interface DashboardHeaderProps {
  locale: string;
  remainingCredits: number;
  credits: any;
}

const DashboardHeader = ({ locale, remainingCredits, credits }: DashboardHeaderProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const hour = new Date().getHours();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t("dashboard.control_panel");

  const TimeIcon = () => {
    if (hour >= 6 && hour < 18) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] animate-[spin_12s_linear_infinite]">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 12 + 6.5 * Math.cos(rad);
            const y1 = 12 + 6.5 * Math.sin(rad);
            const x2 = 12 + 9 * Math.cos(rad);
            const y2 = 12 + 9 * Math.sin(rad);
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;
          })}
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-blue-300 drop-shadow-[0_0_6px_rgba(147,197,253,0.4)]">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const greeting = hour < 12
    ? t("dashboard.good_morning", { defaultValue: "Bom dia, {{name}}", name: firstName })
    : hour < 18
      ? t("dashboard.good_afternoon", { defaultValue: "Boa tarde, {{name}}", name: firstName })
      : t("dashboard.good_evening", { defaultValue: "Boa noite, {{name}}", name: firstName });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-0.5">
        <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2.5">
          <TimeIcon />
          {greeting}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </h1>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span>
          {credits && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[10px]">
              {remainingCredits.toLocaleString(locale)} {t("dashboard.credits_short", { defaultValue: "créditos" })}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <NotificationPanel />
        <QuickActions />
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
