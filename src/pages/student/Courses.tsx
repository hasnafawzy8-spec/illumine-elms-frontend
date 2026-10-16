import { useEffect, useMemo, useState } from 'react';
import { courses as initialCourses } from '../../data';
import { Button, Badge, PageHeader } from '../../components/ui';
import { Course, CoursePromotion, View } from '../../types';
import { authAPI, getStoredUser } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  onSelectCourse: (id: string) => void;
  enrolledCourseIds: string[];
  courses?: Course[];
  promotion?: CoursePromotion | null;
}

export default function Courses({ navigate, onSelectCourse, enrolledCourseIds, courses = initialCourses, promotion }: Props) {
  const storedUser = getStoredUser();
  const [studentGrade, setStudentGrade] = useState<string>(storedUser?.grade || '');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  useEffect(() => {
    if (studentGrade || storedUser?.role !== 'STUDENT') return;

    authAPI.getMe()
      .then(response => {
        const grade = response?.profile?.grade || response?.user?.grade || '';
        if (grade) setStudentGrade(grade);
      })
      .catch(() => {
        // Keep courses browsable even if profile refresh is unavailable.
      });
  }, [studentGrade, storedUser?.role]);

  const getGradeNumber = (grade?: string) => {
    const match = String(grade || '').match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const courseMatchesStudentGrade = (course: Course) => {
    if (!studentGrade) return false;
    const studentGradeNumber = getGradeNumber(studentGrade);
    const courseGrade = String(course.grade || '');
    const normalized = courseGrade.replace(/[–—]/g, '-');
    const range = normalized.match(/(\d+)\s*-\s*(\d+)/);
    const courseGradeNumber = getGradeNumber(courseGrade);

    if (studentGradeNumber !== null && range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      return studentGradeNumber >= Math.min(start, end) && studentGradeNumber <= Math.max(start, end);
    }

    if (studentGradeNumber !== null && courseGradeNumber !== null) {
      return studentGradeNumber === courseGradeNumber;
    }

    return courseGrade.toLowerCase() === String(studentGrade).toLowerCase();
  };

  const filtered = courses.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.teacher.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && c.grade !== gradeFilter) return false;
    if (showRecommendedOnly && !courseMatchesStudentGrade(c)) return false;
    if (typeFilter && c.classType !== typeFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(courses.map(c => c.category))];
  const grades = [...new Set(courses.map(c => c.grade))];
  const openCourses = courses.filter(course => course.status === 'Open').length;
  const onlineCourses = courses.filter(course => course.classType === 'Online').length;
  const hasFilters = Boolean(search || gradeFilter || typeFilter || categoryFilter || showRecommendedOnly);
  const gradeRecommendedCourses = courses.filter(courseMatchesStudentGrade);
  const featuredCourse =
    filtered.find(courseMatchesStudentGrade) ||
    gradeRecommendedCourses[0] ||
    filtered[0] ||
    courses[0];
  const recommendedCount = gradeRecommendedCourses.length;

  const categoryStats = useMemo(() => {
    return categories.map(category => ({
      category,
      count: courses.filter(course => course.category === category).length,
    }));
  }, [categories, courses]);

  const clearFilters = () => {
    setSearch('');
    setGradeFilter('');
    setTypeFilter('');
    setCategoryFilter('');
    setShowRecommendedOnly(false);
  };

  const openCourse = (course: Course) => {
    onSelectCourse(course.id);
    navigate('student-course-detail');
  };

  const getCourseOffer = (course: Course) =>
    promotion && String(promotion.courseId) === String(course.id) ? promotion : null;

  const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
    const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
    const strokeProps = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (name) {
      case 'search':
        return <svg {...common}><path {...strokeProps} d="m21 21-4.35-4.35" /><circle {...strokeProps} cx="11" cy="11" r="7" /></svg>;
      case 'book':
        return <svg {...common}><path {...strokeProps} d="M12 6.5A6 6 0 0 0 6 4H4v15h2a6 6 0 0 1 6 2.5m0-15A6 6 0 0 1 18 4h2v15h-2a6 6 0 0 0-6 2.5m0-15v15" /></svg>;
      case 'calendar':
        return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
      case 'clock':
        return <svg {...common}><path {...strokeProps} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path {...strokeProps} d="M12 6v6l4 2" /></svg>;
      case 'users':
        return <svg {...common}><path {...strokeProps} d="M16 21a4 4 0 0 0-8 0" /><path {...strokeProps} d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...strokeProps} d="M22 21a3 3 0 0 0-4-2.8" /><path {...strokeProps} d="M18 5.4a3 3 0 0 1 0 5.2" /></svg>;
      case 'arrow':
        return <svg {...common}><path {...strokeProps} d="M5 12h14" /><path {...strokeProps} d="m13 6 6 6-6 6" /></svg>;
      case 'spark':
        return <svg {...common}><path {...strokeProps} d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" /></svg>;
      case 'graduation':
        return <svg {...common}><path {...strokeProps} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...strokeProps} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="fade-in-up space-y-7">
      <PageHeader
        title="Explore Courses"
        subtitle={`${filtered.length} course${filtered.length !== 1 ? 's' : ''} available`}
      />

      <section className="course-showcase overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-[#10243a] p-6 text-white sm:p-8">
            <div className="absolute inset-0 opacity-22">
              <img
                src={featuredCourse?.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=560&fit=crop&auto=format'}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#10243a] via-[#123d64]/92 to-[#1E6BB8]/70" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                <Icon name="spark" className="h-4 w-4" /> Course finder
              </span>
              <h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Choose the right English path with confidence.</h2>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-blue-50/90">
                {studentGrade
                  ? `We highlight courses that match ${studentGrade}, while still letting you explore every English programme.`
                  : 'Compare grades, delivery modes, seats, schedules, and monthly fees before you enroll.'}
              </p>
              <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ['Courses', courses.length],
                  ['Open', openCourses],
                  [studentGrade ? 'For you' : 'Online', studentGrade ? recommendedCount : onlineCourses],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="font-display text-2xl font-extrabold">{value}</p>
                    <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">
                  {studentGrade ? `Recommended for ${studentGrade}` : 'Featured course'}
                </p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{featuredCourse?.name || 'Explore courses'}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 line-clamp-2">{featuredCourse?.description || 'Find a course that matches your grade and learning goals.'}</p>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
                <Icon name="graduation" className="h-6 w-6" />
              </div>
            </div>
            {featuredCourse && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {getCourseOffer(featuredCourse) && (
                  <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Early bird offer</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                      <p className="font-display text-2xl font-extrabold text-[#1E6BB8]">
                        Rs. {getCourseOffer(featuredCourse)?.discountedFee.toLocaleString()}
                      </p>
                      <p className="text-sm font-extrabold text-emerald-700">
                        Save Rs. {getCourseOffer(featuredCourse)?.discountAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Grade</p>
                  <p className="mt-1 font-display text-lg font-extrabold text-slate-900">{featuredCourse.grade}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Monthly fee</p>
                  {getCourseOffer(featuredCourse) ? (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-400 line-through">Rs. {featuredCourse.monthlyFee.toLocaleString()}</p>
                      <p className="font-display text-lg font-extrabold text-[#1E6BB8]">Rs. {getCourseOffer(featuredCourse)?.discountedFee.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="mt-1 font-display text-lg font-extrabold text-[#1E6BB8]">Rs. {featuredCourse.monthlyFee.toLocaleString()}</p>
                  )}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Seats</p>
                  <p className="mt-1 font-display text-lg font-extrabold text-slate-900">{featuredCourse.availableSeats}/{featuredCourse.totalSeats}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCourse(featuredCourse)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E6BB8] p-4 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 hover:bg-[#155a9c]"
                >
                  View course <Icon name="arrow" className="h-4 w-4" />
                </button>
              </div>
            )}
            {studentGrade && recommendedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowRecommendedOnly(current => !current);
                  setGradeFilter('');
                }}
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
                  showRecommendedOnly
                    ? 'border-[#1E6BB8] bg-[#1E6BB8] text-white'
                    : 'border-blue-100 bg-blue-50 text-[#1E6BB8] hover:bg-blue-100'
                }`}
              >
                {showRecommendedOnly ? 'Showing my grade courses' : `Show ${recommendedCount} course${recommendedCount === 1 ? '' : 's'} for ${studentGrade}`}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Icon name="search" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-950">Find your class</p>
              <p className="text-xs font-semibold text-slate-400">{filtered.length} matching course{filtered.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${categoryFilter === '' ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            {categoryStats.slice(0, 5).map(item => (
              <button
                key={item.category}
                onClick={() => setCategoryFilter(item.category)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold ${categoryFilter === item.category ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.category} <span className="opacity-70">({item.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search courses or teachers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-[52px] min-w-[150px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[52px] min-w-[190px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Delivery Modes</option>
            <option value="Online">Online Virtual Classroom</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[52px] min-w-[170px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            Active filters:
            {search && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Search: {search}</span>}
            {gradeFilter && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{gradeFilter}</span>}
            {showRecommendedOnly && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">My grade: {studentGrade}</span>}
            {typeFilter && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{typeFilter}</span>}
            {categoryFilter && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{categoryFilter}</span>}
            <button onClick={clearFilters} className="rounded-full px-3 py-1 text-red-600 hover:bg-red-50">Clear</button>
          </div>
        )}
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="book" className="h-8 w-8" />
          </div>
          <h3 className="font-display text-xl font-extrabold text-slate-800">No courses found</h3>
          <p className="mt-1 text-sm font-medium text-slate-400">Try another grade, teacher, delivery mode, or category.</p>
          <button onClick={clearFilters} className="mt-5 rounded-xl bg-[#1E6BB8] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20">Reset filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(course => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const courseOffer = getCourseOffer(course);
            const totalSeats = Math.max(course.totalSeats || 0, course.availableSeats || 0, 1);
            const availableSeats = Math.min(Math.max(course.availableSeats || 0, 0), totalSeats);
            const filledPercent = Math.min(100, Math.max(0, ((totalSeats - availableSeats) / totalSeats) * 100));
            return (
              <article key={course.id} className="course-market-card group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="course-photo-frame relative h-56 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => openCourse(course)}>
                  <img src={course.image} alt={course.name} className="course-hero-photo h-full w-full object-cover" />
                  <span className="course-photo-shine" />
                  {courseOffer && (
                    <span className="absolute left-4 top-4 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-950 shadow-lg">
                      Early bird {courseOffer.discountPercent}% off
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge color={course.status === 'Open' ? 'green' : course.status === 'Full' ? 'red' : 'slate'}>
                      {course.status}
                    </Badge>
                    <Badge color={course.classType === 'Online' ? 'blue' : 'amber'}>{course.classType}</Badge>
                    {courseOffer && <Badge color="amber">Save Rs. {courseOffer.discountAmount.toLocaleString()}</Badge>}
                    {isEnrolled && <Badge color="green">Enrolled</Badge>}
                  </div>
                  <Badge color="slate" className="mb-3">{course.category}</Badge>
                  <h3 className="font-display text-lg font-extrabold leading-snug text-slate-900">{course.name}</h3>

                  <div className="flex items-center gap-2 mt-2">
                    <img src={course.teacherImage} alt={course.teacher} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-sm font-semibold text-slate-500">{course.teacher}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-500">
                    <div className="flex items-center gap-2"><Icon name="graduation" className="h-4 w-4 text-[#1E6BB8]" /><span>{course.grade}</span></div>
                    <div className="flex items-center gap-2"><Icon name="calendar" className="h-4 w-4 text-[#1E6BB8]" /><span className="line-clamp-1">{course.schedule}</span></div>
                    <div className="flex items-center gap-2"><Icon name="clock" className="h-4 w-4 text-[#1E6BB8]" /><span>{course.duration}</span></div>
                  </div>

                  {/* Seat availability */}
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-extrabold uppercase tracking-[0.12em] text-slate-400">Available Seats</span>
                      <span className="font-extrabold text-slate-700">{availableSeats}/{totalSeats}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full transition-all ${filledPercent > 80 ? 'bg-red-400' : filledPercent > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${filledPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                        {courseOffer ? 'Offer fee' : 'Monthly fee'}
                      </p>
                      {courseOffer && (
                        <p className="text-xs font-bold text-slate-400 line-through">
                          Rs. {course.monthlyFee.toLocaleString()}
                        </p>
                      )}
                      <span className="font-display text-2xl font-extrabold text-[#1E6BB8]">
                        Rs. {(courseOffer?.discountedFee || course.monthlyFee).toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/month</span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openCourse(course)}>
                        Details
                      </Button>
                      {isEnrolled ? (
                        <Badge color="green" className="px-3 py-1.5">Enrolled</Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={course.status !== 'Open'}
                          onClick={() => openCourse(course)}
                        >
                          {course.status === 'Full' ? 'Full' : 'Enroll Now'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
