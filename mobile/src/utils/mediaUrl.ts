/**
 * Media URL resolution for user-supplied content (avatars, receipts, media).
 *
 * The problem this solves: a customer's uploaded photo was not showing in the
 * admin user list because the path was hard-coded to one production domain, so
 * any other path (or a relative one) fell through to a default "person" icon.
 *
 * Rules:
 *  - absolute http(s) and data: URLs are used as-is
 *  - relative paths (/uploads/x.jpg) are resolved against the live API host
 *  - emoji / short text avatars are returned as null (render as text instead)
 */
import { api } from "../api/client";

export function resolveMediaUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;

  // Emojis and single characters are avatar placeholders, not image files.
  if (
    !/\.(png|jpe?g|webp|gif|heic|heif|bmp)$/i.test(value) &&
    !value.includes("/")
  ) {
    return null;
  }

  const base = String((api as any).defaults?.baseURL || "").replace(
    /\/api\/?$/,
    "",
  );
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${base}${path}`;
}

export default resolveMediaUrl;
