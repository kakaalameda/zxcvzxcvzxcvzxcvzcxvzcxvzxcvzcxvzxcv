export function getAllowedAdminEmails(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const allowedEmails = getAllowedAdminEmails();
  if (!allowedEmails.length) {
    return process.env.NODE_ENV !== "production";
  }

  return allowedEmails.includes(normalized);
}
