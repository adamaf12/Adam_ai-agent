import { useState, useMemo } from 'react';
import {
  GraduationCap,
  Calculator,
  CalendarCheck,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Send,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { Language } from '../../core/domain';

interface AcademicStudioProps {
  language: Language;
  onNavigateToChat?: (prompt: string) => void;
}

interface GPACourse {
  id: string;
  name: string;
  credits: number;
  grade: string; // A, B, C, D, F
}

interface LectureItem {
  id: string;
  course: string;
  room: string;
  time: string;
  day: string;
}

interface ExamItem {
  id: string;
  course: string;
  date: string;
  time: string;
  location: string;
}

interface StudentTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};

export function AcademicStudio({ language }: AcademicStudioProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gpa' | 'schedule' | 'exams' | 'tutor'>('dashboard');

  // --- GPA Calculator State ---
  const [courses, setCourses] = useState<GPACourse[]>([
    { id: '1', name: isAr ? 'هندسة البرمجيات المتقدمة' : 'Advanced Software Engineering', credits: 4, grade: 'A' },
    { id: '2', name: isAr ? 'أنظمة الذكاء الاصطناعي' : 'Artificial Intelligence Systems', credits: 3, grade: 'A+' },
    { id: '3', name: isAr ? 'قواعد البيانات الموزعة' : 'Distributed Databases', credits: 3, grade: 'B+' },
  ]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('3');
  const [newCourseGrade, setNewCourseGrade] = useState('A');

  const calculatedGPA = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach((c) => {
      const gp = GRADE_POINTS[c.grade] ?? 3.0;
      totalPoints += gp * c.credits;
      totalCredits += c.credits;
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  }, [courses]);

  const addCourse = () => {
    if (!newCourseName.trim()) return;
    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        name: newCourseName.trim(),
        credits: Number(newCourseCredits) || 3,
        grade: newCourseGrade,
      },
    ]);
    setNewCourseName('');
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  // --- Lecture Schedule State ---
  const [lectures, setLectures] = useState<LectureItem[]>([
    { id: '1', course: isAr ? 'خوارزميات متقدمة' : 'Advanced Algorithms', room: 'قاعة 302', time: '09:00 AM', day: isAr ? 'الأحد' : 'Sunday' },
    { id: '2', course: isAr ? 'أمن الشبكات' : 'Network Security', room: 'مختبر الحاسوب 4', time: '11:00 AM', day: isAr ? 'الثلاثاء' : 'Tuesday' },
  ]);
  const [newLectCourse, setNewLectCourse] = useState('');
  const [newLectRoom, setNewLectRoom] = useState('');
  const [newLectTime, setNewLectTime] = useState('');
  const [newLectDay, setNewLectDay] = useState(isAr ? 'الأحد' : 'Sunday');

  const addLecture = () => {
    if (!newLectCourse.trim()) return;
    setLectures([
      ...lectures,
      {
        id: Date.now().toString(),
        course: newLectCourse.trim(),
        room: newLectRoom.trim() || 'Hall A',
        time: newLectTime.trim() || '10:00 AM',
        day: newLectDay,
      },
    ]);
    setNewLectCourse('');
    setNewLectRoom('');
    setNewLectTime('');
  };

  const removeLecture = (id: string) => {
    setLectures(lectures.filter((l) => l.id !== id));
  };

  // --- Exam Countdowns State ---
  const [exams, setExams] = useState<ExamItem[]>([
    { id: '1', course: isAr ? 'مشروع التخرج PFE' : 'PFE Thesis Defense', date: '2026-06-15', time: '10:00 AM', location: 'المدرج الرئيسي' },
    { id: '2', course: isAr ? 'اختبار الذكاء الاصطناعي النهائي' : 'AI Final Exam', date: '2026-05-20', time: '09:00 AM', location: 'قاعة الامتحانات 2' },
  ]);
  const [newExamCourse, setNewExamCourse] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamLocation, setNewExamLocation] = useState('');

  const addExam = () => {
    if (!newExamCourse.trim() || !newExamDate) return;
    setExams([
      ...exams,
      {
        id: Date.now().toString(),
        course: newExamCourse.trim(),
        date: newExamDate,
        time: '09:00 AM',
        location: newExamLocation.trim() || 'Campus',
      },
    ]);
    setNewExamCourse('');
    setNewExamDate('');
    setNewExamLocation('');
  };

  const removeExam = (id: string) => {
    setExams(exams.filter((e) => e.id !== id));
  };

  // --- Student Tasks State ---
  const [tasks, setTasks] = useState<StudentTask[]>([
    { id: '1', title: isAr ? 'تسليم تقرير PFE الأولي' : 'Submit initial PFE report', dueDate: '2026-05-01', completed: false },
    { id: '2', title: isAr ? 'حل ورقة تمارين خوارزميات بيـثون' : 'Solve Python algorithm assignment', dueDate: '2026-04-25', completed: true },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle.trim(), dueDate: 'قريباً', completed: false }]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  // --- AI Study Assistant ---
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);

  const handleAskStudyAI = async () => {
    if (!chatPrompt.trim()) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch('/api/academic/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chatPrompt,
          stage: 'university',
          subject: 'University Studies',
          language,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setChatResponse(data.solution || data.text);
      }
    } catch {
      setChatResponse(isAr ? 'عذراً، حدث خطأ أثناء الاتصال بمساعد الدراسة.' : 'Error communicating with study assistant.');
    } finally {
      setChatLoading(false);
    }
  };

  // GPA Progress Ring Calculations
  const gpaNum = Number(calculatedGPA) || 0;
  const gpaPercentage = Math.min(100, Math.max(0, (gpaNum / 4.0) * 100));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gpaPercentage / 100) * circumference;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-[var(--text)]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Student Only Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-[var(--surface)] p-6 sm:p-8 mb-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/35 text-purple-300 text-xs font-bold mb-3">
              <GraduationCap className="w-4 h-4" />
              <span>{isAr ? 'وضع الطلبة الجامعيين الحصري (Student-Only Mode)' : 'Exclusive University Student Hub'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-2">
              {isAr ? 'مساعدك الأكاديمي الجامعي الشخصي' : 'Your Personal University Academic Companion'}
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
              {isAr
                ? 'منصة مخصصة حصرياً لطلبة الجامعة لتبسيط الحياة الأكاديمية: تتبع المعدل التراكمي (GPA)، تنظيم المحاضرات، إدارة الامتحانات ومهام التخرج.'
                : 'Dedicated exclusively to university students to master academic life: GPA tracking, lecture scheduling, exam countdowns, and assignment management.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center min-w-[130px]">
              <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">{calculatedGPA}</div>
              <div className="text-xs font-semibold text-[var(--muted)] mt-1">{isAr ? 'المعدل الفصلي GPA' : 'Current GPA'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
          {[
            { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: BookOpen },
            { id: 'gpa', labelAr: 'حاسبة المعدل GPA', labelEn: 'GPA Calculator', icon: Calculator },
            { id: 'schedule', labelAr: 'جدول المحاضرات', labelEn: 'Lectures', icon: CalendarCheck },
            { id: 'exams', labelAr: 'الامتحانات والمواعيد', labelEn: 'Exams & Countdowns', icon: Clock },
            { id: 'tutor', labelAr: 'مساعد الدراسة الذكي', labelEn: 'AI Study Tutor', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
                  isActive
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Views */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual GPA Progress Ring Tracker */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-400" />
                  <span>{isAr ? 'مؤشر المعدل التراكمي المرئي' : 'Visual GPA Tracker'}</span>
                </h3>
                <button onClick={() => setActiveTab('gpa')} className="text-xs text-purple-400 hover:underline cursor-pointer">
                  {isAr ? 'إدارة المواد ←' : 'Manage →'}
                </button>
              </div>

              {/* Circular Progress Ring */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-[var(--surface-2)]"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-purple-500 transition-all duration-700 ease-out"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-[var(--text)] font-mono">{calculatedGPA}</span>
                    <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">/ 4.0 GPA</span>
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)] mt-3">
                  {isAr ? `إجمالي المقررات: ${courses.length} مواد` : `Total Courses: ${courses.length}`}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--muted)]">{isAr ? 'مهام سريعة:' : 'Quick Tasks:'}</span>
                {tasks.slice(0, 3).map((t) => (
                  <div key={t.id} onClick={() => toggleTask(t.id)} className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] cursor-pointer hover:border-purple-500/50 transition">
                    {t.completed ? <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" /> : <Square className="w-4 h-4 text-[var(--muted)] shrink-0" />}
                    <span className={`text-xs ${t.completed ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Lectures */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'جدول المحاضرات' : 'Lecture Schedule'}</span>
                </h3>
                <button onClick={() => setActiveTab('schedule')} className="text-xs text-emerald-400 hover:underline cursor-pointer">
                  {isAr ? 'عرض الكل ←' : 'View All →'}
                </button>
              </div>
              <div className="space-y-2.5">
                {lectures.length === 0 ? (
                  <div className="text-xs text-[var(--muted)] py-6 text-center">{isAr ? 'لا توجد محاضرات مضافة.' : 'No lectures scheduled.'}</div>
                ) : (
                  lectures.slice(0, 4).map((l) => (
                    <div key={l.id} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[var(--text)]">{l.course}</div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5">{l.day} • {l.room}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold">{l.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Exams */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>{isAr ? 'الامتحانات القادمة' : 'Upcoming Exams'}</span>
                </h3>
                <button onClick={() => setActiveTab('exams')} className="text-xs text-rose-400 hover:underline cursor-pointer">
                  {isAr ? 'إدارة المواعيد ←' : 'Manage →'}
                </button>
              </div>
              <div className="space-y-2.5">
                {exams.length === 0 ? (
                  <div className="text-xs text-[var(--muted)] py-6 text-center">{isAr ? 'لا توجد امتحانات مسجلة.' : 'No exams scheduled.'}</div>
                ) : (
                  exams.slice(0, 4).map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[var(--text)]">{e.course}</div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5">{e.location}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-mono font-bold">{e.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gpa' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{isAr ? 'حاسبة المعدل الفصلي والتراكمي (GPA)' : 'GPA Calculator & Tracker'}</h2>
                <p className="text-xs text-[var(--muted)]">{isAr ? 'أدخل مقرراتك الجامعية وساعاتك لحساب معدلك بدقة.' : 'Add your university courses and credits to calculate GPA.'}</p>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-center">
                <div className="text-xs font-semibold text-purple-300">{isAr ? 'المعدل المحسوب' : 'Calculated GPA'}</div>
                <div className="text-2xl font-black text-purple-400 font-mono">{calculatedGPA} / 4.0</div>
              </div>
            </div>

            {/* Add Course Form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <input
                type="text"
                placeholder={isAr ? 'اسم المادة (مثال: خوارزميات)' : 'Course Name'}
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <select
                value={newCourseCredits}
                onChange={(e) => setNewCourseCredits(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              >
                <option value="1">1 {isAr ? 'ساعة معتمدة' : 'Credit'}</option>
                <option value="2">2 {isAr ? 'ساعات معتمدة' : 'Credits'}</option>
                <option value="3">3 {isAr ? 'ساعات معتمدة' : 'Credits'}</option>
                <option value="4">4 {isAr ? 'ساعات معتمدة' : 'Credits'}</option>
                <option value="5">5 {isAr ? 'ساعات معتمدة' : 'Credits'}</option>
              </select>
              <select
                value={newCourseGrade}
                onChange={(e) => setNewCourseGrade(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none font-mono font-bold"
              >
                {Object.keys(GRADE_POINTS).map((g) => (
                  <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>
                ))}
              </select>
              <button
                onClick={addCourse}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAr ? 'إضافة المادة' : 'Add Course'}</span>
              </button>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                    <th className="py-3 px-4 text-start">{isAr ? 'اسم المادة' : 'Course Name'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'الساعات المعتمدة' : 'Credits'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'التقدير' : 'Grade'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'النقاط' : 'Points'}</th>
                    <th className="py-3 px-4 text-end">{isAr ? 'إجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {courses.map((c) => {
                    const gp = GRADE_POINTS[c.grade] ?? 3.0;
                    return (
                      <tr key={c.id} className="hover:bg-[var(--surface-2)] transition">
                        <td className="py-3 px-4 font-bold text-[var(--text)]">{c.name}</td>
                        <td className="py-3 px-4 text-center font-mono">{c.credits}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-purple-400">{c.grade}</td>
                        <td className="py-3 px-4 text-center font-mono">{(gp * c.credits).toFixed(1)}</td>
                        <td className="py-3 px-4 text-end">
                          <button onClick={() => removeCourse(c.id)} className="p-1 rounded-lg text-[var(--muted)] hover:text-rose-400 transition cursor-pointer" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{isAr ? 'جدول المحاضرات الأسبوعي' : 'Weekly Lecture Schedule'}</h2>
                <p className="text-xs text-[var(--muted)]">{isAr ? 'نظم مواعيد محاضراتك وقاعاتها الدراسية بسهولة.' : 'Organize your weekly university lectures and rooms.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <input
                type="text"
                placeholder={isAr ? 'اسم المادة' : 'Course'}
                value={newLectCourse}
                onChange={(e) => setNewLectCourse(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <input
                type="text"
                placeholder={isAr ? 'رقم القاعة (مثال: Hall A)' : 'Room / Hall'}
                value={newLectRoom}
                onChange={(e) => setNewLectRoom(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <input
                type="text"
                placeholder={isAr ? 'الوقت (مثال: 09:00 AM)' : 'Time'}
                value={newLectTime}
                onChange={(e) => setNewLectTime(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <select
                value={newLectDay}
                onChange={(e) => setNewLectDay(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              >
                {[isAr ? 'الأحد' : 'Sunday', isAr ? 'الإثنين' : 'Monday', isAr ? 'الثلاثاء' : 'Tuesday', isAr ? 'الأربعاء' : 'Wednesday', isAr ? 'الخميس' : 'Thursday'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                onClick={addLecture}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAr ? 'إضافة محاضرة' : 'Add Lecture'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lectures.map((l) => (
                <div key={l.id} className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[var(--text)] text-base">{l.course}</div>
                    <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">{l.day}</span>
                      <span>{l.room}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[var(--text)]">{l.time}</span>
                    <button onClick={() => removeLecture(l.id)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-400 transition cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{isAr ? 'الامتحانات ومواعيد التخرج' : 'Exams & Countdowns'}</h2>
                <p className="text-xs text-[var(--muted)]">{isAr ? 'تتبع مواعيد امتحاناتك النهائية ومناقشات مشاريع التخرج.' : 'Track your midterm and final exam schedules.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <input
                type="text"
                placeholder={isAr ? 'اسم الاختبار / المادة' : 'Exam Name'}
                value={newExamCourse}
                onChange={(e) => setNewExamCourse(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <input
                type="date"
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <input
                type="text"
                placeholder={isAr ? 'مكان الاختبار / القاعة' : 'Location'}
                value={newExamLocation}
                onChange={(e) => setNewExamLocation(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none"
              />
              <button
                onClick={addExam}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAr ? 'إضافة موعد' : 'Add Exam'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((e) => (
                <div key={e.id} className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[var(--text)] text-base">{e.course}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">{e.location} • {e.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-mono font-bold">{e.date}</span>
                    <button onClick={() => removeExam(e.id)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-400 transition cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">{isAr ? 'مساعد الدراسة الجامعي الذكي (متصل بالإنترنت)' : 'AI Study Assistant (Live Grounded)'}</h2>
              <p className="text-xs text-[var(--muted)]">{isAr ? 'اطرح أي مسألة أو مفهوم جامعي للحصول على شرح مفصل خطوة بخطوة وحل مدعوم بالإنترنت.' : 'Ask any university question or concept for a detailed, internet-grounded explanation.'}</p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mx-2" />
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskStudyAI()}
                placeholder={isAr ? 'اسأل عن خوارزمية، معادلة تفاضلية، أو مفهوم برمجي...' : 'Ask about any algorithm, equation or concept...'}
                className="flex-1 bg-transparent border-0 outline-none text-xs text-[var(--text)] placeholder-[var(--muted)]"
              />
              <button
                onClick={handleAskStudyAI}
                disabled={chatLoading || !chatPrompt.trim()}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {chatLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isAr ? 'إرسال' : 'Ask'}</span>
              </button>
            </div>

            {chatResponse && (
              <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>{isAr ? 'إجابة مساعد الدراسة:' : 'Study Assistant Answer:'}</span>
                </div>
                <div className="text-xs sm:text-sm text-[var(--text)] whitespace-pre-line leading-relaxed font-mono">
                  {chatResponse}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
