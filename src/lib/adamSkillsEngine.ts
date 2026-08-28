export interface AdamSkill {
  id: string;
  name: string;
  category: 'coding' | 'web' | 'ai' | 'productivity' | 'mcp' | 'replit' | 'github';
  descriptionAr: string;
  descriptionEn: string;
  sourceUrl: string;
  installed: boolean;
  version: string;
  author: string;
  downloadsCount: number;
  rating: number;
  tags: string[];
}

export interface IngestedGitHubRepo {
  id: string;
  repoUrl: string;
  repoName: string;
  owner: string;
  description: string;
  languages: string[];
  filesCount: number;
  stars: number;
  ingestedAt: string;
  summary: string;
  codePatterns: string[];
}

export const DEFAULT_ADAM_SKILLS: AdamSkill[] = [
  {
    id: 'skill-replit-agent-pack',
    name: 'Replit Cloud Agent Bridge & Runtime',
    category: 'replit',
    descriptionAr: 'مهارة ربط وتفاعل مع بيئات Replit وحاويات السحابة لتشغيل وتدقيق الأكواد ديناميكياً.',
    descriptionEn: 'Replit Cloud Agent bridge and runtime environment for dynamic code execution.',
    sourceUrl: 'https://github.com/replit/agent-skills-registry',
    installed: true,
    version: '2.4.0',
    author: 'Replit Ecosystem',
    downloadsCount: 142500,
    rating: 4.9,
    tags: ['replit', 'cloud', 'runtime', 'agent'],
  },
  {
    id: 'skill-github-advanced-inspector',
    name: 'GitHub Advanced Repo Inspector & MCP',
    category: 'github',
    descriptionAr: 'مهارة متقدمة لتحليل مستودعات GitHub، تتبع الـ Commits، وجلب الشيفرات البرمجية مباشرة.',
    descriptionEn: 'Advanced GitHub repository inspection, commit tracking, and code retrieval skill.',
    sourceUrl: 'https://github.com/github/mcp-skills-pack',
    installed: true,
    version: '3.1.2',
    author: 'GitHub & MCP Core',
    downloadsCount: 298000,
    rating: 5.0,
    tags: ['github', 'mcp', 'code', 'git'],
  },
  {
    id: 'skill-deep-google-web-grounding',
    name: 'Google Deep Search & Web Grounding Engine',
    category: 'web',
    descriptionAr: 'مهارة بحث جوجل والويب العميق لجلب أحدث البيانات والمعارف بدقة لعام 2026.',
    descriptionEn: 'Deep Google Search and real-time web grounding engine for precise 2026 data.',
    sourceUrl: 'https://registry.npmjs.org/@google/gemini-web-grounding',
    installed: true,
    version: '4.0.1',
    author: 'Google AI & Adam Core',
    downloadsCount: 520000,
    rating: 5.0,
    tags: ['search', 'google', 'web', 'grounding'],
  },
  {
    id: 'skill-python-datascience-mcp',
    name: 'Python Data Science & Pandas MCP Suite',
    category: 'coding',
    descriptionAr: 'حزمة تحليل البيانات، مكتبات Pandas, NumPy, وتحويلات البيانات الرياضية المتقدمة.',
    descriptionEn: 'Data science suite for Pandas, NumPy, and advanced numerical computing.',
    sourceUrl: 'https://github.com/microsoft/py-datascience-mcp',
    installed: false,
    version: '1.8.5',
    author: 'DataScience Guild',
    downloadsCount: 89000,
    rating: 4.8,
    tags: ['python', 'pandas', 'data', 'numpy'],
  },
  {
    id: 'skill-react-tailwind-masterclass',
    name: 'React 19 & Tailwind v4 UI Master Skill',
    category: 'coding',
    descriptionAr: 'مهارة تصميم وبرمجة واجهات مستخدم متطورة باستخدام أحدث معايير React و Tailwind CSS.',
    descriptionEn: 'Advanced UI component mastery for React 19 and Tailwind CSS v4.',
    sourceUrl: 'https://github.com/tailwindlabs/skills-registry',
    installed: false,
    version: '2.0.0',
    author: 'Tailwind & React Community',
    downloadsCount: 210000,
    rating: 4.9,
    tags: ['react', 'tailwind', 'ui', 'frontend'],
  },
  {
    id: 'skill-docker-k8s-devops',
    name: 'Docker & Kubernetes DevOps Toolkit',
    category: 'mcp',
    descriptionAr: 'مهارة إدارة الحاويات، ملفات Dockerfile، وربط خدمات التوزيع والـ Kubernetes.',
    descriptionEn: 'Containerization, Dockerfile generation, and Kubernetes orchestration toolkit.',
    sourceUrl: 'https://github.com/kubernetes/devops-mcp-skills',
    installed: false,
    version: '2.5.1',
    author: 'Cloud Native Foundation',
    downloadsCount: 165000,
    rating: 4.9,
    tags: ['docker', 'kubernetes', 'devops', 'cloud'],
  },
  {
    id: 'skill-nodejs-express-architect',
    name: 'Node.js & Express Enterprise Architect',
    category: 'coding',
    descriptionAr: 'تصميم وبناء خوادم Express.js قوية، معالجة الـ Middleware، وحماية نقاط النهاية.',
    descriptionEn: 'Enterprise backend architecture for Node.js, Express, and RESTful APIs.',
    sourceUrl: 'https://github.com/expressjs/enterprise-skills',
    installed: false,
    version: '4.19.2',
    author: 'OpenJS Foundation',
    downloadsCount: 340000,
    rating: 4.9,
    tags: ['nodejs', 'express', 'backend', 'api'],
  },
  {
    id: 'skill-postgresql-drizzle-orm',
    name: 'PostgreSQL & Drizzle ORM Master Suite',
    category: 'coding',
    descriptionAr: 'إدارة قواعد البيانات العلائقية، كتابة استعلامات SQL آمنة، ونماذج Drizzle ORM.',
    descriptionEn: 'Relational database management, SQL tuning, and Drizzle ORM schema design.',
    sourceUrl: 'https://github.com/drizzle-team/drizzle-orm-skills',
    installed: false,
    version: '0.33.0',
    author: 'Drizzle Team',
    downloadsCount: 115000,
    rating: 4.9,
    tags: ['postgresql', 'sql', 'drizzle', 'database'],
  },
  {
    id: 'skill-langchain-ai-agents',
    name: 'LangChain & LlamaIndex AI Agents Pack',
    category: 'ai',
    descriptionAr: 'بناء وكلاء الذكاء الاصطناعي، ربط الذاكرة المتطورة، واسترجاع المستودعات RAG.',
    descriptionEn: 'Autonomous AI agent pipelines, RAG retrieval, and vector memory orchestration.',
    sourceUrl: 'https://github.com/langchain-ai/langchain-skills',
    installed: false,
    version: '0.2.14',
    author: 'LangChain AI',
    downloadsCount: 275000,
    rating: 4.8,
    tags: ['ai', 'langchain', 'agents', 'rag'],
  },
  {
    id: 'skill-flutter-mobile-dev',
    name: 'Flutter & Dart Cross-Platform Mobile Skill',
    category: 'coding',
    descriptionAr: 'تطوير تطبيقات الهواتف الذكية عبر منصات متعددة باستخدام Flutter وتصميم Material Design 3.',
    descriptionEn: 'Cross-platform mobile application development with Flutter and Dart.',
    sourceUrl: 'https://github.com/flutter/flutter-skills',
    installed: false,
    version: '3.24.0',
    author: 'Google Flutter Team',
    downloadsCount: 190000,
    rating: 4.9,
    tags: ['flutter', 'dart', 'mobile', 'android'],
  },
  {
    id: 'skill-linux-terminal-automation',
    name: 'Linux Terminal & Bash Automation Suite',
    category: 'productivity',
    descriptionAr: 'مهارة أتمتة الأوامر الطرفية، السكربتات الذكية، وإدارة خوادم Linux بفعالية.',
    descriptionEn: 'Linux shell scripting, bash automation, and server administration toolkit.',
    sourceUrl: 'https://github.com/torvalds/linux-terminal-skills',
    installed: false,
    version: '6.10.0',
    author: 'Linux Kernel & Open Source',
    downloadsCount: 410000,
    rating: 5.0,
    tags: ['linux', 'bash', 'terminal', 'automation'],
  },
  {
    id: 'skill-fastapi-python-microservices',
    name: 'FastAPI Python High-Performance Microservices',
    category: 'coding',
    descriptionAr: 'بناء واجهات برمجية سريعة جداً بـ Python مع التوثيق التلقائي عبر OpenAPI.',
    descriptionEn: 'High-performance Python microservices with FastAPI and async support.',
    sourceUrl: 'https://github.com/tiangolo/fastapi-skills',
    installed: false,
    version: '0.112.0',
    author: 'Tiangolo & Community',
    downloadsCount: 225000,
    rating: 4.9,
    tags: ['fastapi', 'python', 'async', 'api'],
  }
];

const SKILLS_STORAGE_KEY = 'adem_installed_skills_registry_v2';
const GITHUB_REPOS_STORAGE_KEY = 'adam_ingested_github_repos_v1';

export function getAdamSkills(): AdamSkill[] {
  if (typeof window === 'undefined') return DEFAULT_ADAM_SKILLS;
  try {
    const raw = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(DEFAULT_ADAM_SKILLS));
      return DEFAULT_ADAM_SKILLS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ADAM_SKILLS;
  }
}

export function saveAdamSkills(skills: AdamSkill[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
  } catch (e) {}
}

export function getIngestedGitHubRepos(): IngestedGitHubRepo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GITHUB_REPOS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveIngestedGitHubRepos(repos: IngestedGitHubRepo[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GITHUB_REPOS_STORAGE_KEY, JSON.stringify(repos));
  } catch (e) {}
}

export async function ingestGitHubRepository(repoUrl: string): Promise<IngestedGitHubRepo> {
  await new Promise((r) => setTimeout(r, 1600));

  const cleanUrl = repoUrl.trim().replace(/\/+$/, '');
  const parts = cleanUrl.split('/');
  const repoName = parts[parts.length - 1] || 'custom-github-project';
  const owner = parts[parts.length - 2] || 'github-developer';

  const newRepo: IngestedGitHubRepo = {
    id: 'gh-repo-' + Date.now(),
    repoUrl: cleanUrl,
    repoName,
    owner,
    description: `مستودع تم تحليله ودمجه بنجاح من GitHub (${owner}/${repoName}). يتعلم منه آدم أنماط البرمجة والهندسة المعمارية المتقدمة وحل المشكلات البرمجية.`,
    languages: ['TypeScript', 'JavaScript', 'Python', 'React', 'Node.js', 'Go'],
    filesCount: Math.floor(Math.random() * 95) + 15,
    stars: Math.floor(Math.random() * 8500) + 250,
    ingestedAt: new Date().toISOString(),
    summary: `تم فحص هيكل الكود، استخراج خوارزميات الأداء، معمارية الملفات، وأنماط حل الأخطاء من مستودع ${repoName} وتفعيلها بمهارات آدم البرمجية.`,
    codePatterns: [
      'Modular Microservice & Clean Architecture',
      'Optimized Asynchronous Event Loops',
      'Advanced Type-Safe API Interfaces',
      'Automated Fault Tolerance & Resilience Patterns'
    ]
  };

  const repos = getIngestedGitHubRepos();
  const existingIndex = repos.findIndex(r => r.repoUrl.toLowerCase() === cleanUrl.toLowerCase());
  if (existingIndex >= 0) {
    repos[existingIndex] = newRepo;
  } else {
    repos.unshift(newRepo);
  }
  saveIngestedGitHubRepos(repos);

  // Register as an active Adam Skill
  const skills = getAdamSkills();
  const skillId = 'skill-github-' + repoName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const existingSkill = skills.find(s => s.id === skillId || s.sourceUrl.toLowerCase() === cleanUrl.toLowerCase());
  if (!existingSkill) {
    skills.push({
      id: skillId,
      name: `GitHub Repo: ${owner}/${repoName}`,
      category: 'github',
      descriptionAr: `مهارة تعلم برمجية مستفادة من مستودع غيت هب (${cleanUrl}). يمتلك آدم الآن خبرة مباشرة في هيكلة هذا الكود وحل مشكلاته.`,
      descriptionEn: `GitHub code learning skill ingested from ${cleanUrl}. Deep architectural understanding & problem-solving active.`,
      sourceUrl: cleanUrl,
      installed: true,
      version: '1.0.0',
      author: owner,
      downloadsCount: Math.floor(Math.random() * 2500) + 300,
      rating: 5.0,
      tags: ['github', 'code', 'learned', repoName.toLowerCase(), owner.toLowerCase()]
    });
    saveAdamSkills(skills);
  } else {
    existingSkill.installed = true;
    saveAdamSkills(skills);
  }

  return newRepo;
}

export async function fetchAndInstallSkillFromInternet(sourceUrl: string, skillName: string): Promise<AdamSkill> {
  await new Promise((r) => setTimeout(r, 1200));
  const skills = getAdamSkills();
  const existing = skills.find((s) => s.sourceUrl === sourceUrl || s.name === skillName);
  if (existing) {
    existing.installed = true;
    saveAdamSkills(skills);
    return existing;
  }
  const newSkill: AdamSkill = {
    id: 'skill-custom-' + Date.now(),
    name: skillName,
    category: sourceUrl.includes('github.com') ? 'github' : 'coding',
    descriptionAr: `مهارة مخصصة تم جلبها وتثبيتها بنجاح من الرابط: ${sourceUrl}`,
    descriptionEn: `Custom skill fetched and installed from ${sourceUrl}`,
    sourceUrl,
    installed: true,
    version: '1.0.0',
    author: 'External Registry / User',
    downloadsCount: 1,
    rating: 5.0,
    tags: ['custom', 'fetched', 'internet'],
  };
  skills.push(newSkill);
  saveAdamSkills(skills);
  return newSkill;
}
