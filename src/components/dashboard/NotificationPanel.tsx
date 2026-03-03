import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Check, CheckCheck, Trash2, Bot, UserPlus,
  Zap, Info, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  agent_execution: { icon: Zap, color: "text-cyan-400" },
  team_invite: { icon: UserPlus, color: "text-primary" },
  agent_hired: { icon: Bot, color: "text-emerald-400" },
  email_sent: { icon: Zap, color: "text-emerald-400" },
  email_queued: { icon: Bell, color: "text-yellow-400" },
  token_limit_80: { icon: Info, color: "text-yellow-400" },
  token_limit_90: { icon: Info, color: "text-orange-400" },
  token_limit_100: { icon: Info, color: "text-destructive" },
  new_user_signup: { icon: UserPlus, color: "text-primary" },
  info: { icon: Info, color: "text-muted-foreground" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 border-border bg-card/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-sm">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[9px] bg-primary/15 text-primary h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification: n,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = typeConfig[n.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group flex gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${
        !n.is_read ? "bg-primary/[0.03]" : ""
      }`}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          !n.is_read ? "bg-primary/10" : "bg-muted/50"
        }`}
      >
        <Icon className={`h-4 w-4 ${!n.is_read ? config.color : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[13px] leading-tight ${!n.is_read ? "font-semibold" : ""}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
          {n.message}
        </p>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(n.id);
            }}
            className="p-1 rounded hover:bg-white/10"
            title="Marcar como lida"
          >
            <Check className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(n.id);
          }}
          className="p-1 rounded hover:bg-destructive/20"
          title="Excluir"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
