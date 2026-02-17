import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { MEMBER_COLORS } from '../lib/constants';

export const useTeamStore = create((set, get) => ({
  members: [],
  selectedMembers: [], // for filtering
  loading: false,

  fetchMembers: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('team_members')
      .select('*, profile:profiles(*)')
      .order('created_at');

    if (error) {
      toast.error('Failed to load team members');
      console.error(error);
      set({ loading: false });
      return;
    }
    set({ members: data || [], loading: false });
  },

  addMember: async (name, color) => {
    const members = get().members;
    const memberColor = color || MEMBER_COLORS[members.length % MEMBER_COLORS.length];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return;

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        name,
        color: memberColor,
        organization_id: profile.organization_id,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      toast.error('Failed to add team member');
      throw error;
    }

    set((state) => ({ members: [...state.members, data] }));
    toast.success(`${name} added to team`);
    return data;
  },

  removeMember: async (id) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove team member');
      throw error;
    }

    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
      selectedMembers: state.selectedMembers.filter((mid) => mid !== id),
    }));
    toast.success('Team member removed');
  },

  updateMember: async (id, updates) => {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      toast.error('Failed to update team member');
      throw error;
    }

    set((state) => ({
      members: state.members.map((m) => (m.id === id ? data : m)),
    }));
    return data;
  },

  toggleMemberFilter: (memberId) => {
    set((state) => {
      const selected = state.selectedMembers.includes(memberId)
        ? state.selectedMembers.filter((id) => id !== memberId)
        : [...state.selectedMembers, memberId];
      return { selectedMembers: selected };
    });
  },

  clearFilters: () => set({ selectedMembers: [] }),

  selectAllMembers: () => {
    set((state) => ({
      selectedMembers: state.members.map((m) => m.id),
    }));
  },
}));
