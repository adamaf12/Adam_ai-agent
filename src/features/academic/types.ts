export type AcademicStage = 'primary' | 'middle' | 'secondary' | 'university';

export type AcademicTab = 'stages' | 'libraries' | 'tutor' | 'quiz' | 'thesis' | 'companion' | 'planner' | 'formulas' | 'presentation';

export type PresentationType = 'pfe' | 'thesis' | 'expose' | 'startup' | 'medical' | 'internship';
export type AcademicDegree = 'bachelor' | 'master' | 'phd' | 'engineering' | 'medicine' | 'preparatory';
export type PresentationTheme = 'oxford-navy' | 'emerald-scholar' | 'sorbonne-crimson' | 'cyber-terminal' | 'swiss-minimal';

export interface SlideMetric {
  value: string;
  label: string;
}

export interface SlideBulletPoint {
  boldPrefix: string;
  text: string;
}

export interface JuryQA {
  question: string;
  modelAnswer: string;
  severity?: 'trap' | 'technical' | 'methodology' | 'perspectives';
}

export interface UniversitySlide {
  id: string;
  slideNumber: number;
  category: string;
  title: string;
  subtitle?: string;
  layout: 'split-2col' | 'bullets-grid' | 'metrics-3col' | 'timeline' | 'quote-problem' | 'table-compare' | 'code-or-formula';
  points: SlideBulletPoint[];
  callout?: string;
  metrics?: SlideMetric[];
  latexFormula?: string;
  speakerNotes: {
    speechText: string;
    durationSeconds: number;
    deliveryTips: string;
  };
  juryQA?: JuryQA[];
}

export interface UniversityPresentation {
  id: string;
  topic: string;
  degree: string;
  degreeLabel?: string;
  presentationType: string;
  typeLabel?: string;
  university?: string;
  faculty?: string;
  studentName?: string;
  supervisorName?: string;
  academicYear?: string;
  language: 'fr' | 'ar' | 'en';
  totalDurationMinutes: number;
  theme: PresentationTheme;
  slides: UniversitySlide[];
  generalJuryStrategyTips?: string[];
  createdAt: string;
}

export interface StudyScheduleItem {
  id: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  dayOfWeek: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface FormulaCheatSheetItem {
  id: string;
  category: string;
  nameAr: string;
  nameEn: string;
  formula: string;
  explanationAr: string;
  explanationEn: string;
  stage: AcademicStage;
  exampleAr: string;
  exampleEn: string;
}

export interface EducationalSubject {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
  stage: AcademicStage;
  topics: {
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    keyPointsAr: string[];
    keyPointsEn: string[];
    practicePrompt: string;
  }[];
  referenceLinks: {
    title: string;
    url: string;
    type: 'book' | 'interactive' | 'exam' | 'platform' | 'courses' | 'preprints';
  }[];
}

export interface DigitalLibrary {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'preprints' | 'medical' | 'stem' | 'humanities' | 'books' | 'courses' | 'k12' | 'encyclopedia';
  categoryLabelAr: string;
  categoryLabelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  estimatedVolume: string;
  url: string;
  searchUrlTemplate?: string;
  isOpenAccess: boolean;
  isPeerReviewed: boolean;
  badge: string;
  supportedStages: AcademicStage[];
  tags: string[];
}

export interface AcademicSearchResult {
  id: string;
  title: string;
  authors: string[];
  year?: number | string;
  venue?: string;
  abstract?: string;
  url: string;
  pdfUrl?: string;
  source: string;
  isOpenAccess?: boolean;
  citationCount?: number;
}

export interface AcademicQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  stage: AcademicStage;
  subject: string;
}

export interface CitationOutput {
  apa: string;
  ieee: string;
  mla: string;
  harvard: string;
  chicago: string;
}
