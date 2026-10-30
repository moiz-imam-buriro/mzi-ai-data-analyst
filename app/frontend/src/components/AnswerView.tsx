import { ChartCard } from './ChartCard';
import { ErrorNotice } from './ErrorNotice';
import { LoadingState } from './LoadingState';
import { SqlCard } from './SqlCard';
import { TableCard } from './TableCard';
import type { ApiError, AskResponse, FileInfo } from '@/types';

interface Props {
  loading: boolean;
  error: ApiError | null;
  answer: AskResponse | null;
  files: FileInfo[];
  onCancel: () => void;
  onRetry: () => void;
}

export function AnswerView({
  loading,
  error,
  answer,
  files,
  onCancel,
  onRetry,
}: Props) {
  if (loading) return <LoadingState onCancel={onCancel} />;

  if (error) {
    const hint =
      error.message.toLowerCase().includes("can't be answered") ||
      error.message.toLowerCase().includes('cannot be answered')
        ? `Try rephrasing using the column names of your uploaded files${
            files.length
              ? `: ${files
                  .slice(0, 3)
                  .map((f) => f.columns.slice(0, 4).join(', '))
                  .join('; ')}`
              : '.'
          }`
        : undefined;
    return <ErrorNotice error={error} onRetry={onRetry} hint={hint} />;
  }

  if (!answer) return null;

  if (answer.error) {
    const isCant = answer.error.toLowerCase().includes("can't be answered");
    return (
      <ErrorNotice
        error={{ message: answer.error }}
        hint={
          isCant
            ? `Try rephrasing using the column names of your uploaded files${
                files.length
                  ? `: ${files
                      .slice(0, 3)
                      .map((f) => f.columns.slice(0, 4).join(', '))
                      .join('; ')}`
                  : '.'
              }`
            : undefined
        }
      />
    );
  }

  const cards: React.ReactNode[] = [];
  if (answer.summary) {
    cards.push(
      <section
        key="summary"
        className="fade-up rounded-[14px] border border-border bg-card p-6 hover:border-border-strong transition-colors"
        aria-label="Summary"
      >
        <p
          className="text-text"
          style={{ fontSize: '19px', lineHeight: 1.6, fontWeight: 400 }}
        >
          {answer.summary}
        </p>
      </section>
    );
  }
  if (
    answer.chart &&
    (answer.chart.type === 'bar' || answer.chart.type === 'line')
  ) {
    cards.push(<ChartCard key="chart" answer={answer} />);
  }
  if (answer.columns && answer.columns.length) {
    cards.push(<TableCard key="table" answer={answer} />);
  }
  if (answer.sql) {
    cards.push(<SqlCard key="sql" sql={answer.sql} />);
  }

  return <div className="space-y-6">{cards}</div>;
}
