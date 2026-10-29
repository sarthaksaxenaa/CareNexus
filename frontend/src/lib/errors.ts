/**
 * Turn any API error body into one readable sentence.
 *
 * The backend answers errors in three shapes:
 *   { detail: "text" }                                  HTTPException
 *   { detail: { message: "..." } }                      rate limiting (429)
 *   { message: "...", detail: [{ field, message }] }    request validation (422)
 * Reading `detail` as a string showed "[object Object]" for the last two.
 */
export function errorMessage(status: number, body: unknown): string {
  const b = (body ?? {}) as { detail?: unknown; message?: unknown };
  const { detail } = b;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { field?: string; message?: string; msg?: string; loc?: unknown[] };
    const field = first.field ?? (Array.isArray(first.loc) ? first.loc.join(".") : "");
    const name = fieldLabel(field);
    const text = first.message ?? first.msg ?? "is not valid";
    return name ? `${name}: ${tidy(text)}` : tidy(text);
  }

  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }

  if (typeof b.message === "string" && b.message.trim()) return b.message;

  if (status === 0) return NETWORK_ERROR;
  if (status >= 500) return "The server ran into a problem. Please try again in a moment.";
  return `Request failed (HTTP ${status}).`;
}

export const NETWORK_ERROR =
  "Cannot reach the CareNexus server. Check that it is running and try again.";

/** "body.full_name" -> "Full name" */
function fieldLabel(field: string): string {
  const last = field.split(".").filter((p) => p && p !== "body" && p !== "query").pop() ?? "";
  if (!last) return "";
  const words = last.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Pydantic messages start lowercase ("value is not a valid email address: ..."). */
function tidy(text: string): string {
  const t = text.replace(/^Value error, /, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
