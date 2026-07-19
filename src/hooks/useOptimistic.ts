import { useCallback, useRef, useState } from "react";
import { notify, toastWithUndo } from "@/lib/notify";

/**
 * Wave 3 · useOptimistic
 * -----------------------------------------------------------------------------
 * Minimal, type-safe helper for optimistic UI + Undo.
 *
 * Usage:
 *   const { state, run } = useOptimistic(items);
 *
 *   run({
 *     next: state.filter(x => x.id !== id),        // optimistic snapshot
 *     commit: () => api.delete(id),                // real mutation
 *     successMessage: "Item removido",
 *     undoLabel: "Desfazer exclusão",
 *   });
 *
 * If `commit` throws, state auto-rolls back and a `danger` toast is shown.
 * If the user clicks Undo before commit resolves (or right after), the previous
 * snapshot is restored and `onUndo` is invoked so callers can reverse the API.
 */
export function useOptimistic<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const previousRef = useRef<T>(initial);

  const set = useCallback((value: T) => {
    previousRef.current = value;
    setState(value);
  }, []);

  const run = useCallback(
    async (params: {
      next: T;
      commit: () => Promise<unknown>;
      onUndo?: () => Promise<unknown> | void;
      successMessage?: string;
      errorMessage?: string;
      undoable?: boolean;
    }) => {
      const {
        next,
        commit,
        onUndo,
        successMessage,
        errorMessage = "Não foi possível concluir a ação",
        undoable = true,
      } = params;

      const snapshot = state;
      setState(next);

      try {
        await commit();
        if (successMessage) {
          if (undoable && onUndo) {
            toastWithUndo({
              message: successMessage,
              onUndo: async () => {
                setState(snapshot);
                await onUndo();
                notify.info("Ação desfeita");
              },
            });
          } else {
            notify.success(successMessage);
          }
        }
      } catch (err) {
        setState(snapshot);
        notify.danger(errorMessage, {
          description: err instanceof Error ? err.message : undefined,
        });
        throw err;
      }
    },
    [state],
  );

  return { state, set, run };
}
