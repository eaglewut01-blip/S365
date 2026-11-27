// Staff can sign in with a short ID instead of an email address. Supabase
// accounts need an email, so an ID is stored as an address on this
// placeholder domain. No mail is ever sent to it.
export const STAFF_LOGIN_DOMAIN = "staff.s365fitness.com";

export const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,29}$/;

export function normalizeLoginId(value: string): string {
  return value.trim().toLowerCase();
}

// What the person typed at sign-in -> the account's email.
export function toLoginEmail(input: string): string {
  const value = input.trim();
  return value.includes("@") ? value : `${normalizeLoginId(value)}@${STAFF_LOGIN_DOMAIN}`;
}

// The account's email -> what to show as its sign-in name.
export function loginNameOf(email: string | null | undefined): string {
  if (!email) return "";
  return email.endsWith(`@${STAFF_LOGIN_DOMAIN}`) ? email.slice(0, -STAFF_LOGIN_DOMAIN.length - 1) : email;
}

export function isIdAccount(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${STAFF_LOGIN_DOMAIN}`));
}
