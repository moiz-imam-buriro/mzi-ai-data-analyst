import { AlertCircle, RotateCw } from 'lucide-react';
import type { ApiError } from '@/types';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  error: ApiError;
  onRetry?: () => void;
  hint?: string;
}

export function ErrorNotice({ error, onRetry, hint }: Props) {
  const [showTech, setShowTech] = useState(false);
  return (
    <div
      className="fade-up rounded-[14px] border border-error/60 bg-card p-5"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-text">{error.message}</p>
          {hint && <p className="text-[13px] text-muted mt-1.5">{hint}</p>}
          {error.technical && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowTech((s) => !s)}
                className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-text transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showTech ? 'rotate-180' : ''}`}
                  aria-hidden
                />
                Technical details
              </button>
              {showTech && (
                <pre className="mt-2 font-mono text-[12px] text-muted whitespace-pre-wrap break-words">
                  {error.technical}
                </pre>
              )}
            </div>
          )}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="h-8 px-3 inline-flex items-center gap-1.5 text-[13px] text-text border border-border hover:border-border-strong hover:bg-raised rounded-md transition-colors shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
