import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface HermesSkill {
  id: string;
  name: string;
  displayNameAr: string;
  category: 'coding' | 'math' | 'creativity' | 'data' | 'system' | 'reasoning' | 'ui';
  description: string;
  triggers: string[];
  proceduralSteps: string[];
  bestPractices: string[];
  acquiredAt: number;
  lastUsedAt: number;
  usageCount: number;
  successRate: number;
  level: number; // 1 to 10 mastery level
  origin: 'builtin' | 'autonomous_learned';
}

export interface HermesEvolutionStats {
  totalSkills: number;
  autonomousSkillsLearned: number;
  totalExecutions: number;
  averageMasteryLevel: number;
  lastEvolvedAt: number;
  topSkills: Array<{ name: string; level: number; usageCount: number }>;
}

const STORAGE_FILE = path.join(process.cwd(), '.hermes_skills.json');

const INITIAL_HERMES_SKILLS: HermesSkill[] = [
  {
    id: 'skill_interactive_ui_apps',
    name: 'Interactive HTML5/JS Live App Synthesis',
    displayNameAr: 'توليد التطبيقات والأدوات التفاعلية الحية',
    category: 'ui',
    description: 'Generates completely standalone, single-file HTML5/CSS/JS widgets that run immediately in the live chat sandbox.',
    triggers: ['حاسبة', 'calculator', 'لعبة', 'game', 'تطبيق', 'app', 'widget', 'أداة', 'مؤقت', 'timer', 'تفاعلي', 'interactive', 'html'],
    proceduralSteps: [
      'Encapsulate complete CSS (Tailwind/modern dark styles) and JS within a single ```html ... ``` block.',
      'Ensure event listeners, state updates, and DOM manipulations are completely bug-free.',
      'Provide clear, responsive typography and sleek dark UI aesthetics with smooth interactions.',
    ],
    bestPractices: ['Never rely on external unbundled CSS files', 'Use semantic HTML elements with distinct IDs', 'Handle window resize and device touch gracefully'],
    acquiredAt: Date.now() - 86400000 * 10,
    lastUsedAt: Date.now(),
    usageCount: 42,
    successRate: 0.98,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_arabic_nlp_mastery',
    name: 'Advanced Arabic Linguistic & Conceptual Synthesis',
    displayNameAr: 'الإتقان اللغوي والمفاهيمي العربي المتقدم',
    category: 'reasoning',
    description: 'Delivers eloquent, grammatically sound, high-density Arabic technical and creative responses.',
    triggers: ['عربي', 'شرح', 'ترجم', 'لخص', 'اعراب', 'بلاغة', 'صياغة', 'تقرير', 'مقال'],
    proceduralSteps: [
      'Maintain authentic Arabic terminology alongside common industry English technical terms when helpful.',
      'Use structured headings, scannable bullet points, and accurate punctuation.',
      'Formulate concise executive summaries followed by deep analytical proofs.',
    ],
    bestPractices: ['Avoid robotic literal translations', 'Adopt professional and friendly tone', 'Structure answers logically with Markdown'],
    acquiredAt: Date.now() - 86400000 * 8,
    lastUsedAt: Date.now(),
    usageCount: 65,
    successRate: 0.99,
    level: 10,
    origin: 'builtin',
  },
  {
    id: 'skill_algorithmic_problem_solving',
    name: 'Step-by-Step Algorithmic & Code Architecture',
    displayNameAr: 'التحليل الخوارزمي وبناء النظم البرمجية',
    category: 'coding',
    description: 'Deconstructs complex engineering problems into clean, robust, and performant modular TypeScript/Python solutions.',
    triggers: ['كود', 'code', 'برمجة', 'algorithm', 'خوارزمية', 'typescript', 'python', 'react', 'api', 'server', 'database', 'حل مشكلة'],
    proceduralSteps: [
      'Formulate algorithmic complexity (Time & Space O(n)).',
      'Handle edge cases (nullish values, empty inputs, network timeouts, error boundaries).',
      'Provide production-ready code with types and clear comments.',
    ],
    bestPractices: ['Avoid placeholder stubs (// TODO)', 'Always include strong typing', 'Follow SOLID and clean code principles'],
    acquiredAt: Date.now() - 86400000 * 6,
    lastUsedAt: Date.now(),
    usageCount: 38,
    successRate: 0.97,
    level: 8,
    origin: 'builtin',
  },
  {
    id: 'skill_scientific_math_reasoning',
    name: 'Scientific, Financial & Mathematical Deduction',
    displayNameAr: 'الاستنتاج الرياضي والعلمي والمالي الدقيق',
    category: 'math',
    description: 'Solves advanced math, statistics, calculus, and financial formulas with verified step-by-step proofs.',
    triggers: ['رياضيات', 'math', 'معادلة', 'احسب', 'calculate', 'نسبة', 'إحصاء', 'قانون', 'فيزياء', 'finance'],
    proceduralSteps: [
      'State given variables and identify the target equation.',
      'Break calculation into verifiable intermediate steps.',
      'Highlight the final verified numerical or symbolic answer clearly.',
    ],
    bestPractices: ['Double-check arithmetic and boundary bounds', 'Format equations cleanly with standard symbols'],
    acquiredAt: Date.now() - 86400000 * 5,
    lastUsedAt: Date.now(),
    usageCount: 22,
    successRate: 0.96,
    level: 8,
    origin: 'builtin',
  },
  {
    id: 'skill_data_structuring_json',
    name: 'Structured Data Extraction & Schema Synthesis',
    displayNameAr: 'استخراج وهيكلة البيانات بصيغ JSON وجداول',
    category: 'data',
    description: 'Transforms unstructured text, tables, and complex prompts into strict, validated JSON schemas.',
    triggers: ['json', 'جدول', 'table', 'هيكلة', 'بيانات', 'data', 'csv', 'مخطط', 'schema'],
    proceduralSteps: [
      'Identify entity types, keys, and values from raw context.',
      'Format output in strictly valid JSON or Markdown table syntax.',
      'Eliminate syntax errors and trailing comma traps.',
    ],
    bestPractices: ['Ensure valid JSON parsing capability', 'Use clean key naming conventions (camelCase or snake_case)'],
    acquiredAt: Date.now() - 86400000 * 4,
    lastUsedAt: Date.now(),
    usageCount: 19,
    successRate: 0.98,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_academic_curriculum_companion',
    name: 'Comprehensive 24/7 Academic Student Companion',
    displayNameAr: 'المرافق الأكاديمي الشامل لجميع الأطوار التعليمية',
    category: 'reasoning',
    description: 'Provides pedagogical, multi-tiered curriculum guidance from elementary to PhD with intuitive concept clarity, step-by-step proofs, and exam preparation.',
    triggers: ['دراسة', 'امتحان', 'اختبار', 'تمرين', 'واجب', 'مسألة', 'درس', 'شرح', 'فيزياء', 'رياضيات', 'كيمياء', 'علوم', 'تاريخ', 'فلسفة', 'أدب', 'بكالوريا', 'باك', 'بيام', 'ابتدائي', 'متوسط', 'ثانوي', 'جامعة', 'bac', 'bem', 'study', 'exam', 'homework', 'curriculum', 'school'],
    proceduralSteps: [
      'Deconstruct the core concept into simple physical/intuitive terms before introducing formal notation.',
      'Provide structured, step-by-step mathematical or analytical solutions with clear justifications.',
      'Flag high-risk exam traps and common student pitfalls specific to this topic.',
      'Conclude with a high-recall memory anchor or rule of thumb.',
    ],
    bestPractices: ['Adapt terminology to student educational stage', 'Ensure numerical and dimensional unit accuracy', 'Encourage deep understanding over rote memorization'],
    acquiredAt: Date.now() - 86400000 * 3,
    lastUsedAt: Date.now(),
    usageCount: 54,
    successRate: 0.99,
    level: 10,
    origin: 'builtin',
  },
  {
    id: 'skill_exam_mistake_clinic',
    name: 'Exam Mistake Diagnosis & Cognitive Anchor Clinic',
    displayNameAr: 'عيادة تشخيص أخطاء الامتحانات وترسيخ القواعد',
    category: 'reasoning',
    description: 'Pinpoints the exact conceptual or procedural cause of a student mistake and establishes preventive memory anchors.',
    triggers: ['خطأ', 'أخطأت', 'لماذا خطأ', 'غلط', 'فخ', 'تصحيح', 'mistake', 'error', 'wrong answer', 'misconception', 'pitfall'],
    proceduralSteps: [
      'Diagnose the exact failure mode (conceptual gap, arithmetic slip, misreading prompt, unit conversion error).',
      'Provide the definitive corrected solution side-by-side with the flawed step.',
      'Formulate a memorable "Golden Exam Rule" to ensure the mistake is never repeated.',
    ],
    bestPractices: ['Adopt an encouraging, constructive mentor tone', 'Explain why the mistake happened, not just that it was wrong'],
    acquiredAt: Date.now() - 86400000 * 2,
    lastUsedAt: Date.now(),
    usageCount: 31,
    successRate: 0.98,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_formula_cheat_sheets',
    name: 'Scientific Formula & Equation Knowledge Base',
    displayNameAr: 'استدعاء وشرح القوانين والمعادلات العلمية',
    category: 'math',
    description: 'Retrieves, formats, and explains mathematical, physical, and chemical formulas with variable breakdowns and practical examples.',
    triggers: ['قانون', 'قوانين', 'معادلة', 'صيغة', 'formula', 'cheat sheet', 'كناش', 'دستور', 'علاقة فيزيائية', 'equations'],
    proceduralSteps: [
      'State the precise mathematical/physical law with clean notation.',
      'Define each parameter, constant, and international SI unit explicitly.',
      'Provide a quick worked numerical example demonstrating real-world substitution.',
    ],
    bestPractices: ['Always specify validity conditions and constraints of the formula', 'Highlight related secondary formulas'],
    acquiredAt: Date.now() - 86400000 * 2,
    lastUsedAt: Date.now(),
    usageCount: 45,
    successRate: 0.99,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_media_director_and_vfx',
    name: 'Master Prompt Engineer & Visual VFX Synthesizer',
    displayNameAr: 'هندسة المرئيات والوسائط والألوان والكود المتجهي SVG',
    category: 'creativity',
    description: 'Generates high-precision Midjourney v6 / SD3 LoRA parameters, aesthetic color palettes with HEX/RGB, 3D assets wireframe specs, and clean SVG code.',
    triggers: ['صورة', 'تصميم', 'ألوان', 'الوان', 'باليت', 'palette', 'svg', 'vector', '3d', 'midjourney', 'flux', 'vfx', 'سينمائي', 'إضاءة', 'render', 'asset'],
    proceduralSteps: [
      'Deconstruct the visual intent into lighting (volumetric, chiaroscuro, studio rim light), camera optics (85mm f/1.8, bokeh), and material textures.',
      'Provide concrete color palette tokens with hex values, optical luminance balance, and design roles.',
      'When SVG is needed, output clean vector paths with viewBox and scalable responsive CSS.',
    ],
    bestPractices: ['Never invent fake hex codes without high contrast testing', 'Always specify aspect ratio and seed parameters'],
    acquiredAt: Date.now() - 86400000 * 4,
    lastUsedAt: Date.now(),
    usageCount: 52,
    successRate: 0.98,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_linux_devops_superuser',
    name: 'Linux/Android Superuser & System Diagnostics Architecture',
    displayNameAr: 'هندسة أنظمة لينكس والطرفية وأندرويد Termux',
    category: 'system',
    description: 'Generates exact POSIX/Bash commands, systemd service units, PipeWire audio routing, Dockerfiles, and real-time hardware diagnostics.',
    triggers: ['لينكس', 'linux', 'bash', 'terminal', 'طرفية', 'أمر', 'termux', 'android', 'docker', 'systemd', 'pipewire', 'wayland', 'diagnostics', 'فحص', 'ram', 'cpu'],
    proceduralSteps: [
      'Formulate safe, non-destructive, idempotent terminal commands with exit-code verifications.',
      'Explain pipeline flags (-v, -p, -f) and file permissions (chmod, chown) clearly.',
      'Provide diagnostic stdout interpretations for rapid root-cause isolation.',
    ],
    bestPractices: ['Always guard against destructive commands (rm -rf / without checks)', 'Support Debian/Ubuntu, Arch, Fedora, and Android Termux'],
    acquiredAt: Date.now() - 86400000 * 5,
    lastUsedAt: Date.now(),
    usageCount: 68,
    successRate: 0.99,
    level: 10,
    origin: 'builtin',
  },
  {
    id: 'skill_cognitive_iq_and_formal_logic',
    name: 'Cognitive IQ, Deductive Reasoning & Formal Proofs',
    displayNameAr: 'الاستدلال المنطقي الصارم واختبارات الذكاء المتقدمة',
    category: 'reasoning',
    description: 'Deconstructs complex logic puzzles, Raven progressive matrices, syllogisms, and mathematical paradoxes into step-by-step rigorous proofs.',
    triggers: ['ذكاء', 'منطق', 'لغز', 'iq', 'puzzle', 'logic', 'استدلال', 'برهان', 'proof', 'مغالطة', 'paradox', 'raven', 'pattern'],
    proceduralSteps: [
      'Extract fundamental premises, axioms, and constraints with unambiguous precision.',
      'Construct a formal Tree of Thoughts to evaluate each logical branch and rule out false options.',
      'State the verified solution with full deductive justification and identify the measured cognitive faculty.',
    ],
    bestPractices: ['Eliminate fallacies and ungrounded assumptions', 'Provide clear educational breakdowns showing why each alternative fails'],
    acquiredAt: Date.now() - 86400000 * 3,
    lastUsedAt: Date.now(),
    usageCount: 40,
    successRate: 0.98,
    level: 9,
    origin: 'builtin',
  },
  {
    id: 'skill_geospatial_intelligence_and_routing',
    name: 'Geospatial Intelligence, Navigation & Route Optimization',
    displayNameAr: 'الملاحة الجغرافية وتخطيط المسارات واستكشاف المعالم',
    category: 'data',
    description: 'Calculates optimal travel itineraries, extracts GPS coordinates (Lat/Long), estimates distances, and highlights cultural landmarks.',
    triggers: ['مسار', 'خريطة', 'خرائط', 'إحداثيات', 'سفر', 'رحلة', 'route', 'map', 'coordinates', 'gps', 'itinerary', 'navigation', 'distance'],
    proceduralSteps: [
      'Extract geographical points of interest and determine precise decimal coordinates.',
      'Calculate estimated transit duration, distance, and optimal route segments.',
      'Highlight cultural heritage, terrain features, and provide direct navigational links.',
    ],
    bestPractices: ['Verify coordinate bounds (-90 to +90 lat, -180 to +180 lng)', 'Include traffic and transit modality variations'],
    acquiredAt: Date.now() - 86400000 * 2,
    lastUsedAt: Date.now(),
    usageCount: 28,
    successRate: 0.97,
    level: 8,
    origin: 'builtin',
  },
  {
    id: 'skill_task_and_project_orchestration',
    name: 'Autonomous Project Decomposition & Eisenhower Prioritization',
    displayNameAr: 'تفكيك المشاريع المعقدة وهندسة أولويات المهام',
    category: 'reasoning',
    description: 'Transforms ambiguous user goals into structured, actionable checklists with clear priorities, Pomodoro timeboxing, and milestones.',
    triggers: ['مهام', 'مشروع', 'خطة', 'تودو', 'task', 'tasks', 'todo', 'plan', 'eisenhower', 'pomodoro', 'بومودورو', 'أولويات'],
    proceduralSteps: [
      'Categorize tasks into Urgent/Important (Eisenhower Matrix) with clear definition of done.',
      'Chunk complex tasks into 25-minute Pomodoro action sprints.',
      'Format output in interactive checklist blocks ready for execution.',
    ],
    bestPractices: ['Avoid vague task titles (use imperative action verbs)', 'Provide realistic time estimations'],
    acquiredAt: Date.now() - 86400000 * 3,
    lastUsedAt: Date.now(),
    usageCount: 39,
    successRate: 0.99,
    level: 9,
    origin: 'builtin',
  },
];

class HermesSkillEngine {
  private skills: Map<string, HermesSkill> = new Map();
  private totalExecutions = 0;

  constructor() {
    this.loadSkills();
  }

  private loadSkills() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.skills)) {
          for (const s of parsed.skills) {
            this.skills.set(s.id, s);
          }
          this.totalExecutions = parsed.totalExecutions ?? 0;
          return;
        }
      }
    } catch (e) {
      console.warn('[Hermes Agent] Failed to load cached skills, initializing default matrix:', e);
    }

    // Seed defaults
    for (const s of INITIAL_HERMES_SKILLS) {
      this.skills.set(s.id, s);
    }
    this.saveSkills();
  }

  private saveSkills() {
    try {
      const payload = {
        skills: Array.from(this.skills.values()),
        totalExecutions: this.totalExecutions,
        lastSavedAt: Date.now(),
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      // Non-blocking in ephemeral filesystems
    }
  }

  public getAllSkills(): HermesSkill[] {
    return Array.from(this.skills.values()).sort((a, b) => b.level - a.level || b.usageCount - a.usageCount);
  }

  public getStats(): HermesEvolutionStats {
    const list = this.getAllSkills();
    const autonomousCount = list.filter(s => s.origin === 'autonomous_learned').length;
    const avgLevel = list.length ? Number((list.reduce((sum, s) => sum + s.level, 0) / list.length).toFixed(1)) : 1;
    const topSkills = list.slice(0, 5).map(s => ({ name: s.displayNameAr || s.name, level: s.level, usageCount: s.usageCount }));

    return {
      totalSkills: list.length,
      autonomousSkillsLearned: autonomousCount,
      totalExecutions: this.totalExecutions,
      averageMasteryLevel: avgLevel,
      lastEvolvedAt: Date.now(),
      topSkills,
    };
  }

  public retrieveRelevantSkills(userPrompt: string, maxSkills = 3): HermesSkill[] {
    const query = userPrompt.toLowerCase();
    const scores: Array<{ skill: HermesSkill; score: number }> = [];

    for (const skill of this.skills.values()) {
      let score = 0;
      for (const trigger of skill.triggers) {
        if (query.includes(trigger.toLowerCase())) {
          score += 3;
        }
      }
      if (query.includes(skill.category)) {
        score += 1.5;
      }
      // Weight by skill mastery level
      score += skill.level * 0.2;

      if (score > 0) {
        scores.push({ skill, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    const selected = scores.slice(0, maxSkills).map(s => s.skill);

    // If no trigger hit, return top 2 general master skills
    if (!selected.length) {
      return Array.from(this.skills.values()).slice(0, 2);
    }
    return selected;
  }

  public augmentSystemInstruction(baseInstruction: string, userPrompt: string, language: 'ar' | 'en'): string {
    const matchedSkills = this.retrieveRelevantSkills(userPrompt, 2);
    this.totalExecutions += 1;

    // Track usage
    for (const s of matchedSkills) {
      s.usageCount += 1;
      s.lastUsedAt = Date.now();
    }
    this.saveSkills();

    const skillsContext = matchedSkills.map((s, idx) => {
      return `[Hermes Skill #${idx + 1}: ${s.name} (Mastery Level: ${s.level}/10)]
- Key Principles: ${s.proceduralSteps.join(' | ')}
- Best Practices: ${s.bestPractices.join(' | ')}`;
    }).join('\n\n');

    const hermesHeader = language === 'ar'
      ? `\n\n[Hermes Autonomous Agent Engine Active]:\nلقد قمت بتحليل طلب المستخدم وتفعيل المهارات المعرفية التالية لضمان أعلى مستوى من الدقة والتطور الذاتي:\n${skillsContext}\nطبق هذه المهارات بصرامة وابتكار.`
      : `\n\n[Hermes Autonomous Agent Engine Active]:\nThe following cognitive procedural skills have been dynamically retrieved and loaded for this task:\n${skillsContext}\nExecute with strict adherence to these principles and dynamic adaptation.`;

    return `${baseInstruction}${hermesHeader}`;
  }

  public recordFeedback(skillIds: string[], success: boolean) {
    for (const id of skillIds) {
      const s = this.skills.get(id);
      if (s) {
        if (success) {
          s.successRate = Math.min(1.0, s.successRate + 0.01);
          if (s.usageCount % 5 === 0 && s.level < 10) {
            s.level += 1; // Level up through experience
          }
        } else {
          s.successRate = Math.max(0.1, s.successRate - 0.02);
        }
      }
    }
    this.saveSkills();
  }

  public learnAutonomousSkillFromInteraction(userPrompt: string, assistantResponse: string): HermesSkill | null {
    // Only learn if the interaction is non-trivial and demonstrates a specialized pattern
    const promptLen = userPrompt.trim().length;
    const responseLen = assistantResponse.trim().length;
    if (promptLen < 15 || responseLen < 80) return null;

    // Check if contains structured patterns (code, formulas, data schema, workflow steps)
    const hasCode = assistantResponse.includes('```');
    const hasSteps = /(?:1\.|2\.|- \[ \]|الخطوة|أولاً)/i.test(assistantResponse);
    const isMathOrLogic = /(?:=|\+|-|\*|\/|\^|∫|∑|∀|∃|x\s*=)/.test(assistantResponse) && promptLen < 100;

    if (!hasCode && !hasSteps && !isMathOrLogic) return null;

    // Deduce category and triggers
    let category: HermesSkill['category'] = 'reasoning';
    if (hasCode) category = assistantResponse.includes('<html') || assistantResponse.includes('<div') ? 'ui' : 'coding';
    else if (isMathOrLogic) category = 'math';
    else if (assistantResponse.includes('{') && assistantResponse.includes('}')) category = 'data';

    // Extract potential trigger words from prompt
    const words = userPrompt
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['كيف', 'ماذا', 'اصنع', 'اعمل', 'اريد', 'please', 'make', 'create', 'what', 'how'].includes(w.toLowerCase()))
      .slice(0, 4);

    if (words.length === 0) return null;

    // Check if similar skill exists
    const existing = Array.from(this.skills.values()).find(s =>
      s.triggers.some(t => words.some(w => w.toLowerCase() === t.toLowerCase()))
    );

    if (existing) {
      // Reinforce existing skill
      existing.usageCount += 1;
      existing.lastUsedAt = Date.now();
      if (existing.usageCount % 3 === 0 && existing.level < 10) {
        existing.level += 1;
      }
      this.saveSkills();
      return existing;
    }

    // Synthesize a new autonomous skill
    const skillName = `Dynamic Heuristic (${words.join(' ')})`;
    const newSkill: HermesSkill = {
      id: `skill_auto_${randomUUID().slice(0, 8)}`,
      name: skillName,
      displayNameAr: `مهارة مكتسبة تلقائياً: ${words.join(' ')}`,
      category,
      description: `Autonomous skill synthesized by Hermes Agent for recurring task pattern "${words.join(' ')}".`,
      triggers: words.map(w => w.toLowerCase()),
      proceduralSteps: [
        `Identify specific constraints matching [${words.join(', ')}]`,
        'Formulate deterministic verification and deliver modular output',
        'Verify edge cases and user constraints iteratively',
      ],
      bestPractices: [
        'Maintain high consistency with previous successful completions',
        'Refine answer quality based on user context',
      ],
      acquiredAt: Date.now(),
      lastUsedAt: Date.now(),
      usageCount: 1,
      successRate: 0.95,
      level: 1,
      origin: 'autonomous_learned',
    };

    this.skills.set(newSkill.id, newSkill);
    this.saveSkills();
    console.log(`[Hermes Agent] 🧠 Autonomously acquired new skill: "${newSkill.name}" (ID: ${newSkill.id})`);
    return newSkill;
  }
}

export const hermesEngine = new HermesSkillEngine();
