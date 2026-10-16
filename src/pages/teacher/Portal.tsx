import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Announcement, ClassSession, View } from '../../types';
import { announcementsAPI, classesAPI, courseResourcesAPI, schedulesAPI, teachersAPI, mapBackendScheduleToFrontend } from '../../services/api';
import { validateClassTimes } from '../../utils/dateFormatter';
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from '../../components/ui';

interface Props {
  currentView: View;
  navigate: (view: View) => void;
  sessions: ClassSession[];
  announcements: Announcement[];
  setSessions: Dispatch<SetStateAction<ClassSession[]>>;
  setAnnouncements: Dispatch<SetStateAction<Announcement[]>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const emptyClassForm = { courseName: '', date: '', startTime: '09:00 AM', endTime: '10:30 AM', mode: 'Online Virtual Classroom', platform: 'Google Meet', joinLink: '' };
const emptyAnnouncementForm = { title: '', description: '', category: 'CLASS', priority: 'Medium', targetAudience: 'All Students', courseId: '' };

function PortalIcon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'plus':
      return <svg {...common}><path {...stroke} d="M12 5v14M5 12h14" /></svg>;
    case 'edit':
      return <svg {...common}><path {...stroke} d="M12 20h9" /><path {...stroke} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" /></svg>;
    case 'trash':
      return <svg {...common}><path {...stroke} d="M3 6h18" /><path {...stroke} d="M8 6V4h8v2" /><path {...stroke} d="M19 6l-1 14H6L5 6" /><path {...stroke} d="M10 11v5M14 11v5" /></svg>;
    case 'calendar':
      return <svg {...common}><path {...stroke} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
    case 'users':
      return <svg {...common}><path {...stroke} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path {...stroke} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...stroke} d="M22 21v-2a4 4 0 0 0-3-3.87" /><path {...stroke} d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'megaphone':
      return <svg {...common}><path {...stroke} d="m3 11 18-5v12L3 13v-2Z" /><path {...stroke} d="M7 14v5a2 2 0 0 0 2 2h1" /></svg>;
    case 'spark':
      return <svg {...common}><path {...stroke} d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path {...stroke} d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>;
    default:
      return null;
  }
}

const getColomboTodayIso = () => {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offset);
  return new Date(local.getTime() - (local.getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
};

export default function TeacherPortal({ currentView, navigate, sessions, announcements, setSessions, setAnnouncements, showToast }: Props) {
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [assignedCourses, setAssignedCourses] = useState<Array<{ id: string; title: string; _id?: string }>>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [courseResources, setCourseResources] = useState<any[]>([]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceCourseId, setResourceCourseId] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingResourceTitle, setEditingResourceTitle] = useState('');
  const [replacementResourceFile, setReplacementResourceFile] = useState<File | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<Array<{ id: string; title: string; courseId: string }>>([]);
  const [recordingCourseId, setRecordingCourseId] = useState('');
  const [recordingClassId, setRecordingClassId] = useState('');
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingSourceType, setRecordingSourceType] = useState<'LINK' | 'FILE'>('LINK');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const isClassesView = currentView === 'teacher-classes';
  const isAnnouncementsView = currentView === 'teacher-announcements';
  const visibleSessions = sessions.slice(0, 8);
  const visibleAnnouncements = announcements.slice(0, 8);
  const materialStats = useMemo(() => {
    const pdfs = courseResources.filter(resource => resource.resourceType !== 'CLASS_RECORDING').length;
    const recordings = courseResources.filter(resource => resource.resourceType === 'CLASS_RECORDING').length;
    const links = courseResources.filter(resource => resource.sourceType === 'LINK').length;
    return { pdfs, recordings, links, total: courseResources.length };
  }, [courseResources]);

  useEffect(() => {
    const loadAssignedCourses = async () => {
      try {
        const teacherProfile = await teachersAPI.getMy();
        const courseList = Array.isArray(teacherProfile?.assignedCourses) ? teacherProfile.assignedCourses : [];
        const mappedCourses = courseList.map((course: any) => ({ id: course._id || course.id, title: course.title || course.name, _id: course._id || course.id }));
        setAssignedCourses(mappedCourses);
        if (mappedCourses.length) {
          setClassForm(current => current.courseName ? current : { ...current, courseName: mappedCourses[0].id });
        }
        if (!resourceCourseId && mappedCourses.length) setResourceCourseId(mappedCourses[0].id);
        const classList = Array.isArray(teacherProfile?.assignedClasses) ? teacherProfile.assignedClasses : [];
        const mappedClasses = classList.map((classItem: any) => ({
          id: classItem._id || classItem.id,
          title: classItem.className || classItem.name || 'Assigned class',
          courseId: classItem.course?._id || classItem.course || ''
        }));
        setAssignedClasses(mappedClasses);
        if (!recordingCourseId && mappedCourses.length) setRecordingCourseId(mappedCourses[0].id);
        setCourseResources(await courseResourcesAPI.getTeacher());
      } catch (error) {
        console.log('Teacher assigned courses notice:', error);
      }
    };

    loadAssignedCourses();
  }, []);

  const uploadCourseResource = async () => {
    if (!resourceCourseId || !resourceTitle.trim() || !resourceFile) {
      showToast('Select an assigned course, enter a PDF title, and choose a PDF file.', 'error');
      return;
    }
    setUploadingResource(true);
    try {
      const response = await courseResourcesAPI.upload(resourceCourseId, resourceTitle.trim(), resourceFile);
      const resource = response.data;
      setCourseResources(previous => [{ ...resource, course: assignedCourses.find(course => course.id === resourceCourseId) }, ...previous]);
      setResourceTitle('');
      setResourceFile(null);
      showToast('Course PDF uploaded for paid students.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Course PDF upload failed.', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  const uploadClassRecording = async () => {
    if (!recordingCourseId || !recordingTitle.trim()) {
      showToast('Select an assigned course and enter a recording title.', 'error');
      return;
    }

    if (recordingSourceType === 'LINK' && !recordingUrl.trim()) {
      showToast('Paste the recording link students should open.', 'error');
      return;
    }

    if (recordingSourceType === 'FILE' && !recordingFile) {
      showToast('Choose a video recording file.', 'error');
      return;
    }

    if (recordingSourceType === 'FILE' && recordingFile && (!recordingFile.type.startsWith('video/') || recordingFile.size > 250 * 1024 * 1024)) {
      showToast('Choose an MP4, WebM, or MOV video up to 250 MB.', 'error');
      return;
    }
    setUploadingRecording(true);
    try {
      const response = await courseResourcesAPI.uploadRecording(
        recordingCourseId,
        recordingClassId,
        recordingTitle.trim(),
        recordingSourceType === 'FILE' ? recordingFile : null,
        recordingSourceType === 'LINK' ? recordingUrl.trim() : ''
      );
      const course = assignedCourses.find(item => item.id === recordingCourseId);
      const classItem = assignedClasses.find(item => item.id === recordingClassId);
      setCourseResources(previous => [{
        ...response.data,
        course: course ? { _id: course.id, title: course.title } : null,
        class: classItem ? { _id: classItem.id, className: classItem.title } : null
      }, ...previous]);
      setRecordingTitle('');
      setRecordingUrl('');
      setRecordingFile(null);
      showToast('Class recording shared for enrolled students.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Recording upload failed.', 'error');
    } finally {
      setUploadingRecording(false);
    }
  };

  const downloadCourseResource = async (resource: any) => {
    try {
      if (resource.sourceType === 'LINK' && resource.externalUrl) {
        window.open(resource.externalUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const blob = await courseResourcesAPI.download(resource._id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resource.originalName || `${resource.title}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error?.message || 'Could not download the course PDF.', 'error');
    }
  };

  const addClass = async () => {
    const missing = [
      !classForm.courseName.trim() && 'assigned course',
      !classForm.date.trim() && 'class date',
      !classForm.startTime.trim() && 'start time',
      !classForm.endTime.trim() && 'end time',
      !classForm.joinLink.trim() && 'class link',
    ].filter(Boolean);
    if (missing.length) {
      showToast(`Please provide: ${missing.join(', ')}.`, 'error');
      return;
    }

    const timeValidation = validateClassTimes(classForm.startTime, classForm.endTime);
    if (!timeValidation.isValid) {
      showToast(timeValidation.message || 'End time must be later than start time', 'error');
      return;
    }

    const todayIso = getColomboTodayIso();
    if (classForm.date < todayIso) {
      showToast('Class date and time cannot be in the past.', 'error');
      return;
    }

    if (classForm.date === todayIso) {
      const now = new Date();
      const [hours, minutes] = classForm.startTime.replace(/[^\d:]/g, '').split(':').map(Number);
      const startMs = new Date(todayIso + 'T' + String(hours).padStart(2, '0') + ':' + String(minutes || 0).padStart(2, '0')).getTime();
      if (startMs <= now.getTime()) {
        showToast('Class date and time cannot be in the past.', 'error');
        return;
      }
    }

    try {
      const teacherProfile = await teachersAPI.getMy();
      const selectedCourse = assignedCourses.find(course => course.id === classForm.courseName);
      if (!selectedCourse) {
        showToast('Select a course assigned to your teacher account.', 'error');
        return;
      }

      const teacherClasses = await classesAPI.getAll();
      let classForSchedule = teacherClasses.find((classItem: any) =>
        (classItem.course?._id || classItem.course) === selectedCourse.id && classItem.status === 'ACTIVE'
      );

      if (!classForSchedule) {
        const createdClass = await classesAPI.create({
          classCode: `CLS-${Date.now().toString().slice(-6)}`,
          course: selectedCourse.id,
          className: `${selectedCourse.title} - ${classForm.date} ${classForm.startTime} - ${Date.now().toString().slice(-4)}`,
          description: `Live class for ${selectedCourse.title}`,
          capacity: 30,
          status: 'ACTIVE',
          onlineClassLink: classForm.joinLink.trim(),
        });
        classForSchedule = createdClass.data;
      } else {
        const classId = classForSchedule._id || classForSchedule.id;
        await classesAPI.update(classId, { onlineClassLink: classForm.joinLink.trim() });
      }

      const payload = {
        class: classForSchedule?._id || classForSchedule?.id,
        course: selectedCourse.id,
        teacher: teacherProfile?._id || teacherProfile?.id,
        date: classForm.date,
        startTime: classForm.startTime,
        endTime: classForm.endTime,
        location: classForm.platform,
        isOnline: true,
        onlineLink: classForm.joinLink.trim(),
        description: `${selectedCourse.title} live class`,
      };

      const createdSchedule = await schedulesAPI.create(payload);
      const mappedSession = mapBackendScheduleToFrontend(createdSchedule.data);
      setSessions(previous => [mappedSession, ...previous]);
      setClassForm(emptyClassForm);
      setShowClassForm(false);
      showToast('Class published successfully.', 'success');
    } catch (error: any) {
      console.log('Teacher class publish notice:', error);
      showToast(error?.message || 'Failed to publish class.', 'error');
    }
  };

  const updateLink = async (id: string, link: string) => {
    try {
      const response = await schedulesAPI.update(id, { onlineLink: link });
      const updatedSession = mapBackendScheduleToFrontend(response.data);
      setSessions(previous => previous.map(session => session.id === id ? updatedSession : session));
      showToast('Class link updated successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update class link.', 'error');
    }
  };

  const deleteClassLink = async (session: ClassSession) => {
    if (!window.confirm(`Delete the class link for ${session.courseName}?`)) return;
    try {
      await schedulesAPI.delete(session.id);
      setSessions(previous => previous.filter(item => item.id !== session.id));
      showToast('Class link deleted successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to delete class link.', 'error');
    }
  };

  const saveCourseResource = async (resourceId: string) => {
    if (!editingResourceTitle.trim()) {
      showToast('Enter a title for this PDF.', 'error');
      return;
    }
    try {
      const response = await courseResourcesAPI.update(resourceId, editingResourceTitle.trim(), replacementResourceFile || undefined);
      setCourseResources(previous => previous.map(resource => resource._id === resourceId
        ? { ...resource, ...response.data }
        : resource));
      setEditingResourceId(null);
      setEditingResourceTitle('');
      setReplacementResourceFile(null);
      showToast('Course PDF updated successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update course PDF.', 'error');
    }
  };

  const deleteCourseResource = async (resource: any) => {
    const resourceLabel = resource.resourceType === 'CLASS_RECORDING' ? 'recording' : 'PDF';
    if (!window.confirm(`Delete "${resource.title}"? Students will no longer be able to access this ${resourceLabel}.`)) return;
    try {
      await courseResourcesAPI.delete(resource._id);
      setCourseResources(previous => previous.filter(item => item._id !== resource._id));
      showToast(`${resourceLabel === 'PDF' ? 'Course PDF' : 'Class recording'} deleted successfully.`, 'success');
    } catch (error: any) {
      showToast(error?.message || `Failed to delete ${resourceLabel}.`, 'error');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      setAnnouncements(previous => previous.filter(a => a.id !== id));
      showToast('Announcement deleted successfully.', 'success');
    } catch (error) {
      console.log('Delete announcement notice:', error);
      showToast('Failed to delete announcement.', 'error');
    }
  };

  const startEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience || 'All Students',
      courseId: announcement.courseId || '',
    });
    setEditingAnnouncementId(announcement.id);
    setShowAnnouncementForm(true);
  };

  const publishAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.description || !announcementForm.courseId) {
      showToast('Select an assigned course and add an announcement title and message.', 'error');
      return;
    }
    setSavingAnnouncement(true);

    try {
      if (editingAnnouncementId) {
        await announcementsAPI.update(editingAnnouncementId, {
          title: announcementForm.title,
          content: announcementForm.description,
          category: announcementForm.category.toUpperCase(),
          priority: announcementForm.priority.toUpperCase(),
          targetAudience: 'STUDENT',
          course: announcementForm.courseId,
        });
        setAnnouncements(previous => previous.map(a => a.id === editingAnnouncementId ? {
          ...a,
          title: announcementForm.title,
          description: announcementForm.description,
          category: announcementForm.category as Announcement['category'],
          priority: announcementForm.priority as Announcement['priority'],
        } : a));
        showToast('Announcement updated successfully.', 'success');
      } else {
        const res = await announcementsAPI.create({
          title: announcementForm.title,
          content: announcementForm.description,
          category: announcementForm.category.toUpperCase(),
          priority: announcementForm.priority.toUpperCase(),
          targetAudience: 'STUDENT',
          course: announcementForm.courseId,
        });
        const newAnnouncement: Announcement = {
          id: res.data?._id || `teacher-announcement-${Date.now()}`,
          title: announcementForm.title,
          description: announcementForm.description,
          category: announcementForm.category as Announcement['category'],
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          priority: announcementForm.priority as Announcement['priority'],
          targetAudience: announcementForm.targetAudience,
          read: false,
        };
        setAnnouncements(previous => [newAnnouncement, ...previous]);
        showToast('Announcement published for students.', 'success');
      }
    } catch (error) {
      console.log('Teacher announcement notice:', error);
      showToast('Failed to save announcement.', 'error');
    }

    setAnnouncementForm(emptyAnnouncementForm);
    setEditingAnnouncementId(null);
    setShowAnnouncementForm(false);
    setSavingAnnouncement(false);
  };

  const openNewAnnouncementForm = () => {
    setEditingAnnouncementId(null);
    setAnnouncementForm({
      ...emptyAnnouncementForm,
      courseId: assignedCourses[0]?.id || '',
    });
    setShowAnnouncementForm(true);
  };

  return (
    <div className="fade-in-up space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={isClassesView ? 'My Classes' : isAnnouncementsView ? 'Announcements' : 'Teacher Dashboard'}
        subtitle={isClassesView ? 'Share links and manage your upcoming classes.' : isAnnouncementsView ? 'Keep your students informed.' : 'Manage your classes and communicate with students.'}
        action={isAnnouncementsView ? <Button onClick={openNewAnnouncementForm}><PortalIcon name="plus" className="h-4 w-4" /> New Announcement</Button> : isClassesView ? <Button onClick={() => setShowClassForm(true)}>+ Add Class Link</Button> : undefined}
      />

      {!isClassesView && !isAnnouncementsView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5"><p className="text-sm text-slate-500">Upcoming Classes</p><p className="text-3xl font-bold text-slate-900 font-display mt-2">{sessions.filter(session => session.status === 'Upcoming').length}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-500">Published Announcements</p><p className="text-3xl font-bold text-slate-900 font-display mt-2">{announcements.length}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-500">Online Classes</p><p className="text-3xl font-bold text-[#1E6BB8] font-display mt-2">{sessions.filter(session => session.mode === 'Online').length}</p></Card>
        </div>
      )}

      {!isAnnouncementsView && (
        <section className="space-y-3">
          {!isClassesView && <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800 font-display">Upcoming Classes</h2><button onClick={() => navigate('teacher-classes')} className="text-sm text-[#1E6BB8] font-semibold hover:underline">Manage classes</button></div>}
          {visibleSessions.map(session => <ClassRow key={session.id} session={session} onUpdateLink={updateLink} onDelete={deleteClassLink} />)}
          {visibleSessions.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No classes have been assigned yet.</Card>}
        </section>
      )}

      {!isClassesView && (
        <section className="space-y-3">
          {!isAnnouncementsView && <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800 font-display">Recent Announcements</h2><button onClick={() => navigate('teacher-announcements')} className="text-sm text-[#1E6BB8] font-semibold hover:underline">View all</button></div>}
          {isAnnouncementsView && (
            <div className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Published</p>
                <p className="mt-1 font-display text-3xl font-black text-slate-950">{announcements.length}</p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-400">High Priority</p>
                <p className="mt-1 font-display text-3xl font-black text-red-700">{announcements.filter(item => item.priority === 'High').length}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">Audience</p>
                <p className="mt-2 text-sm font-extrabold text-slate-800">Students and enrolled classes</p>
              </div>
            </div>
          )}
          {visibleAnnouncements.map(announcement => (
            <Card key={announcement.id} className="overflow-hidden rounded-[1.35rem] border-slate-100 bg-white shadow-sm hover:shadow-[0_18px_45px_rgba(15,35,56,0.09)]">
              <div className={`h-1.5 ${announcement.priority === 'High' ? 'bg-red-500' : announcement.priority === 'Medium' ? 'bg-amber-400' : 'bg-slate-300'}`} />
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm ${announcement.priority === 'High' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : announcement.priority === 'Medium' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-blue-50 text-[#1E6BB8] ring-1 ring-blue-100'}`}>
                    <PortalIcon name={announcement.priority === 'High' ? 'spark' : 'megaphone'} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge color="blue" className="uppercase tracking-[0.08em]">{announcement.category}</Badge>
                      <Badge color={announcement.priority === 'High' ? 'red' : announcement.priority === 'Medium' ? 'amber' : 'slate'} className="uppercase tracking-[0.08em]">{announcement.priority} Priority</Badge>
                    </div>
                    <h3 className="font-display text-xl font-black leading-tight text-slate-950">{announcement.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">{announcement.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><PortalIcon name="calendar" className="h-3.5 w-3.5" />{announcement.date}</span>
                      <span className="inline-flex items-center gap-1.5"><PortalIcon name="users" className="h-3.5 w-3.5" />{announcement.targetAudience}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pt-1">
                  <button
                    type="button"
                    onClick={() => startEditAnnouncement(announcement)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[#1E6BB8]/30 hover:bg-blue-50 hover:text-[#1E6BB8]"
                    title="Edit announcement"
                    aria-label="Edit announcement"
                  >
                    <PortalIcon name="edit" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                    title="Delete announcement"
                    aria-label="Delete announcement"
                  >
                    <PortalIcon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {visibleAnnouncements.length === 0 && (
            <Card className="rounded-[1.35rem] border-dashed border-slate-200 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#1E6BB8]">
                <PortalIcon name="megaphone" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-black text-slate-950">No announcements yet</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">Create your first update for students and enrolled classes.</p>
            </Card>
          )}
        </section>
      )}

      {!isAnnouncementsView && (
        <section className="space-y-5">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-[#14395a] to-[#1E6BB8] px-6 py-5 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">Learning Content Studio</p>
                  <h2 className="mt-2 text-2xl font-black font-display">Course materials</h2>
                  <p className="mt-1 max-w-2xl text-sm text-blue-50/90">Publish notes, recordings, and class links for students with approved enrollment and verified payments.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[24rem]">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                    <p className="text-2xl font-black">{materialStats.pdfs}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-blue-100">PDFs</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                    <p className="text-2xl font-black">{materialStats.recordings}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-blue-100">Recordings</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                    <p className="text-2xl font-black">{materialStats.links}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-blue-100">Links</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[1fr_0.92fr]">
              <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50/70 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">Course Notes</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">Upload a PDF handout</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">Max 10 MB</span>
                </div>
            {assignedCourses.length ? (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Select label="Assigned course" value={resourceCourseId} onChange={setResourceCourseId} options={assignedCourses.map(course => ({ value: course.id, label: course.title }))} required />
                  <Input label="PDF title" value={resourceTitle} onChange={setResourceTitle} placeholder="e.g. Unit 4 Grammar Notes" required />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <label className="block rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-[#1E6BB8]/60 hover:bg-blue-50/40">
                    <span className="block text-sm font-black text-slate-800">PDF file</span>
                    <span className="mt-1 block text-xs text-slate-400">Choose a lesson note, worksheet, or handout.</span>
                    <input type="file" accept="application/pdf,.pdf" onChange={event => setResourceFile(event.target.files?.[0] || null)} className="mt-3 block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-700" />
                    {resourceFile && <span className="mt-2 block truncate text-xs font-semibold text-slate-600">{resourceFile.name}</span>}
                  </label>
                  <Button onClick={uploadCourseResource} disabled={uploadingResource} className="h-12 min-w-[9rem]">{uploadingResource ? 'Uploading...' : 'Upload PDF'}</Button>
                </div>
              </>
            ) : <p className="text-sm text-slate-500">No courses are assigned to your teacher account.</p>}
              </div>

              <div className="rounded-[1.25rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Published Library</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{materialStats.total} material{materialStats.total === 1 ? '' : 's'}</h3>
                  </div>
                  <Badge color="blue">{assignedCourses.length} course{assignedCourses.length === 1 ? '' : 's'}</Badge>
                </div>

                <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                  {courseResources.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="font-bold text-slate-800">No materials published yet</p>
                      <p className="mt-1 text-sm text-slate-500">Upload a PDF or share a recording link to build your course library.</p>
                    </div>
                  )}
                  {courseResources.map(resource => (
                    <div key={resource._id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
                      {editingResourceId === resource._id ? (
                        <div className="space-y-3">
                          <Input label="PDF title" value={editingResourceTitle} onChange={setEditingResourceTitle} />
                          <label className="block text-xs font-medium text-slate-600">Replace PDF (optional, up to 10 MB)
                            <input type="file" accept="application/pdf,.pdf" onChange={event => {
                              const file = event.target.files?.[0] || null;
                              if (file && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) {
                                showToast('Choose a PDF smaller than 10 MB.', 'error');
                                event.target.value = '';
                                return;
                              }
                              setReplacementResourceFile(file);
                            }} className="mt-1 block w-full text-sm text-slate-500" />
                          </label>
                          <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingResourceId(null); setReplacementResourceFile(null); }}>Cancel</Button><Button size="sm" onClick={() => saveCourseResource(resource._id)}>Save PDF</Button></div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${resource.resourceType === 'CLASS_RECORDING' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                              {resource.resourceType === 'CLASS_RECORDING' ? 'REC' : 'PDF'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-900">{resource.title}</p>
                              <p className="mt-1 truncate text-xs text-slate-500">{resource.course?.title || 'Assigned course'}{resource.class?.className ? ` · ${resource.class.className}` : ''}</p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-400">{resource.sourceType === 'LINK' ? 'Recording link' : resource.originalName}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => downloadCourseResource(resource)}>{resource.sourceType === 'LINK' ? 'Open' : 'Download'}</Button>
                            {resource.resourceType !== 'CLASS_RECORDING' && <Button size="sm" variant="ghost" onClick={() => { setEditingResourceId(resource._id); setEditingResourceTitle(resource.title); }}>Edit</Button>}
                            <Button size="sm" variant="danger" onClick={() => deleteCourseResource(resource)}>Delete</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[1.5rem] border-slate-100">
            <div className="border-b border-slate-100 bg-white px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">Class Recordings</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Share a replay or video file</h3>
              <p className="mt-1 text-sm text-slate-500">Use a Drive, YouTube, Meet, or Zoom link, or upload an MP4, WebM, or MOV video.</p>
            </div>
            <div className="space-y-4 p-5">
            {assignedCourses.length ? <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Assigned course" value={recordingCourseId} onChange={value => { setRecordingCourseId(value); setRecordingClassId(''); }} options={assignedCourses.map(course => ({ value: course.id, label: course.title }))} required />
                <Select label="Class (optional)" value={recordingClassId} onChange={setRecordingClassId} options={[{ value: '', label: 'All enrolled classes in this course' }, ...assignedClasses.filter(item => item.courseId === recordingCourseId).map(item => ({ value: item.id, label: item.title }))]} />
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setRecordingSourceType('LINK');
                    setRecordingFile(null);
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${recordingSourceType === 'LINK' ? 'bg-white text-[#1E6BB8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Recording Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingSourceType('FILE');
                    setRecordingUrl('');
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${recordingSourceType === 'FILE' ? 'bg-white text-[#1E6BB8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Upload Video
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Input label="Recording title" value={recordingTitle} onChange={setRecordingTitle} placeholder="e.g. Week 3 speaking lesson" required />
                {recordingSourceType === 'LINK' ? (
                  <Input
                    label="Recording link"
                    value={recordingUrl}
                    onChange={setRecordingUrl}
                    placeholder="https://drive.google.com/... or https://zoom.us/rec/..."
                    inputMode="url"
                    required
                  />
                ) : (
                  <label className="block rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">Video file (up to 250 MB)
                    <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={event => {
                      const file = event.target.files?.[0] || null;
                      if (file && (!file.type.startsWith('video/') || file.size > 250 * 1024 * 1024)) {
                        showToast('Choose an MP4, WebM, or MOV video up to 250 MB.', 'error');
                        event.target.value = '';
                        return;
                      }
                      setRecordingFile(file);
                    }} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-700" />
                    {recordingFile && <span className="mt-1 block text-xs text-slate-500">{recordingFile.name}</span>}
                  </label>
                )}
              </div>
              <div className="flex justify-end"><Button onClick={uploadClassRecording} disabled={uploadingRecording} className="h-12 min-w-[13rem]">{uploadingRecording ? 'Saving...' : recordingSourceType === 'LINK' ? 'Share Recording Link' : 'Upload Recording'}</Button></div>
            </> : <p className="text-sm text-slate-500">No courses are assigned to your teacher account.</p>}
            </div>
          </Card>
        </section>
      )}

      {showClassForm && <ClassForm form={classForm} setForm={setClassForm} onClose={() => setShowClassForm(false)} onSave={addClass} courseOptions={assignedCourses.map((course) => ({ id: course.id, title: course.title }))} />}
      {showAnnouncementForm && (
        <AnnouncementForm
          form={announcementForm}
          setForm={setAnnouncementForm}
          saving={savingAnnouncement}
          onClose={() => {
            setShowAnnouncementForm(false);
            setEditingAnnouncementId(null);
            setAnnouncementForm(emptyAnnouncementForm);
          }}
          onSave={publishAnnouncement}
          isEditing={!!editingAnnouncementId}
          courses={assignedCourses.map(course => ({ id: course.id, title: course.title }))}
        />
      )}
    </div>
  );
}

function ClassRow({ session, onUpdateLink, onDelete }: { session: ClassSession; onUpdateLink: (id: string, link: string) => void | Promise<void>; onDelete: (session: ClassSession) => void | Promise<void> }) {
  const [link, setLink] = useState(session.joinLink || '');
  return <Card className="p-5"><div className="flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex-1"><div className="flex flex-wrap gap-2 mb-2"><Badge color={session.mode === 'Online' ? 'blue' : 'slate'}>{session.mode}</Badge><Badge color="amber">{session.status}</Badge></div><h3 className="font-bold text-slate-800 font-display">{session.courseName}</h3><p className="text-sm text-slate-500 mt-1">{session.day}, {session.date} · {session.startTime}–{session.endTime}</p></div><div className="flex flex-col sm:flex-row gap-2 lg:w-[28rem]"><Input value={link} onChange={setLink} placeholder="Paste Google Meet or Zoom link" className="flex-1" /><Button size="sm" onClick={() => onUpdateLink(session.id, link)}>Save Link</Button>{session.joinLink && <a href={session.joinLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-[#1E6BB8] hover:bg-blue-50 rounded-xl">Open</a>}<Button size="sm" variant="danger" onClick={() => onDelete(session)}>Delete</Button></div></div></Card>;
}

function ClassForm({ form, setForm, onClose, onSave, courseOptions }: { form: typeof emptyClassForm; setForm: Dispatch<SetStateAction<typeof emptyClassForm>>; onClose: () => void; onSave: () => void; courseOptions: Array<{ id: string; title: string }> }) {
  const minDate = getColomboTodayIso();
  const courseSelectOptions = courseOptions.length
    ? [{ value: '', label: 'Select an assigned course' }, ...courseOptions.map(course => ({ value: course.id, label: course.title }))]
    : [{ value: '', label: 'No assigned courses available' }];

  return <FormShell title="Add Class Link" subtitle="Publish an online class link for your students." onClose={onClose}>
    <Select label="Class or Course Name" value={form.courseName} onChange={value => setForm(previous => ({ ...previous, courseName: value }))} options={courseSelectOptions} required />
    <div className="grid grid-cols-2 gap-4"><Input label="Class Date" type="date" min={minDate} value={form.date} onChange={value => setForm(previous => ({ ...previous, date: value }))} required /><Select label="Mode" value={form.mode} onChange={value => setForm(previous => ({ ...previous, mode: value }))} options={[{ value: 'Online Virtual Classroom', label: 'Online Virtual Classroom' }]} /></div>
    <div className="grid grid-cols-2 gap-4"><Input label="Start Time" value={form.startTime} onChange={value => setForm(previous => ({ ...previous, startTime: value }))} /><Input label="End Time" value={form.endTime} onChange={value => setForm(previous => ({ ...previous, endTime: value }))} /></div>
    <div className="grid grid-cols-2 gap-4"><Select label="Platform" value={form.platform} onChange={value => setForm(previous => ({ ...previous, platform: value }))} options={[{ value: 'Google Meet', label: 'Google Meet' }, { value: 'Zoom', label: 'Zoom' }, { value: 'Microsoft Teams', label: 'Microsoft Teams' }]} /><Input label="Class Link" placeholder="https://meet.google.com/..." value={form.joinLink} onChange={value => setForm(previous => ({ ...previous, joinLink: value }))} /></div>
    <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={onSave}>Publish Class</Button></div>
  </FormShell>;
}

function AnnouncementForm({ form, setForm, saving, onClose, onSave, isEditing, courses }: { form: typeof emptyAnnouncementForm; setForm: Dispatch<SetStateAction<typeof emptyAnnouncementForm>>; saving: boolean; onClose: () => void; onSave: () => void; isEditing: boolean; courses: Array<{ id: string; title: string }> }) {
  return <FormShell title={isEditing ? 'Edit Announcement' : 'New Announcement'} subtitle={isEditing ? 'Update the details for your students.' : 'Send an update to your students.'} onClose={onClose}>
    <Select label="Assigned course" value={form.courseId} onChange={value => setForm(previous => ({ ...previous, courseId: value }))} options={courses.length ? [{ value: '', label: 'Select an assigned course' }, ...courses.map(course => ({ value: course.id, label: course.title }))] : [{ value: '', label: 'No assigned courses available' }]} required />
    <Input label="Title" placeholder="e.g. Assignment reminder" value={form.title} onChange={value => setForm(previous => ({ ...previous, title: value }))} required />
    <Textarea label="Message" placeholder="Write your announcement..." value={form.description} onChange={value => setForm(previous => ({ ...previous, description: value }))} rows={4} required />
    <div className="grid grid-cols-2 gap-4"><Select label="Category" value={form.category} onChange={value => setForm(previous => ({ ...previous, category: value }))} options={[{ value: 'CLASS', label: 'Class' }, { value: 'EXAM', label: 'Exam' }, { value: 'GENERAL', label: 'General' }, { value: 'COURSE', label: 'Course' }]} /><Select label="Priority" value={form.priority} onChange={value => setForm(previous => ({ ...previous, priority: value }))} options={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} /></div>
    <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Update Announcement' : 'Publish Announcement'}</Button></div>
  </FormShell>;
}

function FormShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={onClose} /><div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-6 border-b border-slate-100"><div><h2 className="text-xl font-bold text-slate-900 font-display">{title}</h2><p className="text-sm text-slate-400 mt-0.5">{subtitle}</p></div><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 text-xl">×</button></div><div className="p-6 space-y-5">{children}</div></div></div>;
}
