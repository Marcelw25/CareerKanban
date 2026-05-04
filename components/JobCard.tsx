'use client';

import { useState } from 'react';
import {
  Building2, MapPin, Briefcase, DollarSign,
  Clock, Bell, ExternalLink, Eye, EyeOff, Pencil, Trash2, Archive,
} from 'lucide-react';
import type { Job } from './EditJobModal';

const TEAL   = '#1B6B7F';
const ORANGE = '#C45D2E';
const CREAM  = '#F5F1E8';
const MINT   = '#5DD9D0';

const PRIORITY_DOT: Record<string, string> = {
  high:   '#DC2626',
  medium: ORANGE,
  low:    '#16A34A',
};

// Parse YYYY-MM-DD as local midnight (avoids UTC-offset shifting the date)
function parseDate(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatShortDate(str?: string | null) {
  if (!str) return null;
  return parseDate(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFollowUpBanner(follow_up_date?: string | null) {
  if (!follow_up_date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = parseDate(follow_up_date);
  const diff  = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  const label = formatShortDate(follow_up_date);

  if (diff < 0)  return { text: `Overdue (${label})`,     bg: '#8B2500' };
  if (diff <= 7) return { text: `Follow up soon (${label})`, bg: ORANGE };
  return null;
}

export default function JobCard({
  job,
  onDelete,
  onArchive,
  onEdit,
  compact = false,
}: {
  job: Job;
  onDelete: () => void;
  onArchive: () => void;
  onEdit: () => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // ── Compact mode ──
  if (compact) {
    const dot = PRIORITY_DOT[job.priority] ?? PRIORITY_DOT.medium;
    return (
      <div
        className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 border cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: CREAM, borderColor: 'rgba(27,107,127,0.13)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-wide truncate" style={{ color: TEAL }}>
            {job.title}
          </p>
          {job.company && (
            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(27,107,127,0.55)' }}>
              {job.company}{job.location ? ` · ${job.location}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dot }} />
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ backgroundColor: 'rgba(27,107,127,0.1)' }}>
            <Pencil size={10} color={TEAL} strokeWidth={2} />
          </button>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ backgroundColor: 'rgba(27,107,127,0.1)' }}>
              <ExternalLink size={10} color={TEAL} strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    );
  }

  const banner   = getFollowUpBanner(job.follow_up_date);
  const dot      = PRIORITY_DOT[job.priority] ?? PRIORITY_DOT.medium;
  const skills   = Array.isArray(job.skills)
    ? job.skills
    : job.skills ? job.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const hasDetails = job.description || skills.length > 0 || job.notes;

  return (
    <div
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing overflow-hidden"
      style={{ backgroundColor: CREAM, border: '1.5px solid rgba(27,107,127,0.13)' }}
    >
      {/* ── Follow-up banner ── */}
      {banner && (
        <div
          className="px-3.5 py-2 flex items-center gap-2"
          style={{ backgroundColor: banner.bg }}
        >
          <Bell size={11} color="white" strokeWidth={2.5} />
          <span className="text-xs font-bold tracking-wide text-white">{banner.text}</span>
        </div>
      )}

      <div className="p-4">
        {/* ── Title + priority dot ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3
            className="font-black text-xs leading-snug uppercase tracking-wide flex-1"
            style={{ color: TEAL }}
          >
            {job.title}
          </h3>
          <span
            className="w-3 h-3 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: dot }}
            title={`${job.priority} priority`}
          />
        </div>

        {/* ── Info rows ── */}
        <div className="space-y-1.5 mb-3">
          {job.company && (
            <Row icon={<Building2 size={12} color={TEAL} strokeWidth={2} />}>
              <span className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                {job.company}
              </span>
            </Row>
          )}

          {(job.location || job.job_type) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <MapPin size={12} color={TEAL} strokeWidth={2} />
              {job.location && (
                <span className="text-sm" style={{ color: '#4A5568' }}>{job.location}</span>
              )}
              {job.location && job.job_type && (
                <span className="text-sm" style={{ color: 'rgba(27,107,127,0.35)' }}>·</span>
              )}
              {job.job_type && (
                <>
                  <Briefcase size={12} color={TEAL} strokeWidth={2} />
                  <span className="text-sm" style={{ color: '#4A5568' }}>{job.job_type}</span>
                </>
              )}
            </div>
          )}

          {job.salary && (
            <Row icon={<DollarSign size={12} color={TEAL} strokeWidth={2} />}>
              <span className="text-sm" style={{ color: '#4A5568' }}>{job.salary}</span>
            </Row>
          )}
        </div>

        {/* ── Expanded: description, skills, notes, delete ── */}
        {expanded && hasDetails && (
          <div
            className="mb-3 pt-3 space-y-2.5 border-t"
            style={{ borderColor: 'rgba(27,107,127,0.12)' }}
          >
            {job.description && (
              <p className="text-xs leading-relaxed" style={{ color: '#4A5568' }}>
                {job.description}
              </p>
            )}

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skills.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'rgba(93,217,208,0.18)', color: TEAL }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {job.notes && (
              <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(27,107,127,0.65)' }}>
                {job.notes}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#5A6472' }}
              >
                <Archive size={11} strokeWidth={2} />
                Archive
              </button>
              <span style={{ color: 'rgba(27,107,127,0.2)' }}>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#DC2626' }}
              >
                <Trash2 size={11} strokeWidth={2} />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="h-px mb-3" style={{ backgroundColor: 'rgba(27,107,127,0.1)' }} />

        {/* ── Bottom row ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Date applied */}
          {job.date_applied ? (
            <div className="flex items-center gap-1.5">
              <Clock size={11} color="rgba(27,107,127,0.45)" strokeWidth={2} />
              <span className="text-xs" style={{ color: 'rgba(27,107,127,0.55)' }}>
                {formatShortDate(job.date_applied)}
              </span>
            </div>
          ) : <div />}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <ActionBtn
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              label="Edit job"
              bg="rgba(27,107,127,0.1)"
            >
              <Pencil size={12} color={TEAL} strokeWidth={2} />
            </ActionBtn>

            {hasDetails && (
              <ActionBtn
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                label={expanded ? 'Collapse' : 'View details'}
                bg={expanded ? TEAL : 'rgba(27,107,127,0.1)'}
              >
                {expanded
                  ? <EyeOff size={12} color="white" strokeWidth={2} />
                  : <Eye    size={12} color={TEAL}  strokeWidth={2} />}
              </ActionBtn>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ backgroundColor: CREAM, border: '1.5px solid rgba(27,107,127,0.2)' }}
                aria-label="Open job URL"
              >
                <ExternalLink size={12} color={TEAL} strokeWidth={2} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      {children}
    </div>
  );
}

function ActionBtn({
  onClick, label, bg, children,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
      style={{ backgroundColor: bg }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
