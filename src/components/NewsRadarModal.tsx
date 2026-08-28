import React, { useState, useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  X,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Brain,
  Volume2,
  VolumeX,
  CheckCircle2,
  Newspaper,
  BookOpen,
  Radio,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { WorldNewsItem } from '../types';
import { speakWithGlobalVoice, stopAllSpeech } from '../lib/voiceEngine';
import { saveMemory, loadSettings, saveSettings } from '../lib/storage';
import { resolveAppLanguage, syncVoiceEngineLanguage } from '../lib/languageResolver';

interface NewsRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsRadarModal: React.FC<NewsRadarModalProps> = ({ isOpen, onClose }) => {

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newsItems, setNewsItems] = useState<WorldNewsItem[]>([]);
  const [autoLearnedFacts, setAutoLearnedFacts] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [speakingArticleId, setSpeakingArticleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'local' | 'preferences' | 'self_evolution'>('news');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{city?: string, country?: string} | null>(null);
  const [localNews, setLocalNews] = useState<WorldNewsItem[]>([]);
  
  const settings = loadSettings();
  const isArabic = resolveAppLanguage(settings) === 'ar';
  
  useEffect(() => {
    if (settings.newsPreferences) {
      setPreferredCategories(settings.newsPreferences);
    }
  }, []);
  
  // Geolocation
  useEffect(() => {
    if (isOpen && activeTab === 'local') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village;
            const country = data.address.country;
            setUserLocation({ city, country });
            
            // fetch local news based on country/city
            setIsLoading(true);
            const newsRes = await fetch(`/api/news/latest?query=${encodeURIComponent(city || country)}`);
            const newsData = await newsRes.json();
            setLocalNews(newsData.items || []);
          } catch(e) {} finally {
            setIsLoading(false);
          }
        });
      }
    }
  }, [isOpen, activeTab]);


  useEffect(() => {
    if (isOpen) {
      fetchNews('all');
    }
  }, [isOpen]);

  const fetchNews = async (cat: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat }),
      });
      const data = await res.json();
      setNewsItems(data.items || []);
      setAutoLearnedFacts(data.autoLearnedFacts || []);
      if (data.syncTime) {
        setLastSyncTime(new Date(data.syncTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error('Failed to fetch news:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/news/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      const data = await res.json();
      setNewsItems(data.items || []);
      setAutoLearnedFacts(data.autoLearnedFacts || []);
      if (data.syncTime) {
        setLastSyncTime(new Date(data.syncTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      }

      // Save new facts to client local memory bank
      if (Array.isArray(data.autoLearnedFacts)) {
        data.autoLearnedFacts.forEach((fact: string) => saveMemory(fact, 'other'));
      }
    } catch (e) {
      console.error('Failed to sync news:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSpeak = (item: WorldNewsItem) => {
    if (speakingArticleId === item.id) {
      stopAllSpeech();
      setSpeakingArticleId(null);
    } else {
      stopAllSpeech();
      setSpeakingArticleId(item.id);
      const speechText = `خبر من ${item.source}. ${item.title}. ${item.summary}`;
      speakWithGlobalVoice(speechText, syncVoiceEngineLanguage(settings), {
        onEnd: () => setSpeakingArticleId(null),
        onError: () => setSpeakingArticleId(null),
      });
    }
  };

  if (!isOpen) return null;

  const filteredNews = newsItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', labelAr: '🌐 جميع الأخبار', icon: Globe },
    { id: 'tech_ai', labelAr: '🤖 التكنولوجيا والذكاء الاصطناعي', icon: Zap },
    { id: 'world', labelAr: '🏛️ السياسة والعالم', icon: Newspaper },
    { id: 'economy', labelAr: '📈 الاقتصاد والأسواق', icon: TrendingUp },
    { id: 'science', labelAr: '🔬 العلوم والابتكارات', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">رادار الأخبار العالمية والتعلم الذاتي</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  مباشر ومواكب دائماً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تلقي أحدث الأخبار العالمية يومياً واستخلاص الحقائق لتطوير معرفة الوكيل تلقائياً
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

        {/* Action Controls & Tabs Header */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main View Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'news'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              نشرة الأخبار اليومية ({filteredNews.length})
            </button>
            <button
              onClick={() => setActiveTab('self_evolution')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'self_evolution'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-4 h-4 text-cyan-400" />
              سجل التعلم الذاتي ({autoLearnedFacts.length})
            </button>
          </div>

          {/* Sync & Refresh Button */}
          <div className="flex items-center gap-3">
            {lastSyncTime && (
              <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                آخر تحديث: {lastSyncTime}
              </span>
            )}

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'جاري جلب وتعلم أخبار اليوم...' : 'تحديث واستقبال أخبار اليوم الفورية'}
            </button>
          </div>
        </div>

        {/* Search & Category Filter Sub-bar */}
        {activeTab === 'news' && (
          <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Category Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    fetchNews(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.labelAr}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في الأخبار والمستجدات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar theme-scrollbar">
          
          {activeTab === 'preferences' ? (
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {isArabic ? 'تخصيص مجالات الأخبار المفضلة' : 'Customize News Preferences'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">{isArabic ? 'اختر المجالات التي تهمك لتخصيص الأخبار:' : 'Select topics you care about:'}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(c => {
                  if(c.id === 'all') return null;
                  const isSel = preferredCategories.includes(c.id);
                  return (
                    <button key={c.id} 
                      onClick={() => {
                        const newPrefs = isSel ? preferredCategories.filter(id => id !== c.id) : [...preferredCategories, c.id];
                        setPreferredCategories(newPrefs);
                        const updated = {...settings, newsPreferences: newPrefs};
                        saveSettings(updated);
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-2 transition ${isSel ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                      <c.icon className="w-5 h-5" />
                      <span className="font-semibold text-xs">{isArabic ? c.labelAr : c.labelAr}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'local' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {userLocation ? (
                 <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl flex items-center gap-3 text-sm font-semibold">
                   <Globe className="w-5 h-5 text-blue-500" />
                   {isArabic ? `أخبار محلية: ${userLocation.city || ''}، ${userLocation.country || ''}` : `Local News: ${userLocation.city || ''}, ${userLocation.country || ''}`}
                 </div>
               ) : (
                 <div className="text-center text-sm text-slate-500 py-4">{isArabic ? 'جاري تحديد الموقع...' : 'Detecting location...'}</div>
               )}
               {isLoading ? (
                 <div className="flex items-center justify-center py-10">
                   <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                 </div>
               ) : localNews.length === 0 ? (
                 <div className="text-center text-slate-500 py-10">
                   {isArabic ? 'لا توجد أخبار محلية حالياً.' : 'No local news found.'}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {localNews.map((item) => (
                      <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                            {item.source}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-relaxed mb-2 line-clamp-3">
                          {isArabic ? item.titleAr : item.titleEn}
                        </h4>
                        <button
                          onClick={() => handleToggleSpeak(item)}
                          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          {speakingArticleId === item.id ? <VolumeX className="w-4 h-4 text-emerald-500" /> : <Volume2 className="w-4 h-4" />}
                          {speakingArticleId === item.id ? (isArabic ? 'إيقاف الاستماع' : 'Stop Listening') : (isArabic ? 'استمع للخبر' : 'Listen')}
                        </button>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          ) : activeTab === 'news' ? (

            isLoading || isSyncing ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-300">
                  جاري جلب أحدث الأخبار العالمية والتحليل الاستراتيجي لتطوير الوكيل...
                </p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Newspaper className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm">لا توجد أخبار مطابقة للبحث حالياً</p>
                <button
                  onClick={handleSyncNow}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded-xl font-medium"
                >
                  مزامنة وجلب الأخبار الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 group hover:shadow-lg hover:shadow-emerald-950/20"
                  >
                    <div>
                      {/* Header info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">
                          {item.source || 'أخبار عالمية'}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>

                      {/* Auto Learned Fact Highlight */}
                      {item.autoLearnedFact && (
                        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                          <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-400">حقيقة تم تعلمها تلقائياً: </span>
                            {item.autoLearnedFact}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                      <button
                        onClick={() => handleToggleSpeak(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          speakingArticleId === item.id
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {speakingArticleId === item.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            إيقاف الاستماع
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            استمع للخبر بصوت أدم
                          </>
                        )}
                      </button>

                      {item.sourceUri && (
                        <a
                          href={item.sourceUri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                        >
                          المصدر الأصلي ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Agent Continuous Self-Evolution Journal Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex items-start gap-3">
                <Brain className="w-6 h-6 text-emerald-400 shrink-0 mt-1 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white">سجل الحقائق والمعرفة المكتسبة تلقائياً</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    تقوم هذه الطبقة بتحليل نشرات الأخبار اليومية واستخراج النقاط المفصلية والتغيرات المستحدثة لدمجها بذاكرة الوكيل طويلة المدى، ليصبح أدم دائماً على دراية بأحداث العالم الحالية.
                  </p>
                </div>
              </div>

              {autoLearnedFacts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">لم يتم تسجيل حقائق جديدة اليوم بعد. اضغط على تحديث الأخبار للمستجدات.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {autoLearnedFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 transition-all flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-200 leading-relaxed">{fact}</p>
                        <span className="text-[10px] text-emerald-400/80 mt-1 inline-block">
                          تم الحفظ في ذاكرة الوكيل الممتدة ⚡
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>نظام التحديث المستمر ومواكبة الأخبار العالمية يعمل أوتوماتيكياً.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
