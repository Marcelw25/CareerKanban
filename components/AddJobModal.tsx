'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddJobModal({
  isOpen,
  onClose,
  userId,
  onJobAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onJobAdded: (job: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    priority: 'medium',
    notes: '',
    url: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        title: formData.title,
        company: formData.company,
        priority: formData.priority,
        notes: formData.notes,
        url: formData.url,
        status: 'pool',
      })
      .select();

    if (error) {
      console.error('Error adding job:', error);
      alert('Failed to add job');
    } else {
      onJobAdded(data);
      setFormData({ title: '', company: '', priority: 'medium', notes: '', url: '' });
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Job</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="text"
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="url"
            name="url"
            placeholder="Job URL (optional)"
            value={formData.url}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Adding...' : 'Add Job'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-900 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
