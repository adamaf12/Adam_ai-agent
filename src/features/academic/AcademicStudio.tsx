import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  BookOpen,
  Library,
  Search,
  Sparkles,
  Calculator,
  Atom,
  Binary,
  Compass,
  FileText,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Award,
  Lightbulb,
  Layers,
  Send,
  Cpu,
  Globe,
  HelpCircle,
  BookMarked,
  School,
  FileCheck,
  Filter,
  Flame,
  ArrowRight,
  Clock,
  Bookmark,
  CalendarCheck,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import type { AcademicStage, AcademicTab, AcademicSearchResult, AcademicQuizQuestion, CitationOutput } from './types';
import { WORLD_DIGITAL_LIBRARIES, STAGE_CURRICULUM_DATA } from './worldLibrariesData';
import { StudentCompanionView } from './StudentCompanionView';
import { FormulaCheatSheetsView } from './FormulaCheatSheetsView';

interface AcademicStudioProps {
  language: Language;
  onNavigateToChat?: (prompt: string) => void;
}

export function AcademicStudio({ language, onNavigateToChat }: AcademicStudioProps) {
  const isAr = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState<AcademicTab>('stages');
  const [selectedStage, setSelectedStage] = useState<AcademicStage>('secondary');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sec-advanced-math');

  // Library & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<AcademicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // AI Tutor & Solver State
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMode, setTutorMode] = useState<'solve' | 'explain'>('solve');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResult, setTutorResult] = useState<{
    text: string;
    keyPoints?: string[];
    finalAnswer?: string;
  } | null>(null);

  // Quiz State
  const [quizSubject, setQuizSubject] = useState('الرياضيات والعلوم');
  const [quizTopic, setQuizTopic] = useState('حساب النهايات والدوال الأسية');
  const [quizQuestions, setQuizQuestions] = useState<AcademicQuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Citation & Thesis State
  const [citeTitle, setCiteTitle] = useState('');
  const [citeAuthor, setCiteAuthor] = useState('');
  const [citeYear, setCiteYear] = useState('');
  const [citeVenue, setCiteVenue] = useState('');
  const [citeResult, setCiteResult] = useState<CitationOutput | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [thesisTopic, setThesisTopic] = useState('');
  const [thesisDegree, setThesisDegree] = useState('Master');
  const [thesisField, setThesisField] = useState('Computer Science & AI');
  const [thesisPlan, setThesisPlan] = useState<any>(null);
  const [thesisLoading, setThesisLoading] = useState(false);

  // Filtered libraries based on stage and category
  const filteredLibraries = useMemo(() => {
    return WORLD_DIGITAL_LIBRARIES.filter((lib) => {
      const matchStage = lib.supportedStages.includes(selectedStage);
      const matchCategory = libraryCategoryFilter === 'all' || lib.category === libraryCategoryFilter;
      const matchQuery =
        !searchQuery.trim() ||
        lib.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStage && matchCategory && matchQuery;
    });
  }, [selectedStage, libraryCategoryFilter, searchQuery]);

  // Current stage subjects
  const currentStageSubjects = useMemo(() => {
    return STAGE_CURRICULUM_DATA.filter((s) => s.stage === selectedStage);
  }, [selectedStage]);

  const activeSubject = useMemo(() => {
    return currentStageSubjects.find((s) => s.id === selectedSubjectId) || currentStageSubjects[0];
  }, [currentStageSubjects, selectedSubjectId]);

  // Live Research Search
  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/academic/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.results)) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Run AI Tutor
  const handleRunTutor = async (promptOverride?: string) => {
    const textToRun = promptOverride || tutorInput;
    if (!textToRun.trim()) return;

    setTutorLoading(true);
    setTutorResult(null);

    try {
      if (tutorMode === 'solve') {
        const res = await fetch('/api/academic/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToRun,
            stage: selectedStage,
            subject: activeSubject?.titleAr || 'عام',
            language,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setTutorResult({
            text: data.solution,
            keyPoints: data.keyPrinciples,
            finalAnswer: data.finalAnswer,
          });
        }
      } else {
        const res = await fetch('/api/academic/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: textToRun,
            stage: selectedStage,
            language,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setTutorResult({
            text: data.explanation,
            keyPoints: data.keyTakeaways,
          });
        }
      }
    } catch {
      setTutorResult({
        text: isAr ? 'حدث خطأ أثناء معالجة الطلب الأكاديمي.' : 'An error occurred processing the academic request.',
      });
    } finally {
      setTutorLoading(false);
    }
  };

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuizSubmitted(false);
    setUserAnswers({});
    try {
      const res = await fetch('/api/academic/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: quizSubject,
          topic: quizTopic,
          stage: selectedStage,
          count: 5,
          language,
        }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.questions)) {
        setQuizQuestions(data.questions);
      }
    } catch {
      // Keep existing or empty
    } finally {
      setQuizLoading(false);
    }
  };

  // Citations
  const handleGenerateCitations = async () => {
    if (!citeTitle.trim()) return;
    try {
      const res = await fetch('/api/academic/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: citeTitle,
          author: citeAuthor,
          year: citeYear,
          journalOrPublisher: citeVenue,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCiteResult(data.citations);
      }
    } catch {}
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Thesis
  const handleGenerateThesisPlan = async () => {
    if (!thesisTopic.trim()) return;
    setThesisLoading(true);
    try {
      const res = await fetch('/api/academic/thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: thesisTopic,
          degree: thesisDegree,
          field: thesisField,
          language,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setThesisPlan(data.plan);
      }
    } catch {}
    finally {
      setThesisLoading(false);
    }
  };

  // Quiz Score Calculation
  const quizScore = useMemo(() => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  }, [quizQuestions, userAnswers]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-5 text-[var(--foreground)]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-sunken)] to-[var(--surface)] p-6 sm:p-8 mb-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide mb-3">
              <Library className="w-3.5 h-3.5" />
              <span>{isAr ? 'أعظم مستودعات المعرفة ومكتبات العالم الرقمية' : 'World-Class Global Libraries & Academic Super-Hub'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)] mb-2.5">
              {isAr ? 'مكتبة وأكاديمية آدم العالمية الشاملة' : 'Adam Global Student & Academic Super-Hub'}
            </h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
              {isAr
                ? 'مرجع الطالب والباحث المتكامل عبر كافة الأطوار الدراسية: من الابتدائي، الإعدادي، الثانوي والبكالوريا، حتى الدراسات الجامعية العليا والأطروحات، مع وصول لأكثر من 250 مليون ورقة علمية وكتاب ومحاكي.'
                : 'Empowering students across all education tiers—from Elementary, Middle School, High School to Universities and PhD Research—with direct access to 250M+ open access papers, world mega-libraries, and step-by-step AI tutoring.'}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="flex-1 sm:flex-initial p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-center min-w-[120px]">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">+250M</div>
              <div className="text-xs text-[var(--foreground-muted)]">{isAr ? 'أوراق علمية ومراجع' : 'Papers & Books'}</div>
            </div>
            <div className="flex-1 sm:flex-initial p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-center min-w-[120px]">
              <div className="text-xl sm:text-2xl font-black text-blue-400">4 أطوار</div>
              <div className="text-xs text-[var(--foreground-muted)]">{isAr ? 'ابتدائي حتى الجامعة' : 'K-12 to University'}</div>
            </div>
          </div>
        </div>

        {/* Academic Stage Selector Tabs */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-[var(--foreground-muted)] flex items-center gap-1.5 px-1">
            <School className="w-4 h-4 text-emerald-400" />
            {isAr ? 'الطور الدراسي:' : 'Academic Tier:'}
          </span>
          {(
            [
              { id: 'primary', labelAr: 'الطور الابتدائي (1-6)', labelEn: 'Elementary (1-6)', icon: Compass, color: 'hover:border-amber-500/40 text-amber-300' },
              { id: 'middle', labelAr: 'الطور المتوسط / الإعدادي', labelEn: 'Middle School (7-9)', icon: Binary, color: 'hover:border-cyan-500/40 text-cyan-300' },
              { id: 'secondary', labelAr: 'الثانوي والبكالوريا (10-12)', labelEn: 'High School / Baccalaureate', icon: Flame, color: 'hover:border-rose-500/40 text-rose-300' },
              { id: 'university', labelAr: 'الجامعي والدراسات العليا', labelEn: 'University & Research', icon: GraduationCap, color: 'hover:border-purple-500/40 text-purple-300' },
            ] as const
          ).map((stage) => {
            const isSelected = selectedStage === stage.id;
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isAr ? stage.labelAr : stage.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feature Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-[var(--border)]">
        {(
          [
            { id: 'companion', labelAr: 'المرافق الأكاديمي وغرفة التركيز', labelEn: 'Student Companion & Focus', icon: Clock },
            { id: 'stages', labelAr: 'مناهج ومفاهيم الطور', labelEn: 'Curriculum & Concepts', icon: BookMarked },
            { id: 'formulas', labelAr: 'كناش القوانين والمعادلات', labelEn: 'Formula Cheat Sheets', icon: Calculator },
            { id: 'libraries', labelAr: 'المكتبات العالمية والبحث الحي', labelEn: 'World Libraries & Search', icon: Globe },
            { id: 'tutor', labelAr: 'المعلم الذكي وحلال المسائل', labelEn: 'AI Solver & Tutor', icon: Sparkles },
            { id: 'quiz', labelAr: 'اختبارات وفهم تفاعلي', labelEn: 'Interactive Quizzes', icon: Award },
            { id: 'thesis', labelAr: 'أدوات التوثيق ومذكرات التخرج', labelEn: 'Citations & Thesis', icon: FileCheck },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <AnimatePresence mode="wait">
        {/* 1. CURRICULUM & STAGE CONCEPTS */}
        {activeTab === 'stages' && (
          <motion.div
            key="stages"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Subject selector for current stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStageSubjects.map((subj) => {
                const isSelected = subj.id === activeSubject?.id;
                return (
                  <button
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`p-4 rounded-2xl border text-start transition-all duration-200 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-base text-[var(--foreground)]">{isAr ? subj.titleAr : subj.titleEn}</span>
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                      {isAr ? subj.descriptionAr : subj.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Subject Breakdown */}
            {activeSubject && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)]">
                      {isAr ? activeSubject.titleAr : activeSubject.titleEn}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
                      {isAr ? activeSubject.descriptionAr : activeSubject.descriptionEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setQuizSubject(activeSubject.titleAr);
                        setQuizTopic(activeSubject.topics[0]?.titleAr || '');
                        setActiveTab('quiz');
                        handleGenerateQuiz();
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/25 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اختبر فهمك للمادة' : 'Test Subject Quiz'}</span>
                    </button>
                  </div>
                </div>

                {/* Topics list */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {activeSubject.topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base mb-2">
                          <Lightbulb className="w-4 h-4 shrink-0" />
                          <span>{isAr ? topic.titleAr : topic.titleEn}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed mb-3">
                          {isAr ? topic.summaryAr : topic.summaryEn}
                        </p>
                        <div className="space-y-1.5 mb-4">
                          <span className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider block">
                            {isAr ? 'النقاط الذهبية والقوانين:' : 'Key Principles & Rules:'}
                          </span>
                          {(isAr ? topic.keyPointsAr : topic.keyPointsEn).map((pt, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setTutorInput(topic.practicePrompt);
                            setActiveTab('tutor');
                            handleRunTutor(topic.practicePrompt);
                          }}
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isAr ? 'شرح المسألة بالخطوات' : 'Solve with AI Tutor'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reference Platforms & Free Textbooks */}
                {activeSubject.referenceLinks.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider block mb-3">
                      {isAr ? 'المراجع المعتمدة والمحاكاة التفاعلية المجانية:' : 'Curated Textbooks & Interactive Labs:'}
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {activeSubject.referenceLinks.map((ref, idx) => (
                        <a
                          key={idx}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--foreground)] hover:border-emerald-500/50 hover:text-emerald-300 transition-all shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{ref.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 2. WORLD MEGA LIBRARIES & LIVE SEARCH */}
        {activeTab === 'libraries' && (
          <motion.div
            key="libraries"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Search Bar */}
            <form onSubmit={handlePerformSearch} className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث في أكثر من 250 مليون بحث وكتاب ومخطوطة عالمية (مثل: Quantum Computing, المعادلات التفاضلية, الطب)...'
                      : 'Search across 250M+ research papers, books, and manuscripts worldwide...'
                  }
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {isSearching ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{isAr ? 'بحث عالمي حي' : 'Search Live Repositories'}</span>
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                {isAr ? 'تصنيف المكتبات:' : 'Category:'}
              </span>
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'preprints', labelAr: 'مستودعات الأوراق العلمية', labelEn: 'Research Papers' },
                { id: 'books', labelAr: 'أمهات الكتب والمخطوطات', labelEn: 'Books & Archives' },
                { id: 'stem', labelAr: 'الرياضيات والفيزياء والـ CS', labelEn: 'STEM & Tech' },
                { id: 'medical', labelAr: 'الطب والصيدلة (PubMed)', labelEn: 'Medical & Health' },
                { id: 'k12', labelAr: 'المناهج المدرسية والمحاكاة', labelEn: 'K-12 & PhET' },
                { id: 'courses', labelAr: 'مقررات MIT والجامعات', labelEn: 'Free College Courses' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLibraryCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                    libraryCategoryFilter === cat.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Live Search Results if available */}
            {hasSearched && (
              <div className="p-6 rounded-3xl border border-emerald-500/30 bg-[var(--surface)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <h3 className="font-extrabold text-base flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? `نتائج البحث الأكاديمي المباشر (${searchResults.length})` : `Live Academic Works (${searchResults.length})`}</span>
                  </h3>
                  <button
                    onClick={() => {
                      setHasSearched(false);
                      setSearchResults([]);
                    }}
                    className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    {isAr ? 'إغلاق النتائج' : 'Clear Results'}
                  </button>
                </div>

                {isSearching ? (
                  <div className="py-8 text-center text-sm text-[var(--foreground-muted)] flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{isAr ? 'جاري استخراج الأوراق من OpenAlex و arXiv...' : 'Querying OpenAlex & global preprint servers...'}</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-[var(--foreground-muted)]">
                    {isAr ? 'لم يتم العثور على أوراق تطابق هذا المصطلح، جرب صياغة أكثر دقة أو بالإنجليزية.' : 'No papers found matching query. Try broader keywords.'}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {searchResults.map((work) => (
                      <div
                        key={work.id}
                        className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] hover:border-emerald-500/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                {work.source}
                              </span>
                              {work.year && (
                                <span className="text-xs text-[var(--foreground-muted)] font-mono">{work.year}</span>
                              )}
                              {work.citationCount !== undefined && work.citationCount > 0 && (
                                <span className="text-[11px] text-blue-400">
                                  ★ {work.citationCount} {isAr ? 'استشهاد' : 'citations'}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm sm:text-base text-[var(--foreground)] mb-1">
                              {work.title}
                            </h4>
                            <p className="text-xs text-[var(--foreground-muted)] mb-2 font-medium">
                              {work.authors.join(', ')} • <span className="italic">{work.venue}</span>
                            </p>
                            {work.abstract && (
                              <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed mb-3">
                                {work.abstract}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                          <a
                            href={work.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{isAr ? 'فتح الورقة العلمية' : 'Open Paper'}</span>
                          </a>
                          {work.pdfUrl && (
                            <a
                              href={work.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تحميل PDF المفتوح' : 'Open PDF'}</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setCiteTitle(work.title);
                              setCiteAuthor(work.authors.join(', '));
                              setCiteYear(String(work.year || ''));
                              setCiteVenue(work.venue || '');
                              setActiveTab('thesis');
                              handleGenerateCitations();
                            }}
                            className="text-xs text-[var(--foreground-muted)] hover:text-emerald-400 font-semibold px-2"
                          >
                            {isAr ? 'توليد الاستشهاد الأكاديمي' : 'Cite Work'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Global Digital Libraries Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLibraries.map((lib) => (
                <div
                  key={lib.id}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        {lib.badge}
                      </span>
                      <span className="text-[11px] text-[var(--foreground-muted)] font-mono">{lib.estimatedVolume}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-[var(--foreground)] mb-1 group-hover:text-emerald-400 transition-colors">
                      {isAr ? lib.nameAr : lib.nameEn}
                    </h3>
                    <div className="text-xs text-emerald-400/90 font-semibold mb-2">
                      {isAr ? lib.categoryLabelAr : lib.categoryLabelEn}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-4">
                      {isAr ? lib.descriptionAr : lib.descriptionEn}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {lib.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-[10px] text-[var(--foreground-muted)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <a
                      href={lib.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isAr ? 'زيارة المكتبة الرسمية' : 'Visit Library'}</span>
                    </a>
                    {lib.searchUrlTemplate && (
                      <button
                        onClick={() => {
                          const queryToUse = searchQuery.trim() || 'Calculus Physics Medicine';
                          const fullUrl = lib.searchUrlTemplate!.replace('{query}', encodeURIComponent(queryToUse));
                          window.open(fullUrl, '_blank');
                        }}
                        className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline font-medium"
                      >
                        {isAr ? 'بحث مخصص' : 'Search Hub'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. AI TUTOR & STEP-BY-STEP SOLVER */}
        {activeTab === 'tutor' && (
          <motion.div
            key="tutor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>{isAr ? 'المعلم الأكاديمي الذكي وحلال المسائل' : 'Step-by-Step AI Problem Solver & Tutor'}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
                    {isAr
                      ? `شرح تفصيلي خطوة بخطوة بالمعادلات الرياضية والقوانين العلمية مكيف لطور: ${selectedStage === 'primary' ? 'الابتدائي' : selectedStage === 'middle' ? 'المتوسط' : selectedStage === 'secondary' ? 'الثانوي والبكالوريا' : 'الجامعي والدراسات العليا'}.`
                      : 'Methodical explanations with formulas and principles adapted to student grade level.'}
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)]">
                  <button
                    onClick={() => setTutorMode('solve')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      tutorMode === 'solve'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {isAr ? 'حل المسائل بالخطوات' : 'Solve Step-by-Step'}
                  </button>
                  <button
                    onClick={() => setTutorMode('explain')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      tutorMode === 'explain'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {isAr ? 'تبسيط المفاهيم الصعبة' : 'Concept Explainer'}
                  </button>
                </div>
              </div>

              {/* Input Box */}
              <div className="space-y-3">
                <textarea
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  rows={4}
                  placeholder={
                    tutorMode === 'solve'
                      ? isAr
                        ? 'اكتب أو الصق المسألة الرياضية أو الفيزيائية هنا (مثال: احسب نهاية الدالة (e^x - 1)/x عند x يؤول إلى 0، أو مسألة سقوط حر مع احتكاك)...'
                        : 'Type or paste homework problem or mathematical equation here...'
                      : isAr
                      ? 'ما هو المفهوم الذي تريد شرحه؟ (مثال: نظرية النسبية الخاصة، خوارزمية البحث الثنائي، مبدأ أرخميدس، الاستدلال بالتراجع)...'
                      : 'What concept do you want explained? (e.g., Special Relativity, Binary Search, Induction)...'
                  }
                  className="w-full p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-emerald-500 shadow-inner"
                />

                {/* Quick Subject Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--foreground-muted)] font-semibold">{isAr ? 'أمثلة سريعة:' : 'Quick Prompts:'}</span>
                  {(isAr
                    ? [
                        'احسب مشتقة الدالة f(x) = x^2 * ln(x)',
                        'اشرح قانون أوم والدارة الكهربائية',
                        'كيف أثبت بالبرهان بالتراجع أن 2^n > n',
                        'اشرح تعقيد الخوارزميات Big-O ببساطة',
                      ]
                    : [
                        'Derive f(x) = x^2 * ln(x)',
                        'Explain Ohm\'s Law and Circuits',
                        'Prove 2^n > n by induction',
                        'Explain Big-O complexity intuitively',
                      ]
                  ).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTutorInput(prompt);
                        handleRunTutor(prompt);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleRunTutor()}
                    disabled={tutorLoading || !tutorInput.trim()}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {tutorLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isAr ? 'تحليل وحل بالذكاء الأكاديمي' : 'Analyze & Solve'}</span>
                  </button>
                </div>
              </div>

              {/* Tutor Result Display */}
              {tutorResult && (
                <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isAr ? 'الحل المنهجي والشرح الأكاديمي:' : 'Methodical Academic Solution:'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tutorResult.text, 'tutor-sol')}
                      className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      {copiedKey === 'tutor-sol' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'tutor-sol' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الحل' : 'Copy Solution')}</span>
                    </button>
                  </div>

                  {tutorResult.finalAnswer && (
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40">
                      <span className="text-xs font-bold text-emerald-300 block mb-1">{isAr ? 'النتيجة النهائية / الإجابة المباشرة:' : 'Final Answer:'}</span>
                      <div className="text-base font-extrabold text-white">{tutorResult.finalAnswer}</div>
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] text-sm leading-relaxed whitespace-pre-line text-[var(--foreground)]">
                    {tutorResult.text}
                  </div>

                  {tutorResult.keyPoints && tutorResult.keyPoints.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="text-xs font-bold text-[var(--foreground)] block mb-2">{isAr ? 'الركائز والقواعد المطبقة:' : 'Applied Principles & Takeaways:'}</span>
                      <div className="space-y-1.5">
                        {tutorResult.keyPoints.map((pt, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4. INTERACTIVE QUIZZES & FLASHCARDS */}
        {activeTab === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>{isAr ? 'مولد الاختبارات وبطاقات الفهم التفاعلية' : 'Interactive Quizzes & Concept Mastery'}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
                    {isAr ? 'توليد 5 أسئلة اختيار من متعدد مع تعليل فوري للإجابات حسب الطور والموضوع.' : 'Generate 5 MCQs with instant feedback and pedagogical rationales.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder={isAr ? 'الموضوع المطلوب...' : 'Target topic...'}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)] w-48"
                  />
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {quizLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'توليد اختبار جديد' : 'Generate Quiz'}</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {quizQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--foreground-muted)] space-y-3">
                  <HelpCircle className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
                  <p>{isAr ? 'اضغط على زر «توليد اختبار جديد» لبدء تدريب تفاعلي مخصص لطورك الدراسي.' : 'Click "Generate Quiz" to begin an interactive assessment.'}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {quizQuestions.map((q, qIndex) => {
                    const selectedOpt = userAnswers[q.id];
                    return (
                      <div key={q.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {qIndex + 1}
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--foreground)]">{q.question}</h4>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selectedOpt === optIdx;
                            const isCorrect = q.correctIndex === optIdx;
                            let btnStyle = 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:border-emerald-500/50';

                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                              } else if (isChosen && !isCorrect) {
                                btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                              }
                            } else if (isChosen) {
                              btnStyle = 'bg-blue-500/20 border-blue-500 text-blue-300 font-semibold';
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={quizSubmitted}
                                onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                className={`p-3 rounded-xl border text-start text-xs transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation after submission */}
                        {quizSubmitted && (
                          <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] space-y-1">
                            <span className="font-bold text-emerald-400 block">{isAr ? 'التعليل التربوي:' : 'Pedagogical Explanation:'}</span>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submission and Score Banner */}
                  <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    {quizSubmitted ? (
                      <div className="flex items-center gap-3">
                        <div className="text-base font-extrabold text-emerald-400">
                          {isAr ? `النتيجة: ${quizScore} من ${quizQuestions.length}` : `Score: ${quizScore} / ${quizQuestions.length}`}
                        </div>
                        <button
                          onClick={handleGenerateQuiz}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          {isAr ? 'اختبار جديد' : 'Try Another'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(userAnswers).length === 0}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
                      >
                        {isAr ? 'تسليم الإجابات وعرض النتيجة' : 'Submit Answers'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 5. CITATIONS & THESIS TOOLKIT */}
        {activeTab === 'thesis' && (
          <motion.div
            key="thesis"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Citation Formatter */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base sm:text-lg">
                <FileCheck className="w-5 h-5" />
                <span>{isAr ? 'صانع الاستشهادات الأكاديمية (APA, IEEE, Harvard)' : 'Academic Citation Generator'}</span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                {isAr ? 'توليد توثيق علمي دقيق بنقرة واحدة لكافة صيغ التوثيق العالمية.' : 'Format any paper or book into APA 7, IEEE, MLA 9, Harvard & Chicago instantly.'}
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={citeTitle}
                  onChange={(e) => setCiteTitle(e.target.value)}
                  placeholder={isAr ? 'عنوان البحث أو الكتاب...' : 'Work or Book Title...'}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={citeAuthor}
                    onChange={(e) => setCiteAuthor(e.target.value)}
                    placeholder={isAr ? 'المؤلفون (مثال: Smith, J.)...' : 'Authors...'}
                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                  />
                  <input
                    type="text"
                    value={citeYear}
                    onChange={(e) => setCiteYear(e.target.value)}
                    placeholder={isAr ? 'سنة النشر (مثال: 2024)...' : 'Year...'}
                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <input
                  type="text"
                  value={citeVenue}
                  onChange={(e) => setCiteVenue(e.target.value)}
                  placeholder={isAr ? 'المجلة أو دار النشر (مثال: Nature, IEEE Transactions)...' : 'Journal or Publisher...'}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />

                <button
                  onClick={handleGenerateCitations}
                  disabled={!citeTitle.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
                >
                  {isAr ? 'توليد كافة صيغ التوثيق' : 'Generate Citations'}
                </button>
              </div>

              {citeResult && (
                <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                  {(['apa', 'ieee', 'mla', 'harvard', 'chicago'] as const).map((fmt) => (
                    <div key={fmt} className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase">{fmt}</span>
                        <button
                          onClick={() => copyToClipboard(citeResult[fmt], fmt)}
                          className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1"
                        >
                          {copiedKey === fmt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === fmt ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                        </button>
                      </div>
                      <p className="text-xs text-[var(--foreground)] select-all font-serif">{citeResult[fmt]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thesis & Master Planner */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-extrabold text-base sm:text-lg">
                <GraduationCap className="w-5 h-5" />
                <span>{isAr ? 'مساعد مذكرات التخرج ورسائل الماجستير والدكتوراه' : 'Thesis & Dissertation Architect'}</span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                {isAr ? 'بناء هيكل علمي لمذكرتك، صياغة الإشكالية، وتحديد الفصول والمنهجية المتبعة.' : 'Design research problem, literature outline, methodology, and chapter plan.'}
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={thesisTopic}
                  onChange={(e) => setThesisTopic(e.target.value)}
                  placeholder={isAr ? 'موضوع المذكرة أو الأطروحة (مثال: الذكاء الاصطناعي في تشخيص الأورام)...' : 'Thesis research topic...'}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={thesisDegree}
                    onChange={(e) => setThesisDegree(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                  >
                    <option value="Bachelor">{isAr ? 'ليسانس / بكالوريوس' : 'Bachelor Capstone'}</option>
                    <option value="Master">{isAr ? 'ماستر / ماجستير' : 'Master\'s Thesis'}</option>
                    <option value="PhD">{isAr ? 'دكتوراه' : 'Doctoral PhD Dissertation'}</option>
                  </select>
                  <input
                    type="text"
                    value={thesisField}
                    onChange={(e) => setThesisField(e.target.value)}
                    placeholder={isAr ? 'التخصص (مثال: علوم الحاسوب)...' : 'Field / Department...'}
                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                  />
                </div>

                <button
                  onClick={handleGenerateThesisPlan}
                  disabled={thesisLoading || !thesisTopic.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {thesisLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isAr ? 'تخطيط هيكل المذكرة والإشكالية' : 'Architect Dissertation Outline'}</span>
                </button>
              </div>

              {thesisPlan && (
                <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] space-y-3 max-h-96 overflow-y-auto">
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 block mb-1">{isAr ? 'العنوان الأكاديمي المقترح:' : 'Proposed Title:'}</span>
                    <h4 className="font-bold text-sm text-[var(--foreground)]">{thesisPlan.proposedTitle}</h4>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1">{isAr ? 'صياغة الإشكالية والفجوة البحثية:' : 'Problem Statement:'}</span>
                    <p className="text-xs text-[var(--foreground-muted)]">{thesisPlan.problemStatement}</p>
                  </div>

                  {Array.isArray(thesisPlan.chapters) && (
                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <span className="text-[11px] font-bold text-[var(--foreground)] block">{isAr ? 'هيكل الفصول المقترح:' : 'Chapter Breakdown:'}</span>
                      {thesisPlan.chapters.map((ch: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[var(--surface)] text-xs">
                          <span className="font-semibold text-emerald-400 block">{ch.title}</span>
                          {Array.isArray(ch.sections) && (
                            <ul className="list-disc list-inside text-[11px] text-[var(--foreground-muted)] mt-1">
                              {ch.sections.map((s: string, j: number) => (
                                <li key={j}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* COMPANION & FOCUS TAB */}
        {activeTab === 'companion' && (
          <motion.div
            key="companion-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <StudentCompanionView
              language={language}
              selectedStage={selectedStage}
              onNavigateToChat={onNavigateToChat}
            />
          </motion.div>
        )}

        {/* FORMULAS & CHEAT SHEETS TAB */}
        {activeTab === 'formulas' && (
          <motion.div
            key="formulas-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <FormulaCheatSheetsView
              language={language}
              selectedStage={selectedStage}
              onNavigateToChat={onNavigateToChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
