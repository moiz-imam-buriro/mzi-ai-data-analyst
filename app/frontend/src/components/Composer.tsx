import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Send } from 'lucide-react';

const EXAMPLES = [
  'Total sales by channel',
  'Top 5 customers by total sales',
  'Which state has the highest total sales?',
];

interface Props {
  hasFiles: boolean;
  loading: boolean;
  onAsk: (q: string) => void;
  onOpenFiles: () => void;
  firstQuestion: boolean;
}

export function Composer({
  hasFiles,
  loading,
  onAsk,
  onOpenFiles,
  firstQuestion,
}: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && ref.current) {
      const el = ref.current;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [value, loading]);

  const submit = () => {
    const q = value.trim();
    if (!q || loading) return;
    if (!hasFiles) {
      onOpenFiles();
      return;
    }
    onAsk(q);
  };

  return (
    <div className="fade-up" style={{ animationDelay: '90ms' }}>
      {firstQuestion && (
        <>
          <h1
            className="text-text mb-3"
            style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            Ask your data anything.
          </h1>
          <p className="text-[15px] text-muted mb-6">
            Type a question in plain English. I&apos;ll turn it into SQL, run it
            and summarise the result.
          </p>
          {hasFiles && (
            <div className="flex flex-wrap gap-2 mb-5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setValue(ex);
                    ref.current?.focus();
                  }}
                  className="h-8 px-3 text-[13px] text-muted hover:text-text border border-border rounded-full transition-colors hover:border-border-strong"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="rounded-[14px] border border-border bg-card p-3 hover:border-border-strong focus-within:border-border-strong transition-colors">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Ask a question about your data…"
          disabled={loading}
          className="w-full bg-transparent text-[15px] text-text placeholder:text-muted resize-none outline-none px-2 py-1.5 disabled:opacity-60"
          aria-label="Question"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-[12px] text-muted inline-flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" aria-hidden />
            Ctrl + Enter
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !value.trim()}
            className="h-9 px-4 inline-flex items-center gap-2 text-[14px] font-medium bg-accent text-on-accent hover:bg-accent-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" aria-hidden />
            Ask
          </button>
        </div>
      </div>

      {!hasFiles && (
        <p className="text-[13px] text-muted mt-3">
          Upload a file to get started.
        </p>
      )}
    </div>
  );
}
