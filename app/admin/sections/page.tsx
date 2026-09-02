'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader as Loader2, GripVertical, Eye, EyeOff, Save, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';

interface Section {
  id: string;
  section_key: string;
  section_label: string;
  sort_order: number;
  is_enabled: boolean;
}

export default function SectionManagerPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<string>('');
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const sorted = data || [];
      setSections(sorted);
      setOriginalOrder(JSON.stringify(sorted.map(s => ({ key: s.section_key, enabled: s.is_enabled }))));
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to load sections: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const checkChanges = (newSections: Section[]) => {
    const current = JSON.stringify(newSections.map(s => ({ key: s.section_key, enabled: s.is_enabled })));
    setHasChanges(current !== originalOrder);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    newSections.forEach((s, i) => { s.sort_order = i + 1; });
    setSections(newSections);
    checkChanges(newSections);
  };

  const toggleEnabled = (id: string) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, is_enabled: !s.is_enabled } : s
    );
    setSections(newSections);
    checkChanges(newSections);
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const newSections = [...sections];
    const [dragged] = newSections.splice(dragIndex.current, 1);
    newSections.splice(index, 0, dragged);
    newSections.forEach((s, i) => { s.sort_order = i + 1; });
    setSections(newSections);
    checkChanges(newSections);
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sections.map((s, i) => ({
        id: s.id,
        sort_order: i + 1,
        is_enabled: s.is_enabled,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('homepage_sections')
          .update({ sort_order: update.sort_order, is_enabled: update.is_enabled })
          .eq('id', update.id);
        if (error) throw error;
      }

      toast.success('Section order saved successfully');
      setOriginalOrder(JSON.stringify(sections.map(s => ({ key: s.section_key, enabled: s.is_enabled }))));
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSections();
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#145a2c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Section Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Drag &amp; drop to reorder homepage sections. Toggle visibility to show/hide sections on the frontend.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} /> Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#145a2c] hover:bg-[#0f4a23] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="text-sm text-amber-700">
          <p className="font-semibold mb-1">Note</p>
          <p>Header and Footer are fixed and cannot be reordered or disabled. Changes take effect on the frontend immediately after saving.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="w-8 text-center">Order</div>
          <div className="flex-1">Section Name</div>
          <div className="w-24 text-center">Visibility</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        <div className="divide-y divide-gray-50">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 px-5 py-4 transition-all cursor-grab active:cursor-grabbing hover:bg-gray-50 ${
                dragOverIndex === index ? 'border-t-2 border-t-[#145a2c] bg-green-50/50' : ''
              } ${!section.is_enabled ? 'opacity-50' : ''}`}
            >
              <div className="w-8 flex items-center justify-center">
                <GripVertical size={16} className="text-gray-300" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{section.section_label}</div>
                <div className="text-xs text-gray-400 font-mono">{section.section_key}</div>
              </div>
              <div className="w-24 flex justify-center">
                <button
                  onClick={() => toggleEnabled(section.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    section.is_enabled ? 'bg-[#145a2c]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="w-20 flex items-center justify-center gap-1">
                <button
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {sections.filter(s => s.is_enabled).length} enabled
          </span>
          <span className="flex items-center gap-1">
            <EyeOff size={12} /> {sections.filter(s => !s.is_enabled).length} disabled
          </span>
        </div>
        <span>{sections.length} total sections</span>
      </div>
    </div>
  );
}
