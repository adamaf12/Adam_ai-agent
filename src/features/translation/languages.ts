export interface LanguageDef {
  code: string;
  nameEn: string;
  nameAr: string;
  nativeName: string;
  flag: string;
  category: 'popular' | 'arabic' | 'european' | 'asian' | 'other';
  dir?: 'rtl' | 'ltr';
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  // Top Popular Languages
  { code: 'ar', nameEn: 'Arabic (Standard)', nameAr: 'العربية الفصحى', nativeName: 'العربية', flag: '🇸🇦', category: 'popular', dir: 'rtl' },
  { code: 'en', nameEn: 'English', nameAr: 'الإنجليزية', nativeName: 'English', flag: '🇺🇸', category: 'popular', dir: 'ltr' },
  { code: 'fr', nameEn: 'French', nameAr: 'الفرنسية', nativeName: 'Français', flag: '🇫🇷', category: 'popular', dir: 'ltr' },
  { code: 'es', nameEn: 'Spanish', nameAr: 'الإسبانية', nativeName: 'Español', flag: '🇪🇸', category: 'popular', dir: 'ltr' },
  { code: 'de', nameEn: 'German', nameAr: 'الألمانية', nativeName: 'Deutsch', flag: '🇩🇪', category: 'popular', dir: 'ltr' },
  { code: 'tr', nameEn: 'Turkish', nameAr: 'التركية', nativeName: 'Türkçe', flag: '🇹🇷', category: 'popular', dir: 'ltr' },
  { code: 'ru', nameEn: 'Russian', nameAr: 'الروسية', nativeName: 'Русский', flag: '🇷🇺', category: 'popular', dir: 'ltr' },
  { code: 'zh', nameEn: 'Chinese (Simplified)', nameAr: 'الصينية المبسطة', nativeName: '中文 (简体)', flag: '🇨🇳', category: 'popular', dir: 'ltr' },
  { code: 'ja', nameEn: 'Japanese', nameAr: 'اليابانية', nativeName: '日本語', flag: '🇯🇵', category: 'popular', dir: 'ltr' },
  { code: 'it', nameEn: 'Italian', nameAr: 'الإيطالية', nativeName: 'Italiano', flag: '🇮🇹', category: 'popular', dir: 'ltr' },
  { code: 'pt', nameEn: 'Portuguese', nameAr: 'البرتغالية', nativeName: 'Português', flag: '🇧🇷', category: 'popular', dir: 'ltr' },
  { code: 'ko', nameEn: 'Korean', nameAr: 'الكورية', nativeName: '한국어', flag: '🇰🇷', category: 'popular', dir: 'ltr' },

  // Arabic Dialects & Regional
  { code: 'ar-DZ', nameEn: 'Algerian Arabic (Darija)', nameAr: 'اللهجة الجزائرية (الدارجة)', nativeName: 'الدارجة الجزائرية', flag: '🇩🇿', category: 'arabic', dir: 'rtl' },
  { code: 'ar-EG', nameEn: 'Egyptian Arabic', nameAr: 'اللهجة المصرية', nativeName: 'العامية المصرية', flag: '🇪🇬', category: 'arabic', dir: 'rtl' },
  { code: 'ar-MA', nameEn: 'Moroccan Arabic (Darija)', nameAr: 'اللهجة المغربية (الدارجة)', nativeName: 'الدارجة المغربية', flag: '🇲🇦', category: 'arabic', dir: 'rtl' },
  { code: 'ar-SY', nameEn: 'Levantine Arabic (Syria/Lebanon)', nameAr: 'اللهجة الشامية (سوريا/لبنان)', nativeName: 'الشامية', flag: '🇸🇾', category: 'arabic', dir: 'rtl' },
  { code: 'ar-IQ', nameEn: 'Iraqi Arabic', nameAr: 'اللهجة العراقية', nativeName: 'العراقية', flag: '🇮🇶', category: 'arabic', dir: 'rtl' },
  { code: 'ar-SA-gulf', nameEn: 'Gulf Arabic (Khaleeji)', nameAr: 'اللهجة الخليجية', nativeName: 'الخليجية', flag: '🇦🇪', category: 'arabic', dir: 'rtl' },
  { code: 'ar-TN', nameEn: 'Tunisian Arabic', nameAr: 'اللهجة التونسية', nativeName: 'التونسية', flag: '🇹🇳', category: 'arabic', dir: 'rtl' },
  { code: 'ar-SD', nameEn: 'Sudanese Arabic', nameAr: 'اللهجة السودانية', nativeName: 'السودانية', flag: '🇸🇩', category: 'arabic', dir: 'rtl' },
  { code: 'ar-YE', nameEn: 'Yemeni Arabic', nameAr: 'اللهجة اليمنية', nativeName: 'اليمنية', flag: '🇾🇪', category: 'arabic', dir: 'rtl' },
  { code: 'ar-LY', nameEn: 'Libyan Arabic', nameAr: 'اللهجة الليبية', nativeName: 'الليبية', flag: '🇱🇾', category: 'arabic', dir: 'rtl' },

  // European Languages
  { code: 'nl', nameEn: 'Dutch', nameAr: 'الهولندية', nativeName: 'Nederlands', flag: '🇳🇱', category: 'european', dir: 'ltr' },
  { code: 'sv', nameEn: 'Swedish', nameAr: 'السويدية', nativeName: 'Svenska', flag: '🇸🇪', category: 'european', dir: 'ltr' },
  { code: 'no', nameEn: 'Norwegian', nameAr: 'النرويجية', nativeName: 'Norsk', flag: '🇳🇴', category: 'european', dir: 'ltr' },
  { code: 'da', nameEn: 'Danish', nameAr: 'الدانماركية', nativeName: 'Dansk', flag: '🇩🇰', category: 'european', dir: 'ltr' },
  { code: 'fi', nameEn: 'Finnish', nameAr: 'الفنلندية', nativeName: 'Suomi', flag: '🇫🇮', category: 'european', dir: 'ltr' },
  { code: 'pl', nameEn: 'Polish', nameAr: 'البولندية', nativeName: 'Polski', flag: '🇵🇱', category: 'european', dir: 'ltr' },
  { code: 'uk', nameEn: 'Ukrainian', nameAr: 'الأوكرانية', nativeName: 'Українська', flag: '🇺🇦', category: 'european', dir: 'ltr' },
  { code: 'el', nameEn: 'Greek', nameAr: 'اليونانية', nativeName: 'Ελληνικά', flag: '🇬🇷', category: 'european', dir: 'ltr' },
  { code: 'cs', nameEn: 'Czech', nameAr: 'التشيكية', nativeName: 'Čeština', flag: '🇨🇿', category: 'european', dir: 'ltr' },
  { code: 'ro', nameEn: 'Romanian', nameAr: 'الرومانية', nativeName: 'Română', flag: '🇷🇴', category: 'european', dir: 'ltr' },
  { code: 'hu', nameEn: 'Hungarian', nameAr: 'المجرية', nativeName: 'Magyar', flag: '🇭🇺', category: 'european', dir: 'ltr' },

  // Asian & Middle Eastern / African
  { code: 'fa', nameEn: 'Persian (Farsi)', nameAr: 'الفارسية', nativeName: 'فارسی', flag: '🇮🇷', category: 'asian', dir: 'rtl' },
  { code: 'ur', nameEn: 'Urdu', nameAr: 'الأردية', nativeName: 'اردو', flag: '🇵🇰', category: 'asian', dir: 'rtl' },
  { code: 'hi', nameEn: 'Hindi', nameAr: 'الهندية', nativeName: 'हिन्दी', flag: '🇮🇳', category: 'asian', dir: 'ltr' },
  { code: 'id', nameEn: 'Indonesian', nameAr: 'الإندونيسية', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', category: 'asian', dir: 'ltr' },
  { code: 'ms', nameEn: 'Malay', nameAr: 'الماليزية', nativeName: 'Bahasa Melayu', flag: '🇲🇾', category: 'asian', dir: 'ltr' },
  { code: 'vi', nameEn: 'Vietnamese', nameAr: 'الفيتنامية', nativeName: 'Tiếng Việt', flag: '🇻🇳', category: 'asian', dir: 'ltr' },
  { code: 'th', nameEn: 'Thai', nameAr: 'التايلاندية', nativeName: 'ไทย', flag: '🇹🇭', category: 'asian', dir: 'ltr' },
  { code: 'bn', nameEn: 'Bengali', nameAr: 'البنغالية', nativeName: 'বাংলা', flag: '🇧🇩', category: 'asian', dir: 'ltr' },
  { code: 'he', nameEn: 'Hebrew', nameAr: 'العبرية', nativeName: 'עברית', flag: '🇮🇱', category: 'asian', dir: 'rtl' },
  { code: 'sw', nameEn: 'Swahili', nameAr: 'السواحيلية', nativeName: 'Kiswahili', flag: '🇰🇪', category: 'other', dir: 'ltr' },
  { code: 'la', nameEn: 'Latin', nameAr: 'اللاتينية', nativeName: 'Latina', flag: '🏛️', category: 'other', dir: 'ltr' },
];

export interface TranslationTone {
  id: 'general' | 'formal' | 'casual' | 'academic' | 'technical' | 'literary';
  labelAr: string;
  labelEn: string;
  icon: string;
  descAr: string;
  descEn: string;
}

export const TRANSLATION_TONES: TranslationTone[] = [
  { id: 'general', labelAr: 'عام وطبيعي', labelEn: 'General & Natural', icon: '🌟', descAr: 'ترجمة دقيقة وطبيعية وسلسة للمعاني اليومية', descEn: 'Accurate, natural translation for general usage' },
  { id: 'formal', labelAr: 'رسمي ومهني', labelEn: 'Formal & Professional', icon: '🎩', descAr: 'مراسلات رسمية، عقود، تقارير ومخاطبات احترافية', descEn: 'Formal tone suitable for business and legal contexts' },
  { id: 'casual', labelAr: 'عامي ومحادثة', labelEn: 'Casual & Colloquial', icon: '💬', descAr: 'لغة محادثة يومية مرنة واللهجات الدارجة', descEn: 'Everyday conversational tone and slang/dialects' },
  { id: 'academic', labelAr: 'أكاديمي وبحثي', labelEn: 'Academic & Research', icon: '🎓', descAr: 'أبحاث ودراسات علمية مع مصطلحات موثقة', descEn: 'Scholarly precision for research papers and essays' },
  { id: 'technical', labelAr: 'تقني وبرمجي', labelEn: 'Technical & Code', icon: '💻', descAr: 'مصطلحات برمجية وهندسية مع الحفاظ على الأكواد', descEn: 'Preserves code snippets and specialized technical terms' },
  { id: 'literary', labelAr: 'أدبي وبلاغي', labelEn: 'Literary & Poetic', icon: '📜', descAr: 'جماليات التعبير والتشبيهات البلاغية والشعر', descEn: 'Rich aesthetic phrasing for stories, poems, and creative texts' },
];

export interface TranslationResult {
  translatedText: string;
  detectedSourceLang?: string;
  detectedSourceName?: string;
  transliteration?: string;
  alternatives?: Array<{ text: string; context: string }>;
  grammarNotes?: string;
  vocabulary?: Array<{ word: string; translation: string; pos?: string }>;
  culturalNotes?: string;
}

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  tone: string;
  timestamp: number;
  favorite?: boolean;
}
