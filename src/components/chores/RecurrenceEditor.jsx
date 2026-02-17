import React from 'react';
import { DAYS, RECURRENCE_TYPES } from '../../lib/constants';

export default function RecurrenceEditor({ form, update }) {
  return (
    <>
      <div className="form-group">
        <label>Recurrence</label>
        <select
          className="form-select"
          value={form.recurrenceType}
          onChange={(e) => update('recurrenceType', e.target.value)}
        >
          {RECURRENCE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {(form.recurrenceType === 'weekly' || form.recurrenceType === 'biweekly') && (
        <div className="form-group">
          <label>Day of Week</label>
          <select
            className="form-select"
            value={form.recurrenceDay}
            onChange={(e) => update('recurrenceDay', e.target.value)}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {form.recurrenceType === 'monthly' && (
        <div className="form-group">
          <label>Day of Month</label>
          <select
            className="form-select"
            value={form.recurrenceDayOfMonth}
            onChange={(e) => update('recurrenceDayOfMonth', e.target.value)}
          >
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      )}

      {form.recurrenceType === 'once' && (
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            className="form-input"
            value={form.recurrenceDate}
            onChange={(e) => update('recurrenceDate', e.target.value)}
          />
        </div>
      )}

      {form.recurrenceType === 'custom' && (
        <>
          <div className="form-group">
            <label>Days of Week</label>
            <div className="chip-group">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className={`chip ${form.recurrenceDays.includes(i) ? 'selected' : ''}`}
                  onClick={() => {
                    const days = form.recurrenceDays.includes(i)
                      ? form.recurrenceDays.filter((x) => x !== i)
                      : [...form.recurrenceDays, i].sort();
                    update('recurrenceDays', days);
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Every N weeks</label>
            <input
              type="number"
              className="form-input"
              value={form.recurrenceInterval}
              onChange={(e) => update('recurrenceInterval', parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        </>
      )}

      {form.recurrenceType !== 'once' && (
        <div className="form-group">
          <label>End Date (optional)</label>
          <input
            type="date"
            className="form-input"
            value={form.recurrenceEndDate}
            onChange={(e) => update('recurrenceEndDate', e.target.value)}
          />
        </div>
      )}

      {form.recurrenceType === 'daily' && (
        <div className="form-group">
          <label>Every N days</label>
          <input
            type="number"
            className="form-input"
            value={form.recurrenceInterval}
            onChange={(e) => update('recurrenceInterval', parseInt(e.target.value) || 1)}
            min={1}
          />
        </div>
      )}
    </>
  );
}
