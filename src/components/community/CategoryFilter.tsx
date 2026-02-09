import { Button } from "@/components/ui/button";
import { MessageSquare, Layers, Sparkles, Megaphone, LayoutGrid } from "lucide-react";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface CategoryFilterProps {
  selected: CommunityCategory | "all";
  onSelect: (category: CommunityCategory | "all") => void;
}

const categories: { value: CommunityCategory | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: LayoutGrid },
  { value: "duvidas", label: "Dúvidas", icon: MessageSquare },
  { value: "templates", label: "Templates", icon: Layers },
  { value: "showcase", label: "Showcase", icon: Sparkles },
  { value: "anuncios", label: "Anúncios", icon: Megaphone },
];

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
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
            {cat.label}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
