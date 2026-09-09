import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  Trash2,
  Sparkles,
  PlusCircle,
  FileCode,
  Search,
  Maximize2
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  loadSandboxApps,
  saveSandboxApp,
  deleteSandboxApp,
  type SandboxApp
} from '../../core/appSandboxStorage';

interface AppSandboxStudioProps {
  language: Language;
  initialAppId?: string;
  onNavigateToChat?: (prompt: string) => void;
}

const copyLabels = {
  ar: {
    title: 'مشغل الألعاب والتطبيقات',
    subtitle: 'البيئة المخصصة لتشغيل واختبار أكواد الألعاب والتطبيقات التفاعلية التي يطلبها المستخدم.',
    userRequest: 'طلب المستخدم الأصلي:',
    previewTab: 'المعاينة والتشغيل المباشر',
    codeTab: 'الكود المصدري',
    deviceMode: 'نمط العرض',
    responsive: 'شاشة كاملة',
    mobile: 'هاتف ذكي',
    reload: 'إعادة تشغيل',
    openNewTab: 'فتح في نافذة مستقلة',
    copyCode: 'نسخ الكود',
    copied: 'تم النسخ!',
    savedApps: 'سجل الألعاب والتطبيقات البرمجية',
    newGamePrompt: 'اطلب كود لعبة أو تطبيق جديد من Adam...',
    generateBtn: 'إنشاء وتشغيل',
    emptyList: 'لا توجد ألعاب أو تطبيقات محفوظة بعد.',
    deleteConfirm: 'حذف من السجل',
    all: 'الكل',
    games: 'ألعاب',
    apps: 'تطبيقات',
    searchPlaceholder: 'بحث في الألعاب والتطبيقات...'
  },
  en: {
    title: 'App & Game Sandbox',
    subtitle: 'Dedicated environment to execute, play, and inspect interactive game and app code requested by the user.',
    userRequest: 'User Request:',
    previewTab: 'Live Interactive Runner',
    codeTab: 'Source Code',
    deviceMode: 'Display Mode',
    responsive: 'Full Screen',
    mobile: 'Mobile View',
    reload: 'Restart',
    openNewTab: 'Open in New Window',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    savedApps: 'Saved Games & Apps Library',
    newGamePrompt: 'Ask Adam to code a new game or application...',
    generateBtn: 'Generate & Run',
    emptyList: 'No saved games or apps yet.',
    deleteConfirm: 'Delete',
    all: 'All',
    games: 'Games',
    apps: 'Apps',
    searchPlaceholder: 'Search games & apps...'
  }
};

export function AppSandboxStudio({
  language,
  initialAppId,
  onNavigateToChat
}: AppSandboxStudioProps) {
  const t = copyLabels[language];
  const [apps, setApps] = useState<SandboxApp[]>(() => loadSandboxApps());
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    if (initialAppId && apps.some((a) => a.id === initialAppId)) {
      return initialAppId;
    }
    return apps[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile'>('responsive');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterCategory, setFilterCategory] = useState<'all' | 'game' | 'app'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Keep selected app in sync
  useEffect(() => {
    if (initialAppId) {
      setSelectedAppId(initialAppId);
    }
  }, [initialAppId]);

  const selectedApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0] || null;
  }, [apps, selectedAppId]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory =
        filterCategory === 'all' ? true : app.category === filterCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [apps, filterCategory, searchQuery]);

  // Build bundled HTML
  const bundledHtml = useMemo(() => {
    if (!selectedApp) return '';
    let raw = selectedApp.code;

    if (raw.includes('<!DOCTYPE html>') || raw.includes('<html')) {
      if (!raw.includes('tailwindcss') && !raw.includes('<style')) {
        raw = raw.replace(
          '<head>',
          '<head><script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>'
        );
      }
      return raw;
    }

    return `<!DOCTYPE html>
<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedApp.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #app-root {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="app-root">
    ${raw}
  </div>
  <script>
    window.onerror = function(msg, url, line) {
      console.warn('Sandbox Runtime:', msg, 'at line', line);
      return false;
    };
  </script>
</body>
</html>`;
  }, [selectedApp, language]);

  const handleCopyCode = () => {
    if (!selectedApp) return;
    navigator.clipboard.writeText(selectedApp.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWindow = () => {
    if (!bundledHtml) return;
    const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSandboxApp(id);
    setApps(updated);
    if (selectedAppId === id) {
      setSelectedAppId(updated[0]?.id || '');
    }
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    if (onNavigateToChat) {
      onNavigateToChat(
        `برمج لي تطبيق أو لعبة تفاعلية كاملة برمجياً كود HTML/JS: ${customPrompt.trim()}`
      );
    }
  };

  return (
    <section className="feature-page" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div className="feature-heading">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-emerald-400">
            <Gamepad2 size={15} />
            ADAM / GAME & APP SANDBOX
          </span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left / Top Sidebar: List of Games & Apps */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Prompt Creation */}
          <div className="settings-card bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <form onSubmit={handleCreatePrompt} className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                {t.newGamePrompt}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'مثال: لعبة تصويب فضاء، آلة حاسبة علمية، لعبة ذاكرة...'
                      : 'e.g. Space shooter game, scientific calculator...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <PlusCircle size={14} />
                  {t.generateBtn}
                </button>
              </div>
            </form>
          </div>

          {/* Library & Filter */}
          <div className="settings-card bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileCode size={14} className="text-indigo-400" />
                {t.savedApps} ({filteredApps.length})
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className={`px-2 py-0.5 rounded-md ${filterCategory === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  {t.all}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('game')}
                  className={`px-2 py-0.5 rounded-md ${filterCategory === 'game' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  {t.games}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('app')}
                  className={`px-2 py-0.5 rounded-md ${filterCategory === 'app' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  {t.apps}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 rtl:left-auto rtl:right-3"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-8 text-xs text-slate-300 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Apps List */}
            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredApps.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  {t.emptyList}
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setActiveTab('preview');
                        setReloadKey((k) => k + 1);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            app.category === 'game'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {app.category === 'game' ? (
                            <Gamepad2 size={15} />
                          ) : (
                            <Code2 size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`font-semibold truncate ${
                              isSelected ? 'text-emerald-400 font-bold' : 'text-slate-200'
                            }`}
                          >
                            {app.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {app.prompt || app.title}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(app.createdAt).toLocaleDateString(
                              language === 'ar' ? 'ar-DZ' : 'en-US',
                              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(app.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                        title={t.deleteConfirm}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right / Main Sandbox Runner & Code Inspector */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedApp ? (
            <div className="settings-card bg-slate-900/95 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* User Request Banner (طلب المستخدم المرفق) */}
              <div className="bg-slate-950/90 border-b border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {selectedApp.category === 'game' ? '🎮 لعبة تفاعلية' : '📱 تطبيق مخصص'}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm truncate">
                      {selectedApp.title}
                    </h3>
                  </div>
                  {selectedApp.prompt && (
                    <div className="mt-1.5 text-xs text-slate-300 flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <strong className="text-emerald-400 shrink-0">{t.userRequest}</strong>
                      <span className="italic text-slate-300 select-text">"{selectedApp.prompt}"</span>
                    </div>
                  )}
                </div>

                {/* Main Action Tabs */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'preview'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Play size={13} />
                      {t.previewTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'code'
                          ? 'bg-indigo-500 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 size={13} />
                      {t.codeTab}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-toolbar for Runner */}
              {activeTab === 'preview' && (
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/70 border-b border-slate-800/80 text-xs">
                  {/* Device mode */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeviceMode('responsive')}
                      className={`p-1 rounded-md text-xs flex items-center gap-1 ${
                        deviceMode === 'responsive'
                          ? 'bg-slate-800 text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                      title={t.responsive}
                    >
                      <Monitor size={14} />
                      <span className="hidden sm:inline">{t.responsive}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceMode('mobile')}
                      className={`p-1 rounded-md text-xs flex items-center gap-1 ${
                        deviceMode === 'mobile'
                          ? 'bg-slate-800 text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                      title={t.mobile}
                    >
                      <Smartphone size={14} />
                      <span className="hidden sm:inline">{t.mobile}</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                      title={t.reload}
                    >
                      <RotateCcw size={13} />
                      <span className="hidden sm:inline">{t.reload}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWindow}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                      title={t.openNewTab}
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">{t.openNewTab}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Body: Live Sandbox or Source Code */}
              <div className="p-4 bg-slate-950/40 min-h-[500px] flex items-center justify-center">
                {activeTab === 'preview' ? (
                  <div
                    className={`w-full flex justify-center transition-all duration-300 ${
                      deviceMode === 'mobile' ? 'max-w-[400px]' : 'max-w-full'
                    }`}
                  >
                    <div
                      className={`w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl relative ${
                        deviceMode === 'mobile' ? 'aspect-[9/16] max-h-[640px]' : 'min-h-[520px]'
                      }`}
                    >
                      <iframe
                        key={`${selectedApp.id}-${reloadKey}`}
                        srcDoc={bundledHtml}
                        title={selectedApp.title}
                        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                        className="w-full h-full border-0 absolute inset-0 bg-[#090d16]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 font-mono">HTML & JavaScript</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        {copied ? t.copied : t.copyCode}
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 font-mono overflow-x-auto max-h-[500px] leading-relaxed select-text">
                      <code>{selectedApp.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="settings-card text-center py-16 text-slate-500">
              {t.emptyList}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
