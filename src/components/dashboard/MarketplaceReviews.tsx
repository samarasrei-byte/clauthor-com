import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, ThumbsUp, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  agentName: string;
}

interface MarketplaceReviewsProps {
  agentSlug?: string;
  agentName?: string;
  compact?: boolean;
}

const MOCK_REVIEWS: Review[] = [
  { id: "1", userName: "Carlos M.", rating: 5, comment: "SDR incrível! Gerou 12 leads qualificados na primeira semana.", date: "2026-03-28", helpful: 8, agentName: "SDR Hunter" },
  { id: "2", userName: "Ana S.", rating: 4, comment: "Copywriter excelente, mas precisa de mais contexto no início.", date: "2026-03-25", helpful: 5, agentName: "Copywriter Pro" },
  { id: "3", userName: "Roberto L.", rating: 5, comment: "Analista de dados transformou nossos relatórios. ROI absurdo.", date: "2026-03-22", helpful: 12, agentName: "Data Analyst" },
  { id: "4", userName: "Mariana F.", rating: 5, comment: "O squad de Marketing dobrou nosso engajamento em 2 semanas.", date: "2026-03-20", helpful: 15, agentName: "Marketing Squad" },
];

const StarRating = ({ rating, size = "sm", interactive = false, onChange }: { rating: number; size?: "sm" | "md"; interactive?: boolean; onChange?: (r: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
          s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          interactive && "cursor-pointer hover:text-amber-400 transition-colors"
        )}
        onClick={() => interactive && onChange?.(s)}
      />
    ))}
  </div>
);

const MarketplaceReviews = ({ agentSlug, agentName, compact }: MarketplaceReviewsProps) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  const reviews = agentSlug
    ? MOCK_REVIEWS.filter(r => r.agentName.toLowerCase().includes(agentSlug))
    : MOCK_REVIEWS;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmit = () => {
    if (newRating === 0) { toast.error("Selecione uma nota"); return; }
    toast.success(t("reviews.submitted", { defaultValue: "Avaliação enviada com sucesso!" }));
    setShowForm(false);
    setNewRating(0);
    setNewComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="font-display text-sm font-bold">
              {t("reviews.title", { defaultValue: "Avaliações" })}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{avgRating}</span>
            <span className="text-[10px] text-muted-foreground">({reviews.length})</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowForm(!showForm)}>
          <MessageCircle className="h-3 w-3" />
          {t("reviews.write", { defaultValue: "Avaliar" })}
        </Button>
      </div>

      {/* Write review form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("reviews.your_rating", { defaultValue: "Sua nota:" })}
            </span>
            <StarRating rating={newRating} size="md" interactive onChange={setNewRating} />
          </div>
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={t("reviews.placeholder", { defaultValue: "Conte como foi sua experiência..." })}
            className="h-20 text-xs resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setShowForm(false)}>
              {t("reviews.cancel", { defaultValue: "Cancelar" })}
            </Button>
            <Button size="sm" className="h-7 text-[11px]" onClick={handleSubmit}>
              {t("reviews.submit", { defaultValue: "Enviar" })}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reviews list */}
      <div className={cn("space-y-2", compact && "max-h-64 overflow-y-auto")}>
        {reviews.slice(0, compact ? 3 : reviews.length).map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border/15 bg-card/30 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {review.userName.charAt(0)}
                </div>
                <span className="text-xs font-medium">{review.userName}</span>
                <StarRating rating={review.rating} />
              </div>
              <span className="text-[9px] text-muted-foreground">{review.date}</span>
            </div>
            {!compact && <span className="text-[10px] text-primary/70 font-medium">{review.agentName}</span>}
            <p className="text-[11px] text-muted-foreground leading-relaxed">{review.comment}</p>
            <button className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors">
              <ThumbsUp className="h-2.5 w-2.5" /> {review.helpful} {t("reviews.helpful", { defaultValue: "acharam útil" })}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MarketplaceReviews;
