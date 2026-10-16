import { useEffect, useState } from 'react';
import { Button, Badge, Card, Input, Textarea, Select, PageHeader, Modal } from '../../components/ui';
import { Announcement, View } from '../../types';
import { announcements as initial } from '../../data';
import { announcementsAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  announcements?: Announcement[];
  onAnnouncementChange?: (announcement: Announcement) => void;
  onAnnouncementDelete?: (id: string) => void;
}

const catColors: Record<string, 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'teal' | 'slate'> = {
  Class: 'blue', Payment: 'amber', Exam: 'red', Course: 'green', Holiday: 'teal', General: 'slate',
};

const prioColors: Record<string, 'red' | 'amber' | 'slate'> = {
  High: 'red', Medium: 'amber', Low: 'slate',
};

const categoryOptions = [
  { value: 'General', label: 'General' },
  { value: 'Class', label: 'Class' },
  { value: 'Exam', label: 'Exam' },
  { value: 'Payment', label: 'Payment' },
  { value: 'Course', label: 'Course' },
  { value: 'Holiday', label: 'Holiday' },
];

const audienceOptions = [
  { value: 'All Students', label: 'All Students' },
  { value: 'Grade 1–5', label: 'Grade 1–5' },
  { value: 'Grade 6–9', label: 'Grade 6–9' },
  { value: 'Grade 10–11', label: 'Grade 10–11' },
  { value: 'Specific Course', label: 'Specific Course' },
];

const priorityOptions = [
  { value: 'High', label: 'High Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'Low', label: 'Low Priority' },
];

const statusOptions = [
  { value: 'Published', label: 'Published' },
  { value: 'Draft', label: 'Draft' },
];

function AnnouncementIcon({ name, className = '' }: { name: string; className?: string }) {
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
    case 'alert':
      return <svg {...common}><path {...stroke} d="M12 9v4M12 17h.01" /><path {...stroke} d="M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /></svg>;
    case 'check':
      return <svg {...common}><path {...stroke} d="m5 12 4 4L19 6" /></svg>;
    case 'draft':
      return <svg {...common}><path {...stroke} d="M4 4h10l6 6v10H4V4Z" /><path {...stroke} d="M14 4v6h6" /><path {...stroke} d="M8 14h8M8 18h5" /></svg>;
    default:
      return null;
  }
}

export default function AdminAnnouncements({ navigate: _navigate, showToast, announcements, onAnnouncementChange, onAnnouncementDelete }: Props) {
  const [anns, setAnns] = useState<Announcement[]>(announcements || initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'General', targetAudience: 'All Students',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '', priority: 'Medium', status: 'Published',
  });
  useEffect(() => {
    if (announcements) setAnns(announcements);
  }, [announcements]);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ title: '', description: '', category: 'General', targetAudience: 'All Students', publishDate: new Date().toISOString().split('T')[0], expiryDate: '', priority: 'Medium', status: 'Published' });
    setShowForm(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title || '',
      description: ann.description || '',
      category: ann.category || 'General',
      targetAudience: ann.targetAudience || 'All Students',
      publishDate: ann.date ? new Date(ann.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: '',
      priority: ann.priority || 'Medium',
      status: 'Published',
    });
    setShowForm(true);
  };

  const handlePublish = async (draft = false) => {
    if (!form.title.trim() || !form.description.trim()) {
      showToast('Please fill in title and description.', 'error');
      return;
    }
    setSaving(true);
    const isPublished = !draft && form.status === 'Published';
    const targetAudienceValue = form.targetAudience.toUpperCase().includes('STUDENT') ? 'STUDENT' : 'ALL';
    const priorityValue = form.priority.toUpperCase() === 'HIGH' ? 'HIGH' : form.priority.toUpperCase() === 'LOW' ? 'LOW' : 'NORMAL';

    try {
      if (editingId) {
        // Update existing announcement
        const res = await announcementsAPI.update(editingId, {
          title: form.title.trim(),
          content: form.description.trim(),
          priority: priorityValue,
          targetAudience: targetAudienceValue,
          isPublished,
          category: form.category,
        }).catch(() => null);

        const updatedAnn: Announcement = {
          id: editingId,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category as any,
          date: form.publishDate,
          priority: form.priority as any,
          targetAudience: form.targetAudience,
          read: false,
        };

        setAnns(prev => prev.map(a => a.id === editingId ? updatedAnn : a));
        onAnnouncementChange?.(updatedAnn);
        showToast(isPublished ? 'Announcement updated and published!' : 'Announcement saved as draft.', 'success');
      } else {
        // Create new announcement
        const res = await announcementsAPI.create({
          title: form.title.trim(),
          content: form.description.trim(),
          priority: priorityValue,
          targetAudience: targetAudienceValue,
          isPublished,
          category: form.category,
        }).catch(() => null);

        const backendId = res?.data?._id || res?.data?.id || 'new-' + Date.now();
        const newAnn: Announcement = {
          id: backendId,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category as any,
          date: form.publishDate,
          priority: form.priority as any,
          targetAudience: form.targetAudience,
          read: false,
        };

        setAnns(prev => [newAnn, ...prev]);
        onAnnouncementChange?.(newAnn);
        showToast(isPublished ? 'Announcement published successfully!' : 'Announcement saved as draft.', 'success');
      }
    } catch (e) {
      console.log('Announcement error:', e);
      showToast('Failed to save announcement.', 'error');
    } finally {
      setForm({ title: '', description: '', category: 'General', targetAudience: 'All Students', publishDate: new Date().toISOString().split('T')[0], expiryDate: '', priority: 'Medium', status: 'Published' });
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await announcementsAPI.delete(id).catch(() => {});
    } catch (e) {}
    setAnns(prev => prev.filter(a => a.id !== id));
    onAnnouncementDelete?.(id);
    showToast('Announcement deleted.', 'info');
  };

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Announcements Management"
        subtitle={`${anns.length} announcement${anns.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openCreateModal}><AnnouncementIcon name="plus" className="h-4 w-4" /> Create Announcement</Button>}
      />

      {/* Existing announcements */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total</p>
          <p className="mt-1 font-display text-3xl font-black text-slate-950">{anns.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">High Priority</p>
          <p className="mt-1 font-display text-3xl font-black text-slate-950">{anns.filter(item => item.priority === 'High').length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">For Students</p>
          <p className="mt-1 font-display text-3xl font-black text-slate-950">{anns.filter(item => String(item.targetAudience || '').toLowerCase().includes('student')).length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Published</p>
          <p className="mt-1 font-display text-3xl font-black text-slate-950">{anns.length}</p>
        </Card>
      </div>

      <div className="space-y-4">
        {anns.map(ann => (
          <Card key={ann.id} className="overflow-hidden rounded-[1.35rem] border-slate-100 bg-white shadow-sm hover:shadow-[0_18px_45px_rgba(15,35,56,0.09)]">
            <div className={`h-1 ${ann.priority === 'High' ? 'bg-slate-900' : 'bg-slate-200'}`} />
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                  <AnnouncementIcon name={ann.priority === 'High' ? 'alert' : 'megaphone'} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge color="slate" className="uppercase tracking-[0.08em]">{ann.category}</Badge>
                    <Badge color={ann.priority === 'High' ? 'red' : 'slate'} className="uppercase tracking-[0.08em]">{ann.priority} Priority</Badge>
                    <Badge color="slate" className="uppercase tracking-[0.08em]">Published</Badge>
                  </div>
                  <h3 className="font-display text-xl font-black leading-tight text-slate-950">{ann.title}</h3>
                  <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-500 line-clamp-2">{ann.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><AnnouncementIcon name="calendar" className="h-3.5 w-3.5" />{ann.date}</span>
                    <span className="inline-flex items-center gap-1.5"><AnnouncementIcon name="users" className="h-3.5 w-3.5" />{ann.targetAudience}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(ann)}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                  title="Edit announcement"
                  aria-label="Edit announcement"
                >
                  <AnnouncementIcon name="edit" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ann.id)}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-red-600"
                  title="Delete announcement"
                  aria-label="Delete announcement"
                >
                  <AnnouncementIcon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {anns.length === 0 && (
          <Card className="rounded-[1.35rem] border-dashed border-slate-200 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
              <AnnouncementIcon name="megaphone" className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-black text-slate-950">No announcements yet</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">Create an announcement to notify students, courses, or grade groups.</p>
          </Card>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">{editingId ? 'Edit Announcement' : 'Create Announcement'}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{editingId ? 'Update the message students will see' : 'Publish an announcement to your students'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 text-xl">×</button>
            </div>

            <div className="p-6 space-y-5">
              <Input
                label="Announcement Title"
                placeholder="e.g. Grade 10 English Revision Class"
                value={form.title}
                onChange={set('title')}
                required
              />

              <Textarea
                label="Description"
                placeholder="Write the full announcement message here..."
                value={form.description}
                onChange={set('description')}
                rows={4}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category} onChange={set('category')} options={categoryOptions} required />
                <Select label="Target Audience" value={form.targetAudience} onChange={set('targetAudience')} options={audienceOptions} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Publish Date" type="date" value={form.publishDate} onChange={set('publishDate')} required />
                <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={set('expiryDate')} hint="Optional — leave blank for no expiry" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Priority" value={form.priority} onChange={set('priority')} options={priorityOptions} required />
                <Select label="Status" value={form.status} onChange={set('status')} options={statusOptions} required />
              </div>

              {/* Preview */}
              {form.title && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                  <div className={`h-1 ${form.priority === 'High' ? 'bg-slate-900' : 'bg-slate-200'}`} />
                  <div className="p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Student Preview</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge color="slate" className="uppercase tracking-[0.08em]">{form.category}</Badge>
                      <Badge color={form.priority === 'High' ? 'red' : 'slate'} className="uppercase tracking-[0.08em]">{form.priority} Priority</Badge>
                      <Badge color="slate" className="uppercase tracking-[0.08em]">{form.status}</Badge>
                    </div>
                    <h4 className="font-display text-xl font-black text-slate-950">{form.title}</h4>
                    {form.description && <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{form.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><AnnouncementIcon name="calendar" className="h-3.5 w-3.5" />{form.publishDate}</span>
                      <span className="inline-flex items-center gap-1.5"><AnnouncementIcon name="users" className="h-3.5 w-3.5" />{form.targetAudience}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="lg" onClick={() => handlePublish(true)} disabled={saving} className="flex-1">
                  Save Draft
                </Button>
                <Button size="lg" onClick={() => handlePublish(false)} disabled={saving} className="flex-1">
                  {saving ? 'Publishing...' : <><AnnouncementIcon name="megaphone" className="h-4 w-4" /> Publish Announcement</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
