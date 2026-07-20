import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Wand, RotateCcw, PanelRightOpen, MessageSquare, Zap, Clapperboard, Settings2, ExternalLink } from "lucide-react";

type Provider = "veo3" | "replicate" | "lovable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerate: () => void;
  onReset: () => void;
  onToggleLibrary: () => void;
  onFocusChat: () => void;
  onSetProvider: (p: Provider) => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
  providerAvailable: (p: Provider) => boolean;
  canGenerate: boolean;
}

/**
 * Paleta de comandos (⌘K) para o Video Studio.
 * Centraliza atalhos: gerar, focar chat, alternar biblioteca, trocar motor, upgrade.
 */
export default function VideoCommandPalette({
  open,
  onOpenChange,
  onGenerate,
  onReset,
  onToggleLibrary,
  onFocusChat,
  onSetProvider,
  onOpenSettings,
  onOpenPricing,
  providerAvailable,
  canGenerate,
}: Props) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // let dialog close before firing focus/nav actions
    setTimeout(fn, 20);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Digite um comando… (gerar, biblioteca, motor, upgrade)" />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => run(onGenerate)} disabled={!canGenerate}>
            <Wand className="mr-2 h-4 w-4" />
            <span>Gerar vídeo</span>
            <CommandShortcut>G</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onFocusChat)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Focar no chat do Thor</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onToggleLibrary)}>
            <PanelRightOpen className="mr-2 h-4 w-4" />
            <span>Abrir biblioteca</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onReset)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Recomeçar conversa</span>
            <CommandShortcut>⇧R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenSettings)}>
            <Settings2 className="mr-2 h-4 w-4" />
            <span>Configurações de formato</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Motor de geração">
          <CommandItem
            onSelect={() => run(() => onSetProvider("veo3"))}
            disabled={!providerAvailable("veo3")}
          >
            <Wand className="mr-2 h-4 w-4" />
            <span>Usar Veo 3 · alta qualidade</span>
            <CommandShortcut>1</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => onSetProvider("replicate"))}
            disabled={!providerAvailable("replicate")}
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>Usar Replicate · rápido</span>
            <CommandShortcut>2</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <Clapperboard className="mr-2 h-4 w-4" />
            <span>Clauthor AI · em breve</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Conta">
          <CommandItem onSelect={() => run(onOpenPricing)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Fazer upgrade de plano</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
