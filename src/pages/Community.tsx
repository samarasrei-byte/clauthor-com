import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/community/PostCard";
import CategoryFilter from "@/components/community/CategoryFilter";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import PostDetail from "@/components/community/PostDetail";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface Post {
  id: string;
  title: string;
  content: string;
  category: CommunityCategory;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_pinned: boolean;
  user_id: string;
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | "all">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("community_posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .not("post_id", "is", null);

    if (data) {
      setLikedPosts(new Set(data.map((like) => like.post_id as string)));
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p
        )
      );
    } else {
      await supabase.from("community_likes").insert({
        post_id: postId,
        user_id: user.id,
      });
      setLikedPosts((prev) => new Set([...prev, postId]));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        )
      );
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Comunidade ApexBot
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Fórum de <span className="gradient-text">IAs e Automação</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Troque ideias, tire dúvidas e compartilhe experiências com outros usuários da plataforma.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          {[
            { icon: MessageSquare, label: "Posts", value: posts.length },
            { icon: Users, label: "Membros Ativos", value: "847" },
            { icon: TrendingUp, label: "Discussões Hoje", value: "23" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-4 text-center"
            >
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="font-display font-bold text-2xl gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          {user && <CreatePostDialog onPostCreated={fetchPosts} />}
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl mb-2">Nenhum post ainda</h3>
              <p className="text-muted-foreground">
                Seja o primeiro a iniciar uma discussão!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                category={post.category}
                likesCount={post.likes_count}
                commentsCount={post.comments_count}
                createdAt={post.created_at}
                isPinned={post.is_pinned}
                isLiked={likedPosts.has(post.id)}
                onLike={() => handleLike(post.id)}
                onClick={() => setSelectedPost(post)}
              />
            ))
          )}
        </motion.div>

        {/* Post Detail Modal */}
        <PostDetail
          post={selectedPost}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      </div>
    </div>
  );
};

export default Community;
