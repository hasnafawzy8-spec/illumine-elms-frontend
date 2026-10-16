import { useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Card,
  Input,
  Select,
  PageHeader,
  Modal,
} from '../../components/ui';
import { View } from '../../types';
import {
  teachersAPI,
  coursesAPI,
} from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (
    msg: string,
    type: 'success' | 'error' | 'info'
  ) => void;
}

interface CourseOption {
  id: string;
  courseCode: string;
  title: string;
  category: string;
  grade?: string;
  status?: string;
}

interface TeacherItem {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  assignedCourses: CourseOption[];
  assignedClassesCount: number;
  isActive: boolean;
}

export default function AdminTeachers({
  showToast,
}: Props) {
  const [teachers, setTeachers] =
    useState<TeacherItem[]>([]);

  const [courses, setCourses] =
    useState<CourseOption[]>([]);

  const [search, setSearch] =
    useState('');

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editingTeacher, setEditingTeacher] =
    useState<TeacherItem | null>(null);

  const [deletingTeacher, setDeletingTeacher] =
    useState<TeacherItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    qualification: 'BA in English, CELTA',
    password: '',
    assignedCourses: [] as string[],
  });

  // ============================================================
  // LOAD TEACHERS
  // ============================================================

  const loadTeachers = async () => {
    try {
      const data = await teachersAPI.getAll();

      if (Array.isArray(data)) {
        setTeachers(
          data.map((t: any) => ({
            id: t._id || t.id,
            teacherId:
              t.teacherId || 'TEA-001',

            firstName:
              t.user?.firstName ||
              t.firstName ||
              'Teacher',

            lastName:
              t.user?.lastName ||
              t.lastName ||
              '',

            email:
              t.user?.email ||
              t.email ||
              '',

            phone:
              t.user?.phone ||
              t.phone ||
              '',

            qualification:
              t.qualification ||
              'CELTA Certified',

            assignedCourses:
              Array.isArray(
                t.assignedCourses
              )
                ? t.assignedCourses.map(
                    (course: any) => ({
                      id:
                        course._id ||
                        course.id,

                      courseCode:
                        course.courseCode ||
                        '',

                      title:
                        course.title ||
                        'English Course',

                      category:
                        course.category ||
                        'GENERAL_ENGLISH',

                      grade:
                        course.grade ||
                        '',

                      status:
                        course.status ||
                        'ACTIVE',
                    })
                  )
                : [],

            assignedClassesCount:
              t.assignedClasses?.length ||
              0,

            isActive:
              t.user?.isActive ??
              t.isActive ??
              true,
          }))
        );
      }
    } catch (error) {
      console.log(
        'Teachers backend load notice:',
        error
      );

      showToast(
        'Could not load teachers from the server.',
        'error'
      );
    }
  };

  // ============================================================
  // LOAD COURSES
  // ============================================================

  const loadCourses = async () => {
    try {
      const data =
        await coursesAPI.getAll();

      if (Array.isArray(data)) {
        setCourses(
          data.map((course: any) => ({
            id:
              course.id ||
              course._id,

            courseCode:
              course.courseCode ||
              '',

            title:
              course.name ||
              course.title ||
              'English Course',

            category:
              course.category ||
              'GENERAL_ENGLISH',

            grade:
              course.grade ||
              '',

            status:
              course.status ||
              'ACTIVE',
          }))
        );
      }
    } catch (error) {
      console.log(
        'Courses backend load notice:',
        error
      );

      showToast(
        'Could not load courses from the server.',
        'error'
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        loadTeachers(),
        loadCourses(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // ============================================================
  // COURSE SELECTION
  // ============================================================

  const toggleCourse = (
    courseId: string
  ) => {
    setForm((previous) => {
      const alreadySelected =
        previous.assignedCourses.includes(
          courseId
        );

      return {
        ...previous,
        assignedCourses:
          alreadySelected
            ? previous.assignedCourses.filter(
                (id) => id !== courseId
              )
            : [
                ...previous.assignedCourses,
                courseId,
              ],
      };
    });
  };

  // ============================================================
  // EDIT COURSE SELECTION
  // ============================================================

  const toggleEditingCourse = (
    courseId: string
  ) => {
    setEditingTeacher(
      (previous) => {
        if (!previous) {
          return null;
        }

        const alreadyAssigned =
          previous.assignedCourses.some(
            (course) =>
              course.id === courseId
          );

        if (alreadyAssigned) {
          return {
            ...previous,
            assignedCourses:
              previous.assignedCourses.filter(
                (course) =>
                  course.id !== courseId
              ),
          };
        }

        const selectedCourse =
          courses.find(
            (course) =>
              course.id === courseId
          );

        if (!selectedCourse) {
          return previous;
        }

        return {
          ...previous,
          assignedCourses: [
            ...previous.assignedCourses,
            selectedCourse,
          ],
        };
      }
    );
  };

  // ============================================================
  // CREATE TEACHER
  // ============================================================

  const handleCreate = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email
    ) {
      showToast(
        'Teacher name and email are required.',
        'error'
      );
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      showToast(
        'Phone number must contain exactly 10 digits.',
        'error'
      );
      return;
    }

    if (
      form.assignedCourses.length === 0
    ) {
      showToast(
        'Please assign at least one course to the teacher.',
        'error'
      );
      return;
    }

    if (!form.password) {
      showToast(
        'Please enter an account password.',
        'error'
      );
      return;
    }

    try {
      const result = await teachersAPI.create({
        firstName:
          form.firstName,

        lastName:
          form.lastName,

        email:
          form.email,

        phone:
          form.phone,

        qualification:
          form.qualification,

        password:
          form.password,

        assignedCourses:
          form.assignedCourses,
      });

      await loadTeachers();

      setShowAddModal(false);

      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        qualification:
          'BA in English, CELTA',
        password: '',
        assignedCourses: [],
      });

      showToast(
        result.data?.accountReused
          ? 'Existing teacher account updated. The entered password and course assignments are now active.'
          : 'Teacher profile created successfully! The teacher can log in with the email and password provided.',
        'success'
      );
    } catch (error: any) {
      console.log(
        'Teacher backend create error:',
        error
      );

      if (error?.message === 'An account with this email address already exists') {
        showToast(
          'This email is already registered. Use a different email address, or edit the existing teacher profile to change course assignments.',
          'error'
        );
        return;
      }

      showToast(
        error?.message ||
          'Failed to create teacher.',
        'error'
      );
    }
  };

  // ============================================================
  // UPDATE TEACHER
  // ============================================================

  const handleUpdate = async () => {
    if (!editingTeacher) {
      return;
    }

    if (
      editingTeacher.assignedCourses.length ===
      0
    ) {
      showToast(
        'Please assign at least one course to the teacher.',
        'error'
      );
      return;
    }

    try {
      await teachersAPI.update(
        editingTeacher.id,
        {
          firstName:
            editingTeacher.firstName,

          lastName:
            editingTeacher.lastName,

          phone:
            editingTeacher.phone,

          qualification:
            editingTeacher.qualification,

          assignedCourses:
            editingTeacher.assignedCourses.map(
              (course) => course.id
            ),

          isActive:
            editingTeacher.isActive,
        }
      );

      await loadTeachers();

      setEditingTeacher(null);

      showToast(
        'Teacher profile updated!',
        'success'
      );
    } catch (error: any) {
      console.log(
        'Teacher backend update error:',
        error
      );

      showToast(
        error?.message ||
          'Failed to update teacher.',
        'error'
      );
    }
  };

  // ============================================================
  // DELETE TEACHER
  // ============================================================

  const handleDelete = async () => {
    if (!deletingTeacher) {
      return;
    }

    try {
      await teachersAPI.delete(
        deletingTeacher.id
      );

      setTeachers(
        (previous) =>
          previous.filter(
            (teacher) =>
              teacher.id !==
              deletingTeacher.id
          )
      );

      setDeletingTeacher(null);

      showToast(
        'Teacher profile removed.',
        'info'
      );
    } catch (error: any) {
      console.log(
        'Teacher backend delete error:',
        error
      );

      showToast(
        error?.message ||
          'Failed to delete teacher.',
        'error'
      );
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filtered =
    teachers.filter((teacher) => {
      const fullName =
        `${teacher.firstName} ${teacher.lastName}`
          .toLowerCase();

      const courseNames =
        teacher.assignedCourses
          .map(
            (course) =>
              `${course.title} ${course.courseCode}`
          )
          .join(' ')
          .toLowerCase();

      const searchText =
        search.toLowerCase();

      if (
        search &&
        !fullName.includes(searchText) &&
        !teacher.email
          .toLowerCase()
          .includes(searchText) &&
        !courseNames.includes(searchText)
      ) {
        return false;
      }

      return true;
    });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Teacher & Instructor Management"
        subtitle={`Total ${teachers.length} faculty members and language instructors`}
        action={
          <Button
            onClick={() =>
              setShowAddModal(true)
            }
          >
            + Register New Teacher
          </Button>
        }
      />

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>

          <input
            placeholder="Search teachers by name, email, or course..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1E6BB8]"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full">
            <Card className="p-8 text-center text-sm text-slate-500">
              Loading teachers...
            </Card>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center text-sm text-slate-500">
              No teachers found.
            </Card>
          </div>
        ) : (
          filtered.map((teacher) => (
            <Card
              key={teacher.id}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1E6BB8] flex items-center justify-center text-white text-xl font-bold font-display">
                      {teacher.firstName.charAt(
                        0
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 font-display text-base">
                        {teacher.firstName}{' '}
                        {teacher.lastName}
                      </h3>

                      <p className="text-xs text-slate-400 font-mono">
                        {teacher.teacherId}
                      </p>
                    </div>
                  </div>

                  <Badge
                    color={
                      teacher.isActive
                        ? 'green'
                        : 'slate'
                    }
                  >
                    {teacher.isActive
                      ? 'Active'
                      : 'On Leave'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 mb-3">
                  <div>
                    <p className="mb-1">
                      🎯{' '}
                      <strong>
                        Assigned Courses:
                      </strong>
                    </p>

                    {teacher.assignedCourses
                      .length === 0 ? (
                      <p className="text-slate-400 ml-5">
                        No courses assigned
                      </p>
                    ) : (
                      <div className="ml-5 space-y-1">
                        {teacher.assignedCourses.map(
                          (course) => (
                            <p
                              key={course.id}
                              className="text-slate-700"
                            >
                              •{' '}
                              {course.courseCode
                                ? `${course.courseCode} - `
                                : ''}
                              {course.title}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <p>
                    🎓{' '}
                    <strong>
                      Qualification:
                    </strong>{' '}
                    {teacher.qualification}
                  </p>

                  <p>
                    📞 <strong>Phone:</strong>{' '}
                    {teacher.phone}
                  </p>

                  <p>
                    ✉️ <strong>Email:</strong>{' '}
                    {teacher.email}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  📚{' '}
                  {teacher.assignedClassesCount}{' '}
                  Assigned Classes
                </span>

                <div className="space-x-2">
                  <button
                    onClick={() =>
                      setEditingTeacher({
                        ...teacher,
                        assignedCourses: [
                          ...teacher.assignedCourses,
                        ],
                      })
                    }
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      setDeletingTeacher(
                        teacher
                      )
                    }
                    className="px-2.5 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ======================================================
          ADD TEACHER MODAL
      ====================================================== */}

      {showAddModal && (
        <Modal
          title="Register New Teacher"
          onClose={() =>
            setShowAddModal(false)
          }
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. Kamal"
                value={form.firstName}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    firstName: value,
                  }))
                }
                required
              />

              <Input
                label="Last Name"
                placeholder="e.g. Perera"
                value={form.lastName}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lastName: value,
                  }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="kamal.teacher@illumine.lk"
                value={form.email}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    email: value,
                  }))
                }
                required
              />

              <Input
                label="Phone Number"
                placeholder="+94 77 123 4561"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    phone: value
                      .replace(/\D/g, '')
                      .slice(0, 10),
                  }))
                }
                required
              />
            </div>

            {/* ASSIGNED COURSES */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Assigned Courses
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <div className="border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto">
                {courses.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    No courses available in the database.
                  </div>
                ) : (
                  courses.map((course) => {
                    const selected =
                      form.assignedCourses.includes(
                        course.id
                      );

                    return (
                      <label
                        key={course.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleCourse(
                              course.id
                            )
                          }
                          className="rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
                        />

                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {course.courseCode
                              ? `${course.courseCode} - `
                              : ''}
                            {course.title}
                          </p>

                          <p className="text-xs text-slate-400">
                            {course.category}
                            {course.grade
                              ? ` • ${course.grade}`
                              : ''}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1.5">
                Select the courses this teacher is
                allowed to teach.
              </p>
            </div>

            <Input
              label="Academic Qualifications"
              placeholder="e.g. BA (Hons) English, Dip in TESL"
              value={form.qualification}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  qualification: value,
                }))
              }
            />

            <Input
              label="Account Password"
              type="password"
              value={form.password}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  password: value,
                }))
              }
              required
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() =>
                  setShowAddModal(false)
                }
              >
                Cancel
              </Button>

              <Button
                onClick={handleCreate}
              >
                Save & Register Teacher
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================
          EDIT TEACHER MODAL
      ====================================================== */}

      {editingTeacher && (
        <Modal
          title={`Edit Teacher Profile (${editingTeacher.teacherId})`}
          onClose={() =>
            setEditingTeacher(null)
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={
                  editingTeacher.firstName
                }
                onChange={(value) =>
                  setEditingTeacher(
                    (teacher) =>
                      teacher
                        ? {
                            ...teacher,
                            firstName:
                              value,
                          }
                        : null
                  )
                }
              />

              <Input
                label="Last Name"
                value={
                  editingTeacher.lastName
                }
                onChange={(value) =>
                  setEditingTeacher(
                    (teacher) =>
                      teacher
                        ? {
                            ...teacher,
                            lastName:
                              value,
                          }
                        : null
                  )
                }
              />
            </div>

            <Input
              label="Phone Number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={
                editingTeacher.phone
              }
              onChange={(value) =>
                setEditingTeacher(
                  (teacher) =>
                    teacher
                      ? {
                          ...teacher,
                          phone: value
                            .replace(
                              /\D/g,
                              ''
                            )
                            .slice(
                              0,
                              10
                            ),
                        }
                      : null
                )
              }
            />

            {/* ASSIGNED COURSES */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Assigned Courses
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <div className="border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto">
                {courses.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    No courses available.
                  </div>
                ) : (
                  courses.map((course) => {
                    const selected =
                      editingTeacher.assignedCourses.some(
                        (assignedCourse) =>
                          assignedCourse.id ===
                          course.id
                      );

                    return (
                      <label
                        key={course.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleEditingCourse(
                              course.id
                            )
                          }
                          className="rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
                        />

                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {course.courseCode
                              ? `${course.courseCode} - `
                              : ''}
                            {course.title}
                          </p>

                          <p className="text-xs text-slate-400">
                            {course.category}
                            {course.grade
                              ? ` • ${course.grade}`
                              : ''}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <Input
              label="Qualification"
              value={
                editingTeacher.qualification
              }
              onChange={(value) =>
                setEditingTeacher(
                  (teacher) =>
                    teacher
                      ? {
                          ...teacher,
                          qualification:
                            value,
                        }
                      : null
                )
              }
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeStatusTeacher"
                checked={
                  editingTeacher.isActive
                }
                onChange={(e) =>
                  setEditingTeacher(
                    (teacher) =>
                      teacher
                        ? {
                            ...teacher,
                            isActive:
                              e.target
                                .checked,
                          }
                        : null
                  )
                }
                className="rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
              />

              <label
                htmlFor="activeStatusTeacher"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Teacher Account Active
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() =>
                  setEditingTeacher(null)
                }
              >
                Cancel
              </Button>

              <Button
                onClick={handleUpdate}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================
          DELETE CONFIRMATION
      ====================================================== */}

      {deletingTeacher && (
        <Modal
          title="Confirm Remove Teacher"
          onClose={() =>
            setDeletingTeacher(null)
          }
          size="sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to remove{' '}
            <strong>
              {deletingTeacher.firstName}{' '}
              {deletingTeacher.lastName}
            </strong>{' '}
            from faculty records?
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() =>
                setDeletingTeacher(null)
              }
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Teacher
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}