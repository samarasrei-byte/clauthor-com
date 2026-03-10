import { useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OmnixConfig } from "@/hooks/useOmnix";
import { useTranslation } from "react-i18next";

interface OmnixSettingsProps {
  config: OmnixConfig;
  onUpdate: (partial: Partial<OmnixConfig>) => void;
  onClose: () => void;
}

const OmnixSettings = ({ config, onUpdate, onClose }: OmnixSettingsProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border/20 rounded-2xl p-6 space-y-5 shadow-[0_0_60px_hsl(var(--primary)/0.05)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-lg">{t("cmd.customize", { name: config.name })}</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.agent_name_label")}</label>
            <Input value={config.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="THOR" />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.tone_label")}</label>
            <Select value={config.tone} onValueChange={v => onUpdate({ tone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["estratégico", "técnico", "direto", "inspirador", "formal", "informal"].map(tone => (
                  <SelectItem key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.personality_label")}</label>
            <Select value={config.personality} onValueChange={v => onUpdate({ personality: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["futurista", "visionário", "analítico", "agressivo", "mentor", "conselheiro"].map(p => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.response_style_label")}</label>
            <Select value={config.responseStyle} onValueChange={v => onUpdate({ responseStyle: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curto">{t("cmd.style_short")}</SelectItem>
                <SelectItem value="detalhado">{t("cmd.style_detailed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.language_label")}</label>
            <Select value={config.language} onValueChange={v => onUpdate({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 mb-1.5 block uppercase tracking-wider">{t("cmd.autonomy_label")}</label>
            <Select value={config.autonomy} onValueChange={v => onUpdate({ autonomy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apenas analisar">{t("cmd.autonomy_analyze")}</SelectItem>
                <SelectItem value="analisar e sugerir">{t("cmd.autonomy_suggest")}</SelectItem>
                <SelectItem value="autônomo">{t("cmd.autonomy_auto")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full shadow-[0_0_16px_hsl(var(--primary)/0.2)]" onClick={onClose}>
          {t("cmd.save_settings")}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OmnixSettings;
