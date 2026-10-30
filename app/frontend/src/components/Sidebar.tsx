import { FileText, ListChecks, Upload } from 'lucide-react';
import { UploadBox } from './UploadBox';
import { UploadResults } from './UploadResults';
import type { FileInfo, UploadResult } from '@/types';

interface Props {
  files: FileInfo[];
  totalRows: number;
  uploadResults: UploadResult[];
  onUpload: (files: File[]) => void;
  onViewAll: () => void;
}

export function Sidebar({
  files,
  totalRows,
  uploadResults,
  onUpload,
  onViewAll,
}: Props) {
  const names = files.map((f) => f.name);
  return (
    <aside className="space-y-6" style={{ animationDelay: '60ms' }}>
      <section
        className="fade-up rounded-[14px] border border-border bg-card hover:border-border-strong transition-colors p-6"
        aria-label="Your data"
      >
        <h2 className="text-[15px] font-semibold text-text mb-4">Your data</h2>
        <UploadBox onFiles={onUpload} existingNames={names} />
        <UploadResults results={uploadResults} />
        <div className="mt-4 flex items-center gap-4 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" aria-hidden />
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
          <span className="inline-flex items-center gap-1.5 tnum">
            <ListChecks className="w-3.5 h-3.5" aria-hidden />
            {totalRows.toLocaleString('en-US')} rows
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 w-full h-9 inline-flex items-center justify-center gap-2 text-[13px] text-text border border-border hover:border-border-strong hover:bg-raised rounded-md transition-colors"
        >
          <Upload className="w-4 h-4" aria-hidden />
          View all files
        </button>
      </section>
    </aside>
  );
}