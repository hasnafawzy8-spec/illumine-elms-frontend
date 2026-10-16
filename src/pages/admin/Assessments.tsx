import { useEffect, useState } from 'react';
import { assessmentsAPI, coursesAPI } from '../../services/api';
import { AssessmentAttempt, AssessmentCategory, AssessmentGoal, AssessmentQuestion, AssessmentRecommendation, Course, View } from '../../types';
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

const emptyMapping = {
  course: '',
  gradeMin: '1',
  gradeMax: '11',
  goal: 'SCHOOL_ENGLISH',
  categoryKey: 'FOUNDATION_SUPPORT',
  benefits: '',
  isActive: true,
};

const goalOptions = [
  { value: 'SCHOOL_ENGLISH', label: 'School English' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'WRITING', label: 'Writing' },
];

export default function AdminAssessments({ navigate, showToast }: Props) {
  const [tab, setTab] = useState<'questions' | 'categories' | 'recommendations' | 'results'>('questions');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [mappings, setMappings] = useState<AssessmentRecommendation[]>([]);
  const [results, setResults] = useState<AssessmentAttempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [mappingForm, setMappingForm] = useState(emptyMapping);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ grade: '', category: '', from: '', to: '' });

  const loadData = async () => {
    try {
      const [questionList, categoryList, mappingList, resultList, courseList] = await Promise.all([
        assessmentsAPI.getQuestions(),
        assessmentsAPI.getCategories(),
        assessmentsAPI.getRecommendations(),
        assessmentsAPI.getResults(filters),
        coursesAPI.getAll(),
      ]);
      setQuestions(questionList);
      setCategories(categoryList);
      setMappings(mappingList);
      setResults(resultList);
      setCourses(courseList);
      if (courseList.length && !mappingForm.course) setMappingForm(current => ({ ...current, course: courseList[0].id }));
      if (categoryList.length && !mappingForm.categoryKey) setMappingForm(current => ({ ...current, categoryKey: categoryList[0].key }));
    } catch (error: any) {
      showToast(error?.message || 'Unable to load assessment management data.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getQuestionFormErrors = () => {
    const questionText = questionForm.questionText.trim();
    const explanation = questionForm.explanation.trim();
    const options = questionForm.options.map(option => option.trim());
    const uniqueOptions = new Set(options.map(option => option.toLowerCase()));
    const gradeMin = Number(questionForm.gradeMin);
    const gradeMax = Number(questionForm.gradeMax);

    return {
      questionText: questionText.length < 10 ? 'Write a meaningful question with at least 10 characters.' : '',
      explanation: explanation.length < 5 ? 'Add a short explanation with at least 5 characters.' : '',
      options: options.some(option => !option)
        ? 'All four answer options are required.'
        : uniqueOptions.size !== 4
          ? 'Answer options must be four different values.'
          : '',
      gradeRange: !gradeMin || !gradeMax || gradeMin < 1 || gradeMax > 11 || gradeMax < gradeMin
        ? 'Use a valid grade range from 1 to 11.'
        : '',
      readingPassage: questionForm.topic === 'READING' && !questionForm.readingPassage.trim()
        ? 'Reading questions need a short passage.'
        : '',
    };
  };

  const saveQuestion = async () => {
    const errors = getQuestionFormErrors();
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      showToast(firstError, 'error');
      return;
    }
    try {
      const saved = await assessmentsAPI.saveQuestion({
        ...questionForm,
        gradeMin: Number(questionForm.gradeMin),
        gradeMax: Number(questionForm.gradeMax),
        correctOptionIndex: Number(questionForm.correctOptionIndex),
      }, editingQuestionId || undefined);
      setQuestions(current => current.some(item => item.id === saved.id) ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current]);
      setQuestionForm(emptyQuestion);
      setEditingQuestionId(null);
      showToast('Assessment question saved.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to save question.', 'error');
    }
  };

  const editQuestion = (question: AssessmentQuestion) => {
    if (question.source === 'SYSTEM') {
      showToast('Automatic quiz questions are read-only. Create a new manual question if you want custom content.', 'info');
      return;
    }
    setEditingQuestionId(question.id);
    setQuestionForm({
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
    setTab('questions');
  };

  const saveCategories = async () => {
    try {
      const saved = await assessmentsAPI.saveCategories(categories.map(category => ({
        ...category,
        minPercent: Number(category.minPercent),
        maxPercent: Number(category.maxPercent),
      })));
      setCategories(saved);
      showToast('Score categories saved.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Score ranges must cover 0-100 without gaps or overlaps.', 'error');
    }
  };

  const saveMapping = async () => {
    if (!mappingForm.course) {
      showToast('Choose a course for this recommendation.', 'error');
      return;
    }
    try {
      const saved = await assessmentsAPI.saveRecommendation({
        ...mappingForm,
        gradeMin: Number(mappingForm.gradeMin),
        gradeMax: Number(mappingForm.gradeMax),
      }, editingMappingId || undefined);
      setMappings(saved);
      setMappingForm({ ...emptyMapping, course: courses[0]?.id || '', categoryKey: categories[0]?.key || 'FOUNDATION_SUPPORT' });
      setEditingMappingId(null);
      showToast('Recommendation mapping saved.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Unable to save recommendation mapping.', 'error');
    }
  };

  const deleteMapping = async (mappingId: string) => {
    if (!window.confirm('Delete this recommendation mapping?')) return;
    await assessmentsAPI.deleteRecommendation(mappingId);
    setMappings(current => current.filter(item => (item.id || item.mappingId) !== mappingId));
  };

  const archiveQuestion = async (question: AssessmentQuestion) => {
    if (question.source === 'SYSTEM') {
      showToast('Automatic quiz questions are read-only and cannot be archived from here.', 'info');
      return;
    }
    if (!window.confirm('Archive this question?')) return;
    const updated = await assessmentsAPI.archiveQuestion(question.id);
    setQuestions(current => current.map(item => item.id === updated.id ? updated : item));
  };

  const loadFilteredResults = async () => {
    setResults(await assessmentsAPI.getResults(filters));
  };

  const questionErrors = getQuestionFormErrors();

  return (
    <div className="fade-in-up space-y-6">
      <PageHeader title="Assessment Management" subtitle="Manage level quiz questions, scoring ranges, recommendations and results" />

      <div className="flex flex-wrap gap-2">
        {[
          ['questions', 'Questions'],
          ['categories', 'Score Categories'],
          ['recommendations', 'Recommendations'],
          ['results', 'Results'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`rounded-full border px-4 py-2 text-sm font-bold ${tab === key ? 'border-[#1E6BB8] bg-[#1E6BB8] text-white' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold text-slate-950">{editingQuestionId ? 'Edit Question' : 'Create Question'}</h2>
            <div className="mt-4 grid gap-4">
              <Input
                label="Question"
                value={questionForm.questionText}
                onChange={questionText => setQuestionForm(current => ({ ...current, questionText }))}
                hint="Example: Choose the correct sentence for this grade."
                error={questionForm.questionText.trim() ? questionErrors.questionText : ''}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Grade min" type="number" min="1" max="11" value={questionForm.gradeMin} onChange={gradeMin => setQuestionForm(current => ({ ...current, gradeMin }))} error={questionErrors.gradeRange && questionForm.gradeMin ? questionErrors.gradeRange : ''} required />
                <Input label="Grade max" type="number" min="1" max="11" value={questionForm.gradeMax} onChange={gradeMax => setQuestionForm(current => ({ ...current, gradeMax }))} error={questionErrors.gradeRange && questionForm.gradeMax ? questionErrors.gradeRange : ''} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Topic" value={questionForm.topic} onChange={topic => setQuestionForm(current => ({ ...current, topic }))} options={[
                  { value: 'GRAMMAR', label: 'Grammar' },
                  { value: 'VOCABULARY', label: 'Vocabulary' },
                  { value: 'READING', label: 'Reading' },
                ]} />
                <Select label="Status" value={questionForm.status} onChange={status => setQuestionForm(current => ({ ...current, status }))} options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                ]} />
              </div>
              {questionForm.topic === 'READING' && (
                <div>
                  <Textarea label="Reading passage" value={questionForm.readingPassage} onChange={readingPassage => setQuestionForm(current => ({ ...current, readingPassage }))} rows={3} />
                  {questionForm.readingPassage.trim() && questionErrors.readingPassage && <p className="mt-1 text-xs text-red-500">{questionErrors.readingPassage}</p>}
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {questionForm.options.map((option, index) => (
                  <Input key={index} label={`Option ${String.fromCharCode(65 + index)}`} value={option} onChange={value => setQuestionForm(current => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? value : item) }))} required />
                ))}
              </div>
              {questionForm.options.some(option => option.trim()) && questionErrors.options && <p className="-mt-2 text-xs font-semibold text-red-500">{questionErrors.options}</p>}
              <Select label="Correct answer" value={questionForm.correctOptionIndex} onChange={correctOptionIndex => setQuestionForm(current => ({ ...current, correctOptionIndex }))} options={questionForm.options.map((_, index) => ({ value: String(index), label: `Option ${String.fromCharCode(65 + index)}` }))} />
              <div>
                <Textarea label="Explanation" value={questionForm.explanation} onChange={explanation => setQuestionForm(current => ({ ...current, explanation }))} rows={3} required />
                <p className={`mt-1 text-xs ${questionForm.explanation.trim() && questionErrors.explanation ? 'text-red-500' : 'text-slate-400'}`}>
                  Add why the selected option is correct. Minimum 5 characters.
                </p>
              </div>
              <Button onClick={saveQuestion}>{editingQuestionId ? 'Save Changes' : questionForm.status === 'PUBLISHED' ? 'Publish Question' : 'Create Draft Question'}</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold text-slate-950">All Questions</h2>
            <div className="mt-4 space-y-3">
              {questions.map(question => (
                <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge color={question.status === 'PUBLISHED' ? 'green' : question.status === 'ARCHIVED' ? 'slate' : 'amber'}>{question.status}</Badge>
                    <Badge color="blue">Grade {question.gradeMin}-{question.gradeMax}</Badge>
                    <Badge color="slate">{question.topic}</Badge>
                    {question.source === 'SYSTEM' && <Badge color="teal">Automatic</Badge>}
                  </div>
                  <p className="font-bold text-slate-900">{question.questionText}</p>
                  <div className="mt-3 flex gap-2">
                    {question.source === 'SYSTEM' ? (
                      <p className="text-xs font-semibold text-slate-500">Read-only system-generated quiz question</p>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => editQuestion(question)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => archiveQuestion(question)}>Archive</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'categories' && (
        <Card className="p-5">
          <h2 className="font-display text-xl font-extrabold text-slate-950">Score Categories</h2>
          <p className="mt-1 text-sm text-slate-500">Ranges must cover 0-100 without gaps or overlaps.</p>
          <div className="mt-4 space-y-4">
            {categories.map((category, index) => (
              <div key={category.key || index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_0.6fr_0.6fr]">
                <Input label="Key" value={category.key} onChange={key => setCategories(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, key } : item))} />
                <Input label="Label" value={category.label} onChange={label => setCategories(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item))} />
                <Input label="Min %" type="number" value={String(category.minPercent)} onChange={minPercent => setCategories(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, minPercent: Number(minPercent) } : item))} />
                <Input label="Max %" type="number" value={String(category.maxPercent)} onChange={maxPercent => setCategories(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, maxPercent: Number(maxPercent) } : item))} />
                <Textarea className="md:col-span-4" label="Feedback" value={category.feedback} onChange={feedback => setCategories(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, feedback } : item))} rows={2} />
              </div>
            ))}
          </div>
          <Button className="mt-5" onClick={saveCategories}>Save Categories</Button>
        </Card>
      )}

      {tab === 'recommendations' && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold text-slate-950">{editingMappingId ? 'Edit Mapping' : 'Create Mapping'}</h2>
            <div className="mt-4 grid gap-4">
              <Select label="Course" value={mappingForm.course} onChange={course => setMappingForm(current => ({ ...current, course }))} options={courses.map(course => ({ value: course.id, label: `${course.name} - Rs. ${course.monthlyFee.toLocaleString()}` }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Grade min" type="number" min="1" max="11" value={mappingForm.gradeMin} onChange={gradeMin => setMappingForm(current => ({ ...current, gradeMin }))} />
                <Input label="Grade max" type="number" min="1" max="11" value={mappingForm.gradeMax} onChange={gradeMax => setMappingForm(current => ({ ...current, gradeMax }))} />
              </div>
              <Select label="Goal" value={mappingForm.goal} onChange={goal => setMappingForm(current => ({ ...current, goal }))} options={goalOptions} />
              <Select label="Score category" value={mappingForm.categoryKey} onChange={categoryKey => setMappingForm(current => ({ ...current, categoryKey }))} options={categories.map(category => ({ value: category.key, label: category.label }))} />
              <Textarea label="Learning benefits" value={mappingForm.benefits} onChange={benefits => setMappingForm(current => ({ ...current, benefits }))} rows={3} />
              <Button onClick={saveMapping}>{editingMappingId ? 'Save Mapping' : 'Create Mapping'}</Button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold text-slate-950">Recommendation Mappings</h2>
            <div className="mt-4 space-y-3">
              {mappings.map(mapping => (
                <div key={mapping.id || mapping.mappingId} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-900">{mapping.courseName}</p>
                  <p className="mt-1 text-sm text-slate-500">Grade {mapping.gradeMin}-{mapping.gradeMax} · {mapping.goal} · {mapping.categoryKey}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingMappingId(mapping.id || mapping.mappingId || '');
                      setMappingForm({
                        course: String(mapping.courseId),
                        gradeMin: String(mapping.gradeMin || 1),
                        gradeMax: String(mapping.gradeMax || 11),
                        goal: String(mapping.goal || 'SCHOOL_ENGLISH'),
                        categoryKey: String(mapping.categoryKey || categories[0]?.key || 'FOUNDATION_SUPPORT'),
                        benefits: mapping.benefits || '',
                        isActive: mapping.isActive !== false,
                      });
                    }}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteMapping(mapping.id || mapping.mappingId || '')}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'results' && (
        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[0.6fr_1fr_1fr_1fr_auto] md:items-end">
            <Input label="Grade" value={filters.grade} onChange={grade => setFilters(current => ({ ...current, grade }))} />
            <Select label="Category" value={filters.category} onChange={category => setFilters(current => ({ ...current, category }))} options={[{ value: '', label: 'All categories' }, ...categories.map(category => ({ value: category.key, label: category.label }))]} />
            <Input label="From" type="date" value={filters.from} onChange={from => setFilters(current => ({ ...current, from }))} />
            <Input label="To" type="date" value={filters.to} onChange={to => setFilters(current => ({ ...current, to }))} />
            <Button onClick={loadFilteredResults}>Filter</Button>
          </div>
          <div className="mt-5 space-y-3">
            {results.map(result => (
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
      )}
    </div>
  );
}
