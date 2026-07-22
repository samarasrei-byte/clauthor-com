import { useState } from "react";
import { useTranslation } from "react-i18next";
import { languages, changeLanguageSafe } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChangeLanguage = async (code: string) => {
    setOpen(false);
    await changeLanguageSafe(code);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Selecionar idioma"
          className="gap-1.5 text-muted-foreground hover:text-foreground px-2.5"
        >
          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-wider hidden sm:inline">
            {currentLang.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 max-h-80 overflow-y-auto bg-popover/95 backdrop-blur-xl border border-border shadow-xl z-[100]"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
            className={`cursor-pointer gap-3 ${
              i18n.language === lang.code ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-6">
              {lang.code}
            </span>
            <span className="flex-1 text-sm">{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
