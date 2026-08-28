import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  CheckCircle2,
  Trash2,
  Cpu,
  Globe,
  Code,
  Github,
  Layers,
  Search,
  Star,
  ExternalLink,
  Plus,
  RefreshCw,
  Check,
  BookOpen,
} from 'lucide-react';
import { AdamSkill, IngestedGitHubRepo, getAdamSkills, saveAdamSkills, getIngestedGitHubRepos, saveIngestedGitHubRepos, ingestGitHubRepository, fetchAndInstallSkillFromInternet } from '../lib/adamSkillsEngine';

interface SkillsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
}

export const SkillsManagerModal: React.FC<SkillsManagerModalProps> = ({
  isOpen,
  onClose,
  isArabic,
}) => {
  const [skills, setSkills] = useState<AdamSkill[]>([]);
  const [ingestedRepos, setIngestedRepos] = useState<IngestedGitHubRepo[]>([]);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'github' | 'custom'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  // GitHub Ingestion Form
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [ingestingGithub, setIngestingGithub] = useState(false);
  const [githubSuccess, setGithubSuccess] = useState(false);

  // Custom Skill Form
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customSuccess, setCustomSuccess] = useState(false);

  const refreshSkills = () => {
    setSkills(getAdamSkills());
    setIngestedRepos(getIngestedGitHubRepos());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSkills();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallSkill = async (skill: AdamSkill) => {
    setInstallingId(skill.id);
    try {
      await fetchAndInstallSkillFromInternet(skill.sourceUrl, skill.name);
      refreshSkills();
    } catch (e) {
      console.error(e);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstallSkill = (id: string) => {
    const updated = skills.map((s) => (s.id === id ? { ...s, installed: false } : s));
    saveAdamSkills(updated);
    setSkills(updated);
  };

  const handleIngestGitHubRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepoUrl.trim()) return;
    setIngestingGithub(true);
    try {
      await ingestGitHubRepository(githubRepoUrl);
      setGithubSuccess(true);
      setGithubRepoUrl('');
      refreshSkills();
      setTimeout(() => setGithubSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIngestingGithub(false);
    }
  };

  const handleRemoveGitHubRepo = (id: string) => {
    const updated = ingestedRepos.filter((r) => r.id !== id);
    saveIngestedGitHubRepos(updated);
    setIngestedRepos(updated);
    refreshSkills();
  };

  const handleAddCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customUrl) return;
    try {
      await fetchAndInstallSkillFromInternet(customUrl, customName);
      setCustomSuccess(true);
      setCustomName('');
      setCustomUrl('');
      setCustomDesc('');
      refreshSkills();
      setTimeout(() => setCustomSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedSkills = skills.filter((s) => s.installed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isArabic ? 'مركز مهارات وإضافات آدم الذكية (Adam Skills & GitHub Code Learning Hub)' : 'Adam Skills & GitHub Code Learning Hub'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'أضف روابط مستودعات GitHub ليتعلم آدم من الأكواد ويطور قدراته في حل المشكلات البرمجية'
                  : 'Add GitHub repository links for Adam to learn from code and enhance problem-solving capabilities'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'marketplace'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            {isArabic ? `متجر المهارات (${skills.length})` : `Marketplace (${skills.length})`}
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'installed'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isArabic ? `النشطة (${installedSkills.length})` : `Active (${installedSkills.length})`}
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4 text-purple-400" />
            {isArabic ? `مستودعات GitHub المتعلم منها (${ingestedRepos.length})` : `GitHub Repos & Learning (${ingestedRepos.length})`}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'custom'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isArabic ? 'إضافة مهارة خارجية' : 'Fetch Custom Skill'}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'ابحث عن مهارة، غيت هب، بايثون، رياكت...' : 'Search skills, GitHub, python, react...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={refreshSkills}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isArabic ? 'تحديث' : 'Sync'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                            {skill.category === 'replit' ? <Layers className="w-4 h-4" /> :
                             skill.category === 'github' ? <Github className="w-4 h-4" /> :
                             skill.category === 'web' ? <Globe className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                          </span>
                          <div>
                            <h3 className="font-semibold text-sm text-slate-100">{skill.name}</h3>
                            <span className="text-[10px] text-teal-400 font-medium">v{skill.version} • {skill.author}</span>
                          </div>
                        </div>
                        {skill.installed ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isArabic ? 'نشط' : 'Active'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                            {isArabic ? 'متاح' : 'Available'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mb-4 line-clamp-2">
                        {isArabic ? skill.descriptionAr : skill.descriptionEn}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {skill.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {(skill.downloadsCount / 1000).toFixed(1)}k</span>
                        <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3 fill-amber-400" /> {skill.rating}</span>
                      </div>

                      {skill.installed ? (
                        <button
                          onClick={() => handleUninstallSkill(skill.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-xs font-medium transition-colors"
                        >
                          {isArabic ? 'إلغاء التثبيت' : 'Uninstall'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstallSkill(skill)}
                          disabled={installingId === skill.id}
                          className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
                        >
                          {installingId === skill.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          {isArabic ? 'تثبيت الفوري' : 'Install Skill'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installed Tab */}
          {activeTab === 'installed' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-3">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <p>
                  {isArabic
                    ? 'المهارات والإضافات التالية نشطة بالكامل وتمد وكيل آدم بقدرات فورية لتنفيذ المهام البرمجية والبحثية.'
                    : 'The following skills and extensions are fully active, empowering Adam with advanced capabilities.'}
                </p>
              </div>

              <div className="space-y-2">
                {installedSkills.map((skill) => (
                  <div key={skill.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{skill.name}</h4>
                        <p className="text-xs text-slate-400">{isArabic ? skill.descriptionAr : skill.descriptionEn}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUninstallSkill(skill.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-xs font-medium transition-colors"
                    >
                      {isArabic ? 'إيقاف / إزالة' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Code Learning Tab */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              {/* Ingestion Input Card */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {isArabic ? 'إضافة رابط مستودع GitHub للتعلم البرمجي' : 'Ingest GitHub Repo for Code Learning'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isArabic
                        ? 'سيقوم آدم بفحص الكود، هيكلية المشروع، وأنماط البرمجة لتعزيز قدراته في حل المشكلات البرمجية المعقدة'
                        : 'Adam will parse code structure, architecture, and programming patterns to enhance coding problem-solving'}
                    </p>
                  </div>
                </div>

                {githubSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {isArabic ? 'تم بنجاح تحليل مستودع GitHub ودمج مهاراته في ذاكرة آدم البرمجية!' : 'GitHub repository successfully ingested and integrated into Adam\'s coding memory!'}
                  </div>
                )}

                <form onSubmit={handleIngestGitHubRepo} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      placeholder="https://github.com/owner/repository"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 placeholder-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={ingestingGithub}
                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {ingestingGithub ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isArabic ? 'جاري فحص الكود والتعلم...' : 'Analyzing Code & Learning...'}</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>{isArabic ? 'تحليل وتعلم الكود' : 'Ingest & Learn Code'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Ingested Repositories List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isArabic ? `المستودعات التي تعلم منها آدم (${ingestedRepos.length})` : `Ingested Repositories (${ingestedRepos.length})`}
                </h4>

                {ingestedRepos.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
                    <Github className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">
                      {isArabic ? 'لم يتم إضافة أي مستودعات غيت هب بعد.' : 'No GitHub repositories ingested yet.'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {isArabic
                        ? 'أدخل أي رابط مستودع برمجياً في الأعلى ليتعلم آدم من الكود الخاص به فوراً.'
                        : 'Enter any repository URL above for Adam to instantly learn from its codebase.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {ingestedRepos.map((repo) => (
                      <div key={repo.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                              <Github className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <a href={repo.repoUrl} target="_blank" rel="noreferrer" className="font-bold text-sm text-slate-100 hover:text-purple-400 flex items-center gap-1 transition-colors">
                                  {repo.owner}/{repo.repoName}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-semibold">
                                  ★ {repo.stars}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(repo.ingestedAt).toLocaleDateString()} • {repo.filesCount} {isArabic ? 'ملف مفحوص' : 'files analyzed'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveGitHubRepo(repo.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                            title={isArabic ? 'إزالة المستودع' : 'Remove Repository'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300">{repo.description}</p>

                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
                          <span className="text-[11px] font-semibold text-purple-400">
                            {isArabic ? 'الأنماط البرمجية المستفادة والمعمارية:' : 'Learned Code Patterns & Architecture:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {repo.codePatterns.map((pattern, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-teal-400" />
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {repo.languages.map((lang) => (
                            <span key={lang} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Fetch Tab */}
          {activeTab === 'custom' && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  {isArabic ? 'جلب مهارة أو إضافة خارجية جديدة' : 'Fetch External Skill or Extension'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isArabic
                    ? 'أدخل رابط سجل MCP أو مكتبة برمجية لجلب المهارة وتفعيلها فوراً في آدم'
                    : 'Enter MCP registry or library URL to fetch and enable the skill instantly'}
                </p>
              </div>

              {customSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {isArabic ? 'تم جلب وتثبيت المهارة بنجاح!' : 'Skill fetched and installed successfully!'}
                </div>
              )}

              <form onSubmit={handleAddCustomSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isArabic ? 'اسم المهارة أو الإضافة' : 'Skill Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={isArabic ? 'مثال: Advanced Node.js MCP Bridge' : 'e.g. Advanced Node.js MCP Bridge'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isArabic ? 'رابط المصدر (URL)' : 'Source URL'}
                  </label>
                  <input
                    type="url"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://github.com/organization/skill-repository"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isArabic ? 'وصف المهارة والقدرات' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder={isArabic ? 'شرح مختصر لما تقوم به هذه المهارة...' : 'Brief explanation of what this skill does...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isArabic ? 'جلب وتثبيت المهارة فوراً' : 'Fetch & Install Skill'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>{isArabic ? 'متصل بالسحابة • مهارات غيت هب ومحرك التعلم نشط' : 'Cloud Connected • GitHub Code Learning Active'}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

