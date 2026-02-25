import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type CommunityCategory = "duvidas" | "templates" | "showcase" | "anuncios" | "geral";

interface CreatePostDialogProps {
  onPostCreated: () => void;
}

const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommunityCategory>("geral");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t("community.login_required"));
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error(t("community.fill_all"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        category,
      });

      if (error) throw error;

      toast.success(t("community.post_created"));
      setOpen(false);
      setTitle("");
      setContent("");
      setCategory("geral");
      onPostCreated();
    } catch (error: any) {
      toast.error(t("community.post_error") + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          {t("community.new_post")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("community.create_post")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t("community.category_label")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CommunityCategory)}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">{t("community.cat_geral")}</SelectItem>
                <SelectItem value="duvidas">{t("community.cat_duvidas")}</SelectItem>
                <SelectItem value="templates">{t("community.cat_templates")}</SelectItem>
                <SelectItem value="showcase">{t("community.cat_showcase")}</SelectItem>
                <SelectItem value="anuncios">{t("community.cat_anuncios")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("community.title_label")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("community.title_placeholder")}
              className="bg-background/50 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("community.content_label")}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("community.content_placeholder")}
              rows={5}
              className="bg-background/50 border-white/10 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("community.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="glow gap-2">
              <Send className="h-4 w-4" />
              {loading ? t("community.publishing") : t("community.publish")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
