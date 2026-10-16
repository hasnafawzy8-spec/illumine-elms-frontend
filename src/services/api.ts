import {
  Course,
  Book,
  ClassSession,
  Announcement,
  Order,
  Payment,
  CoursePromotion,
  BookPromotion,
  AssessmentAttempt,
  AssessmentCategory,
  AssessmentQuestion,
  AssessmentRecommendation,
} from '../types';
import {
  formatColomboDisplayDate,
  formatColomboDate,
  formatColomboTime,
  formatColomboDateTime,
  SRI_LANKA_TZ,
  getNextMonthSameDate
} from '../utils/dateFormatter';

const API_BASE = '/api';

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

export const getToken = (): string | null => {
  return localStorage.getItem('illumine_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('illumine_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('illumine_token');
  localStorage.removeItem('illumine_user');
};

export const getStoredUser = (): any | null => {
  try {
    const raw =
      localStorage.getItem('illumine_user');

    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (
  user: any
): void => {
  localStorage.setItem(
    'illumine_user',
    JSON.stringify(user)
  );
};

const storeAuthenticatedUser = (data: any): void => {
  if (!data?.user) return;

  setStoredUser({
    ...data.user,
    grade:
      data.profile?.grade ||
      data.user?.grade ||
      '',
    studentId:
      data.profile?.studentId ||
      data.user?.studentId ||
      '',
    profileId:
      data.profile?._id ||
      data.user?.profileId ||
      '',
  });
};

// ============================================================
// GENERIC REQUEST
// ============================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{
  success: boolean;
  data: T;
  message?: string;
}> {
  const token = getToken();

  const headers = new Headers(
    options.headers || {}
  );

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  if (isFormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const json = await response
    .json()
    .catch(() => ({
      success: false,
      message:
        'Invalid response from server',
    }));

  if (response.status === 401) {
    console.error(
      'Authentication failed:',
      json
    );

    throw new Error(
      json.message ||
        'Authentication failed. Please log in again.'
    );
  }

  if (!response.ok || !json.success) {
    console.error(
      `API Error ${response.status}:`,
      json
    );

    const validationDetails =
      Array.isArray(json.errors) && json.errors.length > 0
        ? json.errors
            .map((item: any) =>
              item?.field
                ? `${item.field}: ${item.message}`
                : item?.message
            )
            .filter(Boolean)
            .join(', ')
        : '';

    throw new Error(
      validationDetails ||
        json.message ||
        `Request failed with status ${response.status}`
    );
  }

  return json;
}

// ============================================================
// COURSE MAPPER
// ============================================================

export const mapBackendCourseToFrontend = (
  c: any
): Course => {
  const teacherName =
    typeof c.teacher === 'object' &&
    c.teacher?.user
      ? `${c.teacher.user.firstName || ''} ${
          c.teacher.user.lastName || ''
        }`.trim()
      : 'Illumine Faculty';

  return {
    id:
      c._id ||
      c.id ||
      c.courseCode,

    name:
      c.title ||
      c.name ||
      'English Course',

    grade:
      c.grade ||
      'All Grades',

    teacher:
      teacherName ||
      'Senior English Faculty',

    teacherImage:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',

    teacherBio:
      'Certified English educator with over 8 years of pedagogical experience.',

    duration:
      c.duration ||
      '3 Months',

    schedule:
      'Interactive Weekly Classes',

    classType:
      c.classType ||
      'Online',

    monthlyFee:
      c.fee ||
      c.monthlyFee ||
      15000,

    availableSeats:
      c.availableSeats ??
      c.capacity ??
      30,

    totalSeats:
      c.capacity ||
      30,

    description:
      c.description ||
      'Master English with structured guidance and interactive exercises.',

    image:
      c.image ||
      'https://images.unsplash.com/photo-1588072432836-e10032774350?w=900&h=560&fit=crop&auto=format',

    category:
      c.category ||
      'GENERAL_ENGLISH',

    status:
      c.availableSeats > 0 ||
      c.availableSeats === undefined
        ? 'Open'
        : 'Full',

    whatYouLearn:
      c.syllabus || [
        'Core grammar concepts and syntactic fluency',
        'Advanced vocabulary development and idiom mastery',
        'Interactive conversational drills with live feedback',
        'Structured writing tasks with assessment',
      ],
  };
};

// ============================================================
// BOOK PROMOTION MAPPER
// ============================================================

export const mapBackendBookPromotionToFrontend = (
  p: any
): BookPromotion => {
  const book = p.book || {};
  const originalPrice = Number(p.originalPrice ?? book.price ?? 0);
  const discountedPrice = Number(p.discountedPrice ?? 0);
  const discountAmount = Number(
    p.discountAmount ?? Math.max(originalPrice - discountedPrice, 0)
  );
  const discountPercent = Number(
    p.discountPercent ??
      (originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0)
  );

  return {
    id: p._id || p.id,
    campaignCode: p.campaignCode || '',
    bookId: p.bookId || book._id || book.id || p.book || '',
    bookTitle: p.bookTitle || book.title || 'Book',
    bookCategory: p.bookCategory || book.category || 'General',
    bookDescription: p.bookDescription || book.description || '',
    title: p.title || 'Book Offer',
    description: p.description || '',
    originalPrice,
    discountedPrice,
    discountAmount,
    discountPercent,
    startDate: p.startDate || '',
    closingDate: p.closingDate || '',
    conditions: p.conditions || '',
    isActive: Boolean(p.isActive),
  };
};

// ============================================================
// BOOK MAPPER
// ============================================================

export const mapBackendBookToFrontend = (
  b: any
): Book => ({
  id:
    b._id ||
    b.id ||
    b.bookCode,

  title:
    b.title ||
    'Course Textbook',

  author:
    b.author ||
    'Illumine Editorial Board',

  publisher:
    b.publisher ||
    'Illumine Publishing',

  grade:
    b.grade ||
    'All Levels',

  category:
    b.category ||
    'General',

  description:
    b.description ||
    'Official comprehensive textbook and practice questions.',

  price:
    b.price ??
    2000,

  stock:
    b.stockQuantity ??
    b.stock ??
    10,

  image:
    b.coverImage ||
    b.image ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=700&h=900&fit=crop&auto=format&q=85',

  isbn:
    b.isbn ||
    b.bookCode ||
    '978-0-19-440-1',

  activeOffer:
    b.activeOffer
      ? mapBackendBookPromotionToFrontend(b.activeOffer)
      : null,
});

// ============================================================
// ANNOUNCEMENT MAPPER
// ============================================================

const normalizeAnnouncementCategory = (value?: string | null): string => {
  const normalized = String(value || '').trim().toUpperCase();
  if (['GENERAL', 'CLASS', 'EXAM', 'PAYMENT', 'COURSE', 'HOLIDAY'].includes(normalized)) {
    return normalized;
  }
  return 'GENERAL';
};

export const mapBackendAnnouncementToFrontend = (
  a: any
): Announcement => ({
  id:
    a._id ||
    a.id,

  title:
    a.title ||
    'Institute Announcement',

  description:
    a.content ||
    a.description ||
    '',

  category:
    normalizeAnnouncementCategory(a.category),

  date:
    a.publishDate
      ? formatColomboDisplayDate(a.publishDate)
      : 'Recent',

  priority:
    a.priority === 'HIGH' ||
    a.priority === 'URGENT'
      ? 'High'
      : a.priority === 'LOW'
        ? 'Low'
        : 'Medium',

  targetAudience:
    a.targetAudience === 'ALL'
      ? 'All Students'
      : a.targetAudience === 'STUDENT'
        ? 'Students'
        : a.targetAudience || 'All Students',

  read:
    a.read ??
    true,

  // ----------------------------------------------------------
  // COURSE TARGETING
  // ----------------------------------------------------------

  courseId:
    typeof a.course === 'object'
      ? a.course?._id
      : a.course,

  courseName:
    typeof a.course === 'object'
      ? a.course?.title
      : undefined,

  // ----------------------------------------------------------
  // CLASS TARGETING
  // ----------------------------------------------------------

  classId:
    typeof a.class === 'object'
      ? a.class?._id
      : a.class,

  className:
    typeof a.class === 'object'
      ? a.class?.className
      : undefined,
});

// ============================================================
// SCHEDULE MAPPER
// ============================================================

export const mapBackendScheduleToFrontend = (
  s: any
): ClassSession => {
  const courseTitle =
    s.course?.title ||
    s.class?.className ||
    'English Class';

  const teacherName =
    s.teacher?.user
      ? `${s.teacher.user.firstName || ''} ${
          s.teacher.user.lastName || ''
        }`.trim()
      : 'Course Instructor';

  const dateObj =
    s.date
      ? new Date(s.date)
      : new Date();

  return {
    id:
      s._id ||
      s.id,

    courseId:
      s.course?._id ||
      s.course ||
      '',

    courseName:
      courseTitle,

    teacher:
      teacherName,

    date:
      formatColomboDisplayDate(s.date),

    day:
      s.date
        ? new Intl.DateTimeFormat('en-US', { timeZone: SRI_LANKA_TZ, weekday: 'long' }).format(new Date(s.date))
        : '',

    startTime:
      s.startTime ||
      '09:00 AM',

    endTime:
      s.endTime ||
      '11:00 AM',

    mode:
      s.isOnline
        ? 'Online'
        : 'Physical',

    status:
      'Upcoming',

    platform:
      s.isOnline
        ? 'Google Meet / Zoom'
        : 'Institute Campus',

    joinLink:
      s.onlineLink ||
      s.onlineClassLink ||
      'https://meet.google.com',

    classId:
      s.class?._id ||
      s.class ||
      undefined,

    className:
      s.class?.className ||
      undefined,

    location:
      s.location ||
      undefined,

    description:
      s.description ||
      undefined,
  };
};

// ============================================================
// ORDER MAPPER
// ============================================================

export const mapBackendOrderToFrontend = (o: any): Order => {
  const statusMap: Record<string, Order['status']> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    READY_FOR_COLLECTION: 'Ready for Collection',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return {
    id: o._id || o.id,
    reference:
      o.orderNumber ||
      o.reference ||
      'ORD-2026-0001',

    date: o.createdAt
      ? formatColomboDisplayDate(o.createdAt)
      : 'Today',

    items: (o.items || []).map((item: any) => ({
      book: mapBackendBookToFrontend(item.book || {}),
      quantity: item.quantity || 1,
    })),

    subtotal: o.totalAmount || 0,

    deliveryFee:
      o.deliveryMethod === 'DELIVERY'
        ? 350
        : 0,

    total:
      (o.totalAmount || 0) +
      (o.deliveryMethod === 'DELIVERY' ? 350 : 0),

    deliveryMethod:
      o.deliveryMethod === 'DELIVERY'
        ? 'Home Delivery'
        : 'Institute Collection',

    address: o.deliveryAddress?.street
      ? `${o.deliveryAddress.street}${
          o.deliveryAddress.city
            ? `, ${o.deliveryAddress.city}`
            : ''
        }`
      : 'Main Campus Collection',

    phone:
      o.customer?.phone ||
      o.contactPhone ||
      '',

    status:
      statusMap[o.status] ||
      'Pending',
  };
};

// ============================================================
// PAYMENT MAPPER
// ============================================================

export const mapBackendPaymentToFrontend = (
  p: any
): Payment => {
  const rawStudentId =
    typeof p.student === 'object'
      ? p.student?.studentId || ''
      : '';
  const fallbackStudentId =
    rawStudentId ||
    (typeof p.student === 'string' && p.student
      ? `STU-${p.student.slice(-6).toUpperCase()}`
      : '');
  const installment = p.installment || {};
  const inferredPaymentPlan =
    p.paymentPlan === 'INSTALLMENT' ||
    Number(installment.totalInstallments || 1) > 1 ||
    /installment|instalment/i.test(p.notes || '')
      ? 'INSTALLMENT'
      : 'FULL';
  const installmentCount = Number(installment.totalInstallments || (inferredPaymentPlan === 'INSTALLMENT' ? 3 : 1));
  const installmentNumber = Number(installment.installmentNumber || 1);
  const promotion = p.promotion || {};
  const courseFee = Number(promotion.discountedFee || p.relatedCourse?.fee || 0);
  const serviceFee = Number(installment.serviceFee || (inferredPaymentPlan === 'INSTALLMENT' ? 1500 : 0));
  const repairedTotalPayable =
    inferredPaymentPlan === 'INSTALLMENT'
      ? (
          courseFee > 0
            ? courseFee + serviceFee
            : Number(installment.totalPayable || 0) > Number(p.amount || 0)
              ? Number(installment.totalPayable || 0)
              : Number(p.amount || 0) * installmentCount
        )
      : Number(installment.totalPayable || p.amount || 0);
  const expectedInstallmentAmount =
    inferredPaymentPlan === 'INSTALLMENT' && installmentCount > 1
      ? Math.round(repairedTotalPayable / installmentCount)
      : Number(p.amount || 0);
  const storedPaidAmount = Number(installment.paidAmount || p.amount || 0);
  const repairedPaidAmount =
    inferredPaymentPlan === 'INSTALLMENT' &&
    installmentNumber === 1 &&
    storedPaidAmount > expectedInstallmentAmount
      ? expectedInstallmentAmount
      : storedPaidAmount;
  const repairedRemainingAmount =
    inferredPaymentPlan === 'INSTALLMENT'
      ? Math.max(repairedTotalPayable - repairedPaidAmount, 0)
      : 0;
  const repairedNextDueDate =
    installment.nextDueDate ||
    (inferredPaymentPlan === 'INSTALLMENT'
      ? getNextMonthSameDate(p.paymentDate || p.createdAt || new Date())
      : '');

  return ({
  id:
    p._id ||
    p.id,

  reference:
    p.paymentReference ||
    p.reference ||
    'PAY-2026-0001',

  date:
    p.paymentDate || p.createdAt
      ? formatColomboDisplayDate(p.paymentDate || p.createdAt)
      : 'Today',

  description:
    p.purpose === 'COURSE_FEE'
      ? `${inferredPaymentPlan === 'INSTALLMENT' ? `Installment ${installment.installmentNumber || 1} of ${installment.totalInstallments || 3}` : 'Course Fee Payment'} (${
          p.relatedCourse?.title ||
          'English Course'
        })`
      : p.purpose === 'BOOK_ORDER'
        ? `Book Order Payment (${
            p.relatedOrder?.orderNumber ||
            'Order'
          })`
        : 'Other Payment',

  amount:
    inferredPaymentPlan === 'INSTALLMENT'
      ? repairedPaidAmount
      : p.amount || 0,

  method:
    p.paymentMethod ===
    'BANK_TRANSFER'
      ? 'Bank Transfer'
      : p.paymentMethod ===
          'CARD'
        ? 'Card'
        : p.paymentMethod ===
            'CASH'
          ? 'Cash'
          : 'Online Payment',

  status:
    p.status === 'PAID'
      ? 'Paid'
      : p.status === 'PENDING'
        ? 'Pending'
        : p.status === 'PROCESSING'
          ? 'Processing'
          : p.status === 'REJECTED'
            ? 'Failed'
            : p.status === 'FAILED'
              ? 'Failed'
              : p.status === 'REFUNDED'
                ? 'Refunded'
                : 'Pending',

  relatedTo:
    p.relatedCourse?.title ||
    p.relatedOrder?.orderNumber ||
    'Academic Term 2026',

  paymentEvidence:
    p.paymentEvidence || '',

  relatedOrderId:
    typeof p.relatedOrder === 'object'
      ? p.relatedOrder?._id || p.relatedOrder?.id || ''
      : p.relatedOrder || '',

  transactionId:
    p.transactionId || '',

  studentName:
    p.student?.user
      ? `${p.student.user.firstName || ''} ${p.student.user.lastName || ''}`.trim()
      : p.payer
        ? `${p.payer.firstName || ''} ${p.payer.lastName || ''}`.trim()
        : '',

  studentId:
    fallbackStudentId,

  courseId:
    typeof p.relatedCourse === 'object' ? p.relatedCourse?._id || '' : p.relatedCourse || '',
  paymentPlan:
    inferredPaymentPlan,
  installmentNumber:
    installmentNumber,
  totalInstallments:
    installmentCount,
  totalPayable:
    repairedTotalPayable,
  paidAmount:
    repairedPaidAmount,
  remainingAmount:
    repairedRemainingAmount,
  nextDueDate:
    repairedNextDueDate,
  promotionId:
    promotion.promotion || '',
  promotionTitle:
    promotion.title || '',
  originalFee:
    Number(promotion.originalFee || p.relatedCourse?.fee || 0),
  discountedFee:
    Number(promotion.discountedFee || 0),
  discountAmount:
    Number(promotion.discountAmount || 0),
  discountPercent:
    Number(promotion.discountPercent || 0),
  });
};

// ============================================================
// PROMOTION MAPPER
// ============================================================

export const mapBackendPromotionToFrontend = (
  p: any
): CoursePromotion => {
  const course = p.course || {};
  const originalFee = Number(p.originalFee ?? course.fee ?? 0);
  const discountedFee = Number(p.discountedFee ?? 0);
  const discountAmount = Number(
    p.discountAmount ?? Math.max(originalFee - discountedFee, 0)
  );
  const discountPercent = Number(
    p.discountPercent ??
      (originalFee > 0 ? Math.round((discountAmount / originalFee) * 100) : 0)
  );

  return {
    id: p._id || p.id,
    campaignCode: p.campaignCode || '',
    courseId: p.courseId || course._id || course.id || p.course || '',
    courseName: p.courseName || course.title || 'English Course',
    courseGrade: p.courseGrade || course.grade || 'All Grades',
    courseDescription:
      p.courseDescription || course.description || '',
    title: p.title || 'Early Bird Course Offer',
    description: p.description || '',
    originalFee,
    discountedFee,
    discountAmount,
    discountPercent,
    startDate: p.startDate || '',
    closingDate: p.closingDate || '',
    conditions: p.conditions || '',
    isActive: Boolean(p.isActive),
  };
};

// ============================================================
// AUTH API
// ============================================================

export const authAPI = {
  login: async (
    email: string,
    password: string
  ) => {
    const res =
      await request<any>(
        '/auth/login',
        {
          method: 'POST',

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    if (res.data?.token) {
      setToken(
        res.data.token
      );

      storeAuthenticatedUser(res.data);
    }

    return res.data;
  },

  register: async (
    userData: any
  ) => {
    const res =
      await request<any>(
        '/auth/register',
        {
          method: 'POST',

          body: JSON.stringify(
            userData
          ),
        }
      );

    if (res.data?.token) {
      setToken(
        res.data.token
      );

      storeAuthenticatedUser(res.data);
    }

    return res.data;
  },

  getMe: async () => {
    const res =
      await request<any>(
        '/auth/me'
      );

    storeAuthenticatedUser(res.data);

    return res.data;
  },

  updateProfile: async (profile: { firstName: string; lastName: string; email: string; phone?: string }) => {
    const res = await request<any>(
      '/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profile),
      }
    );

    if (res.data?.user) {
      setStoredUser({
        ...getStoredUser(),
        ...res.data.user,
      });
    }

    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await request<any>(
      '/auth/change-password',
      {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    return res;
  },

  requestPasswordReset: async (email: string) => {
    return request<any>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  resetPassword: async (token: string, newPassword: string) => {
    return request<any>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      }
    );
  },

  logout: () => {
    removeToken();
  },
};

// ============================================================
// COURSES API
// ============================================================

export const coursesAPI = {
  getAll: async (
    query = ''
  ) => {
    const res =
      await request<any[]>(
        `/courses${
          query
            ? `?search=${encodeURIComponent(query)}`
            : ''
        }`
      );

    return (
      res.data || []
    ).map(
      mapBackendCourseToFrontend
    );
  },

  getById: async (
    id: string
  ) => {
    const res =
      await request<any>(
        `/courses/${id}`
      );

    return mapBackendCourseToFrontend(
      res.data
    );
  },

  create: async (
    data: any
  ) =>
    request<any>(
      '/courses',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: any
  ) =>
    request<any>(
      `/courses/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: async (
    id: string
  ) =>
    request<any>(
      `/courses/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// BOOKS API
// ============================================================

export const booksAPI = {
  getAll: async (
    query = ''
  ) => {
    const params = new URLSearchParams({
      limit: '100',
    });

    if (query) {
      params.set(
        'search',
        query
      );
    }

    const res =
      await request<any[]>(
        `/books?${params.toString()}`
      );

    return (
      res.data || []
    ).map(
      mapBackendBookToFrontend
    );
  },

  getById: async (
    id: string
  ) => {
    const res =
      await request<any>(
        `/books/${id}`
      );

    return mapBackendBookToFrontend(
      res.data
    );
  },

  create: async (
    data: any
  ) => {
    const res = await request<any>(
      '/books',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return mapBackendBookToFrontend(res.data);
  },

  update: async (
    id: string,
    data: any
  ) => {
    const res = await request<any>(
      `/books/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    return mapBackendBookToFrontend(res.data);
  },

  delete: async (
    id: string
  ) =>
    request<any>(
      `/books/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// STUDENTS API
// ============================================================

export const studentsAPI = {
  getAll: async (
    query = ''
  ) => {
    const res =
      await request<any[]>(
        `/students${
          query
            ? `?search=${encodeURIComponent(query)}`
            : ''
        }`
      );

    return res.data || [];
  },

  getById: async (
    id: string
  ) => {
    const res =
      await request<any>(
        `/students/${id}`
      );

    return res.data;
  },

  create: async (
    data: any
  ) =>
    request<any>(
      '/students',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: any
  ) => {
    const isFormData =
      typeof FormData !== 'undefined' &&
      data instanceof FormData;

    return request<any>(
      `/students/${id}`,
      {
        method: 'PUT',
        body: isFormData ? data : JSON.stringify(data),
      }
    );
  },

  delete: async (
    id: string
  ) =>
    request<any>(
      `/students/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// TEACHERS API
// ============================================================

export const teachersAPI = {
  getAll: async () => {
    const res =
      await request<any[]>(
        '/teachers'
      );

    return res.data || [];
  },

  getMy: async () => {
    const res =
      await request<any>(
        '/teachers/me/profile'
      );

    return res.data;
  },

  getMyStudents: async () => {
    const res =
      await request<any[]>(
        '/teachers/me/students'
      );

    return res.data || [];
  },

  getById: async (
    id: string
  ) => {
    const res =
      await request<any>(
        `/teachers/${id}`
      );

    return res.data;
  },

  create: async (
    data: any
  ) =>
    request<any>(
      '/teachers',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: any
  ) =>
    request<any>(
      `/teachers/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: async (
    id: string
  ) =>
    request<any>(
      `/teachers/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// CLASSES API
// ============================================================

export const classesAPI = {
  getAll: async () => {
    const res =
      await request<any[]>(
        '/classes?limit=100'
      );

    return res.data || [];
  },

  getById: async (
    id: string
  ) => {
    const res =
      await request<any>(
        `/classes/${id}`
      );

    return res.data;
  },

  create: async (
    data: any
  ) =>
    request<any>(
      '/classes',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: any
  ) =>
    request<any>(
      `/classes/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: async (
    id: string
  ) =>
    request<any>(
      `/classes/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// ENROLLMENTS API
// ============================================================

export const enrollmentsAPI = {
  create: async (data: {
    courseId: string;
    classId?: string;
    parentPhone?: string;
  }) =>
    request<any>(
      '/enrollments',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getMy: async () => {
    const res =
      await request<any[]>(
        '/enrollments/my'
      );

    return res.data || [];
  },

  getAll: async () => {
    const res =
      await request<any[]>(
        '/enrollments'
      );

    return res.data || [];
  },

  updateStatus: async (
    id: string,
    status: string
  ) =>
    request<any>(
      `/enrollments/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
        }),
      }
    ),
};

// ============================================================
// SCHEDULES API
// ============================================================

export const schedulesAPI = {
  getMy: async () => {
    const res =
      await request<any[]>(
        '/schedules'
      );

    return (
      res.data || []
    ).map(
      mapBackendScheduleToFrontend
    );
  },

  getAll: async () => {
    const res =
      await request<any[]>(
        '/schedules'
      );

    return (
      res.data || []
    ).map(
      mapBackendScheduleToFrontend
    );
  },

  create: async (
    data: any
  ) =>
    request<any>(
      '/schedules',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: any
  ) =>
    request<any>(
      `/schedules/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: async (
    id: string
  ) =>
    request<any>(
      `/schedules/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// ANNOUNCEMENTS API
// ============================================================

export const announcementsAPI = {
  getAll: async () => {
    const res =
      await request<any[]>(
        '/announcements'
      );

    return (
      res.data || []
    ).map(
      mapBackendAnnouncementToFrontend
    );
  },

  create: async (data: {
    title: string;
    content: string;
    course?: string;
    class?: string;
    targetAudience?: string;
    priority?: string;
    isPublished?: boolean;
    publishDate?: string;
    expiryDate?: string;
    category?: string;
  }) =>
    request<any>(
      '/announcements',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: async (
    id: string,
    data: {
      title?: string;
      content?: string;
      course?: string;
      class?: string;
      targetAudience?: string;
      priority?: string;
      isPublished?: boolean;
      publishDate?: string;
      expiryDate?: string;
      category?: string;
    }
  ) =>
    request<any>(
      `/announcements/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: async (
    id: string
  ) =>
    request<any>(
      `/announcements/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// ============================================================
// REVIEWS API
// ============================================================

export const reviewsAPI = {
  getByCourse: async (
    courseId: string
  ) => {
    const res =
      await request<any[]>(
        `/reviews/course/${courseId}`
      );

    return res.data || [];
  },

  create: async (
    courseId: string,
    data: {
      rating: number;
      comment: string;
    }
  ) =>
    request<any>(
      `/reviews/course/${courseId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  reply: async (
    reviewId: string,
    reply: string
  ) =>
    request<any>(
      `/reviews/${reviewId}/reply`,
      {
        method: 'POST',
        body: JSON.stringify({
          reply,
        }),
      }
    ),
};

// ============================================================
// ORDERS API
// ============================================================

export const ordersAPI = {
  create: async (
    orderData: any
  ) =>
    request<any>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(
          orderData
        ),
      }
    ),

  getMy: async () => {
    const res =
      await request<any[]>(
        '/orders/my'
      );

    return (
      res.data || []
    ).map(
      mapBackendOrderToFrontend
    );
  },

  getAll: async () => {
    const res =
      await request<any[]>(
        '/orders'
      );

    return (
      res.data || []
    ).map(
      mapBackendOrderToFrontend
    );
  },

  updateStatus: async (
    id: string,
    status: string
  ) =>
    request<any>(
      `/orders/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
        }),
      }
    ),
};

// ============================================================
// PAYMENTS API
// ============================================================

export const paymentsAPI = {
  create: async (
    paymentData:
      | FormData
      | Record<string, any>
  ) => {
    const token = getToken();

    if (!token) {
      throw new Error(
        'No login token found. Please log in again.'
      );
    }

    const isFormData =
      paymentData instanceof FormData;

    const headers = new Headers();

    headers.set(
      'Authorization',
      `Bearer ${token}`
    );

    if (!isFormData) {
      headers.set(
        'Content-Type',
        'application/json'
      );
    }

    const response =
      await fetch(
        `${API_BASE}/payments`,
        {
          method: 'POST',
          headers,
          body:
            isFormData
              ? paymentData
              : JSON.stringify(
                  paymentData
                ),
        }
      );

    const json =
      await response
        .json()
        .catch(() => ({
          success: false,
          message:
            'Failed to parse payment response',
        }));

    if (response.status === 401) {
      throw new Error(
        json.message ||
          'Authentication failed. Please log in again.'
      );
    }

    if (!response.ok || !json.success) {
      throw new Error(
        json.message ||
          `Payment failed with status ${response.status}`
      );
    }

    return mapBackendPaymentToFrontend(json.data);
  },

  getMy: async () => {
    const res =
      await request<any[]>(
        '/payments/my'
      );

    return (
      res.data || []
    ).map(
      mapBackendPaymentToFrontend
    );
  },

  getAll: async () => {
    const res =
      await request<any[]>(
        '/payments'
      );

    return (
      res.data || []
    ).map(
      mapBackendPaymentToFrontend
    );
  },

  updateStatus: async (
    id: string,
    status: string,
    notes = ''
  ) =>
    request<any>(
      `/payments/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          notes,
        }),
      }
    ),

  approve: async (
    id: string
  ) =>
    request<any>(
      `/payments/${id}/approve`,
      {
        method: 'POST',
      }
    ),

  getEvidence: async (
    id: string,
    fallbackPath = ''
  ): Promise<Blob> => {
    const token = getToken();

    if (!token) {
      throw new Error(
        'No login token found. Please log in again.'
      );
    }

    const response = await fetch(
      `${API_BASE}/payments/${id}/evidence`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      return response.blob();
    }

    const json = await response
      .json()
      .catch(() => ({
        message:
          'Unable to open uploaded payment proof.',
      }));

    if (fallbackPath) {
      const fallbackUrl =
        fallbackPath.startsWith('http')
          ? fallbackPath
          : fallbackPath.startsWith('/')
            ? fallbackPath
            : `/${fallbackPath}`;

      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        return fallbackResponse.blob();
      }

      throw new Error(
        fallbackResponse.status === 404
          ? 'The uploaded payment proof file is missing from the server. Ask the student to re-upload the receipt.'
          : json.message || 'Unable to open uploaded payment proof.'
      );
    }

    throw new Error(
      json.message ||
        'Unable to open uploaded payment proof.'
    );
  },
};

// ============================================================
// COURSE PROMOTIONS API
// ============================================================

export const promotionsAPI = {
  getAll: async () => {
    const res = await request<any[]>('/promotions/');
    return (res.data || []).map(mapBackendPromotionToFrontend);
  },

  create: async (data: any) => {
    const res = await request<any>('/promotions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapBackendPromotionToFrontend(res.data);
  },

  update: async (id: string, data: any) => {
    const res = await request<any>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapBackendPromotionToFrontend(res.data);
  },

  setStatus: async (id: string, isActive: boolean) => {
    const res = await request<any>(`/promotions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return mapBackendPromotionToFrontend(res.data);
  },

  getStudentActive: async () => {
    const res = await request<any | null>('/promotions/student/active');
    return res.data ? mapBackendPromotionToFrontend(res.data) : null;
  },

  dismiss: async (id: string) =>
    request<any>(`/promotions/${id}/dismiss`, {
      method: 'POST',
    }),
};

export const bookPromotionsAPI = {
  getAll: async () => {
    const res = await request<any[]>('/promotions/books');
    return (res.data || []).map(mapBackendBookPromotionToFrontend);
  },

  getActive: async () => {
    const res = await request<any[]>('/promotions/books/active');
    return (res.data || []).map(mapBackendBookPromotionToFrontend);
  },

  create: async (data: any) => {
    const res = await request<any>('/promotions/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapBackendBookPromotionToFrontend(res.data);
  },

  update: async (id: string, data: any) => {
    const res = await request<any>(`/promotions/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapBackendBookPromotionToFrontend(res.data);
  },

  setStatus: async (id: string, isActive: boolean) => {
    const res = await request<any>(`/promotions/books/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return mapBackendBookPromotionToFrontend(res.data);
  },
};

// ============================================================
// ASSESSMENT API
// ============================================================

const mapAssessmentQuestion = (question: any): AssessmentQuestion => ({
  id: question._id || question.id,
  _id: question._id || question.id,
  questionText: question.questionText || '',
  readingPassage: question.readingPassage || '',
  gradeMin: Number(question.gradeMin || 1),
  gradeMax: Number(question.gradeMax || 11),
  goals: question.goals || [],
  topic: question.topic || 'GRAMMAR',
  difficulty: question.difficulty || 'MEDIUM',
  options: (question.options || []).map((option: any) => typeof option === 'string' ? option : option.text || ''),
  correctOptionIndex: question.correctOptionIndex,
  explanation: question.explanation || '',
  status: question.status || 'DRAFT',
  version: question.version || 1,
  createdBy: question.createdBy,
  createdAt: question.createdAt,
  updatedAt: question.updatedAt,
});

const mapAssessmentAttempt = (attempt: any): AssessmentAttempt => ({
  id: attempt._id || attempt.id,
  _id: attempt._id || attempt.id,
  submissionKey: attempt.submissionKey,
  confirmedGrade: Number(attempt.confirmedGrade || 1),
  learningGoal: attempt.learningGoal || 'SCHOOL_ENGLISH',
  totalQuestions: Number(attempt.totalQuestions || 0),
  correctCount: Number(attempt.correctCount || 0),
  percentage: Number(attempt.percentage || 0),
  categoryKey: attempt.categoryKey || '',
  categoryLabel: attempt.categoryLabel || '',
  feedback: attempt.feedback || '',
  completedAt: attempt.completedAt || attempt.createdAt || '',
  student: attempt.student,
  note: attempt.note,
  questions: attempt.questions || [],
  recommendations: attempt.recommendations || [],
});

export const assessmentsAPI = {
  startQuiz: async (grade: number, goal: string) => {
    const res = await request<any>(`/assessments/quiz/start?grade=${grade}&goal=${encodeURIComponent(goal)}`);
    return res.data;
  },

  submitQuiz: async (data: any) => {
    const res = await request<any>('/assessments/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapAssessmentAttempt(res.data);
  },

  getHistory: async () => {
    const res = await request<any[]>('/assessments/history');
    return (res.data || []).map(mapAssessmentAttempt);
  },

  getQuestions: async () => {
    const res = await request<any[]>('/assessments/questions');
    return (res.data || []).map(mapAssessmentQuestion);
  },

  saveQuestion: async (data: any, id?: string) => {
    const res = await request<any>(id ? `/assessments/questions/${id}` : '/assessments/questions', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
    return mapAssessmentQuestion(res.data);
  },

  archiveQuestion: async (id: string) => {
    const res = await request<any>(`/assessments/questions/${id}/archive`, { method: 'PATCH' });
    return mapAssessmentQuestion(res.data);
  },

  getCategories: async () => {
    const res = await request<any[]>('/assessments/categories');
    return (res.data || []) as AssessmentCategory[];
  },

  saveCategories: async (categories: AssessmentCategory[]) => {
    const res = await request<any[]>('/assessments/categories', {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
    return (res.data || []) as AssessmentCategory[];
  },

  getRecommendations: async () => {
    const res = await request<any[]>('/assessments/recommendations');
    return (res.data || []) as AssessmentRecommendation[];
  },

  saveRecommendation: async (data: any, id?: string) => {
    const res = await request<any[]>(id ? `/assessments/recommendations/${id}` : '/assessments/recommendations', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
    return (res.data || []) as AssessmentRecommendation[];
  },

  deleteRecommendation: async (id: string) =>
    request<any>(`/assessments/recommendations/${id}`, { method: 'DELETE' }),

  getResults: async (filters: { grade?: string; category?: string; from?: string; to?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const res = await request<any[]>(`/assessments/results${params.toString() ? `?${params.toString()}` : ''}`);
    return (res.data || []).map(mapAssessmentAttempt);
  },
};

// ============================================================
// REPORTS API
// ============================================================

export const reportsAPI = {
  getSummary: async () =>
    request<any>(
      '/reports/summary'
    ),
};

// ============================================================
// DASHBOARD API
// ============================================================

export const dashboardAPI = {
  getStudentDashboard:
    async () =>
      request<any>(
        '/dashboard/student'
      ),

  getAdminDashboard:
    async () =>
      request<any>(
        '/dashboard/admin'
      ),
};

// ============================================================
// RECEIPTS API
// ============================================================

export const receiptsAPI = {
  getByPaymentId: async (paymentId: string) =>
    request<any>(`/receipts/payment/${paymentId}`),

  getById: async (id: string) =>
    request<any>(`/receipts/${id}`),

  getAll: async () =>
    request<any>('/receipts'),
};

export const courseResourcesAPI = {
  getTeacher: async () => {
    const response = await request<any[]>('/course-resources/teacher');
    return response.data || [];
  },

  getForCourse: async (courseId: string) => {
    const response = await request<any[]>(`/course-resources/course/${courseId}`);
    return response.data || [];
  },

  upload: async (courseId: string, title: string, file: File) => {
    const formData = new FormData();
    formData.append('course', courseId);
    formData.append('title', title);
    formData.append('file', file);
    return request<any>('/course-resources', { method: 'POST', body: formData });
  },

  uploadRecording: async (courseId: string, classId: string, title: string, file?: File | null, recordingUrl?: string) => {
    const buildRecordingFormData = () => {
      const formData = new FormData();
      formData.append('course', courseId);
      if (classId) formData.append('class', classId);
      formData.append('title', title);
      if (file) formData.append('file', file);
      if (recordingUrl) formData.append('recordingUrl', recordingUrl);
      return formData;
    };

    if (!file && recordingUrl) {
      return request<any>('/course-resources/recording-links', {
        method: 'POST',
        body: JSON.stringify({
          course: courseId,
          class: classId || '',
          title,
          recordingUrl,
        }),
      });
    }

    return request<any>('/course-resources/recordings', { method: 'POST', body: buildRecordingFormData() });
  },

  update: async (resourceId: string, title: string, file?: File) => {
    const formData = new FormData();
    formData.append('title', title);
    if (file) formData.append('file', file);
    return request<any>(`/course-resources/${resourceId}`, { method: 'PUT', body: formData });
  },

  delete: async (resourceId: string) =>
    request<any>(`/course-resources/${resourceId}`, { method: 'DELETE' }),

  download: async (resourceId: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/course-resources/${resourceId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Course file could not be downloaded.');
    }
    return response.blob();
  },
};

// ============================================================
// NOTIFICATIONS API
// ============================================================

export const notificationsAPI = {
  getUnread: async () => request<any>('/notifications/unread'),

  markAsRead: async (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: async () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),
};
