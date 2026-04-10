import "server-only";

export interface VietnamAddressOption {
  code: number;
  name: string;
}

interface ProvinceDetailResponse {
  districts?: VietnamAddressOption[];
}

interface DistrictDetailResponse {
  wards?: VietnamAddressOption[];
}

const VIETNAM_PROVINCES_API_BASE = "https://provinces.open-api.vn/api/v1";

async function requestJson<T>(path: string, query?: Record<string, string | number>) {
  const url = new URL(`${VIETNAM_PROVINCES_API_BASE}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Vietnam Provinces API failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function uniqueOptions(options: VietnamAddressOption[]) {
  const seen = new Set<number>();

  return options.filter((option) => {
    if (seen.has(option.code)) {
      return false;
    }

    seen.add(option.code);
    return true;
  });
}

export async function getProvinceOptions(query: string) {
  const trimmedQuery = query.trim();

  const options = trimmedQuery
    ? await requestJson<VietnamAddressOption[]>("/p/search/", { q: trimmedQuery })
    : await requestJson<VietnamAddressOption[]>("/p/");

  return uniqueOptions(options);
}

export async function getDistrictOptions(args: {
  query: string;
  provinceCode?: number | null;
}) {
  const trimmedQuery = args.query.trim();

  if (!trimmedQuery && !args.provinceCode) {
    return [] as VietnamAddressOption[];
  }

  if (!trimmedQuery && args.provinceCode) {
    const province = await requestJson<ProvinceDetailResponse>(
      `/p/${args.provinceCode}`,
      { depth: 2 },
    );

    return uniqueOptions(province.districts ?? []);
  }

  const query: Record<string, string | number> = {
    q: trimmedQuery,
  };

  if (args.provinceCode) {
    query.p = args.provinceCode;
  }

  return uniqueOptions(await requestJson<VietnamAddressOption[]>("/d/search/", query));
}

export async function getWardOptions(args: {
  query: string;
  provinceCode?: number | null;
  districtCode?: number | null;
}) {
  const trimmedQuery = args.query.trim();

  if (!trimmedQuery && !args.districtCode) {
    return [] as VietnamAddressOption[];
  }

  if (!trimmedQuery && args.districtCode) {
    const district = await requestJson<DistrictDetailResponse>(
      `/d/${args.districtCode}`,
      { depth: 2 },
    );

    return uniqueOptions(district.wards ?? []);
  }

  const query: Record<string, string | number> = {
    q: trimmedQuery,
  };

  if (args.districtCode) {
    query.d = args.districtCode;
  } else if (args.provinceCode) {
    query.p = args.provinceCode;
  }

  return uniqueOptions(await requestJson<VietnamAddressOption[]>("/w/search/", query));
}
