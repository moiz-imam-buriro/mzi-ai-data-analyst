import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Trash2, X } from 'lucide-react';
import { UploadBox } from './UploadBox';
import { useToast } from '@/lib/useToast';
import type { FileInfo } from '@/types';
import { deleteFile } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  files: FileInfo[];
  totalRows: number;
  onUpload: (files: File[]) => void;
  onDeleted: () => void;
}

type SortKey = 'name' | 'rows' | 'newest';
const PAGE_SIZE = 50;
const HARD_LIMIT = 200;

export function FilesPopup({
  open,
  onClose,
  files,
  totalRows,
  onUpload,
  onDeleted,
}: Props) {
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setExpanded(new Set());
      setQuery('');
      setPage(0);
      setBulkErrors([]);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = files;
    if (q) {
      list = files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.columns.some((c) => c.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === 'name')
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'rows') sorted.sort((a, b) => b.rows - a.rows);
    else
      sorted.sort(
        (a, b) =>
          new Date(b.uploaded_at.replace(' ', 'T')).getTime() -
          new Date(a.uploaded_at.replace(' ', 'T')).getTime()
      );
    return sorted;
  }, [files, query, sort]);

  const paged =
    filtered.length > HARD_LIMIT
      ? filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      : filtered;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const confirmDeleteOne = async (f: FileInfo) => {
    setDeleting(f.id);
    try {
      await deleteFile(f.id);
      show(`Deleted ${f.name}`);
      onDeleted();
    } catch (e) {
      const err = e as { message?: string };
      setBulkErrors([`${f.name}: ${err.message || 'Delete failed'}`]);
    } finally {
      setDeleting(null);
    }
  };

  const deleteSelected = async () => {
    const targets = files.filter((f) => selected.has(f.id));
    const errs: string[] = [];
    for (const f of targets) {
      try {
        await deleteFile(f.id);
      } catch (e) {
        const err = e as { message?: string };
        errs.push(`${f.name}: ${err.message || 'Delete failed'}`);
      }
    }
    setSelected(new Set());
    setBulkErrors(errs);
    onDeleted();
    if (errs.length === 0) show(`Deleted ${targets.length} files`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Your files"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md fade-up"
        style={{ animationDuration: '200ms' }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="pop-in relative bg-card border border-border-strong rounded-[16px] flex flex-col overflow-hidden"
        style={{ width: '80vw', height: '80vh', maxWidth: '1200px' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-text">Your files</h2>
            <span className="text-[13px] text-muted">
              {files.length} {files.length === 1 ? 'file' : 'files'} ·{' '}
              {totalRows.toLocaleString('en-US')} rows
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 inline-flex items-center justify-center border border-border rounded-md hover:border-border-strong hover:bg-raised transition-colors text-muted hover:text-text"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        {/* upload */}
        <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <UploadBox
            onFiles={onUpload}
            compact
            existingNames={files.map((f) => f.name)}
          />
        </div>

        {/* toolbar */}
        <div className="px-6 py-3 border-b border-border shrink-0 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search by file or column name"
              className="w-full h-9 pl-9 pr-3 text-[13px] text-text bg-raised border border-border rounded-md outline-none focus:border-border-strong"
              aria-label="Search files"
            />
          </div>
          <label className="text-[13px] text-muted inline-flex items-center gap-2">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 px-2 text-[13px] text-text bg-raised border border-border rounded-md outline-none focus:border-border-strong"
              aria-label="Sort files"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="rows">Rows</option>
            </select>
          </label>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="h-9 px-3 inline-flex items-center gap-1.5 text-[13px] text-error border border-error/40 hover:bg-error/10 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
              Delete selected ({selected.size})
            </button>
          )}
        </div>

        {/* list */}
        <div className="thin-scroll overflow-auto flex-1">
          {filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center p-10 text-center">
              <p className="text-[14px] text-muted">
                {files.length === 0
                  ? 'No files yet'
                  : 'No files match your search'}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border-strong text-left text-muted">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={
                        paged.length > 0 && paged.every((f) => selected.has(f.id))
                      }
                      onChange={(e) => {
                        setSelected((s) => {
                          const n = new Set(s);
                          if (e.target.checked)
                            paged.forEach((f) => n.add(f.id));
                          else paged.forEach((f) => n.delete(f.id));
                          return n;
                        });
                      }}
                      className="accent-accent"
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium text-right">Rows</th>
                  <th className="px-4 py-2.5 font-medium text-right">Columns</th>
                  <th className="px-4 py-2.5 font-medium">Uploaded</th>
                  <th className="w-10 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((f) => {
                  const isOpen = expanded.has(f.id);
                  const isSel = selected.has(f.id);
                  return (
                    <Fragment key={f.id}>
                      <tr
                        className="border-b border-border last:border-0 hover:bg-raised/50 transition-colors cursor-pointer"
                        onClick={() =>
                          setExpanded((s) => {
                            const n = new Set(s);
                            if (n.has(f.id)) n.delete(f.id);
                            else n.add(f.id);
                            return n;
                          })
                        }
                      >
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleSelect(f.id)}
                            aria-label={`Select ${f.name}`}
                            className="accent-accent"
                          />
                        </td>
                        <td className="px-4 py-3 text-text font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {f.name}
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-muted transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden
                            />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tnum text-text">
                          {f.rows.toLocaleString('en-US')}
                        </td>
                        <td className="px-4 py-3 text-right tnum text-muted">
                          {f.columns.length}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatDate(f.uploaded_at)}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Delete ${f.name}`}
                            title="Delete"
                            onClick={() => confirmDeleteOne(f)}
                            disabled={deleting === f.id}
                            className="w-8 h-8 inline-flex items-center justify-center text-muted hover:text-error border border-transparent hover:border-error/40 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-border">
                          <td colSpan={6} className="px-4 py-3 bg-raised/40">
                            <div className="font-mono text-[12px] text-muted flex flex-wrap gap-x-3 gap-y-1">
                              {f.columns.map((c, i) => (
                                <span key={i}>{c}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* bulk errors */}
        {bulkErrors.length > 0 && (
          <div className="px-6 py-3 border-t border-error/40 bg-error/5 text-[13px] text-error">
            <p className="font-medium mb-1">Some deletions failed:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {bulkErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* pagination */}
        {filtered.length > HARD_LIMIT && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-[13px] text-muted shrink-0">
            <span>
              Page {page + 1} of {totalPages} · {filtered.length} files
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 px-3 border border-border rounded-md hover:border-border-strong disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="h-8 px-3 border border-border rounded-md hover:border-border-strong disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
