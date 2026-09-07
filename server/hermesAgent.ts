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
