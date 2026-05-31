type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const env = (import.meta as ViteImportMeta).env || {};

export const supabaseConfig = {
  url: env.VITE_SUPABASE_URL || '',
  anonKey: env.VITE_SUPABASE_ANON_KEY || '',
  backendMode: env.VITE_BACKEND_MODE || 'local',
};

export const isSupabaseConfigured = () => (
  supabaseConfig.backendMode === 'supabase'
  && supabaseConfig.url.length > 0
  && supabaseConfig.anonKey.length > 0
);

interface SupabaseRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  accessToken?: string;
  body?: Record<string, unknown>;
  prefer?: string;
}

const getSupabaseErrorMessage = (text: string) => {
  if (!text) return '';
  try {
    const parsed = JSON.parse(text) as { msg?: string; message?: string; error_description?: string; error?: string };
    return parsed.msg || parsed.message || parsed.error_description || parsed.error || text;
  } catch {
    return text;
  }
};

const headers = (accessToken?: string, prefer?: string) => ({
  apikey: supabaseConfig.anonKey,
  Authorization: `Bearer ${accessToken || supabaseConfig.anonKey}`,
  'Content-Type': 'application/json',
  ...(prefer ? { Prefer: prefer } : {}),
});

export async function supabaseRest<T>(
  path: string,
  { method = 'GET', accessToken, body, prefer }: SupabaseRequestOptions = {}
): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet.');
  }

  const response = await fetch(`${supabaseConfig.url}${path}`, {
    method,
    headers: headers(accessToken, prefer),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(getSupabaseErrorMessage(message) || `Supabase request failed with ${response.status}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function supabaseRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<T> {
  return supabaseRest<T>(`/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    accessToken,
    body,
  });
}

export async function supabaseSignUp(
  email: string,
  password: string,
  metadata: Record<string, unknown>
) {
  return supabaseRest<{
    access_token?: string;
    user?: { id: string; email?: string };
  }>('/auth/v1/signup', {
    method: 'POST',
    body: {
      email,
      password,
      data: metadata,
    },
  });
}

export async function supabaseLogIn(email: string, password: string) {
  return supabaseRest<{
    access_token: string;
    refresh_token: string;
    user: { id: string; email?: string };
  }>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
}

export async function supabaseUpdatePassword(accessToken: string, password: string) {
  return supabaseRest<{ user: { id: string; email?: string } }>('/auth/v1/user', {
    method: 'PATCH',
    accessToken,
    body: { password },
  });
}

export async function supabaseResetPasswordWithRecovery(
  email: string,
  recoveryAnswerDigest: string,
  password: string
) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet.');
  }

  const response = await fetch(`${supabaseConfig.url}/functions/v1/reset-password-with-recovery`, {
    method: 'POST',
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, recoveryAnswerDigest, password }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not reset password.');
  }

  return response.json() as Promise<{ ok: boolean }>;
}
