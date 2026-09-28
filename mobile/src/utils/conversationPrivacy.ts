/**
 * Conversation identity privacy.
 *
 * Privileged accounts (owner, manager, lead programmer) must never be exposed
 * to regular users by name, phone number, or administrative title inside chat.
 * The server already masks these, but the client applies the same rule so a
 * stale/partial API response can never leak a name on screen.
 */

const PRIVILEGED_ROLES = [
  "owner",
  "manager",
  "programmer",
  "lead_developer",
  "main_programmer",
];

const LEAD_PROGRAMMER_MARKERS = [
  "01064739664",
  "maherkhaled880",
  "ماهر",
  "khaled",
];

export const NEUTRAL_ADMIN_NAME = "إدارة TecnoRexa";
export const NEUTRAL_DEV_TEAM_NAME = "فريق TecnoRexa";
export const SUPPORT_TEAM_NAME = "خدمة العملاء";

/** True when the viewer is allowed to see real staff identities. */
export function canSeeStaffIdentity(viewerRole?: string | null): boolean {
  if (!viewerRole) return false;
  const r = String(viewerRole).toLowerCase();
  // Staff conversations may show the real internal name, per policy.
  return PRIVILEGED_ROLES.includes(r);
}

/**
 * Returns the name that should be displayed for the *other* participant,
 * or null when the caller's own name should never be shown as the peer.
 */
export function maskConversationName(params: {
  otherUserName?: string | null;
  otherUserRole?: string | null;
  viewerRole?: string | null;
  isGroup?: boolean;
}): string {
  const { otherUserName, otherUserRole, viewerRole, isGroup } = params;

  if (isGroup) return "مجموعة TecnoRexa";

  const name = String(otherUserName || "").trim();
  const role = String(otherUserRole || "").toLowerCase();

  // Staff-to-staff: real identity is allowed.
  if (canSeeStaffIdentity(viewerRole)) {
    return name || SUPPORT_TEAM_NAME;
  }

  const isPrivileged = PRIVILEGED_ROLES.includes(role);
  const looksLikeLead = LEAD_PROGRAMMER_MARKERS.some(
    (m) => name.includes(m) || role.includes(m),
  );

  if (role === "customer_support" || role === "support") {
    return SUPPORT_TEAM_NAME;
  }
  if (isPrivileged || looksLikeLead) {
    // Never distinguish programmer from owner/manager for regular users.
    return NEUTRAL_ADMIN_NAME;
  }
  return name || "مستخدم TecnoRexa";
}

/** Strips phone numbers out of any user-facing text. */
export function maskPhoneNumbers(text?: string | null): string {
  if (!text) return "";
  return String(text).replace(/01\d{9}/g, "01XXXXXXXXX");
}

export default maskConversationName;
