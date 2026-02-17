import React from 'react';
import { format, isToday, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Flag } from 'lucide-react';

export default function HolidayBanner({ holidays, currentDate }) {
  // Show upcoming holidays within the next 7 days
  const today = new Date();
  const weekEnd = addDays(today, 7);

  const upcoming = holidays.filter((h) => {
    const d = new Date(h.date);
    return d >= today && d <= weekEnd;
  });

  if (upcoming.length === 0) return null;

  return (
    <div className="presence-bar" style={{ background: 'var(--warning-dim)', borderColor: 'var(--warning)' }}>
      <Flag size={12} style={{ color: 'var(--warning)' }} />
      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
        Upcoming: {upcoming.map((h) => `${h.name} (${format(new Date(h.date), 'MMM d')})`).join(', ')}
      </span>
    </div>
  );
}
