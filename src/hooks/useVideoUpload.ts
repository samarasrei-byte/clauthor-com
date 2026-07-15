import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenantId } from "@/hooks/useTenantId";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export interface UploadedMedia {
  kind: "image" | "video";
  storagePath: string;
  signedUrl: string;
  mime: string;
  size: number;
  filename: string;
}

/**
 * Uploads a file to the `videos` storage bucket under
 * `{tenant_id}/uploads/{uuid}-{safeName}` and returns a fresh 24h signed URL.
 * Applies size limits (20 MB image, 100 MB video) and surfaces toast errors.
 */
export function useVideoUpload() {
  const { data: tenantId } = useTenantId();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(file: File): Promise<UploadedMedia | null> {
    if (!tenantId) {
      toast.error("Tenant indisponível — recarregue a página.");
      return null;
    }
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Formato não suportado. Use imagem ou vídeo.");
      return null;
    }
    const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > limit) {
      toast.error(
        isImage
          ? "Imagem maior que 20 MB. Reduza e tente novamente."
          : "Vídeo maior que 100 MB. Reduza e tente novamente.",
      );
      return null;
    }

    setUploading(true);
    setProgress(10);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${tenantId}/uploads/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("videos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        toast.error(`Falha no upload: ${error.message}`);
        return null;
      }
      setProgress(80);
      const { data: signed, error: signErr } = await supabase.storage
        .from("videos")
        .createSignedUrl(path, 60 * 60 * 24);
      if (signErr || !signed?.signedUrl) {
        toast.error("Upload concluído mas link assinado falhou.");
        return null;
      }
      setProgress(100);
      return {
        kind: isImage ? "image" : "video",
        storagePath: path,
        signedUrl: signed.signedUrl,
        mime: file.type,
        size: file.size,
        filename: file.name,
      };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  return { upload, uploading, progress };
}
