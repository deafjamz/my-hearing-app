/**
 * LoadingSpinner - Shared loading state component
 *
 * Design: OLED dark bg, slate-400 text, teal-500 accent spinner
 * Tailwind-only, no custom CSS
 */

interface LoadingSpinnerProps {
  /** Optional message shown below the spinner */
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin" />
      {message && (
        <p className="text-slate-400 text-sm">{message}</p>
      )}
    </div>
  );
}
