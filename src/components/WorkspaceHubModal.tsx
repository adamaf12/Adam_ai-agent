import { loadSessions } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  HardDrive,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderPlus,
  Search,
  X,
  Lock,
  ShieldCheck,
  Sparkles,
  LogIn,
  LogOut,
  Bot,
  FileText,
  Clock,
  UserPlus,
  ArrowRight,
  Folder,
  GripVertical,
  Bell,
  CalendarPlus,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  googleSignIn,
  fastGoogleSignIn,
  getWorkspaceAccessToken,
  logoutWorkspace,
  initWorkspaceAuth,
} from '../lib/workspaceAuth';
import { maskEmailAddress } from '../lib/quotaManager';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchGmailMessages,
  fetchUnreadGmailMessages,
  summarizeGmailInbox,
  sendGmailMessage,
  trashGmailMessage,
  fetchDriveFiles,
  createDriveFolder,
  deleteDriveFile,
  fetchGoogleContacts,
  createGoogleContact,
  deleteGoogleContact,
  GoogleCalendarEvent,
  GmailMessageSummary,
  DriveFileItem,
  GoogleContact,
} from '../lib/workspaceApi';

interface WorkspaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic?: boolean;
  onSendToAgent?: (promptText: string) => void;
}

type TabType = 'overview' | 'calendar' | 'gmail' | 'drive' | 'contacts';

export const WorkspaceHubModal: React.FC<WorkspaceHubModalProps> = ({
  isOpen,
  onClose,
  isArabic = true,
  onSendToAgent,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Data states
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Inbox Summary State
  const [isSummarizingInbox, setIsSummarizingInbox] = useState<boolean>(false);
  const [inboxSummary, setInboxSummary] = useState<{
    text: string;
    emailsCount: number;
    isUnread: boolean;
    emails: GmailMessageSummary[];
  } | null>(null);

  // Confirmation modal state for destructive operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete_event' | 'trash_email' | 'delete_file' | 'delete_contact';
    targetId: string;
  } | null>(null);

  // Drag and Drop & Reminders State
  const [isDraggingEmail, setIsDraggingEmail] = useState<boolean>(false);
  const [isDragOverCalendar, setIsDragOverCalendar] = useState<boolean>(false);
  const [isDragOverReminder, setIsDragOverReminder] = useState<boolean>(false);

  interface ReminderItem {
    id: string;
    title: string;
    description: string;
    from?: string;
    dueTime: string;
    isCompleted: boolean;
    createdAt: string;
  }

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem('adam_workspace_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('adam_workspace_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.warn('Failed to save reminders:', e);
    }
  }, [reminders]);

  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState({ summary: '', description: '', location: '', startTime: '', endTime: '' });

  const [showSendEmail, setShowSendEmail] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' });

  const [showAddFolder, setShowAddFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });

  // Check auth state on mount
  useEffect(() => {
    const token = getWorkspaceAccessToken();
    if (token) {
      setIsAuthenticated(true);
    }

    const unsubscribe = initWorkspaceAuth(
      (user) => {
        setIsAuthenticated(true);
        setUserEmail(user.email);
      },
      () => {
        const currentToken = getWorkspaceAccessToken();
        setIsAuthenticated(!!currentToken);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch data when authenticated or tab changes
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAllWorkspaceData();
    }
  }, [isOpen, isAuthenticated]);

  const loadAllWorkspaceData = async () => {
    const token = getWorkspaceAccessToken();
    if (!token) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      const [evList, msgList, driveList, contactList] = await Promise.allSettled([
        fetchCalendarEvents(token),
        fetchGmailMessages(10, token),
        fetchDriveFiles(15, token),
        fetchGoogleContacts(20, token),
      ]);

      if (evList.status === 'fulfilled') setEvents(evList.value);
      if (msgList.status === 'fulfilled') setMessages(msgList.value);
      if (driveList.status === 'fulfilled') setDriveFiles(driveList.value);
      if (contactList.status === 'fulfilled') setContacts(contactList.value);
    } catch (err: any) {
      console.error('Workspace data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage({ text: isArabic ? 'جاري الاتصال بـ Google Workspace...' : 'Connecting to Google Workspace...', type: 'info' });
    try {
      const result = await googleSignIn();
      if (result) {
        setIsAuthenticated(true);
        setUserEmail(result.user.email);
        setStatusMessage({
          text: isArabic ? 'تم ربط خدمات Google Workspace بنجاح!' : 'Successfully connected Google Workspace Services!',
          type: 'success',
        });
        await loadAllWorkspaceData();
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || (isArabic ? 'فشل تسجيل الدخول إلى Google' : 'Failed to sign in with Google'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutWorkspace();
    setIsAuthenticated(false);
    setUserEmail(null);
    setEvents([]);
    setMessages([]);
    setDriveFiles([]);
    setContacts([]);
    setStatusMessage({ text: isArabic ? 'تم تسجيل الخروج من Google' : 'Signed out from Google', type: 'info' });
  };

  // Mandatory Confirmation Trigger before deleting/mutating
  const triggerDeleteConfirmation = (
    title: string,
    description: string,
    actionType: 'delete_event' | 'trash_email' | 'delete_file' | 'delete_contact',
    targetId: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      actionType,
      targetId,
    });
  };

  const handleExecuteConfirmedAction = async () => {
    if (!confirmDialog) return;
    const { actionType, targetId } = confirmDialog;
    setConfirmDialog(null);
    setLoading(true);

    try {
      if (actionType === 'delete_event') {
        await deleteCalendarEvent(targetId);
        setEvents((prev) => prev.filter((e) => e.id !== targetId));
        setStatusMessage({ text: isArabic ? 'تم حذف الحدث من التقويم' : 'Event deleted from calendar', type: 'success' });
      } else if (actionType === 'trash_email') {
        await trashGmailMessage(targetId);
        setMessages((prev) => prev.filter((m) => m.id !== targetId));
        setStatusMessage({ text: isArabic ? 'تم نقل البريد إلى المهملات' : 'Email moved to trash', type: 'success' });
      } else if (actionType === 'delete_file') {
        await deleteDriveFile(targetId);
        setDriveFiles((prev) => prev.filter((f) => f.id !== targetId));
        setStatusMessage({ text: isArabic ? 'تم حذف الملف من Google Drive' : 'File deleted from Google Drive', type: 'success' });
      } else if (actionType === 'delete_contact') {
        await deleteGoogleContact(targetId);
        setContacts((prev) => prev.filter((c) => c.resourceName !== targetId));
        setStatusMessage({ text: isArabic ? 'تم حذف جهة الاتصال' : 'Contact deleted', type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || (isArabic ? 'حدث خطأ أثناء التنفيذ' : 'Action failed'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.summary || !newEvent.startTime || !newEvent.endTime) return;
    setLoading(true);
    try {
      const created = await createCalendarEvent({
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        startTime: new Date(newEvent.startTime).toISOString(),
        endTime: new Date(newEvent.endTime).toISOString(),
      });
      setEvents((prev) => [created, ...prev]);
      setShowAddEvent(false);
      setNewEvent({ summary: '', description: '', location: '', startTime: '', endTime: '' });
      setStatusMessage({ text: isArabic ? 'تم إضافة الحدث بنجاح إلى تقويم Google!' : 'Event created in Google Calendar!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'فشل إضافة الحدث', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.to || !newEmail.subject || !newEmail.body) return;
    setLoading(true);
    try {
      await sendGmailMessage(newEmail.to, newEmail.subject, newEmail.body);
      setShowSendEmail(false);
      setNewEmail({ to: '', subject: '', body: '' });
      setStatusMessage({ text: isArabic ? 'تم إرسال البريد الإلكتروني عبر Gmail بنجاح!' : 'Email sent via Gmail successfully!', type: 'success' });
      await loadAllWorkspaceData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'فشل إرسال البريد', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      const folder = await createDriveFolder(newFolderName.trim());
      setDriveFiles((prev) => [folder, ...prev]);
      setShowAddFolder(false);
      setNewFolderName('');
      setStatusMessage({ text: isArabic ? 'تم إنشاء المجلد في Google Drive!' : 'Folder created in Google Drive!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'فشل إنشاء المجلد', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    setLoading(true);
    try {
      const created = await createGoogleContact(newContact.name, newContact.email, newContact.phone);
      setContacts((prev) => [created, ...prev]);
      setShowAddContact(false);
      setNewContact({ name: '', email: '', phone: '' });
      setStatusMessage({ text: isArabic ? 'تمت إضافة جهة الاتصال إلى Google!' : 'Contact added to Google!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'فشل إضافة جهة الاتصال', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const triggerAgentPrompt = (promptText: string) => {
    if (onSendToAgent) {
      onSendToAgent(promptText);
      onClose();
    }
  };

  const handleSummarizeInbox = async () => {
    if (!isAuthenticated) {
      setStatusMessage({
        text: isArabic ? 'يرجى تسجيل الدخول إلى Google Workspace أولاً' : 'Please sign in to Google Workspace first',
        type: 'error',
      });
      return;
    }

    const token = getWorkspaceAccessToken();
    if (!token) {
      setStatusMessage({
        text: isArabic ? 'رمز الوصول غير متوفر. يرجى تسجيل الدخول مجدداً.' : 'Access token missing. Please sign in again.',
        type: 'error',
      });
      return;
    }

    setIsSummarizingInbox(true);
    setStatusMessage({
      text: isArabic ? 'جاري جلب آخر 5 رسائل غير مقروءة وتحليلها عبر الذكاء الاصطناعي...' : 'Fetching & AI summarizing last 5 unread emails...',
      type: 'info',
    });

    try {
      const { messages: unreadMsgs, isUnread } = await fetchUnreadGmailMessages(5, token);
      if (unreadMsgs.length === 0) {
        setStatusMessage({
          text: isArabic ? 'لم يتم العثور على أي رسائل بريد إلكتروني في صندوق الوارد.' : 'No email messages found in inbox.',
          type: 'info',
        });
        setIsSummarizingInbox(false);
        return;
      }

      const summaryText = await summarizeGmailInbox(unreadMsgs, isArabic);

      setInboxSummary({
        text: summaryText,
        emailsCount: unreadMsgs.length,
        isUnread,
        emails: unreadMsgs,
      });

      setStatusMessage({
        text: isArabic ? 'تم إنشاء ملخص البريد الإلكتروني الذكي بنجاح! ✨' : 'AI Inbox Summary generated successfully! ✨',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error summarizing inbox:', err);
      setStatusMessage({
        text: err.message || (isArabic ? 'فشل تلخيص البريد الوارد' : 'Failed to summarize inbox'),
        type: 'error',
      });
    } finally {
      setIsSummarizingInbox(false);
    }
  };

  // Drag and drop event handlers
  const handleDragEmailStart = (
    e: React.DragEvent,
    data: { title: string; description: string; from?: string; snippet?: string; date?: string }
  ) => {
    const payload = JSON.stringify({
      title: data.title,
      description: data.description,
      from: data.from || '',
      snippet: data.snippet || '',
      date: data.date || '',
      type: 'email_action_item',
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', `${data.title}\n\n${data.description}`);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDraggingEmail(true);
  };

  const handleDragEmailEnd = () => {
    setIsDraggingEmail(false);
    setIsDragOverCalendar(false);
    setIsDragOverReminder(false);
  };

  const handleDropOnCalendar = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCalendar(false);
    setIsDraggingEmail(false);

    try {
      const jsonString = e.dataTransfer.getData('application/json');
      let title = '';
      let description = '';
      let from = '';

      if (jsonString) {
        const parsed = JSON.parse(jsonString);
        title = parsed.title || parsed.subject || '';
        description = parsed.description || parsed.snippet || '';
        from = parsed.from || '';
      } else {
        const plainText = e.dataTransfer.getData('text/plain');
        if (plainText) {
          const parts = plainText.split('\n\n');
          title = parts[0] || 'Email Action Item';
          description = parts.slice(1).join('\n\n');
        }
      }

      if (!title) return;

      // Default time-bound slot: Tomorrow at 10:00 AM - 10:30 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTomorrow = new Date(tomorrow.getTime() + 30 * 60 * 1000);

      const formatLocalISO = (d: Date) => {
        const offsetMs = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
      };

      const eventTitle = title.startsWith('[Action Item]') ? title : `[Action Item] ${title}`;
      const fullDesc = description
        ? `${description}\n\nGenerated from Gmail Email Summary`
        : `Action Item created from Gmail summary (${from})`;

      setNewEvent({
        summary: eventTitle,
        description: fullDesc,
        location: 'Google Calendar / Workspace',
        startTime: formatLocalISO(tomorrow),
        endTime: formatLocalISO(endTomorrow),
      });

      // Auto create on Google Calendar if authenticated
      if (isAuthenticated) {
        setLoading(true);
        try {
          const created = await createCalendarEvent({
            summary: eventTitle,
            description: fullDesc,
            location: 'Google Calendar / Workspace',
            startTime: tomorrow.toISOString(),
            endTime: endTomorrow.toISOString(),
          });

          setEvents((prev) => [created, ...prev]);
          setStatusMessage({
            text: isArabic
              ? `📅 تم جدولتها بالتقويم بنجاح: "${eventTitle}" غداً 10:00 AM!`
              : `📅 Auto-created Calendar Event: "${eventTitle}" for tomorrow 10:00 AM!`,
            type: 'success',
          });
        } catch (err: any) {
          console.warn('Calendar API create error, opening form:', err);
          setShowAddEvent(true);
        } finally {
          setLoading(false);
        }
      } else {
        setShowAddEvent(true);
      }

      setActiveTab('calendar');
    } catch (err: any) {
      console.error('Failed to process dropped item on Calendar:', err);
    }
  };

  const handleDropOnReminders = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverReminder(false);
    setIsDraggingEmail(false);

    try {
      const jsonString = e.dataTransfer.getData('application/json');
      let title = '';
      let description = '';
      let from = '';

      if (jsonString) {
        const parsed = JSON.parse(jsonString);
        title = parsed.title || parsed.subject || '';
        description = parsed.description || parsed.snippet || '';
        from = parsed.from || '';
      } else {
        const plainText = e.dataTransfer.getData('text/plain');
        if (plainText) {
          const parts = plainText.split('\n\n');
          title = parts[0] || 'Email Reminder';
          description = parts.slice(1).join('\n\n');
        }
      }

      if (!title) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const dueTimeString = tomorrow.toLocaleString(isArabic ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newReminderItem: ReminderItem = {
        id: 'rem_' + Date.now(),
        title: title.startsWith('📌') ? title : `📌 ${title}`,
        description: description || `Action Item from ${from}`,
        from: from,
        dueTime: dueTimeString,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      setReminders((prev) => [newReminderItem, ...prev]);

      setStatusMessage({
        text: isArabic
          ? `⏰ تم إنشاء تذكير ومهمة عاجلة: "${newReminderItem.title}" (الموعد: ${dueTimeString})`
          : `⏰ Created time-bound Reminder: "${newReminderItem.title}" (Due: ${dueTimeString})`,
        type: 'success',
      });

      setActiveTab('calendar');
    } catch (err) {
      console.error('Failed to process dropped item on Reminders:', err);
    }
  };

  const toggleReminderCompletion = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };


// Background Auto-Backup to Google Drive
  useEffect(() => {
    let interval: any;
    if (isAuthenticated) {
      interval = setInterval(async () => {
        try {
          if (!navigator.onLine) return;
          const sessions = loadSessions();
          if (sessions.length > 0) {
            const summaryText = sessions.map(s => 
              `Session: ${s.title}\nDate: ${s.updatedAt}\nMessages:\n` + 
              s.messages.map(m => `[${m.timestamp}] ${m.sender}: ${m.content}`).join('\n')
            ).join('\n\n--- \n\n');
            
            const fileContent = new Blob([summaryText], { type: 'text/plain' });
            
            const token = await getWorkspaceAccessToken();
            if (token) {
              const metadata = {
                name: 'Adam_Agent_Backup.txt',
                mimeType: 'text/plain'
              };
              const form = new FormData();
              form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
              form.append('file', fileContent);
              
              await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                body: form
              });
              console.log('[WorkspaceHub] Successfully backed up conversations to Google Drive.');
            }
          }
        } catch(e) {
          console.error('[Drive Backup Error]:', e);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {isArabic ? 'مركّز خدمات Google Workspace الذكي' : 'Google Workspace Smart Hub'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'إدارة متكاملة لـ Google Drive و Gmail و Calendar و Contacts مع المساعد الذكي ADAM'
                  : 'Full integration for Google Drive, Gmail, Calendar, and Contacts with ADAM AI'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{userEmail ? maskEmailAddress(userEmail) : (isArabic ? 'متصل بـ Google' : 'Connected to Google')}</span>
                <button
                  onClick={handleLogout}
                  title={isArabic ? 'تسجيل الخروج' : 'Logout'}
                  className="hover:text-red-400 transition-colors mr-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>{isArabic ? 'ربط Google Workspace' : 'Connect Google Workspace'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isArabic ? 'لوحة المساعد والملخص' : 'AI Assistant Overview'}</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'drive'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Google Drive</span>
            {driveFiles.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {driveFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'gmail'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Gmail</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverCalendar(true);
            }}
            onDragLeave={() => setIsDragOverCalendar(false)}
            onDrop={handleDropOnCalendar}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              isDragOverCalendar
                ? 'bg-indigo-600 text-white border-2 border-amber-300 scale-105 shadow-lg animate-pulse ring-2 ring-indigo-400'
                : activeTab === 'calendar'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
            title={isArabic ? 'انقر أو اسحب ملخص البريد هنا لجدولته في تقويم Google' : 'Click or drop email summary here to schedule in Google Calendar'}
          >
            <Calendar className={`w-4 h-4 ${isDragOverCalendar ? 'text-amber-300 animate-bounce' : 'text-indigo-400'}`} />
            <span>Google Calendar</span>
            {events.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {events.length}
              </span>
            )}
            {isDraggingEmail && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 text-[10px] animate-pulse">
                {isArabic ? 'اسحب هنا' : 'Drop Here'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'contacts'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Google Contacts</span>
            {contacts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {contacts.length}
              </span>
            )}
          </button>

          {isAuthenticated && (
            <button
              onClick={loadAllWorkspaceData}
              disabled={loading}
              className="mr-auto p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
              title={isArabic ? 'تحديث البيانات' : 'Refresh Workspace'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          )}
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`flex items-center justify-between px-6 py-2.5 text-xs font-medium border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 theme-scrollbar">
          {isAuthenticated && inboxSummary && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-purple-950/70 border border-indigo-500/40 shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                    <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{isArabic ? 'ملخص الذكاء الاصطناعي لرسائل Gmail' : 'AI Inbox Executive Summary'}</span>
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {inboxSummary.isUnread
                          ? (isArabic ? `${inboxSummary.emailsCount} رسائل غير مقروءة` : `${inboxSummary.emailsCount} Unread Emails`)
                          : (isArabic ? `${inboxSummary.emailsCount} رسائل حديثة` : `${inboxSummary.emailsCount} Recent Emails`)}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isArabic ? 'تحليل تنفيذي ذكي لآخر 5 رسائل في صندوق الوارد بـ Gmail' : 'Automated executive analysis of your last 5 Gmail inbox messages'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInboxSummary(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  title={isArabic ? 'إغلاق الملخص' : 'Close Summary'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email Chips & Draggable Action Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    {isArabic ? '💡 اسحب أي إيميل أدناه مباشرة إلى التقويم أو التذكيرات لتحديد موعد تلقائي:' : '💡 Drag any email below directly into Calendar or Reminders to auto-schedule:'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Draggable Full Action Plan */}
                  <div
                    draggable={true}
                    onDragStart={(e) =>
                      handleDragEmailStart(e, {
                        title: isArabic ? 'خطة العمل التنفيذية من ملخص البريد' : 'Executive Action Plan from Email Summary',
                        description: inboxSummary.text,
                        from: 'Gmail AI Summary',
                      })
                    }
                    onDragEnd={handleDragEmailEnd}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-indigo-600/30 to-purple-600/30 border border-amber-400/40 hover:border-amber-300 text-[11px] text-amber-200 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm transition-all"
                    title={isArabic ? 'اسحب ملخص العمل الكامل إلى التقويم أو التذكيرات' : 'Drag entire Action Plan to Calendar or Reminders'}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                    <span className="font-bold">{isArabic ? 'اسحب ملخص العمل الكامل ✨' : 'Drag Full Action Summary ✨'}</span>
                  </div>

                  {/* Draggable Individual Email Chips */}
                  {inboxSummary.emails.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      draggable={true}
                      onDragStart={(e) =>
                        handleDragEmailStart(e, {
                          title: m.subject,
                          description: `From: ${m.from}\nDate: ${m.date}\nSnippet: ${m.snippet}`,
                          from: m.from,
                          snippet: m.snippet,
                          date: m.date,
                        })
                      }
                      onDragEnd={handleDragEmailEnd}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-indigo-950/80 border border-slate-700/80 hover:border-indigo-400 text-[11px] text-slate-300 flex items-center gap-1.5 max-w-[300px] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm group"
                      title={isArabic ? 'اسحب هذا البريد لتحديد موعد في التقويم أو إنشاء تذكير' : 'Drag to schedule in Calendar or create Reminder'}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition flex-shrink-0" />
                      <Mail className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">{m.from.split('<')[0].trim()}</span>
                      <span className="text-slate-500">•</span>
                      <span className="truncate text-slate-400">{m.subject}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Text Content */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {inboxSummary.text}
              </div>

              {/* Interactive Drop Targets for Drag-and-Drop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Calendar Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverCalendar(true);
                  }}
                  onDragLeave={() => setIsDragOverCalendar(false)}
                  onDrop={handleDropOnCalendar}
                  className={`p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    isDragOverCalendar
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 scale-[1.02] shadow-xl animate-pulse ring-2 ring-indigo-400'
                      : 'bg-slate-900/90 border-indigo-500/30 text-indigo-300 hover:border-indigo-400 hover:bg-indigo-950/40'
                  }`}
                >
                  <CalendarPlus className={`w-4 h-4 ${isDragOverCalendar ? 'text-amber-300 animate-bounce' : 'text-indigo-400'}`} />
                  <span>
                    {isArabic
                      ? '📅 افلت الإيميل هنا لجدولته بـ Google Calendar (غداً 10:00 ص)'
                      : '📅 Drop email here to schedule in Google Calendar (Tomorrow 10 AM)'}
                  </span>
                </div>

                {/* Reminders Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverReminder(true);
                  }}
                  onDragLeave={() => setIsDragOverReminder(false)}
                  onDrop={handleDropOnReminders}
                  className={`p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    isDragOverReminder
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200 scale-[1.02] shadow-xl animate-pulse ring-2 ring-amber-400'
                      : 'bg-slate-900/90 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${isDragOverReminder ? 'text-amber-200 animate-bounce' : 'text-amber-400'}`} />
                  <span>
                    {isArabic
                      ? '⏰ افلت الإيميل هنا لإنشاء تذكير عاجل ومهمة مؤقتة'
                      : '⏰ Drop email here to create a time-bound Reminder'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <button
                  onClick={handleSummarizeInbox}
                  disabled={isSummarizingInbox}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizingInbox ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{isArabic ? 'تحديث الملخص' : 'Re-summarize'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerAgentPrompt(`إليك ملخص الرسائل غير المقروءة في Gmail:\n\n${inboxSummary.text}\n\nيرجى المساعدة في اتخاذ الإجراءات وصياغة ردود سريعة.`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg shadow-md transition group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                    <span>{isArabic ? 'مناقشة التفاصيل مع المساعد ADAM 💬' : 'Discuss in Chat with ADAM 💬'}</span>
                  </button>
                  <button
                    onClick={() => setInboxSummary(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
                  >
                    {isArabic ? 'إغلاق' : 'Dismiss'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
              <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Lock className="w-10 h-10 animate-bounce" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-slate-100">
                  {isArabic ? 'تسجيل الدخول إلى Google Workspace' : 'Sign in to Google Workspace'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isArabic
                    ? 'قم بربط حساب Google لتتمكن ADAM من المساعدة في إدارة ملفات Google Drive، والرد وقراءة رسائل Gmail، ومتابعة أحداث التقويم، والوصول إلى جهات اتصالك بأمان مطلق وبإذنك الصريح.'
                    : 'Connect your Google Account to empower ADAM to assist with Google Drive files, Gmail messages, Calendar scheduling, and Google Contacts securely.'}
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                onClick={handleSignIn}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-sm rounded-xl shadow-lg border border-slate-300 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>{isArabic ? 'المتابعة مع حساب Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & AI AGENT PROMPTS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Grid summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{driveFiles.length}</div>
                        <div className="text-xs text-slate-400">Drive Files</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{messages.length}</div>
                        <div className="text-xs text-slate-400">Gmail Messages</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{events.length}</div>
                        <div className="text-xs text-slate-400">Calendar Events</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{contacts.length}</div>
                        <div className="text-xs text-slate-400">Contacts</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick AI Workspace Prompts */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/40 via-slate-800 to-purple-900/30 border border-blue-500/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-400" />
                      <h4 className="text-sm font-bold text-slate-100">
                        {isArabic ? 'أوامر الذكاء الاصطناعي السريعة لـ Google Workspace' : 'Quick AI Workspace Commands'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      {isArabic
                        ? 'انقر على أي أمر أدناه ليقوم الوكيل الذكي ADAM بتحليله وتنفيذه فوراً:'
                        : 'Click any prompt to ask ADAM AI agent to analyze your Google Workspace data:'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={handleSummarizeInbox}
                        disabled={isSummarizingInbox}
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-900/40 via-slate-800 to-slate-800 hover:bg-slate-700/80 border border-purple-500/30 text-right text-xs text-slate-200 transition-all group"
                      >
                        <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          {isArabic ? 'تلخيص آخر 5 رسائل غير مقروءة في Gmail ✨' : 'Summarize 5 unread Gmail messages ✨'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerAgentPrompt('تقويم Google: ما هي المواعيد والاجتماعات المقررة في تقويمي اليوم وغداً؟')}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-right text-xs text-slate-200 transition-all group"
                      >
                        <span className="font-medium">📅 {isArabic ? 'ما هي مواعيدي في التقويم اليوم وغداً؟' : 'What are my calendar meetings today & tomorrow?'}</span>
                        <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerAgentPrompt('Google Drive: استعرض أحدث المستندات والملفات المرفوعة وقم بتحليل العناوين')}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-right text-xs text-slate-200 transition-all group"
                      >
                        <span className="font-medium">📁 {isArabic ? 'حلل الملفات الأخيرة في Google Drive' : 'Analyze recent files in Google Drive'}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerAgentPrompt('جهات الاتصال: أظهر قائمة الجهات المهمة ورتبها حسب البريد الإلكتروني')}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-right text-xs text-slate-200 transition-all group"
                      >
                        <span className="font-medium">👥 {isArabic ? 'استعرض واستخرج جهات الاتصال' : 'View and group my Google Contacts'}</span>
                        <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE DRIVE */}
              {activeTab === 'drive' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isArabic ? 'البحث في ملفات Drive...' : 'Search Drive files...'}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => setShowAddFolder(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>{isArabic ? 'مجلد جديد' : 'New Folder'}</span>
                    </button>
                  </div>

                  {/* Add Folder Modal Inline Form */}
                  {showAddFolder && (
                    <form onSubmit={handleCreateFolder} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200">{isArabic ? 'إنشاء مجلد جديد في Drive' : 'Create New Folder in Drive'}</h4>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={isArabic ? 'اسم المجلد...' : 'Folder name...'}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddFolder(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                        >
                          {isArabic ? 'إنشاء' : 'Create'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {driveFiles
                      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {file.mimeType.includes('folder') ? (
                              <Folder className="w-5 h-5 text-amber-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-400" />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-slate-100">{file.name}</div>
                              <div className="text-[10px] text-slate-400">{file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Drive File'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-700/50"
                                title={isArabic ? 'فتح في Drive' : 'Open in Drive'}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() =>
                                triggerDeleteConfirmation(
                                  isArabic ? `حذف الملف "${file.name}"؟` : `Delete file "${file.name}"?`,
                                  isArabic ? 'هل أنت تأكد من رغبتك في حذف هذا الملف نهائياً من Google Drive؟' : 'Are you sure you want to delete this file from Google Drive?',
                                  'delete_file',
                                  file.id
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50"
                              title={isArabic ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                    {driveFiles.length === 0 && !loading && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        {isArabic ? 'لا توجد ملفات حالياً في Google Drive' : 'No files found in Google Drive'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: GMAIL */}
              {activeTab === 'gmail' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xs font-bold text-slate-200">{isArabic ? 'صندوق الوارد (Gmail)' : 'Gmail Inbox'}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSummarizeInbox}
                        disabled={isSummarizingInbox || loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
                        title={isArabic ? 'جلب آخر 5 رسائل غير مقروءة وتلخيصها بذكاء الاصطناعي' : 'Fetch last 5 unread emails and summarize with AI'}
                      >
                        <Sparkles className={`w-4 h-4 text-amber-200 ${isSummarizingInbox ? 'animate-spin' : ''}`} />
                        <span>{isSummarizingInbox ? (isArabic ? 'جاري التلخيص...' : 'Summarizing...') : (isArabic ? 'تلخيص الوارد ✨' : 'Summarize Inbox ✨')}</span>
                      </button>

                      <button
                        onClick={() => setShowSendEmail(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isArabic ? 'إنشاء بريد' : 'Compose Email'}</span>
                      </button>
                    </div>
                  </div>

                  {showSendEmail && (
                    <form onSubmit={handleSendEmail} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200">{isArabic ? 'إرسال رسالة بريد إلكتروني جديدة' : 'Compose New Email'}</h4>
                      <input
                        type="email"
                        value={newEmail.to}
                        onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                        placeholder={isArabic ? 'المرسل إليه (الإيميل)...' : 'Recipient Email...'}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newEmail.subject}
                        onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                        placeholder={isArabic ? 'الموضوع...' : 'Subject...'}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        value={newEmail.body}
                        onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                        placeholder={isArabic ? 'محتوى الرسالة...' : 'Email content...'}
                        rows={4}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSendEmail(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'إرسال' : 'Send'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        draggable={true}
                        onDragStart={(e) =>
                          handleDragEmailStart(e, {
                            title: msg.subject,
                            description: `From: ${msg.from}\nDate: ${msg.date}\nSnippet: ${msg.snippet}`,
                            from: msg.from,
                            snippet: msg.snippet,
                            date: msg.date,
                          })
                        }
                        onDragEnd={handleDragEmailEnd}
                        className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 space-y-1.5 transition-all cursor-grab active:cursor-grabbing group hover:border-indigo-500/40"
                        title={isArabic ? 'اسحب هذا البريد إلى التقويم أو التذكيرات لتحديد موعد عمل' : 'Drag this email to Calendar or Reminders to schedule'}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                            <div className="text-xs font-bold text-blue-300">{msg.from}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{msg.date}</span>
                            <button
                              onClick={() =>
                                triggerDeleteConfirmation(
                                  isArabic ? `نقل الرسالة إلى المهملات؟` : `Trash email?`,
                                  isArabic ? `هل تريد نقل الرسالة "${msg.subject}" إلى سلة المهملات؟` : `Move email "${msg.subject}" to trash?`,
                                  'trash_email',
                                  msg.id
                                )
                              }
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/50"
                              title={isArabic ? 'نقل للمهملات' : 'Move to trash'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-100 pl-5">{msg.subject}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 pl-5">{msg.snippet}</div>
                      </div>
                    ))}

                    {messages.length === 0 && !loading && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        {isArabic ? 'لا توجد رسائل بريد إلكتروني في صندوق الوارد' : 'No emails found in Gmail'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GOOGLE CALENDAR */}
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  {/* Drop Zone Banner for Calendar */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverCalendar(true);
                    }}
                    onDragLeave={() => setIsDragOverCalendar(false)}
                    onDrop={handleDropOnCalendar}
                    className={`p-4 rounded-2xl border-2 border-dashed flex items-center justify-between gap-3 text-xs font-semibold cursor-pointer transition-all ${
                      isDragOverCalendar
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-100 scale-[1.02] shadow-xl animate-pulse ring-2 ring-indigo-400'
                        : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                        <CalendarPlus className={`w-5 h-5 ${isDragOverCalendar ? 'animate-bounce text-amber-300' : ''}`} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">
                          {isArabic ? '📅 افلت ملخص البريد هنا لإنشاء حدث بالتقويم تلقائياً' : '📅 Drop Email Summary here to auto-create Calendar Event'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {isArabic
                            ? 'اسحب أي بريد أو ملخص ذكي لجدولة موعد عمل مؤقت (تلقائياً غداً الساعة 10:00 صباحاً)'
                            : 'Drag & drop any email summary chip to auto-schedule a time-bound action item'}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-600/40 border border-indigo-400/50 text-[11px] text-indigo-200">
                      {isArabic ? 'افلت هنا' : 'Drop Here'}
                    </div>
                  </div>

                  {/* Time-Bound Action Items & Reminders */}
                  {reminders.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span>{isArabic ? 'التذكيرات والمهام المؤقتة (من ملخص البريد)' : 'Time-Bound Action Items & Reminders (from Email)'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] text-amber-300">
                            {reminders.length}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isArabic ? 'حالة الانتهاء محفوظة تلقائياً' : 'Auto-saved locally'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {reminders.map((rem) => (
                          <div
                            key={rem.id}
                            className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                              rem.isCompleted
                                ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through'
                                : 'bg-slate-800/80 border-slate-700 text-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={() => toggleReminderCompletion(rem.id)}
                                className="mt-0.5 text-amber-400 hover:text-amber-300 transition"
                              >
                                {rem.isCompleted ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                              </button>
                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${rem.isCompleted ? 'text-slate-500' : 'text-slate-100'}`}>
                                  {rem.title}
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-2">{rem.description}</div>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    {isArabic ? `الموعد: ${rem.dueTime}` : `Due: ${rem.dueTime}`}
                                  </span>
                                  {rem.from && (
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-rose-400" />
                                      {rem.from}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteReminder(rem.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                              title={isArabic ? 'حذف التذكير' : 'Delete Reminder'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200">{isArabic ? 'أحداث تقويم Google القادمة' : 'Google Calendar Events'}</h3>
                    <button
                      onClick={() => setShowAddEvent(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'حدث جديد' : 'New Event'}</span>
                    </button>
                  </div>

                  {showAddEvent && (
                    <form onSubmit={handleCreateEvent} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200">{isArabic ? 'إضافة حدث جديد إلى تقويم Google' : 'Add New Event to Google Calendar'}</h4>
                      <input
                        type="text"
                        value={newEvent.summary}
                        onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                        placeholder={isArabic ? 'عنوان الحدث/الاجتماع...' : 'Event summary/title...'}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">{isArabic ? 'وقت البدء' : 'Start Time'}</label>
                          <input
                            type="datetime-local"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">{isArabic ? 'وقت الانتهاء' : 'End Time'}</label>
                          <input
                            type="datetime-local"
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder={isArabic ? 'الموقع أو رابط الاجتماع (اختياري)...' : 'Location or link (optional)...'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddEvent(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                        >
                          {isArabic ? 'حفظ الحدث' : 'Save Event'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-indigo-300">{ev.summary}</div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start.date}
                            </span>
                            {ev.location && <span>📍 {ev.location}</span>}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            triggerDeleteConfirmation(
                              isArabic ? `حذف الحدث "${ev.summary}"؟` : `Delete event "${ev.summary}"?`,
                              isArabic ? 'هل أنت تأكد من رغبتك في حذف هذا الحدث من تقويم Google؟' : 'Are you sure you want to delete this event?',
                              'delete_event',
                              ev.id
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {events.length === 0 && !loading && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        {isArabic ? 'لا توجد أحداث في التقويم قريباً' : 'No upcoming events found'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: GOOGLE CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200">{isArabic ? 'جهات الاتصال' : 'Google Contacts'}</h3>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isArabic ? 'إضافة جهة اتصال' : 'Add Contact'}</span>
                    </button>
                  </div>

                  {showAddContact && (
                    <form onSubmit={handleCreateContact} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200">{isArabic ? 'إضافة جهة اتصال جديدة' : 'Add New Contact'}</h4>
                      <input
                        type="text"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder={isArabic ? 'الاسم الكامل...' : 'Full Name...'}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder={isArabic ? 'البريد الإلكتروني (اختياري)...' : 'Email (optional)...'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="tel"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder={isArabic ? 'رقم الهاتف (اختياري)...' : 'Phone (optional)...'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddContact(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                        >
                          {isArabic ? 'حفظ' : 'Save'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contacts.map((c) => (
                      <div
                        key={c.resourceName}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                              {c.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-100">{c.name}</div>
                            {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                            {c.phoneNumber && <div className="text-[10px] text-cyan-400">{c.phoneNumber}</div>}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            triggerDeleteConfirmation(
                              isArabic ? `حذف جهة الاتصال "${c.name}"؟` : `Delete contact "${c.name}"?`,
                              isArabic ? 'هل أنت تأكد من حذف جهة الاتصال هذه من حساب Google؟' : 'Are you sure you want to delete this contact?',
                              'delete_contact',
                              c.resourceName
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {contacts.length === 0 && !loading && (
                      <div className="col-span-full py-8 text-center text-xs text-slate-400">
                        {isArabic ? 'لا توجد جهات اتصال مسجلة' : 'No contacts found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mandatory Explicit Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100">{confirmDialog.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.description}</p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleExecuteConfirmedAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-semibold text-white shadow-lg transition-colors"
                >
                  {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
