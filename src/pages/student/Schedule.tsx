import { useMemo, useState } from 'react';
import { Badge, Card, PageHeader } from '../../components/ui';
import { ClassSession, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  sessions: ClassSession[];
  enrolledCourseIds?: string[];
  studentEnrollments?: any[];
}

type ScheduleTab = 'upcoming' | 'completed' | 'links';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };
  const strokeProps = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'calendar':
      return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
    case 'video':
      return <svg {...common}><path {...strokeProps} d="M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" /><path {...strokeProps} d="m16 10 4-2v8l-4-2" /></svg>;
    case 'lock':
      return <svg {...common}><path {...strokeProps} d="M7 11V8a5 5 0 0 1 10 0v3" /><path {...strokeProps} d="M6 11h12v10H6V11Z" /></svg>;
    case 'link':
      return <svg {...common}><path {...strokeProps} d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07l-1.1 1.1" /><path {...strokeProps} d="M14 11a5 5 0 0 0-7.54-.54l-1.92 1.92a5 5 0 0 0 7.07 7.07l1.1-1.1" /></svg>;
    case 'copy':
      return <svg {...common}><path {...strokeProps} d="M8 8h11v11H8V8Z" /><path {...strokeProps} d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" /></svg>;
    case 'check':
      return <svg {...common}><path {...strokeProps} d="m5 12 4 4L19 6" /></svg>;
    case 'clock':
      return <svg {...common}><path {...strokeProps} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path {...strokeProps} d="M12 6v6l4 2" /></svg>;
    case 'teacher':
      return <svg {...common}><path {...strokeProps} d="M20 21a8 8 0 0 0-16 0" /><path {...strokeProps} d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg>;
    case 'arrow':
      return <svg {...common}><path {...strokeProps} d="M5 12h14" /><path {...strokeProps} d="m13 6 6 6-6 6" /></svg>;
    case 'empty':
      return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path {...strokeProps} d="M9 14h6" /></svg>;
    default:
      return null;
  }
}

function parseSessionDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function getPlatformColor(platform?: string) {
  const lower = (platform || '').toLowerCase();
  if (lower.includes('zoom')) return 'purple';
  if (lower.includes('meet') || lower.includes('google')) return 'green';
  if (lower.includes('team')) return 'blue';
  return 'slate';
}

function getJoinHost(link?: string) {
  if (!link) return 'No link published';
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return 'Class link';
  }
}

export default function Schedule({ navigate, sessions, enrolledCourseIds = [], studentEnrollments = [] }: Props) {
  const [tab, setTab] = useState<ScheduleTab>('upcoming');
  const [joinModal, setJoinModal] = useState<ClassSession | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const datedSessions = useMemo(
    () => sessions
      .map(session => ({ session, parsedDate: parseSessionDate(session.date) }))
      .filter(item => item.parsedDate) as { session: ClassSession; parsedDate: Date }[],
    [sessions]
  );
  const firstScheduleDate = datedSessions[0]?.parsedDate || new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(firstScheduleDate.getFullYear(), firstScheduleDate.getMonth(), 1));

  const isEnrollmentApproved = (courseId?: string, classId?: string) => {
    if (studentEnrollments.length > 0) {
      return studentEnrollments.some(e => {
        const matchesCourse = (e.course?._id || e.course?.id || e.course) === courseId;
        const matchesClass = classId && ((e.class?._id || e.class?.id || e.class) === classId);
        return (matchesCourse || matchesClass) && e.status === 'APPROVED';
      });
    }
    return courseId ? enrolledCourseIds.includes(courseId) : false;
  };

  const upcoming = sessions.filter(s => s.status === 'Upcoming');
  const completed = sessions.filter(s => s.status === 'Completed');
  const linkSessions = sessions.filter(s => s.joinLink);
  const displayed = tab === 'completed' ? completed : upcoming;

  const unlockedLinks = linkSessions.filter(s => isEnrollmentApproved(s.courseId, s.classId)).length;
  const lockedLinks = Math.max(0, linkSessions.length - unlockedLinks);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    datedSessions.forEach(({ session, parsedDate }) => {
      const key = dateKey(parsedDate);
      map.set(key, [...(map.get(key) || []), session]);
    });
    return map;
  }, [datedSessions]);

  const courseLinkGroups = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    linkSessions.forEach(session => {
      const key = session.courseId || session.courseName;
      map.set(key, [...(map.get(key) || []), session]);
    });
    return Array.from(map.entries()).map(([key, courseSessions]) => ({
      key,
      courseName: courseSessions[0]?.courseName || 'Course',
      teacher: courseSessions[0]?.teacher || 'Course Instructor',
      sessions: courseSessions,
    }));
  }, [linkSessions]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay.getDay() }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1)),
    ];
  }, [monthDate]);

  const changeMonth = (amount: number) => {
    setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const statusColor = (status: string) => {
    if (status === 'Upcoming') return 'blue';
    if (status === 'Completed') return 'green';
    if (status === 'Cancelled') return 'red';
    return 'slate';
  };

  const copyLink = async (session: ClassSession) => {
    if (!session.joinLink) return;
    try {
      await navigator.clipboard.writeText(session.joinLink);
      setCopiedId(session.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  const openClass = (session: ClassSession) => {
    if (session.joinLink && isEnrollmentApproved(session.courseId, session.classId)) {
      setJoinModal(session);
    }
  };

  const renderLinkStatus = (session: ClassSession) => {
    const approved = isEnrollmentApproved(session.courseId, session.classId);
    return approved ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
        <Icon name="check" className="h-3.5 w-3.5" /> Ready
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
        <Icon name="lock" className="h-3.5 w-3.5" /> Locked
      </span>
    );
  };

  return (
    <div className="fade-in-up space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader title="My Class Schedule" subtitle="Each course link is organized clearly, with access shown before you join." />
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ['Upcoming', upcoming.length],
            ['Links', linkSessions.length],
            ['Ready', unlockedLinks],
          ].map(([label, value]) => (
            <div key={label} className="min-w-24 rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="font-display text-xl font-extrabold text-slate-950">{value}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Calendar</p>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{formatMonthTitle(monthDate)}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50">‹</button>
              <button onClick={() => changeMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50">›</button>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-2 py-2 text-center text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{day}</div>
              ))}
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`blank-${index}`} />;
                const daySessions = sessionsByDate.get(dateKey(date)) || [];
                const hasClass = daySessions.length > 0;
                return (
                  <button
                    key={dateKey(date)}
                    type="button"
                    onClick={() => hasClass && setTab('upcoming')}
                    className={`min-h-20 rounded-2xl border p-2 text-left transition-all ${
                      hasClass
                        ? 'border-blue-100 bg-blue-50/80 text-[#1E6BB8] hover:border-[#1E6BB8]/30 hover:bg-blue-100'
                        : 'border-transparent text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{date.getDate()}</span>
                    {hasClass && (
                      <div className="mt-2 space-y-1">
                        {daySessions.slice(0, 2).map(session => (
                          <span key={session.id} className="block truncate rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold text-slate-700">
                            {session.courseName}
                          </span>
                        ))}
                        {daySessions.length > 2 && <span className="text-[10px] font-bold text-[#1E6BB8]">+{daySessions.length - 2} more</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Course Links</p>
            <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Class access by course</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">Each course keeps its own online class link so students do not mix them up.</p>
          </div>
          <div className="max-h-[34rem] overflow-y-auto p-5">
            {courseLinkGroups.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-8 text-center">
                <Icon name="link" className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-extrabold text-slate-700">No course links yet</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Links appear after your teacher or admin publishes class sessions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courseLinkGroups.map(group => (
                  <div key={group.key} className="rounded-3xl border border-slate-200 p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-display text-lg font-extrabold text-slate-900">{group.courseName}</h4>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-400">{group.teacher}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#1E6BB8]">{group.sessions.length} link{group.sessions.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="space-y-2">
                      {group.sessions.map(session => {
                        const approved = isEnrollmentApproved(session.courseId, session.classId);
                        return (
                          <div key={session.id} className="rounded-2xl bg-slate-50 p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {renderLinkStatus(session)}
                                  <Badge color={getPlatformColor(session.platform) as any}>{session.platform || session.mode}</Badge>
                                </div>
                                <p className="mt-2 truncate text-sm font-extrabold text-slate-800">{session.day}, {session.startTime} - {session.endTime}</p>
                                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{getJoinHost(session.joinLink)}</p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyLink(session)}
                                  disabled={!approved}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#1E6BB8] disabled:cursor-not-allowed disabled:opacity-40"
                                  title={approved ? 'Copy class link' : 'Link available after approval'}
                                >
                                  {copiedId === session.id ? <Icon name="check" className="h-4 w-4" /> : <Icon name="copy" className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openClass(session)}
                                  disabled={!approved}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E6BB8] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#155a9c] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                  Open <Icon name="arrow" className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex w-fit gap-1 rounded-2xl bg-slate-100 p-1">
        {([
          ['upcoming', `Upcoming (${upcoming.length})`],
          ['completed', `Completed (${completed.length})`],
          ['links', `All Links (${linkSessions.length})`],
        ] as [ScheduleTab, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all ${
              tab === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'links' ? (
        <Card className="rounded-[2rem] border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Published links', linkSessions.length, 'blue'],
              ['Ready to join', unlockedLinks, 'green'],
              ['Waiting approval', lockedLinks, 'amber'],
            ].map(([label, value, color]) => (
              <div key={label} className={`rounded-3xl p-5 ${color === 'green' ? 'bg-green-50' : color === 'amber' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : displayed.length === 0 ? (
        <Card className="rounded-[2rem] border-slate-200 bg-white p-12">
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-blue-50 text-[#1E6BB8]">
              <Icon name="empty" className="h-10 w-10" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-extrabold text-slate-950">No {tab} classes</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Your {tab} classes will appear here after your enrollment is approved and the teacher publishes the schedule.
            </p>
            <button
              onClick={() => navigate('student-courses')}
              className="mt-5 rounded-2xl bg-[#1E6BB8] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#155a9c]"
            >
              Browse Courses
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {displayed.map(session => {
            const parsedDate = parseSessionDate(session.date);
            const approved = isEnrollmentApproved(session.courseId, session.classId);
            const monthStr = parsedDate ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parsedDate) : 'DATE';
            const dayNum = parsedDate ? new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(parsedDate) : '';

            return (
              <Card key={session.id} className="overflow-hidden rounded-[2rem] border-slate-200 bg-white">
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-3xl bg-[#eff6ff]">
                      <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1E6BB8]">{monthStr}</span>
                      <span className="font-display text-3xl font-extrabold leading-none text-[#1E6BB8]">{dayNum}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge color={statusColor(session.status) as any}>{session.status}</Badge>
                        <Badge color={session.mode === 'Online' ? 'blue' : 'amber'}>{session.mode}</Badge>
                        {renderLinkStatus(session)}
                      </div>
                      <h3 className="font-display text-xl font-extrabold text-slate-900">{session.courseName}</h3>
                      <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-500 sm:grid-cols-2">
                        <span className="inline-flex items-center gap-2"><Icon name="teacher" className="h-4 w-4 text-slate-400" /> {session.teacher}</span>
                        <span className="inline-flex items-center gap-2"><Icon name="clock" className="h-4 w-4 text-slate-400" /> {session.startTime} - {session.endTime}</span>
                        <span className="inline-flex items-center gap-2"><Icon name="video" className="h-4 w-4 text-slate-400" /> {session.platform || session.mode}</span>
                        <span className="inline-flex items-center gap-2"><Icon name="link" className="h-4 w-4 text-slate-400" /> {session.joinLink ? getJoinHost(session.joinLink) : 'No link published'}</span>
                      </div>
                    </div>
                  </div>

                  {session.status === 'Upcoming' && session.joinLink && (
                    <div className="flex shrink-0 flex-col gap-2 lg:w-48">
                      <button
                        onClick={() => copyLink(session)}
                        disabled={!approved}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 hover:text-[#1E6BB8] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copiedId === session.id ? <Icon name="check" className="h-4 w-4" /> : <Icon name="copy" className="h-4 w-4" />}
                        {copiedId === session.id ? 'Copied' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => openClass(session)}
                        disabled={!approved}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E6BB8] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#155a9c] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {approved ? 'Join Class' : 'Pending Approval'} <Icon name={approved ? 'arrow' : 'lock'} className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {session.status === 'Completed' && (
                    <Badge color="green" className="self-start lg:self-center">Class Completed</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {joinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setJoinModal(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl fade-in-up">
            <div className="bg-[#0F3B66] p-6 text-white">
              <button onClick={() => setJoinModal(null)} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20">×</button>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Icon name="video" className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-extrabold">Join {joinModal.courseName}</h2>
              <p className="mt-2 text-sm font-medium text-blue-100">Check the course and platform before opening the class link.</p>
            </div>

            <div className="p-6">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                {[
                  ['Course', joinModal.courseName],
                  ['Teacher', joinModal.teacher],
                  ['Date & Time', `${joinModal.day}, ${joinModal.startTime} - ${joinModal.endTime}`],
                  ['Platform', joinModal.platform || joinModal.mode],
                  ['Link', getJoinHost(joinModal.joinLink)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-slate-200/70 py-2 last:border-0">
                    <span className="font-bold text-slate-400">{label}</span>
                    <span className="text-right font-extrabold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-700">
                Open the link only for this course. If the meeting opens in another app, confirm the course name before joining.
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                <button
                  type="button"
                  onClick={() => copyLink(joinModal)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-extrabold text-slate-600 hover:text-[#1E6BB8]"
                >
                  {copiedId === joinModal.id ? <Icon name="check" className="h-4 w-4" /> : <Icon name="copy" className="h-4 w-4" />}
                  {copiedId === joinModal.id ? 'Copied' : 'Copy Link'}
                </button>
                <a
                  href={joinModal.joinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setJoinModal(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E6BB8] px-5 py-3 font-extrabold text-white hover:bg-[#155a9c]"
                >
                  Open {joinModal.platform || 'Class'} <Icon name="arrow" className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
