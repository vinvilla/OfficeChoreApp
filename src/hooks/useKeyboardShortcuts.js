import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useCalendarStore } from '../stores/calendarStore';

export function useKeyboardShortcuts() {
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const activeModal = useUiStore((s) => s.activeModal);
  const setView = useCalendarStore((s) => s.setView);
  const goToday = useCalendarStore((s) => s.goToday);

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          openModal('quickAdd');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          goToday();
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          setView('week');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setView('month');
          break;
        case 'Escape':
          if (activeModal) {
            e.preventDefault();
            closeModal();
          }
          break;
        case '?':
          e.preventDefault();
          openModal('shortcuts');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, openModal, closeModal, setView, goToday]);
}
