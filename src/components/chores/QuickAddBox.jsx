import React, { useState, useEffect, useRef } from 'react';
import { parseQuickAdd } from '../../lib/nlp';
import { useChoreStore } from '../../stores/choreStore';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickAddBox({ members, onClose }) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const inputRef = useRef(null);
  const { createInstance } = useChoreStore();
  const { organization } = useAuthStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (input.trim()) {
      setParsed(parseQuickAdd(input, members));
    } else {
      setParsed(null);
    }
  }, [input, members]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsed?.title) {
      toast.error('Enter a chore title');
      return;
    }

    try {
      await createInstance({
        organization_id: organization?.id,
        title: parsed.title,
        description: '',
        assignee_id: parsed.assigneeId,
        date: parsed.date,
        start_time: parsed.startTime,
        end_time: null,
        template_id: null,
        status: 'pending',
      });
      toast.success('Chore added');
      onClose();
    } catch {
      toast.error('Failed to add chore');
    }
  };

  return (
    <div className="quick-add-overlay" onClick={onClose}>
      <div className="quick-add-box" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="quick-add-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "Clean kitchen tomorrow at 9am assign to Alice"'
          />
        </form>

        {parsed && parsed.title && (
          <div className="quick-add-preview">
            <span className="quick-add-tag">
              <Calendar size={10} /> {parsed.date}
            </span>
            {parsed.startTime && (
              <span className="quick-add-tag">
                <Clock size={10} /> {parsed.startTime}
              </span>
            )}
            {parsed.assigneeName && (
              <span className="quick-add-tag">
                <User size={10} /> {parsed.assigneeName}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <span style={{ fontWeight: 600 }}>{parsed.title}</span>
          </div>
        )}

        <div className="quick-add-hint">
          Press <strong>Enter</strong> to add &middot; <strong>Esc</strong> to close &middot; Try natural language
        </div>
      </div>
    </div>
  );
}
