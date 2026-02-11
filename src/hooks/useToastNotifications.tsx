'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastInput = Omit<Toast, 'id'>;

interface UseToastNotificationsResult {
  toasts: Toast[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
}

/**
 * Custom hook for managing toast notifications
 *
 * @param autoRemoveDelay - Time in ms before toast auto-removes (default: 5000ms)
 * @returns Toast state and control functions
 */
export function useToastNotifications(autoRemoveDelay: number = 5000): UseToastNotificationsResult {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: ToastInput): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after delay
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, autoRemoveDelay);

    return id;
  }, [autoRemoveDelay]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/**
 * Toast container component for rendering toast notifications
 */
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[1000] flex flex-col items-center space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-5 py-4 rounded-lg border shadow-xl
            bg-slate-900
            ${toast.type === 'success' ? 'border-[#4FFFB0]/50 shadow-[#4FFFB0]/10' : ''}
            ${toast.type === 'error' ? 'border-[#FF9F1C]/50 shadow-[#FF9F1C]/10' : ''}
            ${toast.type === 'info' ? 'border-[#1E4CDD]/50 shadow-[#1E4CDD]/10' : ''}
            animate-toast-fly-in pointer-events-auto
          `}
          style={{ minWidth: 280, maxWidth: 400 }}
          role="alert"
          aria-live="polite"
        >
          <div className={`font-pixel text-[8px] uppercase tracking-wider mb-2 ${
            toast.type === 'success' ? 'text-[#4FFFB0]' : ''
          }${
            toast.type === 'error' ? 'text-[#FF9F1C]' : ''
          }${
            toast.type === 'info' ? 'text-[#FFDAB9]' : ''
          }`}>{toast.title}</div>
          <div className="text-sm text-slate-300 leading-relaxed">{toast.message}</div>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-pixel text-[7px] uppercase tracking-wider text-slate-200 transition-colors duration-200 border border-white/20"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
