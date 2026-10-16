import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Textarea } from '../../components/ui';
import type { Book, BookPromotion, Course, CoursePromotion, View } from '../../types';
import { bookPromotionsAPI, booksAPI, coursesAPI, promotionsAPI } from '../../services/api';
import { courses as initialCourses } from '../../data';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  course: '',
  title: '',
  description: '',
  discountedFee: '',
  startDate: todayInputValue(),
  closingDate: '',
  conditions: '',
  isActive: true,
};

const emptyBookForm = {
  book: '',
  title: '',
  description: '',
  discountedPrice: '',
  startDate: todayInputValue(),
  closingDate: '',
  conditions: '',
  isActive: true,
};
//admin page for managing course promotions and book promotions, with forms for creating and editing offers
export default function AdminPromotions({ showToast }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [books, setBooks] = useState<Book[]>([]);
  const [promotions, setPromotions] = useState<CoursePromotion[]>([]);
  const [bookPromotions, setBookPromotions] = useState<BookPromotion[]>([]);
  const [courseLoadError, setCourseLoadError] = useState('');
  const [bookOfferLoadError, setBookOfferLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editing, setEditing] = useState<CoursePromotion | null>(null);
  const [editingBookOffer, setEditingBookOffer] = useState<BookPromotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bookForm, setBookForm] = useState(emptyBookForm);

  const selectedCourse = useMemo(
    () => courses.find(course => course.id === form.course),
    [courses, form.course]
  );

  // Use useMemo to find the selected book based on the bookForm.book value
  const selectedBook = useMemo(
    () => books.find(book => book.id === bookForm.book),
    [books, bookForm.book]
  );

  const loadData = async () => {
    setLoading(true);
    const [courseResult, bookResult, promotionResult, bookPromotionResult] = await Promise.allSettled([
      coursesAPI.getAll(),
      booksAPI.getAll(),
      promotionsAPI.getAll(),
      bookPromotionsAPI.getAll(),
    ]);

    if (courseResult.status === 'fulfilled') {
      setCourseLoadError('');
      setCourses(courseResult.value.length ? courseResult.value : []);
    } else {
      setCourseLoadError(courseResult.reason?.message || 'Backend courses could not be loaded.');
      setCourses([]);
      showToast(courseResult.reason?.message || 'Unable to load courses for offers.', 'error');
    }

    if (bookResult.status === 'fulfilled') {
      setBooks(bookResult.value.length ? bookResult.value : []);
    } else {
      setBooks([]);
      showToast(bookResult.reason?.message || 'Unable to load books for offers.', 'error');
    }

    if (promotionResult.status === 'fulfilled') {
      setPromotions(promotionResult.value);
    } else {
      setPromotions([]);
      showToast(promotionResult.reason?.message || 'Unable to load course offers.', 'error');
    }

    if (bookPromotionResult.status === 'fulfilled') {
      setBookOfferLoadError('');
      setBookPromotions(bookPromotionResult.value);
    } else {
      const message =
        bookPromotionResult.reason?.message ||
        'Book offers could not be loaded right now.';
      setBookPromotions([]);
      setBookOfferLoadError(/Route not found/i.test(message) ? '' : message);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      course: courses[0]?.id || '',
    });
    setShowModal(true);
  };

  const openCreateBookOffer = () => {
    setEditingBookOffer(null);
    setBookOfferLoadError(current => /Route not found/i.test(current) ? '' : current);
    setBookForm({
      ...emptyBookForm,
      book: books[0]?.id || '',
    });
    setShowBookModal(true);
  };

  const openEdit = (promotion: CoursePromotion) => {
    setEditing(promotion);
    setForm({
      course: promotion.courseId,
      title: promotion.title,
      description: promotion.description,
      discountedFee: String(promotion.discountedFee),
      startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : todayInputValue(),
      closingDate: promotion.closingDate ? promotion.closingDate.slice(0, 10) : '',
      conditions: promotion.conditions || '',
      isActive: promotion.isActive,
    });
    setShowModal(true);
  };

  const openEditBookOffer = (promotion: BookPromotion) => {
    setEditingBookOffer(promotion);
    setBookForm({
      book: promotion.bookId,
      title: promotion.title,
      description: promotion.description,
      discountedPrice: String(promotion.discountedPrice),
      startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : todayInputValue(),
      closingDate: promotion.closingDate ? promotion.closingDate.slice(0, 10) : '',
      conditions: promotion.conditions || '',
      isActive: promotion.isActive,
    });
    setShowBookModal(true);
  };

  const validateForm = () => {
    const regularFee = Number(selectedCourse?.monthlyFee || 0);
    const discountedFee = Number(form.discountedFee);
    const startDate = new Date(form.startDate);
    const closingDate = new Date(form.closingDate);

    if (!form.course) return 'Choose a course for this offer.';
    if (!/^[0-9a-fA-F]{24}$/.test(form.course)) {
      return 'This course is demo data, not a saved backend course. Create or reload the course in Course Management first.';
    }
    if (!form.title.trim()) return 'Enter a campaign title.';
    if (!form.description.trim()) return 'Enter a short campaign description.';
    if (Number.isNaN(discountedFee) || discountedFee < 0) return 'Discounted fee must be zero or higher.';
    if (discountedFee >= regularFee) return 'Discounted fee must be lower than the course regular fee.';
    if (!form.startDate || !form.closingDate) return 'Start date and closing date are required.';
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(closingDate.getTime()) || closingDate <= startDate) {
      return 'Closing date must be after the start date.';
    }
    return '';
  };

  const validateBookForm = () => {
    const regularPrice = Number(selectedBook?.price || 0);
    const discountedPrice = Number(bookForm.discountedPrice);
    const startDate = new Date(bookForm.startDate);
    const closingDate = new Date(bookForm.closingDate);

    if (!bookForm.book) return 'Choose a book for this offer.';
    if (!/^[0-9a-fA-F]{24}$/.test(bookForm.book)) {
      return 'This book is demo data, not a saved backend book. Create or reload the book in Book Management first.';
    }
    if (!bookForm.title.trim()) return 'Enter a campaign title.';
    if (!bookForm.description.trim()) return 'Enter a short campaign description.';
    if (Number.isNaN(discountedPrice) || discountedPrice < 0) return 'Discounted price must be zero or higher.';
    if (discountedPrice >= regularPrice) return 'Discounted price must be lower than the regular book price.';
    if (!bookForm.startDate || !bookForm.closingDate) return 'Start date and closing date are required.';
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(closingDate.getTime()) || closingDate <= startDate) {
      return 'Closing date must be after the start date.';
    }
    return '';
  };

  const savePromotion = async () => {
    const error = validateForm();
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const payload = {
        course: form.course,
        title: form.title.trim(),
        description: form.description.trim(),
        discountedFee: Number(form.discountedFee),
        startDate: form.startDate,
        closingDate: form.closingDate,
        conditions: form.conditions.trim(),
        isActive: form.isActive,
      };
      const saved = editing
        ? await promotionsAPI.update(editing.id, payload)
        : await promotionsAPI.create(payload);

      setPromotions(current =>
        current.some(item => item.id === saved.id)
          ? current.map(item => item.id === saved.id ? saved : item)
          : [saved, ...current]
      );
      setShowModal(false);
      showToast(editing ? 'Offer updated successfully.' : 'Early bird offer created successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to save the offer.', 'error');
    }
  };

  const saveBookPromotion = async () => {
    const error = validateBookForm();
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const payload = {
        book: bookForm.book,
        title: bookForm.title.trim(),
        description: bookForm.description.trim(),
        discountedPrice: Number(bookForm.discountedPrice),
        startDate: bookForm.startDate,
        closingDate: bookForm.closingDate,
        conditions: bookForm.conditions.trim(),
        isActive: bookForm.isActive,
      };
      const saved = editingBookOffer
        ? await bookPromotionsAPI.update(editingBookOffer.id, payload)
        : await bookPromotionsAPI.create(payload);

      setBookPromotions(current =>
        current.some(item => item.id === saved.id)
          ? current.map(item => item.id === saved.id ? saved : item)
          : [saved, ...current]
      );
      setShowBookModal(false);
      showToast(editingBookOffer ? 'Book offer updated successfully.' : 'Book offer created successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to save the book offer.', 'error');
    }
  };

  const toggleStatus = async (promotion: CoursePromotion) => {
    try {
      const updated = await promotionsAPI.setStatus(promotion.id, !promotion.isActive);
      setPromotions(current => current.map(item => item.id === updated.id ? updated : item));
      showToast(updated.isActive ? 'Offer activated.' : 'Offer deactivated.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to update offer status.', 'error');
    }
  };

  const toggleBookStatus = async (promotion: BookPromotion) => {
    try {
      const updated = await bookPromotionsAPI.setStatus(promotion.id, !promotion.isActive);
      setBookPromotions(current => current.map(item => item.id === updated.id ? updated : item));
      showToast(updated.isActive ? 'Book offer activated.' : 'Book offer deactivated.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to update book offer status.', 'error');
    }
  };

  const now = new Date();
  const activeCount = promotions.filter(p =>
    p.isActive && new Date(p.startDate) <= now && new Date(p.closingDate) >= now
  ).length;
  const activeBookCount = bookPromotions.filter(p =>
    p.isActive && new Date(p.startDate) <= now && new Date(p.closingDate) >= now
  ).length;

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader
        title="Course Promotions"
        subtitle="Create and manage early bird course offers shown to eligible students"
        action={<Button onClick={openCreate}>+ New Offer</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Active offers</p>
          <p className="mt-2 font-display text-3xl font-black text-[#1E6BB8]">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Active book offers</p>
          <p className="mt-2 font-display text-3xl font-black text-emerald-700">{activeBookCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Campaigns</p>
          <p className="mt-2 font-display text-3xl font-black text-slate-950">{promotions.length + bookPromotions.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <span>Offer</span>
            <span>Course</span>
            <span>Fee</span>
            <span>Validity</span>
            <span className="text-right">Actions</span>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading offers...</div>
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-bold text-slate-800">No course offers yet</p>
            <p className="mt-1 text-sm text-slate-500">Create one to show the Early Bird popup in the student portal.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {promotions.map(promotion => {
              const validNow = promotion.isActive && new Date(promotion.startDate) <= now && new Date(promotion.closingDate) >= now;
              return (
                <div key={promotion.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 text-sm">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{promotion.title}</span>
                      <Badge color={validNow ? 'green' : promotion.isActive ? 'amber' : 'slate'}>
                        {validNow ? 'Live' : promotion.isActive ? 'Scheduled / Expired' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{promotion.description}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{promotion.courseName}</p>
                    <p className="text-xs font-semibold text-slate-400">{promotion.courseGrade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 line-through">Rs. {promotion.originalFee.toLocaleString()}</p>
                    <p className="font-black text-[#1E6BB8]">Rs. {promotion.discountedFee.toLocaleString()}</p>
                    <p className="text-xs font-bold text-emerald-700">Save {promotion.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{formatColomboDisplayDate(promotion.startDate)}</p>
                    <p className="text-xs font-semibold text-slate-400">to {formatColomboDisplayDate(promotion.closingDate)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(promotion)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Edit</button>
                    <button onClick={() => toggleStatus(promotion)} className={`rounded-xl px-3 py-2 text-xs font-bold ${promotion.isActive ? 'border border-amber-200 text-amber-700 hover:bg-amber-50' : 'border border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {promotion.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Book offers</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Create discounts for books shown in the student bookstore.</p>
          </div>
          <Button onClick={openCreateBookOffer}>+ New Book Offer</Button>
        </div>
        <div className="border-b border-slate-100 bg-white px-5 py-3">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <span>Offer</span>
            <span>Book</span>
            <span>Price</span>
            <span>Validity</span>
            <span className="text-right">Actions</span>
          </div>
        </div>
        {bookOfferLoadError ? (
          <div className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {bookOfferLoadError}
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading book offers...</div>
        ) : bookPromotions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-bold text-slate-800">No book offers yet</p>
            <p className="mt-1 text-sm text-slate-500">Create one to show sale prices in the book store.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookPromotions.map(promotion => {
              const validNow = promotion.isActive && new Date(promotion.startDate) <= now && new Date(promotion.closingDate) >= now;
              return (
                <div key={promotion.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 text-sm">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{promotion.title}</span>
                      <Badge color={validNow ? 'green' : promotion.isActive ? 'amber' : 'slate'}>
                        {validNow ? 'Live' : promotion.isActive ? 'Scheduled / Expired' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{promotion.description}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{promotion.bookTitle}</p>
                    <p className="text-xs font-semibold text-slate-400">{promotion.bookCategory}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 line-through">Rs. {promotion.originalPrice.toLocaleString()}</p>
                    <p className="font-black text-emerald-700">Rs. {promotion.discountedPrice.toLocaleString()}</p>
                    <p className="text-xs font-bold text-emerald-700">Save {promotion.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{formatColomboDisplayDate(promotion.startDate)}</p>
                    <p className="text-xs font-semibold text-slate-400">to {formatColomboDisplayDate(promotion.closingDate)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEditBookOffer(promotion)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Edit</button>
                    <button onClick={() => toggleBookStatus(promotion)} className={`rounded-xl px-3 py-2 text-xs font-bold ${promotion.isActive ? 'border border-amber-200 text-amber-700 hover:bg-amber-50' : 'border border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {promotion.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showModal && (
        <Modal title={editing ? 'Edit Course Offer' : 'Create Course Offer'} onClose={() => setShowModal(false)} size="lg">
          <div className="space-y-4">
            {courseLoadError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {courseLoadError}
              </div>
            )}
            {!courseLoadError && courses.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                No backend courses are available for offers. Create a course in Course Management first, then come back here.
              </div>
            )}
            <Select
              label="Course"
              value={form.course}
              onChange={course => setForm(current => ({ ...current, course }))}
              options={courses.map(course => ({
                value: course.id,
                label: `${course.name} - Rs. ${course.monthlyFee.toLocaleString()}`,
              }))}
              required
            />
            {selectedCourse && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1E6BB8]">Regular course fee</p>
                <p className="mt-1 text-2xl font-black text-slate-950">Rs. {selectedCourse.monthlyFee.toLocaleString()}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedCourse.grade} · {selectedCourse.duration}</p>
              </div>
            )}
            <Input label="Campaign Title" value={form.title} onChange={title => setForm(current => ({ ...current, title }))} placeholder="Improve Your Child's English!" required />
            <Textarea label="Short Description" value={form.description} onChange={description => setForm(current => ({ ...current, description }))} placeholder="Explain the learning benefits for this course." rows={3} required />
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Discounted Fee" type="number" min={0} value={form.discountedFee} onChange={discountedFee => setForm(current => ({ ...current, discountedFee }))} required />
              <Input label="Start Date" type="date" value={form.startDate} onChange={startDate => setForm(current => ({ ...current, startDate }))} required />
              <Input label="Closing Date" type="date" value={form.closingDate} onChange={closingDate => setForm(current => ({ ...current, closingDate }))} required />
            </div>
            <Textarea label="Offer Conditions" value={form.conditions} onChange={conditions => setForm(current => ({ ...current, conditions }))} placeholder="Example: Valid for first-time course enrollment before the closing date." rows={3} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
              />
              Activate this offer
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={savePromotion}>{editing ? 'Save Changes' : 'Create Offer'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {showBookModal && (
        <Modal title={editingBookOffer ? 'Edit Book Offer' : 'Create Book Offer'} onClose={() => setShowBookModal(false)} size="lg">
          <div className="space-y-4">
            {books.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                No backend books are available for offers. Create a book in Book Management first, then come back here.
              </div>
            )}
            <Select
              label="Book"
              value={bookForm.book}
              onChange={book => setBookForm(current => ({ ...current, book }))}
              options={books.map(book => ({
                value: book.id,
                label: `${book.title} - Rs. ${book.price.toLocaleString()}`,
              }))}
              required
            />
            {selectedBook && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Regular book price</p>
                <p className="mt-1 text-2xl font-black text-slate-950">Rs. {selectedBook.price.toLocaleString()}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedBook.category} · {selectedBook.stock} in stock</p>
              </div>
            )}
            <Input label="Campaign Title" value={bookForm.title} onChange={title => setBookForm(current => ({ ...current, title }))} placeholder="Back to class book offer" required />
            <Textarea label="Short Description" value={bookForm.description} onChange={description => setBookForm(current => ({ ...current, description }))} placeholder="Explain why this book offer is useful for students." rows={3} required />
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Discounted Price" type="number" min={0} value={bookForm.discountedPrice} onChange={discountedPrice => setBookForm(current => ({ ...current, discountedPrice }))} required />
              <Input label="Start Date" type="date" value={bookForm.startDate} onChange={startDate => setBookForm(current => ({ ...current, startDate }))} required />
              <Input label="Closing Date" type="date" value={bookForm.closingDate} onChange={closingDate => setBookForm(current => ({ ...current, closingDate }))} required />
            </div>
            <Textarea label="Offer Conditions" value={bookForm.conditions} onChange={conditions => setBookForm(current => ({ ...current, conditions }))} placeholder="Example: Valid while stocks last before the closing date." rows={3} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={bookForm.isActive}
                onChange={event => setBookForm(current => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded text-[#1E6BB8] focus:ring-[#1E6BB8]"
              />
              Activate this book offer
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setShowBookModal(false)}>Cancel</Button>
              <Button onClick={saveBookPromotion}>{editingBookOffer ? 'Save Changes' : 'Create Book Offer'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
