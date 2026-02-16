import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Clock, User, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface PostDetailProps {
  post: {
    id: string;
    title: string;
    content: string;
    category: CommunityCategory;
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_id: string;
  } | null;
  open: boolean;
  onClose: () => void;
  authorName?: string;
}

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
}

const categoryConfig: Record<CommunityCategory, { label: string; color: string }> = {
  duvidas: { label: "Dúvidas", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  templates: { label: "Templates", color: "bg-primary/15 text-primary border-primary/20" },
  showcase: { label: "Showcase", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  anuncios: { label: "Anúncios", color: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  geral: { label: "Geral", color: "bg-muted text-muted-foreground border-border" },
};

const PostDetail = ({ post, open, onClose, authorName }: PostDetailProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);

  useEffect(() => {
    if (post && open) {
      fetchComments();
      checkIfLiked();
      setLikesCount(post.likes_count);
    }
  }, [post, open]);

  const fetchComments = async () => {
    if (!post) return;
    const { data } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    
    if (data) setComments(data);
  };

  const checkIfLiked = async () => {
    if (!post || !user) return;
    const { data } = await supabase
      .from("community_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();
    
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!post || !user) {
      toast.error("Faça login para curtir");
      return;
    }

    if (isLiked) {
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("community_likes").insert({
        post_id: post.id,
        user_id: user.id,
      });
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleComment = async () => {
    if (!post || !user) {
      toast.error("Faça login para comentar");
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("community_comments").insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast.success("Comentário adicionado!");
    } catch (error: any) {
      toast.error("Erro ao comentar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!post) return null;

  const categoryInfo = categoryConfig[post.category];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto glass-card border-white/10">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          </div>
          <DialogTitle className="font-display text-2xl leading-tight">
            {post.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Post metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{authorName || "Anônimo"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          {/* Post content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${isLiked ? "text-red-400" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount} curtidas</span>
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length} comentários</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="font-semibold">Comentários</h4>
            
            {/* New comment input */}
            {user && (
              <div className="flex gap-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={2}
                  className="bg-background/50 border-white/10 resize-none flex-1"
                />
                <Button
                  onClick={handleComment}
                  disabled={loading || !newComment.trim()}
                  className="glow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] rounded-lg p-4"
                  >
                    <p className="text-sm">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetail;
