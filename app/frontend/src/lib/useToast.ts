import { useCallback } from 'react';

export function useToast() {
  const show = useCallback((msg: string) => {
    let el = document.getElementById('mzi-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mzi-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText =
        'position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(8px);opacity:0;' +
        'padding:10px 16px;border-radius:10px;font-size:13px;z-index:200;' +
        'background:var(--c-card);color:var(--c-text);border:1px solid var(--c-border-strong);' +
        'transition:opacity 200ms, transform 200ms cubic-bezier(0.22,1,0.36,1);pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => {
      el!.style.opacity = '1';
      el!.style.transform = 'translateX(-50%) translateY(0)';
    });
    window.clearTimeout((el as HTMLElement & { _t?: number })._t);
    (el as HTMLElement & { _t?: number })._t = window.setTimeout(() => {
      el!.style.opacity = '0';
      el!.style.transform = 'translateX(-50%) translateY(8px)';
    }, 2200);
  }, []);
  return { show };
}
