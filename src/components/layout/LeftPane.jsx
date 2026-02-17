import React, { useState } from 'react';
import { useTeamStore } from '../../stores/teamStore';
import { useChoreStore } from '../../stores/choreStore';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function LeftPane() {
  const { members, addMember, removeMember, toggleMemberFilter, selectedMembers } = useTeamStore();
  const { templates, deleteTemplate } = useChoreStore();
  const { openModal } = useUiStore();
  const { profile } = useAuthStore();
  const [newMemberName, setNewMemberName] = useState('');

  const canEdit = profile?.role === 'admin' || profile?.role === 'editor';

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      await addMember(newMemberName.trim());
      setNewMemberName('');
    } catch {
      // handled in store
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span className="icon">🧹</span>
          Office Chores
        </h1>
      </div>

      <div className="sidebar-section">
        <h3>Team Members</h3>
        {members.map((m) => (
          <div
            key={m.id}
            className={`member-item ${selectedMembers.includes(m.id) ? 'selected' : ''}`}
            onClick={() => toggleMemberFilter(m.id)}
          >
            <span className="member-dot" style={{ background: m.color }} />
            <span className="member-name">{m.name}</span>
            {canEdit && (
              <button
                className="member-remove"
                onClick={(e) => { e.stopPropagation(); removeMember(m.id); }}
                title="Remove member"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <div className="add-member-row">
            <input
              placeholder="Add member..."
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <button className="btn-icon" onClick={handleAddMember} title="Add">
              <Plus size={14} />
            </button>
          </div>
        )}

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
        {templates.map((c) => (
          <div key={c.id} className="member-item">
            <span style={{ fontSize: '0.85rem', flex: 1 }}>{c.title}</span>
            {canEdit && (
              <>
                <button
                  className="btn-icon"
                  style={{ padding: 3 }}
                  onClick={() => openModal('chore', c)}
                  title="Edit"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  className="btn-icon btn-danger"
                  style={{ padding: 3 }}
                  onClick={() => deleteTemplate(c.id)}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="sidebar-footer">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openModal('chore')}>
            <Plus size={14} /> New Chore
          </button>
        </div>
      )}
    </aside>
  );
}
