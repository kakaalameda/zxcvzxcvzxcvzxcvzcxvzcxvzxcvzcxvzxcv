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
    // Không cho phép truy cập khi chưa cấu hình email — kể cả môi trường dev.
    // Trước đây trả về true trong non-production, tạo lỗ hổng bảo mật nghiêm trọng.
    console.warn(
      "[Admin Auth]: ADMIN_ALLOWED_EMAILS chưa được cấu hình. " +
      "Mọi truy cập vào admin đều bị từ chối. " +
      "Hãy thiết lập ADMIN_ALLOWED_EMAILS trong .env.local.",
    );
    return false;
  }

  return allowedEmails.includes(normalized);
}
