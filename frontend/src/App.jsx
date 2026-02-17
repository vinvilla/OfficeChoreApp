import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

// ─── Date Helpers ────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function isSameDay(a, b) {
  return toDateStr(a) === toDateStr(b);
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDate = startOfWeek(firstDay);
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// ─── Color Helpers ───────────────────────────────────────────────────────────
const MEMBER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────
const Icons = {
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

// ─── Chore Card ──────────────────────────────────────────────────────────────
function ChoreCard({ instance, onClick, onDragStart }) {
  const color = instance.assigneeColor || '#9ca3af';
  const isOverdue = instance.status === 'overdue';
  const isDone = instance.status === 'done';

  return (
    <div
      className={`chore-card ${isDone ? 'status-done' : ''} ${isOverdue ? 'status-overdue' : ''}`}
      style={{
        borderLeftColor: color,
        background: hexToRgba(color, 0.08),
      }}
      onClick={(e) => { e.stopPropagation(); onClick(instance); }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', instance.id);
        e.target.classList.add('dragging');
        onDragStart(instance);
      }}
      onDragEnd={(e) => e.target.classList.remove('dragging')}
    >
      <div className="chore-title">{instance.title}</div>
      <div className="chore-assignee">{instance.assigneeName}</div>
      {isOverdue && <div className="overdue-badge">Overdue</div>}
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────
function WeekView({ days, instances, today, onCardClick, onDragStart, onDropOnDate }) {
  const instancesByDate = {};
  instances.forEach(inst => {
    if (!instancesByDate[inst.date]) instancesByDate[inst.date] = [];
    instancesByDate[inst.date].push(inst);
  });

  return (
    <div className="calendar-grid week-view">
      {days.map(day => {
        const dateStr = toDateStr(day);
        const isToday = isSameDay(day, today);
        return (
          <div key={dateStr} className="calendar-header-cell">
            <div>{DAYS[day.getDay()]}</div>
            <div className={`day-number ${isToday ? 'today' : ''}`}>{day.getDate()}</div>
          </div>
        );
      })}
      {days.map(day => {
        const dateStr = toDateStr(day);
        const isToday = isSameDay(day, today);
        const dayInstances = instancesByDate[dateStr] || [];

        return (
          <div
            key={`col-${dateStr}`}
            className={`week-day-column ${isToday ? 'today-column' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const id = e.dataTransfer.getData('text/plain');
              onDropOnDate(id, dateStr);
            }}
          >
            {dayInstances.map(inst => (
              <ChoreCard key={inst.id} instance={inst} onClick={onCardClick} onDragStart={onDragStart} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────
function MonthView({ days, currentMonth, instances, today, onCardClick, onDragStart, onDropOnDate }) {
  const instancesByDate = {};
  instances.forEach(inst => {
    if (!instancesByDate[inst.date]) instancesByDate[inst.date] = [];
    instancesByDate[inst.date].push(inst);
  });

  return (
    <div className="calendar-grid month-view">
      {DAYS.map(d => (
        <div key={d} className="calendar-header-cell">{d}</div>
      ))}
      {days.map(day => {
        const dateStr = toDateStr(day);
        const isToday = isSameDay(day, today);
        const isOtherMonth = day.getMonth() !== currentMonth;
        const dayInstances = instancesByDate[dateStr] || [];

        return (
          <div
            key={dateStr}
            className={`calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today-cell' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const id = e.dataTransfer.getData('text/plain');
              onDropOnDate(id, dateStr);
            }}
          >
            <div className={`month-day-number ${isToday ? 'today' : ''}`}>{day.getDate()}</div>
            {dayInstances.slice(0, 4).map(inst => (
              <ChoreCard key={inst.id} instance={inst} onClick={onCardClick} onDragStart={onDragStart} />
            ))}
            {dayInstances.length > 4 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 6px' }}>
                +{dayInstances.length - 4} more
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Add/Edit Chore Modal ────────────────────────────────────────────────────
function ChoreModal({ chore, teamMembers, onSave, onClose }) {
  const [form, setForm] = useState({
    title: chore?.title || '',
    description: chore?.description || '',
    assigneeId: chore?.assigneeId || '',
    recurrenceType: chore?.recurrence?.type || 'once',
    recurrenceDay: chore?.recurrence?.day ?? 1,
    recurrenceDayOfMonth: chore?.recurrence?.dayOfMonth ?? 1,
    recurrenceDate: chore?.recurrence?.date || toDateStr(new Date()),
    autoRotate: chore?.autoRotate || false,
    rotationPool: chore?.rotationPool || [],
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    let recurrence = {};
    switch (form.recurrenceType) {
      case 'daily': recurrence = { type: 'daily' }; break;
      case 'weekly': recurrence = { type: 'weekly', day: parseInt(form.recurrenceDay) }; break;
      case 'biweekly': recurrence = { type: 'biweekly', day: parseInt(form.recurrenceDay) }; break;
      case 'monthly': recurrence = { type: 'monthly', dayOfMonth: parseInt(form.recurrenceDayOfMonth) }; break;
      default: recurrence = { type: 'once', date: form.recurrenceDate }; break;
    }
    onSave({
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId || null,
      recurrence,
      autoRotate: form.autoRotate,
      rotationPool: form.rotationPool,
    });
  };

  const togglePoolMember = (id) => {
    update('rotationPool',
      form.rotationPool.includes(id)
        ? form.rotationPool.filter(x => x !== id)
        : [...form.rotationPool, id]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{chore ? 'Edit Chore' : 'New Chore'}</h2>
          <button className="btn-icon" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Clean Kitchen" autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Optional details..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign To</label>
              <select className="form-select" value={form.assigneeId} onChange={e => update('assigneeId', e.target.value)}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Recurrence</label>
              <select className="form-select" value={form.recurrenceType} onChange={e => update('recurrenceType', e.target.value)}>
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {(form.recurrenceType === 'weekly' || form.recurrenceType === 'biweekly') && (
            <div className="form-group">
              <label>Day of Week</label>
              <select className="form-select" value={form.recurrenceDay} onChange={e => update('recurrenceDay', e.target.value)}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {form.recurrenceType === 'monthly' && (
            <div className="form-group">
              <label>Day of Month</label>
              <select className="form-select" value={form.recurrenceDayOfMonth} onChange={e => update('recurrenceDayOfMonth', e.target.value)}>
                {Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
          )}

          {form.recurrenceType === 'once' && (
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-input" value={form.recurrenceDate} onChange={e => update('recurrenceDate', e.target.value)} />
            </div>
          )}

          {form.recurrenceType !== 'once' && (
            <>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.autoRotate} onChange={e => update('autoRotate', e.target.checked)} />
                  Auto-rotate assignee each occurrence
                </label>
              </div>
              {form.autoRotate && (
                <div className="form-group">
                  <label>Rotation Pool</label>
                  <div className="chip-group">
                    {teamMembers.map(m => (
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
            {chore ? 'Update Chore' : 'Add Chore'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Instance Detail Modal ───────────────────────────────────────────────────
function InstanceModal({ instance, teamMembers, onClose, onToggleStatus, onReassign, onDelete }) {
  const member = teamMembers.find(m => m.id === instance.assigneeId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="modal-header">
          <h2>{instance.title}</h2>
          <button className="btn-icon" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          {instance.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
              {instance.description}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Calendar />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {new Date(instance.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="member-dot" style={{ background: member?.color || '#9ca3af' }} />
              <span style={{ fontSize: '0.9rem' }}>{instance.assigneeName}</span>
              {instance.status === 'overdue' && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)',
                  background: 'var(--danger-dim)', padding: '2px 8px', borderRadius: 99,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>Overdue</span>
              )}
              {instance.status === 'done' && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)',
                  background: 'var(--success-dim)', padding: '2px 8px', borderRadius: 99,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>Done</span>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Reassign To</label>
            <select
              className="form-select"
              value={instance.assigneeId || ''}
              onChange={(e) => onReassign(instance.id, e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="detail-actions">
            <button
              className={`btn ${instance.status === 'done' ? '' : 'btn-primary'}`}
              onClick={() => onToggleStatus(instance.id, instance.status === 'done' ? 'pending' : 'done')}
            >
              <Icons.Check />
              {instance.status === 'done' ? 'Mark Incomplete' : 'Mark Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('month'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [teamMembers, setTeamMembers] = useState([]);
  const [chores, setChores] = useState([]);
  const [instances, setInstances] = useState([]);
  const [showChoreModal, setShowChoreModal] = useState(false);
  const [editingChore, setEditingChore] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragInstance, setDragInstance] = useState(null);
  const today = new Date();

  // Compute date range
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDays = getMonthGrid(year, month);
  const weekDays = getWeekDays(currentDate);

  const rangeStart = view === 'month' ? toDateStr(monthDays[0]) : toDateStr(weekDays[0]);
  const rangeEnd = view === 'month' ? toDateStr(monthDays[monthDays.length - 1]) : toDateStr(weekDays[6]);

  const fetchAll = useCallback(async () => {
    try {
      const [team, choreList, instList] = await Promise.all([
        api.getTeam(),
        api.getChores(),
        api.getInstances(rangeStart, rangeEnd),
      ]);
      setTeamMembers(team);
      setChores(choreList);
      setInstances(instList);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Navigation
  const navigate = (delta) => {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + delta);
    } else {
      d.setDate(d.getDate() + delta * 7);
    }
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Header text
  const headerText = view === 'month'
    ? `${MONTHS[month]} ${year}`
    : `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  // Team member management
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    const color = MEMBER_COLORS[teamMembers.length % MEMBER_COLORS.length];
    try {
      await api.addMember(newMemberName.trim(), color);
      setNewMemberName('');
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleRemoveMember = async (id) => {
    try {
      await api.removeMember(id);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  // Chore CRUD
  const handleSaveChore = async (data) => {
    try {
      if (editingChore) {
        await api.updateChore(editingChore.id, data);
      } else {
        await api.addChore(data);
      }
      setShowChoreModal(false);
      setEditingChore(null);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleDeleteChore = async (id) => {
    try {
      await api.deleteChore(id);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  // Instance actions
  const handleToggleStatus = async (id, status) => {
    try {
      const updated = await api.updateInstance(id, { status });
      setInstances(prev => prev.map(i => i.id === id ? updated : i));
      setSelectedInstance(updated);
    } catch (err) { console.error(err); }
  };

  const handleReassign = async (id, assigneeId) => {
    try {
      const updated = await api.updateInstance(id, { assigneeId });
      setInstances(prev => prev.map(i => i.id === id ? updated : i));
      setSelectedInstance(updated);
    } catch (err) { console.error(err); }
  };

  const handleDropOnDate = async (instanceId, newDate) => {
    try {
      const updated = await api.updateInstance(instanceId, { date: newDate });
      setInstances(prev => prev.map(i => i.id === instanceId ? updated : i));
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ height: '100vh' }}>
        <div className="icon">🧹</div>
        <p>Loading chores...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ─── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>
            <span className="icon">🧹</span>
            Office Chores
          </h1>
        </div>

        <div className="sidebar-section">
          <h3>Team Members</h3>
          {teamMembers.map(m => (
            <div key={m.id} className="member-item">
              <span className="member-dot" style={{ background: m.color }} />
              <span className="member-name">{m.name}</span>
              <button className="member-remove" onClick={() => handleRemoveMember(m.id)} title="Remove member">
                <Icons.X />
              </button>
            </div>
          ))}
          <div className="add-member-row">
            <input
              placeholder="Add member..."
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <button className="btn-icon" onClick={handleAddMember} title="Add"><Icons.Plus /></button>
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--success)' }} />
              Done
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--danger)' }} />
              Overdue
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--accent)' }} />
              Pending
            </div>
          </div>
        </div>

        <div className="sidebar-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h3>Chore Templates</h3>
          {chores.map(c => {
            const member = teamMembers.find(m => m.id === c.assigneeId);
            return (
              <div key={c.id} className="member-item">
                <span style={{ fontSize: '0.85rem', flex: 1 }}>{c.title}</span>
                <button className="btn-icon" style={{ padding: 3 }} onClick={() => { setEditingChore(c); setShowChoreModal(true); }} title="Edit">
                  <Icons.Edit />
                </button>
                <button className="btn-icon btn-danger" style={{ padding: 3 }} onClick={() => handleDeleteChore(c.id)} title="Delete">
                  <Icons.Trash />
                </button>
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setEditingChore(null); setShowChoreModal(true); }}>
            <Icons.Plus /> New Chore
          </button>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <main className="main-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="btn" onClick={goToday}>
              <Icons.Calendar /> Today
            </button>
          </div>
          <div className="toolbar-center">
            <button className="btn-icon" onClick={() => navigate(-1)}><Icons.ChevronLeft /></button>
            <span className="nav-date">{headerText}</span>
            <button className="btn-icon" onClick={() => navigate(1)}><Icons.ChevronRight /></button>
          </div>
          <div className="toolbar-right">
            <div className="view-toggle">
              <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
              <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          {view === 'week' ? (
            <WeekView
              days={weekDays}
              instances={instances}
              today={today}
              onCardClick={setSelectedInstance}
              onDragStart={setDragInstance}
              onDropOnDate={handleDropOnDate}
            />
          ) : (
            <MonthView
              days={monthDays}
              currentMonth={month}
              instances={instances}
              today={today}
              onCardClick={setSelectedInstance}
              onDragStart={setDragInstance}
              onDropOnDate={handleDropOnDate}
            />
          )}
        </div>
      </main>

      {/* ─── Modals ────────────────────────────────────────────────────── */}
      {showChoreModal && (
        <ChoreModal
          chore={editingChore}
          teamMembers={teamMembers}
          onSave={handleSaveChore}
          onClose={() => { setShowChoreModal(false); setEditingChore(false); }}
        />
      )}

      {selectedInstance && (
        <InstanceModal
          instance={selectedInstance}
          teamMembers={teamMembers}
          onClose={() => setSelectedInstance(null)}
          onToggleStatus={handleToggleStatus}
          onReassign={handleReassign}
          onDelete={() => {}}
        />
      )}
    </div>
  );
}
