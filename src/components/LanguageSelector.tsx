import { useState } from "react";
import { useTranslation } from "react-i18next";
import { languages } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-muted-foreground hover:text-foreground px-2.5"
        >
          <Languages className="h-4 w-4" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-wider hidden sm:inline">
            {currentLang.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-44 max-h-80 overflow-y-auto glass-card border-white/10"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer gap-3 ${
              i18n.language === lang.code ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider w-5 text-muted-foreground">
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
