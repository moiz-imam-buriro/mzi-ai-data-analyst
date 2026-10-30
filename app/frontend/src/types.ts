export type ServerStatus = 'online' | 'offline' | 'unknown';

export interface FileInfo {
  id: number;
  name: string;
  rows: number;
  columns: string[];
  uploaded_at: string;
}

export interface UploadResult {
  file: string;
  status: 'saved' | 'failed';
  rows?: number;
  columns?: string[];
  preview?: unknown[][];
  error?: string;
}

export interface UploadResponse {
  results: UploadResult[];
}

export interface ChartSpec {
  type: 'bar' | 'line' | null;
  x: string;
  y: string;
}

export interface AskResponse {
  question?: string;
  sql?: string;
  columns?: string[];
  rows?: (string | number | null)[][];
  chart?: ChartSpec;
  summary?: string;
  error?: string;
}

export interface RecentQuestion {
  question: string;
  ts: number;
}

export interface ApiError {
  message: string;
  technical?: string;
  status?: number;
  timeout?: boolean;
  offline?: boolean;
}
