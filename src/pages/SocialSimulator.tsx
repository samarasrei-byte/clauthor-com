import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  Music2,
  Repeat2,
  BarChart3,
  Check,
  CheckCheck,
  Camera,
  Mic,
  Paperclip,
  Search,
  Phone,
  Video,
  ThumbsUp,
  Linkedin,
  Instagram,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */

type ChatMessage = {
  id: string;
  from: "me" | "them" | string;
  author?: string;
  text: string;
  time: string;
  read?: boolean;
};

type SimTab =
  | "carousel"
  | "post"
  | "reel"
  | "whatsapp"
  | "instagram-dm"
  | "linkedin-dm";

/* ---------- Fake data ---------- */

const CAROUSEL_SLIDES = [
  {
    title: "Departamento Comercial",
    subtitle: "Squad de IA fechando reuniões enquanto você dorme",
    tag: "Case #01",
    accent: "from-[hsl(var(--destructive))/0.35] to-transparent",
  },
  {
    title: "+38% em pipeline",
    subtitle: "Sem contratar um SDR humano",
    tag: "Resultado",
    accent: "from-white/[0.12] to-transparent",
  },
  {
    title: "Squad customizável",
    subtitle: "Monte seu departamento em minutos",
    tag: "Como funciona",
    accent: "from-[hsl(var(--destructive))/0.25] to-transparent",
  },
];

const WHATSAPP_THREAD: ChatMessage[] = [
  { id: "w1", from: "them", author: "Lucas — SDR IA", text: "Oi Marina, tudo bem? Vi que a Nova Tech está expandindo o time comercial.", time: "09:41", read: true },
  { id: "w2", from: "me", text: "Oi! Sim, estamos sim. Como você me achou?", time: "09:42", read: true },
  { id: "w3", from: "them", author: "Lucas — SDR IA", text: "Nossa IA identifica empresas em fase de crescimento. Posso te mostrar em 15min como triplicamos o pipeline de 3 clientes parecidos com o seu?", time: "09:42", read: true },
  { id: "w4", from: "me", text: "Manda os horários de amanhã.", time: "09:44", read: true },
  { id: "w5", from: "them", author: "Lucas — SDR IA", text: "Amanhã 10h ou 15h. Qual prefere?", time: "09:44", read: true },
];

const INSTAGRAM_DM: ChatMessage[] = [
  { id: "i1", from: "them", author: "reginaoral.ia", text: "Vi teu último reel sobre onboarding 👀", time: "hoje" },
  { id: "i2", from: "me", text: "Ah obrigado! Tá indo bem né?", time: "hoje" },
  { id: "i3", from: "them", author: "reginaoral.ia", text: "Bom demais. Posso te apresentar um squad que edita esses reels no automático?", time: "hoje" },
  { id: "i4", from: "me", text: "Curioso. Manda!", time: "hoje" },
];

const LINKEDIN_DM: ChatMessage[] = [
  { id: "l1", from: "them", author: "Rafael Menezes • Head de IA", text: "Olá Ana, notei que sua empresa está contratando 3 SDRs. Faz sentido conversarmos sobre um squad de IA equivalente por 10% do custo?", time: "Terça" },
  { id: "l2", from: "me", text: "Faz sim. Tem material?", time: "Terça" },
  { id: "l3", from: "them", author: "Rafael Menezes • Head de IA", text: "Envio um case de 2min. Quando você tem 15min essa semana?", time: "Terça" },
];

const REEL_CAPTIONS = [
  "Squad comercial fechou 4 reuniões enquanto o time dormia 🌙",
  "Como um departamento de IA custa 90% menos que 1 SDR humano",
  "Marina ativou o departamento em 4 minutos. Veja o antes/depois.",
];

/* ---------- Shared UI ---------- */

const DeviceFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "relative w-full max-w-[380px] h-[720px] rounded-[42px] overflow-hidden",
      "bg-[hsl(var(--background))]/95",
      "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
      "border border-white/[0.08]",
      className
    )}
  >
    {/* Notch */}
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 h-7 w-32 rounded-full bg-black/95" />
    {/* Sheen sweep */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -inset-y-8 -left-1/3 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        animate={{ x: ["0%", "260%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <div className="relative z-10 h-full pt-10">{children}</div>
  </div>
);

const StatusBar = ({ label }: { label: string }) => (
  <div className="flex items-center justify-between px-6 pt-2 pb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
    <span>{label}</span>
    <span>9:41</span>
  </div>
);

/* ---------- Carousel (Instagram/Facebook) ---------- */

const CarouselSim = () => {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CAROUSEL_SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);

  const slide = CAROUSEL_SLIDES[idx];

  return (
    <DeviceFrame>
      <StatusBar label="Instagram" />
      <div className="px-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[hsl(var(--destructive))] to-white/20 p-[2px]">
            <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-[11px] font-semibold">
              CL
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-foreground">clauthor.ai</div>
            <div className="text-[11px] text-muted-foreground">Patrocinado · São Paulo</div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="relative mt-3 mx-3 aspect-square rounded-2xl overflow-hidden border border-white/[0.06] bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br", slide.accent)} />
            <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_20%,hsl(var(--destructive)/0.25),transparent_60%)]" />
            <div className="relative h-full w-full flex flex-col justify-between p-5">
              <span className="self-start rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/80 backdrop-blur">
                {slide.tag}
              </span>
              <div>
                <h3 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
                  {slide.title}
                </h3>
                <p className="mt-2 text-[13px] text-muted-foreground">{slide.subtitle}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-foreground/90 backdrop-blur">
          {idx + 1}/{CAROUSEL_SLIDES.length}
        </div>

        <button
          onClick={() => setIdx((i) => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60"
          aria-label="anterior"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60"
          aria-label="próximo"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 mt-3 flex items-center gap-4">
        <button onClick={() => setLiked((v) => !v)} className="transition-transform hover:scale-110">
          <Heart className={cn("h-6 w-6", liked ? "fill-[hsl(var(--destructive))] text-[hsl(var(--destructive))]" : "text-foreground")} />
        </button>
        <MessageCircle className="h-6 w-6 text-foreground" />
        <Send className="h-6 w-6 text-foreground" />
        <Bookmark className="ml-auto h-6 w-6 text-foreground" />
      </div>
      <div className="px-4 mt-2 text-[12px]">
        <p className="font-semibold text-foreground">{liked ? "1.284" : "1.283"} curtidas</p>
        <p className="mt-1 text-foreground">
          <span className="font-semibold">clauthor.ai</span>{" "}
          <span className="text-muted-foreground">{slide.subtitle}</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Ver todos os 42 comentários</p>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {CAROUSEL_SLIDES.map((_, i) => (
          <motion.span
            key={i}
            animate={{ scale: i === idx ? 1.2 : 1, opacity: i === idx ? 1 : 0.4 }}
            className={cn("h-1.5 w-1.5 rounded-full", i === idx ? "bg-[hsl(var(--destructive))]" : "bg-foreground/40")}
          />
        ))}
      </div>
    </DeviceFrame>
  );
};

/* ---------- Single Post (Twitter/X) ---------- */

const TwitterSim = () => {
  const [likes, setLikes] = useState(1284);
  const [liked, setLiked] = useState(false);

  return (
    <DeviceFrame>
      <StatusBar label="X" />
      <div className="px-4">
        <div className="flex items-center gap-2 text-foreground">
          <Twitter className="h-5 w-5" />
          <span className="text-sm font-medium">Home</span>
        </div>
      </div>

      <div className="mt-4 mx-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[hsl(var(--destructive))] to-white/10 flex items-center justify-center text-sm font-semibold">
            CL
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-[13px]">
              <span className="font-semibold text-foreground">Clauthor</span>
              <span className="text-[hsl(var(--destructive))]">✓</span>
              <span className="text-muted-foreground">@clauthor · 2h</span>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-foreground">
              Contratar humano: 90 dias de onboarding.
              <br />
              Contratar squad de IA: 4 minutos.
              <br />
              <br />
              <span className="text-[hsl(var(--destructive))]">#futureofwork</span>
            </p>

            <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[hsl(var(--destructive))/0.2] via-white/[0.03] to-black flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Departamento</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">Squad ativo em 4min</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-muted-foreground text-[12px]">
              <button className="flex items-center gap-1.5 hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> 128
              </button>
              <button className="flex items-center gap-1.5 hover:text-emerald-400">
                <Repeat2 className="h-4 w-4" /> 342
              </button>
              <button
                onClick={() => {
                  setLiked((v) => !v);
                  setLikes((l) => (liked ? l - 1 : l + 1));
                }}
                className={cn("flex items-center gap-1.5", liked && "text-[hsl(var(--destructive))]")}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-[hsl(var(--destructive))]")} /> {likes.toLocaleString("pt-BR")}
              </button>
              <button className="flex items-center gap-1.5 hover:text-foreground">
                <BarChart3 className="h-4 w-4" /> 24K
              </button>
              <button>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
};

/* ---------- Reels / TikTok ---------- */

const ReelSim = () => {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % REEL_CAPTIONS.length), 4800);
    return () => clearInterval(t);
  }, []);

  return (
    <DeviceFrame>
      <div className="absolute inset-0 pt-10">
        {/* Video canvas */}
        <div className="relative h-full w-full overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--destructive)/0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="h-40 w-40 rounded-full bg-[hsl(var(--destructive))/0.15] backdrop-blur border border-white/10 flex items-center justify-center">
                  <Play className="h-14 w-14 text-foreground/90" fill="currentColor" />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bars */}
          <div className="absolute top-3 left-4 right-4 flex gap-1">
            {REEL_CAPTIONS.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-foreground"
                  animate={{ width: i < idx ? "100%" : i === idx ? "100%" : "0%" }}
                  transition={{ duration: i === idx ? 4.8 : 0.2 }}
                />
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
            <button onClick={() => setLiked((v) => !v)} className="flex flex-col items-center gap-1">
              <Heart className={cn("h-7 w-7 drop-shadow", liked ? "fill-[hsl(var(--destructive))] text-[hsl(var(--destructive))]" : "text-foreground")} />
              <span className="text-[10px] text-foreground/90">{liked ? "24.1k" : "24k"}</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <MessageCircle className="h-7 w-7 text-foreground drop-shadow" />
              <span className="text-[10px] text-foreground/90">842</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Send className="h-7 w-7 text-foreground drop-shadow" />
              <span className="text-[10px] text-foreground/90">Enviar</span>
            </button>
            <Volume2 className="h-6 w-6 text-foreground/70" />
          </div>

          {/* Bottom info */}
          <div className="absolute left-4 right-20 bottom-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--destructive))] to-white/20 flex items-center justify-center text-[11px] font-semibold">
                CL
              </div>
              <div className="text-[13px] font-semibold text-foreground">@clauthor</div>
              <button className="ml-1 rounded-md border border-[hsl(var(--destructive))] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--destructive))]">
                Seguir
              </button>
            </div>
            <p className="mt-2 text-[13px] text-foreground leading-snug">{REEL_CAPTIONS[idx]}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/80">
              <Music2 className="h-3 w-3" />
              <span>som original · clauthor</span>
            </div>
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
};

/* ---------- WhatsApp ---------- */

const WhatsAppSim = () => {
  const [msgs, setMsgs] = useState(WHATSAPP_THREAD.slice(0, 2));
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let i = 2;
    const advance = () => {
      if (i >= WHATSAPP_THREAD.length) return;
      const next = WHATSAPP_THREAD[i];
      if (next.from === "them") {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setMsgs((m) => [...m, next]);
          i++;
          setTimeout(advance, 1400);
        }, 1400);
      } else {
        setMsgs((m) => [...m, next]);
        i++;
        setTimeout(advance, 1200);
      }
    };
    const t = setTimeout(advance, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <DeviceFrame className="bg-[#0b141a]">
      <div className="absolute inset-0 pt-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-[#1f2c33]">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-[12px] font-semibold text-white">
            L
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-white">Lucas — SDR IA</div>
            <div className="text-[11px] text-emerald-400">digitando…</div>
          </div>
          <Video className="h-4 w-4 text-white/70" />
          <Phone className="h-4 w-4 text-white/70" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-[#0b141a] [background-image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:8px_8px]">
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow",
                    m.from === "me"
                      ? "bg-[#005c4b] text-white rounded-tr-none"
                      : "bg-[#1f2c33] text-white rounded-tl-none"
                  )}
                >
                  <p>{m.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/60">
                    <span>{m.time}</span>
                    {m.from === "me" && (m.read ? <CheckCheck className="h-3 w-3 text-sky-400" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-lg rounded-tl-none bg-[#1f2c33] px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-white/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3 bg-[#1f2c33]">
          <Paperclip className="h-4 w-4 text-white/60" />
          <div className="flex-1 rounded-full bg-[#2a3942] px-4 py-2 text-[13px] text-white/50">
            Mensagem
          </div>
          <Camera className="h-4 w-4 text-white/60" />
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center">
            <Mic className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
};

/* ---------- Instagram DM ---------- */

const InstagramDMSim = () => {
  return (
    <DeviceFrame>
      <StatusBar label="Direct" />
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05]">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[hsl(var(--destructive))] via-fuchsia-500 to-amber-400 p-[2px]">
          <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-[11px] font-semibold text-foreground">
            R
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">reginaoral.ia</div>
          <div className="text-[11px] text-emerald-400">Ativa agora</div>
        </div>
        <Phone className="h-4 w-4 text-muted-foreground" />
        <Video className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {INSTAGRAM_DM.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug",
                m.from === "me"
                  ? "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]"
                  : "bg-white/[0.06] text-foreground border border-white/[0.06]"
              )}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-4 left-3 right-3 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 backdrop-blur">
        <Camera className="h-4 w-4 text-[hsl(var(--destructive))]" />
        <span className="flex-1 text-[13px] text-muted-foreground">Mensagem…</span>
        <Mic className="h-4 w-4 text-muted-foreground" />
        <Instagram className="h-4 w-4 text-muted-foreground" />
      </div>
    </DeviceFrame>
  );
};

/* ---------- LinkedIn DM ---------- */

const LinkedInDMSim = () => {
  return (
    <DeviceFrame className="bg-[#0a1626]">
      <div className="absolute inset-0 pt-10 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-[#0a1a2f]">
          <Linkedin className="h-4 w-4 text-sky-400" />
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-white">Rafael Menezes</div>
            <div className="text-[11px] text-white/60">Head de IA · Nova Tech</div>
          </div>
          <Search className="h-4 w-4 text-white/50" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {LINKEDIN_DM.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2", m.from === "me" ? "justify-end" : "justify-start")}
            >
              {m.from !== "me" && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-800 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                  R
                </div>
              )}
              <div
                className={cn(
                  "max-w-[76%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug",
                  m.from === "me"
                    ? "bg-sky-600 text-white rounded-tr-sm"
                    : "bg-white/[0.06] text-white border border-white/[0.06] rounded-tl-sm"
                )}
              >
                {m.text}
                <div className="mt-1 text-[10px] text-white/60">{m.time}</div>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <button className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] text-white/80 hover:bg-white/[0.06]">
              👍 Faz sentido
            </button>
            <button className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] text-white/80 hover:bg-white/[0.06]">
              📅 Agendar reunião
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-3 bg-[#0a1a2f] border-t border-white/[0.05]">
          <div className="flex-1 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] text-white/50">
            Escreva uma mensagem…
          </div>
          <ThumbsUp className="h-4 w-4 text-sky-400" />
        </div>
      </div>
    </DeviceFrame>
  );
};

/* ---------- Page ---------- */

const TABS: { id: SimTab; label: string; description: string }[] = [
  { id: "carousel", label: "Carrossel", description: "Instagram · Facebook" },
  { id: "post", label: "Post", description: "X · Twitter" },
  { id: "reel", label: "Reel", description: "Reels · TikTok" },
  { id: "whatsapp", label: "WhatsApp", description: "Conversa" },
  { id: "instagram-dm", label: "Direct", description: "Instagram DM" },
  { id: "linkedin-dm", label: "LinkedIn", description: "Mensagem" },
];

export default function SocialSimulator() {
  const [tab, setTab] = useState<SimTab>("carousel");

  const active = useMemo(() => TABS.find((t) => t.id === tab)!, [tab]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Simulador Social — Clauthor</title>
        <meta
          name="description"
          content="Veja seu squad de IA gerando conteúdo e conversando com leads em Instagram, WhatsApp, LinkedIn, TikTok e X."
        />
      </Helmet>

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--destructive))] animate-pulse" />
            Simulação ao vivo
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
            Seu squad de IA em cada canal
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Veja o mesmo departamento publicando, conversando e convertendo em Instagram, WhatsApp, LinkedIn e mais — em tempo real.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "group relative rounded-full border px-4 py-2 text-[12px] transition",
                tab === t.id
                  ? "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))/0.1] text-foreground"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-white/20"
              )}
            >
              <span className="font-medium">{t.label}</span>
              <span className="ml-2 text-[10px] opacity-60">{t.description}</span>
            </button>
          ))}
        </div>

        {/* Stage */}
        <div className="mt-12 flex justify-center">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-16 rounded-full bg-[hsl(var(--destructive))/0.08] blur-3xl" />
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {tab === "carousel" && <CarouselSim />}
                {tab === "post" && <TwitterSim />}
                {tab === "reel" && <ReelSim />}
                {tab === "whatsapp" && <WhatsAppSim />}
                {tab === "instagram-dm" && <InstagramDMSim />}
                {tab === "linkedin-dm" && <LinkedInDMSim />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-10 text-center text-[12px] text-muted-foreground">
          {active.label} · {active.description} — simulação orquestrada pelos agentes do departamento.
        </p>
      </section>
    </div>
  );
}
