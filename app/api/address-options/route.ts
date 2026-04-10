import { NextRequest, NextResponse } from "next/server";
import {
  getDistrictOptions,
  getProvinceOptions,
  getWardOptions,
} from "@/lib/integrations/vietnam-provinces";

type AddressOptionKind = "province" | "district" | "ward";

function parseCode(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseKind(value: string | null): AddressOptionKind | null {
  if (value === "province" || value === "district" || value === "ward") {
    return value;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Invalid address option kind." }, { status: 400 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const provinceCode = parseCode(request.nextUrl.searchParams.get("provinceCode"));
  const districtCode = parseCode(request.nextUrl.searchParams.get("districtCode"));

  try {
    const options =
      kind === "province"
        ? await getProvinceOptions(query)
        : kind === "district"
          ? await getDistrictOptions({ query, provinceCode })
          : await getWardOptions({ query, provinceCode, districtCode });

    return NextResponse.json({ options });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load Vietnam address options.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
