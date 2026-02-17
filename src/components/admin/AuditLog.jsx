import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('*, user:profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</p>;

  if (logs.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity yet.</p>;
  }

  return (
    <table className="audit-log-table">
      <thead>
        <tr>
          <th>Action</th>
          <th>Entity</th>
          <th>User</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.action}</td>
            <td>{log.entity_type}</td>
            <td>{log.user?.display_name || 'System'}</td>
            <td>{format(new Date(log.created_at), 'MMM d, h:mm a')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
