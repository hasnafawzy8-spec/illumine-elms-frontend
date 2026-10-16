import { courses as initialCourses } from '../../data';
import { Button, Badge, Card } from '../../components/ui';
import { Course, CoursePromotion, View } from '../../types';
import CourseReviews from '../../components/CourseReviews';
import { useEffect, useState } from 'react';
import { courseResourcesAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  selectedCourseId: string | null;
  enrolledCourseIds: string[];
  onEnroll: () => void;
  courses?: Course[];
  promotion?: CoursePromotion | null;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const strokeProps = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'arrow-left':
      return <svg {...common}><path {...strokeProps} d="M19 12H5" /><path {...strokeProps} d="m11 6-6 6 6 6" /></svg>;
    case 'calendar':
      return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
    case 'clock':
      return <svg {...common}><path {...strokeProps} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path {...strokeProps} d="M12 6v6l4 2" /></svg>;
    case 'monitor':
      return <svg {...common}><path {...strokeProps} d="M4 5h16v11H4V5Z" /><path {...strokeProps} d="M8 21h8M12 16v5" /></svg>;
    case 'card':
      return <svg {...common}><path {...strokeProps} d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path {...strokeProps} d="M2 10h20M6 15h4" /></svg>;
    case 'users':
      return <svg {...common}><path {...strokeProps} d="M16 21a4 4 0 0 0-8 0" /><path {...strokeProps} d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...strokeProps} d="M22 21a3 3 0 0 0-4-2.8" /></svg>;
    case 'graduation':
      return <svg {...common}><path {...strokeProps} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...strokeProps} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /></svg>;
    case 'check':
      return <svg {...common}><path {...strokeProps} d="m5 12 4 4L19 6" /></svg>;
    case 'spark':
      return <svg {...common}><path {...strokeProps} d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" /></svg>;
    case 'download':
      return <svg {...common}><path {...strokeProps} d="M12 3v12" /><path {...strokeProps} d="m7 10 5 5 5-5" /><path {...strokeProps} d="M5 21h14" /></svg>;
    case 'lock':
      return <svg {...common}><path {...strokeProps} d="M7 11V8a5 5 0 0 1 10 0v3" /><path {...strokeProps} d="M6 11h12v10H6V11Z" /></svg>;
    case 'file':
      return <svg {...common}><path {...strokeProps} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path {...strokeProps} d="M14 2v6h6" /></svg>;
    default:
      return null;
  }
}

export default function CourseDetail({ navigate, selectedCourseId, enrolledCourseIds, onEnroll, courses = initialCourses, promotion }: Props) {
  const course = courses.find(c => c.id === selectedCourseId);
  if (!course) return <div className="p-8 text-center text-slate-400">Course not found.</div>;

  const isEnrolled = enrolledCourseIds.includes(course.id);
  const courseOffer = promotion && String(promotion.courseId) === String(course.id) ? promotion : null;
  const totalSeats = Math.max(course.totalSeats || 0, course.availableSeats || 0, 1);
  const availableSeats = Math.min(Math.max(course.availableSeats ?? totalSeats, 0), totalSeats);
  const seatsPercent = Math.min(100, Math.max(0, ((totalSeats - availableSeats) / totalSeats) * 100));
  const whatYouLearnList = course.whatYouLearn || [
    'Core grammar concepts and syntactic fluency',
    'Advanced vocabulary development and idiom mastery',
    'Interactive conversational drills with live feedback',
    'Structured writing tasks with assessment',
  ];
  const regularFee = course.monthlyFee || 0;
  const payableFee = courseOffer?.discountedFee || regularFee;
  const monthlyFeeFormatted = payableFee.toLocaleString();
  const detailItems = [
    { label: 'Grade', value: course.grade || 'All Grades', icon: 'graduation' },
    { label: 'Duration', value: course.duration || '3 Months', icon: 'clock' },
    { label: 'Schedule', value: course.schedule || 'Weekly Classes', icon: 'calendar' },
    { label: 'Class Type', value: course.classType || 'Online', icon: 'monitor' },
    { label: courseOffer ? 'Offer Fee' : 'Monthly Fee', value: `Rs. ${monthlyFeeFormatted}`, icon: 'card' },
    { label: 'Available Seats', value: `${availableSeats} of ${totalSeats}`, icon: 'users' },
  ];

  return (
    <div className="fade-in-up space-y-7">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('student-courses')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 shadow-sm hover:border-[#1E6BB8]/30 hover:bg-blue-50 hover:text-[#1E6BB8]">
          <Icon name="arrow-left" className="h-4 w-4" /> Back to Courses
        </button>
        {isEnrolled && <Badge color="green" className="px-3 py-1.5">Enrolled</Badge>}
      </div>

      {/* Hero */}
      <section className="course-detail-hero group relative overflow-hidden rounded-[2rem] bg-slate-950">
        <img src={course.image || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=900&h=560&fit=crop&auto=format'} alt={course.name} className="course-detail-hero-image h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/86 via-slate-950/48 to-slate-950/8" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-transparent to-transparent" />
        <div className="relative flex min-h-[15rem] flex-col justify-end p-5 text-white sm:min-h-[17rem] sm:p-7">
          <div className="flex flex-wrap gap-2">
            <Badge color={course.status === 'Open' ? 'green' : 'red'}>{course.status || 'Open'}</Badge>
            <Badge color={course.classType === 'Online' ? 'blue' : 'amber'}>{course.classType || 'Online'}</Badge>
            {courseOffer && <Badge color="amber">Early Bird {courseOffer.discountPercent}% Off</Badge>}
            <Badge color="slate">{course.category || 'General'}</Badge>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{course.name}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-blue-50/90 line-clamp-2">{course.description}</p>
          <div className="mt-4 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Grade', course.grade || 'All'],
              ['Duration', course.duration || '3 Months'],
              ['Mode', course.classType || 'Online'],
              ['Seats', `${availableSeats}/${totalSeats}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/60">{label}</p>
                <p className="mt-1 text-sm font-extrabold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {courseOffer && (
            <Card className="overflow-hidden rounded-[2rem] border-amber-200 bg-gradient-to-r from-amber-50 via-white to-blue-50 p-6 sm:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge color="amber" className="mb-3">Early Bird Offer</Badge>
                  <h3 className="font-display text-2xl font-extrabold text-slate-950">{courseOffer.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{courseOffer.description}</p>
                  <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Offer closes {new Date(courseOffer.closingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-5 text-right shadow-lg shadow-blue-900/10 ring-1 ring-slate-100">
                  <p className="text-sm font-bold text-slate-400 line-through">Rs. {regularFee.toLocaleString()}</p>
                  <p className="font-display text-4xl font-extrabold text-[#1E6BB8]">Rs. {courseOffer.discountedFee.toLocaleString()}</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-700">
                    Save Rs. {courseOffer.discountAmount.toLocaleString()} ({courseOffer.discountPercent}%)
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden rounded-[2rem] border-slate-200 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
                <Icon name="spark" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Course overview</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">About This Course</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{course.description}</p>
              </div>
            </div>

            <h3 className="mt-7 font-display text-xl font-extrabold text-slate-950">What You'll Learn</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {whatYouLearnList.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Details</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Course Details</h3>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {detailItems.map(d => (
                <div key={d.label} className="course-detail-tile rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1E6BB8] shadow-sm">
                      <Icon name={d.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{d.label}</p>
                      <p className="mt-1 text-sm font-extrabold leading-5 text-slate-900">{d.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Seat bar */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-extrabold uppercase tracking-[0.14em] text-slate-400">Seat Availability</span>
                <span className={`font-extrabold ${availableSeats === 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {availableSeats} seats remaining
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${seatsPercent > 80 ? 'bg-red-400' : seatsPercent > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${seatsPercent}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-slate-200">
            <div className="grid gap-0 sm:grid-cols-[auto_1fr]">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6">
                <img src={course.teacherImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces'} alt={course.teacher || 'Teacher'} className="h-24 w-24 rounded-3xl object-cover shadow-xl shadow-blue-900/10" />
              </div>
              <div className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Teacher</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{course.teacher || 'Illumine Faculty'}</h3>
                <p className="mt-1 text-sm font-extrabold text-[#1E6BB8]">English Educator</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{course.teacherBio || 'Certified English educator with extensive teaching experience.'}</p>
              </div>
            </div>
          </Card>

          {isEnrolled && <CourseMaterials courseId={course.id} />}

          <CourseReviews courseId={course.id} canReview={isEnrolled} />
        </div>

        {/* Enrollment card */}
        <div className="space-y-4">
          <Card className="sticky top-4 overflow-hidden rounded-[2rem] border-slate-200">
            <div className="bg-gradient-to-br from-[#10243a] via-[#164c78] to-[#1E6BB8] p-6 text-white">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-100">
                {courseOffer ? 'Early bird enrollment' : 'Enrollment'}
              </p>
              {courseOffer && (
                <p className="mt-3 text-sm font-bold text-blue-100 line-through">
                  Regular Rs. {regularFee.toLocaleString()}
                </p>
              )}
              <p className="mt-3 font-display text-4xl font-extrabold">Rs. {monthlyFeeFormatted}</p>
              <p className="mt-1 text-sm font-semibold text-blue-100">
                {courseOffer ? `Save Rs. ${courseOffer.discountAmount.toLocaleString()}` : 'per month'}
              </p>
            </div>
            <div className="p-6">

            {isEnrolled ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-green-50 p-4 text-center">
                  <p className="text-sm font-extrabold text-green-700">You are enrolled in this course</p>
                </div>
                <Button fullWidth variant="outline" onClick={() => navigate('student-schedule')}>View Schedule</Button>
                <Button fullWidth variant="outline" onClick={() => navigate('student-my-courses')}>My Courses</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  disabled={course.status === 'Full'}
                  onClick={onEnroll}
                >
                  {course.status === 'Full' ? 'Course Full' : 'Enroll Now'}
                </Button>
                <Button fullWidth variant="outline" size="sm" onClick={() => navigate('student-courses')}>
                  Browse Other Courses
                </Button>
              </div>
            )}

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              {['Enroll from anywhere', 'Cancel before start date', 'Monthly payment - no annual lock-in'].map(item => (
                <p key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  {item}
                </p>
              ))}
            </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CourseMaterials({ courseId }: { courseId: string }) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAccessDenied(false);
    courseResourcesAPI.getForCourse(courseId)
      .then(items => { if (active) setResources(items); })
      .catch(() => { if (active) { setResources([]); setAccessDenied(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  const download = async (resource: any) => {
    try {
      if (resource.sourceType === 'LINK' && resource.externalUrl) {
        window.open(resource.externalUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const blob = await courseResourcesAPI.download(resource._id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resource.originalName || resource.title;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setAccessDenied(true);
    }
  };

  return (
    <Card className="rounded-[2rem] border-slate-200 p-6 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Resources</p>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Course Materials</h3>
          <p className="mt-2 text-sm text-slate-500">Notes and class recordings shared by your institute team.</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
          <Icon name="file" className="h-6 w-6" />
        </div>
      </div>
      {loading ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-400">Loading course materials...</p>
        : accessDenied ? <p className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800"><Icon name="lock" className="h-5 w-5" /> Materials are available after your course fee is paid and enrollment is approved.</p>
          : resources.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-400">Course materials have not been uploaded yet.</p>
            : <div className="space-y-2">{resources.map(resource => (
              <div key={resource._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800">{resource.resourceType === 'CLASS_RECORDING' ? 'Recording · ' : 'PDF · '}{resource.title}</p>
                  <p className="truncate text-xs font-semibold text-slate-400">{resource.class?.className ? `${resource.class.className} · ` : ''}{resource.sourceType === 'LINK' ? 'Recording link' : resource.originalName}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => download(resource)}><Icon name="download" className="h-4 w-4" /> {resource.sourceType === 'LINK' ? 'Open Link' : resource.resourceType === 'CLASS_RECORDING' ? 'Recording' : 'PDF'}</Button>
              </div>
            ))}</div>}
    </Card>
  );
}
