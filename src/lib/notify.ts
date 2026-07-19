import { toast as sonnerToast, type ExternalToast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, Undo2 } from "lucide-react";
import { createElement } from "react";

/**
 * Wave 3 · Unified toast helpers
 * -----------------------------------------------------------------------------
 * Single source of truth for feedback messages. Enforces severity tokens,
 * consistent iconography and an ergonomic `undo` pattern that pairs perfectly
 * with optimistic UI mutations.
 */

type Severity = "info" | "success" | "warning" | "danger" | "critical";

const severityMeta: Record<Severity, { icon: typeof CheckCircle2; className: string }> = {
  info: { icon: Info, className: "severity severity-info" },
  success: { icon: CheckCircle2, className: "severity severity-success" },
  warning: { icon: AlertTriangle, className: "severity severity-warning" },
  danger: { icon: XCircle, className: "severity severity-danger" },
  critical: { icon: XCircle, className: "severity severity-critical" },
};

function baseToast(severity: Severity, message: string, options?: ExternalToast) {
  const meta = severityMeta[severity];
  return sonnerToast(message, {
    icon: createElement(meta.icon, { className: "h-4 w-4", "aria-hidden": true }),
    className: meta.className,
    duration: severity === "critical" ? 8000 : 4000,
    ...options,
  });
}

export const notify = {
  info: (msg: string, opts?: ExternalToast) => baseToast("info", msg, opts),
  success: (msg: string, opts?: ExternalToast) => baseToast("success", msg, opts),
  warning: (msg: string, opts?: ExternalToast) => baseToast("warning", msg, opts),
  danger: (msg: string, opts?: ExternalToast) => baseToast("danger", msg, opts),
  critical: (msg: string, opts?: ExternalToast) => baseToast("critical", msg, opts),
  loading: (msg: string, opts?: ExternalToast) => sonnerToast.loading(msg, opts),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

/**
 * Fire a toast with an inline "Undo" affordance.
 * The `onUndo` callback runs when the user clicks Undo; otherwise the toast
 * resolves silently after `duration` ms.
 */
export function toastWithUndo(params: {
  message: string;
  description?: string;
  onUndo: () => void | Promise<void>;
  duration?: number;
  severity?: Severity;
}) {
  const { message, description, onUndo, duration = 6000, severity = "success" } = params;
  const meta = severityMeta[severity];

  return sonnerToast(message, {
    description,
    icon: createElement(meta.icon, { className: "h-4 w-4", "aria-hidden": true }),
    className: meta.className,
    duration,
    action: {
      label: createElement(
        "span",
        { className: "inline-flex items-center gap-1" },
        createElement(Undo2, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        "Desfazer",
      ) as unknown as string,
      onClick: () => {
        void onUndo();
      },
    },
  });
}
