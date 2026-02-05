/**
 * User Guest ID Management
 * Handles generation, storage, and retrieval of X-User-Guest-ID for FastAPI requests.
 * Uses sessionStorage so the same ID is reused for the session (uniform across the device for that session).
 */

const USER_GUEST_ID_KEY = "browser-flow-user-guest-id";

/**
 * Generate a new UUID v4 (exported for server-side fallback when header is missing)
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create User Guest ID.
 * Uses sessionStorage: if an ID exists for this session, reuse it; otherwise generate and store.
 */
export function getUserGuestId(): string {
  if (typeof window === "undefined") {
    // Server-side: return a placeholder (will be replaced on client)
    return "00000000-0000-0000-0000-000000000000";
  }

  let guestId = sessionStorage.getItem(USER_GUEST_ID_KEY);

  if (!guestId) {
    guestId = generateUUID();
    sessionStorage.setItem(USER_GUEST_ID_KEY, guestId);
  }

  return guestId;
}

/**
 * Generate a new User Guest ID and store it in sessionStorage
 */
export function regenerateUserGuestId(): string {
  if (typeof window === "undefined") {
    return generateUUID();
  }

  const newId = generateUUID();
  sessionStorage.setItem(USER_GUEST_ID_KEY, newId);
  return newId;
}

/**
 * Get User Guest ID header for API requests (client-side only).
 * Use this when calling our Next.js API from the browser so the server can forward it.
 */
export function getUserGuestIdHeader(): Record<string, string> {
  return {
    "X-User-Guest-ID": getUserGuestId(),
  };
}

const HEADER_NAME = "x-user-guest-id";

/**
 * Read User Guest ID from an incoming request (for API route handlers).
 * Clients should send X-User-Guest-ID so the server can forward a proper ID to the backend.
 */
export function getUserGuestIdFromRequest(req: Request): string | null {
  const id = req.headers.get(HEADER_NAME) ?? req.headers.get("X-User-Guest-ID");
  const trimmed = id?.trim();
  return trimmed && trimmed !== "00000000-0000-0000-0000-000000000000" ? trimmed : null;
}

/**
 * Get guest ID from request, or a new UUID if missing (for backward compatibility with
 * clients that don't send the header yet, e.g. extension before reload).
 */
export function getGuestIdOrGenerate(req: Request): string {
  return getUserGuestIdFromRequest(req) ?? generateUUID();
}
