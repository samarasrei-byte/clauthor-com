import { motion } from "framer-motion";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MonixConfig } from "@/hooks/useMonix";

interface MonixSettingsProps {
  config: MonixConfig;
  onUpdate: (partial: Partial<MonixConfig>) => void;
  onClose: () => void;
}

const MonixSettings = ({ config, onUpdate, onClose }: MonixSettingsProps) => {
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
        className="w-full max-w-md bg-card border border-border/30 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Personalizar {config.name}</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Nome do Agente</label>
            <Input value={config.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="MONIX" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tom de Voz</label>
            <Select value={config.tone} onValueChange={v => onUpdate({ tone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["estratégico", "técnico", "direto", "inspirador", "formal", "informal"].map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Personalidade</label>
            <Select value={config.personality} onValueChange={v => onUpdate({ personality: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["visionário", "analítico", "agressivo", "mentor", "conselheiro", "futurista"].map(p => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Estilo de Resposta</label>
            <Select value={config.responseStyle} onValueChange={v => onUpdate({ responseStyle: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curto">Curto e objetivo</SelectItem>
                <SelectItem value="detalhado">Detalhado e profundo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Idioma</label>
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
            <label className="text-xs text-muted-foreground mb-1.5 block">Nível de Autonomia</label>
            <Select value={config.autonomy} onValueChange={v => onUpdate({ autonomy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apenas analisar">Apenas analisar</SelectItem>
                <SelectItem value="analisar e sugerir">Analisar e sugerir ações</SelectItem>
                <SelectItem value="autônomo">Sugerir ações automáticas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full glow" onClick={onClose}>Salvar Configurações</Button>
      </motion.div>
    </motion.div>
  );
};

export default MonixSettings;
