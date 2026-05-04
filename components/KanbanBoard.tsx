'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search, Plus, AlignJustify, LogOut, User,
  Inbox, Send, MessageCircle, FolderOpen,
  Filter, ChevronDown, X, Moon, Sun,
  Archive, ArchiveRestore, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import JobCard from './JobCard';
import AddJobModal from './AddJobModal';
import EditJobModal from './EditJobModal';

// ─── Constants ───────────────────────────────────────────────
const TEAL   = '#1B6B7F';
const ORANGE = '#C45D2E';
const CREAM  = '#F5F1E8';

const COLUMNS = [
  { id: 'pool',         title: 'Job Pool',     bg: '#B85C38', Icon: Inbox         },
  { id: 'applied',      title: 'Applied',      bg: '#1B6B7F', Icon: Send          },
  { id: 'interviewing', title: 'Interviewing', bg: '#C4844A', Icon: MessageCircle },
  { id: 'closed',       title: 'Closed',       bg: '#5A6472', Icon: FolderOpen    },
];

const COL_COLOR: Record<string, string> = Object.fromEntries(COLUMNS.map(c => [c.id, c.bg]));

const STATUS_LABELS: Record<string, string> = {
  pool: 'Job Pool', applied: 'Applied', interviewing: 'Interviewing', closed: 'Closed',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: '#16A34A', medium: ORANGE, high: '#DC2626',
};

// ─── Types ───────────────────────────────────────────────────
interface FilterState {
  statuses:   string[];
  priorities: string[];
  dateFrom:   string;
  dateTo:     string;
}
const EMPTY_FILTERS: FilterState = { statuses: [], priorities: [], dateFrom: '', dateTo: '' };

// ─── Theme helper ────────────────────────────────────────────
function mkTheme(dark: boolean) {
  return {
    bg:           dark ? '#0D1B2A' : CREAM,
    dotColor:     dark ? 'rgba(93,217,208,0.08)' : 'rgba(27,107,127,0.1)',
    nav:          dark ? '#071018' : '#1A2E3B',
    surface:      dark ? '#1A2B3C' : 'white',
    border:       dark ? 'rgba(93,217,208,0.18)' : 'rgba(27,107,127,0.22)',
    borderLight:  dark ? 'rgba(93,217,208,0.1)'  : 'rgba(27,107,127,0.1)',
    text:         dark ? '#CBD5E1' : TEAL,
    textStrong:   dark ? '#E2E8F0' : '#1A202C',
    textMuted:    dark ? 'rgba(203,213,225,0.45)' : 'rgba(27,107,127,0.45)',
    pillBg:       dark ? 'rgba(93,217,208,0.1)'  : 'rgba(27,107,127,0.07)',
    divider:      dark ? 'rgba(93,217,208,0.1)'  : 'rgba(27,107,127,0.1)',
    inputText:    dark ? '#CBD5E1' : TEAL,
    placeholder:  dark ? 'rgba(203,213,225,0.35)' : 'rgba(27,107,127,0.35)',
  };
}

// ─── FilterPanel ─────────────────────────────────────────────
function FilterPanel({
  filters, setFilters, onClose, isDark,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const t = mkTheme(isDark);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggle = (key: 'statuses' | 'priorities', val: string) =>
    setFilters({
      ...filters,
      [key]: filters[key].includes(val)
        ? filters[key].filter(v => v !== val)
        : [...filters[key], val],
    });

  const hasFilters = filters.statuses.length > 0 || filters.priorities.length > 0 || filters.dateFrom || filters.dateTo;

  const Pill = ({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        backgroundColor: active ? color : t.pillBg,
        color:           active ? 'white' : t.text,
        border:          `1.5px solid ${active ? color : 'transparent'}`,
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl z-30 p-5 w-80"
      style={{ backgroundColor: t.surface, border: `1.5px solid ${t.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: t.text }}>Filters</p>
        {hasFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: ORANGE }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mb-4">
        <p className="text-xs font-bold mb-2" style={{ color: t.textMuted }}>STATUS</p>
        <div className="flex flex-wrap gap-1.5">
          {COLUMNS.map(col => (
            <Pill
              key={col.id}
              active={filters.statuses.includes(col.id)}
              color={col.bg}
              onClick={() => toggle('statuses', col.id)}
            >
              {STATUS_LABELS[col.id]}
            </Pill>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="mb-4">
        <p className="text-xs font-bold mb-2" style={{ color: t.textMuted }}>PRIORITY</p>
        <div className="flex gap-1.5">
          {(['low', 'medium', 'high'] as const).map(p => (
            <Pill
              key={p}
              active={filters.priorities.includes(p)}
              color={PRIORITY_COLORS[p]}
              onClick={() => toggle('priorities', p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Pill>
          ))}
        </div>
      </div>

      {/* Date Applied Range */}
      <div>
        <p className="text-xs font-bold mb-2" style={{ color: t.textMuted }}>DATE APPLIED</p>
        <div className="grid grid-cols-2 gap-2">
          {(['dateFrom', 'dateTo'] as const).map((key, i) => (
            <div key={key}>
              <p className="text-xs mb-1" style={{ color: t.textMuted }}>{i === 0 ? 'From' : 'To'}</p>
              <input
                type="date"
                value={filters[key]}
                onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                className="w-full text-xs rounded-xl px-3 py-2 outline-none border-2 transition-colors focus:border-[#5DD9D0]"
                style={{
                  backgroundColor: t.pillBg,
                  borderColor: t.borderLight,
                  color: t.text,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ArchivedSection ─────────────────────────────────────────
function ArchivedSection({
  jobs, onUnarchive, onDelete, isDark,
}: {
  jobs: any[];
  onUnarchive: (id: string) => void;
  onDelete:    (id: string) => void;
  isDark: boolean;
}) {
  const t = mkTheme(isDark);

  if (jobs.length === 0) {
    return (
      <p className="text-sm" style={{ color: t.textMuted }}>No archived jobs.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {jobs.map(job => (
        <div
          key={job.id}
          className="rounded-2xl p-3.5 border"
          style={{ backgroundColor: t.surface, borderColor: t.borderLight, opacity: 0.85 }}
        >
          <p
            className="text-xs font-black uppercase tracking-wide leading-snug mb-1 line-clamp-2"
            style={{ color: t.text }}
          >
            {job.title}
          </p>
          {job.company && (
            <p className="text-xs mb-3" style={{ color: t.textMuted }}>{job.company}</p>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUnarchive(job.id)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'rgba(27,107,127,0.12)', color: TEAL }}
            >
              <ArchiveRestore size={11} strokeWidth={2} />
              Restore
            </button>
            <button
              onClick={() => onDelete(job.id)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#DC2626' }}
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KanbanBoard ─────────────────────────────────────────────
export default function KanbanBoard({
  userId, userName, onLogout,
}: {
  userId: string;
  userName: string;
  onLogout: () => void;
}) {
  const [jobs, setJobs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob]   = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [compact, setCompact]         = useState(false);
  const [isDark, setIsDark]           = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState<FilterState>(EMPTY_FILTERS);
  const [showArchived, setShowArchived] = useState(false);

  // Initialise dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ck-dark') === 'true';
    setIsDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('ck-dark', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  useEffect(() => { fetchJobs(); }, [userId]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching jobs:', error);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId;
    setJobs(prev => prev.map(j => j.id === draggableId ? { ...j, status: newStatus } : j));
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', draggableId);
    if (error) { console.error('Drag update failed:', error.message); fetchJobs(); }
  };

  const handleDeleteJob = async (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) { console.error('Delete failed:', error); fetchJobs(); }
  };

  const handleArchiveJob = async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, archived: true } : j));
    const { error } = await supabase.from('jobs').update({ archived: true }).eq('id', jobId);
    if (error) { console.error('Archive failed:', error.message); fetchJobs(); }
  };

  const handleUnarchiveJob = async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, archived: false } : j));
    const { error } = await supabase.from('jobs').update({ archived: false }).eq('id', jobId);
    if (error) { console.error('Unarchive failed:', error.message); fetchJobs(); }
  };

  const handleAddJob    = () => { fetchJobs(); setIsModalOpen(false); };
  const handleJobUpdated = (updated: any) => setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));

  // ── Filtering logic (search + filters combined) ──
  const q = searchQuery.toLowerCase();
  const visibleJobs = jobs.filter(job => {
    if (job.archived) return false;
    if (q && !job.title?.toLowerCase().includes(q) && !job.company?.toLowerCase().includes(q) && !job.location?.toLowerCase().includes(q)) return false;
    if (filters.statuses.length   > 0 && !filters.statuses.includes(job.status))     return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(job.priority)) return false;
    if (filters.dateFrom && job.date_applied && job.date_applied < filters.dateFrom)  return false;
    if (filters.dateTo   && job.date_applied && job.date_applied > filters.dateTo)    return false;
    return true;
  });

  const archivedJobs    = jobs.filter(j => j.archived);
  const activeFilters   = [filters.statuses.length > 0, filters.priorities.length > 0, !!(filters.dateFrom || filters.dateTo)].filter(Boolean).length;
  const isFiltered      = !!q || activeFilters > 0;

  const t = mkTheme(isDark);

  const boardStyle = {
    backgroundColor: t.bg,
    backgroundImage: `radial-gradient(${t.dotColor} 1.5px, transparent 1.5px)`,
    backgroundSize: '24px 24px',
    minHeight: '100vh',
  };

  return (
    <div style={boardStyle}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: t.nav }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ backgroundColor: TEAL }}>K</div>
          <div>
            <p className="text-white font-black text-sm tracking-widest uppercase leading-none">CareerKanban</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(93,217,208,0.7)' }}>AI-Powered Job Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            aria-label="Toggle dark mode"
          >
            {isDark
              ? <Sun  size={15} color="rgba(255,220,100,0.9)" />
              : <Moon size={15} color="rgba(255,255,255,0.65)" />}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <User size={13} color="rgba(255,255,255,0.55)" />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{userName}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(196,93,46,0.2)', color: '#F4A57C' }}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="px-6 py-6 max-w-screen-2xl mx-auto">

        {/* ── Search + Filters ── */}
        <div
          className="flex items-center rounded-2xl border-2 mb-5 overflow-visible"
          style={{ backgroundColor: t.surface, borderColor: t.border }}
        >
          <div className="flex items-center gap-3 flex-1 px-4 py-3">
            <Search size={15} color={t.textMuted} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, or location…"
              className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: t.inputText }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="transition-opacity hover:opacity-60">
                <X size={14} color={t.textMuted} />
              </button>
            )}
          </div>

          {/* Filter trigger */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-2 px-4 py-3 border-l-2 text-xs font-bold transition-colors"
              style={{
                borderColor: t.borderLight,
                color: activeFilters > 0 ? ORANGE : t.textMuted,
              }}
            >
              <Filter size={13} />
              Filters
              {activeFilters > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-xs font-black flex items-center justify-center text-white"
                  style={{ backgroundColor: ORANGE, fontSize: 9 }}
                >
                  {activeFilters}
                </span>
              )}
              <ChevronDown
                size={13}
                style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
              />
            </button>

            {showFilters && (
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onClose={() => setShowFilters(false)}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* ── Active filter summary ── */}
        {isFiltered && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: t.textMuted }}>Showing results for:</span>
            {q && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"
                style={{ backgroundColor: 'rgba(27,107,127,0.1)', color: TEAL }}>
                "{q}"
                <button onClick={() => setSearchQuery('')}><X size={10} /></button>
              </span>
            )}
            {filters.statuses.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 text-white"
                style={{ backgroundColor: COL_COLOR[s] }}>
                {STATUS_LABELS[s]}
                <button onClick={() => setFilters({ ...filters, statuses: filters.statuses.filter(x => x !== s) })}><X size={10} /></button>
              </span>
            ))}
            {filters.priorities.map(p => (
              <span key={p} className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 text-white"
                style={{ backgroundColor: PRIORITY_COLORS[p] }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
                <button onClick={() => setFilters({ ...filters, priorities: filters.priorities.filter(x => x !== p) })}><X size={10} /></button>
              </span>
            ))}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"
                style={{ backgroundColor: 'rgba(196,93,46,0.12)', color: ORANGE }}>
                {filters.dateFrom || '…'} → {filters.dateTo || '…'}
                <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })}><X size={10} /></button>
              </span>
            )}
            <button onClick={() => { setSearchQuery(''); setFilters(EMPTY_FILTERS); }}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: t.textMuted }}>
              Clear all
            </button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2.5 mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Job
          </button>

          <button
            onClick={() => setCompact(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
            style={{
              borderColor:     compact ? TEAL : t.border,
              color:           compact ? TEAL : t.textMuted,
              backgroundColor: compact ? (isDark ? 'rgba(93,217,208,0.1)' : 'rgba(27,107,127,0.07)') : t.surface,
            }}
          >
            <AlignJustify size={14} />
            Compact
          </button>

          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
            style={{
              borderColor:     showArchived ? '#5A6472' : t.border,
              color:           showArchived ? 'white'  : t.textMuted,
              backgroundColor: showArchived ? '#5A6472' : t.surface,
            }}
          >
            <Archive size={14} />
            Archived
            {archivedJobs.length > 0 && (
              <span
                className="text-xs font-black px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: showArchived ? 'rgba(255,255,255,0.25)' : 'rgba(90,100,114,0.15)',
                  color: showArchived ? 'white' : '#5A6472',
                  fontSize: 10,
                }}
              >
                {archivedJobs.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Board ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3">
            <div
              className="w-7 h-7 rounded-full animate-spin"
              style={{ border: `3px solid ${t.border}`, borderTopColor: TEAL }}
            />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading your board…</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-4 gap-5 items-start">
              {COLUMNS.map(col => {
                const colJobs = visibleJobs.filter(j => j.status === col.id);
                const count   = colJobs.length;

                return (
                  <div key={col.id} className="flex flex-col gap-3 min-w-0">
                    {/* Column header */}
                    <div
                      className="rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm"
                      style={{ backgroundColor: col.bg }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <col.Icon size={17} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-white leading-none truncate">
                            {col.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {count} {count === 1 ? 'job' : 'jobs'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <Plus size={14} color="white" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Drop zone */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="rounded-2xl transition-all duration-150 p-1"
                          style={{
                            minHeight: 120,
                            backgroundColor: snapshot.isDraggingOver ? `${col.bg}1A` : 'transparent',
                            border: `2px dashed ${snapshot.isDraggingOver ? `${col.bg}90` : 'transparent'}`,
                          }}
                        >
                          <div className="space-y-3">
                            {colJobs.map((job, index) => (
                              <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity:   snapshot.isDragging ? 0.88 : 1,
                                      transform: snapshot.isDragging
                                        ? `${provided.draggableProps.style?.transform} rotate(1.5deg)`
                                        : provided.draggableProps.style?.transform,
                                    }}
                                  >
                                    <JobCard
                                      job={job}
                                      compact={compact}
                                      onDelete={() => handleDeleteJob(job.id)}
                                      onArchive={() => handleArchiveJob(job.id)}
                                      onEdit={() => setEditingJob(job)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>

                          {provided.placeholder}

                          {colJobs.length === 0 && !snapshot.isDraggingOver && (
                            <div
                              className="flex items-center justify-center rounded-xl border-2 border-dashed mt-1"
                              style={{ height: 80, borderColor: `${col.bg}35` }}
                            >
                              <p className="text-xs font-medium" style={{ color: `${col.bg}70` }}>
                                Drop cards here
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* ── Archived section ── */}
        {showArchived && (
          <div
            className="mt-10 pt-8 border-t-2"
            style={{ borderColor: t.divider }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Archive size={16} color={t.textMuted} strokeWidth={2} />
              <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: t.textMuted }}>
                Archived Jobs
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: t.pillBg, color: t.textMuted }}>
                {archivedJobs.length}
              </span>
            </div>
            <ArchivedSection
              jobs={archivedJobs}
              onUnarchive={handleUnarchiveJob}
              onDelete={handleDeleteJob}
              isDark={isDark}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AddJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        onJobAdded={handleAddJob}
      />

      {editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={true}
          onClose={() => setEditingJob(null)}
          onJobUpdated={handleJobUpdated}
        />
      )}
    </div>
  );
}
