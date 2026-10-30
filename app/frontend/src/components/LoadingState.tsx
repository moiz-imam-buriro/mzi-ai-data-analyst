import { useEffect, useState } from 'react';

const MESSAGES = [
  'Reading your tables',
  'Writing the SQL',
  'Running the query',
  'Summarising',
];

interface Props {
  onCancel: () => void;
}

export function LoadingState({ onCancel }: Props) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-6 fade-up" aria-live="polite" aria-busy="true">
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="skeleton h-4 w-2/3 rounded mb-3" />
        <div className="skeleton h-4 w-1/2 rounded mb-3" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <p className="mt-4 text-[13px] text-muted inline-flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border-2 border-muted border-t-transparent inline-block"
            style={{ animation: 'mzi-spin 0.8s linear infinite' }}
            aria-hidden
          />
          {MESSAGES[i]}…
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 h-8 px-3 text-[13px] text-muted hover:text-text border border-border hover:border-border-strong rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
