const fs = require('fs');
let code = fs.readFileSync('src/components/NewsRadarModal.tsx', 'utf8');

// 1. imports
if (!code.includes("import { loadSettings, saveSettings } from '../lib/storage';")) {
  code = code.replace("import { saveMemory } from '../lib/storage';", "import { saveMemory, loadSettings, saveSettings } from '../lib/storage';\nimport { resolveAppLanguage, syncVoiceEngineLanguage } from '../lib/languageResolver';");
}

// 2. add geolocation state and preferred categories state
const stateAdd = `
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
            const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${position.coords.latitude}&lon=\${position.coords.longitude}\`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village;
            const country = data.address.country;
            setUserLocation({ city, country });
            
            // fetch local news based on country/city
            setIsLoading(true);
            const newsRes = await fetch(\`/api/news/latest?query=\${encodeURIComponent(city || country)}\`);
            const newsData = await newsRes.json();
            setLocalNews(newsData.items || []);
          } catch(e) {} finally {
            setIsLoading(false);
          }
        });
      }
    }
  }, [isOpen, activeTab]);
`;

code = code.replace("  const [speakingArticleId, setSpeakingArticleId] = useState<string | null>(null);", "  const [speakingArticleId, setSpeakingArticleId] = useState<string | null>(null);" + stateAdd);

code = code.replace("useState<'news' | 'self_evolution'>('news');", "// replaced by patch");

// 3. Update tabs rendering
const tabsOld = `
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('news')}
`;

const tabsNew = `
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto hide-scrollbar space-x-1 rtl:space-x-reverse">
            <button
              onClick={() => setActiveTab('news')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 \${
                activeTab === 'news'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }\`}
            >
              {isArabic ? 'الأخبار العالمية' : 'Global News'}
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 \${
                activeTab === 'local'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }\`}
            >
              {isArabic ? 'أخبار محلية' : 'Local News'}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={\`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 \${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }\`}
            >
              {isArabic ? 'تفضيلاتي' : 'My Preferences'}
            </button>
            <button
`;
code = code.replace(tabsOld, tabsNew);

fs.writeFileSync('src/components/NewsRadarModal.tsx', code);
