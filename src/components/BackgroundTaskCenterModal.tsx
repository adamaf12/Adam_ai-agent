import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Mail,
  Radio,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Bell,
  Instagram,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Activity,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import {
  BackgroundSocialMessage,
  EmailMonitorRule,
  MonitoredEmailItem,
} from '../types';
import {
  deleteBackgroundMessage,
  deleteEmailMonitorRule,
  loadBackgroundMessages,
  loadEmailMonitorRules,
  loadMonitoredEmails,
  markEmailRead,
  saveBackgroundMessage,
  saveEmailMonitorRule,
  saveMonitoredEmail,
} from '../lib/storage';
import { AutoHealDashboard } from './AutoHealDashboard';

interface BackgroundTaskCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  initialTab?: 'messaging' | 'email_monitor' | 'autoheal_dashboard';
  onOpenSettings?: () => void;
}

export const BackgroundTaskCenterModal: React.FC<BackgroundTaskCenterModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  initialTab = 'autoheal_dashboard',
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'messaging' | 'email_monitor' | 'autoheal_dashboard'>(
    initialTab || 'autoheal_dashboard'
  );

  // Messaging State
  const [messages, setMessages] = useState<BackgroundSocialMessage[]>([]);
  const [platform, setPlatform] = useState<BackgroundSocialMessage['platform']>('instagram');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleMinutes, setScheduleMinutes] = useState(0);

  // Email Monitor State
  const [rules, setRules] = useState<EmailMonitorRule[]>([]);
  const [monitoredEmails, setMonitoredEmails] = useState<MonitoredEmailItem[]>([]);
  const [newRuleSender, setNewRuleSender] = useState('');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');

  // Simulate Email State
  const [simSender, setSimSender] = useState('manager@company.com');
  const [simSubject, setSimSubject] = useState('عاجل: تحديث العقد المباشر واجتماع الغد');
  const [simBody, setSimBody] = useState('نود إحاطتكم بتفاصيل التقرير النهائي والموافقة المطلوبة...');

  const refreshData = () => {
    setMessages(loadBackgroundMessages());
    setRules(loadEmailMonitorRules());
    setMonitoredEmails(loadMonitoredEmails());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Dispatching Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !content.trim()) return;

    const cleanRecipient = recipient.trim().replace(/^@/, '');
    let appDeepLink = '';
    let webFallbackUrl = '';

    switch (platform) {
      case 'instagram':
        appDeepLink = `instagram://direct`;
        webFallbackUrl = cleanRecipient ? `https://instagram.com/direct/t/${cleanRecipient}` : `https://instagram.com/direct/inbox/`;
        break;
      case 'whatsapp':
        const phone = cleanRecipient.replace(/[^0-9+]/g, '');
        appDeepLink = `whatsapp://send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(content)}`;
        webFallbackUrl = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(content)}`;
        break;
      case 'telegram':
        appDeepLink = `tg://msg?to=${encodeURIComponent(cleanRecipient)}&text=${encodeURIComponent(content)}`;
        webFallbackUrl = `https://t.me/${cleanRecipient}`;
        break;
      case 'email':
        appDeepLink = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject || 'رسالة جديدة')}&body=${encodeURIComponent(content)}`;
        webFallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject || 'رسالة أدم')}&body=${encodeURIComponent(content)}`;
        break;
      case 'twitter':
        appDeepLink = `twitter://messages/compose`;
        webFallbackUrl = `https://x.com/messages/compose`;
        break;
      default:
        webFallbackUrl = `https://google.com/search?q=${encodeURIComponent(recipient)}`;
        break;
    }

    const isScheduled = scheduleMinutes > 0;
    saveBackgroundMessage({
      platform,
      recipient,
      content,
      status: isScheduled ? 'scheduled' : 'sent',
      scheduledTimeIso: isScheduled ? new Date(Date.now() + scheduleMinutes * 60000).toISOString() : new Date().toISOString(),
      sentAt: isScheduled ? undefined : new Date().toISOString(),
      appDeepLink,
      webFallbackUrl,
    });

    if (!isScheduled && appDeepLink) {
      try {
        const a = document.createElement('a');
        a.href = appDeepLink;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.warn('App deep link launcher warning:', err);
      }
    }

    setRecipient('');
    setContent('');
    setSubject('');
    setScheduleMinutes(0);
    refreshData();
  };

  const handleDeleteMsg = (id: string) => {
    deleteBackgroundMessage(id);
    refreshData();
  };

  // Handle Adding Rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleSender.trim()) return;

    saveEmailMonitorRule({
      senderEmailOrName: newRuleSender.trim(),
      keywords: newRuleKeywords ? newRuleKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      description: newRuleDesc.trim() || `مراقبة البريد الخاص بـ ${newRuleSender}`,
      isActive: true,
      notifySound: true,
    });

    setNewRuleSender('');
    setNewRuleKeywords('');
    setNewRuleDesc('');
    refreshData();
  };

  const handleDeleteRule = (id: string) => {
    deleteEmailMonitorRule(id);
    refreshData();
  };

  // Handle Simulating Incoming Monitored Email
  const handleSimulateEmail = () => {
    const activeRule = rules[0] || { id: 'rule-sim', senderEmailOrName: simSender };

    saveMonitoredEmail({
      ruleId: activeRule.id,
      senderName: simSender.includes('@') ? simSender.split('@')[0] : simSender,
      senderEmail: simSender,
      subject: simSubject,
      previewText: simBody,
      receivedAt: new Date().toISOString(),
      read: false,
      priority: 'urgent',
    });

    // Play Alert Chime & Notification
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error(e);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`📩 رسالة بريد جديدة من ${simSender}`, {
          body: `العنوان: ${simSubject}`,
        });
      } catch (e) {
        console.error(e);
      }
    }

    refreshData();
  };

  const handleMarkRead = (id: string) => {
    markEmailRead(id);
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Radio className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isArabic ? 'مركز التواصل والمراقبة في الخلفية 🚀' : 'Background Messaging & Email Radar Center'}
              </h2>
              <p className="text-xs text-teal-100">
                {isArabic
                  ? 'إرسال المراسلات الفورية المباشرة ومراقبة البريد الإلكتروني في الخلفية مع التنبيهات الصوتيية'
                  : 'Automated background social dispatcher & continuous inbox radar monitor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-all text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('autoheal_dashboard')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs transition-all shrink-0 ${
              activeTab === 'autoheal_dashboard'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span>{isArabic ? 'لوحة تحكم الفحص الذاتي (AutoHeal 📈)' : 'AutoHeal Dashboard'}</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px]">
              {isArabic ? 'رسوم بيانية' : 'Analytics'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('messaging')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs transition-all shrink-0 ${
              activeTab === 'messaging'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isArabic ? 'المراسلات في الخلفية (انستغرام/واتساب...)' : 'Background Social Messaging'}</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px]">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email_monitor')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs transition-all shrink-0 ${
              activeTab === 'email_monitor'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{isArabic ? 'رادار ومراقب البريد الخاص' : 'Inbox Radar & Monitor'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
              {monitoredEmails.filter((m) => !m.read).length} جديدة
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 theme-scrollbar">
          {/* TAB 1: Background Messaging */}
          {activeTab === 'messaging' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {isArabic ? 'إرسال / جدولة رسالة في الخلفية' : 'New Background Message Dispatch'}
                  </h3>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? 'منصة التواصل' : 'Platform'}
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="instagram">📸 انستغرام (Instagram Direct)</option>
                      <option value="whatsapp">💬 واتساب (WhatsApp Messenger)</option>
                      <option value="telegram">✈️ تليجرام (Telegram)</option>
                      <option value="email">✉️ البريد الإلكتروني (Email Inbox)</option>
                      <option value="twitter">🐦 تويتر / X Direct Message</option>
                      <option value="messenger">💙 فيسبوك ماسنجر Messenger</option>
                      <option value="sms">📱 رسالة نصية قصيره SMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? 'المستلم (@username / هاتف / بريد)' : 'Recipient'}
                    </label>
                    <input
                      type="text"
                      placeholder={isArabic ? 'مثال: @username أو +213660000000' : '@username or phone'}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  {platform === 'email' && (
                    <div>
                      <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                        {isArabic ? 'موضوع الرسالة' : 'Subject'}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? 'عنوان الإيميل' : 'Email subject'}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? 'محتوى الرسالة' : 'Message Content'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isArabic ? 'اكتب الرسالة المراد إرسالها نيابة عنك...' : 'Type message content...'}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? 'الجدولة في الخلفية (دقائق)' : 'Schedule Minutes'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={scheduleMinutes}
                      onChange={(e) => setScheduleMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {scheduleMinutes === 0
                        ? isArabic
                          ? 'إرسال إطلاق فوري مباشر مع فتح التطبيق'
                          : 'Instant launch and dispatch'
                        : isArabic
                        ? `سيتم الإرسال تلقائياً بعد ${scheduleMinutes} دقائق في الخلفية`
                        : `Will dispatch in background after ${scheduleMinutes} min`}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isArabic ? 'إرسال الرسالة في الخلفية الآن 🚀' : 'Dispatch Message Now 🚀'}</span>
                  </button>
                </form>
              </div>

              {/* Messages Log */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <span>{isArabic ? 'سجل المراسلات الموجهة والمجدولة في الخلفية' : 'Background Messages Queue'}</span>
                </h3>

                {messages.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                    {isArabic
                      ? 'لا توجد رسائل موجهة في الخلفية حتى الآن. أطلب من أدم إرسال رسالة في انستغرام أو واتساب!'
                      : 'No background messages yet. Ask Adam to send a message on Instagram or WhatsApp!'}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] uppercase">
                              {m.platform}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              إلى: {m.recipient}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                m.status === 'sent'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {m.status === 'sent'
                                ? isArabic
                                  ? 'تم الإرسال 🚀'
                                  : 'Sent'
                                : isArabic
                                ? 'مجدولة بالخلفية ⏳'
                                : 'Scheduled'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                            {m.content}
                          </p>
                          <div className="text-[10px] text-slate-400 flex items-center gap-3">
                            <span>{new Date(m.sentAt || m.scheduledTimeIso || '').toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</span>
                            {m.appDeepLink && (
                              <a
                                href={m.appDeepLink}
                                className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isArabic ? 'فتح التطبيق' : 'Open App'}
                              </a>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMsg(m.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Email Radar & Inbox Monitor */}
          {activeTab === 'email_monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Rules & Setup */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {isArabic ? 'تفعيل قاعدة مراقبة بريد جديدة' : 'Add Email Radar Rule'}
                    </h3>
                  </div>

                  <form onSubmit={handleAddRule} className="space-y-3 text-xs">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                        {isArabic ? 'أي عنوان بريد إلكتروني (Gmail, Outlook, Yahoo, أو بريد شخصي/عمل)' : 'Any Email Address or Sender Name'}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? 'مثال: name@gmail.com أو boss@company.com أو "المدير"' : 'e.g. name@gmail.com or boss@company.com'}
                        value={newRuleSender}
                        onChange={(e) => setNewRuleSender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                        {isArabic ? 'كلمات مفتاحية للتنصت والفلترة (بفواصل)' : 'Keywords (comma separated)'}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? 'مثال: عاجل, فاتورة, اجتماع, موافقة' : 'urgent, invoice, meeting'}
                        value={newRuleKeywords}
                        onChange={(e) => setNewRuleKeywords(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-400">
                        {isArabic ? 'وصف الهدف' : 'Description'}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? 'مراقبة إيميلات الإدارة والتنبيه الفوري' : 'Monitor VIP emails'}
                        value={newRuleDesc}
                        onChange={(e) => setNewRuleDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'تشغيل المراقبة والتنبيه 🚨' : 'Activate Email Monitor 🚨'}</span>
                    </button>
                  </form>
                </div>

                {/* Simulation Panel for testing */}
                <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <Play className="w-4 h-4" />
                    <span>{isArabic ? 'تجربة المحاكاة واختبار التنبيه الصوتي' : 'Simulate Incoming Email Alert'}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {isArabic
                      ? 'يمكنك اختبار تنبيه الرادار الصوتي والتنبيه المباشر بوصول رسالة محاكاة الآن:'
                      : 'Test the live radar sound & alert by simulating an incoming email arrival now:'}
                  </p>
                  <button
                    onClick={handleSimulateEmail}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'محاكاة وصول بريد جديد عاجل 🔔' : 'Simulate Test Email Arrival 🔔'}</span>
                  </button>
                </div>
              </div>

              {/* Monitored Email Feed & Active Rules */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <span>{isArabic ? 'الرسائل الواردة الممسوحة برادار المراقبة' : 'Monitored Incoming Inbox'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-normal">
                      {monitoredEmails.length} رسالة مستلمة
                    </span>
                  </h3>

                  {monitoredEmails.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                      {isArabic
                        ? 'لم يتم رصد رسائل واردة طارئة بعد. سيعمل الرادار في الخلفية بشكل آلي!'
                        : 'No monitored emails caught yet. The radar will automatically trigger alerts in background!'}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {monitoredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            email.read
                              ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {email.senderName} ({email.senderEmail})
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold">
                                  🚨 {isArabic ? 'هام جداً' : 'Urgent'}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                {email.subject}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                                {email.previewText}
                              </p>
                              <div className="text-[10px] text-slate-400 pt-1">
                                {new Date(email.receivedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                              </div>
                            </div>

                            {!email.read && (
                              <button
                                onClick={() => handleMarkRead(email.id)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] whitespace-nowrap shadow-xs"
                              >
                                {isArabic ? 'تم الاطلاع' : 'Mark Read'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Rules List */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2">
                    {isArabic ? 'القواعد النشطة حالياً في رادار الخلفية' : 'Active Email Radar Rules'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rules.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {r.senderEmailOrName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {r.description}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRule(r.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AutoHeal Dashboard & Analytics */}
          {activeTab === 'autoheal_dashboard' && (
            <AutoHealDashboard isArabic={isArabic} onOpenSettings={onOpenSettings} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-500" />
            <span>
              {isArabic
                ? 'يعمل وكيل أدم في الخلفية بشكل متواصل لحراسة الرسائل وتأكيد الوصول'
                : 'Adam AI Agent operates continuously in background mode'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all"
          >
            {isArabic ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
