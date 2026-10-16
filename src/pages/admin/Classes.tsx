import { useMemo, useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Card,
  Input,
  Textarea,
  Select,
  PageHeader,
  Modal,
} from '../../components/ui';
import { View } from '../../types';
import {
  classesAPI,
  teachersAPI,
  coursesAPI,
  studentsAPI,
  enrollmentsAPI,
  courseResourcesAPI,
} from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (
    msg: string,
    type: 'success' | 'error' | 'info'
  ) => void;
}

interface ClassItem {
  id: string;
  classCode: string;
  className: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  capacity: number;
  studentsCount: number;
  onlineClassLink: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | string;
  description?: string;
}

interface CourseOption {
  id: string;
  title: string;
  courseCode?: string;
}

interface TeacherOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface StudentOption {
  id: string;
  name: string;
}

interface ClassForm {
  classCode: string;
  className: string;
  courseId: string;
  teacherId: string;
  capacity: number;
  onlineClassLink: string;
  description: string;
}

interface RecordingForm {
  title: string;
  sourceType: 'LINK' | 'FILE';
  recordingUrl: string;
  file: File | null;
}

const emptyForm: ClassForm = {
  classCode: '',
  className: '',
  courseId: '',
  teacherId: '',
  capacity: 30,
  onlineClassLink: '',
  description: '',
};

const emptyRecordingForm: RecordingForm = {
  title: '',
  sourceType: 'LINK',
  recordingUrl: '',
  file: null,
};

export default function AdminClasses({
  navigate,
  showToast,
}: Props) {
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] =
    useState<ClassItem | null>(null);
  const [deletingClass, setDeletingClass] =
    useState<ClassItem | null>(null);
  const [enrollingInClass, setEnrollingInClass] =
    useState<ClassItem | null>(null);
  const [managingRecordingsClass, setManagingRecordingsClass] =
    useState<ClassItem | null>(null);
  const [classRecordings, setClassRecordings] =
    useState<any[]>([]);
  const [recordingsLoading, setRecordingsLoading] =
    useState(false);
  const [recordingForm, setRecordingForm] =
    useState<RecordingForm>(emptyRecordingForm);
  const [recordingSubmitting, setRecordingSubmitting] =
    useState(false);

  const [selectedStudentId, setSelectedStudentId] =
    useState('');

  const [form, setForm] =
    useState<ClassForm>(emptyForm);

  // ============================================================
  // LOAD CLASSES
  // ============================================================

  const loadClasses = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await classesAPI.getAll();

      const data: any[] = Array.isArray(response)
        ? response
        : response?.data || [];

      const formattedClasses: ClassItem[] = data
        .map((cls: any): ClassItem => {
          const course =
            typeof cls.course === 'object'
              ? cls.course
              : null;

          const teacher =
            typeof cls.teacher === 'object'
              ? cls.teacher
              : null;

          const teacherUser =
            teacher?.user || teacher;

          const studentCount = Array.isArray(cls.students)
            ? cls.students.length
            : Number(
                cls.studentsCount ||
                  cls.enrolledStudents ||
                  0
              );

          return {
            id:
              cls._id ||
              cls.id ||
              '',

            classCode:
              cls.classCode ||
              cls.code ||
              '',

            className:
              cls.className ||
              cls.name ||
              '',

            courseId:
              course?._id ||
              course?.id ||
              (typeof cls.course === 'string'
                ? cls.course
                : ''),

            courseTitle:
              course?.title ||
              course?.name ||
              '',

            teacherId:
              teacher?._id ||
              teacher?.id ||
              (typeof cls.teacher === 'string'
                ? cls.teacher
                : ''),

            teacherName:
              `${teacherUser?.firstName || ''} ${
                teacherUser?.lastName || ''
              }`.trim() ||
              teacherUser?.name ||
              'Not assigned',

            capacity: Number(cls.capacity || 0),

            studentsCount: studentCount,

            onlineClassLink:
              cls.onlineClassLink ||
              cls.onlineLink ||
              '',

            status:
              cls.status ||
              'ACTIVE',

            description:
              cls.description ||
              '',
          };
        })
        .filter(
          (cls: ClassItem) => cls.id
        );

      setClassesList(formattedClasses);
    } catch (error) {
      console.error(
        'Failed to load classes:',
        error
      );

      setClassesList([]);

      showToast(
        'Failed to load classes from database.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD COURSES
  // ============================================================

  const loadCourses = async (): Promise<void> => {
    try {
      const response =
        await coursesAPI.getAll();

      const data: any[] = Array.isArray(response)
        ? response
        : response?.data || [];

      const formattedCourses: CourseOption[] =
        data
          .map(
            (course: any): CourseOption => ({
              id:
                course._id ||
                course.id ||
                '',

              title:
                course.title ||
                course.name ||
                'Unnamed Course',

              courseCode:
                course.courseCode ||
                '',
            })
          )
          .filter(
            (course: CourseOption) =>
              course.id
          );

      setCourses(formattedCourses);
    } catch (error) {
      console.error(
        'Failed to load courses:',
        error
      );

      setCourses([]);

      showToast(
        'Failed to load courses from database.',
        'error'
      );
    }
  };

  // ============================================================
  // LOAD TEACHERS
  // ============================================================

  const loadTeachers = async (): Promise<void> => {
    try {
      const response =
        await teachersAPI.getAll();

      const data: any[] = Array.isArray(response)
        ? response
        : response?.data || [];

      const formattedTeachers: TeacherOption[] =
        data
          .map(
            (teacher: any): TeacherOption => {
              const user =
                teacher.user || teacher;

              return {
                id:
                  teacher._id ||
                  teacher.id ||
                  '',

                name:
                  `${user?.firstName || ''} ${
                    user?.lastName || ''
                  }`.trim() ||
                  user?.name ||
                  'Teacher',

                isActive:
                  teacher.isActive !== false,
              };
            }
          )
          .filter(
            (teacher: TeacherOption) =>
              teacher.id
          );

      setTeachers(formattedTeachers);
    } catch (error) {
      console.error(
        'Failed to load teachers:',
        error
      );

      setTeachers([]);

      showToast(
        'Failed to load teachers from database.',
        'error'
      );
    }
  };

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  const loadStudents = async (): Promise<void> => {
    try {
      const response =
        await studentsAPI.getAll();

      const data: any[] = Array.isArray(response)
        ? response
        : response?.data || [];

      const formattedStudents: StudentOption[] =
        data
          .map(
            (student: any): StudentOption => ({
              id:
                student._id ||
                student.id ||
                '',

              name:
                `${student?.user?.firstName || ''} ${
                  student?.user?.lastName || ''
                }`.trim() ||
                'Student',
            })
          )
          .filter(
            (student: StudentOption) =>
              student.id
          );

      setStudents(formattedStudents);
    } catch (error) {
      console.error(
        'Failed to load students:',
        error
      );

      setStudents([]);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadClasses(),
        loadCourses(),
        loadTeachers(),
        loadStudents(),
      ]);
    };

    loadData();
  }, []);

  // ============================================================
  // RESET
  // ============================================================

  const resetForm = (): void => {
    setForm({
      ...emptyForm,
    });
  };

  // ============================================================
  // AVAILABLE TEACHERS
  // ============================================================

  const availableTeachers =
    teachers.filter(
      (teacher) => teacher.isActive
    );

  // ============================================================
  // CREATE CLASS
  // ============================================================

  const handleCreate = async (): Promise<void> => {
    if (!form.classCode.trim()) {
      showToast(
        'Class code is required.',
        'error'
      );
      return;
    }

    if (!form.className.trim()) {
      showToast(
        'Batch name is required.',
        'error'
      );
      return;
    }

    if (!form.courseId) {
      showToast(
        'Please select a course.',
        'error'
      );
      return;
    }

    if (!form.teacherId) {
      showToast(
        'Please select a teacher.',
        'error'
      );
      return;
    }

    if (
      !form.capacity ||
      Number(form.capacity) < 1
    ) {
      showToast(
        'Capacity must be at least 1.',
        'error'
      );
      return;
    }

    try {
      const payload = {
        classCode:
          form.classCode
            .trim()
            .toUpperCase(),

        className:
          form.className.trim(),

        course:
          form.courseId,

        teacher:
          form.teacherId,

        capacity:
          Number(form.capacity),

        onlineClassLink:
          form.onlineClassLink.trim(),

        description:
          form.description.trim(),

        status:
          'ACTIVE',
      };

      console.log(
        '[AdminClasses] Creating class:',
        payload
      );

      await classesAPI.create(payload);

      showToast(
        'Class batch created successfully.',
        'success'
      );

      setShowAddModal(false);

      resetForm();

      await loadClasses();
    } catch (error: any) {
      console.error(
        'Create class error:',
        error
      );

      showToast(
        error?.message ||
          'Failed to create class batch.',
        'error'
      );
    }
  };

  // ============================================================
  // UPDATE CLASS
  // ============================================================

  const handleUpdate = async (): Promise<void> => {
    if (!editingClass) {
      return;
    }

    if (!editingClass.className.trim()) {
      showToast(
        'Batch name is required.',
        'error'
      );
      return;
    }

    if (
      !editingClass.capacity ||
      Number(editingClass.capacity) < 1
    ) {
      showToast(
        'Capacity must be at least 1.',
        'error'
      );
      return;
    }

    try {
      await classesAPI.update(
        editingClass.id,
        {
          className:
            editingClass.className.trim(),

          capacity:
            Number(editingClass.capacity),

          onlineClassLink:
            editingClass.onlineClassLink.trim(),

          description:
            editingClass.description?.trim() ||
            '',

          status:
            editingClass.status,
        }
      );

      showToast(
        'Class batch updated successfully.',
        'success'
      );

      setEditingClass(null);

      await loadClasses();
    } catch (error: any) {
      console.error(
        'Update class error:',
        error
      );

      showToast(
        error?.message ||
          'Failed to update class batch.',
        'error'
      );
    }
  };

  // ============================================================
  // DELETE CLASS
  // ============================================================

  const handleDelete = async (): Promise<void> => {
    if (!deletingClass) {
      return;
    }

    try {
      await classesAPI.delete(
        deletingClass.id
      );

      showToast(
        'Class batch deleted successfully.',
        'success'
      );

      setDeletingClass(null);

      await loadClasses();
    } catch (error: any) {
      console.error(
        'Delete class error:',
        error
      );

      showToast(
        error?.message ||
          'Failed to delete class batch.',
        'error'
      );
    }
  };

  // ============================================================
  // MANUAL ENROLLMENT
  // ============================================================

  const handleManualEnroll =
    async (): Promise<void> => {
      if (
        !enrollingInClass ||
        !selectedStudentId
      ) {
        return;
      }

      try {
        await enrollmentsAPI.create({
          courseId: enrollingInClass.courseId,
          classId: enrollingInClass.id,
          student: selectedStudentId,
        } as any);

        showToast(
          'Student enrolled and connected to the student portal.',
          'success'
        );

        setEnrollingInClass(null);
        setSelectedStudentId('');
        await loadClasses();
      } catch (error: any) {
        console.error(
          'Manual enrollment error:',
          error
        );

        showToast(
          error?.message ||
            'Failed to enroll student in this batch.',
          'error'
        );
      }
    };

  // ============================================================
  // CLASS RECORDINGS
  // ============================================================

  const loadRecordingsForClass = async (classItem: ClassItem): Promise<void> => {
    try {
      setRecordingsLoading(true);
      const resources = await courseResourcesAPI.getForCourse(classItem.courseId);
      const recordings = (resources || []).filter((resource: any) => {
        const resourceClassId =
          resource.class?._id ||
          resource.class?.id ||
          resource.class ||
          '';
        return (
          resource.resourceType === 'CLASS_RECORDING' &&
          String(resourceClassId) === String(classItem.id)
        );
      });

      setClassRecordings(recordings);
    } catch (error: any) {
      console.error('Load class recordings error:', error);
      setClassRecordings([]);
      showToast(error?.message || 'Failed to load class recordings.', 'error');
    } finally {
      setRecordingsLoading(false);
    }
  };

  const openRecordingManager = async (classItem: ClassItem): Promise<void> => {
    setManagingRecordingsClass(classItem);
    setRecordingForm({
      ...emptyRecordingForm,
      title: `${classItem.className} recording`,
    });
    await loadRecordingsForClass(classItem);
  };

  const handleCreateRecording = async (): Promise<void> => {
    if (!managingRecordingsClass) return;

    if (!recordingForm.title.trim()) {
      showToast('Recording title is required.', 'error');
      return;
    }

    if (recordingForm.sourceType === 'LINK' && !recordingForm.recordingUrl.trim()) {
      showToast('Please paste the recording link.', 'error');
      return;
    }

    if (recordingForm.sourceType === 'FILE' && !recordingForm.file) {
      showToast('Please choose a recording video file.', 'error');
      return;
    }

    try {
      setRecordingSubmitting(true);
      await courseResourcesAPI.uploadRecording(
        managingRecordingsClass.courseId,
        managingRecordingsClass.id,
        recordingForm.title.trim(),
        recordingForm.sourceType === 'FILE' ? recordingForm.file : null,
        recordingForm.sourceType === 'LINK' ? recordingForm.recordingUrl.trim() : ''
      );

      showToast('Class recording added successfully.', 'success');
      setRecordingForm({
        ...emptyRecordingForm,
        title: `${managingRecordingsClass.className} recording`,
      });
      await loadRecordingsForClass(managingRecordingsClass);
    } catch (error: any) {
      console.error('Create class recording error:', error);
      showToast(error?.message || 'Failed to add class recording.', 'error');
    } finally {
      setRecordingSubmitting(false);
    }
  };

  const handleDeleteRecording = async (resourceId: string): Promise<void> => {
    if (!managingRecordingsClass) return;

    try {
      await courseResourcesAPI.delete(resourceId);
      showToast('Class recording removed.', 'success');
      await loadRecordingsForClass(managingRecordingsClass);
    } catch (error: any) {
      console.error('Delete class recording error:', error);
      showToast(error?.message || 'Failed to delete class recording.', 'error');
    }
  };

  // ============================================================
  // OPTIONS
  // ============================================================

  const courseOptions = [
    {
      value: '',
      label: 'Select course...',
    },
    ...courses.map(
      (course) => ({
        value: course.id,
        label: course.courseCode
          ? `${course.courseCode} - ${course.title}`
          : course.title,
      })
    ),
  ];

  const teacherOptions = [
    {
      value: '',
      label:
        availableTeachers.length === 0
          ? 'No active teachers'
          : 'Select teacher...',
    },
    ...availableTeachers.map(
      (teacher) => ({
        value: teacher.id,
        label: teacher.name,
      })
    ),
  ];

  const studentOptions = [
    {
      value: '',
      label: 'Select student...',
    },
    ...students.map(
      (student) => ({
        value: student.id,
        label: student.name,
      })
    ),
  ];

  // ============================================================
  // FILTER
  // ============================================================

  const activeBatches = classesList.filter((cls) => cls.status === 'ACTIVE').length;
  const totalStudents = classesList.reduce((sum, cls) => sum + cls.studentsCount, 0);
  const totalCapacity = classesList.reduce((sum, cls) => sum + cls.capacity, 0);
  const onlineBatches = classesList.filter((cls) => Boolean(cls.onlineClassLink)).length;
  const nearCapacityClasses = classesList.filter((cls) => cls.capacity > 0 && cls.studentsCount / cls.capacity >= 0.8);
  const courseNames = Array.from(new Set(classesList.map((cls) => cls.courseTitle).filter(Boolean)));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = classesList.filter((cls) => {
      const matchesSearch = !query ||
        cls.className.toLowerCase().includes(query) ||
        cls.classCode.toLowerCase().includes(query) ||
        cls.courseTitle.toLowerCase().includes(query) ||
        cls.teacherName.toLowerCase().includes(query);
      const matchesCourse = !courseFilter || cls.courseTitle === courseFilter;
      const matchesStatus = !statusFilter || cls.status === statusFilter;
      return matchesSearch && matchesCourse && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.className.localeCompare(b.className);
      if (sortBy === 'course') return a.courseTitle.localeCompare(b.courseTitle);
      if (sortBy === 'teacher') return a.teacherName.localeCompare(b.teacherName);
      if (sortBy === 'capacity') return (b.studentsCount / Math.max(1, b.capacity)) - (a.studentsCount / Math.max(1, a.capacity));
      return 0;
    });
  }, [classesList, courseFilter, search, sortBy, statusFilter]);

  const clearFilters = () => {
    setSearch('');
    setCourseFilter('');
    setStatusFilter('');
    setSortBy('recent');
  };

  const statusColor = (status: string): 'green' | 'blue' | 'slate' | 'red' =>
    status === 'ACTIVE'
      ? 'green'
      : status === 'COMPLETED'
        ? 'blue'
        : status === 'INACTIVE'
          ? 'slate'
          : 'red';

  const modeLabel = (cls: ClassItem) => cls.onlineClassLink ? 'Student portal link ready' : 'No online link';

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Class Batch Management"
        subtitle={`${classesList.length} batches connected to courses, teachers, and student portal access`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('admin-enrollments')}>Enrollment Queue</Button>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              + Add New Class Batch
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
          <div className="relative overflow-hidden p-6">
            <div className="absolute inset-y-0 left-0 w-2 bg-[#1E6BB8]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,107,184,0.08),rgba(255,255,255,0.96))]" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Learning Management</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">Class batches students can actually use</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Manage teacher assignments, capacity, online class links, and admin enrollments that connect directly to the student portal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 lg:grid-cols-4">
            {[
              ['Batches', classesList.length, `${activeBatches} active`, 'bg-blue-50 text-blue-700'],
              ['Students', totalStudents, `${totalCapacity} seats`, 'bg-emerald-50 text-emerald-700'],
              ['Portal Links', onlineBatches, 'Online-ready batches', 'bg-cyan-50 text-cyan-700'],
              ['Teachers', availableTeachers.length, `${nearCapacityClasses.length} near full`, 'bg-slate-100 text-slate-700'],
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
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Admin Focus</p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-slate-950">Capacity watch</h3>
            </div>
            <Badge color={nearCapacityClasses.length > 0 ? 'amber' : 'green'}>{nearCapacityClasses.length} alerts</Badge>
          </div>
          {nearCapacityClasses.length > 0 ? (
            <div className="space-y-3">
              {nearCapacityClasses.slice(0, 3).map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setEditingClass({ ...cls })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-[#1E6BB8]/30 hover:bg-blue-50"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-extrabold text-[#1E6BB8] shadow-sm">
                    {Math.round((cls.studentsCount / Math.max(1, cls.capacity)) * 100)}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{cls.className}</span>
                    <span className="text-xs font-bold text-slate-400">{cls.studentsCount}/{cls.capacity} students</span>
                  </span>
                  <Badge color="amber">Near full</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="font-display text-lg font-extrabold text-emerald-900">Capacity looks healthy</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">No batches are close to full right now.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_12rem_12rem_auto]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              placeholder="Search batch, code, course, or teacher..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Courses</option>
            {courseNames.map((course) => <option key={course} value={course}>{course}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="recent">Default</option>
            <option value="name">Batch A-Z</option>
            <option value="course">Course A-Z</option>
            <option value="teacher">Teacher A-Z</option>
            <option value="capacity">Fullest first</option>
          </select>
          <button onClick={clearFilters} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:bg-slate-50">
            Reset
          </button>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-extrabold text-slate-950">Class batch directory</h3>
            <p className="mt-1 text-sm font-semibold text-slate-400">{filtered.length} batch{filtered.length === 1 ? '' : 'es'} matching current filters</p>
          </div>
          <Badge color="blue">Student portal connected</Badge>
        </div>

        {loading ? (
          <div className="text-center py-16">

            <h3 className="font-semibold text-slate-700">
              Loading classes...
            </h3>

            <p className="text-slate-400 text-sm mt-1">
              Loading real data from MongoDB.
            </p>

          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">

            <h3 className="font-semibold text-slate-700">
              No class batches found
            </h3>

            <p className="text-slate-400 text-sm mt-1">
              {search || courseFilter || statusFilter
                ? 'Try adjusting your filters.'
                : 'There are no class batches in the database yet.'}
            </p>

            {!(search || courseFilter || statusFilter) && (
              <div className="mt-5">

                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  + Create First Class Batch
                </Button>

              </div>
            )}

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1120px] text-left text-sm">

              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400 backdrop-blur">

                <tr>

                  <th className="px-5 py-4">
                    Batch
                  </th>

                  <th className="px-5 py-4">
                    Course
                  </th>

                  <th className="px-5 py-4">
                    Teacher
                  </th>

                  <th className="px-5 py-4">
                    Student Portal
                  </th>

                  <th className="px-5 py-4">
                    Capacity
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filtered.map((cls) => {
                  const fillPercent = Math.min(100, Math.round((cls.studentsCount / Math.max(1, cls.capacity)) * 100));
                  const seatsLeft = Math.max(0, cls.capacity - cls.studentsCount);

                  return (
                    <tr
                      key={cls.id}
                      className="group transition-colors hover:bg-blue-50/40"
                    >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-blue-50 text-xs font-extrabold text-[#1E6BB8] ring-1 ring-blue-100">
                          {cls.classCode?.replace('CLS-', '').slice(0, 3) || 'CLS'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-base font-extrabold text-slate-950 line-clamp-1">
                            {cls.className || 'Unnamed Class'}
                          </p>
                          <p className="mt-1 font-mono text-xs font-bold text-slate-400">{cls.classCode || 'No code'}</p>
                        </div>
                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <p className="max-w-[240px] truncate font-semibold text-slate-800">{cls.courseTitle || 'No course assigned'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{cls.description || 'No schedule notes added'}</p>

                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{cls.teacherName || 'Not assigned'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">Teacher portal batch</p>
                    </td>

                    <td className="px-5 py-4">
                      {cls.onlineClassLink ? (
                        <a
                          href={cls.onlineClassLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#1E6BB8] transition-colors hover:bg-blue-100"
                        >
                          Open class link
                        </a>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700">
                          Link missing
                        </span>
                      )}
                      <p className="mt-2 text-xs font-semibold text-slate-400">{modeLabel(cls)}</p>
                    </td>

                    <td className="px-5 py-4">

                      <div className="max-w-[220px]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-extrabold text-slate-900">{cls.studentsCount}/{cls.capacity}</span>
                          <span className="text-xs font-bold text-slate-400">{seatsLeft} seats left</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${fillPercent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${fillPercent}%` }} />
                        </div>
                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <Badge
                        color={statusColor(cls.status)}
                      >
                        {cls.status}
                      </Badge>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            setEnrollingInClass(
                              cls
                            )
                          }
                          className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-extrabold text-[#1E6BB8] shadow-sm transition-colors hover:bg-blue-50"
                        >
                          Enroll
                        </button>

                        <button
                          onClick={() =>
                            setEditingClass({
                              ...cls,
                            })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:border-[#1E6BB8]/40 hover:bg-blue-50 hover:text-[#1E6BB8]"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            setDeletingClass(
                              cls
                            )
                          }
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-600 shadow-sm transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </Card>

      {/* ========================================================
          ADD CLASS MODAL
      ======================================================== */}

      {showAddModal && (
        <Modal
          title="Create New Class Batch"
          onClose={() =>
            setShowAddModal(false)
          }
          size="lg"
        >

          <div className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Class Code"
                placeholder="e.g. CLS-GEN-001"
                value={form.classCode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    classCode: value,
                  }))
                }
                required
              />

              <Input
                label="Batch Name"
                placeholder="e.g. General English Saturday Batch"
                value={form.className}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    className: value,
                  }))
                }
                required
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Select
                label="Course"
                value={form.courseId}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    courseId: value,
                    teacherId: '',
                  }))
                }
                options={courseOptions}
                required
              />

              <Select
                label="Assigned Teacher"
                value={form.teacherId}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    teacherId: value,
                  }))
                }
                options={teacherOptions}
                required
              />

            </div>

            {availableTeachers.length === 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-700">
                No active teachers are available.
                Please create or activate a teacher
                from Teacher Management first.
              </div>
            )}

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">

              <strong>Assignment:</strong>{' '}

              The selected teacher will be assigned
              directly to this class batch. The
              teacher does not need to be manually
              assigned to the course first.

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Class Capacity"
                type="number"
                value={String(form.capacity)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    capacity:
                      Number(value) || 0,
                  }))
                }
                required
              />

              <Input
                label="Online Class Link"
                placeholder="https://meet.google.com/..."
                value={form.onlineClassLink}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    onlineClassLink: value,
                  }))
                }
              />

            </div>

            <Textarea
              label="Batch Schedule & Details"
              placeholder="Example: Saturday 9:00 AM - 11:00 AM. Enter additional class details..."
              value={form.description}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  description: value,
                }))
              }
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">

              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  setShowAddModal(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleCreate}
                disabled={
                  !form.classCode.trim() ||
                  !form.className.trim() ||
                  !form.courseId ||
                  !form.teacherId ||
                  !form.capacity ||
                  availableTeachers.length === 0
                }
              >
                Create Class Batch
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {/* ========================================================
          EDIT CLASS
      ======================================================== */}

      {editingClass && (
        <Modal
          title={`Edit Class (${editingClass.classCode})`}
          onClose={() =>
            setEditingClass(null)
          }
          size="lg"
        >

          <div className="space-y-5">

            <Input
              label="Batch Name"
              value={editingClass.className}
              onChange={(value) =>
                setEditingClass((current) =>
                  current
                    ? {
                        ...current,
                        className: value,
                      }
                    : null
                )
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Assigned Course"
                value={
                  editingClass.courseTitle ||
                  '—'
                }
                disabled
              />

              <Input
                label="Assigned Teacher"
                value={
                  editingClass.teacherName ||
                  'Not assigned'
                }
                disabled
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Class Capacity"
                type="number"
                value={String(
                  editingClass.capacity
                )}
                onChange={(value) =>
                  setEditingClass((current) =>
                    current
                      ? {
                          ...current,
                          capacity:
                            Number(value) || 0,
                        }
                      : null
                  )
                }
                required
              />

              <Input
                label="Online Class Link"
                value={
                  editingClass.onlineClassLink
                }
                onChange={(value) =>
                  setEditingClass((current) =>
                    current
                      ? {
                          ...current,
                          onlineClassLink:
                            value,
                        }
                      : null
                  )
                }
              />

            </div>

            <Textarea
              label="Batch Schedule & Details"
              value={
                editingClass.description || ''
              }
              onChange={(value) =>
                setEditingClass((current) =>
                  current
                    ? {
                        ...current,
                        description: value,
                      }
                    : null
                )
              }
            />

            <Select
              label="Status"
              value={editingClass.status}
              onChange={(value) =>
                setEditingClass((current) =>
                  current
                    ? {
                        ...current,
                        status: value,
                      }
                    : null
                )
              }
              options={[
                {
                  value: 'ACTIVE',
                  label: 'Active',
                },
                {
                  value: 'INACTIVE',
                  label: 'Inactive',
                },
                {
                  value: 'COMPLETED',
                  label: 'Completed',
                },
              ]}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">

              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  setEditingClass(null)
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleUpdate}
              >
                Save Changes
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {/* ========================================================
          CLASS RECORDINGS
      ======================================================== */}

      {managingRecordingsClass && (
        <Modal
          title={`Class Recordings (${managingRecordingsClass.classCode})`}
          onClose={() => {
            setManagingRecordingsClass(null);
            setClassRecordings([]);
            setRecordingForm(emptyRecordingForm);
          }}
          size="lg"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-display text-lg font-extrabold text-slate-950">
                {managingRecordingsClass.className}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {managingRecordingsClass.courseTitle || 'Course'} · {managingRecordingsClass.teacherName || 'Teacher'}
              </p>
              <p className="mt-2 text-sm text-blue-700">
                Students approved for this batch will see these recordings in their course materials.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-950">
                    Add recording
                  </h3>
                  <p className="text-sm font-semibold text-slate-400">
                    Paste a recording link or upload MP4, WebM, or MOV video.
                  </p>
                </div>
                <Badge color={recordingForm.sourceType === 'LINK' ? 'blue' : 'teal'}>
                  {recordingForm.sourceType === 'LINK' ? 'Link' : 'Video file'}
                </Badge>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setRecordingForm((current) => ({ ...current, sourceType: 'LINK', file: null }))}
                  className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                    recordingForm.sourceType === 'LINK'
                      ? 'bg-white text-[#1E6BB8] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Recording Link
                </button>
                <button
                  type="button"
                  onClick={() => setRecordingForm((current) => ({ ...current, sourceType: 'FILE', recordingUrl: '' }))}
                  className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                    recordingForm.sourceType === 'FILE'
                      ? 'bg-white text-[#1E6BB8] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload Video
                </button>
              </div>

              <Input
                label="Recording Title"
                value={recordingForm.title}
                onChange={(value) =>
                  setRecordingForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
                placeholder="e.g. Week 1 Grammar Recording"
                required
              />

              {recordingForm.sourceType === 'LINK' ? (
                <Input
                  label="Recording Link"
                  value={recordingForm.recordingUrl}
                  onChange={(value) =>
                    setRecordingForm((current) => ({
                      ...current,
                      recordingUrl: value,
                    }))
                  }
                  placeholder="https://drive.google.com/... or https://zoom.us/rec/..."
                  inputMode="url"
                  required
                  className="mt-4"
                />
              ) : (
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">
                    Video File<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={(event) =>
                      setRecordingForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                    className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#1E6BB8] focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                  {recordingForm.file && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Selected: {recordingForm.file.name}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleCreateRecording}
                  disabled={recordingSubmitting}
                >
                  {recordingSubmitting ? 'Saving...' : 'Add Recording'}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-extrabold text-slate-950">
                  Existing recordings
                </h3>
                <Badge color="slate">{classRecordings.length}</Badge>
              </div>

              {recordingsLoading ? (
                <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-500">
                  Loading recordings...
                </p>
              ) : classRecordings.length === 0 ? (
                <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-400">
                  No recordings have been added for this class yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {classRecordings.map((resource) => (
                    <div
                      key={resource._id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-slate-900">{resource.title}</p>
                          <Badge color={resource.sourceType === 'LINK' ? 'blue' : 'teal'}>
                            {resource.sourceType === 'LINK' ? 'Link' : 'Video'}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-400">
                          {resource.sourceType === 'LINK'
                            ? resource.externalUrl
                            : resource.originalName || 'Uploaded video'}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {resource.sourceType === 'LINK' && resource.externalUrl && (
                          <a
                            href={resource.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl border border-[#1E6BB8] px-4 py-2 text-xs font-extrabold text-[#1E6BB8] hover:bg-blue-50"
                          >
                            Open
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRecording(resource._id)}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}

      {deletingClass && (
        <Modal
          title="Confirm Delete Class Batch"
          onClose={() =>
            setDeletingClass(null)
          }
          size="sm"
        >

          <div className="space-y-5">

            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <strong>
                {deletingClass.className}
              </strong>
              ?
            </p>

            <p className="text-xs text-slate-400">
              Class code:{' '}
              {deletingClass.classCode}
            </p>

            <div className="flex gap-3 justify-end">

              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  setDeletingClass(null)
                }
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                type="button"
                onClick={handleDelete}
              >
                Delete Class
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {/* ========================================================
          MANUAL ENROLLMENT
      ======================================================== */}

      {enrollingInClass && (
        <Modal
          title={`Enroll Student - ${enrollingInClass.className}`}
          onClose={() => {
            setEnrollingInClass(null);
            setSelectedStudentId('');
          }}
          size="sm"
        >

          <div className="space-y-5">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs text-slate-500">
                Class Batch
              </p>

              <p className="font-semibold text-slate-800 mt-1">
                {enrollingInClass.className}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {enrollingInClass.classCode}
              </p>

            </div>

            <Select
              label="Student"
              value={selectedStudentId}
              onChange={
                setSelectedStudentId
              }
              options={studentOptions}
              required
            />

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">

              <p className="text-xs text-blue-700">
                Admin manual enrollment will be
                connected to the enrollment backend
                in the next step.
              </p>

            </div>

            <div className="flex gap-3 justify-end">

              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setEnrollingInClass(null);
                  setSelectedStudentId('');
                }}
              >
                Close
              </Button>

              <Button
                type="button"
                onClick={handleManualEnroll}
                disabled={!selectedStudentId}
              >
                Confirm Enrollment
              </Button>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
}
