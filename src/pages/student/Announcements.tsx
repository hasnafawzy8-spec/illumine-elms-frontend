import { useEffect, useMemo, useState } from 'react';
import { Badge, PageHeader } from '../../components/ui';
import { Announcement, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  announcements: Announcement[];
}

type BadgeColor = 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'teal' | 'slate';

const categories = ['General', 'Class', 'Exam', 'Payment', 'Course', 'Holiday'];

const catColors: Record<string, BadgeColor> = {
  Class: 'blue',
  Payment: 'amber',
  Exam: 'red',
  Course: 'green',
  Holiday: 'teal',
  General: 'slate',
};

const priorityPill: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700',
  Low: 'border-slate-200 bg-slate-50 text-slate-600',
};

const categoryLabel = (category: string) => {
  const normalized = String(category || '').trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'General';
};

const dateValue = (date: string) => {
  const value = new Date(date).getTime();
  return Number.isFinite(value) ? value : 0;
};

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 17H9m10-2h-1V9a6 6 0 0 0-12 0v6H5a2 2 0 0 0-2 2h18a2 2 0 0 0-2-2ZM10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const normalized = priority || 'Low';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${priorityPill[normalized] || priorityPill.Low}`}>
      {normalized} Priority
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Announcements({ navigate: _navigate, announcements }: Props) {
  const [anns, setAnns] = useState<Announcement[]>(announcements);
  const [filter, setFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    setAnns(announcements);
  }, [announcements]);

  const markRead = (id: string) => {
    setAnns(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllRead = () => {
    setAnns(prev => prev.map(a => ({ ...a, read: true })));
  };

  const unread = anns.filter(a => !a.read).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return anns
      .filter(a => !filter || categoryLabel(a.category).toUpperCase() === filter.toUpperCase())
      .filter(a => !priorityFilter || String(a.priority).toUpperCase() === priorityFilter.toUpperCase())
      .filter(a => {
        if (!term) return true;
        return [a.title, a.description, a.category, a.targetAudience, a.courseName, a.className]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const dateDiff = dateValue(b.date) - dateValue(a.date);
        if (dateDiff !== 0) return dateDiff;
        if (a.read !== b.read) return a.read ? 1 : -1;
        return a.title.localeCompare(b.title);
      });
  }, [anns, filter, priorityFilter, search]);

  const openAnnouncement = (ann: Announcement) => {
    setSelected(ann);
    markRead(ann.id);
  };

  return (
    <div className="fade-in-up space-y-5">
      <PageHeader
        title="Announcements"
        subtitle={unread > 0 ? `${unread} unread update${unread !== 1 ? 's' : ''}` : 'All updates are read'}
        action={unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#1E6BB8] hover:text-[#1E6BB8]"
          >
            Mark all read
          </button>
        )}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <label className="relative block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search announcements, courses, classes..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1E6BB8] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <select
            value={priorityFilter}
            onChange={event => setPriorityFilter(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1E6BB8] focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${!filter ? 'bg-[#1E6BB8] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All <span className="ml-1 opacity-80">{anns.length}</span>
          </button>
          {categories.map(cat => {
            const count = anns.filter(ann => categoryLabel(ann.category) === cat).length;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setFilter(filter === cat ? '' : cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${filter === cat ? 'bg-[#1E6BB8] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat} <span className="ml-1 opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <BellIcon />
          </div>
          <h3 className="font-bold text-slate-800">No announcements found</h3>
          <p className="mt-1 text-sm text-slate-500">Try changing the search text or filters.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E6BB8]">Latest Updates</p>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''} showing</p>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(ann => {
              const cat = categoryLabel(ann.category);
              const priority = String(ann.priority || 'Low');
              return (
                <button
                  type="button"
                  key={ann.id}
                  onClick={() => openAnnouncement(ann)}
                  className={`group w-full px-5 py-4 text-left transition hover:bg-slate-50 ${!ann.read ? 'bg-blue-50/30' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge color={catColors[cat] || 'blue'}>{cat}</Badge>
                        <PriorityPill priority={priority} />
                        {!ann.read && <Badge color="blue">New</Badge>}
                      </div>
                      <h3 className="truncate text-base font-bold text-slate-900 font-display">{ann.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{ann.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                        <span>Published: {ann.date}</span>
                        <span className="text-slate-300">|</span>
                        <span>Audience: {ann.targetAudience}</span>
                        {ann.courseName && <span className="text-slate-300">|</span>}
                        {ann.courseName && <span>Course: {ann.courseName}</span>}
                        {ann.className && <span className="text-slate-300">|</span>}
                        {ann.className && <span>Class: {ann.className}</span>}
                      </div>
                    </div>
                    <div className="pt-6">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-[#1E6BB8] group-hover:bg-white group-hover:text-[#1E6BB8]">
                        <ChevronIcon />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl fade-in-up">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge color={catColors[categoryLabel(selected.category)] || 'blue'}>{categoryLabel(selected.category)}</Badge>
                    <PriorityPill priority={String(selected.priority)} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">{selected.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.date} · {selected.targetAudience}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                  aria-label="Close announcement"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <p className="text-base leading-8 text-slate-700">{selected.description}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</p>
                  <p className="mt-1 font-semibold text-slate-800">{categoryLabel(selected.category)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Audience</p>
                  <p className="mt-1 font-semibold text-slate-800">{selected.targetAudience}</p>
                </div>
                {selected.courseName && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Course</p>
                    <p className="mt-1 font-semibold text-slate-800">{selected.courseName}</p>
                  </div>
                )}
                {selected.className && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class</p>
                    <p className="mt-1 font-semibold text-slate-800">{selected.className}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
