interface SupabasePublicEnv {
  url: string;
  publishableKey: string;
}

interface SupabaseAdminEnv extends SupabasePublicEnv {
  serviceRoleKey: string;
}

function readValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = readValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey =
    readValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    readValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv | null {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = readValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!publicEnv || !serviceRoleKey) {
    return null;
  }

  return {
    ...publicEnv,
    serviceRoleKey,
  };
}

export function hasSupabasePublicEnv(): boolean {
  return Boolean(getSupabasePublicEnv());
}

export function hasSupabaseAdminEnv(): boolean {
  return Boolean(getSupabaseAdminEnv());
}
