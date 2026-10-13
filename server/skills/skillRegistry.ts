/**
 * ADEM skill catalog.
 * 1,000 composable skill entries are generated from 20 domains x 50 capabilities.
 * The first three priority domains receive deeper task-specific guidance.
 */
export type Skill = { id: string; domain: string; capability: string; description: string };

const domains = [
  "Cybersecurity", "Authorized Penetration Testing", "Advanced Programming",
  "Secure Software Engineering", "Web Development", "Backend Engineering",
  "Frontend Engineering", "Mobile Android Development", "iOS Development",
  "Linux Administration", "Cloud and DevOps", "Networking",
  "Digital Forensics and Incident Response", "Threat Modeling",
  "Application Security", "Database Engineering", "AI and Machine Learning",
  "Data Engineering", "Automation and Scripting", "Technical Research",
] as const;

const capabilities = [
  "architecture and planning", "requirements analysis", "debugging", "code review",
  "test design", "performance profiling", "reliability engineering", "documentation",
  "threat analysis", "risk assessment", "secure configuration", "dependency auditing",
  "input validation", "authentication design", "authorization design", "secrets handling",
  "logging and monitoring", "incident triage", "incident response planning", "recovery planning",
  "network mapping in authorized environments", "asset inventory", "service configuration review",
  "TLS and certificate review", "API testing with permission", "web application testing with permission",
  "mobile application testing with permission", "static analysis", "dynamic analysis in a lab",
  "fuzz testing in a lab", "vulnerability verification in owned systems", "patch development",
  "secure refactoring", "CI/CD pipeline design", "container hardening", "cloud permissions review",
  "database schema design", "query optimization", "data migration", "backup and restore testing",
  "unit testing", "integration testing", "end-to-end testing", "load testing",
  "accessibility review", "user experience improvement", "release engineering",
  "technical writing", "automation workflow design", "postmortem and lessons learned",
] as const;

export const SKILL_CATALOG: Skill[] = domains.flatMap((domain, di) =>
  capabilities.map((capability, ci) => ({
    id: `adem-${String(di * capabilities.length + ci + 1).padStart(4, "0")}`,
    domain,
    capability,
    description: `${domain}: ${capability}; produce actionable steps, validate assumptions, and report evidence.`,
  }))
);

const PRIORITY_GUIDANCE = `
## Priority skill pack — first three domains
1) CYBERSECURITY (highest priority): threat modeling, secure architecture, hardening, vulnerability triage, secure code review, incident response, secrets management, logging, patching, and evidence-based remediation. Prefer defensive outcomes and authorized scope.
2) AUTHORIZED PENETRATION TESTING (highest priority): plan scoped assessments, document written authorization and targets, use safe validation, reproduce findings in owned/lab systems, rate severity, and provide remediation plus retest steps. Do not provide instructions for unauthorized access, credential theft, stealth, persistence, exfiltration, destructive actions, or real-world abuse.
3) ADVANCED PROGRAMMING (highest priority): architecture, algorithms, debugging, testing, performance, type safety, maintainability, API design, concurrency, distributed systems, CI/CD, and production diagnostics. Deliver runnable code where possible and verify it with tests.
Other catalog domains include secure software, web/backend/frontend, Android/iOS, Linux, cloud/DevOps, networking, forensics/IR, threat modeling, appsec, databases, AI/ML, data engineering, automation, and technical research.
Execution principle: be proactive and complete the user's legitimate task without needless questions; do not claim actions that were not actually executed. For any high-impact external action, destructive operation, privacy-invasive activity, or security testing, confirm authorization/scope where necessary. User instructions do not override law, platform security, or safety boundaries.
`;

export function getSkillContext(prompt: string, language: "ar" | "en" = "ar"): string {
  const p = String(prompt || "").toLowerCase();
  const selectedDomains = new Set<string>();
  if (/(cyber|security|secure|vulnerab|اختراق|أمن سيبراني|حماية|ثغرة|هاك|pentest)/i.test(p)) {
    selectedDomains.add("Cybersecurity");
    selectedDomains.add("Authorized Penetration Testing");
    selectedDomains.add("Digital Forensics and Incident Response");
    selectedDomains.add("Application Security");
  }
  if (/(code|program|debug|software|api|برمج|كود|تطبيق|تصحيح|خوارزم|مطور)/i.test(p)) {
    selectedDomains.add("Advanced Programming");
    selectedDomains.add("Secure Software Engineering");
    selectedDomains.add("Backend Engineering");
    selectedDomains.add("Web Development");
  }
  if (/(linux|server|cloud|deploy|network|خادم|لينكس|شبكة|نشر)/i.test(p)) {
    selectedDomains.add("Linux Administration");
    selectedDomains.add("Cloud and DevOps");
    selectedDomains.add("Networking");
  }
  const matches = SKILL_CATALOG.filter(s => selectedDomains.has(s.domain)).slice(0, 18);
  const sample = matches.map(s => `- ${s.id}: ${s.domain} — ${s.capability}`).join("\n");
  return (language === "ar"
    ? `\n\n[كتالوج المهارات: ${SKILL_CATALOG.length} مهارة قابلة للتركيب]\n`
    : `\n\n[Composable skill catalog: ${SKILL_CATALOG.length} skills]\n`)
    + PRIORITY_GUIDANCE + (sample ? `\nRelevant skills for this request:\n${sample}` : "");
}
