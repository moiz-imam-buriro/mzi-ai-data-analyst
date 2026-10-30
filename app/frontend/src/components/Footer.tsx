export function Footer() {
  return (
    <footer
      className="fade-up fixed bottom-0 inset-x-0 z-20 h-11 bg-card border-t border-border flex items-center justify-between px-5 sm:px-6"
      style={{ animationDelay: '120ms' }}
    >
      <span className="text-[13px] text-muted">
        © 2026 MZI AI Data Analyst
      </span>
      <span className="text-[14px] text-text text-center sm:text-right">
        Developed by <span className="font-semibold">Moiz Imam</span> | AI
        Engineer
      </span>
    </footer>
  );
}
