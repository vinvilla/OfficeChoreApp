import React from 'react';
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function MiniCalendar({ date, instances, onDateClick, offset = 0 }) {
  const targetDate = addMonths(date, offset);
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const gridStart = startOfWeek(monthStart);

  const days = [];
  let current = gridStart;
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  const instanceDates = new Set(instances.map((i) => i.date));

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <span>{format(targetDate, 'MMMM yyyy')}</span>
      </div>
      <div className="mini-calendar-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="day-label">{d}</div>
        ))}
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isOtherMonth = day.getMonth() !== targetDate.getMonth();
          const hasChores = instanceDates.has(dateStr);

          return (
            <div
              key={i}
              className={clsx(
                'day-cell',
                isOtherMonth && 'other-month',
                isToday(day) && 'today',
                isSameDay(day, date) && 'selected'
              )}
              onClick={() => onDateClick(day)}
            >
              {day.getDate()}
              {hasChores && !isOtherMonth && <span className="chore-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
