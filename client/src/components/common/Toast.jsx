import { useEffect, useState } from 'react';

const TOAST_STYLES = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-indigo-600 text-white',
  warning: 'bg-amber-500 text-white',
};

const TOAST_ICONS = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-sm
        transition-all duration-300 ease-out
        ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1 p-0.5 rounded"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
