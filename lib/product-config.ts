export const PRODUCT_TYPES = ["Tee", "Hoodie", "Pants"] as const;
export const PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const TAG_VARIANTS = ["gold", "white", "red", "outline"] as const;

export type PredefinedProductColorName =
  | "Black"
  | "White"
  | "Cream"
  | "Grey"
  | "Navy"
  | "Olive"
  | "Red"
  | "Brown";

export type PredefinedProductColor = {
  name: PredefinedProductColorName;
  hex: string;
  bgClass: string;
};

export const PREDEFINED_PRODUCT_COLOR_NAMES = [
  "Black",
  "White",
  "Cream",
  "Grey",
  "Navy",
  "Olive",
  "Red",
  "Brown",
] as const satisfies readonly PredefinedProductColorName[];

export const PREDEFINED_PRODUCT_COLORS: readonly PredefinedProductColor[] = [
  {
    name: "Black",
    hex: "#111111",
    bgClass: "from-[#111111] to-[#1f1f1f]",
  },
  {
    name: "White",
    hex: "#F5F3EE",
    bgClass: "from-[#d7d1c6] to-[#f7f4ef]",
  },
  {
    name: "Cream",
    hex: "#E7DDC9",
    bgClass: "from-[#c1b092] to-[#efe7d6]",
  },
  {
    name: "Grey",
    hex: "#7C8087",
    bgClass: "from-[#3f434a] to-[#676c74]",
  },
  {
    name: "Navy",
    hex: "#1F2D44",
    bgClass: "from-[#131d2d] to-[#213652]",
  },
  {
    name: "Olive",
    hex: "#4D5A3A",
    bgClass: "from-[#212918] to-[#364227]",
  },
  {
    name: "Red",
    hex: "#8B1E24",
    bgClass: "from-[#4d1216] to-[#752127]",
  },
  {
    name: "Brown",
    hex: "#6B4F3A",
    bgClass: "from-[#3c2a1e] to-[#5a4030]",
  },
] as const;

const PREDEFINED_PRODUCT_COLOR_MAP = new Map(
  PREDEFINED_PRODUCT_COLORS.map((color) => [color.name, color]),
);

export function getPredefinedProductColor(name: string) {
  return PREDEFINED_PRODUCT_COLOR_MAP.get(
    name as PredefinedProductColorName,
  );
}

export function isPredefinedProductColorName(
  value: string,
): value is PredefinedProductColorName {
  return PREDEFINED_PRODUCT_COLOR_MAP.has(value as PredefinedProductColorName);
}
