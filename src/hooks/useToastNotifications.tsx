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
  addToast: (toast: ToastInput) => void;
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

  const addToast = useCallback((toast: ToastInput) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after delay
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, autoRemoveDelay);
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
            px-6 py-4 rounded-lg shadow-lg border
            ${toast.type === 'success' ? 'bg-pink-700/90 border-pink-400 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-700/90 border-red-400 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-700/90 border-blue-400 text-white' : ''}
            animate-fade-in-up pointer-events-auto
          `}
          style={{ minWidth: 280, maxWidth: 400 }}
          role="alert"
          aria-live="polite"
        >
          <div className="font-semibold mb-1">{toast.title}</div>
          <div className="text-sm mb-2">{toast.message}</div>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors duration-200 border border-white/30"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
