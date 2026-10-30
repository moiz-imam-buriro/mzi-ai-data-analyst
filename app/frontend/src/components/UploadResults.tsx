import { Download, Trash2 } from 'lucide-react';
import type { UploadResult } from '@/types';

interface Props {
  results: UploadResult[];
}

export function UploadResults({ results }: Props) {
  if (!results.length) return null;
  return (
    <ul className="mt-3 space-y-1.5 fade-up">
      {results.map((r, i) => {
        const ok = r.status === 'saved';
        return (
          <li
            key={`${r.file}-${i}`}
            className="flex items-start gap-2 text-[13px] px-3 py-2 rounded-md bg-raised/60 border border-border"
          >
            {ok ? (
              <Download className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" aria-hidden />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mt-0.5 text-error shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-text truncate">{r.file}</p>
              <p className={ok ? 'text-muted' : 'text-error'}>
                {ok
                  ? `Saved · ${r.rows ?? 0} rows`
                  : `Failed — ${r.error || 'unknown error'}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
