import { AcademicEngine, type AcademicSearchItem } from './academicEngine';

export interface AcademicGroundingResult {
  isAcademic: boolean;
  stage: 'primary' | 'middle' | 'secondary' | 'university' | 'general';
  subject: string;
  contextText: string;
  matchedFormulas?: Array<{
    name: string;
    formula: string;
    explanation: string;
    example: string;
    stage: string;
  }>;
  researchWorks?: AcademicSearchItem[];
}

const SERVER_FORMULA_CATALOG = [
  // Primary / Middle School
  {
    keywords: ['مستطيل', 'مربع', 'محيط', 'مساحة', 'rectangle', 'square', 'perimeter', 'area'],
    name: 'محيط ومساحة المستطيل والمربع',
    formula: 'المساحة = L × W | المحيط = 2 × (L + W)',
    explanation: 'حساب الحيز السطحي والحدود الخارجية للأشكال الرباعية القائمة.',
    example: 'مستطيل طوله 8m وعرضه 5m: المساحة = 40m²، المحيط = 26m.',
    stage: 'primary',
  },
  {
    keywords: ['دائرة', 'محيط الدائرة', 'مساحة الدائرة', 'قرص', 'circle', 'radius', 'circumference'],
    name: 'محيط ومساحة الدائرة',
    formula: 'المساحة = π × r² | المحيط = 2 × π × r',
    explanation: 'العلاقة بين نصف القطر r ومحيط الدائرة ومساحة القرص حيث π ≈ 3.14159.',
    example: 'دائرة نصف قطرها r = 7cm: المساحة ≈ 154cm²، المحيط ≈ 44cm.',
    stage: 'middle',
  },
  {
    keywords: ['فيثاغورس', 'مثلث قائم', 'الوتر', 'pythagoras', 'hypotenuse', 'right triangle'],
    name: 'مبرهنة فيثاغورس (المثلث القائم)',
    formula: 'a² + b² = c² (مربع الوتر = مجموع مربعي الضلعين القائمين)',
    explanation: 'تسمح بحساب طول أي ضلع في المثلث القائم بمعرفة الضلعين الآخرين وتأكيد التعامد.',
    example: 'مثلث قائم ضلعاه 3 و 4: الوتر c = √(9 + 16) = √25 = 5.',
    stage: 'middle',
  },
  {
    keywords: ['طالس', 'طاليس', 'توازي', 'تناسب', 'thales', 'intercept'],
    name: 'مبرهنة طاليس (التناسب والتوازي)',
    formula: 'AM / AB = AN / AC = MN / BC',
    explanation: 'تطبيق مباشر عند تقاطع مستقيمين بمستقيمين متوازيين لحساب الأطوال المجهولة.',
    example: 'إذا كان AM=3, AB=9, AN=2 فإن AC = (9×2)/3 = 6.',
    stage: 'middle',
  },
  {
    keywords: ['أوم', 'مقاومة', 'تيار', 'جهد', 'فولت', 'أمبير', 'ohm', 'voltage', 'current', 'resistor'],
    name: 'قانون أوم في الكهرباء (Ohm’s Law)',
    formula: 'U = R × I  (فرق الجهد = المقاومة × شدة التيار)',
    explanation: 'الجهد بالفولت (V)، المقاومة بالأوم (Ω)، وشدة التيار بالأمبير (A).',
    example: 'مقاومة R = 100Ω يمر بها تيار I = 0.2A: فرق الجهد U = 20V.',
    stage: 'middle',
  },
  // Secondary / Baccalaureate (Expanded STEM Excellence)
  {
    keywords: ['معادلة', 'درجة ثانية', 'المميز', 'دلتا', 'quadratic', 'discriminant', 'delta'],
    name: 'حل المعادلة من الدرجة الثانية (المميز دلتا)',
    formula: 'Δ = b² - 4ac | x₁,₂ = (-b ± √Δ) / 2a',
    explanation: 'إذا كان Δ > 0 حلان متمايزان، إذا Δ = 0 حل مضاعف x = -b/2a، إذا Δ < 0 حلان مركبان.',
    example: 'x² - 5x + 6 = 0: Δ = 25 - 24 = 1 > 0، الحلان هما x=2 و x=3.',
    stage: 'secondary',
  },
  {
    keywords: ['أسية', 'لوغارتم', 'لوغاريتم', 'ln', 'exp', 'exponential', 'logarithm'],
    name: 'خواص الدالة الأسية واللوغاريتم الطبيعي',
    formula: 'e^(a+b) = e^a × e^b | ln(a×b) = ln(a) + ln(b) | ln(e^x) = x | e^(ln x) = x',
    explanation: 'الدوال العكسية لبعضهما، أساس حساب النهايات والنمو وحل المعادلات التفاضلية.',
    example: 'ln(20) = ln(4 × 5) = 2 ln(2) + ln(5) | lim (ln(1+x))/x = 1 عند x -> 0.',
    stage: 'secondary',
  },
  {
    keywords: ['مشتق', 'اشتقاق', 'مشتقة', 'قاعدة السلسلة', 'derivative', 'differentiation', 'chain rule'],
    name: 'مشتقات الدوال المركبة وقواعد الاشتقاق',
    formula: '[u × v]\' = u\'v + uv\' | [u/v]\' = (u\'v - uv\') / v² | [f(u)]\' = u\' × f\'(u)',
    explanation: 'مشتقة الأسية المركبة [e^u]\' = u\' × e^u، ومشتقة اللوغاريتم [ln(u)]\' = u\' / u.',
    example: 'مشتقة f(x) = e^(3x² + 1) هي f\'(x) = 6x × e^(3x² + 1).',
    stage: 'secondary',
  },
  {
    keywords: ['تكامل', 'تكامل بالتجزئة', 'مساحات', 'دالة أصلية', 'integral', 'integration', 'parts'],
    name: 'الحساب التكاملي والتكامل بالتجزئة (Integration by Parts)',
    formula: '∫ u(x) v\'(x) dx = u(x) v(x) - ∫ u\'(x) v(x) dx',
    explanation: 'قاعدة ALPES لاختيار u(x): Arc, Log, Poly, Exp, Sin/Cos.',
    example: '∫ x e^x dx: نضع u=x و v\'=e^x فيكون الناتج x e^x - e^x + C.',
    stage: 'secondary',
  },
  {
    keywords: ['أعداد مركبة', 'عدد مركب', 'طويلة', 'عمدة', 'شكل مثلثي', 'موافر', 'complex numbers', 'euler'],
    name: 'الأعداد المركبة ودستور موافر والشكل الأسي',
    formula: 'z = a + ib = r e^(iθ) = r(cos θ + i sin θ) | (cos θ + i sin θ)^n = cos(nθ) + i sin(nθ)',
    explanation: 'الطويلة r = √(a² + b²)، العمدة tan(θ) = b/a مع مراعاة إشارات الربع الدائري.',
    example: 'z = 1 + i√3: الطويلة r = √(1+3)=2، العمدة θ = π/3، فيكون z = 2 e^(iπ/3).',
    stage: 'secondary',
  },
  {
    keywords: ['متتالية', 'متتاليات', 'حسابية', 'هندسية', 'برهان بالتراجع', 'sequence', 'induction'],
    name: 'المتتاليات العددية والبرهان بالتراجع (Mathematical Induction)',
    formula: 'حسابية: U_n = U_0 + n×r | هندسية: V_n = V_0 × q^n | مجموع الحسابية: S = n × (U_1 + U_n) / 2',
    explanation: 'البرهان بالتراجع: 1) التحقق للحد الأول، 2) فرض صحة P(n)، 3) إثبات صحة P(n+1).',
    example: 'متتالية هندسية حدها الأول 2 وأساسها 3: V_4 = 2 × 3^4 = 162.',
    stage: 'secondary',
  },
  {
    keywords: ['احتمال', 'احتمالات', 'توافيق', 'تراتيب', 'برنولي', 'probability', 'combinations', 'binomial'],
    name: 'قوانين الاحتمالات والتوزيع الثنائي (Binomial Distribution)',
    formula: 'C_n^k = n! / (k!(n-k)!) | P(X=k) = C_n^k p^k (1-p)^(n-k) | E(X) = n × p',
    explanation: 'قانون برنولي لتكرار تجربة ثنائية n مرة مستقلة باحتمال نجاح p، والأمل الرياضي E(X)=np.',
    example: 'رمي قطعة نقود 3 مرات: احتمال ظهور الوجه مرتين P(X=2) = C_3^2 (1/2)² (1/2)¹ = 3/8.',
    stage: 'secondary',
  },
  {
    keywords: ['قذيفة', 'قذائف', 'حركة منحنية', 'مسار', 'ذروة', 'مدى', 'projectile', 'trajectory'],
    name: 'حركة القذائف في حقل الجاذبية الأرضية المنتظم',
    formula: 'المسار: y(x) = - (g / (2 v₀² cos²α)) x² + (tan α) x | الذروة: y_max = (v₀² sin²α)/(2g)',
    explanation: 'المدى الأفقي X_P = (v₀² sin(2α)) / g، ويكون أعظمياً عند زاوية القذف α = 45°.',
    example: 'قذف كرة بسرعة v0=20m/s بزاوية α=30°: الذروة y_max = (400 × 0.25) / (2 × 9.8) ≈ 5.1m.',
    stage: 'secondary',
  },
  {
    keywords: ['كبلر', 'أقمار', 'كواكب', 'سرعة مدارية', 'دور مداري', 'kepler', 'orbital speed', 'satellite'],
    name: 'قوانين كبلر وحركة الأقمار الاصطناعية والكواكب',
    formula: 'السرعة: v = √(G × M / r) | الدور: T² / r³ = 4π² / (G × M)',
    explanation: 'القانون الثالث لكبلر يربط بين مربع الدور ومدار الجرم السماوي حول الكتلة المركزية M.',
    example: 'قمر اصطناعي على ارتفاع h من الأرض: نصف قطر المدار r = R_T + h.',
    stage: 'secondary',
  },
  {
    keywords: ['نيوتن', 'تسارع', 'قوة', 'ميكانيكا', 'قانون نيوتن الثاني', 'newton', 'force', 'acceleration'],
    name: 'القانون الثاني لنيوتن (مبدأ التحريك الأساسي)',
    formula: 'Σ F_ext = m × a  (محصلة القوى الخارجية = الكتلة × التسارع)',
    explanation: 'أساس دراسة حركة الكواكب، الأقمار الاصطناعية، القذائف، والمستويات المائلة.',
    example: 'كتلة m = 2kg بتسارع a = 3m/s² تتطلب محصلة قوى F = 6N.',
    stage: 'secondary',
  },
  {
    keywords: ['سقوط شاقولي', 'احتكاك مائع', 'سرعة حدية', 'أرخميدس', 'terminal velocity', 'drag force'],
    name: 'السقوط الشاقولي الحقيقي في مائع (الهواء/السوائل)',
    formula: 'm dv/dt = P - Π - f | السرعة الحدية: v_lim = √( (m g - Π) / k )',
    explanation: 'دافعة أرخميدس Π = ρ_fluid × V × g، وقوة الاحتكاك f = k v (سرعات صغيرة) أو k v² (سرعات كبيرة).',
    example: 'عند بلوغ السرعة الحدية v_lim ينعدم التسارع a=0 وتصبح الحركة مستقيمة منتظمة.',
    stage: 'secondary',
  },
  {
    keywords: ['معايرة', 'أكسدة وإرجاع', 'حمض وأساس', 'جدول التقدم', 'ph', 'titration', 'redox', 'equivalence'],
    name: 'المعايرة اللونية والـ pH-مترية ونقطة التكافؤ (Equivalence Point)',
    formula: 'عند التكافؤ: C_a × V_a / a = C_b × V_b / b | pH = pKa + log([A⁻]/[HA])',
    explanation: 'علاقة هندرسون-هاسلبالخ للمحاليل المنظمة، ونقطة نصف التكافؤ يكون فيها pH = pKa.',
    example: 'معايرة حمض HCl بأساس NaOH: عند التكافؤ n_acide = n_base أي C_a V_a = C_b V_bE.',
    stage: 'secondary',
  },
  {
    keywords: ['أسترة', 'إماهة', 'كحول', 'حمض كربوكسيلي', 'مردود', 'esterification', 'ester', 'yield'],
    name: 'تفاعل الأسترة وإماهة الإستر وحساب المردود',
    formula: 'R-COOH + R\'-OH ⇌ R-COO-R\' + H₂O | المردود: r = (n_ester_exp / n_th) × 100%',
    explanation: 'تفاعل بطيء، عكوس، ولا حراري. مردود أسترة مزيج متساوي المولات: 67% لكحول أولي، 60% لكحول ثانوي، 5-10% لكحول ثالثي.',
    example: 'خلط 1mol حمض إيثانويك مع 1mol إيثانول يعطي عند التوازن 0.67mol إستر (مردود 67%).',
    stage: 'secondary',
  },
  {
    keywords: ['إشعاعي', 'تفكك', 'نصف العمر', 'نشاط إشعاعي', 'طاقة الربط', 'نقص كتلي', 'radioactive', 'binding energy'],
    name: 'قانون التناقص الإشعاعي وطاقة الربط النووية (Einstein Mass-Energy)',
    formula: 'N(t) = N_0 e^(-λt) | t_(1/2) = ln(2)/λ | E_l = Δm × c² = [Z m_p + (A-Z) m_n - m_X] c²',
    explanation: 'طاقة الربط لكل نوية E_l/A تقيس مدى استقرار النواة، وتكون في ذروتها حول نواة الحديد Fe-56.',
    example: 'النقص الكتلي 1u يقابله طاقة ربط مكافئة تقدر بـ 931.5 MeV.',
    stage: 'secondary',
  },
  {
    keywords: ['مكثفة', 'وشيعة', 'دارة', 'rc', 'rl', 'rlc', 'ثابت الزمن', 'tau', 'circuit'],
    name: 'ثابت الزمن والاهتزازات الكهربائية (RC و RL و RLC)',
    formula: 'دارة RC: τ = R × C | دارة RL: τ = L / R | الدور الذاتي لـ RLC: T₀ = 2π √(L × C)',
    explanation: 'ثابت الزمن τ يمثل المدة اللازمة لشحن المكثفة أو إقامة التيار بنسبة 63.2% من القيمة العظمى.',
    example: 'مقاومة R=10kΩ ومكثفة C=100μF: ثابت الزمن τ = 10⁴ × 10⁻⁴ = 1s.',
    stage: 'secondary',
  },
  // University / Research
  {
    keywords: ['تايلور', 'ماكلورين', 'نشر محدود', 'متسلسلة', 'taylor series', 'maclaurin'],
    name: 'منشور تايلور وماكلورين (Taylor & Maclaurin Series)',
    formula: 'f(x) = Σ [f^(n)(a) / n!] × (x - a)^n',
    explanation: 'التقريب متعدد الحدود للدوال التحليلية وأساس التحليل العددي.',
    example: 'منشور ماكلورين للدالة الأسية: e^x = 1 + x + x²/2! + x³/3! + ...',
    stage: 'university',
  },
  {
    keywords: ['بايز', 'احتمال شرطي', 'بيان', 'bayes', 'conditional probability'],
    name: 'مبرهنة بايز في الاحتمال الشرطي (Bayes’ Theorem)',
    formula: 'P(A|B) = [P(B|A) × P(A)] / P(B)',
    explanation: 'تحديث الاحتمال المسبق للفرضية A عند رصد الدليل الجديد B في تعلم الآلة والتشخيص.',
    example: 'حساب الدقة التشخيصية لفحص طبي إيجابي بالاعتماد على انتشار المرض الحقيقي.',
    stage: 'university',
  },
  {
    keywords: ['شرودنغر', 'دالة موجية', 'كمي', 'كمية', 'schrodinger', 'quantum'],
    name: 'معادلة شرودنغر الكمية (Schrödinger Equation)',
    formula: 'iℏ ∂Ψ/∂t = Ĥ Ψ',
    explanation: 'المعادلة الحاكمة لتطور الدالة الموجية Ψ للحالة الكمية عبر مؤثر الهاميلتوني Ĥ.',
    example: 'جسيم في صندوق كمي بطاقات مكممة E_n = n²h² / (8mL²).',
    stage: 'university',
  },
  {
    keywords: ['قيم ذاتية', 'متجهات ذاتية', 'قطرية', 'eigenvalues', 'eigenvectors', 'diagonalization'],
    name: 'القيم والمتجهات الذاتية (Eigenvalues & Eigenvectors)',
    formula: 'A v = λ v | det(A - λI) = 0',
    explanation: 'إيجاد الاتجاهات التي لا يغير فيها التحويل الخطي A اتجاه المتجه v بل يمططه بالمعامل λ.',
    example: 'مصفوفة A 2x2 معادلتها المميزة det(A - λI) = 0 تعطي القيمتين الذاتيتين λ₁ و λ₂.',
    stage: 'university',
  },
];

export function isAcademicQuery(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /(?:تمرين|مسألة|معادلة|قانون|قوانين|واجب|واجبات|امتحان|امتحانات|فرض|فروض|اختبار|مذاكرة|دراسة|مراجعة|شرح درس|اشرح لي درس|حل لي|أخطأت في|لماذا الحل خطأ|كناش القوانين|جدول مذاكرة|خطة دراسية|بومودورو دراسي|ابتدائي|متوسط|بيام|bem|ثانوي|ثانوية|بكالوريا|باك|bac|جامعة|جامعي|بحث علمي|رسالة ماستر|أطروحة دكتوراه|مراجع أكاديمية|أوراق بحثية|openalex|math|physics|chemistry|biology|calculus|algebra|homework|exercise|exam|study plan|formula|cheat sheet)\b/iu.test(p);
}

export function detectAcademicStage(prompt: string): 'primary' | 'middle' | 'secondary' | 'university' | 'general' {
  const p = prompt.toLowerCase();
  if (/(?:جامع|ماستر|دكتوراه|أطروحة|بحث علمي|تخرج|ورقة بحثية|university|college|phd|thesis|paper|master|quantum|eigen)/i.test(p)) {
    return 'university';
  }
  if (/(?:بكالوريا|باك|ثانوي|ثانوية|bac|baccalaureate|اشتقاق|دالة أسية|دالة لوغارتمية|أعداد مركبة|متتاليات|نيوتن|تفكك إشعاعي)/i.test(p)) {
    return 'secondary';
  }
  if (/(?:متوسط|إعدادي|بيام|bem|طالس|طاليس|فيثاغورس|نشر وتحليل|المثلث القائم|قانون أوم)/i.test(p)) {
    return 'middle';
  }
  if (/(?:ابتدائي|أطفال|محيط المستطيل|مساحة المربع|ضرب وقسمة|primary|elementary)/i.test(p)) {
    return 'primary';
  }
  return 'general';
}

export function findMatchingFormulas(prompt: string) {
  const p = prompt.toLowerCase();
  const matched = [];
  for (const item of SERVER_FORMULA_CATALOG) {
    if (item.keywords.some(kw => p.includes(kw.toLowerCase()))) {
      matched.push(item);
    }
  }
  return matched;
}

export async function buildBackgroundAcademicContext(prompt: string, language: 'ar' | 'en'): Promise<string> {
  const stage = detectAcademicStage(prompt);
  const matchedFormulas = findMatchingFormulas(prompt);
  const isAr = language === 'ar';

  const stageLabel = stage === 'primary' ? (isAr ? 'الطور الابتدائي' : 'Primary / Elementary')
    : stage === 'middle' ? (isAr ? 'الطور المتوسط / الإعدادي' : 'Middle School (BEM)')
    : stage === 'secondary' ? (isAr ? 'الطور الثانوي / البكالوريا' : 'Secondary / Baccalaureate')
    : stage === 'university' ? (isAr ? 'الطور الجامعي والبحث العلمي' : 'University & Postgraduate')
    : (isAr ? 'جميع الأطوار الدراسية والأكاديمية' : 'All Academic Tiers');

  let formulaContext = '';
  if (matchedFormulas.length > 0) {
    formulaContext = isAr
      ? `\n[قوانين موثقة مسترجعة من كناش القوانين الأكاديمي في الخلفية]:\n` +
        matchedFormulas.map(f => `- **${f.name}**: \`${f.formula}\`\n  * الشرح: ${f.explanation}\n  * مثال تطبيقي: ${f.example}`).join('\n')
      : `\n[Verified Formulas Retrieved from Academic Database in Background]:\n` +
        matchedFormulas.map(f => `- **${f.name}**: \`${f.formula}\`\n  * Explanation: ${f.explanation}\n  * Worked Example: ${f.example}`).join('\n');
  }

  // Check if student wants scholarly research literature
  let researchContext = '';
  if (/(?:بحث|أوراق بحثية|ورقة بحثية|مراجع|مراجع علمية|دراسات سابقة|openalex|paper|papers|research|literature review)/i.test(prompt)) {
    try {
      const works = await AcademicEngine.searchWorks(prompt.replace(/(?:ابحث|أريد|مراجع|أوراق بحثية|عن|حول)/gi, '').trim());
      if (works.length > 0) {
        researchContext = isAr
          ? `\n[أوراق بحثية أكاديمية مفتوحة المصدر تم استرجاعها في الخلفية من OpenAlex و DOAJ]:\n` +
            works.slice(0, 3).map(w => `- "${w.title}" (${w.year || 'حديث'}), المؤلفون: ${w.authors.slice(0, 2).join(', ')}. الرابط: ${w.url}`).join('\n')
          : `\n[Peer-Reviewed Open Access Works Retrieved in Background via OpenAlex & DOAJ]:\n` +
            works.slice(0, 3).map(w => `- "${w.title}" (${w.year || 'Recent'}), Authors: ${w.authors.slice(0, 2).join(', ')}. Link: ${w.url}`).join('\n');
      }
    } catch {}
  }

  const guidelines = isAr
    ? `\n\n[ADEM Background Academic Intelligence Engine Active - المستوى المكتشف: ${stageLabel}]:
- أنت المرافق والمعلم الأكاديمي فائق الذكاء (Top-Tier Scientific & Academic Engine) المدمج في المحادثة مباشرة.
- نافس وتفوق على أقوى أنظمة الاستدلال في العالم (o1, Claude 3.7 Sonnet, Gemini Thinking) عبر المنهجية الصارمة التالية:
  1. **الاستدلال الاستنباطي من المبادئ الأولى (First-Principles Thinking)**:
     - لا تعطِ نتائج عددية مبتورة أبداً. ابدأ بتحديد المعطيات والنموذج الرياضي/الفيزيائي الحاكم (Governing Law).
     - اشتق العبارة الحرفية (Symbolic Derivation) كاملاً قبل تعويض أي أرقام.
     - أجرِ فحص التحليل البعدي (Dimensional Analysis) للتحقق من صحة أبعاد القانون.
  2. **صياغة رياضية وعلمية نقية (LaTeX Precision)**:
     - استخدم صيغ LaTeX الرياضية الواضحة: الصيغ المستقلة بـ \`$$ ... $$\` والمعادلات الداخلية بـ \`\\( ... \\)\`.
  3. **عيادة فخاخ الامتحانات والبكالوريا (Exam Traps Autopsy)**:
     - نبّه التلميذ فوراً للفخاخ الامتحانية التي يخسر فيها الطلاب النقاط عادة (كإشارات الأشعة، وحدات الحجوم والكتل، الشروط الابتدائية، إشارات العمل والطاقة، إهمال القيمة المطلقة في اللوغاريتم والتكامل، أو المتفاعل المحد في جدول التقدم).
  4. **الشفرة الذهبية والرسوخ الذهني (Memory Anchor)**:
     - اختم بقاعدة ذهبية أو جملة رسوخ مختصرة تلخص المفهوم كمرجع لا ينسى.
- **البطاقات الأكاديمية التفاعلية (Interactive Academic Cards)**:
  عند حل مسألة أو شرح قانون أو تحليل خطأ أو تقديم كويز، ضمّن دائماً كتلة :::academic-card في الرد لتظهر واجهة تفاعلية في الشات:
  :::academic-card
  {
    "type": "formula" | "mistake_analysis" | "study_plan" | "quiz",
    "stage": "${stage}",
    "title": "عنوان البطاقة",
    "subject": "رياضيات" | "فيزياء" | "كيمياء" | "علوم",
    "formula": "الصيغة الرياضية",
    "explanation": "الشرح الدقيق",
    "variables": [
      { "symbol": "...", "name": "...", "unit": "SI" }
    ],
    "example": "تطبيق عددي محلول",
    "examTrap": "الفخ الأكثر خطورة",
    "goldenRule": "القاعدة الذهبية"
  }
  :::
${formulaContext}${researchContext}`
    : `\n\n[ADEM Background Academic Intelligence Engine Active - Detected Tier: ${stageLabel}]:
- You are the Top-Tier Scientific & Academic Reasoning Engine integrated directly into the chat.
- Outperform world-class educational AI systems through this strict pedagogical methodology:
  1. **First-Principles Derivation**:
     - State the governing physical/mathematical model clearly before numerical operations.
     - Perform complete symbolic algebraic manipulation before numeric substitution.
     - Verify dimensional consistency with SI base units.
  2. **LaTeX Mathematical Precision**:
     - Use LaTeX syntax for all formulas: \`$$ ... $$\` for display equations and \`\\( ... \\)\` for inline math.
  3. **Exam Traps Autopsy**:
     - Explicitly highlight common pitfalls where students lose marks (sign conventions, unit conversions, boundary conditions, edge cases).
  4. **Memory Anchor**:
     - Provide a golden rule or mnemonic sentence cementing the concept.
- **Interactive Academic Card Embeds**:
  Always emit an interactive :::academic-card block when presenting formulas, mistake analyses, quizzes, or study plans:
  :::academic-card
  {
    "type": "formula" | "mistake_analysis" | "study_plan" | "quiz",
    "stage": "${stage}",
    "title": "Title",
    "subject": "Mathematics" | "Physics" | "Chemistry" | "Biology",
    "formula": "Governing Equation",
    "explanation": "Precise explanation",
    "variables": [
      { "symbol": "...", "name": "...", "unit": "SI" }
    ],
    "example": "Solved numerical example",
    "examTrap": "Critical exam pitfall to avoid",
    "goldenRule": "Golden takeaway rule"
  }
  :::
${formulaContext}${researchContext}`;

  return guidelines;
}
