import { useEffect, useRef, useState } from 'react';
import { getHealth, setServerStatusListener } from '@/lib/api';
import type { ServerStatus } from '@/types';

const RETRY_DELAYS = [5000, 10000, 20000, 30000, 60000];

export function useServerStatus(onBackOnline?: () => void) {
  const [status, setStatus] = useState<ServerStatus>('unknown');
  const [reason, setReason] = useState<string>('');
  const wasOffline = useRef(false);
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkRef = useRef<() => void>(() => {});
  const cbRef = useRef(onBackOnline);
  cbRef.current = onBackOnline;

  const stopTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const goOnline = () => {
    stopTimer();
    attempt.current = 0;
    setStatus('online');
    setReason('');
    if (wasOffline.current) {
      wasOffline.current = false;
      cbRef.current?.();
    }
  };

  const goOffline = (why: string) => {
    wasOffline.current = true;
    setStatus('offline');
    setReason(why);
    if (!timer.current) {
      const delay =
        RETRY_DELAYS[Math.min(attempt.current, RETRY_DELAYS.length - 1)];
      attempt.current += 1;
      timer.current = setTimeout(() => {
        timer.current = null;
        checkRef.current();
      }, delay);
    }
  };

  checkRef.current = async () => {
    stopTimer();
    try {
      const r = await getHealth();
      if (r.status === 'ok') goOnline();
      else goOffline('Service not ready.');
    } catch (e) {
      const err = e as { message?: string };
      goOffline(err.message || 'Server unreachable.');
    }
  };

  useEffect(() => {
    checkRef.current();
    setServerStatusListener((online, why) =>
      online ? goOnline() : goOffline(why)
    );
    const onBrowserOnline = () => checkRef.current();
    window.addEventListener('online', onBrowserOnline);
    return () => {
      stopTimer();
      setServerStatusListener(null);
      window.removeEventListener('online', onBrowserOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    attempt.current = 0;
    checkRef.current();
  };

  return { status, reason, retry };
}