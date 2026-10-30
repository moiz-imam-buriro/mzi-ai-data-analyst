import { Files, Moon, Sun } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { ServerStatus } from '@/types';

interface Props {
  status: ServerStatus;
  reason: string;
  fileCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenFiles: () => void;
}

export function Header({
  status,
  reason,
  fileCount,
  theme,
  onToggleTheme,
  onOpenFiles,
}: Props) {
  return (
    <header
      className="fade-up sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-border"
      style={{ animationDelay: '0ms' }}
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[20px] font-semibold tracking-[-0.02em] text-text">
            MZI
          </span>
          <span className="w-px h-5 bg-border-strong" aria-hidden />
          <span className="text-[14px] text-muted hidden sm:inline">
            AI Data Analyst
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <StatusBadge status={status} reason={reason} />
          </div>
          <button
            type="button"
            onClick={onOpenFiles}
            className="h-9 px-3 inline-flex items-center gap-2 text-[13px] text-text border border-border hover:border-border-strong hover:bg-raised rounded-md transition-colors"
          >
            <Files className="w-4 h-4" aria-hidden />
            <span>
              Files<span className="text-muted"> ({fileCount})</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className="w-9 h-9 inline-flex items-center justify-center border border-border hover:border-border-strong hover:bg-raised rounded-md transition-colors"
            style={{
              transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)',
              transition:
                'transform 350ms cubic-bezier(0.22,1,0.36,1), background-color 200ms, border-color 200ms',
            }}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden />
            ) : (
              <Moon className="w-4 h-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
