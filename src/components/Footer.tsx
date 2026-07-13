import { Link } from "react-router-dom";
import { Linkedin, LockKeyhole, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import ClauthorLogo from "@/components/ClauthorLogo";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border py-12 sm:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-10 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ClauthorLogo size="lg" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              {t("home.footer_desc")}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://linkedin.com/company/clauthor" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-lg border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors">
                <Linkedin className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4">
            <div className="space-y-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_product")}</p>
              <Link to="/library" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_agents")}</Link>
              <Link to="/departamentos" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_departments")}</Link>
              
              <Link to="/pricing" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
              <Link to="/how-it-works" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.how_it_works")}</Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_community_label")}</p>
              <Link to="/community" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_community_link")}</Link>
              <Link to="/api-docs" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
              <Link to="/pitch" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_pitch")}</Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_legal")}</p>
              <Link to="/termos" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_terms_label")}</Link>
              <Link to="/privacidade" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_privacy_label")}</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex flex-wrap items-center gap-4">
            {[
              { icon: LockKeyhole, label: t("home.footer_ssl", { defaultValue: "SSL 256-BIT" }) },
              { icon: ShieldCheck, label: t("home.footer_enterprise_badge", { defaultValue: "ENTERPRISE-GRADE" }) },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border">
                <badge.icon className="h-3 w-3 text-primary/50" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">{t("home.footer_copyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
