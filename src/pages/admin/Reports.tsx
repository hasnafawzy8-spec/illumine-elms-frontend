import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard, Card, Badge, PageHeader, Button } from '../../components/ui';
import { View } from '../../types';
import { reportsAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const chartColors = ['#1E6BB8', '#D42B2B', '#C2660A', '#16a34a', '#7c3aed', '#0891b2', '#db2777'];

const formatMoney = (value = 0) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function AdminReports({ showToast }: Props) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    reportsAPI.getSummary()
      .then(res => {
        if (res?.data) setSummaryData(res.data);
      })
      .catch(() => {
        showToast('Report data could not be loaded.', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = summaryData?.metrics || {};
  const monthlyRevenue = summaryData?.monthlyRevenue || [];
  const categoryEnrollments = (summaryData?.categoryDistribution || []).map((item: any, index: number) => ({
    ...item,
    name: item.label || item.name,
    value: Number(item.value ?? item.count ?? 0),
    color: chartColors[index % chartColors.length],
  }));
  const coursePerformance = summaryData?.coursePerformance || [];
  const hasRevenueData = monthlyRevenue.some((item: any) => item.courseRevenue > 0 || item.bookSales > 0);
  const hasCategoryData = categoryEnrollments.some((item: any) => item.value > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Month,Course Revenue,Book Sales,Total Revenue\n"
      + monthlyRevenue.map((e: any) => `${e.month},${e.courseRevenue},${e.bookSales},${e.total}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `illumine_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial CSV report exported successfully!', 'success');
  };

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Executive Performance & Financial Reports"
        subtitle="Comprehensive analytics on student enrollments, course delivery, and institute revenue"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>📥 Export CSV</Button>
            <Button onClick={handlePrint}>🖨 Print Report</Button>
          </div>
        }
      />

      {loading && (
        <Card className="p-4 text-sm text-slate-500">Loading live report data from the database…</Card>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Institute Revenue" value={formatMoney(metrics.totalRevenue)} icon={<span>💰</span>} color="green" trend="Approved paid payments" />
        <StatCard label="Active Enrollments" value={metrics.activeEnrollments ?? 0} icon={<span>🎓</span>} color="blue" trend="Approved and completed enrollments" />
        <StatCard label="Book Store Turnover" value={formatMoney(metrics.totalBookSales)} icon={<span>📖</span>} color="amber" trend={`${metrics.booksSold || 0} books sold`} />
        <StatCard label="Average Class Occupancy" value={`${metrics.averageOccupancy || 0}%`} icon={<span>📈</span>} color="purple" trend="Across active course capacity" />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 font-display">Revenue Breakdown</h3>
              <p className="text-xs text-slate-400">Course fees vs book store sales from paid payments</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1E6BB8]" />Course Fees</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C2660A]" />Book Store</span>
            </div>
          </div>

          <div className="h-64">
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={v => `${v/1000}K`} />
                  <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                  <Bar dataKey="courseRevenue" fill="#1E6BB8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookSales" fill="#C2660A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                No paid course or book payments found for the last six months.
              </div>
            )}
          </div>
        </Card>

        {/* Enrollment Distribution */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 font-display mb-1">Enrollments by Department</h3>
          <p className="text-xs text-slate-400 mb-4">Approved enrollment distribution by course category</p>

          <div className="h-44">
            {hasCategoryData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryEnrollments} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {categoryEnrollments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                No approved enrollments yet.
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {categoryEnrollments.map((item: any) => (
              <div key={item.name} className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold">{item.value} student{item.value !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-800 font-display mb-4">Course Program Health & Capacity Utilization</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Program Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Monthly Fee</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Capacity Status</th>
                <th className="py-3 px-4">Est. Monthly Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coursePerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                    No courses found in the database.
                  </td>
                </tr>
              ) : coursePerformance.map((c: any) => (
                <tr key={c.id || c.courseCode} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.categoryLabel || c.category}</td>
                  <td className="py-3 px-4">{formatMoney(c.fee)}</td>
                  <td className="py-3 px-4 font-bold">{c.enrolledStudents} / {c.capacity}</td>
                  <td className="py-3 px-4">
                    <Badge color={c.status === 'Full Batch' ? 'purple' : c.status === 'Near Full' ? 'amber' : 'green'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600">
                    {formatMoney(c.estimatedMonthlyYield)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
