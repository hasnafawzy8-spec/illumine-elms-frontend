import { Card, Badge } from '../../components/ui';
import { View, Course, Order, Payment, Announcement } from '../../types';

interface Props {
  navigate: (view: View) => void;
  courses: Course[];
  orders: Order[];
  payments: Payment[];
  announcements: Announcement[];
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'courses':
      return <svg {...common}><path {...stroke} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path {...stroke} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
    case 'seats':
      return <svg {...common}><path {...stroke} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><path {...stroke} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...stroke} d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>;
    case 'orders':
      return <svg {...common}><path {...stroke} d="m21 8-9-5-9 5 9 5 9-5Z" /><path {...stroke} d="M3 8v8l9 5 9-5V8" /><path {...stroke} d="M12 13v8" /></svg>;
    case 'payments':
      return <svg {...common}><path {...stroke} d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path {...stroke} d="M2 10h20M6 15h4" /></svg>;
    case 'revenue':
      return <svg {...common}><path {...stroke} d="M12 2v20" /><path {...stroke} d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'alert':
      return <svg {...common}><path {...stroke} d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" /><path {...stroke} d="M12 9v4M12 17h.01" /></svg>;
    case 'chart':
      return <svg {...common}><path {...stroke} d="M4 19V5M9 19v-8M14 19v-5M19 19V8" /><path {...stroke} d="M3 19h18" /></svg>;
    case 'announce':
      return <svg {...common}><path {...stroke} d="m3 11 18-5v12L3 13v-2Z" /><path {...stroke} d="M7 14v5a2 2 0 0 0 2 2h1" /></svg>;
    case 'arrow':
      return <svg {...common}><path {...stroke} d="M5 12h14" /><path {...stroke} d="m13 6 6 6-6 6" /></svg>;
    default:
      return null;
  }
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[1.35rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1E6BB8]/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6BB8] focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 group-hover:bg-blue-50 group-hover:text-[#1E6BB8]">
          Live
        </span>
      </div>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-500">{detail}</p>
    </button>
  );
}

export default function AdminDashboard({
  navigate,
  courses,
  orders,
  payments,
  announcements,
}: Props) {
  const pendingOrders = orders.filter(order => ['Pending', 'Preparing', 'Processing'].includes(order.status));
  const pendingPayments = payments.filter(payment => payment.status === 'Pending');
  const paidPayments = payments.filter(payment => payment.status === 'Paid');
  const totalRevenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const availableSeats = courses.reduce((total, course) => total + Number(course.availableSeats || 0), 0);
  const totalSeats = courses.reduce((total, course) => total + Number(course.totalSeats || course.availableSeats || 0), 0);
  const averageFee = courses.length
    ? Math.round(courses.reduce((total, course) => total + Number(course.monthlyFee || 0), 0) / courses.length)
    : 0;
  const operationalAlerts = pendingOrders.length + pendingPayments.length;
  const topCourses = [...courses]
    .sort((a, b) => Number(b.monthlyFee || 0) - Number(a.monthlyFee || 0))
    .slice(0, 6);
  const recentPayments = payments.slice(0, 4);

  const metrics = [
    {
      label: 'Active Courses',
      value: courses.length,
      detail: `Avg. fee Rs. ${averageFee.toLocaleString()}`,
      icon: 'courses',
      tone: 'bg-blue-50 text-blue-700',
      view: 'admin-courses' as View,
    },
    {
      label: 'Seat Capacity',
      value: availableSeats,
      detail: `${totalSeats || availableSeats} total seats tracked`,
      icon: 'seats',
      tone: 'bg-emerald-50 text-emerald-700',
      view: 'admin-classes' as View,
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.length,
      detail: orders.length ? `${orders.length} total book orders` : 'No orders yet',
      icon: 'orders',
      tone: 'bg-amber-50 text-amber-700',
      view: 'admin-orders' as View,
    },
    {
      label: 'Payment Review',
      value: pendingPayments.length,
      detail: pendingPayments.length ? 'Needs admin verification' : 'Queue is clear',
      icon: 'payments',
      tone: 'bg-rose-50 text-rose-700',
      view: 'admin-payments' as View,
    },
    {
      label: 'Paid Revenue',
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      detail: `${paidPayments.length} verified payment${paidPayments.length === 1 ? '' : 's'}`,
      icon: 'revenue',
      tone: 'bg-teal-50 text-teal-700',
      view: 'admin-reports' as View,
    },
    {
      label: 'Operations Alerts',
      value: operationalAlerts,
      detail: operationalAlerts ? 'Open admin tasks' : 'All clear',
      icon: 'alert',
      tone: 'bg-slate-100 text-slate-700',
      view: operationalAlerts ? 'admin-payments' as View : 'admin-reports' as View,
    },
  ];

  return (
    <div className="fade-in-up space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm lg:p-7">
        <div className="absolute inset-y-0 left-0 w-2 bg-[#1E6BB8]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,107,184,0.08),rgba(255,255,255,0.92))]" />
        <div className="absolute inset-0 opacity-35 bg-[linear-gradient(rgba(30,107,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(30,107,184,0.10)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Institute Command Center</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Monitor live courses, bookstore operations, payment approvals, and student-facing updates from one clean workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate('admin-payments')} className="inline-flex items-center gap-2 rounded-full bg-[#1E6BB8] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#155a9c]">
                Review Payments <Icon name="arrow" className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('admin-announcements')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#1E6BB8]">
                Post Update
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Today’s Queue</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{operationalAlerts} open item{operationalAlerts === 1 ? '' : 's'}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-xl font-extrabold text-[#1E6BB8]">
                {operationalAlerts}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Orders</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-slate-950">{pendingOrders.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-400">Payments</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-slate-950">{pendingPayments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(metric => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            icon={metric.icon}
            tone={metric.tone}
            onClick={() => navigate(metric.view)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Revenue Overview</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Payment performance</h2>
            </div>
            <Badge color="green">LKR</Badge>
          </div>
          <div className="p-5">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-slate-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Verified paid revenue</p>
                  <p className="mt-2 font-display text-4xl font-extrabold">Rs. {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Pending approval</p>
                  <p className="mt-1 text-2xl font-extrabold">Rs. {pendingPayments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-[#1E6BB8]" style={{ width: `${Math.min(100, paidPayments.length * 18)}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Recent Activity</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Payment feed</h2>
            </div>
            <button onClick={() => navigate('admin-payments')} className="text-sm font-extrabold text-[#1E6BB8]">View all</button>
          </div>
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map(payment => (
                <button key={payment.id} onClick={() => navigate('admin-payments')} className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-[#1E6BB8]/30 hover:bg-blue-50">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#1E6BB8] shadow-sm">
                    <Icon name="payments" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{payment.relatedTo}</p>
                    <p className="text-xs font-semibold text-slate-400">{payment.reference} · Rs. {payment.amount.toLocaleString()}</p>
                  </div>
                  <Badge color={payment.status === 'Paid' ? 'green' : payment.status === 'Pending' ? 'amber' : 'red'}>{payment.status}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-800">No payment activity yet</p>
              <p className="mt-1 text-sm text-slate-500">Payments submitted by students will appear here.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[1.75rem] border-slate-200 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Courses</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Course health</h2>
            </div>
            <button onClick={() => navigate('admin-courses')} className="text-sm font-extrabold text-[#1E6BB8]">Manage</button>
          </div>
          {topCourses.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {topCourses.map(course => {
                const capacity = Number(course.totalSeats || course.availableSeats || 0);
                const seats = Number(course.availableSeats || 0);
                const seatPercent = capacity ? Math.min(100, Math.round((seats / capacity) * 100)) : 0;
                return (
                  <button key={course.id} onClick={() => navigate('admin-courses')} className="rounded-2xl border border-slate-100 bg-white p-4 text-left transition-colors hover:border-[#1E6BB8]/30 hover:bg-blue-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-extrabold text-slate-950">{course.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{course.courseCode || course.grade} · {course.classType || 'Course'}</p>
                      </div>
                      <Badge color={course.status === 'Full' ? 'red' : 'green'}>{course.status || 'Open'}</Badge>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-extrabold text-[#1E6BB8]">Rs. {Number(course.monthlyFee || 0).toLocaleString()}</p>
                        <p className="text-xs font-semibold text-slate-400">monthly fee</p>
                      </div>
                      <p className="text-sm font-extrabold text-slate-600">{seats}/{capacity || seats} seats</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${seatPercent}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-8 text-center">
              <p className="font-display text-lg font-extrabold text-slate-900">No courses found</p>
              <p className="mt-1 text-sm text-slate-500">Courses created by the administrator will appear here.</p>
            </div>
          )}
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Quick Actions</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Admin shortcuts</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: 'announce', label: 'Post Announcement', view: 'admin-announcements' as View, helper: `${announcements.length} updates` },
              { icon: 'payments', label: 'Review Payments', view: 'admin-payments' as View, helper: `${pendingPayments.length} pending` },
              { icon: 'courses', label: 'Manage Courses', view: 'admin-courses' as View, helper: `${courses.length} active` },
              { icon: 'chart', label: 'Open Reports', view: 'admin-reports' as View, helper: 'Revenue insights' },
            ].map(action => (
              <button key={action.label} onClick={() => navigate(action.view)} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#1E6BB8]/30 hover:bg-blue-50">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#1E6BB8] shadow-sm">
                  <Icon name={action.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-slate-900">{action.label}</span>
                  <span className="text-xs font-semibold text-slate-400">{action.helper}</span>
                </span>
                <Icon name="arrow" className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
