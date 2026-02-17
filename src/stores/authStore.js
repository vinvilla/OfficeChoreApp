import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  organization: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await get().loadProfile(session.user);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await get().loadProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, organization: null });
      }
    });
  },

  loadProfile: async (user) => {
    set({ user });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({ profile });

      if (profile.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        set({ organization: org });
      }
    }
  },

  signUp: async (email, password, displayName) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) {
      set({ error: error.message });
      throw error;
    }
    return data;
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message });
      throw error;
    }
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, organization: null });
  },

  createOrganization: async (name) => {
    const user = get().user;
    if (!user) throw new Error('Not authenticated');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (orgError) throw orgError;

    // Update profile with org id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organization_id: org.id, role: 'admin' })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Create a team member entry for this user
    const profile = get().profile;
    await supabase.from('team_members').insert({
      organization_id: org.id,
      profile_id: user.id,
      name: profile?.display_name || user.email.split('@')[0],
      color: '#6366f1',
    });

    await get().loadProfile(user);
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    await get().loadProfile(user);
  },
}));
