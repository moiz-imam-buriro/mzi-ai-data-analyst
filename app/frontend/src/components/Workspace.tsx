import { Composer } from './Composer';
import { AnswerView } from './AnswerView';
import type { ApiError, AskResponse, FileInfo } from '@/types';

interface Props {
  files: FileInfo[];
  loading: boolean;
  error: ApiError | null;
  answer: AskResponse | null;
  firstQuestion: boolean;
  onAsk: (q: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onOpenFiles: () => void;
}

export function Workspace({
  files,
  loading,
  error,
  answer,
  firstQuestion,
  onAsk,
  onCancel,
  onRetry,
  onOpenFiles,
}: Props) {
  return (
    <main className="min-w-0 space-y-6" style={{ animationDelay: '90ms' }}>
      <Composer
        hasFiles={files.length > 0}
        loading={loading}
        onAsk={onAsk}
        onOpenFiles={onOpenFiles}
        firstQuestion={firstQuestion}
      />
      <AnswerView
        loading={loading}
        error={error}
        answer={answer}
        files={files}
        onCancel={onCancel}
        onRetry={onRetry}
      />
    </main>
  );
}
