import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeSubscription(table, { onInsert, onUpdate, onDelete, filter } = {}) {
  useEffect(() => {
    let channel = supabase.channel(`realtime-${table}`);

    if (onInsert) {
      channel = channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter },
        onInsert
      );
    }
    if (onUpdate) {
      channel = channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter },
        onUpdate
      );
    }
    if (onDelete) {
      channel = channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table, filter },
        onDelete
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
