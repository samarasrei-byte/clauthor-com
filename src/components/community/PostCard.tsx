import { motion } from "framer-motion";
import { Heart, MessageCircle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  category: CommunityCategory;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorName?: string;
  isPinned?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
  onClick?: () => void;
}

const categoryConfig: Record<CommunityCategory, { label: string; color: string }> = {
  duvidas: { label: "Dúvidas", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  templates: { label: "Templates", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  showcase: { label: "Showcase", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  anuncios: { label: "Anúncios", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  geral: { label: "Geral", color: "bg-muted text-muted-foreground border-border" },
};

const PostCard = ({
  title,
  content,
  category,
  likesCount,
  commentsCount,
  createdAt,
  authorName,
  isPinned,
  isLiked,
  onLike,
  onClick,
}: PostCardProps) => {
  const categoryInfo = categoryConfig[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 glass-hover cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
            {isPinned && (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                Fixado
              </Badge>
            )}
          </div>
          <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
      </div>

      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
        {content}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{authorName || "Anônimo"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(createdAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${isLiked ? "text-red-400" : "text-muted-foreground"}`}
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{likesCount}</span>
          </Button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
