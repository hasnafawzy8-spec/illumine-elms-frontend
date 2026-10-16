// ============================================================
// COURSE
// ============================================================

export interface Course {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  teacherImage?: string;
  teacherBio?: string;
  duration: string;
  schedule?: string;
  classType?: string;
  monthlyFee: number;
  availableSeats: number;
  totalSeats: number;
  description: string;
  image?: string;
  category: string;
  status: string;
  whatYouLearn?: string[];
  courseCode?: string;
}

export interface CoursePromotion {
  id: string;
  campaignCode: string;
  courseId: string;
  courseName: string;
  courseGrade: string;
  courseDescription?: string;
  title: string;
  description: string;
  originalFee: number;
  discountedFee: number;
  discountAmount: number;
  discountPercent: number;
  startDate: string;
  closingDate: string;
  conditions: string;
  isActive: boolean;
}

export interface BookPromotion {
  id: string;
  campaignCode: string;
  bookId: string;
  bookTitle: string;
  bookCategory: string;
  bookDescription?: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercent: number;
  startDate: string;
  closingDate: string;
  conditions: string;
  isActive: boolean;
}

export type AssessmentGoal = 'SCHOOL_ENGLISH' | 'GRAMMAR' | 'SPEAKING' | 'WRITING';
export type AssessmentTopic = 'GRAMMAR' | 'VOCABULARY' | 'READING';
export type AssessmentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AssessmentQuestionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AssessmentQuestion {
  id: string;
  _id?: string;
  questionText: string;
  readingPassage?: string;
  gradeMin: number;
  gradeMax: number;
  goals: AssessmentGoal[];
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
  status?: AssessmentQuestionStatus;
  version?: number;
  source?: 'MANUAL' | 'SYSTEM';
  generatedKey?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentQuizQuestion {
  id: string;
  questionText: string;
  readingPassage?: string;
  gradeMin: number;
  gradeMax: number;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  options: { index: number; text: string }[];
}

export interface AssessmentCategory {
  id?: string;
  _id?: string;
  key: string;
  label: string;
  minPercent: number;
  maxPercent: number;
  feedback: string;
}

export interface AssessmentRecommendation {
  mappingId?: string;
  id?: string;
  courseId: string;
  courseName: string;
  description?: string;
  benefits?: string;
  gradeRange?: string;
  fee?: number;
  alreadyEnrolled?: boolean;
  gradeMin?: number;
  gradeMax?: number;
  goal?: AssessmentGoal;
  categoryKey?: string;
  isActive?: boolean;
}

export interface AssessmentAttempt {
  id: string;
  _id?: string;
  submissionKey?: string;
  confirmedGrade: number;
  learningGoal: AssessmentGoal;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  categoryKey: string;
  categoryLabel: string;
  feedback: string;
  completedAt: string;
  student?: any;
  note?: string;
  questions?: Array<{
    questionId: string;
    version: number;
    questionText: string;
    readingPassage?: string;
    topic: AssessmentTopic;
    difficulty: AssessmentDifficulty;
    options: { text: string }[];
    selectedOptionIndex: number;
    correctOptionIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
  recommendations?: AssessmentRecommendation[];
}

// ============================================================
// BOOK
// ============================================================

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  grade: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  isbn?: string;
  bookCode?: string;
  activeOffer?: BookPromotion | null;
}

// ============================================================
// CLASS SESSION / SCHEDULE
// ============================================================

export interface ClassSession {
  id: string;

  courseId: string;
  courseName: string;

  teacher: string;

  date: string;
  day: string;

  startTime: string;
  endTime: string;

  mode: 'Online' | 'Physical' | string;

  status:
    | 'Upcoming'
    | 'Ongoing'
    | 'Completed'
    | 'Cancelled'
    | string;

  platform?: string;
  joinLink?: string;

  classId?: string;
  className?: string;
  location?: string;
  description?: string;
}

// ============================================================
// ANNOUNCEMENT
// ============================================================

export interface Announcement {
  id: string;

  title: string;

  description: string;

  category: string;

  date: string;

  priority:
    | 'Low'
    | 'Medium'
    | 'High'
    | string;

  targetAudience: string;

  read: boolean;

  // ----------------------------------------------------------
  // COURSE / CLASS TARGETING
  // ----------------------------------------------------------

  courseId?: string;

  courseName?: string;

  classId?: string;

  className?: string;
}

// ============================================================
// ORDER
// ============================================================

export interface OrderItem {
  book: Book;
  quantity: number;
}

export interface Order {
  id: string;

  reference: string;

  date: string;

  items: OrderItem[];

  subtotal: number;

  deliveryFee: number;

  total: number;

  deliveryMethod:
    | 'Home Delivery'
    | 'Institute Collection'
    | string;

  address: string;

  phone: string;

  status:
    | 'Pending'
    | 'Confirmed'
    | 'Delivered'
    | 'Cancelled'
    | string;
}

// ============================================================
// PAYMENT
// ============================================================

export interface Payment {
  id: string;

  reference: string;

  date: string;

  description: string;

  amount: number;

  method:
    | 'Bank Transfer'
    | 'Card'
    | 'Cash'
    | 'Online Payment'
    | string;

  status:
    | 'Paid'
    | 'Pending'
    | 'Processing'
    | 'Failed'
    | 'Refunded'
    | string;

  relatedTo: string;

  paymentEvidence?: string;
  relatedOrderId?: string;
  transactionId?: string;
  studentName?: string;
  studentId?: string;
  courseId?: string;
  receipt?: string;
  paymentPlan?: 'FULL' | 'INSTALLMENT' | string;
  installmentNumber?: number;
  totalInstallments?: number;
  totalPayable?: number;
  paidAmount?: number;
  remainingAmount?: number;
  nextDueDate?: string;
  promotionId?: string;
  promotionTitle?: string;
  originalFee?: number;
  discountedFee?: number;
  discountAmount?: number;
  discountPercent?: number;
}

// ============================================================
// USER
// ============================================================

export interface User {
  id?: string;
  _id?: string;

  firstName: string;
  lastName: string;

  email: string;
  phone?: string;

  role:
    | 'STUDENT'
    | 'TEACHER'
    | 'ADMIN'
    | string;

  profileImage?: string;

  isActive?: boolean;
}

// ============================================================
// TEACHER
// ============================================================

export interface Teacher {
  id?: string;
  _id?: string;

  user?: User;

  teacherId: string;

  qualification?: string;

  assignedCourses?: Course[];

  assignedClasses?: ClassItem[];

  isActive?: boolean;
}

// ============================================================
// CLASS
// ============================================================

export interface ClassItem {
  id?: string;
  _id?: string;

  className?: string;

  name?: string;

  course?: Course | string;

  teacher?: Teacher | string;

  students?: string[];

  description?: string;

  schedule?: string;

  startTime?: string;

  endTime?: string;

  date?: string;

  day?: string;

  isOnline?: boolean;

  onlineClassLink?: string;

  onlineLink?: string;

  status?: string;
}

// ============================================================
// ENROLLMENT
// ============================================================

export interface Enrollment {
  id?: string;
  _id?: string;

  student?: any;

  course?: Course | string;

  class?: ClassItem | string;

  status?:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | string;

  approvalStatus?: string;

  paymentStatus?:
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REJECTED'
    | string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface StudentDashboard {
  enrollments?: Enrollment[];

  upcomingClasses?: ClassSession[];

  announcements?: Announcement[];

  payments?: Payment[];

  courses?: Course[];
}

export interface AdminDashboard {
  students?: number;
  teachers?: number;
  courses?: number;
  classes?: number;
  enrollments?: number;
  payments?: number;

  [key: string]: any;
}

// ============================================================
// NAVIGATION / VIEW
// ============================================================

export type View =
  | string;

export interface AppState {
  currentView: View;
  selectedCourseId: string | null;
  selectedBookId: string | null;
  cart: CartItem[];
  enrolledCourseIds: string[];
  studentEnrollments: Enrollment[];
  orders: Order[];
  payments: Payment[];
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  userRole: 'guest' | 'student' | 'teacher' | 'admin';
  lastOrder: Order | null;
  lastPaymentRef: string | null;
  lastPaymentMethod: 'CARD' | 'BANK_TRANSFER';
  lastEnrollmentPayment: Payment | null;
}

// ============================================================
// COMMON API RESPONSE
// ============================================================

export interface ReceiptData {
  _id: string;
  receiptNumber: string;
  payment: any;
  student?: any;
  amount: number;
  issuedDate: string;
  paymentMethod: string;
  transactionId?: string;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;

  message?: string;

  data: T;

  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
