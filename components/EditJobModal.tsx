'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const TEAL   = '#1B6B7F';
const ORANGE = '#C45D2E';
const CREAM  = '#F5F1E8';
const MINT   = '#5DD9D0';

const STATUS_OPTIONS   = ['pool', 'applied', 'interviewing', 'closed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const JOB_TYPE_OPTIONS = ['', 'Remote', 'Hybrid', 'On-site', 'Contract', 'Part-time', 'Internship'];

const fieldStyle = { borderColor: 'rgba(27,107,127,0.2)', backgroundColor: 'white' };
const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm border-2 outline-none transition-colors duration-150 focus:border-[#5DD9D0]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: TEAL }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: TEAL }}>
        {title}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(27,107,127,0.18)' }} />
    </div>
  );
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  job_type?: string;
  status: string;
  priority: string;
  date_applied?: string;
  description?: string;
  notes?: string;
  url?: string;
  follow_up_date?: string;
  resume_used?: string;
  skills?: string[] | string;
}

export default function EditJobModal({
  job,
  isOpen,
  onClose,
  onJobUpdated,
}: {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: (job: Job) => void;
}) {
  const [formData, setFormData] = useState({
    title:          job.title,
    company:        job.company,
    location:       job.location       ?? '',
    salary:         job.salary         ?? '',
    job_type:       job.job_type       ?? '',
    status:         job.status,
    priority:       job.priority,
    date_applied:   job.date_applied   ?? '',
    description:    job.description    ?? '',
    notes:          job.notes          ?? '',
    url:            job.url            ?? '',
    follow_up_date: job.follow_up_date ?? '',
    resume_used:    job.resume_used    ?? '',
    skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills ?? ''),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      date_applied:   formData.date_applied   || null,
      follow_up_date: formData.follow_up_date || null,
      skills: formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
    };

    const { data, error: supaError } = await supabase
      .from('jobs')
      .update(payload)
      .eq('id', job.id)
      .select()
      .single();

    if (supaError) {
      setError(supaError.message);
    } else {
      onJobUpdated(data);
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(27, 107, 127, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: CREAM }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: TEAL }}>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Edit Job</h2>
            <p className="text-sm mt-0.5" style={{ color: MINT, opacity: 0.9 }}>{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xl text-white transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label="Close"
          >×</button>
        </div>
        <div className="h-1" style={{ backgroundColor: MINT }} />

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* ── Job Details ── */}
          <SectionHeader title="Job Details" />

          <Field label="Job Title">
            <input type="text" name="title" value={formData.title} onChange={handleChange}
              required className={inputClass} style={fieldStyle} />
          </Field>

          <Field label="Company">
            <input type="text" name="company" value={formData.company} onChange={handleChange}
              required className={inputClass} style={fieldStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <input type="text" name="location" value={formData.location} onChange={handleChange}
                placeholder="e.g. Austin, TX" className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Job Type">
              <select name="job_type" value={formData.job_type} onChange={handleChange}
                className={inputClass} style={fieldStyle}>
                {JOB_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o || 'Not specified'}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Salary">
              <input type="text" name="salary" value={formData.salary} onChange={handleChange}
                placeholder="e.g. $120k–$150k" className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Priority">
              <select name="priority" value={formData.priority} onChange={handleChange}
                className={inputClass} style={fieldStyle}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Job URL">
            <input type="url" name="url" value={formData.url} onChange={handleChange}
              placeholder="https://…" className={inputClass} style={fieldStyle} />
          </Field>

          <Field label="Description">
            <textarea name="description" value={formData.description} onChange={handleChange}
              rows={3} placeholder="Role summary and key requirements…"
              className={`${inputClass} resize-none`} style={fieldStyle} />
          </Field>

          <Field label="Skills">
            <input type="text" name="skills" value={formData.skills} onChange={handleChange}
              placeholder="e.g. React, TypeScript, Figma" className={inputClass} style={fieldStyle} />
          </Field>

          {/* ── Application Tracking ── */}
          <SectionHeader title="Application Tracking" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select name="status" value={formData.status} onChange={handleChange}
                className={inputClass} style={fieldStyle}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Date Applied">
              <input type="date" name="date_applied" value={formData.date_applied}
                onChange={handleChange} className={inputClass} style={fieldStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Follow-up Date">
              <input type="date" name="follow_up_date" value={formData.follow_up_date}
                onChange={handleChange} className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Resume Used">
              <input type="text" name="resume_used" value={formData.resume_used}
                onChange={handleChange} placeholder="e.g. resume_v3.pdf"
                className={inputClass} style={fieldStyle} />
            </Field>
          </div>

          {/* ── Notes ── */}
          <SectionHeader title="Notes" />

          <Field label="Notes">
            <textarea name="notes" value={formData.notes} onChange={handleChange}
              rows={3} placeholder="Interview prep, contacts, anything else…"
              className={`${inputClass} resize-none`} style={fieldStyle} />
          </Field>

          {error && (
            <p className="text-sm font-medium" style={{ color: ORANGE }}>{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'rgba(27,107,127,0.12)', color: TEAL }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
