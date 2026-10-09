/**
 * Thin typed fetch wrapper for the Kartwerkz API (NestJS, REST, cookie
 * session auth). Prefixes every call with NEXT_PUBLIC_API_URL and always
 * sends credentials so the session/guest-session cookie rides along.
 *
 * This client is written purely against the documented REST contract
 * (see apps/storefront task spec) — it does not require the API to be
 * running to typecheck or build. Callers (api-client hooks, server
 * components) are responsible for handling network failures gracefully
 * since the API may not be up in every environment.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    // Documented default from .env.example — kept as a fallback so the
    // client still works in environments where the env var wasn't wired
    // through (e.g. a quick local script), but production deployments
    // should always set NEXT_PUBLIC_API_URL explicitly.
    return 'http://localhost:4000/api/v1';
  }
  return url.replace(/\/$/, '');
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Set to skip JSON-encoding `body` (e.g. for FormData uploads). */
  rawBody?: boolean;
  /** Query string params, appended to the path. */
  searchParams?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, searchParams?: ApiFetchOptions['searchParams']): string {
  const url = new URL(`${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Perform a request against the API. Throws `ApiError` on any non-2xx
 * response. Returns `undefined` for 204 No Content responses.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, rawBody, searchParams, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(rawBody ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: rawBody
      ? (body as BodyInit | undefined)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  };

  const response = await fetch(buildUrl(path, searchParams), init);

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const parsed = contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(response.status, parsed, typeof parsed === 'string' ? parsed : undefined);
  }

  return parsed as T;
}
