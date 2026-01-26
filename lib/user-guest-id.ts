/**
 * User Guest ID Management
 * Handles generation, storage, and retrieval of X-User-Guest-ID for FastAPI requests
 */

const USER_GUEST_ID_KEY = "browser-flow-user-guest-id";

/**
 * Generate a new UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create User Guest ID
 * Retrieves from localStorage, or generates and stores a new one
 */
export function getUserGuestId(): string {
  if (typeof window === "undefined") {
    // Server-side: return a placeholder (will be replaced on client)
    return "00000000-0000-0000-0000-000000000000";
  }

  let guestId = localStorage.getItem(USER_GUEST_ID_KEY);

  if (!guestId) {
    guestId = generateUUID();
    localStorage.setItem(USER_GUEST_ID_KEY, guestId);
  }

  return guestId;
}

/**
 * Generate a new User Guest ID and store it
 */
export function regenerateUserGuestId(): string {
  if (typeof window === "undefined") {
    return generateUUID();
  }

  const newId = generateUUID();
  localStorage.setItem(USER_GUEST_ID_KEY, newId);
  return newId;
}

/**
 * Get User Guest ID header for API requests
 */
export function getUserGuestIdHeader(): Record<string, string> {
  return {
    "X-User-Guest-ID": getUserGuestId(),
  };
}
