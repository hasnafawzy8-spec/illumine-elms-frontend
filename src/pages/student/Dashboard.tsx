import { Button, Card, Badge } from '../../components/ui';
import { courses as initialCourses } from '../../data';
import { Announcement, ClassSession, Course, Order, Payment, View } from '../../types';

interface Props {
  navigate: (view: View) => void;
  enrolledCourseIds: string[];
  cartCount: number;
  user?: { firstName?: string } | null;
  payments: Payment[];
  orders: Order[];
  courses?: Course[];
  sessions: ClassSession[];
  announcements: Announcement[];
  hasEnrolledCourses: boolean;
}

export default function StudentDashboard({ navigate, enrolledCourseIds, cartCount, user, payments, orders, courses = initialCourses, sessions, announcements, hasEnrolledCourses }: Props) {
  const enrolled = courses.filter(c => enrolledCourseIds.includes(c.id));
  const upcoming = sessions.filter(s => s.status === 'Upcoming');
  const unread = announcements.filter(a => !a.read);
  const pendingPayments = payments.filter(p => p.status === 'Pending');
  const pendingOrders = orders.filter(o => ['Pending', 'Confirmed', 'Ready for Collection', 'Processing'].includes(o.status));
  const paidTotal = payments.filter(p => p.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
  const activeCourseNames = enrolled.slice(0, 3).map(c => c.name.split(':')[0].split('-')[0].trim());

  const nextClass = upcoming[0];
  const studentName = user?.firstName || 'Student';
  const heroSubtitle = hasEnrolledCourses
    ? 'Your live classes, resources, book orders, and payments are ready in one place.'
    : 'Choose your first English course and start learning online with Illumine.';

  const stats = [
    {
      label: 'Active Courses',
      value: enrolledCourseIds.length,
      detail: activeCourseNames.join(', ') || 'No courses yet',
      view: 'student-my-courses' as View,
      tone: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Upcoming Classes',
      value: upcoming.length,
      detail: nextClass ? `${nextClass.day} at ${nextClass.startTime}` : 'Schedule is clear',
      view: 'student-schedule' as View,
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Cart Items',
      value: cartCount,
      detail: cartCount > 0 ? 'Ready for checkout' : 'No pending cart items',
      view: 'student-cart' as View,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Pending Payments',
      value: pendingPayments.length,
      detail: pendingPayments.length > 0 ? `Rs. ${pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}` : 'All clear',
      view: 'student-payment-history' as View,
      tone: 'from-rose-500 to-red-500',
    },
  ];

  const catColors: Record<string, 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'teal'> = {
    Class: 'blue', Payment: 'amber', Course: 'green', Holiday: 'teal', Exam: 'red', General: 'blue',
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] lg:p-7">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,107,184,0.95),rgba(15,23,42,0.94))]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative">
          <div>
            <p className="text-sm font-semibold text-blue-100">Good morning</p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {studentName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(nextClass ? 'student-schedule' : 'student-courses')}
                className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-slate-950 shadow-sm transition-colors hover:bg-blue-50"
              >
                {nextClass ? 'Open Next Class' : 'Find a Course'}
              </button>
              <Button size="sm" variant="outline" onClick={() => navigate('student-my-courses')} className="rounded-full border-white/50 bg-white/10 px-5 text-white hover:bg-white/20">
                My Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Optional assessment</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Check My English Level</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Take a short initial quiz for grammar, vocabulary and reading, then see course recommendations matched to your grade and learning goal.
            </p>
          </div>
          <div className="flex items-center justify-start border-t border-slate-100 bg-slate-50 p-5 lg:justify-end lg:border-l lg:border-t-0">
            <Button onClick={() => navigate('student-assessment')} className="rounded-2xl">
              Start Level Check
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(stat => (
          <button
            key={stat.label}
            type="button"
            onClick={() => navigate(stat.view)}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6BB8] focus-visible:ring-offset-2"
          >
            <div className={`mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r ${stat.tone}`} />
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-950">{stat.value}</p>
            <p className="mt-2 truncate text-sm font-medium text-slate-500">{stat.detail}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Live Learning</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Next Class</h2>
            </div>
            <button onClick={() => navigate('student-schedule')} className="text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c]">View full schedule</button>
          </div>

          {nextClass ? (
            <div className="p-5">
              <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(30,107,184,0.45),transparent_32%)]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Badge color="blue">{nextClass.mode}</Badge>
                    <h3 className="mt-3 font-display text-2xl font-extrabold">{nextClass.courseName}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-300">{nextClass.teacher}</p>
                    <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2">
                      <span className="rounded-2xl bg-white/10 px-4 py-3">{nextClass.day}, {nextClass.date}</span>
                      <span className="rounded-2xl bg-white/10 px-4 py-3">{nextClass.startTime} - {nextClass.endTime}</span>
                    </div>
                    {nextClass.platform && <p className="mt-3 text-sm text-slate-300">Platform: {nextClass.platform}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('student-schedule')}
                    className="rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-slate-950 shadow-sm transition-colors hover:bg-blue-50"
                  >
                    {nextClass.joinLink ? 'Join Class' : 'Open Schedule'}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {upcoming.slice(1, 4).map(cls => (
                  <div key={cls.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#1E6BB8]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{cls.courseName}</p>
                      <p className="text-xs font-medium text-slate-400">{cls.day} · {cls.startTime}</p>
                    </div>
                    <Badge color="blue">{cls.mode}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="font-display text-lg font-extrabold text-slate-900">No upcoming classes</p>
              <p className="mt-2 text-sm text-slate-500">Enroll in a course to unlock your class schedule and live links.</p>
              <Button onClick={() => navigate('student-courses')} className="mt-5 rounded-2xl">Browse Courses</Button>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Updates</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Announcements</h2>
            </div>
            <button onClick={() => navigate('student-announcements')} className="text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c]">View all</button>
          </div>

          {hasEnrolledCourses && announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.slice(0, 4).map(ann => (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => navigate('student-announcements')}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${!ann.read ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge color={catColors[ann.category] || 'blue'} className="text-[10px]">{ann.category}</Badge>
                    {!ann.read && <span className="h-2 w-2 rounded-full bg-[#1E6BB8]" />}
                  </div>
                  <p className="line-clamp-2 text-sm font-bold text-slate-800">{ann.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{ann.date}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-800">No announcements yet</p>
              <p className="mt-1 text-sm text-slate-500">Updates will appear here after enrollment.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Courses</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">My Learning Path</h2>
            </div>
            <button onClick={() => navigate('student-my-courses')} className="text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c]">Open</button>
          </div>
          {enrolled.length > 0 ? (
            <div className="space-y-3">
              {enrolled.slice(0, 3).map(course => (
                <button key={course.id} onClick={() => navigate('student-my-courses')} className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 text-left hover:bg-slate-50">
                  <img src={course.image} alt={course.name} className="h-14 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{course.name}</p>
                    <p className="text-xs font-medium text-slate-400">{course.teacher}</p>
                  </div>
                  <Badge color={course.status === 'Open' ? 'green' : 'slate'}>{course.status}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-800">Start your first course</p>
              <Button onClick={() => navigate('student-courses')} className="mt-4 rounded-2xl">Browse Courses</Button>
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-slate-950">Orders & Payments</h2>
              <button onClick={() => navigate('student-orders')} className="text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c]">View all</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-600">Active Orders</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">{pendingOrders.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Paid Total</p>
                <p className="mt-2 font-display text-lg font-extrabold text-slate-900">Rs. {paidTotal.toLocaleString()}</p>
              </div>
            </div>
            {orders[0] ? (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-extrabold text-slate-900">{orders[0].reference}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">{orders[0].items.length} item(s) · Rs. {orders[0].total.toLocaleString()}</p>
                <Badge color="purple" className="mt-3">{orders[0].status}</Badge>
              </div>
            ) : <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">No recent orders</p>}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display text-xl font-extrabold text-slate-950">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Courses', view: 'student-courses' as View, tone: 'bg-blue-50 text-blue-700' },
                { label: 'Schedule', view: 'student-schedule' as View, tone: 'bg-emerald-50 text-emerald-700' },
                { label: 'Books', view: 'student-books' as View, tone: 'bg-amber-50 text-amber-700' },
                { label: 'Payments', view: 'student-payment-history' as View, tone: 'bg-purple-50 text-purple-700' },
              ].map(action => (
                <button key={action.label} onClick={() => navigate(action.view)} className={`rounded-2xl p-4 text-left font-extrabold transition-transform hover:-translate-y-0.5 ${action.tone}`}>
                  {action.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
