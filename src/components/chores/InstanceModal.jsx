import React from 'react';
import { useChoreStore } from '../../stores/choreStore';
import { useUiStore } from '../../stores/uiStore';
import { describeRecurrence } from '../../lib/recurrence';
import { format } from 'date-fns';
import { X, Check, Calendar, Repeat, SkipForward, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstanceModal({ instance, teamMembers, onClose }) {
  const { updateInstance, deleteInstance } = useChoreStore();
  const assignee = teamMembers.find((m) => m.id === instance.assignee_id);

  const handleToggleStatus = async () => {
    const newStatus = instance.status === 'done' ? 'pending' : 'done';
    await updateInstance(instance.id, {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    });
    onClose();
  };

  const handleReassign = async (assigneeId) => {
    await updateInstance(instance.id, { assignee_id: assigneeId || null });
  };

  const handleSkip = async () => {
    await updateInstance(instance.id, { status: 'skipped' });
    toast.success('Chore skipped');
    onClose();
  };

  const handleDelete = async () => {
    await deleteInstance(instance.id);
    toast.success('Instance deleted');
    onClose();
  };

  const dateDisplay = format(new Date(instance.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
  const recurrenceDesc = instance.template?.recurrence_rule
    ? describeRecurrence(instance.template.recurrence_rule)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="modal-header">
          <h2>{instance.title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {instance.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
              {instance.description}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {dateDisplay}
              </span>
            </div>
            {instance.start_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: 22 }}>
                  {instance.start_time}{instance.end_time ? ` – ${instance.end_time}` : ''}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="member-dot" style={{ background: assignee?.color || '#9ca3af' }} />
              <span style={{ fontSize: '0.9rem' }}>{assignee?.name || 'Unassigned'}</span>
              {instance.status === 'overdue' && <span className="badge badge-danger">Overdue</span>}
              {instance.status === 'done' && <span className="badge badge-success">Done</span>}
              {instance.status === 'skipped' && <span className="badge badge-warning">Skipped</span>}
            </div>
            {recurrenceDesc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Repeat size={14} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {recurrenceDesc}
                </span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Reassign To</label>
            <select
              className="form-select"
              value={instance.assignee_id || ''}
              onChange={(e) => handleReassign(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="detail-actions">
            <button
              className={`btn ${instance.status === 'done' ? '' : 'btn-primary'}`}
              onClick={handleToggleStatus}
            >
              <Check size={14} />
              {instance.status === 'done' ? 'Mark Incomplete' : 'Mark Done'}
            </button>
            {instance.template_id && (
              <button className="btn" onClick={handleSkip} title="Skip this occurrence">
                <SkipForward size={14} /> Skip
              </button>
            )}
            <button className="btn btn-danger" onClick={handleDelete} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
