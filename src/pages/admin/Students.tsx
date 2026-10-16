import { useMemo, useState, useEffect } from 'react';
import { Button, Badge, Card, Input, Select, PageHeader, Modal } from '../../components/ui';
import { View } from '../../types';
import { studentsAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface StudentItem {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  grade: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  isActive: boolean;
}

const initialStudents: StudentItem[] = [
  { id: 's1', studentId: 'STU1001', firstName: 'Kasun', lastName: 'Jayawardena', email: 'kasun.jayawardena@example.com', phone: '+94771234581', grade: 'Grade 9', address: '45 Lotus Road, Colombo 03', guardianName: 'Sunil Jayawardena', guardianPhone: '+94771234570', isActive: true },
  { id: 's2', studentId: 'STU1002', firstName: 'Anuki', lastName: 'Jayawardena', email: 'anuki.student@illumine.lk', phone: '+94771234582', grade: 'Grade 5', address: '45 Lotus Road, Colombo 03', guardianName: 'Sunil Jayawardena', guardianPhone: '+94771234570', isActive: true },
  { id: 's3', studentId: 'STU1003', firstName: 'Tharindu', lastName: 'Silva', email: 'tharindu.student@illumine.lk', phone: '+94771234583', grade: 'Grade 11 (O/L)', address: '12 Temple Lane, Kandy', guardianName: 'Dilani Silva', guardianPhone: '+94771234571', isActive: true },
  { id: 's4', studentId: 'STU1004', firstName: 'Samanli', lastName: 'Wickramasinghe', email: 'samanli.student@illumine.lk', phone: '+94771234584', grade: 'Grade 8', address: 'Main Street, Colombo', guardianName: 'K. Wickramasinghe', guardianPhone: '+94771234590', isActive: true },
  { id: 's5', studentId: 'STU1005', firstName: 'Dineth', lastName: 'Bandara', email: 'dineth.student@illumine.lk', phone: '+94771234585', grade: 'Advanced Level', address: 'Kandy Road, Kiribathgoda', guardianName: 'P. Bandara', guardianPhone: '+94771234591', isActive: true },
];

export default function AdminStudents({ navigate, showToast }: Props) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);

  // Form
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    grade: 'Grade 9',
    address: '',
    guardianName: '',
    guardianPhone: '',
    password: '',
  });

  const loadStudents = async () => {
    try {
      const data = await studentsAPI.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setStudents(
          data.map((s: any) => ({
            id: s._id || s.id,
            studentId: s.studentId || `STU${Math.floor(1000 + Math.random() * 9000)}`,
            firstName: s.user?.firstName || s.firstName || 'Student',
            lastName: s.user?.lastName || s.lastName || '',
            email: s.user?.email || s.email || '',
            phone: s.user?.phone || s.phone || '',
            grade: s.grade || 'Grade 9',
            address: s.address?.street ? `${s.address.street}, ${s.address.city || ''}` : '',
            guardianName: s.parent?.user ? `${s.parent.user.firstName} ${s.parent.user.lastName}` : s.guardianName,
            guardianPhone: s.parent?.user?.phone || s.guardianPhone,
            isActive: s.user?.isActive ?? s.isActive ?? true,
          }))
        );
      }
    } catch (e) {
      console.log('Students backend load notice:', e);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreate = async () => {
    if (!form.firstName || !form.email) {
      showToast('First name and email are required.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(form.phone) || (form.guardianPhone && !/^\d{10}$/.test(form.guardianPhone))) {
      showToast('Phone numbers must contain exactly 10 digits.', 'error');
      return;
    }

    const newStudent: StudentItem = {
      id: 'new-' + Date.now(),
      studentId: `STU${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      grade: form.grade,
      address: form.address,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      isActive: true,
    };

    try {
      await studentsAPI.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        grade: form.grade,
        address: { street: form.address, city: 'Colombo' },
        password: form.password,
      });
    } catch (e) {
      console.log('Student backend create notice:', e);
    }

    setStudents(prev => [newStudent, ...prev]);
    setShowAddModal(false);
    setForm({ firstName: '', lastName: '', email: '', phone: '', grade: 'Grade 9', address: '', guardianName: '', guardianPhone: '', password: '' });
    showToast('Student registered successfully!', 'success');
  };

  const handleUpdate = async () => {
    if (!editingStudent) return;

    try {
      await studentsAPI.update(editingStudent.id, {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        grade: editingStudent.grade,
        phone: editingStudent.phone,
        address: { street: editingStudent.address, city: 'Colombo' },
        isActive: editingStudent.isActive,
        guardianName: editingStudent.guardianName,
        guardianPhone: editingStudent.guardianPhone,
      });
    } catch (e) {
      console.log('Student backend update notice:', e);
    }

    setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
    showToast('Student details updated!', 'success');
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;

    try {
      await studentsAPI.delete(deletingStudent.id);
    } catch (e) {
      console.log('Student backend delete notice:', e);
    }

    setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
    setDeletingStudent(null);
    showToast('Student removed from system.', 'info');
  };

  const grades = Array.from(new Set(students.map(s => s.grade))).filter(Boolean);
  const activeStudents = students.filter(student => student.isActive).length;
  const inactiveStudents = students.length - activeStudents;
  const guardiansLinked = students.filter(student => student.guardianName || student.guardianPhone).length;
  const topGrade = grades
    .map(grade => ({ grade, count: students.filter(student => student.grade === grade).length }))
    .sort((a, b) => b.count - a.count)[0];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = !query ||
        fullName.includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.phone.includes(query) ||
        student.studentId.toLowerCase().includes(query) ||
        (student.guardianName || '').toLowerCase().includes(query);
      const matchesGrade = !gradeFilter || student.grade === gradeFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && student.isActive) ||
        (statusFilter === 'inactive' && !student.isActive);
      return matchesSearch && matchesGrade && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'grade') return a.grade.localeCompare(b.grade);
      if (sortBy === 'status') return Number(b.isActive) - Number(a.isActive);
      return 0;
    });
  }, [gradeFilter, search, sortBy, statusFilter, students]);

  const resetFilters = () => {
    setSearch('');
    setGradeFilter('');
    setStatusFilter('');
    setSortBy('recent');
  };

  const studentInitials = (student: StudentItem) =>
    `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase() || 'ST';

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} registered students across ${grades.length || 1} grade levels`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('admin-enrollments')}>View Enrollments</Button>
            <Button onClick={() => setShowAddModal(true)}>+ Add New Student</Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
          <div className="relative overflow-hidden p-6">
            <div className="absolute inset-y-0 left-0 w-2 bg-[#1E6BB8]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,107,184,0.08),rgba(255,255,255,0.96))]" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Student Directory</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">Manage learners and guardian records</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Search student profiles, check account status, update contact details, and keep guardian information easy to find.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 lg:grid-cols-4">
            {[
              ['Students', students.length, 'Total records', 'bg-blue-50 text-blue-700'],
              ['Active', activeStudents, 'Can access portal', 'bg-emerald-50 text-emerald-700'],
              ['Inactive', inactiveStudents, 'Needs attention', 'bg-rose-50 text-rose-700'],
              ['Guardians', guardiansLinked, topGrade ? `Top: ${topGrade.grade}` : 'Linked contacts', 'bg-slate-100 text-slate-700'],
            ].map(([label, value, helper, tone]) => (
              <div key={label} className={`rounded-2xl p-4 ${tone}`}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-70">{label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
                <p className="mt-1 text-xs font-bold opacity-70">{helper}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Quick View</p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-slate-950">Needs attention</h3>
            </div>
            <Badge color={inactiveStudents > 0 ? 'red' : 'green'}>{inactiveStudents} inactive</Badge>
          </div>
          {students.filter(student => !student.isActive).length > 0 ? (
            <div className="space-y-3">
              {students.filter(student => !student.isActive).slice(0, 3).map(student => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setEditingStudent({ ...student })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-[#1E6BB8]/30 hover:bg-blue-50"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-extrabold text-[#1E6BB8] shadow-sm">
                    {studentInitials(student)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{student.firstName} {student.lastName}</span>
                    <span className="text-xs font-bold text-slate-400">{student.studentId} · {student.grade}</span>
                  </span>
                  <Badge color="red">Inactive</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="font-display text-lg font-extrabold text-emerald-900">All accounts active</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">No inactive student accounts right now.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setGradeFilter('')} className={`rounded-full px-4 py-2 text-xs font-extrabold ${!gradeFilter ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All Grades
          </button>
          {grades.slice(0, 8).map(grade => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${gradeFilter === grade ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {grade}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem_auto]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              placeholder="Search name, ID, phone, email, or guardian..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="recent">Default order</option>
            <option value="name">Name A-Z</option>
            <option value="grade">Grade A-Z</option>
            <option value="status">Active first</option>
          </select>
          <button onClick={resetFilters} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50">
            Reset
          </button>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-extrabold text-slate-950">Student directory</h3>
            <p className="mt-1 text-sm font-semibold text-slate-400">{filtered.length} student{filtered.length === 1 ? '' : 's'} matching current filters</p>
          </div>
          <Badge color="blue">Live database</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400 backdrop-blur">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Grade</th>
                <th className="px-5 py-4">Guardian</th>
                <th className="px-5 py-4">Account</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(student => (
                <tr key={student.id} className="group transition-colors hover:bg-blue-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-extrabold text-[#1E6BB8] ring-1 ring-blue-100">
                        {studentInitials(student)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-base font-extrabold text-slate-950 line-clamp-1">{student.firstName} {student.lastName}</p>
                        <p className="mt-1 font-mono text-xs font-bold text-slate-400">{student.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">{student.phone || 'No phone'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{student.email || 'No email'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge color="blue">{student.grade}</Badge>
                    {student.address && <p className="mt-2 max-w-[210px] truncate text-xs font-semibold text-slate-400">{student.address}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-extrabold text-slate-800">{student.guardianName || 'Not linked'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{student.guardianPhone || 'No guardian phone'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge color={student.isActive ? 'green' : 'red'}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{student.isActive ? 'Portal enabled' : 'Access paused'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingStudent({ ...student })}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:border-[#1E6BB8]/40 hover:bg-blue-50 hover:text-[#1E6BB8]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-600 shadow-sm transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-xl font-extrabold text-slate-800">No matching students</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Try a different search, grade, or status filter.</p>
            <button onClick={resetFilters} className="mt-5 rounded-2xl bg-[#1E6BB8] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20">
              Reset filters
            </button>
          </div>
        )}
      </Card>

      {/* Add Student Modal */}
      {showAddModal && (
        <Modal title="Register New Student" onClose={() => setShowAddModal(false)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. Kasun"
                value={form.firstName}
                onChange={v => setForm(f => ({ ...f, firstName: v }))}
                required
              />
              <Input
                label="Last Name"
                placeholder="e.g. Jayawardena"
                value={form.lastName}
                onChange={v => setForm(f => ({ ...f, lastName: v }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={v => setForm(f => ({ ...f, email: v }))}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="0771234581"
                value={form.phone}
                onChange={v => setForm(f => ({ ...f, phone: v.replace(/\D/g, '').slice(0, 10) }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Academic Grade"
                value={form.grade}
                onChange={v => setForm(f => ({ ...f, grade: v }))}
                options={[
                  { value: 'Grade 1', label: 'Grade 1' },
                  { value: 'Grade 2', label: 'Grade 2' },
                  { value: 'Grade 3', label: 'Grade 3' },
                  { value: 'Grade 4', label: 'Grade 4' },
                  { value: 'Grade 5', label: 'Grade 5' },
                  { value: 'Grade 6', label: 'Grade 6' },
                  { value: 'Grade 7', label: 'Grade 7' },
                  { value: 'Grade 8', label: 'Grade 8' },
                  { value: 'Grade 9', label: 'Grade 9' },
                  { value: 'Grade 10', label: 'Grade 10' },
                  { value: 'Grade 11 (O/L)', label: 'Grade 11 (O/L)' },
                  { value: 'Advanced Level', label: 'Advanced Level' },
                ]}
                required
              />
              <Input
                label="Initial Password"
                type="password"
                value={form.password}
                onChange={v => setForm(f => ({ ...f, password: v }))}
                required
              />
            </div>

            <Input
              label="Home Address"
              placeholder="45 Lotus Road, Colombo 03"
              value={form.address}
              onChange={v => setForm(f => ({ ...f, address: v }))}
            />

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <Input
                label="Guardian Name"
                placeholder="Sunil Jayawardena"
                value={form.guardianName}
                onChange={v => setForm(f => ({ ...f, guardianName: v }))}
              />
              <Input
                label="Guardian Phone"
                placeholder="077 123 4570"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.guardianPhone}
                onChange={v => setForm(f => ({ ...f, guardianPhone: v.replace(/\D/g, '').slice(0, 10) }))}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save & Register Student</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <Modal title={`Edit Student (${editingStudent.studentId})`} onClose={() => setEditingStudent(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editingStudent.firstName}
                onChange={v => setEditingStudent(s => s ? ({ ...s, firstName: v }) : null)}
              />
              <Input
                label="Last Name"
                value={editingStudent.lastName}
                onChange={v => setEditingStudent(s => s ? ({ ...s, lastName: v }) : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={editingStudent.phone}
                onChange={v => setEditingStudent(s => s ? ({ ...s, phone: v.replace(/\D/g, '').slice(0, 10) }) : null)}
              />
              <Select
                label="Academic Grade"
                value={editingStudent.grade}
                onChange={v => setEditingStudent(s => s ? ({ ...s, grade: v }) : null)}
                options={[
                  { value: 'Grade 5', label: 'Grade 5' },
                  { value: 'Grade 6', label: 'Grade 6' },
                  { value: 'Grade 7', label: 'Grade 7' },
                  { value: 'Grade 8', label: 'Grade 8' },
                  { value: 'Grade 9', label: 'Grade 9' },
                  { value: 'Grade 10', label: 'Grade 10' },
                  { value: 'Grade 11 (O/L)', label: 'Grade 11 (O/L)' },
                  { value: 'Advanced Level', label: 'Advanced Level' },
                ]}
              />
            </div>

            <Input
              label="Address"
              value={editingStudent.address || ''}
              onChange={v => setEditingStudent(s => s ? ({ ...s, address: v }) : null)}
            />

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <Input
                label="Guardian Name"
                value={editingStudent.guardianName || ''}
                onChange={v => setEditingStudent(s => s ? ({ ...s, guardianName: v }) : null)}
              />
              <Input
                label="Guardian Phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={editingStudent.guardianPhone || ''}
                onChange={v => setEditingStudent(s => s ? ({ ...s, guardianPhone: v.replace(/\D/g, '').slice(0, 10) }) : null)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeStatus"
                checked={editingStudent.isActive}
                onChange={e => setEditingStudent(s => s ? ({ ...s, isActive: e.target.checked }) : null)}
                className="rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
              />
              <label htmlFor="activeStatus" className="text-sm text-slate-700 cursor-pointer">
                Student Account Active
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <Modal title="Confirm Remove Student" onClose={() => setDeletingStudent(null)} size="sm">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to remove <strong>{deletingStudent.firstName} {deletingStudent.lastName}</strong> ({deletingStudent.studentId}) from the system?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingStudent(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Student</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
