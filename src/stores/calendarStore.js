import { create } from 'zustand';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format } from 'date-fns';

export const useCalendarStore = create((set, get) => ({
  view: 'month', // 'week' | 'month'
  currentDate: new Date(),
  selectedDate: null,

  setView: (view) => set({ view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  navigate: (delta) => {
    set((state) => {
      const d = new Date(state.currentDate);
      if (state.view === 'month') {
        d.setMonth(d.getMonth() + delta);
      } else {
        d.setDate(d.getDate() + delta * 7);
      }
      return { currentDate: d };
    });
  },

  goToday: () => set({ currentDate: new Date() }),

  getDateRange: () => {
    const { view, currentDate } = get();
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      // Extend to full weeks
      const rangeStart = startOfWeek(monthStart);
      const rangeEnd = endOfWeek(monthEnd);
      return {
        start: format(rangeStart, 'yyyy-MM-dd'),
        end: format(rangeEnd, 'yyyy-MM-dd'),
      };
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd'),
      };
    }
  },

  getHeaderText: () => {
    const { view, currentDate } = get();
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
  },
}));
