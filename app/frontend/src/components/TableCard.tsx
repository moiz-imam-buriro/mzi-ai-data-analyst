import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Download } from 'lucide-react';
import type { AskResponse } from '@/types';
import { download, formatNumber, isNumeric, toCsv } from '@/lib/format';

interface Props {
  answer: AskResponse;
}

const MAX_ROWS = 100;

type SortDir = 'asc' | 'desc';

export function TableCard({ answer }: Props) {
  const { columns = [], rows = [] } = answer;
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const numericCols = useMemo(
    () =>
      columns.map((_, i) =>
        rows.slice(0, 50).some((r) => r[i] !== null && isNumeric(r[i]))
      ),
    [columns, rows]
  );

  const sorted = useMemo(() => {
    if (sortCol === null) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (numericCols[sortCol]) {
        return sortDir === 'asc'
          ? Number(av) - Number(bv)
          : Number(bv) - Number(av);
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortCol, sortDir, numericCols]);

  const shown = sorted.slice(0, MAX_ROWS);
  const capped = sorted.length > MAX_ROWS;

  const toggleSort = (i: number) => {
    if (sortCol === i) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(i);
      setSortDir('asc');
    }
  };

  const exportCsv = () => {
    download(`result.csv`, toCsv(columns, sorted));
  };

  return (
    <section
      className="fade-up rounded-[14px] border border-border bg-card hover:border-border-strong transition-colors"
      aria-label="Result table"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-[15px] font-semibold text-text">Result table</h3>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-muted tnum">
            {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="h-8 px-3 inline-flex items-center gap-1.5 text-[13px] text-text border border-border hover:border-border-strong hover:bg-raised rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>
      <div className="thin-scroll overflow-auto max-h-[460px]">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border-strong">
              {columns.map((c, i) => {
                const active = sortCol === i;
                return (
                  <th
                    key={i}
                    scope="col"
                    className="text-left font-medium text-muted px-4 py-2.5 whitespace-nowrap select-none cursor-pointer hover:text-text transition-colors"
                    onClick={() => toggleSort(i)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c}
                      {active ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-accent" aria-hidden />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-accent" aria-hidden />
                        )
                      ) : (
                        <ChevronDown
                          className="w-3 h-3 opacity-30"
                          aria-hidden
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-border last:border-0 hover:bg-raised/50 transition-colors"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-2.5 align-top ${
                      numericCols[ci]
                        ? 'text-right tnum text-text'
                        : 'text-left text-text'
                    } ${ci === 0 ? 'font-medium' : ''}`}
                  >
                    {numericCols[ci]
                      ? formatNumber(
                          cell === null || cell === undefined ? null : Number(cell)
                        )
                      : cell === null || cell === undefined
                      ? ''
                      : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {capped && (
        <div className="px-6 py-3 border-t border-border text-[13px] text-muted">
          Showing first {MAX_ROWS} rows
        </div>
      )}
    </section>
  );
}
