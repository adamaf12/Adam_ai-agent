import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Zap,
  Coffee,
  CheckSquare,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AcademicStage } from './types';

interface StudentCompanionProps {
  language: 'ar' | 'en';
  selectedStage: AcademicStage;
  onNavigateToChat?: (prompt: string) => void;
}

interface PomodoroTask {
  id: string;
  title: string;
  completed: boolean;
}

export function StudentCompanionView({ language, selectedStage, onNavigateToChat }: StudentCompanionProps) {
  const isAr = language === 'ar';

  // --- 1. Pomodoro Focus Timer ---
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Sound chime synthesizer using Web Audio API
  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      playBeep();
      if (pomodoroMode === 'study') {
        setCompletedSessions((prev) => prev + 1);
        setPomodoroMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setPomodoroMode('study');
        setTimeLeft(25 * 60);
      }
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, pomodoroMode]);

  const switchPomodoro = (mode: 'study' | 'shortBreak' | 'longBreak') => {
    setPomodoroMode(mode);
    setTimerRunning(false);
    if (mode === 'study') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 2. Focus Checklist / Micro-Goals ---
  const [tasks, setTasks] = useState<PomodoroTask[]>([
    { id: '1', title: isAr ? 'حل 3 مسائل نموذجية في الرياضيات' : 'Solve 3 calculus problem sets', completed: false },
    { id: '2', title: isAr ? 'مراجعة خريطة المفاهيم للفيزياء' : 'Review physics summary formula sheet', completed: true },
    { id: '3', title: isAr ? 'تدوين الملاحظات بالكلمات الخاصة (تقنية فاينمان)' : 'Draft active recall Feynman summary', completed: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTaskInput.trim(), completed: false }]);
    setNewTaskInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // --- 3. Mistake Doctor & Preventive Diagnosis ---
  const [mistakeQuestion, setMistakeQuestion] = useState('');
  const [studentWrongAnswer, setStudentWrongAnswer] = useState('');
  const [correctKey, setCorrectKey] = useState('');
  const [mistakeLoading, setMistakeLoading] = useState(false);
  const [mistakeAnalysis, setMistakeAnalysis] = useState<any>(null);

  const handleAnalyzeMistake = async () => {
    if (!mistakeQuestion.trim() || !studentWrongAnswer.trim()) return;
    setMistakeLoading(true);
    setMistakeAnalysis(null);
    try {
      const res = await fetch('/api/academic/analyze-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: mistakeQuestion,
          studentAnswer: studentWrongAnswer,
          correctAnswer: correctKey,
          stage: selectedStage,
          language,
        }),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setMistakeAnalysis(data.analysis);
      }
    } catch {
      // Fallback
      setMistakeAnalysis({
        diagnosis: isAr ? 'خلط في ترتيب العمليات وتحديد الشروط الحدية.' : 'Order of operations and boundary condition discrepancy.',
        stepByStepFix: isAr ? 'تأكد أولاً من تفكيك المعطيات وكتابة القانون الأصلي قبل التعويض بالأرقام.' : 'Always state the baseline formula before numerical substitution.',
        memoryAnchor: isAr ? 'قاعدة الذهب: ارسم جدول الإشارات وتأكد من وحدات القياس (SI units) قبل الإجابة النهائية.' : 'Check SI units and signs twice before framing the final box.',
      });
    } finally {
      setMistakeLoading(false);
    }
  };

  // --- 4. Exam Strategic Timetable Generator ---
  const [targetExam, setTargetExam] = useState(
    selectedStage === 'secondary'
      ? (isAr ? 'امتحان شهادة البكالوريا / الثانوية العامة' : 'Baccalaureate / High School Finals')
      : selectedStage === 'middle'
      ? (isAr ? 'شهادة التعليم المتوسط (BEM)' : 'Middle School Certificate')
      : selectedStage === 'primary'
      ? (isAr ? 'التقويمات والامتحانات الفصلية' : 'End of Term Assessment')
      : (isAr ? 'الامتحانات الجامعية ومناقشة التخرج' : 'University Finals & Defense')
  );
  const [focusSubjects, setFocusSubjects] = useState(isAr ? 'الرياضيات، الفيزياء، العلوم' : 'Math, Physics, Sciences');
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [daysUntilExam, setDaysUntilExam] = useState(45);
  const [planLoading, setPlanLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);

  const handleGenerateStudyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch('/api/academic/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: selectedStage,
          targetExam,
          subjectsToFocus: focusSubjects.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
          hoursPerDay,
          daysUntilExam,
          language,
        }),
      });
      const data = await res.json();
      if (data.ok && data.plan) {
        setStudyPlan(data.plan);
      }
    } catch {
      // Fallback
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: The Companion Promise */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[var(--surface)] to-teal-950/30 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {isAr ? 'المرافق الأكاديمي الدائم' : '24/7 Academic Companion'}
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              {isAr ? 'تركيز فوري • تصحيح الأخطاء • جداول مراجعة ذكية' : 'Focus Engine • Mistake Clinic • Smart Timetables'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)]">
            {isAr ? 'غرفة المذاكرة اليومية وتتبع التقدم' : 'Student Daily Study Room & Companion'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1 max-w-2xl">
            {isAr
              ? 'صُممت هذه المساحة لتكون رفيقك الأكاديمي الدائم: حافظ على تركيزك بجلسات بومودورو، عالج ثغراتك وأخطائك الامتحانية فور وقوعها، وخطط لمواعيد مراجعتك بدقة.'
              : 'Engineered as your dedicated study room: maintain peak concentration with Pomodoro, cure test errors in the Mistake Clinic, and generate exam battle plans.'}
          </p>
        </div>

        {/* Quick Chat Shortcut */}
        {onNavigateToChat && (
          <button
            onClick={() => onNavigateToChat(isAr ? 'آدم، أريدك أن تمتحنني شفهياً في مادتي الآن وتساعدني على التركيز' : 'Adam, act as my oral study examiner right now and quiz me.')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'تسميع شفوي فوري مع آدم' : 'Start Oral Exam with Adam'}</span>
          </button>
        )}
      </div>

      {/* Grid: Left Column (Pomodoro & Goals) | Right Column (Mistake Doctor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pomodoro Focus Suite */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  {isAr ? 'مؤقت التركيز النشط (Pomodoro)' : 'Active Focus Pomodoro'}
                </h3>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] text-[var(--foreground-muted)] transition-colors"
                title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Mode Switchers */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--surface-sunken)]">
              <button
                onClick={() => switchPomodoro('study')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  pomodoroMode === 'study'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {isAr ? 'جلسة مذاكرة (25 د)' : 'Study (25m)'}
              </button>
              <button
                onClick={() => switchPomodoro('shortBreak')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  pomodoroMode === 'shortBreak'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                {isAr ? 'استراحة (5 د)' : 'Break (5m)'}
              </button>
              <button
                onClick={() => switchPomodoro('longBreak')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  pomodoroMode === 'longBreak'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {isAr ? 'راحة طويلة (15 د)' : 'Long Rest (15m)'}
              </button>
            </div>

            {/* Big Digit Timer Display */}
            <div className="text-center py-6">
              <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-[var(--foreground)]">
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                {pomodoroMode === 'study'
                  ? (isAr ? 'ركّز بنسبة 100% في مهمة واحدة، وتجنّب أي مشتتات حتى انتهاء الرنين' : 'Maintain 100% focus on a single task until the chime rings')
                  : (isAr ? 'استرخِ، خذ نفساً عميقاً واشرب ماءً' : 'Stretch, breathe deeply, and hydrate')}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg transition-all ${
                  timerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 scale-105'
                }`}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'بدء التركيز' : 'Start Focus')}</span>
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  if (pomodoroMode === 'study') setTimeLeft(25 * 60);
                  if (pomodoroMode === 'shortBreak') setTimeLeft(5 * 60);
                  if (pomodoroMode === 'longBreak') setTimeLeft(15 * 60);
                }}
                className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                title={isAr ? 'إعادة ضبط' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Completed sessions indicator */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
              <span>{isAr ? 'جلسات التركيز المكتملة اليوم:' : 'Completed sessions today:'}</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                {completedSessions} {isAr ? 'جلسة' : 'sessions'}
              </span>
            </div>
          </div>

          {/* Micro-Goals Checklist */}
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  {isAr ? 'مهام جلسة اليوم (Micro-Goals)' : 'Session Micro-Goals'}
                </h3>
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">
                {tasks.filter((t) => t.completed).length} / {tasks.length} {isAr ? 'منجز' : 'done'}
              </span>
            </div>

            {/* Task Add Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder={isAr ? 'أضف هدفاً صغيراً للمذاكرة (مثال: حفظ قانون فاراداي)...' : 'Add a micro study target...'}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)] focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={addTask}
                disabled={!newTaskInput.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    task.completed
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-[var(--foreground-muted)] line-through'
                      : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--foreground)]'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
                    )}
                    <span className="text-xs font-medium">{task.title}</span>
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-[var(--foreground-muted)] hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mistake Clinic & Exam Doctor */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  {isAr ? 'عيادة تشخيص أخطاء الفروض والامتحانات' : 'Exam Mistake Clinic & Diagnosis'}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {isAr
                    ? 'أخطأت في تمرين؟ اكتب السؤال وإجابتك الخاطئة ليُشرّح آدم سبب الخطأ ويمنحك شفرة لمنع تكراره.'
                    : 'Analyze why your answer was wrong, extract root misconception, and build intuitive immunity.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--foreground-muted)] block mb-1">
                  {isAr ? 'نص السؤال أو المسألة:' : 'Question text or problem statement:'}
                </label>
                <textarea
                  value={mistakeQuestion}
                  onChange={(e) => setMistakeQuestion(e.target.value)}
                  rows={2}
                  placeholder={isAr ? 'مثال: احسب نهاية f(x) = (x² - 4)/(x - 2) عند x -> 2 أو تمرين توازن جملة فيزيائية...' : 'E.g. calculate limit of (x^2 - 4)/(x - 2) as x -> 2...'}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)] focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-rose-400 block mb-1">
                    {isAr ? 'إجابتك أو ما قمت به (الذي كان خاطئاً):' : 'Your incorrect answer / steps:'}
                  </label>
                  <input
                    type="text"
                    value={studentWrongAnswer}
                    onChange={(e) => setStudentWrongAnswer(e.target.value)}
                    placeholder={isAr ? 'مثال: كتبت 0/0 وانتهيت، أو نسيت إشارة السالب...' : 'E.g. wrote 0/0 and stopped...'}
                    className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)] focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                    {isAr ? 'الإجابة النموذجية (إن كانت معروفة لديك):' : 'Correct answer (if provided):'}
                  </label>
                  <input
                    type="text"
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value)}
                    placeholder={isAr ? 'مثال: الناتج الصحيح هو 4...' : 'E.g. correct answer is 4...'}
                    className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzeMistake}
                disabled={mistakeLoading || !mistakeQuestion.trim() || !studentWrongAnswer.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center justify-center gap-2 transition-all"
              >
                {mistakeLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAr ? 'تشريح الخطأ واستخلاص القاعدة الذهبية' : 'Diagnose Mistake & Build Rule'}</span>
              </button>
            </div>

            {/* Mistake Output Card */}
            {mistakeAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3"
              >
                <div>
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide block">
                    {isAr ? '🩺 التشخيص الأكاديمي لجذر الخطأ:' : 'Academic Diagnosis:'}
                  </span>
                  <p className="text-xs text-[var(--foreground)] mt-1">{mistakeAnalysis.diagnosis}</p>
                </div>

                {mistakeAnalysis.stepByStepFix && (
                  <div className="pt-2 border-t border-amber-500/20">
                    <span className="text-[11px] font-black text-emerald-400 block">
                      {isAr ? '✅ مسار الحل السليم خطوة بخطوة:' : 'Step-by-step Correct Solution:'}
                    </span>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1 whitespace-pre-line leading-relaxed">
                      {mistakeAnalysis.stepByStepFix}
                    </p>
                  </div>
                )}

                {mistakeAnalysis.memoryAnchor && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[11px] font-black text-emerald-300 block mb-1">
                      {isAr ? '🧠 الشفرة الذهبية لتفادي هذا الفخ في الامتحان:' : 'Mental Anchor & Exam Guard:'}
                    </span>
                    <p className="text-xs font-semibold text-emerald-200">{mistakeAnalysis.memoryAnchor}</p>
                  </div>
                )}

                {mistakeAnalysis.similarPracticeQuestion && (
                  <div className="pt-2 border-t border-amber-500/20 text-xs">
                    <span className="font-bold text-cyan-400 block mb-1">
                      {isAr ? '🎯 تمرين تدريبي فوري لتثبيت الفهم:' : 'Immediate Practice Question:'}
                    </span>
                    <p className="text-[var(--foreground-muted)]">{mistakeAnalysis.similarPracticeQuestion}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Quick Study Schedule Builder */}
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  {isAr ? 'مخطط جدول المراجعة التكتيكي للامتحان' : 'Exam Battle Plan & Schedule Architect'}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {isAr ? 'جدول أسبوعي مخصص مبني على الأيام المتبقية والمواد ذات الأولوية' : 'Customized weekly schedule calibrated to countdown and priority subjects'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--foreground-muted)] block mb-1">
                  {isAr ? 'الامتحان المستهدف:' : 'Target Exam:'}
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--foreground-muted)] block mb-1">
                  {isAr ? 'المواد ذات الأولوية القصوى:' : 'Priority Subjects:'}
                </label>
                <input
                  type="text"
                  value={focusSubjects}
                  onChange={(e) => setFocusSubjects(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--foreground-muted)] block mb-1">
                  {isAr ? 'ساعات المذاكرة المتاحة يومياً:' : 'Available hours/day:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--foreground-muted)] block mb-1">
                  {isAr ? 'الأيام المتبقية حتى الامتحان:' : 'Days until exam:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={daysUntilExam}
                  onChange={(e) => setDaysUntilExam(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-xs text-[var(--foreground)]"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateStudyPlan}
              disabled={planLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center justify-center gap-2 transition-all"
            >
              {planLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isAr ? 'توليد خطة المراجعة الاستراتيجية' : 'Architect Strategic Timetable'}</span>
            </button>

            {studyPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] space-y-3 max-h-80 overflow-y-auto"
              >
                <div>
                  <span className="text-[11px] font-bold text-purple-400 block mb-1">
                    {isAr ? 'الاستراتيجية الكبرى:' : 'Core Strategy:'}
                  </span>
                  <p className="text-xs text-[var(--foreground)]">{studyPlan.strategy}</p>
                </div>

                {Array.isArray(studyPlan.weeklySchedule) && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <span className="text-[11px] font-bold text-[var(--foreground)] block">
                      {isAr ? 'الهيكل الأسبوعي:' : 'Weekly Breakdown:'}
                    </span>
                    {studyPlan.weeklySchedule.map((item: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[var(--surface)] text-xs border border-[var(--border)]">
                        <span className="font-bold text-purple-300 block">{item.day}</span>
                        {item.morning && (
                          <div className="text-[11px] text-[var(--foreground-muted)] mt-1">
                            <span className="font-semibold text-emerald-400">{isAr ? 'صباحاً: ' : 'Morning: '}</span>
                            {item.morning}
                          </div>
                        )}
                        {item.evening && (
                          <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                            <span className="font-semibold text-cyan-400">{isAr ? 'مساءً: ' : 'Evening: '}</span>
                            {item.evening}
                          </div>
                        )}
                        {Array.isArray(item.slots) && (
                          <div className="mt-1 space-y-1">
                            {item.slots.map((s: any, j: number) => (
                              <div key={j} className="text-[11px] text-[var(--foreground-muted)]">
                                <span className="font-semibold text-amber-300">{s.time}</span> - {s.subject} ({s.activity})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(studyPlan.goldenAdvice) && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                      {isAr ? 'نصائح ذهبية مثبتة علمياً:' : 'Golden Rules for Peak Retention:'}
                    </span>
                    <ul className="list-disc list-inside text-xs text-[var(--foreground-muted)] space-y-1">
                      {studyPlan.goldenAdvice.map((adv: string, idx: number) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
