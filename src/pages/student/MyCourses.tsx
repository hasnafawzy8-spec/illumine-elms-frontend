import { useEffect, useMemo, useState } from 'react';
import { courses as initialCourses, classSessions as fallbackSessions } from '../../data';
import { Button, Badge, Card, EmptyState } from '../../components/ui';
import { ClassSession, Course, View } from '../../types';
import { courseResourcesAPI, mapBackendCourseToFrontend } from '../../services/api';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  enrolledCourseIds: string[];
  studentEnrollments?: any[];
  onSelectCourse: (id: string) => void;
  courses?: Course[];
  sessions?: ClassSession[];
}

type DisplayItem = {
  course: Course;
  status: string;
  enrollmentId: string;
  classInfo?: any;
  paymentPlan?: string;
  paymentStatus?: string;
  paidAmount?: number;
  remainingAmount?: number;
  nextPaymentDueDate?: string;
  isAccessActive?: boolean;
};

const fallbackCourseImage =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=520&fit=crop';

export default function MyCourses({
  navigate,
  enrolledCourseIds,
  studentEnrollments = [],
  onSelectCourse,
  courses = initialCourses,
  sessions = fallbackSessions,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [openedCourseId, setOpenedCourseId] = useState<string | null>(null);

  const displayItems = useMemo<DisplayItem[]>(() => {
    const fromEnrollments = studentEnrollments
      .map(enrollment => {
        const courseId = enrollment.course?._id || enrollment.course?.id || enrollment.course;
        const matchedCourse = courses.find(course => course.id === courseId);
        const backendCourse = enrollment.course && typeof enrollment.course === 'object' ? enrollment.course : null;
        const course = matchedCourse || (backendCourse ? mapBackendCourseToFrontend(backendCourse) : null);

        if (!course) return null;

        return {
          course,
          status: enrollment.status || 'PENDING',
          enrollmentId: enrollment._id || enrollment.id || course.id,
          classInfo: enrollment.class,
          paymentPlan: enrollment.paymentPlan,
          paymentStatus: enrollment.paymentStatus,
          paidAmount: enrollment.paidAmount || 0,
          remainingAmount: enrollment.remainingAmount || 0,
          nextPaymentDueDate: enrollment.nextPaymentDueDate,
          isAccessActive: enrollment.isAccessActive !== false,
        };
      })
      .filter(Boolean) as DisplayItem[];

    if (fromEnrollments.length > 0) return fromEnrollments;

    return enrolledCourseIds
      .map(id => {
        const course = courses.find(item => item.id === id);
        return course ? { course, status: 'APPROVED', enrollmentId: id } : null;
      })
      .filter(Boolean) as DisplayItem[];
  }, [courses, enrolledCourseIds, studentEnrollments]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...displayItems]
      .filter(item => {
        const isApproved = item.status === 'APPROVED';
        if (statusFilter === 'approved' && !isApproved) return false;
        if (statusFilter === 'pending' && isApproved) return false;
        if (!normalizedSearch) return true;

        return [item.course.name, item.course.teacher, item.course.grade, item.course.category]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortBy === 'teacher') return String(a.course.teacher || '').localeCompare(String(b.course.teacher || ''));
        if (sortBy === 'latest') return String(b.enrollmentId).localeCompare(String(a.enrollmentId));
        return String(a.course.name || '').localeCompare(String(b.course.name || ''));
      });
  }, [displayItems, search, sortBy, statusFilter]);

  const openedItem = displayItems.find(item => item.course.id === openedCourseId);

  if (openedItem && openedItem.status === 'APPROVED') {
    return (
      <CourseWorkspace
        item={openedItem}
        sessions={sessions}
        onBack={() => setOpenedCourseId(null)}
        onOpenCatalogue={() => {
          onSelectCourse(openedItem.course.id);
          navigate('student-course-detail');
        }}
      />
    );
  }

  return (
    <div className="fade-in-up space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1E6BB8]">Learning portal</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">My Courses</h1>
            <p className="mt-1 text-sm text-slate-500">
              {displayItems.length} enrolled course{displayItems.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => navigate('student-courses')}>Browse More Courses</Button>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">🎓</span>}
          title="No enrollments yet"
          description="You haven't enrolled in any courses yet. Browse our catalogue to get started."
          action={<Button onClick={() => navigate('student-courses')}>Explore Courses</Button>}
        />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search enrolled courses"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1E6BB8] focus:bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1E6BB8]"
              >
                <option value="all">All enrollments</option>
                <option value="approved">Enrolled only</option>
                <option value="pending">Pending approval</option>
              </select>
              <select
                value={sortBy}
                onChange={event => setSortBy(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1E6BB8]"
              >
                <option value="name">Sort by course name</option>
                <option value="teacher">Sort by teacher</option>
                <option value="latest">Newest enrollment</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<span className="text-2xl">🔍</span>}
              title="No matching courses"
              description="Try a different search or filter."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map(item => {
                const { course, status, enrollmentId } = item;
                const isInstallment = item.paymentPlan === 'INSTALLMENT' || Number(item.remainingAmount || 0) > 0;
                const isOverdue = item.paymentStatus === 'INSTALLMENT_OVERDUE' || status === 'INACTIVE' || item.isAccessActive === false;
                const isApproved = status === 'APPROVED' && !isOverdue;

                return (
                  <Card
                    key={enrollmentId}
                    onClick={isApproved ? () => setOpenedCourseId(course.id) : undefined}
                    className={`overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${!isApproved ? 'opacity-90' : ''}`}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={course.image || fallbackCourseImage}
                        alt={course.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <Badge color={isApproved ? 'green' : 'amber'}>
                          {isOverdue ? 'Inactive' : isApproved ? 'Enrolled' : 'Pending approval'}
                        </Badge>
                        {isInstallment && <Badge color={isOverdue ? 'red' : 'amber'}>{isOverdue ? 'Payment overdue' : 'Installment plan'}</Badge>}
                        <Badge color={course.classType === 'Online' ? 'blue' : 'slate'}>{course.classType || 'Class'}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{course.grade || course.category}</p>
                        <h2 className="mt-1 line-clamp-2 min-h-[3rem] font-display text-lg font-bold text-slate-900">
                          {course.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={course.teacherImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces'}
                          alt={course.teacher || 'Teacher'}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">{course.teacher || 'Illumine Faculty'}</p>
                          <p className="truncate text-xs text-slate-400">{course.schedule || 'Weekly classes'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-400">Duration</p>
                          <p className="mt-0.5 font-semibold text-slate-700">{course.duration || 'Course'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-400">Fee</p>
                          <p className="mt-0.5 font-semibold text-slate-700">Rs. {(course.monthlyFee || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      {isInstallment && (
                        <div className={`rounded-2xl border p-3 text-xs ${isOverdue ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                          <div className="flex justify-between gap-3">
                            <span className="font-bold">Remaining payment</span>
                            <span className="font-black">Rs. {(item.remainingAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 flex justify-between gap-3">
                            <span>{isOverdue ? 'Access status' : 'Next installment due'}</span>
                            <span className="font-bold">
                              {isOverdue
                                ? 'Inactive until payment'
                                : item.nextPaymentDueDate
                                  ? formatColomboDisplayDate(item.nextPaymentDueDate)
                                  : 'After approval'}
                            </span>
                          </div>
                        </div>
                      )}

                      {isApproved ? (
                        <Button fullWidth variant="outline" onClick={() => setOpenedCourseId(course.id)}>
                          Open Course
                        </Button>
                      ) : isOverdue ? (
                        <Button fullWidth variant="ghost" disabled>
                          Inactive - Payment Overdue
                        </Button>
                      ) : (
                        <Button fullWidth variant="ghost" disabled>
                          Waiting for Admin Approval
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseWorkspace({
  item,
  sessions,
  onBack,
  onOpenCatalogue,
}: {
  item: DisplayItem;
  sessions: ClassSession[];
  onBack: () => void;
  onOpenCatalogue: () => void;
}) {
  const { course } = item;
  const courseSessions = sessions.filter(session => session.courseId === course.id);

  return (
    <div className="fade-in-up space-y-6">
      <button onClick={onBack} className="text-sm font-semibold text-[#1E6BB8] hover:underline">
        ← Back to My Courses
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="relative h-64 bg-slate-100">
          <img src={course.image || fallbackCourseImage} alt={course.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge color="green">Enrolled</Badge>
              <Badge color={course.classType === 'Online' ? 'blue' : 'slate'}>{course.classType || 'Class'}</Badge>
              <Badge color="slate">{course.grade || course.category || 'English'}</Badge>
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-bold">{course.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">{course.teacher || 'Illumine Faculty'} · {course.schedule || 'Weekly classes'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-6">
          <CourseMaterials courseId={course.id} />
        </div>

        <div className="space-y-6">
          <ClassLinks course={course} sessions={courseSessions} enrollmentClass={item.classInfo} />

          <Card className="p-5">
            <h2 className="font-display text-lg font-bold text-slate-900">Course Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Teacher" value={course.teacher || 'Illumine Faculty'} />
              <SummaryRow label="Grade" value={course.grade || 'All Levels'} />
              <SummaryRow label="Duration" value={course.duration || 'Course'} />
              <SummaryRow label="Monthly fee" value={`Rs. ${(course.monthlyFee || 0).toLocaleString()}`} />
            </div>
            <Button fullWidth variant="outline" className="mt-5" onClick={onOpenCatalogue}>
              View Course Details
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CourseMaterials({ courseId }: { courseId: string }) {
  const [resources, setResources] = useState<any[]>([]);
  const [accessError, setAccessError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAccessError('');

    courseResourcesAPI
      .getForCourse(courseId)
      .then(items => {
        if (active) setResources(items);
      })
      .catch((error) => {
        if (active) {
          setResources([]);
          setAccessError(error?.message || 'Materials are available after your course fee is paid and enrollment is approved.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const notes = resources.filter(resource => resource.resourceType !== 'CLASS_RECORDING');
  const recordings = resources.filter(resource => resource.resourceType === 'CLASS_RECORDING');

  const download = async (resource: any) => {
    try {
      if (resource.sourceType === 'LINK' && resource.externalUrl) {
        window.open(resource.externalUrl, '_blank', 'noopener,noreferrer');
        setAccessError('');
        return;
      }

      const blob = await courseResourcesAPI.download(resource._id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resource.originalName || resource.title || 'course-file';
      anchor.click();
      URL.revokeObjectURL(url);
      setAccessError('');
    } catch (error: any) {
      setAccessError(error?.message || 'This file could not be downloaded. Please try again or contact the institute.');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Learning Materials</h2>
          <p className="mt-1 text-sm text-slate-500">Notes and recordings shared by your institute team.</p>
        </div>
        <Badge color="blue">{resources.length} file{resources.length !== 1 ? 's' : ''}</Badge>
      </div>

      {loading ? (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading course materials…</div>
      ) : accessError && resources.length === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {accessError}
        </div>
      ) : (
        <>
          {accessError && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {accessError}
            </div>
          )}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ResourceSection
              title="Course Notes"
              emptyText="No notes have been uploaded yet."
              resources={notes}
              buttonText="Download PDF"
              onDownload={download}
            />
            <ResourceSection
              title="Class Recordings"
              emptyText="No recordings have been uploaded yet."
              resources={recordings}
              buttonText="Download Video"
              onDownload={download}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function ResourceSection({
  title,
  emptyText,
  resources,
  buttonText,
  onDownload,
}: {
  title: string;
  emptyText: string;
  resources: any[];
  buttonText: string;
  onDownload: (resource: any) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {resources.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {resources.map(resource => (
            <div key={resource._id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="line-clamp-2 text-sm font-semibold text-slate-800">{resource.title}</p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {resource.class?.className ? `${resource.class.className} · ` : ''}
                {resource.sourceType === 'LINK' ? 'Recording link' : resource.originalName || 'Course file'}
              </p>
              {resource.fileAvailable === false ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  {resource.sourceType === 'LINK' ? 'Link unavailable - ask admin to update it' : 'File unavailable - ask teacher to re-upload'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onDownload(resource)}
                  className="mt-3 rounded-lg border border-[#1E6BB8] px-3 py-1.5 text-sm font-semibold text-[#1E6BB8] hover:bg-blue-50"
                >
                  {resource.sourceType === 'LINK' ? 'Open Recording' : buttonText}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ClassLinks({ course, sessions, enrollmentClass }: { course: Course; sessions: ClassSession[]; enrollmentClass?: any }) {
  const onlineSessions = sessions.filter(session => session.joinLink);
  const assignedClassLink = enrollmentClass?.onlineClassLink || '';
  const assignedClassName = enrollmentClass?.className || enrollmentClass?.classCode || 'Your assigned class';

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-slate-900">Class Links</h2>
        <Badge color={assignedClassLink || onlineSessions.length > 0 ? 'green' : 'slate'}>
          {assignedClassLink || onlineSessions.length > 0 ? 'Available' : course.classType || 'Class'}
        </Badge>
      </div>

      {assignedClassLink && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-bold text-slate-900">{assignedClassName}</p>
          <p className="mt-1 text-xs text-slate-500">Approved enrollment class link</p>
          <a
            href={assignedClassLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-lg bg-[#1E6BB8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#155a9c]"
          >
            Join Class
          </a>
        </div>
      )}

      {!assignedClassLink && onlineSessions.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {course.classType === 'Physical'
            ? 'This course is held at the institute.'
            : 'Class links will appear here when your teacher publishes them.'}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {onlineSessions.map(session => (
            <div key={session.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{session.className || session.courseName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {session.day}, {session.date} · {session.startTime}–{session.endTime}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{session.platform || 'Online class'}</p>
                </div>
                <a
                  href={session.joinLink}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg bg-[#1E6BB8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#155a9c]"
                >
                  Join
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}
