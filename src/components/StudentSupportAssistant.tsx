import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { View } from '../types';

// Student Support Assistant component for the student portal, providing AI-based guidance and quick prompts
type Message = {
  id: number;
  role: 'assistant' | 'student';
  text: string;
  action?: {
    label: string;
    view: View;
  };
};

type QuickPrompt = {
  label: string;
  prompt: string;
};

interface Props {
  currentView: View;
  navigate: (view: View) => void;
  displayName?: string;
  cartCount?: number;
  hasEnrolledCourses?: boolean;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };
  const strokeProps = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'spark':
      return <svg {...common}><path {...strokeProps} d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" /><path {...strokeProps} d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></svg>;
    case 'send':
      return <svg {...common}><path {...strokeProps} d="m22 2-7 20-4-9-9-4 20-7Z" /><path {...strokeProps} d="M22 2 11 13" /></svg>;
    case 'close':
      return <svg {...common}><path {...strokeProps} d="M18 6 6 18M6 6l12 12" /></svg>;
    case 'message':
      return <svg {...common}><path {...strokeProps} d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5.2A8 8 0 1 1 21 12Z" /></svg>;
    case 'arrow':
      return <svg {...common}><path {...strokeProps} d="M5 12h14" /><path {...strokeProps} d="m13 6 6 6-6 6" /></svg>;
    default:
      return null;
  }
}
// Robot mascot component for the assistant button
function RobotMascot() {
  return (
    <span className="assistant-robot" aria-hidden="true">
      <span className="assistant-robot-antenna" />
      <span className="assistant-robot-head">
        <span className="assistant-robot-ear assistant-robot-ear-left" />
        <span className="assistant-robot-ear assistant-robot-ear-right" />
        <span className="assistant-robot-face">
          <span className="assistant-robot-eye" />
          <span className="assistant-robot-eye" />
          <span className="assistant-robot-smile" />
        </span>
      </span>
      <span className="assistant-robot-body">
        <span className="assistant-robot-panel" />
        <span className="assistant-robot-arm assistant-robot-arm-left" />
        <span className="assistant-robot-arm assistant-robot-arm-right" />
        <span className="assistant-robot-leg assistant-robot-leg-left" />
        <span className="assistant-robot-leg assistant-robot-leg-right" />
      </span>
    </span>
  );
}

function includesAny(text: string, words: string[]) {
  return words.some(word => text.includes(word));
}
//reply generator for the student support assistant, based on the message content, enrollment status, and cart count
function getReply(
  message: string,
  hasEnrolledCourses: boolean,
  cartCount: number
): Omit<Message, 'id' | 'role'> {
  const text = message.toLowerCase();

  if (includesAny(text, ['register', 'registration', 'sign up', 'signup', 'create account', 'new account', 'student account'])) {
    return {
      text: 'To register, open Create Account, enter your personal details, choose your grade, set a password, then continue to guardian details. After registration you can log in and request course enrollment.',
      action: { label: 'Open Registration', view: 'register' },
    };
  }

  if (includesAny(text, ['login', 'log in', 'sign in', 'forgot', 'reset password', 'password reset', 'cannot access'])) {
    return {
      text: 'Use Login to enter your student portal. If you forgot your password, open Forgot Password and follow the reset steps using your registered email.',
      action: { label: text.includes('forgot') || text.includes('reset') ? 'Reset Password' : 'Open Login', view: text.includes('forgot') || text.includes('reset') ? 'forgot-password' : 'login' },
    };
  }

  if (includesAny(text, ['join', 'schedule', 'class link', 'live', 'online class', 'meeting', 'zoom', 'google meet'])) {
    return {
      text: hasEnrolledCourses
        ? 'Open your Class Schedule. Each course has its own link area, and locked links will show until your enrollment is approved.'
        : 'You need an approved enrollment before class links unlock. Start with Courses, then check My Enrollments after submitting your request.',
      action: { label: hasEnrolledCourses ? 'Open Schedule' : 'Browse Courses', view: hasEnrolledCourses ? 'student-schedule' : 'student-courses' },
    };
  }

  if (includesAny(text, ['note', 'notes', 'pdf', 'resource', 'resources', 'material', 'materials', 'recording', 'recordings', 'download', 'lesson file'])) {
    return {
      text: hasEnrolledCourses
        ? 'Course notes, PDFs, and class recordings are inside My Enrollments. Open the course card, then use the materials area to download teacher-shared files.'
        : 'Course materials unlock after your enrollment and payment are approved. Browse courses first, then check My Enrollments after approval.',
      action: { label: hasEnrolledCourses ? 'Open My Enrollments' : 'Browse Courses', view: hasEnrolledCourses ? 'student-my-courses' : 'student-courses' },
    };
  }

  if (includesAny(text, ['course', 'enroll', 'enrollment', 'subject', 'teacher', 'grade', 'fee', 'monthly fee', 'seat', 'available'])) {
    return {
      text: 'Go to Courses to compare grade, teacher, fee, seats, schedule, and course details. After you submit enrollment, My Enrollments will show whether it is pending or approved.',
      action: { label: 'View Courses', view: 'student-courses' },
    };
  }

  if (includesAny(text, ['book', 'books', 'cart', 'order', 'delivery', 'stock', 'study book', 'workbook'])) {
    return {
      text: cartCount > 0
        ? `You have ${cartCount} item${cartCount === 1 ? '' : 's'} in your cart. You can continue browsing books or open the cart to place the order.`
        : 'Open Books to find study materials by grade or category. Use Details to preview a book, then Add to Cart when you are ready.',
      action: { label: cartCount > 0 ? 'Open Cart' : 'Browse Books', view: cartCount > 0 ? 'student-cart' : 'student-books' },
    };
  }

  if (includesAny(text, ['payment', 'pay', 'paid', 'fee', 'receipt', 'invoice', 'bank', 'card', 'cash', 'evidence', 'slip', 'pending payment'])) {
    return {
      text: 'Payments and receipts are kept in Payment History. If a payment is pending, check whether it belongs to a course or book order, then follow the payment instructions shown on that page.',
      action: { label: 'Payment History', view: 'student-payment-history' },
    };
  }

  if (includesAny(text, ['announcement', 'announcements', 'notice', 'notices', 'update', 'updates', 'notification', 'notifications'])) {
    return {
      text: hasEnrolledCourses
        ? 'Announcements show institute and course updates. Check them regularly before class days.'
        : 'Announcements become more useful after you enroll in a course. For now, browse courses and complete your enrollment first.',
      action: { label: hasEnrolledCourses ? 'Open Announcements' : 'Browse Courses', view: hasEnrolledCourses ? 'student-announcements' : 'student-courses' },
    };
  }

  if (includesAny(text, ['dashboard', 'home', 'overview', 'progress', 'quick action', 'where am i'])) {
    return {
      text: 'Dashboard is your portal home. It summarizes next class, learning path, orders, payments, announcements, and quick actions.',
      action: { label: 'Open Dashboard', view: 'student-dashboard' },
    };
  }

  if (includesAny(text, ['profile', 'password', 'phone', 'email', 'name', 'personal detail', 'guardian', 'parent'])) {
    return {
      text: 'Open My Profile to review your student details. Keep your phone number, email, and guardian details correct so the institute can contact you.',
      action: { label: 'Open Profile', view: 'student-profile' },
    };
  }

  if (includesAny(text, ['problem', 'issue', 'error', 'not working', 'bug', 'stuck', 'help', 'support', 'contact', 'office'])) {
    return {
      text: 'First refresh the page and check the related portal section. For approvals, payment verification, missing notes, or personal account issues, contact the institute office with your name, course, and screenshot.',
      action: { label: 'Go Dashboard', view: 'student-dashboard' },
    };
  }

  if (includesAny(text, ['what can you do', 'topics', 'everything', 'guide me', 'website', 'webpage', 'how to use'])) {
    return {
      text: 'I can guide you through registration, login, course enrollment, class links, course notes, recordings, books, cart, orders, payments, receipts, announcements, profile updates, and support issues.',
      action: { label: 'Open Dashboard', view: 'student-dashboard' },
    };
  }

  return {
    text: 'I can help with the full student website: registration, login, courses, enrollment, class links, notes, recordings, books, cart, payments, receipts, announcements, profile, and support. Ask in simple words like "course notes", "register account", or "payment receipt".',
    action: { label: 'Open Dashboard', view: 'student-dashboard' },
  };
}

export default function StudentSupportAssistant({
  currentView,
  navigate,
  displayName = 'Student',
  cartCount = 0,
  hasEnrolledCourses = false,




}:
Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [position, setPosition] = useState({ right: 20, bottom: 20 });
  const [dragging, setDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suppressToggleRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
    startRight: 20,
    startBottom: 20,
  });

  //defaul messages for the assistant, including a greeting and instructions for the student 
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: `Hi ${displayName.split(' ')[0] || 'there'}, I am your AI Student Support assistant. Ask me about registration, courses, class links, notes, books, payments, receipts, announcements, or profile help.`,
    },
  ]);

  const quickPrompts = useMemo<QuickPrompt[]>(() => {
    if (currentView === 'student-books' || currentView === 'student-cart') {
      return [
        { label: 'Book help', prompt: 'How do I order a book?' },
        { label: 'Cart', prompt: 'Check my cart' },
        { label: 'Receipts', prompt: 'Where are my payment receipts?' },
      ];
    }
    if (currentView === 'student-schedule') {
      return [
        { label: 'Join class', prompt: 'How do I join my class?' },
        { label: 'Locked link', prompt: 'Why is my class link locked?' },
        { label: 'Notes', prompt: 'Where are my course notes?' },
      ];
    }
    if (currentView === 'student-my-courses' || currentView === 'student-course-detail') {
      return [
        { label: 'Notes', prompt: 'Where are my course notes?' },
        { label: 'Recordings', prompt: 'How do I download recordings?' },
        { label: 'Schedule', prompt: 'Show my class schedule' },
      ];
    }
    return [
      { label: 'Register', prompt: 'How do I register a student account?' },
      { label: 'Join class', prompt: 'How do I join my class?' },
      { label: 'Notes', prompt: 'Where are my course notes?' },
      { label: 'Payments', prompt: 'Where are my receipts?' },
    ];
  }, [currentView]);

  const clampPosition = (nextPosition: { right: number; bottom: number }) => {
    if (typeof window === 'undefined') return nextPosition;

    const margin = 12;
    const rect = wrapperRef.current?.getBoundingClientRect();
    const width = rect?.width || 330;
    const height = rect?.height || 86;
    const maxRight = Math.max(margin, window.innerWidth - width - margin);
    const maxBottom = Math.max(margin, window.innerHeight - height - margin);

    return {
      right: Math.min(Math.max(nextPosition.right, margin), maxRight),
      bottom: Math.min(Math.max(nextPosition.bottom, margin), maxBottom),
    };
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('illumine-support-assistant-position');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Number.isFinite(parsed.right) && Number.isFinite(parsed.bottom)) {
        window.requestAnimationFrame(() => setPosition(clampPosition(parsed)));
      }
    } catch {
      window.localStorage.removeItem('illumine-support-assistant-position');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('illumine-support-assistant-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const handleResize = () => setPosition(current => clampPosition(current));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => setPosition(current => clampPosition(current)));
  }, [open]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('[data-no-drag="true"]')) return;

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRight: position.right,
      startBottom: position.bottom,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.moved = true;

    setPosition(clampPosition({
      right: drag.startRight - deltaX,
      bottom: drag.startBottom - deltaY,
    }));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (drag.moved) {
      suppressToggleRef.current = true;
      window.setTimeout(() => {
        suppressToggleRef.current = false;
      }, 0);
    }

    drag.active = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const dragHandleProps = {
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: stopDrag,
    onPointerCancel: stopDrag,
  };

  const sendMessage = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || thinking) return;

    const studentMessage: Message = {
      id: Date.now(),
      role: 'student',
      text: trimmed,
    };

    setMessages(current => [...current, studentMessage]);
    setInput('');
    setThinking(true);

    window.setTimeout(() => {
      const reply = getReply(trimmed, hasEnrolledCourses, cartCount);
      setMessages(current => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          ...reply,
        },
      ]);
      setThinking(false);
    }, 420);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div
      ref={wrapperRef}
      className={`fixed z-50 ${dragging ? 'select-none' : ''}`}
      style={{ right: position.right, bottom: position.bottom }}
    >
      {open && (
        <section className="mb-4 w-[calc(100vw-2.5rem)] max-w-[25rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
          <div
            className={`relative touch-none overflow-hidden bg-[#10243a] px-5 py-4 text-white ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            title="Drag to move assistant"
            {...dragHandleProps}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,107,184,0.85),transparent_42%),linear-gradient(135deg,#10243a,#17466f)]" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 text-white ring-1 ring-white/15">
                  <Icon name="spark" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">AI Student Support</h2>
                  <p className="text-xs font-semibold text-blue-100">Student portal assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-no-drag="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
                aria-label="Close AI Student Support"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              {['Register', 'Courses', 'Notes', 'Payments', 'Books', 'Profile'].map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => sendMessage(topic)}
                  className="rounded-xl border border-white/12 bg-white/10 px-2 py-2 text-center text-[11px] font-extrabold text-blue-50 hover:bg-white/18"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'student'
                    ? 'rounded-br-lg bg-[#1E6BB8] text-white'
                    : 'rounded-bl-lg border border-slate-200 bg-white text-slate-700'
                }`}>
                  <p className="leading-6">{message.text}</p>
                  {message.action && message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(message.action!.view);
                        setOpen(false);
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-[#1E6BB8] hover:bg-blue-100"
                    >
                      {message.action.label} <Icon name="arrow" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#1E6BB8]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#1E6BB8] [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#1E6BB8] [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => sendMessage(prompt.prompt)}
                  className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-blue-50 hover:text-[#1E6BB8]"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask for help..."
                className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1E6BB8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20 hover:bg-[#155a9c] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                aria-label="Send message"
              >
                <Icon name="send" className="h-5 w-5" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={(event) => {
          if (suppressToggleRef.current) {
            event.preventDefault();
            return;
          }
          setOpen(current => !current);
        }}
        className={`assistant-launcher group touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        aria-label="Open AI Student Support"
        title="Drag to move assistant"
        {...dragHandleProps}
      >
        <span className="assistant-launcher-status" />
        <span className="assistant-launcher-text">
          AI Student Support Assistant
        </span>
        <RobotMascot />
      </button>
    </div>
  );
}
