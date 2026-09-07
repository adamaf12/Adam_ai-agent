import React, { useEffect, useState, useMemo } from 'react';
import {
  Zap,
  Brain,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Search,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  Code,
  Calculator,
  Languages,
  Database,
  Terminal,
} from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';

interface HermesSkill {
  id: string;
  name: string;
  displayNameAr: string;
  category: 'coding' | 'math' | 'creativity' | 'data' | 'system' | 'reasoning' | 'ui';
  description: string;
  triggers: string[];
  proceduralSteps: string[];
  bestPractices: string[];
  acquiredAt: number;
  lastUsedAt: number;
  usageCount: number;
  successRate: number;
  level: number;
  origin: 'builtin' | 'autonomous_learned';
}

interface HermesStats {
  totalSkills: number;
  autonomousSkillsLearned: number;
  totalExecutions: number;
  averageMasteryLevel: number;
  lastEvolvedAt: number;
  topSkills: Array<{ name: string; level: number; usageCount: number }>;
}

interface HermesDashboardProps {
  language: Language;
  onNavigate?: (view: ViewId) => void;
  onRunPrompt?: (prompt: string) => void;
}

export function HermesDashboard({ language, onNavigate, onRunPrompt }: HermesDashboardProps) {
  const isAr = language === 'ar';
  const [skills, setSkills] = useState<HermesSkill[]>([]);
  const [stats, setStats] = useState<HermesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSkillModal, setActiveSkillModal] = useState<HermesSkill | null>(null);

  const fetchHermesData = async () => {
    setLoading(true);
    try {
      const [skillsRes, statsRes] = await Promise.all([
        fetch('/api/hermes/skills').then(r => r.json()),
        fetch('/api/hermes/stats').then(r => r.json()),
      ]);
      if (skillsRes.ok && Array.isArray(skillsRes.skills)) {
        setSkills(skillsRes.skills);
      }
      if (statsRes.ok && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (e) {
      console.warn('Failed to load Hermes backend data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHermesData();
  }, []);

  const categories = [
    { id: 'all', nameAr: 'جميع المهارات', nameEn: 'All Skills', icon: Layers },
    { id: 'ui', nameAr: 'واجهات وتطبيقات', nameEn: 'UI & Live Apps', icon: Sparkles },
    { id: 'coding', nameAr: 'برمجة وخوارزميات', nameEn: 'Coding & Arch', icon: Code },
    { id: 'reasoning', nameAr: 'اللغة والاستنتاج', nameEn: 'Arabic NLP', icon: Languages },
    { id: 'math', nameAr: 'الرياضيات والعلوم', nameEn: 'Math & Logic', icon: Calculator },
    { id: 'data', nameAr: 'البيانات والمخططات', nameEn: 'Data & JSON', icon: Database },
  ];

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.displayNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.triggers.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [skills, selectedCategory, searchQuery]);

  const handleTestSkill = (skill: HermesSkill) => {
    const trigger = skill.triggers[0] || skill.name;
    const testPrompt = isAr
      ? `استخدم مهارة (${skill.displayNameAr || skill.name}) وقم بتطبيقها على: ${trigger}`
      : `Apply the Hermes skill [${skill.name}] for: ${trigger}`;
    if (onRunPrompt) {
      onRunPrompt(testPrompt);
    } else if (onNavigate) {
      onNavigate('chat');
    }
  };

  return (
    <section className="feature-page max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <Zap size={12} className="fill-current" />
              HERMES AGENT ENGINE v2.4
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              {isAr ? 'التعلم الذاتي التلقائي نشط' : 'Self-Evolution Active'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {isAr ? 'محرك هيرميس لاكتساب المهارات والتطور الذاتي' : 'Hermes Autonomous Evolution Engine'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            {isAr
              ? 'نظام ذكاء اصطناعي ذاتي التطور يكتسب مهارات برمجية وعلمية جديدة تلقائياً مع كل محادثة، ويطور كفاءته ودقته باستمرار دون الحاجة لإعادة برمجته.'
              : 'Autonomous cognitive engine that acquires new procedural skills and heuristics with every task, evolving mastery over time.'}
          </p>
        </div>

        <button
          onClick={fetchHermesData}
          type="button"
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {isAr ? 'تحديث مصفوفة المهارات' : 'Sync Skill Matrix'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{isAr ? 'إجمالي المهارات المعرفية' : 'Total Neural Skills'}</span>
            <BookOpen size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats?.totalSkills ?? skills.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'مهارات متخصصة ومصنفة' : 'Structured procedural skills'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{isAr ? 'مهارات مكتسبة ذاتياً' : 'Autonomously Learned'}</span>
            <Brain size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            +{stats?.autonomousSkillsLearned ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'تم استنباطها من تفاعلات المستخدمين' : 'Synthesized from interactions'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{isAr ? 'متوسط مستوى الإتقان' : 'Avg. Mastery Level'}</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {stats?.averageMasteryLevel ?? 8.6} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'يزداد المستوى مع تكرار النجاح' : 'Increases with successful runs'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{isAr ? 'عمليات التوليد والتنفيذ' : 'Autonomous Invocations'}</span>
            <TrendingUp size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{stats?.totalExecutions ?? 184}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'عمليات تعزيز وحقن للمهارات' : 'Augmented skill prompt dispatches'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon size={13} />
                {isAr ? cat.nameAr : cat.nameEn}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن مهارة أو كلمة مفتاحية…' : 'Search skills or keywords…'}
            className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map(skill => {
          const isAutonomous = skill.origin === 'autonomous_learned';
          return (
            <article
              key={skill.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isAutonomous
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {isAutonomous ? (isAr ? 'مكتسبة ذاتياً' : 'Autonomous') : (isAr ? 'مهارة أساسية' : 'Core Matrix')}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
                    <Award size={13} />
                    <span>Lvl {skill.level}/10</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                  {isAr ? skill.displayNameAr || skill.name : skill.name}
                </h3>

                <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>

                {/* Triggers */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {skill.triggers.slice(0, 4).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800"
                    >
                      #{t}
                    </span>
                  ))}
                  {skill.triggers.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">+{skill.triggers.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSkillModal(skill)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {isAr ? 'عرض التفاصيل والقواعد' : 'View Rules'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSkill(skill)}
                  className="px-3 py-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>{isAr ? 'تجربة في المحادثة' : 'Test Skill'}</span>
                  <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredSkills.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400 text-xs">
          {isAr ? 'لم يتم العثور على مهارات مطابقة للبحث.' : 'No skills found matching search.'}
        </div>
      )}

      {/* Skill Modal */}
      {activeSkillModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveSkillModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                  {activeSkillModal.category} • Level {activeSkillModal.level}/10
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {isAr ? activeSkillModal.displayNameAr || activeSkillModal.name : activeSkillModal.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveSkillModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">{activeSkillModal.description}</p>

            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Terminal size={13} className="text-emerald-400" />
                {isAr ? 'الخطوات والإجراءات المتبعة (Procedural Steps):' : 'Procedural Execution Steps:'}
              </h4>
              <ul className="space-y-1.5">
                {activeSkillModal.proceduralSteps.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-400" />
                {isAr ? 'أفضل الممارسات المكتسبة (Best Practices):' : 'Acquired Best Practices:'}
              </h4>
              <ul className="space-y-1">
                {activeSkillModal.bestPractices.map((bp, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleTestSkill(activeSkillModal);
                  setActiveSkillModal(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Zap size={13} className="fill-current" />
                {isAr ? 'تجربة هذه المهارة الآن في المحادثة' : 'Test This Skill in Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
