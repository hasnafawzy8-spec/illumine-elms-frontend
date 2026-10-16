import { useEffect, useMemo, useState } from 'react';
import { assessmentsAPI } from '../../services/api';
import { AssessmentAttempt, AssessmentGoal, AssessmentQuizQuestion, Course, View } from '../../types';
import { Badge, Button, Card, Select } from '../../components/ui';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  onSelectCourse: (id: string) => void;
  enrolledCourseIds: string[];
  courses: Course[];
  user?: { grade?: string } | null;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const goals: { value: AssessmentGoal; label: string }[] = [
  { value: 'SCHOOL_ENGLISH', label: 'School English' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'WRITING', label: 'Writing' },
];

const topicLabels: Record<string, string> = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  READING: 'Reading',
};

const createSubmissionKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const extractGrade = (grade?: string | null) => {
  const match = String(grade || '').match(/\d+/);
  return match ? Math.min(11, Math.max(1, Number(match[0]))) : 6;
};

export default function StudentAssessment({ navigate, onSelectCourse, enrolledCourseIds, courses, user, showToast }: Props) {
  const [grade, setGrade] = useState(String(extractGrade(user?.grade)));
  const [goal, setGoal] = useState<AssessmentGoal>('SCHOOL_ENGLISH');
  const [loading, setLoading] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [history, setHistory] = useState<AssessmentAttempt[]>([]);
  const [submissionKey, setSubmissionKey] = useState(createSubmissionKey());

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistory(await assessmentsAPI.getHistory());
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, []);

  const startQuiz = async () => {
    setLoading(true);
    setUnavailableMessage('');
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setSubmissionKey(createSubmissionKey());
    try {
      const quiz = await assessmentsAPI.startQuiz(Number(grade), goal);
      if (!quiz.available) {
        setQuestions([]);
        setUnavailableMessage(quiz.message || 'Assessment questions are not ready for this grade yet.');
        return;
      }
      setQuestions(quiz.questions || []);
    } catch (error: any) {
      showToast(error?.message || 'Unable to load the assessment quiz.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (answeredCount !== questions.length) {
      showToast('Please answer every question before submitting.', 'error');
      return;
    }

    setLoading(true);
    try {
      const submitted = await assessmentsAPI.submitQuiz({
        submissionKey,
        grade: Number(grade),
        goal,
        answers: questions.map(question => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id],
        })),
      });
      setResult(submitted);
      setHistory(current => [submitted, ...current.filter(item => item.id !== submitted.id)]);
      setQuestions([]);
      showToast('Assessment completed successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to submit assessment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewCourse = (courseId: string, enroll = false) => {
    onSelectCourse(courseId);
    navigate(enroll ? 'student-enrollment' : 'student-course-detail');
  };

  const recommendedCourseIds = useMemo(
    () => new Set((result?.recommendations || []).map(item => String(item.courseId))),
    [result]
  );

  return (
    <div className="fade-in-up space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Initial Learning Assessment</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-950">Check My English Level</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              This optional quiz checks grammar, vocabulary and reading. It is not an official proficiency certification and does not measure speaking ability.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('student-courses')}>Browse Courses</Button>
        </div>
      </section>

      {!questions.length && !result && (
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Select
              label="Confirm school grade"
              value={grade}
              onChange={setGrade}
              options={Array.from({ length: 11 }, (_, index) => ({ value: String(index + 1), label: `Grade ${index + 1}` }))}
            />
            <Select
              label="Learning goal"
              value={goal}
              onChange={(value) => setGoal(value as AssessmentGoal)}
              options={goals}
            />
            <Button onClick={startQuiz} disabled={loading}>{loading ? 'Loading...' : 'Start Assessment'}</Button>
          </div>
          {unavailableMessage && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {unavailableMessage}
            </div>
          )}
        </Card>
      )}

      {questions.length > 0 && currentQuestion && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge color="blue">{topicLabels[currentQuestion.topic] || currentQuestion.topic}</Badge>
                <h2 className="mt-3 font-display text-xl font-extrabold text-slate-950">
                  Question {currentIndex + 1} of {questions.length}
                </h2>
              </div>
              <div className="min-w-[180px]">
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[#1E6BB8]" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-bold text-slate-400">{answeredCount}/{questions.length} answered</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {currentQuestion.readingPassage && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {currentQuestion.readingPassage}
              </div>
            )}
            <p className="text-lg font-bold leading-8 text-slate-900">{currentQuestion.questionText}</p>
            <div className="grid gap-3">
              {currentQuestion.options.map(option => {
                const selected = answers[currentQuestion.id] === option.index;
                return (
                  <button
                    key={option.index}
                    type="button"
                    onClick={() => setAnswers(current => ({ ...current, [currentQuestion.id]: option.index }))}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                      selected
                        ? 'border-[#1E6BB8] bg-blue-50 text-slate-950 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                      {String.fromCharCode(65 + option.index)}
                    </span>
                    {option.text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 p-5">
            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex(index => Math.max(0, index - 1))}>Previous</Button>
            {currentIndex === questions.length - 1 ? (
              <Button onClick={submitQuiz} disabled={loading}>{loading ? 'Submitting...' : 'Submit Assessment'}</Button>
            ) : (
              <Button onClick={() => setCurrentIndex(index => Math.min(questions.length - 1, index + 1))}>Next</Button>
            )}
          </div>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-3xl bg-slate-950 p-6 text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-100">Your score</p>
                <p className="mt-3 font-display text-5xl font-extrabold">{result.percentage}%</p>
                <p className="mt-2 text-sm font-semibold text-slate-300">{result.correctCount} of {result.totalQuestions} correct</p>
              </div>
              <div>
                <Badge color="green">{result.categoryLabel}</Badge>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">Initial Learning Assessment</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{result.feedback}</p>
                <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
                  {result.note || 'This quiz checks grammar, vocabulary and reading, not speaking ability or official proficiency.'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Recommended courses</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Optional next steps</h2>
              </div>
              <Button variant="outline" onClick={() => navigate('student-courses')}>Browse All</Button>
            </div>
            {result.recommendations?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {result.recommendations.map(recommendation => (
                  <div key={recommendation.mappingId || recommendation.courseId} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-extrabold text-slate-950">{recommendation.courseName}</h3>
                      {recommendation.alreadyEnrolled && <Badge color="green">Already Enrolled</Badge>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{recommendation.benefits || recommendation.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{recommendation.gradeRange}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">Rs. {Number(recommendation.fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewCourse(String(recommendation.courseId))}>View Course</Button>
                      <Button size="sm" disabled={recommendation.alreadyEnrolled || enrolledCourseIds.includes(String(recommendation.courseId))} onClick={() => viewCourse(String(recommendation.courseId), true)}>
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-800">No configured recommendation yet</p>
                <p className="mt-1 text-sm text-slate-500">You can still browse all active courses and choose what feels right.</p>
                <Button className="mt-4" onClick={() => navigate('student-courses')}>Browse Courses</Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold text-slate-950">Answer Review</h2>
            <div className="mt-4 space-y-3">
              {result.questions?.map((question, index) => (
                <div key={`${question.questionId}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color={question.isCorrect ? 'green' : 'red'}>{question.isCorrect ? 'Correct' : 'Review'}</Badge>
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{topicLabels[question.topic]}</span>
                  </div>
                  <p className="mt-3 font-bold text-slate-900">{index + 1}. {question.questionText}</p>
                  <p className="mt-2 text-sm text-slate-500">Your answer: {question.options[question.selectedOptionIndex]?.text || 'Not answered'}</p>
                  <p className="text-sm text-slate-500">Correct answer: {question.options[question.correctOptionIndex]?.text || ''}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{question.explanation}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => { setResult(null); setQuestions([]); setAnswers({}); }}>Retake Assessment</Button>
            <Button variant="outline" onClick={() => navigate('student-dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      )}

      {history.length > 0 && !questions.length && (
        <Card className="p-5">
          <h2 className="font-display text-xl font-extrabold text-slate-950">Assessment History</h2>
          <div className="mt-4 grid gap-3">
            {history.slice(0, 5).map(attempt => (
              <button
                key={attempt.id}
                type="button"
                onClick={() => setResult(attempt)}
                className={`rounded-2xl border p-4 text-left transition hover:bg-slate-50 ${recommendedCourseIds.size && result?.id === attempt.id ? 'border-[#1E6BB8]' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">Grade {attempt.confirmedGrade} · {goals.find(item => item.value === attempt.learningGoal)?.label}</p>
                    <p className="text-sm text-slate-500">{formatColomboDisplayDate(attempt.completedAt)}</p>
                  </div>
                  <Badge color="blue">{attempt.percentage}% · {attempt.categoryLabel}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
