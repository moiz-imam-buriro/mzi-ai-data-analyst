import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const ACCEPT = '.csv,.xlsx,.xls';
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = /\.(csv|xlsx|xls)$/i;

interface Props {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  disabled?: boolean;
  existingNames?: string[];
}

export function UploadBox({
  onFiles,
  compact = false,
  disabled = false,
  existingNames = [],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const accept = (fileList: FileList | File[] | null) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);

    const tooBig = files.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      alert(
        `${tooBig.name} is ${(tooBig.size / 1024 / 1024).toFixed(1)} MB. The maximum is 20 MB per file.`
      );
      return;
    }
    const wrongExt = files.find((f) => !ALLOWED.test(f.name));
    if (wrongExt) {
      alert(`${wrongExt.name} is not a supported file type. Use .csv, .xlsx or .xls.`);
      return;
    }
    const dupes = files.filter((f) =>
      existingNames.some((n) => n.toLowerCase() === f.name.toLowerCase())
    );
    if (dupes.length) {
      const ok = window.confirm(
        dupes.length === 1
          ? `A file named "${dupes[0].name}" already exists. Upload it anyway? This will create a duplicate.`
          : `Some files already exist (${dupes
              .map((f) => f.name)
              .join(', ')}). Upload them anyway? This will create duplicates.`
      );
      if (!ok) return;
    }
    onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!disabled) accept(e.dataTransfer.files);
      }}
      className={`relative rounded-[14px] border border-dashed ${
        drag ? 'border-accent bg-accent-wash' : 'border-border-strong'
      } ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-border-strong cursor-pointer'} transition-colors`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV or Excel files"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.currentTarget.value = '';
        }}
      />
      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? 'py-5 px-4' : 'py-7 px-4'
        }`}
      >
        <Upload className="w-5 h-5 text-muted mb-2" aria-hidden />
        <p className="text-[13px] text-text">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-[12px] text-muted mt-1">
          CSV, XLSX or XLS · up to 20 MB each
        </p>
      </div>
    </div>
  );
}
