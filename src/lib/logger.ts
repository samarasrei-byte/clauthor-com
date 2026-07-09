/**
 * DEV-only structured logger.
 *
 * Use `logger.info` / `logger.debug` / `logger.warn` for developer signal —
 * these are stripped in production builds (`import.meta.env.DEV === false`).
 *
 * Always use `logger.error` for real errors: it forwards to `console.error`
 * in every environment so runtime observability (Sentry, browser devtools,
 * error boundaries) keeps working.
 *
 * Rule of thumb:
 *   - Replace `console.log(...)`  → `logger.info(...)`  or `logger.debug(...)`
 *   - Replace `console.warn(...)` → `logger.warn(...)`
 *   - Keep    `console.error(...)` (or use `logger.error(...)`)
 */

const isDev = import.meta.env.DEV;

type LogArgs = Parameters<typeof console.log>;

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) console.debug("[debug]", ...args);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info("[info]", ...args);
  },
  warn: (...args: LogArgs) => {
    if (isDev) console.warn("[warn]", ...args);
  },
  /** Errors always log — production observability depends on this. */
  error: (...args: LogArgs) => {
    console.error("[error]", ...args);
  },
};

export default logger;
