import { FormEvent, useEffect, useRef, useState } from 'react';
import Logo from '../components/Logo';
import { Button, Badge, Card } from '../components/ui';
import { courses as fallbackCourses, books } from '../data';
import { Course, View } from '../types';
import ThemeToggle from '../components/ThemeToggle';

interface Props {
  navigate: (view: View) => void;
  courses?: Course[];
}

const features = [
  { icon: '🏆', title: 'Experienced Teachers', desc: 'Learn from qualified, certified English educators with years of proven results.' },
  { icon: '💡', title: 'Interactive Learning', desc: 'Engaging lessons with quizzes, activities, and hands-on exercises.' },
  { icon: '🎥', title: 'Online Classes', desc: 'Join live online sessions from anywhere via Google Meet or Zoom.' },
  { icon: '📚', title: 'Learning Resources', desc: 'Access course books, workbooks, and study materials in one place.' },
  { icon: '⚙️', title: 'Easy Course Management', desc: 'Enroll, track, and manage all your courses from your student portal.' },
  { icon: '🤝', title: 'Student Support', desc: 'Get announcements, reminders, and support from institute staff.' },
];

const steps = [
  { num: '01', title: 'Create Account', desc: 'Register with your details in minutes.' },
  { num: '02', title: 'Choose Course', desc: 'Browse and find the perfect English course.' },
  { num: '03', title: 'Enroll', desc: 'Confirm enrollment with one click.' },
  { num: '04', title: 'Join Classes', desc: 'Access your schedule and join live classes.' },
  { num: '05', title: 'Learn & Grow', desc: 'Build confidence and master English.' },
];

const heroSlides = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=2200&h=1400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=2200&h=1400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=2200&h=1400&fit=crop&auto=format',
];

const heroStats = [
  { value: 'Grade 1-11', label: 'structured English pathways' },
  { value: '100% Online', label: 'live classes from anywhere' },
  { value: 'Live Portal', label: 'courses, books and payments' },
];

const instituteAddress = '100 Borella Cross Rd, Colombo 00800';
const encodedInstituteAddress = encodeURIComponent(instituteAddress);
const instituteMapEmbedUrl = `https://www.google.com/maps?q=${encodedInstituteAddress}&output=embed`;
const instituteMapDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedInstituteAddress}`;

const contactCards = [
  {
    icon: 'location',
    label: 'Institute Location',
    value: instituteAddress,
    helper: 'Online and institute-based English learning support',
    tone: 'rose',
  },
  {
    icon: 'phone',
    label: 'Phone',
    value: '076 919 7449',
    helper: 'Call us during office hours',
    tone: 'blue',
  },
  {
    icon: 'whatsapp',
    label: 'WhatsApp Support',
    value: '076 919 7449',
    helper: 'Fastest way to ask about courses and enrollment',
    tone: 'green',
    href: 'https://wa.me/94769197449',
  },
  {
    icon: 'clock',
    label: 'Office Hours',
    value: 'Mon-Sat, 8:00 AM-6:00 PM',
    helper: 'Sri Lanka time',
    tone: 'amber',
  },
];

function ContactIcon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'location':
      return <svg {...common}><path {...stroke} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><path {...stroke} d="M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>;
    case 'phone':
      return <svg {...common}><path {...stroke} d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.9 10.6a16 16 0 0 0 4.5 4.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z" /></svg>;
    case 'whatsapp':
      return <svg {...common}><path {...stroke} d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.4-4.9A8.4 8.4 0 1 1 20.5 11.8Z" /><path {...stroke} d="M9.2 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3 0 .5-.1.6l-.5.6c.7 1.2 1.6 2.1 2.9 2.8l.6-.8c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.4.4.7v.4c0 .4-.2.7-.6.9-.7.4-1.8.3-3.2-.3-2.7-1.1-4.7-3.1-5.8-5.8-.5-1.4-.6-2.5-.1-3.1Z" /></svg>;
    case 'clock':
      return <svg {...common}><path {...stroke} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path {...stroke} d="M12 6v6l4 2" /></svg>;
    case 'send':
      return <svg {...common}><path {...stroke} d="m22 2-7 20-4-9-9-4 20-7Z" /><path {...stroke} d="M22 2 11 13" /></svg>;
    default:
      return null;
  }
}

export default function LandingPage({ navigate, courses = fallbackCourses }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);
  const featuredCourses = courses.slice(0, 6);
  const featuredBooks = books.slice(0, 3);
  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const subject = encodeURIComponent(`Illumine website inquiry from ${name || 'visitor'}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:info@illumine.lk?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    const elements = pageRef.current?.querySelectorAll('.scroll-reveal');
    if (!elements?.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHeroHovered) return;

    const slideTimer = window.setInterval(() => {
      setActiveHeroSlide(current => (current + 1) % heroSlides.length);
    }, 2600);

    return () => window.clearInterval(slideTimer);
  }, [isHeroHovered]);

  return (
    <div ref={pageRef} className="landing-scroll min-h-full bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/92 px-6 py-4 shadow-[0_10px_35px_rgba(15,23,42,0.045)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <Logo size="sm" className="landing-brand-premium" />

          <div className="hidden md:flex items-center gap-9">
            <a href="#courses" className="landing-nav-link">Courses</a>
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#books" className="landing-nav-link">Books</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('login')}
              className="rounded-full px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('register')}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.22)] hover:bg-[#1E6BB8] hover:shadow-[0_16px_34px_rgba(30,107,184,0.28)]"
            >
              Start Learning
            </Button>
          </div>

          <button className="md:hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm" onClick={() => setMobileMenuOpen(o => !o)}>☰</button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-slate-100 mt-3 flex flex-col gap-2">
            <div className="flex justify-end px-3"><ThemeToggle /></div>
            {['Courses', 'About', 'Books', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>{l}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate('login')} fullWidth>Login</Button>
              <Button size="sm" onClick={() => navigate('register')} fullWidth>Register</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section
        className="landing-snap-section landing-hero-stage relative flex min-h-[calc(100svh-72px)] items-center overflow-hidden bg-slate-950"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => {
          setIsHeroHovered(false);
          setActiveHeroSlide(0);
        }}
      >
        {heroSlides.map((image, index) => (
          <img
            key={image}
            src={image}
            alt={index === 0 ? 'Student joining an online English class on a laptop' : ''}
            aria-hidden={index === 0 ? undefined : true}
            className={`landing-hero-slide absolute inset-0 h-full w-full object-cover ${index === activeHeroSlide ? 'landing-hero-slide-active' : ''}`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,38,0.92)_0%,rgba(15,35,61,0.76)_45%,rgba(15,35,61,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/55 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16">
          <div className="fade-in-up max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur-md">
              Illumine English Institute, Sri Lanka
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              English classes that feel clear, confident, and connected.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Join structured English courses with live classes, teacher-shared notes, recordings, books, payments, and schedules in one modern student portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('student-courses')}>Explore Courses</Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('register')}
                className="border-white/70 bg-white/10 text-white hover:bg-white/20"
              >
                Create Account
              </Button>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 border-t border-white/20 pt-6 sm:grid-cols-3">
              {heroStats.map(item => (
                <div key={item.value}>
                  <p className="font-display text-xl font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-sm leading-5 text-blue-100/85">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="landing-snap-section overflow-hidden bg-[#F6F9FC] px-6 py-24">
        <div className="max-w-7xl mx-auto scroll-reveal">
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge color="blue" className="mb-4">Our Courses</Badge>
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-950 lg:text-5xl">
                Choose your next English breakthrough.
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-500">
                Explore carefully structured programmes for school students, exam preparation, confident speaking, grammar, and early learners.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[1.75rem] border border-white bg-white/80 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              {[
                ['6+', 'programmes'],
                ['Live', 'classes'],
                ['1-11', 'grades'],
              ].map(([value, label]) => (
                <div key={label} className="min-w-24 rounded-2xl bg-slate-50 px-4 py-3 text-center">
                  <p className="font-display text-xl font-extrabold text-[#1E6BB8]">{value}</p>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
              <Card
                key={course.id}
                className="group overflow-hidden rounded-[1.75rem] border-white bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]"
                onClick={() => navigate('student-courses')}
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img src={course.image} alt={course.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.05)_38%,rgba(15,23,42,0.76)_100%)]" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <Badge color={course.status === 'Open' ? 'green' : course.status === 'Full' ? 'red' : 'slate'} className="border border-white/45 bg-white/90 backdrop-blur-xl">
                      {course.status}
                    </Badge>
                    <Badge color={course.classType === 'Physical' ? 'amber' : 'blue'} className="border border-white/45 bg-white/90 backdrop-blur-xl">
                      {course.classType}
                    </Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-100/90">{course.category}</p>
                      <h3 className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight text-white">{course.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('student-courses')}
                      className="relative z-10 shrink-0 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#1E6BB8] shadow-[0_14px_30px_rgba(15,23,42,0.22)] hover:bg-blue-50"
                    >
                      Read More
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <img src={course.teacherImage} alt={course.teacher} className="h-10 w-10 rounded-2xl object-cover ring-4 ring-blue-50" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-800">{course.teacher}</p>
                      <p className="text-xs font-semibold text-slate-400">{course.grade}</p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-500">{course.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="font-display text-2xl font-extrabold text-[#1E6BB8]">Rs. {course.monthlyFee.toLocaleString()}<span className="text-sm font-semibold text-slate-400">/mo</span></span>
                    <Button size="sm" onClick={() => navigate('student-courses')} className="rounded-full px-4">Enroll Now</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" variant="outline" onClick={() => navigate('student-courses')}>View All Courses →</Button>
          </div>
        </div>
      </section>

      {/* Why Illumine */}
      <section id="about" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto scroll-reveal">
          <div className="text-center mb-12">
            <Badge color="amber" className="mb-3">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold text-slate-900 font-display">Why Choose Illumine?</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">We combine experienced teaching with modern technology to deliver the best English learning experience in Sri Lanka.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="p-6 hover:shadow-md group">
                <div className="w-12 h-12 rounded-2xl bg-[#1E6BB8]/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-bold text-slate-800 font-display mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#1E6BB8]">
        <div className="max-w-7xl mx-auto scroll-reveal">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white font-display">How It Works</h2>
            <p className="text-blue-200 mt-2">Start your English learning journey in 5 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold text-xl font-display mx-auto mb-4">{step.num}</div>
                <h3 className="font-bold text-white font-display mb-1">{step.title}</h3>
                <p className="text-sm text-blue-200">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px border-t-2 border-dashed border-white/30 -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate('register')} className="!bg-white !text-[#0F3B66] hover:!bg-blue-50">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Books */}
      <section id="books" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto scroll-reveal">
          <div className="text-center mb-12">
            <Badge color="amber" className="mb-3">Learning Materials</Badge>
            <h2 className="text-3xl font-bold text-slate-900 font-display">Books & Study Materials</h2>
            <p className="text-slate-500 mt-2">Official Illumine publications crafted by our teachers to support your learning.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBooks.map(book => (
              <Card key={book.id} className="overflow-hidden group hover:shadow-md cursor-pointer" onClick={() => navigate('student-books')}>
                <div className="h-52 overflow-hidden bg-slate-100">
                  <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <Badge color="blue">{book.category}</Badge>
                  <h3 className="font-bold text-slate-800 font-display mt-2">{book.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">by {book.author}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-[#C2660A] font-display">Rs. {book.price.toLocaleString()}</span>
                    <Button size="sm" onClick={() => navigate('student-books')}>Order Now</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" variant="outline" onClick={() => navigate('student-books')}>Browse All Books →</Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="landing-snap-section bg-[#F8F4EF]">
        <div className="bg-slate-950 px-6 py-20">
          <div className="mx-auto max-w-7xl scroll-reveal">
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#D42B2B]">Get in touch</p>
            <h2 className="mt-6 font-display text-5xl font-bold leading-none text-white lg:text-6xl">Contact Us</h2>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-300">
              Questions about courses, enrollment, books, payments, or schedules? Send us a message and the Illumine team will guide you.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5 scroll-reveal">
            {contactCards.map(item => {
              const toneClass = item.tone === 'green'
                ? 'bg-green-50 text-green-700'
                : item.tone === 'blue'
                  ? 'bg-blue-50 text-[#1E6BB8]'
                  : item.tone === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700';

              const cardContent = (
                <>
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${toneClass}`}>
                    <ContactIcon name={item.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-xl font-extrabold leading-snug text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">{item.helper}</p>
                  </div>
                </>
              );

              const cardClass = 'flex gap-5 rounded-[1.25rem] border border-[#E8DDD2] bg-white p-6 shadow-[0_18px_50px_rgba(47,31,20,0.05)]';

              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open WhatsApp chat with Illumine English Institute at ${item.value}`}
                  className={`${cardClass} transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-[0_22px_60px_rgba(22,163,74,0.12)] focus:outline-none focus:ring-4 focus:ring-green-500/15`}
                >
                  {cardContent}
                </a>
              ) : (
                <div key={item.label} className={cardClass}>
                  {cardContent}
                </div>
              );
            })}

            <div className="overflow-hidden rounded-[1.25rem] border border-[#E8DDD2] bg-white shadow-[0_18px_50px_rgba(47,31,20,0.05)]">
              <div className="flex flex-col gap-3 border-b border-[#E8DDD2] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Find us on map</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-950">{instituteAddress}</p>
                </div>
                <a
                  href={instituteMapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-[#1E6BB8] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Open Map
                </a>
              </div>
              <iframe
                title="Illumine English Institute location map"
                src={instituteMapEmbedUrl}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <div className="scroll-reveal rounded-[1.25rem] border border-[#E8DDD2] bg-white p-7 shadow-[0_24px_70px_rgba(47,31,20,0.07)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#D42B2B]">Send a message</p>
            <h3 className="mt-5 font-display text-4xl font-bold leading-tight text-slate-950">We'd love to hear from you</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              Fill in the form below and we will get back to you as soon as possible.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleContactSubmit}>
              <label className="block">
                <span className="text-sm font-extrabold text-slate-800">Your Name <span className="text-[#D42B2B]">*</span></span>
                <input name="name" required className="mt-2 h-14 w-full rounded-none border border-[#CFC3B8] bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5" />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-slate-800">Email Address <span className="text-[#D42B2B]">*</span></span>
                <input name="email" type="email" required className="mt-2 h-14 w-full rounded-none border border-[#CFC3B8] bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5" />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-slate-800">Message <span className="text-[#D42B2B]">*</span></span>
                <textarea name="message" required rows={5} className="mt-2 w-full resize-none rounded-none border border-[#CFC3B8] bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5" />
              </label>
              <button type="submit" className="inline-flex h-14 w-full items-center justify-center gap-3 bg-slate-950 px-6 text-sm font-extrabold text-white transition hover:bg-[#1E6BB8]">
                <ContactIcon name="send" className="h-4 w-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0F172A] to-[#1E3A5F]">
        <div className="max-w-3xl mx-auto text-center scroll-reveal">
          <h2 className="text-3xl lg:text-4xl font-bold text-white font-display mb-4">Ready to Start Your English Journey?</h2>
          <p className="text-slate-300 mb-8">Build your English skills with confidence at Illumine English Institute.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('register')} className="bg-[#1E6BB8] hover:bg-[#155a9c]">Create Free Account</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('login')} className="border-white/40 text-white hover:bg-white/10">Login to Portal</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo size="sm" className="mb-4" />
            <p className="text-sm text-slate-400 leading-relaxed">Sri Lanka's trusted English learning platform. Empowering students from Grade 1 to 11.</p>
            <div className="flex gap-3 mt-4">
              {['f', 'in', 'tw', 'yt'].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-xs cursor-pointer hover:bg-white/20">{s}</div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              {[
                ['Home', '#'],
                ['About Us', '#about'],
                ['Courses', '#courses'],
                ['Books', '#books'],
                ['Contact', '#contact'],
              ].map(([label, href]) => (
                <li key={label}><a href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Courses</h4>
            <ul className="space-y-2">
              {['Grade 1–5 English', 'Grade 6–9 English', 'Grade 10–11 English', 'Grammar Galaxy', 'Brave Voice', 'Tini Voice'].map(l => (
                <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📍 100 Borella Cross Rd, Colombo 00800</li>
              <li>📞 076 919 7449</li>
              <li>✉️ info@illumine.lk</li>
              <li>⏰ Mon–Sat: 8:00 AM – 6:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2026 Illumine Worldwide Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
