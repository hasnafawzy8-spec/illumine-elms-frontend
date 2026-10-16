import { useEffect, useState } from 'react';
import { assessmentsAPI } from '../../services/api';
import { AssessmentAttempt, AssessmentGoal, AssessmentQuestion, View } from '../../types';
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { formatColomboDisplayDate } from '../../utils/dateFormatter';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const emptyQuestion = {
  questionText: '',
  readingPassage: '',
  gradeMin: '1',
  gradeMax: '11',
  goals: ['SCHOOL_ENGLISH'] as AssessmentGoal[],
  topic: 'GRAMMAR',
  difficulty: 'MEDIUM',
  options: ['', '', '', ''],
  correctOptionIndex: '0',
  explanation: '',
  status: 'DRAFT',
};

const goalOptions = [
  { value: 'SCHOOL_ENGLISH', label: 'School English' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'WRITING', label: 'Writing' },
];

export default function TeacherAssessmentQuestions({ showToast }: Props) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [results, setResults] = useState<AssessmentAttempt[]>([]);
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionList, resultList] = await Promise.all([
        assessmentsAPI.getQuestions(),
        assessmentsAPI.getResults(),
      ]);
      setQuestions(questionList);
      setResults(resultList);
    } catch (error: any) {
      showToast(error?.message || 'Unable to load assessment questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validate = () => {
    const options = form.options.map(option => option.trim());
    if (form.questionText.trim().length < 10) return 'Enter a meaningful question.';
    if (Number(form.gradeMax) < Number(form.gradeMin)) return 'Grade max must be after grade min.';
    if (options.some(option => !option)) return 'All four answer options are required.';
    if (new Set(options.map(option => option.toLowerCase())).size !== 4) return 'Answer options must be different.';
    if (!form.explanation.trim()) return 'Add a teacher explanation.';
    if (form.topic === 'READING' && !form.readingPassage.trim()) return 'Reading questions need a passage.';
    return '';
  };

  const saveQuestion = async () => {
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      const saved = await assessmentsAPI.saveQuestion({
        ...form,
        gradeMin: Number(form.gradeMin),
        gradeMax: Number(form.gradeMax),
        correctOptionIndex: Number(form.correctOptionIndex),
      }, editingId || undefined);
      setQuestions(current => current.some(item => item.id === saved.id) ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current]);
      setForm(emptyQuestion);
      setEditingId(null);
      showToast('Assessment question saved.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to save question.', 'error');
    }
  };

  const editQuestion = (question: AssessmentQuestion) => {
    setEditingId(question.id);
    setForm({
      questionText: question.questionText,
      readingPassage: question.readingPassage || '',
      gradeMin: String(question.gradeMin),
      gradeMax: String(question.gradeMax),
      goals: question.goals.length ? question.goals : ['SCHOOL_ENGLISH'],
      topic: question.topic,
      difficulty: question.difficulty,
      options: [...question.options],
      correctOptionIndex: String(question.correctOptionIndex || 0),
      explanation: question.explanation || '',
      status: question.status || 'DRAFT',
    });
  };

  const archiveQuestion = async (question: AssessmentQuestion) => {
    if (!window.confirm('Archive this assessment question?')) return;
    try {
      const updated = await assessmentsAPI.archiveQuestion(question.id);
      setQuestions(current => current.map(item => item.id === updated.id ? updated : item));
      showToast('Question archived.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to archive question.', 'error');
    }
  };

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader title="Assessment Questions" subtitle="Create grade-aware English level questions for your students" />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Question" value={form.questionText} onChange={questionText => setForm(current => ({ ...current, questionText }))} placeholder="Write the question students will answer" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Grade min" type="number" min="1" max="11" value={form.gradeMin} onChange={gradeMin => setForm(current => ({ ...current, gradeMin }))} required />
            <Input label="Grade max" type="number" min="1" max="11" value={form.gradeMax} onChange={gradeMax => setForm(current => ({ ...current, gradeMax }))} required />
          </div>
          <Select label="Topic" value={form.topic} onChange={topic => setForm(current => ({ ...current, topic }))} options={[
            { value: 'GRAMMAR', label: 'Grammar' },
            { value: 'VOCABULARY', label: 'Vocabulary' },
            { value: 'READING', label: 'Reading' },
          ]} />
          <Select label="Difficulty" value={form.difficulty} onChange={difficulty => setForm(current => ({ ...current, difficulty }))} options={[
            { value: 'EASY', label: 'Easy' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HARD', label: 'Hard' },
          ]} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Learning goals</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map(goal => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setForm(current => ({
                  ...current,
                  goals: current.goals.includes(goal.value as AssessmentGoal)
                    ? current.goals.filter(item => item !== goal.value)
                    : [...current.goals, goal.value as AssessmentGoal],
                }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${form.goals.includes(goal.value as AssessmentGoal) ? 'border-[#1E6BB8] bg-blue-50 text-[#1E6BB8]' : 'border-slate-200 text-slate-500'}`}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        {form.topic === 'READING' && (
          <Textarea className="mt-4" label="Reading passage" value={form.readingPassage} onChange={readingPassage => setForm(current => ({ ...current, readingPassage }))} rows={4} required />
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {form.options.map((option, index) => (
            <Input
              key={index}
              label={`Option ${String.fromCharCode(65 + index)}`}
              value={option}
              onChange={value => setForm(current => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? value : item) }))}
              required
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Select label="Correct answer" value={form.correctOptionIndex} onChange={correctOptionIndex => setForm(current => ({ ...current, correctOptionIndex }))} options={form.options.map((_, index) => ({ value: String(index), label: `Option ${String.fromCharCode(65 + index)}` }))} />
          <Select label="Status" value={form.status} onChange={status => setForm(current => ({ ...current, status }))} options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
          ]} />
        </div>
        <Textarea className="mt-4" label="Explanation" value={form.explanation} onChange={explanation => setForm(current => ({ ...current, explanation }))} rows={3} required />

        <div className="mt-5 flex justify-end gap-3">
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyQuestion); }}>Cancel Edit</Button>}
          <Button onClick={saveQuestion}>{editingId ? 'Save Changes' : 'Create Question'}</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-xl font-extrabold text-slate-950">My Questions</h2>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-slate-400">Loading...</p> : questions.map(question => (
            <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge color={question.status === 'PUBLISHED' ? 'green' : question.status === 'ARCHIVED' ? 'slate' : 'amber'}>{question.status}</Badge>
                    <Badge color="blue">Grade {question.gradeMin}-{question.gradeMax}</Badge>
                    <Badge color="slate">{question.topic}</Badge>
                  </div>
                  <p className="font-bold text-slate-900">{question.questionText}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editQuestion(question)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => archiveQuestion(question)}>Archive</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-xl font-extrabold text-slate-950">Assigned Student Results</h2>
        <div className="mt-4 grid gap-3">
          {results.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No assessment results available for your assigned classes yet.</p>
          ) : results.slice(0, 20).map(result => (
            <div key={result.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {result.student?.user ? `${result.student.user.firstName || ''} ${result.student.user.lastName || ''}`.trim() : 'Student'}
                  </p>
                  <p className="text-sm text-slate-500">Grade {result.confirmedGrade} · {formatColomboDisplayDate(result.completedAt)}</p>
                </div>
                <Badge color="blue">{result.percentage}% · {result.categoryLabel}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
