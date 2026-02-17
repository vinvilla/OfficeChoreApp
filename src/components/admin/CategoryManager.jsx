import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Plus, X, Edit2 } from 'lucide-react';
import { MEMBER_COLORS } from '../../lib/constants';
import toast from 'react-hot-toast';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(MEMBER_COLORS[0]);
  const { organization } = useAuthStore();

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at');
    setCategories(data || []);
  };

  useEffect(() => {
    if (organization) fetchCategories();
  }, [organization]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      color: newColor,
      organization_id: organization.id,
    });
    if (error) {
      toast.error('Failed to add category');
      return;
    }
    setNewName('');
    fetchCategories();
    toast.success('Category added');
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete category');
      return;
    }
    fetchCategories();
  };

  return (
    <div>
      {categories.map((cat) => (
        <div key={cat.id} className="category-item">
          <span className="category-dot" style={{ background: cat.color }} />
          <span style={{ flex: 1, fontSize: '0.9rem' }}>{cat.name}</span>
          <button className="btn-icon btn-danger" style={{ padding: 3 }} onClick={() => handleDelete(cat.id)}>
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="add-member-row" style={{ marginTop: 8 }}>
        <input
          placeholder="New category..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          style={{ width: 32, height: 32, border: 'none', cursor: 'pointer' }}
        />
        <button className="btn-icon" onClick={handleAdd}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
