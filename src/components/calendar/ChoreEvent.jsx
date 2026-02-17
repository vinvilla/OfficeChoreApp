import React from 'react';
import { hexToRgba } from '../../lib/constants';
import { Repeat } from 'lucide-react';
import { clsx } from 'clsx';

export default function ChoreEvent({ arg }) {
  const { instance, assignee, color, isHoliday, holidayName } = arg.event.extendedProps;

  if (isHoliday) {
    return (
      <div className="holiday-event">
        {holidayName}
      </div>
    );
  }

  if (!instance) return null;

  const isDone = instance.status === 'done';
  const isOverdue = instance.status === 'overdue';

  return (
    <div
      className={clsx('chore-event', isDone && 'status-done', isOverdue && 'status-overdue')}
      style={{
        borderLeftColor: color || '#9ca3af',
        background: hexToRgba(color || '#9ca3af', 0.08),
      }}
    >
      <div className="chore-title">{instance.title}</div>
      <div className="chore-assignee">{assignee?.name || 'Unassigned'}</div>
      {isOverdue && <div className="overdue-badge">Overdue</div>}
      {instance.template_id && !instance.is_detached && (
        <span className="repeat-icon"><Repeat size={9} /></span>
      )}
    </div>
  );
}
