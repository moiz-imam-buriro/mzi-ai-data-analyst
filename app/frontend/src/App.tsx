import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Workspace } from '@/components/Workspace';
import { FilesPopup } from '@/components/FilesPopup';
import { useTheme } from '@/lib/useTheme';
import { useServerStatus } from '@/lib/useServerStatus';
import { useToast } from '@/lib/useToast';
import {
  asApiError,
  askQuestion,
  getFiles,
  uploadFiles,
} from '@/lib/api';
import type {
  ApiError,
  AskResponse,
  FileInfo,
  UploadResult,
} from '@/types';

export default function App() {
  const { theme, toggle } = useTheme();
  const { show } = useToast();

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const list = await getFiles();
      setFiles(list);
    } catch {
      /* keep stale; status badge will reflect */
    }
  }, []);

  const { status, reason } = useServerStatus(refreshFiles);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const totalRows = files.reduce((s, f) => s + f.rows, 0);

  const handleUpload = useCallback(
    async (toUpload: File[]) => {
      try {
        const res = await uploadFiles(toUpload);
        setUploadResults(res.results ?? []);
        const anySaved = (res.results ?? []).some((r) => r.status === 'saved');
        if (anySaved) show('Upload complete');
        await refreshFiles();
      } catch (e) {
        const err = asApiError(e);
        setUploadResults(
          toUpload.map((f) => ({
            file: f.name,
            status: 'failed',
            error: err.message,
          }))
        );
      }
    },
    [refreshFiles, show]
  );

  const runAsk = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setLastQuestion(q);
    try {
      const res = await askQuestion(q, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setLoading(false);
      setAnswer(res);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const err = asApiError(e);
      setLoading(false);
      if (err.message === 'Request cancelled.') {
        return;
      }
      setError(err);
    }
  }, []);

  const handleAsk = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      if (files.length === 0) {
        setPopupOpen(true);
        return;
      }
      runAsk(trimmed);
    },
    [files.length, runAsk]
  );

  const handleCancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (lastQuestion) runAsk(lastQuestion);
  }, [lastQuestion, runAsk]);

  const handlePopupDeleted = useCallback(async () => {
    await refreshFiles();
  }, [refreshFiles]);

  return (
    <div className="min-h-screen bg-page text-text flex flex-col">
      <Header
        status={status}
        reason={reason}
        fileCount={files.length}
        theme={theme}
        onToggleTheme={toggle}
        onOpenFiles={() => setPopupOpen(true)}
      />

      <div
        className="flex-1 mx-auto w-full max-w-[1200px] px-5 sm:px-6 pt-6 pb-20"
        style={{ paddingBottom: '88px' }}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[340px] shrink-0">
            <Sidebar
              files={files}
              totalRows={totalRows}
              uploadResults={uploadResults}
              onUpload={handleUpload}
              onViewAll={() => setPopupOpen(true)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <Workspace
              files={files}
              loading={loading}
              error={error}
              answer={answer}
              firstQuestion={!answer && !error && !loading}
              onAsk={handleAsk}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onOpenFiles={() => setPopupOpen(true)}
            />
          </div>
        </div>
      </div>

      <Footer />

      <FilesPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        files={files}
        totalRows={totalRows}
        onUpload={handleUpload}
        onDeleted={handlePopupDeleted}
      />
    </div>
  );
}