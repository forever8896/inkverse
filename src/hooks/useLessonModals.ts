'use client';

/**
 * useLessonModals - Modal state management for lessons
 *
 * Handles visibility state for auth modal, completion modals, and chapter transitions.
 * Extracted from LessonContext for better separation of concerns.
 */

import { useState, useCallback } from 'react';

interface UseLessonModalsReturn {
  // Auth modal
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;

  // Lesson completion modal
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;

  // Chapter completion modal
  showChapterComplete: boolean;
  setShowChapterComplete: (show: boolean) => void;
  completedChapterTitle: string;
  setCompletedChapterTitle: (title: string) => void;

  // Auth requirement for chapter continuation
  chapterRequiresAuth: boolean;
  setChapterRequiresAuth: (requires: boolean) => void;

  // Actions
  openChapterComplete: (title: string, requiresAuth?: boolean) => void;
  closeChapterComplete: () => void;
}

export function useLessonModals(): UseLessonModalsReturn {
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Lesson completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Chapter completion modal state
  const [showChapterComplete, setShowChapterComplete] = useState(false);
  const [completedChapterTitle, setCompletedChapterTitle] = useState('');
  const [chapterRequiresAuth, setChapterRequiresAuth] = useState(false);

  // Open chapter complete modal with title and optional auth requirement
  const openChapterComplete = useCallback((title: string, requiresAuth = false) => {
    setCompletedChapterTitle(title);
    setChapterRequiresAuth(requiresAuth);
    setShowChapterComplete(true);
  }, []);

  // Close chapter complete modal
  const closeChapterComplete = useCallback(() => {
    setShowChapterComplete(false);
  }, []);

  return {
    // Auth modal
    showAuthModal,
    setShowAuthModal,

    // Lesson completion modal
    showCompletionModal,
    setShowCompletionModal,

    // Chapter completion modal
    showChapterComplete,
    setShowChapterComplete,
    completedChapterTitle,
    setCompletedChapterTitle,

    // Auth requirement
    chapterRequiresAuth,
    setChapterRequiresAuth,

    // Actions
    openChapterComplete,
    closeChapterComplete,
  };
}
