import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function usePresence(channelName = 'org-presence') {
  const [presenceState, setPresenceState] = useState({});
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: profile.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            display_name: profile.display_name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, channelName]);

  const onlineUsers = Object.values(presenceState).flat().map((p) => p);

  return { onlineUsers, presenceState };
}
