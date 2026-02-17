import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getRecurrenceDates } from '../lib/recurrence';
import toast from 'react-hot-toast';

export const useChoreStore = create((set, get) => ({
  templates: [],
  instances: [],
  loading: false,

  fetchTemplates: async () => {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load chore templates');
      console.error(error);
      return;
    }
    set({ templates: data || [] });
  },

  fetchInstances: async (start, end) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('chore_instances')
      .select('*, assignee:team_members(*), template:chore_templates(*, category:categories(*))')
      .gte('date', start)
      .lte('date', end)
      .order('date');

    if (error) {
      toast.error('Failed to load chore instances');
      console.error(error);
      set({ loading: false });
      return;
    }
    set({ instances: data || [], loading: false });
  },

  createTemplate: async (templateData) => {
    const { data, error } = await supabase
      .from('chore_templates')
      .insert(templateData)
      .select('*, category:categories(*)')
      .single();

    if (error) {
      toast.error('Failed to create chore');
      throw error;
    }

    set((state) => ({ templates: [data, ...state.templates] }));
    toast.success('Chore created');

    // Auto-generate instances for the current visible range
    await get().generateInstancesForTemplate(data);

    return data;
  },

  updateTemplate: async (id, updates) => {
    const { data, error } = await supabase
      .from('chore_templates')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) {
      toast.error('Failed to update chore');
      throw error;
    }

    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? data : t)),
    }));

    // Delete old instances for this template and regenerate
    await supabase
      .from('chore_instances')
      .delete()
      .eq('template_id', id)
      .eq('status', 'pending');

    await get().generateInstancesForTemplate(data);

    toast.success('Chore updated');
    return data;
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase
      .from('chore_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete chore');
      throw error;
    }

    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      instances: state.instances.filter((i) => i.template_id !== id),
    }));
    toast.success('Chore deleted');
  },

  // Generate instances for a single template over ±2 months
  generateInstancesForTemplate: async (template) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const dates = getRecurrenceDates(template.recurrence_rule, startStr, endStr);
    if (dates.length === 0) return;

    // Check which dates already have instances
    const { data: existing } = await supabase
      .from('chore_instances')
      .select('date')
      .eq('template_id', template.id);

    const existingDates = new Set((existing || []).map((e) => e.date));

    const newInstances = dates
      .filter((date) => !existingDates.has(date))
      .map((date, index) => {
        let assigneeId = template.assignee_id;
        if (template.auto_rotate && template.rotation_pool?.length > 0) {
          const poolIndex = (template.rotation_index + index) % template.rotation_pool.length;
          assigneeId = template.rotation_pool[poolIndex];
        }

        const today = new Date().toISOString().split('T')[0];

        return {
          organization_id: template.organization_id,
          template_id: template.id,
          title: template.title,
          description: template.description || '',
          assignee_id: assigneeId,
          date,
          status: date < today ? 'overdue' : 'pending',
        };
      });

    if (newInstances.length === 0) return;

    const { data, error } = await supabase
      .from('chore_instances')
      .insert(newInstances)
      .select('*, assignee:team_members(*), template:chore_templates(*, category:categories(*))');

    if (error) {
      console.error('Failed to generate instances:', error);
      return;
    }

    if (data) {
      set((state) => ({
        instances: [...state.instances, ...data],
      }));
    }
  },

  createInstance: async (instanceData) => {
    const { data, error } = await supabase
      .from('chore_instances')
      .insert(instanceData)
      .select('*, assignee:team_members(*), template:chore_templates(*, category:categories(*))')
      .single();

    if (error) {
      toast.error('Failed to create instance');
      throw error;
    }

    set((state) => ({ instances: [...state.instances, data] }));
    toast.success('Chore added to calendar');
    return data;
  },

  updateInstance: async (id, updates) => {
    // Optimistic update
    const prev = get().instances;
    set((state) => ({
      instances: state.instances.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));

    const { data, error } = await supabase
      .from('chore_instances')
      .update(updates)
      .eq('id', id)
      .select('*, assignee:team_members(*), template:chore_templates(*, category:categories(*))')
      .single();

    if (error) {
      set({ instances: prev });
      toast.error('Failed to update instance');
      throw error;
    }

    set((state) => ({
      instances: state.instances.map((i) => (i.id === id ? data : i)),
    }));
    return data;
  },

  deleteInstance: async (id) => {
    const { error } = await supabase
      .from('chore_instances')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete instance');
      throw error;
    }

    set((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
    }));
  },
}));
