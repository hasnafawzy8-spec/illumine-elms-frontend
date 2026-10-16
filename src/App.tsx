import { useState, useCallback, useEffect } from 'react';
import { AppState, CartItem, Order, Payment, View, Course, Book, Announcement, ClassSession, CoursePromotion, BookPromotion } from './types';
import { courses as initialCourses, books as initialBooks, announcements as initialAnnouncements, classSessions as initialSessions, sampleOrders, samplePayments } from './data';
import { Button, Toast } from './components/ui';
import StudentLayout from './components/StudentLayout';
import AdminLayout from './components/AdminLayout';
import TeacherLayout from './components/TeacherLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import StudentDashboard from './pages/student/Dashboard';
import StudentAssessment from './pages/student/Assessment';
import Courses from './pages/student/Courses';
import CourseDetail from './pages/student/CourseDetail';
import Enrollment from './pages/student/Enrollment';
import MyCourses from './pages/student/MyCourses';
import Schedule from './pages/student/Schedule';
import Announcements from './pages/student/Announcements';
import Books from './pages/student/Books';
import BookDetail from './pages/student/BookDetail';
import Cart from './pages/student/Cart';
import Orders from './pages/student/Orders';
import PaymentPage from './pages/student/Payment';
import PaymentHistory from './pages/student/PaymentHistory';
import Profile from './pages/student/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminCourses from './pages/admin/Courses';
import AdminClasses from './pages/admin/Classes';
import AdminTeachers from './pages/admin/Teachers';
import AdminBooks from './pages/admin/Books';
import AdminOrders from './pages/admin/Orders';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminPromotions from './pages/admin/Promotions';
import AdminAssessments from './pages/admin/Assessments';
import TeacherPortal from './pages/teacher/Portal';
import EarlyBirdOfferModal from './components/EarlyBirdOfferModal';

import { coursesAPI, booksAPI, announcementsAPI, schedulesAPI, ordersAPI, paymentsAPI, enrollmentsAPI, authAPI, getStoredUser, promotionsAPI, bookPromotionsAPI } from './services/api';

const ADMIN_VIEWS: View[] = [
  'admin-dashboard',
  'admin-students',
  'admin-courses',
  'admin-promotions',
  'admin-classes',
  'admin-teachers',
  'admin-books',
  'admin-enrollments',
  'admin-orders',
  'admin-announcements',
  'admin-assessments',
  'admin-payments',
  'admin-reports',
];

const TEACHER_VIEWS: View[] = ['teacher-dashboard', 'teacher-classes', 'teacher-announcements'];

const PUBLIC_STUDENT_VIEWS: View[] = [
  'student-courses',
  'student-course-detail',
  'student-books',
  'student-book-detail',
];

const PROTECTED_STUDENT_VIEWS: View[] = [
  'student-dashboard',
  'student-assessment',
  'student-enrollment',
  'student-enrollment-success',
  'student-my-courses',
  'student-schedule',
  'student-announcements',
  'student-cart',
  'student-order-success',
  'student-orders',
  'student-payment',
  'student-payment-status',
  'student-payment-history',
  'student-profile',
];

function OrderSuccess({ navigate, lastOrder }: { navigate: (v: View) => void; lastOrder: Order | null }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] fade-in-up">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
        <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-slate-500 text-sm mb-6">Your book order has been placed and is being processed.</p>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-left mb-6">
          <div className="flex justify-between"><span className="text-slate-400">Order Reference</span><span className="font-bold">{lastOrder?.reference || 'ORD-2026-0001'}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="font-bold text-[#C2660A]">Rs. {lastOrder?.total.toLocaleString() || '5,350'}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Delivery</span><span>{lastOrder?.deliveryMethod || 'Home Delivery'}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="text-amber-600 font-semibold">Confirmed</span></div>
        </div>
        <div className="space-y-2">
          <button onClick={() => navigate('student-orders')} className="w-full bg-[#1E6BB8] text-white py-3 rounded-xl font-semibold hover:bg-[#155a9c]">Track My Order</button>
          <button onClick={() => navigate('student-books')} className="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50">Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [schedulesList, setSchedulesList] = useState<ClassSession[]>([]);
  const [activePromotion, setActivePromotion] = useState<CoursePromotion | null>(null);
  const [activeBookPromotion, setActiveBookPromotion] = useState<BookPromotion | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<CoursePromotion | null>(null);
  const [promotionCheckedKey, setPromotionCheckedKey] = useState('');
  const [coursePromotionModalHidden, setCoursePromotionModalHidden] = useState(false);
  const [bookPromotionModalHidden, setBookPromotionModalHidden] = useState(false);

  const [state, setState] = useState<AppState>(() => {
    const stored = getStoredUser();
    const role = stored?.role === 'ADMIN' ? 'admin' : stored?.role === 'TEACHER' ? 'teacher' : stored?.role === 'STUDENT' ? 'student' : 'guest';
    return {
      currentView: new URLSearchParams(window.location.search).has('resetToken') ? 'forgot-password' : 'landing',
      selectedCourseId: null,
      selectedBookId: null,
      cart: [],
      enrolledCourseIds: [],
      studentEnrollments: [],
      orders: [],
      payments: [],
      toast: null,
      userRole: role,
      lastOrder: null,
      lastPaymentRef: null,
      lastPaymentMethod: 'CARD',
      lastEnrollmentPayment: null,
    };
  });

  // Fetch live backend data
  const refreshBackendData = useCallback(async () => {
    try {
      const [fetchedCourses, fetchedBooks, fetchedAnnouncements] = await Promise.allSettled([
        coursesAPI.getAll(),
        booksAPI.getAll(),
        announcementsAPI.getAll(),
      ]);

      if (fetchedCourses.status === 'fulfilled') {
        setCoursesList(fetchedCourses.value);
      }
      if (fetchedBooks.status === 'fulfilled') {
        setBooksList(fetchedBooks.value);
      }
      if (fetchedAnnouncements.status === 'fulfilled') {
        setAnnouncementsList(fetchedAnnouncements.value);
      }

      // If user is authenticated, fetch user-specific records
      const user = getStoredUser();
      if (user) {
        try {
          const isAdmin = user.role === 'ADMIN';
          const [fetchedSchedules, fetchedOrders, fetchedPayments, fetchedEnrollments] = await Promise.allSettled([
            schedulesAPI.getMy(),
            isAdmin ? ordersAPI.getAll() : ordersAPI.getMy(),
            isAdmin ? paymentsAPI.getAll() : paymentsAPI.getMy(),
            isAdmin ? enrollmentsAPI.getAll() : enrollmentsAPI.getMy(),
          ]);

          if (fetchedSchedules.status === 'fulfilled') {
            setSchedulesList(fetchedSchedules.value);
          }
          if (fetchedOrders.status === 'fulfilled') {
            setState(s => ({ ...s, orders: fetchedOrders.value }));
          }
          if (fetchedPayments.status === 'fulfilled') {
            setState(s => ({ ...s, payments: fetchedPayments.value }));
          }
          if (fetchedEnrollments.status === 'fulfilled') {
            const enrollments = fetchedEnrollments.value;
            // Only APPROVED enrollments grant course access
            const approvedIds = enrollments
              .filter((e: any) => e.status === 'APPROVED')
              .map((e: any) => e.course?._id || e.course?.id || e.course)
              .filter(Boolean);
            
            setState(s => ({ 
              ...s, 
              enrolledCourseIds: Array.from(new Set(approvedIds)),
              studentEnrollments: enrollments 
            }));
          }
        } catch (e) {
          console.log('User data sync info:', e);
        }
      }
    } catch (err) {
      console.warn('Backend connection notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  useEffect(() => {
    if (
      state.currentView === 'student-orders' ||
      state.currentView === 'admin-orders' ||
      state.currentView === 'student-books' ||
      state.currentView === 'student-book-detail' ||
      state.currentView === 'admin-books'
    ) {
      refreshBackendData();
    }
  }, [state.currentView, refreshBackendData]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshBackendData();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshBackendData]);
  const navigate = useCallback((view: View) => {
    setState(s => ({ ...s, currentView: view }));
    window.scrollTo(0, 0);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setState(s => ({ ...s, toast: { message, type } }));
    setTimeout(() => setState(s => ({ ...s, toast: null })), 3500);
  }, []);

  const setSelectedCourse = useCallback((id: string) => setState(s => ({ ...s, selectedCourseId: id })), []);
  const setSelectedBook = useCallback((id: string) => setState(s => ({ ...s, selectedBookId: id })), []);


  // Load active promotions for the student if applicable
  const loadStudentPromotion = useCallback(async () => {
    try {
      const [courseOfferResult, bookOfferResult] = await Promise.allSettled([
        promotionsAPI.getStudentActive(),
        bookPromotionsAPI.getActive(),
      ]);

      setActivePromotion(courseOfferResult.status === 'fulfilled' ? courseOfferResult.value : null);
      setActiveBookPromotion(
        bookOfferResult.status === 'fulfilled'
          ? bookOfferResult.value[0] || null
          : null
      );
    } catch (error) {
      console.log('Student promotion load notice:', error);
      setActivePromotion(null);
      setActiveBookPromotion(null);
    }

  }, []);
// Check if we should load promotions for the student based on their role and current view
  useEffect(() => {
    const user = getStoredUser();
    const canShowPromotion =
      state.currentView === 'student-dashboard' ||
      state.currentView === 'student-books';

    if (state.userRole !== 'student' || !canShowPromotion || !user) {
      return;
    }

    const key = `${user.id || user._id || user.email || 'student'}:${state.enrolledCourseIds.join(',')}`;
    if (promotionCheckedKey === key) {
      return;
    }

    setPromotionCheckedKey(key);
    loadStudentPromotion();
  }, [state.userRole, state.currentView, state.enrolledCourseIds, promotionCheckedKey, loadStudentPromotion]);

  const dismissCoursePromotion = useCallback(async () => {
    setCoursePromotionModalHidden(true);
  }, []);

  const dismissBookPromotion = useCallback(async () => {
    setBookPromotionModalHidden(true);
  }, []);

  const viewPromotedCourse = useCallback(() => {
    if (!activePromotion) return;
    setSelectedPromotion(activePromotion);
    setState(s => ({
      ...s,
      selectedCourseId: activePromotion.courseId,
      currentView: 'student-course-detail',
    }));
    setCoursePromotionModalHidden(true);
    window.scrollTo(0, 0);
  }, [activePromotion]);

  const viewPromotedBook = useCallback(() => {
    if (!activeBookPromotion) return;
    setState(s => ({
      ...s,
      selectedBookId: activeBookPromotion.bookId,
      currentView: 'student-book-detail',
    }));
    setBookPromotionModalHidden(true);

    // Scroll to top when navigating to the promoted book detail
    window.scrollTo(0, 0);
  }, [activeBookPromotion]);

  const addToCart = useCallback((item: CartItem) => {
    const currentBook =
      booksList.find(book => book.id === item.book.id) ||
      item.book;
    const stock = Math.max(0, currentBook.stock);
    if (stock === 0) {
      return;
    }

    setState(s => {
      const existing = s.cart.find(i => i.book.id === item.book.id);
      const currentQuantity = existing?.quantity || 0;
      const acceptedQuantity = Math.min(
        item.quantity,
        Math.max(0, stock - currentQuantity)
      );
      if (acceptedQuantity === 0) {
        return s;
      }

      if (existing) {
        return {
          ...s,
          cart: s.cart.map(i =>
            i.book.id === item.book.id
              ? { ...i, book: currentBook, quantity: currentQuantity + acceptedQuantity }
              : i
          ),
        };
      }
      return {
        ...s,
        cart: [...s.cart, { book: currentBook, quantity: acceptedQuantity }],
      };
    });
  }, [booksList]);

  const updateCartQty = useCallback((bookId: string, qty: number) => {
    const currentBook = booksList.find(book => book.id === bookId);
    setState(s => ({
      ...s,
      cart: s.cart.flatMap(i => {
        if (i.book.id !== bookId) {
          return [i];
        }
        const stock = Math.max(0, currentBook?.stock ?? i.book.stock);
        const quantity = Math.max(0, Math.min(qty, stock));
        return quantity > 0
          ? [{ ...i, book: currentBook || i.book, quantity }]
          : [];
      }),
    }));
  }, [booksList]);

  const removeFromCart = useCallback((bookId: string) => {
    setState(s => ({ ...s, cart: s.cart.filter(i => i.book.id !== bookId) }));
  }, []);

  const placeOrder = useCallback(async (order: Order, paymentMethod: 'CARD' | 'BANK_TRANSFER', receiptFile?: File) => {
  try {
    // 1. Create the book order
    const orderResponse = await ordersAPI.create({
      items: order.items.map((item) => ({
        book: item.book.id,
        quantity: item.quantity,
        unitPrice: item.book.price,
      })),
      deliveryMethod:
        order.deliveryMethod === 'Home Delivery'
          ? 'DELIVERY'
          : 'PICKUP',
      deliveryAddress: {
        street: order.address,
        city: 'Sri Lanka',
        country: 'Sri Lanka',
      },
      contactPhone: order.phone,
    });

    const backendOrder = orderResponse.data;

    if (!backendOrder?._id) {
      throw new Error('Book order was not created correctly.');
    }

    // 2. Create a PENDING payment linked to this order
    // Do not send or store card number / CVV.
    const paymentData = receiptFile ? new FormData() : null;
    if (paymentData) {
      paymentData.append('purpose', 'BOOK_ORDER');
      paymentData.append('relatedOrder', backendOrder._id);
      paymentData.append('paymentMethod', paymentMethod);
      paymentData.append('transactionId', order.reference);
      paymentData.append('notes', `Bank transfer for book order ${backendOrder.orderNumber}`);
      paymentData.append('receiptImage', receiptFile);
    }
    const paymentResponse = await paymentsAPI.create(paymentData || {
      purpose: 'BOOK_ORDER',
      relatedOrder: backendOrder._id,
      paymentMethod,
      transactionId: order.reference,
      notes: `Card payment for book order ${backendOrder.orderNumber}`,
    });

    const backendPayment = paymentResponse?.data || paymentResponse;

    // 3. Create the frontend order using the real MongoDB ID
    const savedOrder: Order = {
      ...order,
      id: backendOrder._id,
      reference: backendOrder.orderNumber || order.reference,
      status:
        backendOrder.status === 'CONFIRMED'
          ? 'Confirmed'
          : backendOrder.status === 'DELIVERED'
          ? 'Delivered'
          : backendOrder.status === 'COMPLETED'
          ? 'Delivered'
          : backendOrder.status === 'CANCELLED'
          ? 'Cancelled'
          : 'Pending',
    };

    // 4. Update frontend state
    setState((s) => ({
      ...s,
      orders: [
        savedOrder,
        ...s.orders.filter(
          (existing) => existing.reference !== savedOrder.reference
        ),
      ],
      lastOrder: savedOrder,
      cart: [],
      payments: backendPayment
        ? [
            {
              id: backendPayment.id || '',
              reference:
                backendPayment.reference ||
                order.reference,
              date: new Date().toISOString().split('T')[0],
              description: 'Book Store Order Payment',
              amount: backendPayment.amount || order.total,
              method: backendPayment.method || (paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Card'),
              status: backendPayment.status || 'Pending',
              relatedTo:
                backendOrder.orderNumber || savedOrder.reference,
              paymentEvidence: backendPayment.paymentEvidence || '',
              relatedOrderId: backendPayment.relatedOrderId,
            },
            ...s.payments,
          ]
        : s.payments,
    }));

    showToast(
      'Payment submitted. Your order is pending admin approval.',
      'info'
    );
  } catch (error) {
    console.error('Book order/payment error:', error);

    showToast(
      error instanceof Error && error.message
        ? error.message
        : 'Unable to submit the order or payment. Please try again.',
      'error'
    );

    throw error;
  }
}, [showToast]);
  const updateOrderStatus = useCallback((reference: string, status: Order['status']) => {
    setState(s => ({
      ...s,
      orders: s.orders.map(order => order.reference === reference ? { ...order, status } : order),
      lastOrder: s.lastOrder?.reference === reference ? { ...s.lastOrder, status } : s.lastOrder,
    }));
  }, []);

  const updateCourse = useCallback((course: Course) => {
    setCoursesList(previous => previous.some(item => item.id === course.id) ? previous.map(item => item.id === course.id ? course : item) : [course, ...previous]);
  }, []);

  const removeCourse = useCallback((id: string) => setCoursesList(previous => previous.filter(course => course.id !== id)), []);
  const updateBook = useCallback((book: Book) => {
    setBooksList(previous => previous.some(item => item.id === book.id) ? previous.map(item => item.id === book.id ? book : item) : [book, ...previous]);
  }, []);
  const removeBook = useCallback((id: string) => setBooksList(previous => previous.filter(book => book.id !== id)), []);
  const updateAnnouncement = useCallback((announcement: Announcement) => {
    setAnnouncementsList(previous => previous.some(item => item.id === announcement.id) ? previous.map(item => item.id === announcement.id ? announcement : item) : [announcement, ...previous]);
  }, []);
  const removeAnnouncement = useCallback((id: string) => setAnnouncementsList(previous => previous.filter(announcement => announcement.id !== id)), []);

  const completePayment = useCallback(async (payment: Payment) => {
    setState(s => ({ ...s, payments: [payment, ...s.payments] }));
    try {
      await paymentsAPI.create({
        purpose: 'COURSE_FEE',
        amount: payment.amount,
        paymentMethod: payment.method === 'Bank Transfer' ? 'BANK_TRANSFER' : 'ONLINE',
        transactionId: payment.reference,
        notes: payment.description,
        receipt: payment.receipt,
      });
      showToast('Payment record submitted to backend!', 'success');
    } catch (e) {
      console.log('Payment backend response:', e);
    }
  }, [showToast]);

    const confirmEnroll = useCallback(async (paymentDetails: {
      paymentReference: string;
      paymentMethod: 'CARD' | 'BANK_TRANSFER';
      paymentPlan: 'FULL' | 'INSTALLMENT' | string;
      amount: number;
      totalPayable: number;
      remainingAmount: number;
      installmentNumber?: number;
      totalInstallments?: number;
      nextDueDate?: string;
      promotionId?: string;
      promotionTitle?: string;
      originalFee?: number;
      discountedFee?: number;
      discountAmount?: number;
      discountPercent?: number;
    }) => {
    const courseId = state.selectedCourseId;
    if (courseId) {
      const availableCourses = coursesList.length > 0 ? coursesList : initialCourses;
      const course = availableCourses.find(item => item.id === courseId);
      const paymentRecord: Payment = {
        id: paymentDetails.paymentReference,
        reference: paymentDetails.paymentReference,
        date: new Date().toISOString(),
        description: `${paymentDetails.paymentPlan === 'INSTALLMENT' ? `Installment ${paymentDetails.installmentNumber || 1} of ${paymentDetails.totalInstallments || 3}` : 'Course Fee Payment'} (${course?.name || 'Course'})`,
        amount: paymentDetails.amount,
        method: paymentDetails.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Card',
        status: 'Pending',
        relatedTo: course?.name || 'Course enrollment',
        courseId,
        paymentPlan: paymentDetails.paymentPlan,
        installmentNumber: paymentDetails.installmentNumber,
        totalInstallments: paymentDetails.totalInstallments,
        totalPayable: paymentDetails.totalPayable,
        paidAmount: paymentDetails.amount,
        remainingAmount: paymentDetails.remainingAmount,
        nextDueDate: paymentDetails.nextDueDate,
        promotionId: paymentDetails.promotionId,
        promotionTitle: paymentDetails.promotionTitle,
        originalFee: paymentDetails.originalFee,
        discountedFee: paymentDetails.discountedFee,
        discountAmount: paymentDetails.discountAmount,
        discountPercent: paymentDetails.discountPercent,
      };

      setState(s => ({
        ...s,
        currentView: 'student-enrollment-success',
          lastPaymentRef: paymentDetails.paymentReference,
          lastPaymentMethod: paymentDetails.paymentMethod,
          lastEnrollmentPayment: paymentRecord,
          payments: [
            paymentRecord,
            ...s.payments.filter(payment => payment.reference !== paymentRecord.reference),
          ],
      }));

      try {
        await enrollmentsAPI.create({ courseId });
        showToast('Enrollment submitted. Course access is pending admin approval.', 'info');
        // Refresh to fetch the new pending enrollment
        refreshBackendData();
      } catch (e) {
        console.log('Enrollment backend response:', e);
        showToast('Failed to submit enrollment request.', 'error');
      }
    }
  }, [state.selectedCourseId, coursesList, showToast, refreshBackendData]);

  const handleLoginSuccess = useCallback((role: 'student' | 'teacher' | 'admin', user?: any) => {
    setActivePromotion(null);
    setActiveBookPromotion(null);
    setSelectedPromotion(null);
    setPromotionCheckedKey('');
    setCoursePromotionModalHidden(false);
    setBookPromotionModalHidden(false);
    setState(s => ({
      ...s,
      userRole: role,
      ...(role === 'student' ? { enrolledCourseIds: [], orders: [], payments: [], lastOrder: null } : {}),
    }));
    showToast(`Welcome back, ${user?.firstName || (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student')}!`, 'success');
    refreshBackendData();
  }, [showToast, refreshBackendData]);

  const { currentView, selectedCourseId, selectedBookId, cart, enrolledCourseIds, studentEnrollments, orders, payments, toast, lastOrder, userRole } = state;
  const currentUser = getStoredUser();
  const coursesForDisplay = coursesList.length > 0 ? coursesList : initialCourses;
  const booksForDisplay = booksList.length > 0 ? booksList : initialBooks;
  const enrollmentPromotion =
    selectedPromotion?.courseId === selectedCourseId
      ? selectedPromotion
      : activePromotion?.courseId === selectedCourseId
        ? activePromotion
        : null;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const hasEnrolledCourses = enrolledCourseIds.length > 0;

  // Public pages
  if (currentView === 'landing') return (
    <>
      <LandingPage navigate={navigate} courses={coursesForDisplay} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );
  if (currentView === 'login') return (
    <>
      <LoginPage navigate={navigate} onLoginSuccess={handleLoginSuccess} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );
  if (currentView === 'forgot-password') return (
    <>
      <ForgotPasswordPage navigate={navigate} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );
  if (currentView === 'register') return (
    <>
      <RegisterPage navigate={navigate} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );

  if (PROTECTED_STUDENT_VIEWS.includes(currentView) && userRole === 'guest') return (
    <>
      <LoginPage navigate={navigate} onLoginSuccess={handleLoginSuccess} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );

  if (currentView === 'student-announcements' && userRole === 'student' && !hasEnrolledCourses) {
    return (
      <>
        <StudentLayout
          currentView="student-books"
          navigate={navigate}
          cartCount={cartCount}
          user={currentUser}
          hasEnrolledCourses={false}
        >
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-slate-800 font-display">Enroll in a course to view announcements</h2>
            <p className="mt-2 mb-5 text-sm text-slate-500">You can browse and purchase books while your course enrollment is pending.</p>
            <Button onClick={() => navigate('student-books')}>Browse Books</Button>
          </div>
        </StudentLayout>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
      </>
    );
  }

  // Admin views
  if (ADMIN_VIEWS.includes(currentView)) return (
    <>
      <AdminLayout currentView={currentView} navigate={navigate} user={currentUser}>
        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            navigate={navigate}
            courses={coursesList}
            orders={orders}
            payments={payments}
            announcements={announcementsList}
          />
        )}
        {currentView === 'admin-students' && <AdminStudents navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-courses' && <AdminCourses navigate={navigate} showToast={showToast} onCourseChange={updateCourse} onCourseDelete={removeCourse} />}
        {currentView === 'admin-promotions' && <AdminPromotions navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-classes' && <AdminClasses navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-teachers' && <AdminTeachers navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-books' && <AdminBooks navigate={navigate} showToast={showToast} onBookChange={updateBook} onBookDelete={removeBook} />}
        {currentView === 'admin-enrollments' && <AdminEnrollments navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-orders' && <AdminOrders navigate={navigate} showToast={showToast} onOrderStatusChange={updateOrderStatus} />}
        {currentView === 'admin-announcements' && <AdminAnnouncements navigate={navigate} showToast={showToast} announcements={announcementsList} onAnnouncementChange={updateAnnouncement} onAnnouncementDelete={removeAnnouncement} />}
        {currentView === 'admin-assessments' && <AdminAssessments navigate={navigate} showToast={showToast} />}
        {currentView === 'admin-payments' && (
          <AdminPayments
            navigate={navigate}
            payments={payments}
            onPaymentStatusChange={(reference, status) => setState(s => ({
              ...s,
              payments: s.payments.map(payment => payment.reference === reference ? { ...payment, status } : payment),
            }))}
          />
        )}
        {currentView === 'admin-reports' && <AdminReports navigate={navigate} showToast={showToast} />}
      </AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );

  if (TEACHER_VIEWS.includes(currentView)) return (
    <>
      <TeacherLayout currentView={currentView} navigate={navigate}>
        <TeacherPortal
          currentView={currentView}
          navigate={navigate}
          sessions={schedulesList}
          announcements={announcementsList}
          setSessions={setSchedulesList}
          setAnnouncements={setAnnouncementsList}
          showToast={showToast}
        />
      </TeacherLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );

  // Student views (default)
  return (
    <>
      <StudentLayout
        currentView={currentView}
        navigate={navigate}
        cartCount={cartCount}
        user={currentUser}
        hasEnrolledCourses={hasEnrolledCourses}
      >
        {currentView === 'student-dashboard' && (
          <StudentDashboard navigate={navigate} enrolledCourseIds={enrolledCourseIds} cartCount={cartCount} user={currentUser} payments={payments} orders={orders} courses={coursesForDisplay} sessions={schedulesList} announcements={announcementsList} hasEnrolledCourses={hasEnrolledCourses} />
        )}
        {currentView === 'student-assessment' && (
          <StudentAssessment
            navigate={navigate}
            onSelectCourse={setSelectedCourse}
            enrolledCourseIds={enrolledCourseIds}
            courses={coursesForDisplay}
            user={currentUser}
            showToast={showToast}
          />
        )}
        {currentView === 'student-courses' && (
          <Courses navigate={navigate} onSelectCourse={setSelectedCourse} enrolledCourseIds={enrolledCourseIds} courses={coursesForDisplay} promotion={activePromotion} />
        )}
        {currentView === 'student-course-detail' && (
          <CourseDetail
            navigate={navigate}
            selectedCourseId={selectedCourseId}
            enrolledCourseIds={enrolledCourseIds}
            onEnroll={() => {
              if (userRole === 'guest') {
                showToast('Please log in or create an account before enrolling.', 'info');
                navigate('login');
                return;
              }
              navigate('student-enrollment');
            }}
            courses={coursesForDisplay}
            promotion={activePromotion}
          />
        )}
        {currentView === 'student-enrollment' && (
          <Enrollment
            navigate={navigate}
            selectedCourseId={selectedCourseId}
            onConfirmEnroll={confirmEnroll}
            success={false}
            enrolledCourseIds={enrolledCourseIds}
            courses={coursesForDisplay}
            promotion={enrollmentPromotion}
            paymentReference={state.lastPaymentRef}
            submittedPaymentMethod={state.lastPaymentMethod}
            submittedPayment={state.lastEnrollmentPayment}
          />
        )}
        {currentView === 'student-enrollment-success' && (
          <Enrollment
            navigate={navigate}
            selectedCourseId={selectedCourseId}
            onConfirmEnroll={confirmEnroll}
            success={true}
            enrolledCourseIds={enrolledCourseIds}
            courses={coursesForDisplay}
            promotion={enrollmentPromotion}
            paymentReference={state.lastPaymentRef}
            submittedPaymentMethod={state.lastPaymentMethod}
            submittedPayment={state.lastEnrollmentPayment}
          />
        )}
        {currentView === 'student-my-courses' && (
          <MyCourses
            navigate={navigate}
            enrolledCourseIds={enrolledCourseIds}
            studentEnrollments={studentEnrollments}
            onSelectCourse={setSelectedCourse}
            courses={coursesForDisplay}
            sessions={schedulesList}
          />
        )}
        {currentView === 'student-schedule' && (
          <Schedule
            navigate={navigate}
            sessions={schedulesList}
            enrolledCourseIds={enrolledCourseIds}
            studentEnrollments={studentEnrollments}
          />
        )}
        {currentView === 'student-announcements' && <Announcements navigate={navigate} announcements={announcementsList} />}
        {currentView === 'student-books' && (
          <Books navigate={navigate} onSelectBook={setSelectedBook} onAddToCart={addToCart} showToast={showToast} books={booksForDisplay} cart={cart} />
        )}
        {currentView === 'student-book-detail' && (
          <BookDetail navigate={navigate} selectedBookId={selectedBookId} onAddToCart={addToCart} showToast={showToast} books={booksForDisplay} cart={cart} />
        )}
        {currentView === 'student-cart' && (
          <Cart
            navigate={navigate}
            cart={cart}
            books={booksForDisplay}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
            showToast={showToast}
          />
        )}
        {currentView === 'student-order-success' && (
          <OrderSuccess navigate={navigate} lastOrder={lastOrder} />
        )}
        {currentView === 'student-orders' && (
          <Orders navigate={navigate} orders={orders} lastOrder={lastOrder} />
        )}
        {currentView === 'student-payment' && (
          <PaymentPage navigate={navigate} onPaymentComplete={completePayment} enrolledCourseIds={enrolledCourseIds} />
        )}
        {(currentView === 'student-payment-status' || currentView === 'student-payment-history') && (
          <PaymentHistory navigate={navigate} payments={payments} />
        )}
        {currentView === 'student-profile' && (
          <Profile navigate={navigate} showToast={showToast} />
        )}
      </StudentLayout>
      {currentView === 'student-books' && activeBookPromotion && !bookPromotionModalHidden && (
        <EarlyBirdOfferModal
          variant="book"
          promotion={activeBookPromotion}
          onViewOffer={viewPromotedBook}
          onDismiss={dismissBookPromotion}
        />
      )}
      {currentView === 'student-dashboard' && activePromotion && !coursePromotionModalHidden && (
        <EarlyBirdOfferModal
          variant="course"
          promotion={activePromotion}
          onViewOffer={viewPromotedCourse}
          onDismiss={dismissCoursePromotion}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setState(s => ({ ...s, toast: null }))} />}
    </>
  );
}
