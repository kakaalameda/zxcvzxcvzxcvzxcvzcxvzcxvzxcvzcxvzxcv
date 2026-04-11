/**
 * Tạo slug URL-friendly từ chuỗi tiếng Việt.
 * Chuẩn hóa Unicode NFD rồi bỏ dấu tổ hợp, chuyển thường, thay khoảng trắng bằng dấu gạch ngang.
 */

// Xử lý ký tự đặc biệt trong tiếng Việt không được bỏ dấu bằng NFD
const SPECIAL_MAP: Record<string, string> = {
  đ: "d",
  Đ: "d",
  ơ: "o",
  Ơ: "o",
  ư: "u",
  Ư: "u",
  ă: "a",
  Ă: "a",
};

export function toSlug(text: string): string {
  return text
    .split("")
    .map((char) => SPECIAL_MAP[char] ?? char)
    .join("")
    // Chuẩn hóa NFD để tách dấu thanh ra khỏi ký tự gốc
    .normalize("NFD")
    // Bỏ các combining diacritical marks (U+0300–U+036F)
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Tạo slug từ tên sản phẩm, tự động thêm id làm hậu tố nếu truyền vào.
 */
export function toProductSlug(name: string, id?: number): string {
  const base = toSlug(name);
  return id ? `${base}-${id}` : base;
}
