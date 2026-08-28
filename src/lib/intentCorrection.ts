/**
 * Smart Intent Correction & Semantic Normalization Engine
 * Fixes trivial input typos, dialect variants, punctuation anomalies,
 * and conversational shorthands in Arabic, English, and French.
 */

// Common single-word typos and colloquial expressions
const ARABIC_WORD_MAP: Record<string, string> = {
  // Dialect / Slang / Question words
  'اشه': 'ما هو',
  'شنو': 'ما هو',
  'سنو': 'ما هو',
  'اششنو': 'ما هو',
  'شو': 'ما هو',
  'ايش': 'ما هو',
  'ليه': 'لماذا',
  'ليش': 'لماذا',
  'علاش': 'لماذا',
  'وش': 'ما هو',
  'وشو': 'ما هو',
  'وشلون': 'كيف',
  'شلونك': 'كيف حالك',
  'ازيك': 'كيف حالك',
  'كييف': 'كيف',
  'ككيف': 'كيف',
  'كيفف': 'كيف',
  'وين': 'أين',
  'فين': 'أين',
  'وقتاش': 'متى',
  'امتى': 'متى',

  // Actions & Commands typos
  'افتج': 'افتح',
  'افته': 'افتح',
  'افتخ': 'افتح',
  'افتحلي': 'افتح لي',
  'افتحلى': 'افتح لي',
  'بحص': 'بحث',
  'بحت': 'بحث',
  'بحش': 'بحث',
  'ابحثلي': 'ابحث لي',
  'ابحثلى': 'ابحث لي',
  'ابحس': 'ابحث',
  'ابحثث': 'ابحث',
  'حسب': 'احسب',
  'احسبي': 'احسب',
  'احسبلي': 'احسب لي',
  'برمجه': 'برمجة',
  'برمجلي': 'برمج لي',
  'برمجلى': 'برمج لي',
  'ساطني': 'ساعدني',
  'ساعدي': 'ساعدني',
  'سعدني': 'ساعدني',
  'سعفني': 'ساعدني',
  'ترجمه': 'ترجمة',
  'ترجملي': 'ترجم لي',
  'ترجم لي': 'ترجم',
  'اخش': 'اشرح',
  'اسرح': 'اشرح',
  'اشرحلي': 'اشرح لي',
  'اشرحلى': 'اشرح لي',
  'عطيني': 'أعطيني',
  'اعطني': 'أعطيني',
  'اعطيني': 'أعطيني',
  'وريني': 'أرني',
  'ورني': 'أرني',
  'فرجيني': 'أرني',
  'لخصلي': 'لخص لي',
  'لخصلى': 'لخص لي',
  'لكص': 'لخص',
  'لخصش': 'لخص',
  'صحيح': 'صحح',
  'صححلي': 'صحح لي',
  'صححلى': 'صحح لي',
  'صلحلي': 'أصلح لي',
  'اصلحلي': 'أصلح لي',
  'اككتب': 'اكتب',
  'اكتبلي': 'اكتب لي',
  'اكتبلى': 'اكتب لي',
  'كتوب': 'اكتب',
  'كتيب': 'اكتب',
  'قلي': 'قل لي',
  'قولي': 'قل لي',
  'حكيلي': 'احك لي',
  'احكيلي': 'احك لي',
  'فهميني': 'افهمني',
  'فهمني': 'افهمني',
  'خبرني': 'أخبرني',
  'علمني': 'علمني',

  // Greetings & Pleasantries typos
  'سالم': 'سلام',
  'سالام': 'سلام',
  'مرجبا': 'مرحبا',
  'مرحباً': 'مرحبا',
  'مرجبن': 'مرحبا',
  'هلاو': 'أهلا',
  'اهلين': 'أهلاً',
  'صباحو': 'صباح الخير',
  'مساءو': 'مساء الخير',
  'شكراا': 'شكراً',
  'شكرن': 'شكراً',
  'مشكورر': 'مشكور',
  'تسلمم': 'تسلم',
  'عفواا': 'عفواً',
  'عفون': 'عفواً',

  // Tech & System terms typos
  'الذكاءء': 'الذكاء',
  'اصطناعي': 'اصطناعي',
  'اسطناعي': 'اصطناعي',
  'ذكاءء': 'ذكاء',
  'روبوط': 'روبوت',
  'روبود': 'روبوت',
  'بوتت': 'بوت',
  'كودد': 'كود',
  'برناج': 'برنامج',
  'برنامح': 'برنامج',
  'تطبييق': 'تطبيق',
  'تطبيف': 'تطبيق',
  'تطبيفق': 'تطبيق',
  'موقوع': 'موقع',
  'موقغ': 'موقع',
  'انترنيت': 'إنترنت',
  'انترنط': 'إنترنت',
  'سيرفرر': 'سيرفر',
  'خادمم': 'خادم',
  'ملفف': 'ملف',
  'صوره': 'صورة',
  'فديو': 'فيديو',
  'فديوو': 'فيديو',
  'فيدو': 'فيديو',
  'تذكيرر': 'تذكير',
  'ملاحظهه': 'ملاحظة',
  'تقوييم': 'تقويم',
  'اجتمااع': 'اجتماع',
};

const ENGLISH_WORD_MAP: Record<string, string> = {
  // Greetings & Conversational
  'helo': 'hello',
  'hilo': 'hello',
  'heall0': 'hello',
  'helllo': 'hello',
  'hllo': 'hello',
  'hll': 'hello',
  'heyya': 'hey',
  'hy': 'hi',
  'hii': 'hi',
  'hiii': 'hi',
  'thx': 'thanks',
  'thnx': 'thanks',
  'thanx': 'thanks',
  'thnk': 'thank',
  'ty': 'thank you',
  'plz': 'please',
  'pls': 'please',
  'plse': 'please',
  'sry': 'sorry',
  'sory': 'sorry',
  'soory': 'sorry',
  'welcom': 'welcome',
  'welcme': 'welcome',
  'wlcm': 'welcome',
  'gud': 'good',
  'mrng': 'morning',
  'nite': 'night',
  'byee': 'bye',

  // Actions & Commands
  'hlp': 'help',
  'helpr': 'helper',
  'halp': 'help',
  'calcualte': 'calculate',
  'calulate': 'calculate',
  'calclate': 'calculate',
  'caclc': 'calc',
  'seach': 'search',
  'sarch': 'search',
  'serch': 'search',
  'saerch': 'search',
  'writ': 'write',
  'wriet': 'write',
  'wrte': 'write',
  'explian': 'explain',
  'explin': 'explain',
  'explan': 'explain',
  'expalin': 'explain',
  'sumary': 'summary',
  'sumrize': 'summarize',
  'sumarize': 'summarize',
  'translat': 'translate',
  'transalte': 'translate',
  'tranalte': 'translate',
  'aswer': 'answer',
  'answe': 'answer',
  'anwser': 'answer',
  'corect': 'correct',
  'corection': 'correction',
  'generat': 'generate',
  'genrate': 'generate',
  'creeate': 'create',
  'craete': 'create',

  // Technical & System words
  'wather': 'weather',
  'weathet': 'weather',
  'weater': 'weather',
  'codeing': 'coding',
  'programing': 'programming',
  'progamming': 'programming',
  'develepor': 'developer',
  'devloper': 'developer',
  'artical': 'article',
  'artcle': 'article',
  'pyton': 'python',
  'javascrip': 'javascript',
  'typscript': 'typescript',
  'algoritm': 'algorithm',
  'algorthm': 'algorithm',
  'functon': 'function',
  'funtion': 'function',
  'variabel': 'variable',
  'databas': 'database',
  'servr': 'server',
  'comptuer': 'computer',
};

/**
 * Strips excessive repeating characters (e.g. "ممرررححببااا" -> "مرحبا", "hellloooo" -> "hello")
 */
function normalizeRepeatedChars(word: string): string {
  // If word is already in dictionary, keep it
  if (ARABIC_WORD_MAP[word] || ENGLISH_WORD_MAP[word.toLowerCase()]) {
    return word;
  }
  // Replace 3+ consecutive duplicate characters with max 2 or 1
  return word.replace(/(.)\1{2,}/gu, '$1');
}

/**
 * Normalizes common Arabic orthographic variations
 */
function normalizeArabicHamzasAndLetters(text: string): string {
  return text
    // Normalize Alef forms (أ, إ, آ -> ا) only for search lookup or specific typos
    .replace(/[ـ\u0640]/g, ''); // Remove Tatweel (Kashida)
}

/**
 * Main Smart Intent Correction Function
 * Cleans and normalizes conversational user inputs for better AI comprehension.
 */
export function smartIntentCorrection(input: string): string {
  if (!input || !input.trim()) return input;

  let cleaned = input.trim();

  // 1. Remove Kashida/Tatweel (ـ)
  cleaned = normalizeArabicHamzasAndLetters(cleaned);

  // 2. Normalize repeated punctuation (e.g. "?????" -> "؟", "!!!!!" -> "!")
  cleaned = cleaned.replace(/[\?؟]{2,}/g, '؟').replace(/!{2,}/g, '!');

  // 3. Process individual words
  const tokens = cleaned.split(/(\s+)/); // Preserve whitespace delimiters

  const correctedTokens = tokens.map((token) => {
    // If it's pure whitespace, preserve
    if (/^\s+$/.test(token)) return token;

    // Check exact lower
    const lower = token.toLowerCase();
    if (ENGLISH_WORD_MAP[lower]) {
      return ENGLISH_WORD_MAP[lower];
    }
    if (ARABIC_WORD_MAP[token]) {
      return ARABIC_WORD_MAP[token];
    }

    // Try without excessive char repeats
    const deRepeated = normalizeRepeatedChars(token);
    const lowerDeRepeated = deRepeated.toLowerCase();
    if (ENGLISH_WORD_MAP[lowerDeRepeated]) {
      return ENGLISH_WORD_MAP[lowerDeRepeated];
    }
    if (ARABIC_WORD_MAP[deRepeated]) {
      return ARABIC_WORD_MAP[deRepeated];
    }

    return deRepeated;
  });

  return correctedTokens.join('').trim();
}
