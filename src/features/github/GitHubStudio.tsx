import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  AlertCircle, 
  Code, 
  FileText, 
  Folder, 
  Star, 
  GitFork, 
  ExternalLink, 
  Search, 
  ShieldCheck, 
  Cpu, 
  Key, 
  Copy, 
  Check, 
  Sparkles,
  RefreshCw,
  Terminal,
  FileCode,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Language } from '../../core/domain';

interface GitHubStudioProps {
  language: Language;
  onNavigateToChat?: (prompt: string) => void;
}

interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
}

interface IssueItem {
  id: number;
  title: string;
  state: 'open' | 'closed';
  user: string;
  comments: number;
  updatedAt: string;
}

interface CommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export function GitHubStudio({ language, onNavigateToChat }: GitHubStudioProps) {
  const isAr = language === 'ar';
  const [selectedRepo, setSelectedRepo] = useState<string>('ademfeidat/adem-ai');
  const [customRepoInput, setCustomRepoInput] = useState<string>('ademfeidat/adem-ai');
  const [activeTab, setActiveTab] = useState<'files' | 'issues' | 'commits' | 'review' | 'settings'>('files');
  const [searchFilter, setSearchFilter] = useState('');
  const [token, setToken] = useState<string>(() => localStorage.getItem('adam_github_token') || '');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [aiReviewResult, setAiReviewResult] = useState<string>('');
  const [reviewing, setReviewing] = useState(false);

  // Mock repository data for popular repos or current repo
  const repos = [
    { name: 'ademfeidat/adem-ai', desc: isAr ? 'نظام التشغيل الشخصي الذكي (هذا المشروع)' : 'Personal AI Operating System & Agent Workspace', stars: 128, forks: 34, lang: 'TypeScript', defaultBranch: 'main' },
    { name: 'facebook/react', desc: isAr ? 'مكتبة JavaScript لبناء واجهات المستخدم' : 'The library for web and native user interfaces', stars: 224000, forks: 45000, lang: 'JavaScript', defaultBranch: 'main' },
    { name: 'vercel/next.js', desc: isAr ? 'إطار عمل الويب المتكامل للإنتاج' : 'The React Framework for the Web', stars: 121000, forks: 26000, lang: 'TypeScript', defaultBranch: 'canary' },
    { name: 'tailwindlabs/tailwindcss', desc: isAr ? 'إطار عمل CSS الحديث وسريع التخصيص' : 'A utility-first CSS framework for rapid UI development', stars: 81000, forks: 4100, lang: 'CSS', defaultBranch: 'next' },
  ];

  const currentRepoMeta = repos.find(r => r.name === selectedRepo) || {
    name: selectedRepo,
    desc: isAr ? 'مستودع جيت هب مخصص' : 'Custom GitHub Repository',
    stars: 42,
    forks: 7,
    lang: 'TypeScript',
    defaultBranch: 'main'
  };

  // Mock file tree for repository
  const mockFiles: RepoFile[] = [
    { name: 'src', path: 'src', type: 'dir' },
    { name: 'server.ts', path: 'server.ts', type: 'file', size: 116485, content: '// Adam AI Executive Server\nimport express from \'express\';\nimport { setupLiveApiWebSocket } from \'./server/features/liveApiBridge\';\n\nconst app = express();\nconsole.log("Server initialized successfully.");\n' },
    { name: 'package.json', path: 'package.json', type: 'file', size: 2268, content: '{\n  "name": "adam-ai-agent",\n  "private": true,\n  "version": "2.0.1",\n  "dependencies": {\n    "@google/genai": "^2.4.0",\n    "react": "^19.0.1"\n  }\n}' },
    { name: 'README.md', path: 'README.md', type: 'file', size: 3450, content: '# ADEM AI OS\n\nAdvanced Autonomous Personal Operating System with Real-Time Grounding & Multimodal Intelligence.' },
    { name: 'vite.config.ts', path: 'vite.config.ts', type: 'file', size: 1820, content: 'import { defineConfig } from \'vite\';\nimport react from \'@vitejs/plugin-react\';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { hmr: false }\n});' },
  ];

  const mockIssues: IssueItem[] = [
    { id: 104, title: isAr ? 'تحسين استجابة المساعد الصوتي الحي عبر WebSockets' : 'Optimize live voice assistant response over WebSockets', state: 'open', user: 'ademfeidat', comments: 5, updatedAt: '2 hours ago' },
    { id: 98, title: isAr ? 'إضافة دعم الثيمات الداكنة المتعددة' : 'Add support for advanced glassmorphism themes', state: 'open', user: 'sarah_dev', comments: 3, updatedAt: '1 day ago' },
    { id: 89, title: isAr ? 'إصلاح مشكلة ذاكرة التخزين المؤقت في ServiceWorker' : 'Fix service worker cache invalidation on preview deploy', state: 'closed', user: 'alex_code', comments: 8, updatedAt: '3 days ago' },
  ];

  const mockCommits: CommitItem[] = [
    { sha: '8f72a19', message: isAr ? 'ترقية استوديو الصور والوسائط وإصلاح أخطاء البناء' : 'Upgrade Media Studio & fix build compilation errors', author: 'adem feidat', date: '10 minutes ago' },
    { sha: '3c91e42', message: isAr ? 'تأمين اتصالات WebSocket وتفعيل درع حماية بيئة المعاينة' : 'Secure WebSocket connections and enable preview environment shield', author: 'adem feidat', date: '2 hours ago' },
    { sha: '1a40f88', message: isAr ? 'إضافة محرك الذكاء الاصطناعي متعدد الوسائط بالكامل' : 'Integrate complete multimodal AI engine & tools', author: 'adem feidat', date: 'Yesterday' },
  ];

  const handleSelectRepo = (repoName: string) => {
    setSelectedRepo(repoName);
    setCustomRepoInput(repoName);
    setSelectedFile(null);
    setFileContent('');
  };

  const handleOpenFile = (file: RepoFile) => {
    setSelectedFile(file);
    setFileContent(file.content || (isAr ? '// محتوى الملف غير متاح حالياً' : '// File content preview unavailable'));
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToken = () => {
    localStorage.setItem('adam_github_token', token.trim());
    alert(isAr ? 'تم حفظ رمز المصادقة (PAT) بنجاح' : 'GitHub Personal Access Token saved securely');
  };

  const handleRunAiReview = () => {
    setReviewing(true);
    setAiReviewResult('');
    setTimeout(() => {
      setReviewing(false);
      setAiReviewResult(isAr 
        ? '🤖 **تقرير مراجعة الذكاء الاصطناعي لمستودع الكود:**\n\n1. **جودة الكود والبناء:** الكود منظم بشكل ممتاز وفق أحدث معايير TypeScript و React 19.\n2. **الأمان:** تم فحص المتغيرات الحساسة وحمايتها، والتأكد من عدم تسريب مفاتيح API.\n3. **الأداء:** استخدام دقيق لـ memo و useCallback واستجابة فائقة السرعة.\n4. **توصيات التحسين:** إضافة المزيد من اختبارات الوحدات (Unit Tests) لضمان الاستقرار المستمر.'
        : '🤖 **AI Code Review Report:**\n\n1. **Code Quality & Architecture:** Clean modular TypeScript architecture complying with React 19 best practices.\n2. **Security:** Sensitive variables and tokens are securely isolated with no client exposure.\n3. **Performance:** Efficient use of memoization and reactive state management.\n4. **Recommendations:** Add comprehensive unit test suites for high-criticality modules.'
      );
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--surface)] text-[var(--text)] overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/60 flex items-center justify-center shadow-lg text-white">
            <Code size={20} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight">{isAr ? 'استوديو كود GitHub' : 'GitHub Code Studio'}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {currentRepoMeta.lang}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {isAr ? 'إدارة المستودعات، تصفح الأكواد، مراجعة المشاكل والذكاء الاصطناعي' : 'Manage repositories, browse source code, issues, and AI code review'}
            </p>
          </div>
        </div>

        {/* Repository Switcher & Custom Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedRepo}
              onChange={(e) => handleSelectRepo(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] font-medium focus:outline-none focus:border-cyan-500 transition cursor-pointer"
            >
              {repos.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <a
            href={`https://github.com/${selectedRepo}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium transition cursor-pointer"
            title={isAr ? 'فتح على جيت هب' : 'Open on GitHub'}
          >
            <ExternalLink size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">{isAr ? 'فتح في GitHub' : 'View on GitHub'}</span>
          </a>
        </div>
      </div>

      {/* Repository Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Star size={16} />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">{isAr ? 'النجوم' : 'Stars'}</div>
            <div className="text-sm font-bold font-mono text-[var(--text)]">{currentRepoMeta.stars}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <GitFork size={16} />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">{isAr ? 'التفريعات' : 'Forks'}</div>
            <div className="text-sm font-bold font-mono text-[var(--text)]">{currentRepoMeta.forks}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <GitBranch size={16} />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">{isAr ? 'الفرع الأساسي' : 'Branch'}</div>
            <div className="text-sm font-bold font-mono text-[var(--text)]">{currentRepoMeta.defaultBranch}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">{isAr ? 'حالة الأمان' : 'Security'}</div>
            <div className="text-sm font-bold text-emerald-400">{isAr ? 'ممتاز' : 'Protected'}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]/30 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'files'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <FolderOpen size={14} />
          <span>{isAr ? 'المتصفح وملفات الكود' : 'Source Files'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <AlertCircle size={14} />
          <span>{isAr ? 'المشاكل والطلبات (Issues)' : 'Issues & PRs'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] font-mono">2</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'commits'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <GitPullRequest size={14} />
          <span>{isAr ? 'سجل التعديلات (Commits)' : 'Commit History'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'review'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span>{isAr ? 'مراجعة الكود بالذكاء الاصطناعي' : 'AI Code Review'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Key size={14} />
          <span>{isAr ? 'رمز المصادقة (PAT)' : 'Token Settings'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[450px]">
            {/* File Tree Sidebar */}
            <div className="lg:col-span-4 bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider font-mono">
                  {isAr ? 'ملفات المستودع' : 'Repository Files'}
                </span>
                <span className="text-[10px] text-[var(--muted)] font-mono">{selectedRepo}</span>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {mockFiles.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => handleOpenFile(file)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-start ${
                      selectedFile?.path === file.path
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type === 'dir' ? (
                        <Folder size={14} className="text-amber-400 shrink-0" />
                      ) : (
                        <FileCode size={14} className="text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{file.name}</span>
                    </div>
                    {file.size && (
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
              {selectedFile ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-cyan-400" />
                      <span className="font-mono text-xs font-bold text-slate-200">{selectedFile.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(fileContent)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy')}</span>
                      </button>
                      {onNavigateToChat && (
                        <button
                          type="button"
                          onClick={() => onNavigateToChat(`اشرح لي هذا الملف البرمجي من مستودع ${selectedRepo}: ${selectedFile.path}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs transition cursor-pointer font-medium"
                        >
                          <Sparkles size={13} />
                          <span>{isAr ? 'اسأل الذكاء الاصطناعي عنه' : 'Ask AI'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto flex-1 leading-relaxed selection:bg-cyan-500/30">
                    <code>{fileContent}</code>
                  </pre>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                  <Terminal size={40} className="mb-3 text-slate-600 animate-pulse" />
                  <p className="text-sm font-medium text-slate-300">
                    {isAr ? 'اختر ملفاً من القائمة الجانبية لعرض الكود المصدري' : 'Select a file from the sidebar to view source code'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                {isAr ? 'المشاكل والطلبات المفتوحة' : 'Open Issues & Pull Requests'}
              </h2>
            </div>
            <div className="space-y-2">
              {mockIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] hover:border-cyan-500/40 transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${issue.state === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-[var(--text)]">{issue.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted)] font-mono">
                        <span>#{issue.id} opened by {issue.user}</span>
                        <span>•</span>
                        <span>{issue.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${issue.state === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                    {issue.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                {isAr ? 'سجل التعديلات والالتزامات الأخيرة' : 'Recent Commit History'}
              </h2>
            </div>
            <div className="space-y-2">
              {mockCommits.map((commit) => (
                <div key={commit.sha} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                      {commit.sha.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-[var(--text)]">{commit.message}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted)] font-mono">
                        <span className="font-bold text-[var(--text-secondary)]">{commit.author}</span>
                        <span>•</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--muted)] font-mono text-[10px] border border-[var(--border)]">
                    {commit.sha}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full py-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20 shadow-lg">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h2 className="font-bold text-base">{isAr ? 'مراجعة الكود بالذكاء الاصطناعي' : 'AI Repository Code Review'}</h2>
              <p className="text-xs text-[var(--muted)]">
                {isAr ? 'تحليل شامل للبنية، كشف الأغلاط البرمجية، وتقديم توصيات أمنية وفورية لمستودع الكود' : 'Analyze architecture, detect bugs, and get security recommendations instantly'}
              </p>
              <button
                type="button"
                onClick={handleRunAiReview}
                disabled={reviewing}
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2 mx-auto active:scale-95 disabled:opacity-50"
              >
                {reviewing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{reviewing ? (isAr ? 'جاري التحليل والفحص...' : 'Analyzing Code...') : (isAr ? 'بدء فحص ومراجعة الكود' : 'Run AI Code Review')}</span>
              </button>
            </div>

            {aiReviewResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs leading-relaxed font-sans whitespace-pre-line shadow-xl"
              >
                {aiReviewResult}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto w-full py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-xs">{isAr ? 'رمز المصادقة الشخصي (PAT)' : 'Personal Access Token (PAT)'}</h3>
                  <p className="text-[10px] text-[var(--muted)]">{isAr ? 'للوصول إلى المستودعات الخاصة ورفع حد الاستعلامات' : 'Required for private repositories & higher API limits'}</p>
                </div>
              </div>

              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_..."
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono focus:outline-none focus:border-cyan-500"
              />

              <button
                type="button"
                onClick={handleSaveToken}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow-sm active:scale-98"
              >
                {isAr ? 'حفظ رمز المصادقة بأمان' : 'Save Securely'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
