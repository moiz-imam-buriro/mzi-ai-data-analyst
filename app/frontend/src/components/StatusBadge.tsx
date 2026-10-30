import { ServerOff } from 'lucide-react';
import type { ServerStatus } from '@/types';

interface Props {
  status: ServerStatus;
  reason: string;
}

export function StatusBadge({ status, reason }: Props) {
  const dotColor =
    status === 'online'
      ? 'bg-success'
      : status === 'offline'
      ? 'bg-error'
      : 'bg-muted';
  const label =
    status === 'online'
      ? 'Server online'
      : status === 'offline'
      ? 'Server offline'
      : 'Checking server…';

  return (
    <button
      type="button"
      title={status === 'offline' ? reason : undefined}
      className="flex items-center gap-2 text-[13px] text-muted hover:text-text transition-colors px-2 py-1 rounded-md"
      aria-live="polite"
    >
      {status === 'offline' ? (
        <ServerOff className="w-3.5 h-3.5 text-error" aria-hidden />
      ) : (
        <span
          className={`w-2 h-2 rounded-full ${dotColor} ${
            status === 'online' ? 'pulse-dot' : ''
          }`}
          aria-hidden
        />
      )}
      <span>{label}</span>
    </button>
  );
}
