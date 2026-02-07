/**
 * User Guest ID Management
 * Handles generation, storage, and retrieval of X-User-Guest-ID for FastAPI requests.
 * Uses sessionStorage so the same ID is reused for the session.
 * Keeps dashboard sessionStorage and extension chrome.storage.local in sync via postMessage.
 */

export const USER_GUEST_ID_KEY = "browser-flow-user-guest-id";

const GUEST_ID_SYNC_TIMEOUT_MS = 500;
const GUEST_ID_SYNC_EVENT = "browser-flow-guest-id-synced";

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
 * Set User Guest ID in sessionStorage (e.g. when syncing from extension).
 */
export function setUserGuestId(guestId: string): void {
  if (typeof window === "undefined") return;
  if (guestId?.trim()) {
    sessionStorage.setItem(USER_GUEST_ID_KEY, guestId.trim());
    window.dispatchEvent(new CustomEvent(GUEST_ID_SYNC_EVENT, { detail: { guestId: guestId.trim() } }));
  }
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
  syncGuestIdToExtension(newId);
  return newId;
}

/**
 * Tell the extension (via content script postMessage) to store this guest ID
 * so extension and dashboard stay in sync. Call after regenerating or when dashboard has the ID first.
 */
export function syncGuestIdToExtension(guestId: string): void {
  if (typeof window === "undefined" || !guestId?.trim()) return;
  window.postMessage(
    { type: "BROWSER_FLOW_SYNC_GUEST_ID", guestId: guestId.trim() },
    window.location.origin
  );
}

/**
 * Sync guest ID with the extension on dashboard load:
 * - If dashboard has a guest ID in sessionStorage, push it to the extension.
 * - Ask the extension for its guest ID; if we get one, set sessionStorage and dispatch event.
 * - If no response (no extension), create/store one locally as before.
 */
export function initGuestIdSync(): void {
  if (typeof window === "undefined") return;

  const existing = sessionStorage.getItem(USER_GUEST_ID_KEY);
  if (existing) {
    window.postMessage(
      { type: "BROWSER_FLOW_SYNC_GUEST_ID", guestId: existing },
      window.location.origin
    );
  }

  const handleResponse = (event: MessageEvent) => {
    const data = event.data;
    if (data?.type === "BROWSER_FLOW_GUEST_ID_RESPONSE" && data.guestId) {
      window.removeEventListener("message", handleResponse);
      setUserGuestId(data.guestId);
    }
  };
  window.addEventListener("message", handleResponse);
  window.postMessage({ type: "BROWSER_FLOW_GET_GUEST_ID" }, window.location.origin);

  setTimeout(() => {
    window.removeEventListener("message", handleResponse);
    if (!sessionStorage.getItem(USER_GUEST_ID_KEY)) {
      getUserGuestId();
    }
  }, GUEST_ID_SYNC_TIMEOUT_MS);
}

/** Event name for when guest ID was synced (e.g. from extension). Components can listen to refresh. */
export const GUEST_ID_SYNC_EVENT_NAME = GUEST_ID_SYNC_EVENT;

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
