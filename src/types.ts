export type Language = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'auto';
export type PersonalityTone = 'friendly' | 'formal' | 'concise' | 'expert' | 'visionary' | 'witty' | 'cyberpunk' | 'poetic';

export interface AgentPersona {
  id: string;
  name: string;
  roleAr: string;
  roleEn: string;
  icon: string;
  systemPromptAddon: string;
  tone: PersonalityTone;
  isCustom?: boolean;
}

export interface ProactiveSuggestion {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  suggestedActionPrompt: string;
  category: 'morning_summary' | 'habit_reminder' | 'task_followup' | 'productivity' | 'general';
  dismissed?: boolean;
  accepted?: boolean;
  createdAt: string;
}

export interface ReasoningStep {
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'self_corrected';
  detailAr?: string;
  detailEn?: string;
}

export type AppTheme =
  | 'dark'
  | 'light'
  | 'cyberpunk'
  | 'cyber_neon_tokyo'
  | 'midnight_ocean'
  | 'sapphire'
  | 'sunset'
  | 'luxury_gold'
  | 'solar_flare_gold'
  | 'dracula_vampire'
  | 'rose_gold_luxury'
  | 'carbon_fiber_stealth'
  | 'monochrome_minimalist'
  | 'nordic_forest'
  | 'espresso'
  | 'matrix_hologram'
  | 'nordic_aurora'
  | 'deep_space'
  | 'titanium_glass'
  | 'glitch_matrix'
  | 'crimson_samurai'
  | 'synthwave_retro'
  | 'emerald_quantum'
  | 'system';

export interface VoiceSettings {
  voiceId: string;
  rate: number; // 0.8 to 1.5
  pitch: number; // 0.8 to 1.3
  autoSpeakResponses: boolean;
}

export interface AutoHealAlertSettings {
  soundEnabled: boolean;
  soundType: 'none' | 'radar_pulse' | 'cyber_chime' | 'crystal_bell' | 'tech_warning' | 'subtle_blip' | 'healing_chime';
  soundVolume: number; // 0.1 to 1.0
  vibrationEnabled: boolean;
  vibrationPattern: 'none' | 'single_short' | 'double_pulse' | 'triple_pulse' | 'heartbeat' | 'sos_pattern' | 'long_buzz';
  notifyOnBackgroundFix: boolean;
}

export interface AutoHealTelemetrySnapshot {
  id: string;
  timestamp: string; // ISO string
  displayTime: string;
  scannedFilesCount: number;
  issuesFoundCount: number;
  repairsAppliedCount: number;
  syntaxIssues: number;
  logicIssues: number;
  securityIssues: number;
  performanceIssues: number;
  settingsIssues: number;
  healthScore: number; // 0 to 100
  durationMs: number;
  status: 'clean' | 'repaired' | 'error';
  summaryAr: string;
  summaryEn: string;
}

export interface AgentSettings {
  name: string;
  tone: PersonalityTone;
  language: Language;
  autoTTS: boolean;
  webSearchEnabled: boolean;
  theme: AppTheme;
  activePersonaId?: string;
  proactiveModeEnabled?: boolean;
  notificationsEnabled?: boolean;
  reasoningTraceEnabled?: boolean;
  wakeWordEnabled?: boolean;
  wakeWordPhrase?: string;
  voiceSettings?: VoiceSettings;
  autoHealAlertSettings?: AutoHealAlertSettings;
  modelFallbackList?: string[];
  openRouterApiKey?: string;
  nvidiaApiKey?: string;
  newsPreferences?: string[];
  permissions: {
    calendar: boolean;
    reminders: boolean;
    fileStorage: boolean;
    microphone: boolean;
    webSearch: boolean;
  };
}

export interface LongTermMemory {
  id: string;
  fact: string;
  category: 'preference' | 'personal_info' | 'habit' | 'work' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  toolName: string;
  displayNameAr: string;
  displayNameEn: string;
  actionSummaryAr: string;
  actionSummaryEn: string;
  details?: Record<string, any>;
  isUndoable?: boolean;
  undoData?: {
    type: 'note' | 'event' | 'reminder' | 'memory' | 'local_file';
    action: 'create' | 'delete';
    item: any;
  };
  undone?: boolean;
}

export interface LocalFile {
  id: string;
  name: string;
  path: string;
  content: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToolExecution {
  toolName: string;
  displayName: string;
  status: 'running' | 'completed' | 'failed';
  input?: Record<string, any>;
  output?: any;
  error?: string;
  timestamp: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // For images
  textContent?: string; // For text/pdf
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thoughtProcess?: string;
  reasoningSteps?: ReasoningStep[];
  plan?: string[];
  toolExecutions?: ToolExecution[];
  attachment?: FileAttachment;
  groundingSources?: Array<{ title: string; uri: string }>;
  isError?: boolean;
  modelUsed?: string;
  personaUsed?: string;
  responseTimeMs?: number;
  isStreaming?: boolean;
  streamingTokens?: string;
  suggestedFollowUps?: string[];
  retryPrompt?: string;
  watchdogTriggered?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  targetTime: string; // ISO String
  isCompleted: boolean;
  createdAt: string;
}

export interface BackgroundSocialMessage {
  id: string;
  platform: 'instagram' | 'whatsapp' | 'telegram' | 'email' | 'twitter' | 'messenger' | 'linkedin' | 'sms' | 'other';
  recipient: string;
  content: string;
  status: 'sent' | 'queued' | 'scheduled';
  scheduledTimeIso?: string;
  sentAt?: string;
  appDeepLink?: string;
  webFallbackUrl?: string;
}

export interface EmailMonitorRule {
  id: string;
  senderEmailOrName: string;
  keywords?: string[];
  description: string;
  isActive: boolean;
  notifySound: boolean;
  lastCheckedIso?: string;
  matchedEmailsCount: number;
  createdAt: string;
}

export interface MonitoredEmailItem {
  id: string;
  ruleId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  previewText: string;
  receivedAt: string;
  read: boolean;
  priority: 'normal' | 'urgent';
}

export interface WorldNewsItem {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  summary: string;
  category: 'world' | 'tech_ai' | 'economy' | 'science' | 'sports';
  source: string;
  sourceUri?: string;
  timestamp: string;
  time?: string;
  autoLearnedFact?: string;
}

export interface NewsSyncResult {
  syncTime: string;
  articlesCount: number;
  items: WorldNewsItem[];
  autoLearnedFacts: string[];
}

export interface VoiceInteractionLog {
  id: string;
  timestamp: string;
  transcript: string;
  agentResponse: string;
  source?: 'wake_word' | 'continuous_mic' | 'live_voice_call' | 'mic_button';
  confidence?: number;
  modelUsed?: string;
}

export interface OfflineKnowledgeItem {
  id: string;
  keywords: string[];
  category: 'general' | 'coding' | 'productivity' | 'arabic_lang' | 'medical_aid' | 'science' | 'custom';
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  tags?: string[];
}

export interface OfflineDataPack {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'core' | 'productivity' | 'science' | 'coding' | 'arabic' | 'medical' | 'custom';
  icon: string;
  version: string;
  sizeBytes: number;
  sizeFormatted: string;
  itemsCount: number;
  isDownloaded: boolean;
  isDownloading?: boolean;
  downloadProgress?: number; // 0 to 100
  lastUpdated?: string;
  items?: OfflineKnowledgeItem[];
}

export interface OfflineEngineState {
  isOfflineModeForced: boolean;
  isNetworkOnline: boolean;
  installedPacksCount: number;
  totalKnowledgeItemsCount: number;
  lastSyncDate?: string;
}
