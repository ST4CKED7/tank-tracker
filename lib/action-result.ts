/**
 * Outcome contract for server actions whose forms report success or failure to
 * the user. Expected failures are returned, not thrown, so the client can toast
 * the real reason instead of assuming the write landed.
 */
export type ActionResult = { ok: true } | { ok: false; error: string }

/** Turn a Supabase/Postgres error into a user-facing failure result. */
export function actionFailed(error: { message?: string } | null, fallback: string): ActionResult {
  return { ok: false, error: error?.message || fallback }
}
