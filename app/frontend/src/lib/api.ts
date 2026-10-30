import type {
  ApiError,
  AskResponse,
  FileInfo,
  UploadResponse,
} from '@/types';

const envUrl = import.meta.env.VITE_API_URL as string | undefined;
const rawUrl = envUrl === undefined ? 'http://127.0.0.1:8000' : envUrl;

// "same-origin" means: call the same server that served this page
export const API_URL = (rawUrl === 'same-origin' ? '' : rawUrl).replace(/\/$/, '');
const SERVER_LABEL = API_URL || window.location.origin;

type StatusListener = (online: boolean, reason: string) => void;
let statusListener: StatusListener | null = null;

export function setServerStatusListener(fn: StatusListener | null) {
  statusListener = fn;
}

export interface HealthResponse {
  status: string;
}

function join422(detail: unknown): string {
  if (Array.isArray(detail)) {
    const msgs = (detail as { msg?: string }[])
      .map((d) => d.msg)
      .filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  if (typeof detail === 'string') return detail;
  return 'Unexpected response from the server.';
}

async function readBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { detail: text };
  }
}

class TimeoutError extends Error {
  constructor() {
    super('The server took too long to respond.');
  }
}

function withTimeout(ms: number, signal?: AbortSignal | null) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  const clear = () => clearTimeout(timer);
  return { signal: ctrl.signal, clear };
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 120000, signal: outerSignal, ...rest } = init;
  const { signal, clear } = withTimeout(timeoutMs, outerSignal);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...rest, signal });
  } catch (err) {
    clear();
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (outerSignal?.aborted) {
        throw {
          message: 'Request cancelled.',
        } as ApiError;
      }
      throw {
        message: 'The server took too long to respond.',
        timeout: true,
      } as ApiError;
    }
    if (err instanceof TypeError) {
      const offline = !navigator.onLine;
      const message = offline
        ? 'You appear to be offline. Check your internet connection.'
        : `Cannot reach the server at ${SERVER_LABEL}. Check that the backend is running and that you are connected to the internet.`;
      if (path !== '/health') statusListener?.(false, message);
      throw { message, technical: String(err), offline } as ApiError;
    }
    throw { message: String(err) } as ApiError;
  }
  clear();
  if (path !== '/health') statusListener?.(true, '');

  if (res.status === 204) return {} as T;
  const body = await readBody(res);

  if (!res.ok) {
    if (res.status === 503) {
      const detail =
        typeof body.detail === 'string' ? body.detail : 'Service unavailable.';
      throw {
        message: `503 — ${detail}`,
        status: 503,
        technical: detail,
      } as ApiError;
    }
    if (res.status === 404) {
      const detail =
        typeof body.detail === 'string' ? body.detail : 'Not found.';
      throw { message: `404 — ${detail}`, status: 404 } as ApiError;
    }
    const detail = body.detail;
    const message = detail
      ? `${res.status} — ${join422(detail)}`
      : `${res.status} — Request failed.`;
    throw { message, status: res.status, technical: detail as string } as ApiError;
  }

  return body as unknown as T;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { timeoutMs: 10000, signal });
}

export async function getFiles(signal?: AbortSignal): Promise<FileInfo[]> {
  const data = await request<{ files: FileInfo[] }>('/files', {
    timeoutMs: 30000,
    signal,
  });
  return data.files ?? [];
}

export async function uploadFiles(
  files: File[],
  signal?: AbortSignal
): Promise<UploadResponse> {
  const form = new FormData();
  for (const f of files) form.append('files', f, f.name);
  return request<UploadResponse>('/upload', {
    method: 'POST',
    body: form,
    timeoutMs: 120000,
    signal,
  });
}

export async function deleteFile(id: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/files/${id}`, {
    method: 'DELETE',
    timeoutMs: 30000,
  });
}

export async function askQuestion(
  question: string,
  signal?: AbortSignal
): Promise<AskResponse> {
  return request<AskResponse>('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    timeoutMs: 60000,
    signal,
  });
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'message' in e;
}

export function asApiError(e: unknown): ApiError {
  if (isApiError(e)) return e;
  if (e instanceof Error) return { message: e.message, technical: String(e) };
  return { message: String(e) };
}