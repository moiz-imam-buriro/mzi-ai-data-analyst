const NBSP = '\u00a0';

export function formatNumber(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const n = typeof v === 'number' ? v : Number(v);
  if (!isFinite(n)) return String(v);
  const abs = Math.abs(n);
  const fraction = abs >= 1 ? 2 : 4;
  const s = n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fraction,
  });
  return s.replace(/ /g, NBSP);
}

export function isNumeric(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return typeof v === 'number' || (!Number.isNaN(n) && v !== '');
}

export function formatAxisNumber(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e12) return (v / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2);
}

export function formatTooltip(v: number): string {
  if (!isFinite(v)) return String(v);
  return v.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

export function formatDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toCsv(
  columns: string[],
  rows: (string | number | null)[][]
): string {
  const esc = (v: string | number | null) => {
    if (v === null) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [columns.map(esc).join(',')];
  for (const r of rows) lines.push(r.map(esc).join(','));
  return lines.join('\n');
}

export function download(filename: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
