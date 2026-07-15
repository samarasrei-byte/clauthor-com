import { useCallback, useRef, useState } from "react";
import { Paperclip, X, Loader2, ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoUpload, type UploadedMedia } from "@/hooks/useVideoUpload";

interface Props {
  value: UploadedMedia | null;
  onChange: (media: UploadedMedia | null) => void;
  accept?: "image" | "video" | "both";
  className?: string;
}

/**
 * Apple-style dropzone com drag-and-drop e botão discreto.
 * Faz upload direto para o bucket `videos` via useVideoUpload.
 */
export default function MediaDropzone({ value, onChange, accept = "both", className }: Props) {
  const { upload, uploading, progress } = useVideoUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const result = await upload(file);
      if (result) onChange(result);
    },
    [upload, onChange],
  );

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-2",
          className,
        )}
      >
        <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
          {value.kind === "image" ? (
            <img src={value.signedUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Film strokeWidth={1.5} className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{value.filename}</div>
          <div className="text-[10px] text-muted-foreground">
            {value.kind === "image" ? "Imagem" : "Vídeo"} · {(value.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center text-muted-foreground"
          aria-label="Remover anexo"
        >
          <X strokeWidth={1.5} className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative rounded-xl border border-dashed transition-all",
        dragging ? "border-primary bg-primary/5" : "border-border/70 bg-card/40 hover:border-muted-foreground/50",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
          {uploading ? (
            <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Paperclip strokeWidth={1.5} className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground">
            {uploading ? `Enviando… ${progress}%` : "Anexar imagem ou vídeo"}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <ImageIcon strokeWidth={1.5} className="w-3 h-3" /> até 20 MB
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Film strokeWidth={1.5} className="w-3 h-3" /> até 100 MB
            </span>
          </div>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {uploading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/40 rounded-b-xl overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
