import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  X,
  Calculator,
  BookOpen,
  AlertTriangle,
  Library,
  HelpCircle,
  Clock,
  Sparkles,
  Send,
  Search,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import type { AcademicStage } from '../academic/types';
import { STAGE_CURRICULUM_DATA, WORLD_DIGITAL_LIBRARIES } from '../academic/worldLibrariesData';
import { FormulaCheatSheetsView } from '../academic/FormulaCheatSheetsView';
import { StudentCompanionView } from '../academic/StudentCompanionView';

interface ChatAcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSendPrompt: (prompt: string) => void;
}

export function ChatAcademicModal({
  isOpen,
  onClose,
  language,
  onSendPrompt,
}: ChatAcademicModalProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'solver' | 'formulas' | 'mistakes' | 'stages' | 'libraries'>('solver');
  const [selectedStage, setSelectedStage] = useState<AcademicStage>('secondary');
  const [customProblem, setCustomProblem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('الرياضيات والفيزياء');

  // Quick prompt execution and close modal
  const handleTriggerPrompt = (prompt: string) => {
    onSendPrompt(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[860px] rounded-2xl border border-indigo-500/30 bg-slate-900/95 text-slate-100 shadow-2xl shadow-indigo-950/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40 shadow-inner">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isAr ? 'المرافق الأكاديمي والمكتبة الذكية' : 'Academic Companion & Library Hub'}
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {isAr ? 'مدمج في المحادثة ⚡' : 'Integrated in Chat ⚡'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'حلال المسائل الخارق، فخاخ الامتحانات، كناش القوانين، والمكتبات العالمية'
                    : 'Ultimate problem solver, exam traps, verified formula vault & global libraries'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 border-b border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('solver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'solver'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Sparkles size={14} />
              <span>{isAr ? 'حلال المسائل والكويزات' : 'Solver & Quizzes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('formulas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'formulas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Calculator size={14} />
              <span>{isAr ? 'كناش القوانين وصيغ المعادلات' : 'Formula Vault'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mistakes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'mistakes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <AlertTriangle size={14} />
              <span>{isAr ? 'عيادة أخطاء الامتحانات' : 'Exam Mistake Clinic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'stages'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <BookOpen size={14} />
              <span>{isAr ? 'المناهج والأطوار الدراسية' : 'Curricula & Tiers'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('libraries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'libraries'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Library size={14} />
              <span>{isAr ? 'المكتبات الرقمية العالمية' : 'World Libraries'}</span>
            </button>
          </div>

          {/* Stage Selector Sub-Bar (For formulas & stages) */}
          {(activeTab === 'formulas' || activeTab === 'stages') && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-slate-900 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium">
                {isAr ? 'الطور الدراسي المستهدف:' : 'Target Academic Tier:'}
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'primary', labelAr: 'الابتدائي', labelEn: 'Primary' },
                  { id: 'middle', labelAr: 'المتوسط (BEM)', labelEn: 'Middle School' },
                  { id: 'secondary', labelAr: 'الثانوي (البكالوريا)', labelEn: 'Baccalaureate' },
                  { id: 'university', labelAr: 'الجامعي والبحث', labelEn: 'University' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedStage(tier.id as AcademicStage)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      selectedStage === tier.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? tier.labelAr : tier.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* 1. SOLVER & QUIZZES */}
            {activeTab === 'solver' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Fast Solver Input Card */}
                <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/70 p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles size={18} />
                    <h4 className="font-bold text-sm">
                      {isAr ? 'اطرح مسألتك أو معادلتك أو مفهومك ليحله آدم فوراً في الشات' : 'Ask any problem, formula, or concept for Adam to solve in chat'}
                    </h4>
                  </div>
                  <textarea
                    rows={3}
                    value={customProblem}
                    onChange={(e) => setCustomProblem(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب نص التمرين أو المعادلة هنا... مثال: احسب نهاية f(x) = (ln(1+2x))/x عندما يؤول x إلى 0، مع فحص فخاخ الامتحانات والتحقق من النتيجة.'
                        : 'Type problem or equation... Example: Solve limit of f(x) = (ln(1+2x))/x as x approaches 0, with step-by-step reasoning and exam traps check.'
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{isAr ? 'المادة:' : 'Subject:'}</span>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="الرياضيات">{isAr ? 'الرياضيات والتحليل' : 'Mathematics'}</option>
                        <option value="الفيزياء">{isAr ? 'الفيزياء والميكانيكا' : 'Physics'}</option>
                        <option value="الكيمياء">{isAr ? 'الكيمياء والمحاليل' : 'Chemistry'}</option>
                        <option value="العلوم الطبيعية">{isAr ? 'علوم الطبيعة والحياة' : 'Biology'}</option>
                        <option value="الخوارزميات والبرمجة">{isAr ? 'الخوارزميات والذكاء الاصطناعي' : 'Algorithms & CS'}</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={!customProblem.trim()}
                      onClick={() => {
                        const prompt = isAr
                          ? `حل لي هذه المسألة الأكاديمية في مادة ${selectedSubject} بخطوات مفصلة وبرهان صارم، وحدد القانون المطبق، وفخاخ الامتحانات الشائعة، مع توليد بطاقة أكاديمية ملخصة:\n\n${customProblem.trim()}`
                          : `Solve this academic problem in ${selectedSubject} with step-by-step rigorous deduction, state the governing laws, highlight exam traps, and provide a summary academic card:\n\n${customProblem.trim()}`;
                        handleTriggerPrompt(prompt);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-600/30"
                    >
                      <Send size={14} />
                      <span>{isAr ? 'إرسال وحل في المحادثة 🚀' : 'Solve in Chat 🚀'}</span>
                    </button>
                  </div>
                </div>

                {/* Pre-packaged High-IQ Academic Demonstrations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAr ? 'نماذج اختبارات وحلول نموذجية فورية' : 'Instant Academic Power Prompts'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        titleAr: 'حل نهاية مركبة بالتقريب التآلفي',
                        titleEn: 'Complex Limit & Taylor Approximation',
                        prompt: 'احسب نهاية f(x) = (e^(3x) - 1) / sin(2x) عندما يؤول x إلى 0، مع الشرح الهندسي والبرهان الرياضي وفخاخ الامتحانات.',
                        badge: 'رياضيات بكالوريا',
                      },
                      {
                        titleAr: 'الميكانيكا: قذيفة في حقل الجاذبية',
                        titleEn: 'Projectile Motion & Trajectory Peak',
                        prompt: 'أوجد معادلة مسار قذيفة تطلق بسرعة v0 وبزاوية ألفا، واستخرج عبارة الذروة والمدى مع التحليل البعدي للوحدات.',
                        badge: 'فيزياء متقدمة',
                      },
                      {
                        titleAr: 'الكيمياء: جدول التقدم والمعايرة',
                        titleEn: 'Titration & Limiting Reactants',
                        prompt: 'اشرح كيفية إيجاد المتفاعل المحد وزمن نصف التفاعل t_1/2 من المنحنى البياني للناقلية مع مثال عددي تطبيقي.',
                        badge: 'كيمياء تحليلية',
                      },
                      {
                        titleAr: 'كويز تفاعلي فوري في المتتاليات',
                        titleEn: 'Interactive Quiz: Sequences',
                        prompt: 'ولد لي كويز تفاعلي من 3 أسئلة دقيقة في المتتاليات الحسابية والهندسية للبكالوريا مع خيارات وتبرير الإجابة الصحيحة.',
                        badge: 'كويز فوري',
                      },
                    ].map((demo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTriggerPrompt(demo.prompt)}
                        className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-850 transition text-start shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold">
                            {demo.badge}
                          </span>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400 transition" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                          {isAr ? demo.titleAr : demo.titleEn}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {demo.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pomodoro Planner Shortcut */}
                <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/30 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        {isAr ? 'خطة مذاكرة بومودورو مخصصة' : 'Smart Pomodoro Study Plan'}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'جدول زمني مقسم لـ 4 دورات تركيز مع استراحات ذكية ومراجعة نشطة' : 'Structured 4-cycle focus blocks with active recall'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const p = isAr
                        ? 'أنشئ لي خطة مراجعة ذكية بتقنية بومودورو لمراجعة وحدتين دراسيتين مع بطاقة تفاعلية تحتوي على مؤقت وتوزيع المهام.'
                        : 'Generate a smart Pomodoro study plan for two academic units with an interactive card, timer, and task blocks.';
                      handleTriggerPrompt(p);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition whitespace-nowrap shadow-md"
                  >
                    <span>{isAr ? 'بدء الخطة' : 'Generate Plan'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. FORMULA VAULT */}
            {activeTab === 'formulas' && (
              <FormulaCheatSheetsView
                language={language}
                selectedStage={selectedStage}
                onNavigateToChat={handleTriggerPrompt}
              />
            )}

            {/* 3. EXAM MISTAKE CLINIC */}
            {activeTab === 'mistakes' && (
              <StudentCompanionView
                language={language}
                selectedStage={selectedStage}
                onNavigateToChat={handleTriggerPrompt}
              />
            )}

            {/* 4. CURRICULA & TIERS */}
            {activeTab === 'stages' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STAGE_CURRICULUM_DATA[selectedStage]?.subjects?.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-indigo-300">
                          {isAr ? sub.nameAr : sub.nameEn}
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {sub.modules.length} {isAr ? 'وحدات' : 'units'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {sub.modules.slice(0, 4).map((mod) => (
                          <div
                            key={mod.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-850 last:border-0"
                          >
                            <span className="text-slate-300 truncate max-w-[220px]">
                              {isAr ? mod.titleAr : mod.titleEn}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const p = isAr
                                  ? `اشرح لي درس "${mod.titleAr}" في مادة ${sub.nameAr} لطور ${selectedStage} بالتفصيل مع القوانين وأمثلة محلولة وفخاخ الامتحانات.`
                                  : `Explain the lesson "${mod.titleEn}" in ${sub.nameEn} for ${selectedStage} level with formulas, solved examples, and exam traps.`;
                                handleTriggerPrompt(p);
                              }}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition whitespace-nowrap"
                            >
                              {isAr ? 'اسأل في الشات ↗' : 'Ask in Chat ↗'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. WORLD DIGITAL LIBRARIES */}
            {activeTab === 'libraries' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {WORLD_DIGITAL_LIBRARIES.slice(0, 12).map((lib) => (
                    <div
                      key={lib.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/40 transition space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-white">
                            {isAr ? lib.nameAr : lib.nameEn}
                          </span>
                          <span className="rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px]">
                            {lib.badge || lib.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {isAr ? lib.descriptionAr : lib.descriptionEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {lib.estimatedVolume}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const p = isAr
                                ? `ابحث لي في مكتبة ${lib.nameAr} والأوراق العلمية المحكمة عن أهم الأبحاث والمصادر حول الذكاء الاصطناعي والرياضيات المتقدمة.`
                                : `Search ${lib.nameEn} and peer-reviewed sources for top scientific works on AI and advanced mathematics.`;
                              handleTriggerPrompt(p);
                            }}
                            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                          >
                            {isAr ? 'بحث في المحادثة ↗' : 'Query in Chat ↗'}
                          </button>
                          <a
                            href={lib.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-white transition"
                            title={isAr ? 'فتح الموقع الرسمي' : 'Visit Library'}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-slate-800 bg-slate-950 text-xs text-slate-400">
            <span>
              {isAr
                ? '⚡ جميع القدرات الأكاديمية والمكتبات تعمل باستمرار وتلقائياً داخل خلفية المحادثة'
                : '⚡ All academic capabilities and libraries operate seamlessly inside chat background'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
