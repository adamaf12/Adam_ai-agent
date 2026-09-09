import type { Language } from './domain';

export const copy = (language: Language) => language === 'ar' ? {
  nav: { chat: 'المحادثة', tasks: 'المهام', apps: 'الألعاب والتطبيقات', memory: 'الذاكرة', workspace: 'مساحة العمل', media: 'استوديو الصور والفيديو', hermes: 'محرك Hermes الذكي', settings: 'الإعدادات' },
  newChat: 'محادثة جديدة',
  send: 'إرسال',
  stop: 'إيقاف',
  retry: 'إعادة المحاولة',
  thinking: 'Adam يفكر…',
  placeholder: 'اكتب لـ Adam أي شيء…',
  online: 'متصل',
  local: 'يعمل محلياً',
} : {
  nav: { chat: 'Chat', tasks: 'Tasks', apps: 'Games & Apps', memory: 'Memory', workspace: 'Workspace', media: 'Media Studio', hermes: 'Hermes Engine', settings: 'Settings' },
  newChat: 'New chat',
  send: 'Send',
  stop: 'Stop',
  retry: 'Retry',
  thinking: 'Adam is thinking…',
  placeholder: 'Ask Adam anything…',
  online: 'Online',
  local: 'Local',
};
