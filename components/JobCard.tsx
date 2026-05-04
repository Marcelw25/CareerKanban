'use client';

import { useState } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  priority: string;
  date_applied?: string;
  notes?: string;
}

export default function JobCard({
  job,
  onDelete,
}: {
  job: Job;
  onDelete: () => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  const priorityColor = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 shadow hover:shadow-lg transition cursor-grab active:cursor-grabbing">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
          <p className="text-xs text-gray-600">{job.company}</p>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition text-sm"
        >
          ×
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded ${
            priorityColor[job.priority as keyof typeof priorityColor] ||
            priorityColor.medium
          }`}
        >
          {job.priority}
        </span>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          👁️ View
        </button>
      </div>

      {showNotes && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs text-gray-700">{job.notes || 'No notes'}</p>
        </div>
      )}
    </div>
  );
}
