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
import { Check } from "lucide-react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  // Convert country code (e.g. "br") to flag emoji (e.g. 🇧🇷)
  const toFlagEmoji = (countryCode: string) => {
    return countryCode
      .toUpperCase()
      .split("")
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join("");
  };

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
          className="gap-1.5 text-muted-foreground hover:text-foreground px-2.5"
        >
          <span className="text-base leading-none">{toFlagEmoji(currentLang.flag)}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider hidden sm:inline">
            {currentLang.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 max-h-80 overflow-y-auto glass-card border-white/10 z-[100]"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
            className={`cursor-pointer gap-3 ${
              i18n.language === lang.code ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <span className="text-base leading-none">{toFlagEmoji(lang.flag)}</span>
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
