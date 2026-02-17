import React, { useState } from 'react';
import { useChoreStore } from '../../stores/choreStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { DAYS, RECURRENCE_TYPES } from '../../lib/constants';
import { describeRecurrence } from '../../lib/recurrence';
import RecurrenceEditor from './RecurrenceEditor';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChoreModal({ chore, teamMembers, onClose }) {
  const { createTemplate, updateTemplate, createInstance } = useChoreStore();
  const { organization } = useAuthStore();
  const isEditing = chore && chore.id && !chore.date; // distinguish template edit from "new from date click"

  const [form, setForm] = useState({
    title: chore?.title || '',
    description: chore?.description || '',
    assignee_id: chore?.assignee_id || '',
    recurrenceType: chore?.recurrence_rule?.type || 'once',
    recurrenceDay: chore?.recurrence_rule?.day ?? 1,
    recurrenceDayOfMonth: chore?.recurrence_rule?.dayOfMonth ?? 1,
    recurrenceDate: chore?.recurrence_rule?.date || chore?.date || format(new Date(), 'yyyy-MM-dd'),
    recurrenceDays: chore?.recurrence_rule?.days || [],
    recurrenceInterval: chore?.recurrence_rule?.interval || 1,
    recurrenceEndDate: chore?.recurrence_rule?.endDate || '',
    autoRotate: chore?.auto_rotate || false,
    rotationPool: chore?.rotation_pool || [],
    duration_minutes: chore?.duration_minutes || 30,
    startTime: chore?.startTime || '',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePoolMember = (id) => {
    update(
      'rotationPool',
      form.rotationPool.includes(id)
        ? form.rotationPool.filter((x) => x !== id)
        : [...form.rotationPool, id]
    );
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    let recurrence_rule = {};
    switch (form.recurrenceType) {
      case 'daily':
        recurrence_rule = { type: 'daily', interval: form.recurrenceInterval };
        break;
      case 'weekly':
        recurrence_rule = { type: 'weekly', day: parseInt(form.recurrenceDay) };
        break;
      case 'biweekly':
        recurrence_rule = { type: 'biweekly', day: parseInt(form.recurrenceDay) };
        break;
      case 'monthly':
        recurrence_rule = { type: 'monthly', dayOfMonth: parseInt(form.recurrenceDayOfMonth) };
        break;
      case 'custom':
        recurrence_rule = {
          type: 'custom',
          days: form.recurrenceDays,
          interval: form.recurrenceInterval,
        };
        break;
      default:
        recurrence_rule = { type: 'once', date: form.recurrenceDate };
        break;
    }

    if (form.recurrenceEndDate) {
      recurrence_rule.endDate = form.recurrenceEndDate;
    }

    const data = {
      title: form.title.trim(),
      description: form.description,
      assignee_id: form.assignee_id || null,
      recurrence_rule,
      auto_rotate: form.autoRotate,
      rotation_pool: form.rotationPool,
      duration_minutes: form.duration_minutes,
      organization_id: organization?.id,
    };

    try {
      if (isEditing) {
        await updateTemplate(chore.id, data);
      } else if (form.recurrenceType === 'once' && form.startTime) {
        // Create a one-off instance directly
        await createInstance({
          ...data,
          date: form.recurrenceDate,
          start_time: form.startTime,
          end_time: null,
          template_id: null,
        });
      } else {
        await createTemplate(data);
      }
      onClose();
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Chore' : 'New Chore'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Clean Kitchen"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Optional details..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign To</label>
              <select
                className="form-select"
                value={form.assignee_id}
                onChange={(e) => update('assignee_id', e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (min)</label>
              <input
                type="number"
                className="form-input"
                value={form.duration_minutes}
                onChange={(e) => update('duration_minutes', parseInt(e.target.value) || 30)}
                min={5}
                step={5}
              />
            </div>
          </div>

          <RecurrenceEditor form={form} update={update} />

          {form.recurrenceType !== 'once' && (
            <>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.autoRotate}
                    onChange={(e) => update('autoRotate', e.target.checked)}
                  />
                  Auto-rotate assignee each occurrence
                </label>
              </div>
              {form.autoRotate && (
                <div className="form-group">
                  <label>Rotation Pool</label>
                  <div className="chip-group">
                    {teamMembers.map((m) => (
                      <div
                        key={m.id}
                        className={`chip ${form.rotationPool.includes(m.id) ? 'selected' : ''}`}
                        onClick={() => togglePoolMember(m.id)}
                      >
                        <span className="chip-dot" style={{ background: m.color }} />
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEditing ? 'Update Chore' : 'Add Chore'}
          </button>
        </div>
      </div>
    </div>
  );
}
