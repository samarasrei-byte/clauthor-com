import { Button } from "@/components/ui/button";
import { MessageSquare, Layers, Sparkles, Megaphone, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface CategoryFilterProps {
  selected: CommunityCategory | "all";
  onSelect: (category: CommunityCategory | "all") => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const { t } = useTranslation();

  const categories: { value: CommunityCategory | "all"; labelKey: string; icon: React.ElementType }[] = [
    { value: "all", labelKey: "community.cat_all", icon: LayoutGrid },
    { value: "duvidas", labelKey: "community.cat_duvidas", icon: MessageSquare },
    { value: "templates", labelKey: "community.cat_templates", icon: Layers },
    { value: "showcase", labelKey: "community.cat_showcase", icon: Sparkles },
    { value: "anuncios", labelKey: "community.cat_anuncios", icon: Megaphone },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.value;
        
        return (
          <Button
            key={cat.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`gap-2 rounded-xl ${
              isActive 
                ? "glow" 
                : "border-white/10 hover:border-primary/40 hover:bg-white/5"
            }`}
            onClick={() => onSelect(cat.value)}
          >
            <Icon className="h-4 w-4" />
            {t(cat.labelKey)}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
