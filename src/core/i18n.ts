import type { Language } from './domain';

export const copy = (language: Language) => language === 'ar' ? {
  nav: { chat: 'المحادثة', tasks: 'المهام', memory: 'الذاكرة', workspace: 'مساحة العمل', settings: 'الإعدادات' },
  newChat: 'محادثة جديدة',
  send: 'إرسال',
  stop: 'إيقاف',
  retry: 'إعادة المحاولة',
  thinking: 'Adam يفكر…',
  placeholder: 'اكتب لـ Adam أي شيء…',
  online: 'متصل',
  local: 'يعمل محلياً',
} : {
  nav: { chat: 'Chat', tasks: 'Tasks', memory: 'Memory', workspace: 'Workspace', settings: 'Settings' },
  newChat: 'New chat',
  send: 'Send',
  stop: 'Stop',
  retry: 'Retry',
  thinking: 'Adam is thinking…',
  placeholder: 'Ask Adam anything…',
  online: 'Online',
  local: 'Local',
};
