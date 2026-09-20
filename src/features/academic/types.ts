export type AcademicStage = 'primary' | 'middle' | 'secondary' | 'university';

export type AcademicTab = 'stages' | 'libraries' | 'tutor' | 'quiz' | 'thesis' | 'companion' | 'planner' | 'formulas';

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
