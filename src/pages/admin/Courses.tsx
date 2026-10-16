import { useState, useEffect } from 'react';
import { Button, Badge, Card, Input, Textarea, Select, PageHeader, Modal } from '../../components/ui';
import { Course, View } from '../../types';
import { courses as initialCourses } from '../../data';
import { coursesAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onCourseChange?: (course: Course) => void;
  onCourseDelete?: (id: string) => void;
}

export default function AdminCourses({ showToast, onCourseChange, onCourseDelete }: Props) {
  const [coursesList, setCoursesList] = useState<Course[]>(initialCourses);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Add Form
  const [form, setForm] = useState({
    name: '',
    category: 'GENERAL_ENGLISH',
    grade: 'Grade 6-9',
    teacher: 'Kamal Perera',
    duration: '4 Months',
    monthlyFee: 15000,
    totalSeats: 30,
    availableSeats: 30,
    description: '',
    classType: 'Online' as const,
    image: '',
  });

  const readImage = (file: File, onLoad: (image: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Please choose an image smaller than 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.readAsDataURL(file);
  };

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.getAll();
      if (data && data.length > 0) {
        setCoursesList(data);
      }
    } catch (e) {
      console.log('Admin courses load notice:', e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async () => {
    const feeVal = Number(form.monthlyFee);
    const seatsVal = Number(form.totalSeats);

    if (!form.name || form.monthlyFee === undefined || isNaN(feeVal)) {
      showToast('Please provide course title and valid fee.', 'error');
      return;
    }
    if (feeVal < 0) {
      showToast('Course fee cannot be negative.', 'error');
      return;
    }
    if (isNaN(seatsVal) || seatsVal < 1 || !Number.isInteger(seatsVal)) {
      showToast('Seat capacity must be at least 1.', 'error');
      return;
    }

    try {
      const created = await coursesAPI.create({
        courseCode: `ENG-${form.category.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
        title: form.name,
        category: form.category,
        grade: form.grade,
        duration: form.duration,
        fee: feeVal,
        capacity: seatsVal,
        availableSeats: seatsVal,
        description: form.description || 'Comprehensive institute course.',
        image: form.image || undefined,
      });

      if (created) {
        setCoursesList(prev => [created, ...prev]);
        onCourseChange?.(created);
      }
      await loadCourses();
      setShowAddModal(false);
      setForm({ name: '', category: 'GENERAL_ENGLISH', grade: 'Grade 6-9', teacher: 'Kamal Perera', duration: '3 Months', monthlyFee: 9000, totalSeats: 30, availableSeats: 30, description: '', classType: 'Online', image: '' });
      showToast('New course published successfully!', 'success');
    } catch (e: any) {
      console.log('Course create error:', e);
      showToast(e?.response?.data?.message || e?.message || 'Failed to create course.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;

    const feeVal = Number(editingCourse.monthlyFee);
    const capacityVal = Number(editingCourse.totalSeats);

    if (feeVal < 0) {
      showToast('Course fee cannot be negative.', 'error');
      return;
    }
    if (isNaN(capacityVal) || capacityVal < 1 || !Number.isInteger(capacityVal)) {
      showToast('Seat capacity must be at least 1.', 'error');
      return;
    }

    try {
      const updated = await coursesAPI.update(editingCourse.id, {
        title: editingCourse.name,
        fee: feeVal,
        grade: editingCourse.grade,
        duration: editingCourse.duration,
        availableSeats: editingCourse.availableSeats,
        capacity: capacityVal,
        description: editingCourse.description,
        image: editingCourse.image,
      });

      if (updated) {
        setCoursesList(prev => prev.map(c => c.id === editingCourse.id ? updated : c));
        onCourseChange?.(updated);
      }
      await loadCourses();
      setEditingCourse(null);
      showToast('Course details updated successfully!', 'success');
    } catch (e: any) {
      console.log('Course update error:', e);
      showToast(e?.response?.data?.message || e?.message || 'Failed to update course.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;

    try {
      await coursesAPI.delete(deletingCourse.id);
    } catch (e) {
      console.log('Course delete backend notice:', e);
    }

    setCoursesList(prev => prev.filter(c => c.id !== deletingCourse.id));
    onCourseDelete?.(deletingCourse.id);
    setDeletingCourse(null);
    showToast('Course removed from institute catalogue.', 'info');
  };

  const filtered = coursesList.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.teacher.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(coursesList.map(c => c.category))).filter(Boolean);

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Course Management"
        subtitle={`Manage ${coursesList.length} institute courses, seat allocations, and fees`}
        action={<Button onClick={() => setShowAddModal(true)}>+ Create New Course</Button>}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            placeholder="Search courses or assigned instructors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1E6BB8]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1E6BB8] min-w-[160px]"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Course Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(course => (
          <Card key={course.id} className="overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-32 bg-slate-100 relative">
                <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <Badge color={course.classType === 'Online' ? 'blue' : 'amber'}>{course.classType}</Badge>
                  <Badge color="green">Rs. {course.monthlyFee.toLocaleString()}</Badge>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-900 font-display text-base leading-tight">{course.name}</h3>
                <p className="text-xs text-slate-500">👨‍🏫 {course.teacher} · {course.grade}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>

                <div className="bg-slate-50 rounded-xl p-2.5 flex justify-between text-xs text-slate-600 mt-2">
                  <span>Duration: <strong>{course.duration}</strong></span>
                  <span>Seats: <strong>{course.availableSeats}/{course.totalSeats}</strong></span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setEditingCourse({ ...course })}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => setDeletingCourse(course)}
                className="px-3 py-1.5 text-xs rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <Modal title="Create New Course" onClose={() => setShowAddModal(false)} size="lg">
          <div className="space-y-4">
            <Input
              label="Course Title"
              placeholder="e.g. Advanced Academic & IELTS Writing"
              value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Course Category"
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={[
                  { value: 'GENERAL_ENGLISH', label: 'General English' },
                  { value: 'SPEAKING', label: 'Spoken English & Debate' },
                  { value: 'GRAMMAR', label: 'Grammar & Writing' },
                  { value: 'SPECIAL_COURSE', label: 'Special Foundation' },
                  { value: 'IELTS_PREP', label: 'IELTS Preparation' },
                ]}
              />
              <Input
                label="Target Grade / Level"
                placeholder="e.g. Grade 10 - A/L"
                value={form.grade}
                onChange={v => setForm(f => ({ ...f, grade: v }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Full Course Fee (LKR)"
                type="number"
                min={0}
                value={String(form.monthlyFee)}
                onChange={v => setForm(f => ({ ...f, monthlyFee: Number(v) }))}
                required
              />
              <Input
                label="Duration"
                placeholder="3 Months"
                value={form.duration}
                onChange={v => setForm(f => ({ ...f, duration: v }))}
              />
              <Input
                label="Seat Capacity"
                type="number"
                min={1}
                value={String(form.totalSeats)}
                onChange={v => setForm(f => ({ ...f, totalSeats: Number(v), availableSeats: Number(v) }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Assigned Lead Teacher"
                placeholder="e.g. Kamal Perera"
                value={form.teacher}
                onChange={v => setForm(f => ({ ...f, teacher: v }))}
              />
              <Select
                label="Delivery Mode"
                value={form.classType}
                onChange={v => setForm(f => ({ ...f, classType: v as any }))}
                options={[
                  { value: 'Online', label: 'Online Virtual Classroom' }
                ]}
              />
            </div>

            <Textarea
              label="Course Description & Learning Outcomes"
              placeholder="Describe syllabus, skills covered, and evaluation criteria..."
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
            />

            <ImageUpload
              label="Course Image"
              image={form.image}
              onChange={file => readImage(file, image => setForm(f => ({ ...f, image })))}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Publish Course</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <Modal title={`Edit Course (${editingCourse.name})`} onClose={() => setEditingCourse(null)}>
          <div className="space-y-4">
            <Input
              label="Course Title"
              value={editingCourse.name}
              onChange={v => setEditingCourse(c => c ? ({ ...c, name: v }) : null)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Course Fee (LKR)"
                type="number"
                min={0}
                value={String(editingCourse.monthlyFee)}
                onChange={v => setEditingCourse(c => c ? ({ ...c, monthlyFee: Number(v) }) : null)}
              />
              <Input
                label="Target Grade"
                value={editingCourse.grade}
                onChange={v => setEditingCourse(c => c ? ({ ...c, grade: v }) : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Available Seats"
                type="number"
                min={0}
                value={String(editingCourse.availableSeats)}
                onChange={v => setEditingCourse(c => c ? ({ ...c, availableSeats: Number(v) }) : null)}
              />
              <Input
                label="Total Capacity"
                type="number"
                min={1}
                value={String(editingCourse.totalSeats)}
                onChange={v => setEditingCourse(c => c ? ({ ...c, totalSeats: Number(v) }) : null)}
              />
            </div>

            <Textarea
              label="Description"
              value={editingCourse.description}
              onChange={v => setEditingCourse(c => c ? ({ ...c, description: v }) : null)}
            />

            <ImageUpload
              label="Course Image"
              image={editingCourse.image}
              onChange={file => readImage(file, image => setEditingCourse(c => c ? ({ ...c, image }) : null))}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditingCourse(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <Modal title="Confirm Remove Course" onClose={() => setDeletingCourse(null)} size="sm">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to remove <strong>{deletingCourse.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingCourse(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Course</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ImageUpload({ label, image, onChange }: { label: string; image?: string; onChange: (file: File) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-2 block">{label}</label>
      <label className="block border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#1E6BB8] cursor-pointer transition-colors">
        {image ? <img src={image} alt="Course preview" className="w-full h-28 object-cover rounded-lg mb-3" /> : <div className="text-3xl mb-2">🖼️</div>}
        <span className="text-sm text-[#1E6BB8] font-semibold">Choose image</span>
        <span className="block text-xs text-slate-400 mt-1">PNG, JPG, or WEBP up to 5MB</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) onChange(file); }} />
      </label>
    </div>
  );
}
