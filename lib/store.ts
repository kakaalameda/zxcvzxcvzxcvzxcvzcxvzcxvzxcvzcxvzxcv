export type ProductType = "Tee" | "Hoodie" | "Pants";
export type ProductTagVariant = "gold" | "white" | "red" | "outline";
export type ProductSize = "S" | "M" | "L" | "XL" | "XXL";

export interface ProductImage {
  id: number;
  alt: string;
  bgClass: string;
  iconPath: string;
  imageUrl?: string;
  colorId?: number | null;
}

export interface ProductColor {
  id?: number;
  name: string;
  hex: string;
  bgClass: string;
  stockCount?: number;
}

export interface ProductSizeOption {
  size: ProductSize;
  available: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  name: string;
  subtitle: string;
  category: ProductType;
  description: string;
  price: number;
  oldPrice?: number;
  tag?: string;
  tagVariant?: ProductTagVariant;
  rating: number;
  reviewCount: number;
  stockCount: number;
  colors: ProductColor[];
  sizes: ProductSizeOption[];
  specs: ProductSpec[];
  features: string[];
  images: ProductImage[];
}

export interface Voucher {
  code: string;
  pct: number;
  label: string;
  desc: string;
  active?: boolean;
  maxUses?: number | null;
  usedCount?: number;
  expiresAt?: string | null;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface BrandStat {
  num: string;
  label: string;
}

export interface BrandPerk {
  title: string;
  text: string;
}

export interface LookbookSection {
  eyebrow: string;
  title: string;
  text: string;
  productId: number;
}

export interface AboutValue {
  title: string;
  text: string;
}

export interface NewCartItem {
  key: string;
  productId: number;
  href: string;
  name: string;
  sub: string;
  price: number;
  qty: number;
  tag?: string;
  bgClass: string;
  iconPath: string;
  imageUrl?: string;
  colorName?: string;
  size?: ProductSize;
}

const PRODUCT_LABELS = ["Front view", "Back view", "Detail shot", "Lifestyle"];

const ALL_SIZES: ProductSize[] = ["S", "M", "L", "XL", "XXL"];

function makeSizes(available: ProductSize[]): ProductSizeOption[] {
  return ALL_SIZES.map((size) => ({
    size,
    available: available.includes(size),
  }));
}

function makeImages(
  bgClasses: [string, string, string, string],
  iconPath: string,
): ProductImage[] {
  return PRODUCT_LABELS.map((alt, index) => ({
    id: index + 1,
    alt,
    bgClass: bgClasses[index],
    iconPath,
  }));
}

const TEE_ICON =
  "M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z";
const HOODIE_ICON =
  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10";
const PANTS_ICON =
  "M5 2h14l-2 20h-4l-1-10-1 10H7L5 2z";

export const SITE_NAV_LINKS: NavLink[] = [
  { href: "/collection", label: "Sản phẩm" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "/track-order", label: "Tra đơn" },
];

export const BRAND_STATS: BrandStat[] = [
  { num: "500+", label: "Mẫu đang mở bán" },
  { num: "10K+", label: "Khách hàng đã mua" },
  { num: "100%", label: "Hoàn thiện tại Việt Nam" },
];

export const BRAND_PERKS: BrandPerk[] = [
  { title: "Miễn phí giao hàng", text: "Áp dụng cho đơn từ 500K toàn quốc" },
  { title: "Đổi trả dễ dàng", text: "Hỗ trợ trong 30 ngày nếu cần đổi size" },
  { title: "Đóng gói nhanh", text: "Xử lý và bàn giao đơn trong 24h" },
  { title: "Làm tại Việt Nam", text: "Thiết kế và hoàn thiện trong nước" },
];

export const MARQUEE_ITEMS = [
  "NGHE HUSTLE",
  "STREETWEAR",
  "MADE IN VIETNAM",
  "NEW DROP 2026",
  "LIMITED EDITION",
  "NGHE HUSTLE",
  "STREETWEAR",
  "MADE IN VIETNAM",
  "NEW DROP 2026",
  "LIMITED EDITION",
];

export const VOUCHERS: Voucher[] = [
  { code: "HUSTLE10", pct: 10, label: "HUSTLE10 (-10%)", desc: "Giảm 10% cho đơn đầu tiên" },
  { code: "VIP20", pct: 20, label: "VIP20 (-20%)", desc: "Giảm sâu cho khách quen" },
  { code: "NEWDROP", pct: 15, label: "NEWDROP (-15%)", desc: "Ưu đãi cho drop mới" },
];

export const PROVINCES: Record<string, string[]> = {
  "Hà Nội": ["Hoàn Kiếm", "Đống Đa", "Ba Đình", "Cầu Giấy", "Tây Hồ", "Thanh Xuân", "Hà Đông"],
  "TP. Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Gò Vấp", "Phú Nhuận", "Thủ Đức"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu"],
  "Hải Phòng": ["Hồng Bàng", "Ngô Quyền", "Lê Chân", "Kiến An"],
  "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"],
  "Nghệ An": ["TP. Vinh", "Cửa Lò", "Thái Hòa"],
  "Bình Dương": ["Thủ Dầu Một", "Dĩ An", "Thuận An", "Bến Cát"],
  "Đồng Nai": ["Biên Hòa", "Long Khánh", "Nhơn Trạch", "Long Thành"],
  "Khánh Hòa": ["Nha Trang", "Cam Ranh", "Ninh Hòa"],
  "Lâm Đồng": ["Đà Lạt", "Bảo Lộc", "Đức Trọng"],
};

export const LOOKBOOK_SECTIONS: LookbookSection[] = [
  {
    eyebrow: "Editorial 01",
    title: "Concrete Morning",
    text: "Những layer tối giản, chất liệu nặng tay và form rộng vừa đủ để đi từ phố đến studio mà không mất tinh thần streetwear gốc.",
    productId: 1,
  },
  {
    eyebrow: "Editorial 02",
    title: "Late Shift Uniform",
    text: "Hoodie, cargo và tông đen được xử lý như một bộ đồng phục cho những ngày chạy deadline, rehearsal hoặc lang thang ngoài phố đêm.",
    productId: 5,
  },
  {
    eyebrow: "Editorial 03",
    title: "Made To Move",
    text: "Phom dáng thoáng, vật liệu bền và bảng màu trầm giúp outfit trông gọn, chắc và hoạt động tốt ở nhịp sống hàng ngày.",
    productId: 8,
  },
];

export const ABOUT_VALUES: AboutValue[] = [
  {
    title: "Tinh thần đường phố",
    text: "Nghe Hustle bắt đầu từ nhịp sống thật, từ cách con người mặc đồ mỗi ngày thay vì chạy theo hình ảnh vay mượn.",
  },
  {
    title: "Chất liệu đáng tin",
    text: "Chất liệu, định lượng vải và độ bền hoàn thiện là điều quyết định một món đồ có được mặc lại lâu dài hay không.",
  },
  {
    title: "Làm ít nhưng làm chắc",
    text: "Chúng tôi ưu tiên ra mắt gọn, kiểm soát chất lượng kỹ và để sản phẩm tự nói lên giá trị của mình.",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "NH Classic Tee",
    subtitle: "Heavyweight Cotton 240gsm",
    category: "Tee",
    description:
      "NH Classic Tee dùng cotton heavyweight 240gsm, form boxy dễ mặc và giữ phom tốt sau nhiều lần giặt. Đây là mẫu core item cho mọi outfit streetwear tối giản.",
    price: 399_000,
    oldPrice: 599_000,
    tag: "NEW",
    tagVariant: "gold",
    rating: 4.8,
    reviewCount: 128,
    stockCount: 12,
    colors: [
      { name: "Đen", hex: "#0A0A0A", bgClass: "from-[#1a1100] to-[#2a1f00]" },
      { name: "Trắng", hex: "#F4F1EA", bgClass: "from-[#d4c4a3] to-[#f5ecda]" },
      { name: "Olive", hex: "#4A523C", bgClass: "from-[#1b2214] to-[#323a25]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "100% Cotton" },
      { label: "Định lượng", value: "240 GSM" },
      { label: "Kiểu dáng", value: "Boxy Oversize" },
      { label: "Hoàn thiện", value: "May kép vai và gấu" },
    ],
    features: [
      "Cotton preshrunk hạn chế co rút sau giặt",
      "Rib cổ 1x1 giữ form lâu hơn",
      "In lụa cao su mờ cho logo trước ngực",
      "Phù hợp mặc một lớp hoặc layer với outerwear",
    ],
    images: makeImages(
      [
        "from-[#1a1100] to-[#2a1f00]",
        "from-[#0f1410] to-[#1c2419]",
        "from-[#0d0d0d] to-[#1b1b1b]",
        "from-[#2b1c00] to-[#3d2a00]",
      ],
      TEE_ICON,
    ),
  },
  {
    id: 2,
    name: "Hustle Hoodie OG",
    subtitle: "French Terry Fleece",
    category: "Hoodie",
    description:
      "Hustle Hoodie OG là mẫu hoodie nặng tay, cấu trúc gọn và giữ nhiệt tốt. Thiết kế tập trung vào fit ổn định, mũ đứng và bề mặt vải lì để dễ phối đồ.",
    price: 799_000,
    tag: "HOT",
    tagVariant: "white",
    rating: 4.9,
    reviewCount: 94,
    stockCount: 8,
    colors: [
      { name: "Đen", hex: "#111111", bgClass: "from-[#0d0d0d] to-[#1a1a1a]" },
      { name: "Bone", hex: "#DDD6C8", bgClass: "from-[#bbb29f] to-[#e6dcc8]" },
      { name: "Navy", hex: "#19273D", bgClass: "from-[#101b2c] to-[#1d324f]" },
    ],
    sizes: makeSizes(["M", "L", "XL", "XXL"]),
    specs: [
      { label: "Chất liệu", value: "French Terry" },
      { label: "Định lượng", value: "400 GSM" },
      { label: "Phom", value: "Relaxed Fit" },
      { label: "Chi tiết", value: "Mũ hai lớp, bo dày" },
    ],
    features: [
      "Mặt vải dày nhưng vẫn thoáng cho thời tiết đô thị",
      "Bo tay và bo gấu chắc, ít bai dão",
      "Logo thêu trước ngực tối giản",
      "Túi kangaroo sâu, dùng tốt hàng ngày",
    ],
    images: makeImages(
      [
        "from-[#0d0d0d] to-[#1a1a1a]",
        "from-[#141822] to-[#1f2738]",
        "from-[#1e1b17] to-[#2d261d]",
        "from-[#0c0c12] to-[#171725]",
      ],
      HOODIE_ICON,
    ),
  },
  {
    id: 3,
    name: "Street Cargo Pants",
    subtitle: "Relaxed Fit · 6 Pockets",
    category: "Pants",
    description:
      "Street Cargo Pants tập trung vào phom rộng vừa phải và khả năng vận động. Chất vải canvas pha giúp quần đứng dáng nhưng không quá cứng khi mặc cả ngày.",
    price: 649_000,
    tag: "LIMITED",
    tagVariant: "gold",
    rating: 4.7,
    reviewCount: 61,
    stockCount: 10,
    colors: [
      { name: "Đen", hex: "#181818", bgClass: "from-[#1a0e00] to-[#2d1a00]" },
      { name: "Khaki", hex: "#7F6B4D", bgClass: "from-[#43351f] to-[#655033]" },
      { name: "Rêu", hex: "#4B5941", bgClass: "from-[#1f291a] to-[#314128]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "Canvas Blend" },
      { label: "Phom", value: "Relaxed Straight" },
      { label: "Túi", value: "6 túi utility" },
      { label: "Chi tiết", value: "Khóa kéo YKK" },
    ],
    features: [
      "Bề mặt vải chắc và ít nhăn",
      "Đầu gối có line cắt giúp đứng form",
      "Túi hộp gọn, không phồng quá mức",
      "Dễ phối cùng tee hoặc hoodie oversized",
    ],
    images: makeImages(
      [
        "from-[#1a0e00] to-[#2d1a00]",
        "from-[#1a1a1a] to-[#262626]",
        "from-[#212514] to-[#374221]",
        "from-[#2d2414] to-[#43351f]",
      ],
      PANTS_ICON,
    ),
  },
  {
    id: 4,
    name: "NH Vintage Tee",
    subtitle: "Washed Cotton 180gsm",
    category: "Tee",
    description:
      "NH Vintage Tee mang tinh thần faded và worn-in rõ hơn dòng core. Vải nhẹ hơn, xử lý wash mềm tay, hợp với outfit casual hoặc summer layering.",
    price: 349_000,
    oldPrice: 449_000,
    tag: "SALE",
    tagVariant: "red",
    rating: 4.6,
    reviewCount: 72,
    stockCount: 14,
    colors: [
      { name: "Fade Black", hex: "#2A2A2A", bgClass: "from-[#0f0f0f] to-[#1c1c1c]" },
      { name: "Stone", hex: "#C9C0B0", bgClass: "from-[#a59a86] to-[#d7cebf]" },
      { name: "Dust Blue", hex: "#5A667A", bgClass: "from-[#2b3240] to-[#526077]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "Washed Cotton" },
      { label: "Định lượng", value: "180 GSM" },
      { label: "Phom", value: "Relaxed Fit" },
      { label: "Bề mặt", value: "Garment Washed" },
    ],
    features: [
      "Màu wash tạo cảm giác worn-in ngay từ lần mặc đầu",
      "Vải nhẹ hơn cho thời tiết nóng",
      "Form rộng vừa, không ôm người",
      "In logo nhỏ, ưu tiên texture vải",
    ],
    images: makeImages(
      [
        "from-[#0f0f0f] to-[#1c1c1c]",
        "from-[#202636] to-[#31384b]",
        "from-[#211b15] to-[#3b3025]",
        "from-[#4e4740] to-[#6c655e]",
      ],
      TEE_ICON,
    ),
  },
  {
    id: 5,
    name: "Wings Hoodie",
    subtitle: "Heavyweight Fleece 400gsm",
    category: "Hoodie",
    description:
      "Wings Hoodie có fit rộng hơn OG, phù hợp styling layer dày. Điểm nhấn nằm ở đồ họa lớn phía sau nhưng vẫn giữ tổng thể tối và gọn.",
    price: 899_000,
    tag: "NEW",
    tagVariant: "gold",
    rating: 4.9,
    reviewCount: 43,
    stockCount: 7,
    colors: [
      { name: "Charcoal", hex: "#202020", bgClass: "from-[#1a1200] to-[#2e2000]" },
      { name: "Ash", hex: "#B9B3AA", bgClass: "from-[#8e877b] to-[#cfc8be]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "Heavy Fleece" },
      { label: "Định lượng", value: "400 GSM" },
      { label: "Phom", value: "Oversized" },
      { label: "Đồ họa", value: "Print lưng cỡ lớn" },
    ],
    features: [
      "Vai rơi sâu tạo silhouette street rõ nét",
      "Vải dày, bề mặt lì, ít xù lông",
      "Mũ đứng và dây rút to bản",
      "Phù hợp với cargo, denim hoặc short rộng",
    ],
    images: makeImages(
      [
        "from-[#1a1200] to-[#2e2000]",
        "from-[#151515] to-[#242424]",
        "from-[#202636] to-[#33405b]",
        "from-[#3a2a12] to-[#5a411d]",
      ],
      HOODIE_ICON,
    ),
  },
  {
    id: 6,
    name: "NH Slim Cargo",
    subtitle: "Tapered Ripstop",
    category: "Pants",
    description:
      "NH Slim Cargo dành cho người thích cargo gọn hơn nhưng vẫn có tinh thần utility. Ống thu nhẹ, đáy vừa và ripstop giúp quần bền hơn ở tần suất mặc cao.",
    price: 599_000,
    tag: "NEW",
    tagVariant: "gold",
    rating: 4.7,
    reviewCount: 57,
    stockCount: 11,
    colors: [
      { name: "Black", hex: "#111111", bgClass: "from-[#111111] to-[#1e1e1e]" },
      { name: "Sand", hex: "#8F7A5E", bgClass: "from-[#4d3d29] to-[#70583e]" },
    ],
    sizes: makeSizes(["M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "Ripstop" },
      { label: "Phom", value: "Tapered Fit" },
      { label: "Túi", value: "4 túi utility" },
      { label: "Gấu quần", value: "Điều chỉnh dây rút" },
    ],
    features: [
      "Nhẹ hơn cargo canvas truyền thống",
      "Silhouette gọn, dễ đi cùng sneaker thấp cổ",
      "Đầu gối có space để vận động tốt",
      "Phù hợp cả outfit citywear lẫn casual",
    ],
    images: makeImages(
      [
        "from-[#111111] to-[#1e1e1e]",
        "from-[#151a10] to-[#262f1a]",
        "from-[#4d3d29] to-[#70583e]",
        "from-[#161616] to-[#262626]",
      ],
      PANTS_ICON,
    ),
  },
  {
    id: 7,
    name: "Classic Tee Vol.2",
    subtitle: "Oversized 220gsm",
    category: "Tee",
    description:
      "Classic Tee Vol.2 cân bằng giữa dòng heavyweight và dòng washed. Vải 220gsm, tay dài hơn nhẹ và cổ vừa để đi được nhiều kiểu phối.",
    price: 429_000,
    rating: 4.8,
    reviewCount: 83,
    stockCount: 16,
    colors: [
      { name: "Cream", hex: "#ECE5D5", bgClass: "from-[#c0b392] to-[#ede4cf]" },
      { name: "Black", hex: "#121212", bgClass: "from-[#170f00] to-[#241800]" },
      { name: "Slate", hex: "#4B5563", bgClass: "from-[#262c35] to-[#3b4656]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL", "XXL"]),
    specs: [
      { label: "Chất liệu", value: "Cotton Jersey" },
      { label: "Định lượng", value: "220 GSM" },
      { label: "Phom", value: "Oversized" },
      { label: "Cổ", value: "Rib bản vừa" },
    ],
    features: [
      "Tỷ lệ tay và thân áo cân đối với vóc người châu Á",
      "Đủ dày để mặc đứng phom nhưng không bí",
      "Logo nhỏ trước ngực, ưu tiên fit",
      "Dễ dùng làm base layer cho jacket",
    ],
    images: makeImages(
      [
        "from-[#170f00] to-[#241800]",
        "from-[#0f1013] to-[#1d1f24]",
        "from-[#c0b392] to-[#ede4cf]",
        "from-[#2b313a] to-[#404959]",
      ],
      TEE_ICON,
    ),
  },
  {
    id: 8,
    name: "Baggy Cargo XL",
    subtitle: "Heavy Canvas 6-Pocket",
    category: "Pants",
    description:
      "Baggy Cargo XL là mẫu quần có volume mạnh nhất trong line-up hiện tại. Thiết kế hướng tới silhouette rộng, đổ nếp đẹp và cảm giác mặc có trọng lượng.",
    price: 699_000,
    rating: 4.7,
    reviewCount: 39,
    stockCount: 9,
    colors: [
      { name: "Washed Black", hex: "#1F1F1F", bgClass: "from-[#180e00] to-[#2a1800]" },
      { name: "Taupe", hex: "#8E7A63", bgClass: "from-[#3d2f22] to-[#614a35]" },
    ],
    sizes: makeSizes(["L", "XL", "XXL"]),
    specs: [
      { label: "Chất liệu", value: "Heavy Canvas" },
      { label: "Phom", value: "Baggy Fit" },
      { label: "Túi", value: "6 túi hộp" },
      { label: "Chi tiết", value: "Line cắt ống trước" },
    ],
    features: [
      "Volume lớn nhưng vẫn cân khi đi cùng top gọn",
      "Bề mặt vải tạo nếp đẹp khi chuyển động",
      "Phom rộng có chủ đích, không bị xệ",
      "Phù hợp với hoodie cropped hoặc tee boxy",
    ],
    images: makeImages(
      [
        "from-[#180e00] to-[#2a1800]",
        "from-[#1b1b1b] to-[#292929]",
        "from-[#3d2f22] to-[#614a35]",
        "from-[#242015] to-[#3e3522]",
      ],
      PANTS_ICON,
    ),
  },
  {
    id: 9,
    name: "NH Zip Hoodie",
    subtitle: "Full-Zip Fleece Lined",
    category: "Hoodie",
    description:
      "NH Zip Hoodie phù hợp với người thích outer layer linh hoạt hơn pullover. Khóa kéo hai chiều và form thẳng giúp chiếc áo hoạt động tốt cả khi mặc mở lẫn kéo kín.",
    price: 849_000,
    oldPrice: 999_000,
    tag: "SALE",
    tagVariant: "red",
    rating: 4.8,
    reviewCount: 52,
    stockCount: 6,
    colors: [
      { name: "Black", hex: "#111111", bgClass: "from-[#0d0d0d] to-[#1a1a1a]" },
      { name: "Graphite", hex: "#3A3A3A", bgClass: "from-[#1a1a1a] to-[#303030]" },
    ],
    sizes: makeSizes(["S", "M", "L", "XL"]),
    specs: [
      { label: "Chất liệu", value: "Fleece Lined" },
      { label: "Định lượng", value: "380 GSM" },
      { label: "Phom", value: "Straight Fit" },
      { label: "Khóa", value: "YKK 2 chiều" },
    ],
    features: [
      "Dễ dùng như áo khoác nhẹ hằng ngày",
      "Mặc mở vẫn giữ được shape tốt",
      "Tay áo đủ rộng để layer với tee dày",
      "Thêu logo nhỏ cùng dây kéo kim loại đen mờ",
    ],
    images: makeImages(
      [
        "from-[#0d0d0d] to-[#1a1a1a]",
        "from-[#181818] to-[#2a2a2a]",
        "from-[#101721] to-[#1c2838]",
        "from-[#252017] to-[#403624]",
      ],
      HOODIE_ICON,
    ),
  },
];

export const FEATURED_PRODUCT_IDS = [1, 2, 3, 4];

export const SHIPPING_THRESHOLD = 500_000;
export const SHIPPING_FEE = 30_000;

export function formatVnd(value: number): string {
  return Math.round(value).toLocaleString("vi-VN") + "đ";
}

export function formatCompactPrice(value: number): string {
  return `${Math.round(value / 1_000)}K`;
}

export function getShippingFee(subtotal: number, discount = 0): number {
  return subtotal - discount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function getVoucherByCode(code: string): Voucher | null {
  const normalized = code.trim().toUpperCase();
  return VOUCHERS.find((voucher) => voucher.code === normalized) ?? null;
}

// Map tra cứu O(1) thay vì linear scan O(n) mỗi lần gọi
const PRODUCTS_BY_ID = new Map<string, Product>(
  PRODUCTS.map((product) => [String(product.id), product]),
);

export function getProductById(id: string): Product | undefined {
  return PRODUCTS_BY_ID.get(id);
}

export function getFeaturedProducts(): Product[] {
  return FEATURED_PRODUCT_IDS
    .map((id) => PRODUCTS.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
}

export function getRelatedProducts(productId: number, limit = 4): Product[] {
  const current = PRODUCTS.find((product) => product.id === productId);
  if (!current) {
    return PRODUCTS.slice(0, limit);
  }

  const sameCategory = PRODUCTS.filter(
    (product) => product.category === current.category && product.id !== current.id,
  );
  const fallback = PRODUCTS.filter(
    (product) => product.category !== current.category && product.id !== current.id,
  );

  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getDefaultSize(product: Product): ProductSize | null {
  return product.sizes.find((size) => size.available)?.size ?? null;
}

export function getDefaultColor(product: Product): ProductColor {
  return product.colors[0];
}

export function getProductHref(productId: number): string {
  return `/product/${productId}`;
}

export function makeCartItemKey(
  productId: number,
  colorName: string,
  size: ProductSize,
): string {
  return `${productId}:${colorName}:${size}`;
}

export function getProductVariantLabel(colorName: string, size: ProductSize): string {
  return `${colorName} · Size ${size}`;
}

export function buildCartItem(
  product: Product,
  color: ProductColor,
  size: ProductSize,
  qty = 1,
): NewCartItem {
  const primaryImage = product.images[0];
  return {
    key: makeCartItemKey(product.id, color.name, size),
    productId: product.id,
    href: getProductHref(product.id),
    name: product.name,
    sub: getProductVariantLabel(color.name, size),
    price: product.price,
    qty,
    tag: product.tag,
    bgClass: color.bgClass,
    iconPath: primaryImage.iconPath,
    imageUrl: primaryImage.imageUrl,
    colorName: color.name,
    size,
  };
}
