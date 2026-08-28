const fs = require('fs');
let code = fs.readFileSync('src/components/NewsRadarModal.tsx', 'utf8');

const oldContent = "{activeTab === 'news' ? (";
const newContent = `
          {activeTab === 'preferences' ? (
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {isArabic ? 'تخصيص مجالات الأخبار المفضلة' : 'Customize News Preferences'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">{isArabic ? 'اختر المجالات التي تهمك لتخصيص الأخبار:' : 'Select topics you care about:'}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {NEWS_CATEGORIES.map(c => {
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
                      className={\`p-3 rounded-xl border flex items-center gap-2 transition \${isSel ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}\`}>
                      <c.icon className="w-5 h-5" />
                      <span className="font-semibold text-xs">{isArabic ? c.labelAr : c.labelEn}</span>
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
                   {isArabic ? \`أخبار محلية: \${userLocation.city || ''}، \${userLocation.country || ''}\` : \`Local News: \${userLocation.city || ''}, \${userLocation.country || ''}\`}
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
`;

code = code.replace(oldContent, newContent);

// Fix replace 'adam-neural' with optimalVoiceId in handleToggleSpeak
code = code.replace("speakWithGlobalVoice(speechText, 'adam-neural', {", 
  "speakWithGlobalVoice(speechText, syncVoiceEngineLanguage(settings), {");

fs.writeFileSync('src/components/NewsRadarModal.tsx', code);
