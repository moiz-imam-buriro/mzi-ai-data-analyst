import { useMemo, useState } from 'react';
import { ChevronDown, Copy } from 'lucide-react';
import { useToast } from '@/lib/useToast';

interface Props {
  sql: string;
}

const KEYWORDS =
  /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|AS|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|ASC|DESC|LIMIT|OFFSET|UNION|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|COUNT|SUM|AVG|MIN|MAX|ROUND|CAST|COALESCE)\b/gi;

export function SqlCard({ sql }: Props) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const highlighted = useMemo(() => {
    return sql.replace(KEYWORDS, (m) => `§${m}§`);
  }, [sql]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      show('SQL copied');
    } catch {
      show('Copy failed');
    }
  };

  return (
    <section className="fade-up rounded-[14px] border border-border bg-card hover:border-border-strong transition-colors">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-text">View SQL</span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1">
          <div className="relative rounded-[10px] border border-border bg-page p-4 overflow-auto thin-scroll">
            <pre className="font-mono text-[13px] leading-relaxed text-text whitespace-pre-wrap break-words pr-10">
              {highlighted.split(/§/).map((part, i) =>
                i % 2 === 1 ? (
                  <span key={i} className="text-accent font-medium">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </pre>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy SQL"
              title="Copy SQL"
              className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center border border-border rounded-md hover:border-border-strong hover:bg-raised transition-colors text-muted hover:text-text"
            >
              <Copy className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
