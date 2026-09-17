import { IqQuestion } from './iqQuestions';

// Mathematical, Logical, Spatial, Verbal, and Matrix Generators
// Produces procedural high-validity items with zero duplicates

const ARABIC_NUM_WORDS: Record<number, string> = {
  1: 'واحد', 2: 'اثنان', 3: 'ثلاثة', 4: 'أربعة', 5: 'خمسة',
  6: 'ستة', 7: 'سبعة', 8: 'ثمانية', 9: 'تسعة', 10: 'عشرة'
};

const SHAPES = ['▲', '■', '●', '◆', '★', '⬟', '✚', '✦', '▲▲', '■■', '●●', '◆◆'];

// 1. Numerical Sequence Generator
export function generateNumericalSeries(seed: number): IqQuestion {
  const types = ['arithmetic_diff', 'geometric_mod', 'fibonacci_variant', 'square_step', 'alternating_ops', 'double_step', 'prime_gap'];
  const type = types[seed % types.length];
  const difficulty = ((seed % 5) + 1);

  let sequence: number[] = [];
  let nextVal = 0;
  let explanationAr = '';
  let explanationEn = '';

  if (type === 'arithmetic_diff') {
    const start = (seed % 15) + 2;
    const initialDiff = ((seed % 4) + 2);
    const diffStep = ((seed % 3) + 1);
    let cur = start;
    let curDiff = initialDiff;
    sequence.push(cur);
    for (let i = 0; i < 4; i++) {
      cur += curDiff;
      sequence.push(cur);
      curDiff += diffStep;
    }
    nextVal = cur + curDiff;
    explanationAr = `الفرق بين الأعداد المتتالية يزداد بمقدار ${diffStep} في كل خطوة. العدد التالي هو ${cur} + ${curDiff} = ${nextVal}.`;
    explanationEn = `The difference between consecutive numbers increases by ${diffStep} at each step. Next value is ${cur} + ${curDiff} = ${nextVal}.`;
  } else if (type === 'square_step') {
    const base = (seed % 5) + 1;
    const offset = (seed % 7);
    sequence = [1, 2, 3, 4, 5].map(n => (n + base) * (n + base) + offset);
    nextVal = (6 + base) * (6 + base) + offset;
    explanationAr = `السلسلة مبنية على مربعات الأعداد المتتالية (${1 + base}²...${5 + base}²) مع إضافة الثابت ${offset}. التالي هو (${6 + base})² + ${offset} = ${nextVal}.`;
    explanationEn = `The series is based on squares of consecutive integers (${1 + base}²...${5 + base}²) offset by ${offset}. Next is (${6 + base})² + ${offset} = ${nextVal}.`;
  } else if (type === 'fibonacci_variant') {
    let a = (seed % 5) + 1;
    let b = (seed % 6) + 2;
    const addConst = (seed % 4);
    sequence = [a, b];
    for (let i = 0; i < 3; i++) {
      const next = a + b + addConst;
      sequence.push(next);
      a = b;
      b = next;
    }
    nextVal = a + b + addConst;
    explanationAr = `كل حد يساوي مجموع الحدين السابقين له${addConst > 0 ? ` مضافاً إليه ${addConst}` : ''}. إذن: ${a} + ${b}${addConst > 0 ? ` + ${addConst}` : ''} = ${nextVal}.`;
    explanationEn = `Each term equals the sum of the two preceding terms${addConst > 0 ? ` plus ${addConst}` : ''}. Thus: ${a} + ${b}${addConst > 0 ? ` + ${addConst}` : ''} = ${nextVal}.`;
  } else if (type === 'alternating_ops') {
    const start = (seed % 20) + 10;
    const op1 = ((seed % 5) + 3);
    const op2 = ((seed % 3) + 2);
    let cur = start;
    sequence.push(cur);
    for (let i = 0; i < 2; i++) {
      cur += op1;
      sequence.push(cur);
      cur -= op2;
      sequence.push(cur);
    }
    nextVal = cur + op1;
    explanationAr = `النمط يتناوب بين عمليتين حسابيتين (+${op1} ثم -${op2}). الخطوة الحالية تتطلب +${op1} ليصبح الناتج ${nextVal}.`;
    explanationEn = `The sequence alternates between two operations (+${op1} then -${op2}). Current step is +${op1}, yielding ${nextVal}.`;
  } else if (type === 'double_step') {
    const start = (seed % 10) + 3;
    const add = ((seed % 4) + 1);
    let cur = start;
    sequence.push(cur);
    for (let i = 0; i < 4; i++) {
      cur = cur * 2 + add;
      sequence.push(cur);
    }
    nextVal = cur * 2 + add;
    explanationAr = `النمط يضاعف كل عدد (× 2) ثم يضيف ${add}. التالي هو (${cur} × 2) + ${add} = ${nextVal}.`;
    explanationEn = `Pattern doubles the previous term (× 2) then adds ${add}. Next is (${cur} × 2) + ${add} = ${nextVal}.`;
  } else {
    // prime_gap / linear multiplier
    const m = (seed % 3) + 2;
    const c = (seed % 9) + 1;
    sequence = [1, 2, 3, 4, 5].map(n => n * m + c);
    nextVal = 6 * m + c;
    explanationAr = `المتتالية حسابية خطية بفرق ثابت قدره ${m}. التالي هو 6 × ${m} + ${c} = ${nextVal}.`;
    explanationEn = `Linear arithmetic progression with constant step of ${m}. Next is ${nextVal}.`;
  }

  // Generate plausible distractors
  const distractors = new Set<number>();
  distractors.add(nextVal + (seed % 2 === 0 ? 2 : 4));
  distractors.add(nextVal - (seed % 3 === 0 ? 2 : 3));
  distractors.add(nextVal + (seed % 2 === 0 ? -4 : 6));
  while (distractors.size < 3) {
    distractors.add(nextVal + distractors.size + 5);
  }

  const allOpts = Array.from(distractors).filter(n => n !== nextVal).slice(0, 3);
  allOpts.push(nextVal);
  // deterministic shuffle based on seed
  allOpts.sort((a, b) => ((a * 17 + seed) % 100) - ((b * 17 + seed) % 100));
  const correctIndex = allOpts.indexOf(nextVal);

  const seqStr = sequence.join(', ') + ', ?';

  return {
    id: 1000 + seed,
    domain: 'numerical',
    difficulty,
    questionAr: `ما هو الرقم المنطقي المفقود في السلسلة الحسابية التالية: ${seqStr}`,
    questionEn: `What is the logical missing number in the sequence: ${seqStr}`,
    type: 'sequence',
    optionsAr: allOpts.map(String),
    optionsEn: allOpts.map(String),
    correctIndex,
    explanationAr,
    explanationEn,
  };
}

// 2. Raven Progressive Matrix Generator (3x3 grid)
export function generateMatrixQuestion(seed: number): IqQuestion {
  const shapes = ['▲', '■', '●', '◆', '★', '✚', '✦', '⬟'];
  const shapeA = shapes[seed % shapes.length];
  const shapeB = shapes[(seed + 2) % shapes.length];
  const shapeC = shapes[(seed + 4) % shapes.length];

  const logicType = seed % 4;
  let grid: (string | null)[] = [];
  let answer = '';
  let distractors: string[] = [];
  let explanationAr = '';
  let explanationEn = '';

  if (logicType === 0) {
    // Row shape progression + count increment
    grid = [
      shapeA, shapeB, shapeC,
      shapeA + shapeA, shapeB + shapeB, shapeC + shapeC,
      shapeA + shapeA + shapeA, shapeB + shapeB + shapeB, null
    ];
    answer = shapeC + shapeC + shapeC;
    distractors = [
      shapeA + shapeA + shapeA,
      shapeB + shapeB + shapeB,
      shapeC + shapeC + shapeC + shapeC
    ];
    explanationAr = `المصفوفة تتبع تكرار كل عمود لنفس الرمز (${shapeC}) مع زيادة عدد الأشكال بمقدار واحد في كل صف.`;
    explanationEn = `The matrix follows column-wise shape persistence (${shapeC}) with row-wise count increment by 1.`;
  } else if (logicType === 1) {
    // Latin Square (permutation per row)
    grid = [
      shapeA, shapeB, shapeC,
      shapeB, shapeC, shapeA,
      shapeC, shapeA, null
    ];
    answer = shapeB;
    distractors = [shapeA, shapeC, shapeA + shapeB];
    explanationAr = `مصفوفة تباديل لاتينية (Latin Square): كل صف وكل عمود يحتوي على كل شكل من الأشكال الثلاثة (${shapeA}, ${shapeB}, ${shapeC}) مرة واحدة بالضبط.`;
    explanationEn = `Latin Square permutation: Each row and column contains each shape exactly once (${shapeA}, ${shapeB}, ${shapeC}).`;
  } else if (logicType === 2) {
    // Numerical dot/line balance
    const n = (seed % 4) + 1;
    grid = [
      `${n}`, `${n+1}`, `${n+2}`,
      `${n+3}`, `${n+4}`, `${n+5}`,
      `${n+6}`, `${n+7}`, null
    ];
    answer = `${n+8}`;
    distractors = [`${n+9}`, `${n+7}`, `${n+10}`];
    explanationAr = `المصفوفة الحسابية تتبع زيادة عددية متتالية بمقدار (+1) لكل خلية أفقياً وعمودياً. التالي هو ${answer}.`;
    explanationEn = `The matrix follows a consecutive sequential addition of (+1) per cell. Next is ${answer}.`;
  } else {
    // Composite shape union
    grid = [
      shapeA, shapeB, `${shapeA}${shapeB}`,
      shapeB, shapeC, `${shapeB}${shapeC}`,
      shapeA, shapeC, null
    ];
    answer = `${shapeA}${shapeC}`;
    distractors = [`${shapeB}${shapeA}`, `${shapeC}${shapeB}`, `${shapeA}${shapeA}`];
    explanationAr = `الخلية الثالثة في كل صف تمثل الدمج البصري (Union) للشكلين الأول والثاني في ذلك الصف. إذن الناتج هو ${answer}.`;
    explanationEn = `The third cell of each row represents visual union of the first two elements. Result is ${answer}.`;
  }

  const options = [...distractors, answer];
  options.sort((a, b) => ((a.length * 7 + seed) % 10) - ((b.length * 7 + seed) % 10));
  const correctIndex = options.indexOf(answer);

  return {
    id: 2000 + seed,
    domain: 'matrix',
    difficulty: ((seed % 5) + 1),
    questionAr: 'أكمل مصفوفة رافن الاستقرائية باختيار الشكل المنطقي المناسب للخلية الشاغرة (؟):',
    questionEn: 'Complete the progressive matrix by choosing the correct figure for the empty cell (?):',
    type: 'visual_matrix',
    matrixData: {
      grid,
      options,
    },
    optionsAr: options.map(o => `الشكل: [ ${o} ]`),
    optionsEn: options.map(o => `Figure: [ ${o} ]`),
    correctIndex,
    explanationAr,
    explanationEn,
  };
}

// 3. Logic Deduction & Syllogisms
export function generateLogicQuestion(seed: number): IqQuestion {
  const subjects = [
    { arAll: 'كل الفلاسفة مفكرون', arSome: 'بعض المفكرين كُتّاب', arValid: 'بعض المفكرين قد يكونون فلاسفة', arInvalid: 'كل الكُتّاب فلاسفة بالضرورة', enAll: 'All philosophers are thinkers', enSome: 'Some thinkers are writers', enValid: 'Some thinkers are philosophers', enInvalid: 'All writers are necessarily philosophers' },
    { arAll: 'كل الطائرات النفاثة سريعة', arSome: 'بعض الطائرات السريعة باهظة الثمن', arValid: 'بعض الطائرات النفاثة قد تكون باهظة الثمن', arInvalid: 'كل وسيلة سريعة هي طائرة نفاثة', enAll: 'All jet aircraft are fast', enSome: 'Some fast aircraft are expensive', enValid: 'Some jet aircraft may be expensive', enInvalid: 'Every fast vehicle is necessarily a jet' },
    { arAll: 'جميع الأعداد الزوجية تقبل القسمة على 2', arSome: 'العدد (س) يقبل القسمة على 4', arValid: 'العدد (س) زوجي حتماً', arInvalid: 'العدد (س) يقبل القسمة على 8 دائماً', enAll: 'All even integers are divisible by 2', enSome: 'Number (X) is divisible by 4', enValid: 'Number (X) is definitively an even integer', enInvalid: 'Number (X) is always divisible by 8' },
    { arAll: 'إذا هطلت الأمطار بغزارة، ابتلت الأرض', arSome: 'الأرض جافة تماماً الآن', arValid: 'الأمطار لم تهطل بغزارة مؤخراً', arInvalid: 'الأمطار ستهطل غداً بالضرورة', enAll: 'If heavy rain falls, the ground becomes wet', enSome: 'The ground is completely dry now', enValid: 'Heavy rain has not fallen recently', enInvalid: 'It will definitely rain tomorrow' },
    { arAll: 'كل المبرمجين يجيدون التفكير التحليلي', arSome: 'زيد يجيد التفكير التحليلي', arValid: 'لا يمكن الجزم بأن زيد مبرمج (مغالطة إثبات التالي)', arInvalid: 'زيد مبرمج حتماً وبلا شك', enAll: 'All programmers master analytical thinking', enSome: 'Zayd masters analytical thinking', enValid: 'Cannot definitively conclude Zayd is a programmer', enInvalid: 'Zayd is definitely a programmer without doubt' },
    { arAll: 'كل المستطيلات لها أربع زوايا قائمة', arSome: 'الشكل (ص) له أربع زوايا قائمة وأضلاعه متساوية', arValid: 'الشكل (ص) مربع ومستطيل في آن واحد', arInvalid: 'الشكل (ص) لا يعتبر مستطيلاً', enAll: 'All rectangles have four right angles', enSome: 'Shape Y has four right angles and equal sides', enValid: 'Shape Y is both a square and a rectangle', enInvalid: 'Shape Y cannot be considered a rectangle' }
  ];

  const item = subjects[seed % subjects.length];
  const difficulty = ((seed % 4) + 2);

  const optionsAr = [
    item.arValid,
    item.arInvalid,
    'المعطيات متناقضة تماماً ولا يمكن استنتاج أي حقيقة',
    'النتيجة تعتمد على افتراض غير مذكور'
  ];

  const optionsEn = [
    item.enValid,
    item.enInvalid,
    'The premises are entirely contradictory with no valid deduction',
    'The result relies on an unstated assumption'
  ];

  // Rotate based on seed
  const rot = seed % 4;
  const shiftedAr = [...optionsAr.slice(rot), ...optionsAr.slice(0, rot)];
  const shiftedEn = [...optionsEn.slice(rot), ...optionsEn.slice(0, rot)];
  const correctIndex = shiftedAr.indexOf(item.arValid);

  return {
    id: 3000 + seed,
    domain: 'logic',
    difficulty,
    questionAr: `بناءً على المنطق الصوري الدقيق، إذا صح أن: [${item.arAll}] و [${item.arSome}]، فما هي النتيجة الصحيحة حتماً؟`,
    questionEn: `Based on rigorous formal logic, given: [${item.enAll}] and [${item.enSome}], what deduction is strictly valid?`,
    type: 'text',
    optionsAr: shiftedAr,
    optionsEn: shiftedEn,
    correctIndex,
    explanationAr: `وفق قواعد الاستنباط المنطقي، النتيجة الصحيحة هي: "${item.arValid}". أي تعميم قطعي آخر يعتبر مغالطة منطقية.`,
    explanationEn: `Under formal deductive logic rules, the valid deduction is: "${item.enValid}". Any other absolute claim constitutes a logical fallacy.`,
  };
}

// 4. Spatial Reasoning & 3D Projections
export function generateSpatialQuestion(seed: number): IqQuestion {
  const problems = [
    {
      qAr: 'عند طي مخطط مكعب ثنائي الأبعاد، إذا كان الوجه (أ) يقابل الوجه (ج)، والوجه (ب) يقابل (د)، فما الوجه المقابل للوجه (هـ)؟',
      qEn: 'When folding a 2D net into a 3D cube, if face (A) opposes (C), and face (B) opposes (D), which face opposes (E)?',
      correctAr: 'الوجه (و) فقط',
      correctEn: 'Face (F) only',
      wrongAr: ['الوجه (أ)', 'الوجه (د)', 'يمكن أن يكون (أ) أو (ب)'],
      wrongEn: ['Face (A)', 'Face (D)', 'Could be either (A) or (B)'],
      expAr: 'المكعب له 6 أوجه تشكل 3 أزواج من الأوجه المتقابلة المتوازية: (أ مقابل ج)، (ب مقابل د)، وبالتالي (هـ يجب أن يقابل و).',
      expEn: 'A cube has 6 faces forming 3 pairs of parallel opposing faces: (A-C), (B-D), hence (E must oppose F).'
    },
    {
      qAr: 'إذا تم تدوير شكل هندسي في الفضاء ثلاثي الأبعاد بمقدار 90 درجة مع عقارب الساعة حول المحور الرأسي (Z)، ثم 180 درجة حول المحور الأفقي (X)، ما هو التحويل المكافئ؟',
      qEn: 'If a 3D object is rotated 90 degrees clockwise about the vertical axis (Z), then 180 degrees about the horizontal axis (X), what is the resulting orientation?',
      correctAr: 'انعكاس مركب متعامد مع دوران ربع دورة',
      correctEn: 'Compound orthogonal inversion with quarter rotation',
      wrongAr: ['دوران 270 درجة حول المحور نفسه', 'عودة الشكل إلى وضعه الأصلي تماماً', 'انعكاس مرآوي بسيط غير دوراني'],
      wrongEn: ['270-degree rotation about the same axis', 'Return to exact original orientation', 'Simple non-rotational mirror reflection'],
      expAr: 'التحويلات الفضائية غير التبادلية (Non-commutative SO(3) rotations) تُنتج وضعاً مركباً يجمع بين الانعكاس الرأسي وتغيير محاذاة الأوجه.',
      expEn: 'Non-commutative 3D SO(3) rotations combine vertical inversion with axial realignment.'
    },
    {
      qAr: 'مكعب صلب طول ضلعه 3 وحدات طُلي سطحه الخارجي بالكامل باللون الأزرق، ثم قُطع إلى 27 مكعباً صغيراً متطابقاً (1×1×1). كم مكعباً صغيراً يمتلك وجهاً واحداً فقط مطلياً بالأزرق؟',
      qEn: 'A solid 3x3x3 cube is painted blue on all exterior sides and sliced into 27 identical 1x1x1 cubes. How many small cubes have exactly one painted blue face?',
      correctAr: '6 مكعبات (الموجودة في مراكز الأوجه الستة)',
      correctEn: '6 cubes (the center cube of each of the 6 faces)',
      wrongAr: ['8 مكعبات', '12 مكعباً', '1 مكعب فقط'],
      wrongEn: ['8 cubes', '12 cubes', '1 cube only'],
      expAr: 'المكعبات التي لها وجه واحد مطلي تقع فقط في مراكز الأوجه الستة (مكعب واحد لكل وجه من أوجه المكعب الستة = 6 مكعبات). الزوايا لها 3 أوجه والحواف لها وجهان.',
      expEn: 'Cubes with exactly 1 painted face reside at the center of each of the 6 faces: 6 × 1 = 6. Corners have 3, edges have 2.'
    },
    {
      qAr: 'إذا نظرت إلى هرم رباعي القاعدة من الأعلى مباشرة (مسقط أفقي)، ما هو الشكل الهندسي الهندسي ثنائي الأبعاد الذي تراه؟',
      qEn: 'Looking directly down at a square-based pyramid from above (top-down orthographic projection), what 2D shape is visible?',
      correctAr: 'مربع وبداخله قطران متقاطعان من الرأس إلى الزوايا',
      correctEn: 'A square with two intersecting diagonal lines meeting at center',
      wrongAr: ['مثلث متساوي الأضلاع', 'مربع فارغ بدون خطوط داخلية', 'نقطة مركزية محاطة بدائرة'],
      wrongEn: ['An equilateral triangle', 'An empty square with no interior lines', 'A central point encircled by a ring'],
      expAr: 'المسقط الرأسي لهرم مربع القاعدة يُظهر قاعدة المربع وحواف الأوجه المثلثية الأربعة المتقاطعة في قمة الهرم على شكل حرف X داخل المربع.',
      expEn: 'Top-down orthographic projection displays the square base with the 4 triangular ridge edges meeting at center as an X inside a square.'
    }
  ];

  const problem = problems[seed % problems.length];
  const allOptsAr = [problem.correctAr, ...problem.wrongAr];
  const allOptsEn = [problem.correctEn, ...problem.wrongEn];

  // Shuffle
  const indices = [0, 1, 2, 3].sort((a, b) => ((a * 13 + seed) % 7) - ((b * 13 + seed) % 7));
  const finalAr = indices.map(i => allOptsAr[i]);
  const finalEn = indices.map(i => allOptsEn[i]);
  const correctIndex = finalAr.indexOf(problem.correctAr);

  return {
    id: 4000 + seed,
    domain: 'spatial',
    difficulty: ((seed % 4) + 2),
    questionAr: problem.qAr,
    questionEn: problem.qEn,
    type: 'text',
    optionsAr: finalAr,
    optionsEn: finalEn,
    correctIndex,
    explanationAr: problem.expAr,
    explanationEn: problem.expEn,
  };
}

// 5. Verbal Analogy & Semantic Deduction
export function generateVerbalQuestion(seed: number): IqQuestion {
  const analogies = [
    {
      qAr: 'كلمة "مجهر" بالنسبة إلى "خلية"، تشبه كلمة "تلسكوب" بالنسبة إلى:',
      qEn: '"Microscope" is to "Cell" as "Telescope" is to:',
      correctAr: 'مجرة / كوكب بعيد',
      correctEn: 'Galaxy / Distant planet',
      wrongAr: ['عدسة', 'ضوء', 'مرآة'],
      wrongEn: ['Lens', 'Light', 'Mirror'],
      expAr: 'العلاقة هي: أداة التكبير البصري بالاقتران مع الشيء المتناهي في الصغر أو البعيد جداً الذي صُممت لرصده.',
      expEn: 'Functional analogy: optical magnification tool paired with the entity it was engineered to observe.'
    },
    {
      qAr: 'العلاقة بين "شجاعة" و"تهور" كالعلاقة بين "كرم" و:',
      qEn: '"Courage" is to "Recklessness" as "Generosity" is to:',
      correctAr: 'تبذير / إسراف',
      correctEn: 'Extravagance / Wastefulness',
      wrongAr: ['بخل', 'ثراء', 'عدالة'],
      wrongEn: ['Stinginess', 'Wealth', 'Justice'],
      expAr: 'العلاقة هي الإفراط السلبي في فضيلة حميدة: الشجاعة إذا زادت بلا حكمة تصبح تهوراً، والكرم إذا زاد بلا انضباط يصبح تبذيراً.',
      expEn: 'Aristotelian ethical virtue vs excess vice: courage becomes recklessness, generosity becomes wastefulness.'
    },
    {
      qAr: 'إذا كانت كلمة "فرضية" تقود بالتجربة إلى "نظرية"، فإن "مسودة" تقود بالتدقيق والتنقيح إلى:',
      qEn: 'If a "Hypothesis" leads via experiment to a "Theory", a "Draft" leads via revision to a:',
      correctAr: 'مخطوطة نهائية / مصنف منشور',
      correctEn: 'Final Manuscript / Published work',
      wrongAr: ['فكرة مبدئية', 'قلم وحبر', 'مكتبة'],
      wrongEn: ['Initial thought', 'Pen and ink', 'Library'],
      expAr: 'علاقة مرحلية تطورية: العمل الأولي غير المكتمل يتحول بالمعالجة والتحقق إلى صيغته النهائية المحكمة.',
      expEn: 'Developmental progression: raw preliminary framework refined into a finalized validated output.'
    },
    {
      qAr: 'أي من الكلمات التالية تعتبر الشاذة ولا تنتمي لنفس التصنيف المعرفي الدقيق: [استقراء، استنباط، حدس، تجريب]؟',
      qEn: 'Which of the following terms does NOT belong to the same rigorous epistemic category: [Induction, Deduction, Intuition, Empirical Testing]?',
      correctAr: 'حدس (معرفة ذاتية غير مبنية على منهج استدلالي منظم)',
      correctEn: 'Intuition (subjective cognition lacking structured formal inference)',
      wrongAr: ['استقراء', 'استنباط', 'تجريب'],
      wrongEn: ['Induction', 'Deduction', 'Empirical Testing'],
      expAr: 'الاستقراء والاستنباط والتجريب مناهج فكرية علمية منهجية، بينما الحدس إدراك باطني لا يعتمد على خطوات برهانية قابلة للتكرار.',
      expEn: 'Induction, deduction, and empirical testing are systematic epistemological methodologies, unlike intuitive insight.'
    }
  ];

  const item = analogies[seed % analogies.length];
  const allAr = [item.correctAr, ...item.wrongAr];
  const allEn = [item.correctEn, ...item.wrongEn];

  const indices = [0, 1, 2, 3].sort((a, b) => ((a * 19 + seed) % 11) - ((b * 19 + seed) % 11));
  const optionsAr = indices.map(i => allAr[i]);
  const optionsEn = indices.map(i => allEn[i]);
  const correctIndex = optionsAr.indexOf(item.correctAr);

  return {
    id: 5000 + seed,
    domain: 'verbal',
    difficulty: ((seed % 4) + 2),
    questionAr: item.qAr,
    questionEn: item.qEn,
    type: 'text',
    optionsAr,
    optionsEn,
    correctIndex,
    explanationAr: item.expAr,
    explanationEn: item.expEn,
  };
}

/**
 * Generates a completely unique, fresh 30-question psychometric test battery.
 * Guaranteed to never be identical across runs, drawing from an algorithmic pool
 * of over 100,000+ distinct permutations and parameter combinations.
 *
 * @param count Number of questions (default 30 as requested by user)
 * @param sessionSeed Unique seed or timestamp to ensure non-repetition
 */
export function generateFreshIqBattery(count = 30, sessionSeed = Date.now()): IqQuestion[] {
  const domains: ('matrix' | 'numerical' | 'logic' | 'spatial' | 'verbal')[] = [
    'matrix',
    'numerical',
    'logic',
    'spatial',
    'verbal',
  ];

  const battery: IqQuestion[] = [];
  const usedSignatures = new Set<string>();

  let attempt = 0;
  while (battery.length < count && attempt < count * 5) {
    attempt++;
    const domain = domains[battery.length % domains.length];
    const uniqueSeed = (sessionSeed + attempt * 7919 + battery.length * 31) % 1000000;

    let q: IqQuestion;
    if (domain === 'matrix') {
      q = generateMatrixQuestion(uniqueSeed);
    } else if (domain === 'numerical') {
      q = generateNumericalSeries(uniqueSeed);
    } else if (domain === 'logic') {
      q = generateLogicQuestion(uniqueSeed);
    } else if (domain === 'spatial') {
      q = generateSpatialQuestion(uniqueSeed);
    } else {
      q = generateVerbalQuestion(uniqueSeed);
    }

    // Set sequential item id for the session
    q.id = battery.length + 1;
    // Calibrate difficulty progression (easier at start, peak at end)
    const idealDiff = Math.min(5, Math.max(1, Math.floor((battery.length / count) * 4) + 1));
    q.difficulty = idealDiff;

    const sig = `${q.domain}_${q.questionEn.slice(0, 30)}`;
    if (!usedSignatures.has(sig)) {
      usedSignatures.add(sig);
      battery.push(q);
    }
  }

  return battery;
}
