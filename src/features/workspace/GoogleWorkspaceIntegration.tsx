import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  FileText,
  Table,
  CheckSquare,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar as CalendarIcon,
  HardDrive,
  Users,
  Presentation,
  FormInput,
  Clock,
  Inbox,
  Search,
  Check,
  FileSpreadsheet,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import { useAuth } from '../../core/auth/AuthContext';
import {
  initWorkspaceAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  setCachedAccessToken,
  sendGmailMessage,
  getGmailMessages,
  type GmailMessageSummary,
  createGoogleDoc,
  createGoogleSpreadsheet,
  appendSheetRow,
  getGoogleTasks,
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  type GoogleTaskItem,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventPayload,
  getDriveFiles,
  createDriveFile,
  type DriveFileItem,
  getGoogleContacts,
  type ContactItem,
  createGooglePresentation,
  createGoogleForm,
} from '../../core/googleWorkspace';

interface GoogleWorkspaceIntegrationProps {
  language: Language;
}

type MainTab = 'gmail' | 'calendar' | 'drive' | 'docs_suite' | 'tasks' | 'contacts';
type OfficeSubTab = 'docs' | 'sheets' | 'slides' | 'forms';

export function GoogleWorkspaceIntegration({ language }: GoogleWorkspaceIntegrationProps) {
  const isAr = language === 'ar';
  const { user: authUser, signIn: authSignIn } = useAuth();
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('gmail');
  const [officeSubTab, setOfficeSubTab] = useState<OfficeSubTab>('docs');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // 1. Gmail State
  const [gmailSubTab, setGmailSubTab] = useState<'send' | 'inbox'>('send');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // 2. Calendar State
  const [calendarSubTab, setCalendarSubTab] = useState<'upcoming' | 'create'>('upcoming');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventPayload[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [eventEndTime, setEventEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // 3. Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [showDriveCreate, setShowDriveCreate] = useState(false);
  const [newDriveFileName, setNewDriveFileName] = useState('');
  const [newDriveFileContent, setNewDriveFileContent] = useState('');
  const [isCreatingDriveFile, setIsCreatingDriveFile] = useState(false);

  // 4. Docs Suite State
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [createdDocs, setCreatedDocs] = useState<Array<{ id: string; title: string }>>([]);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetHeaders, setSheetHeaders] = useState('Task, Priority, Status, Assignee');
  const [sheetRowData, setSheetRowData] = useState('Build Core, High, Done, Adam');
  const [createdSheets, setCreatedSheets] = useState<Array<{ id: string; title: string; url?: string }>>([]);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  const [slideTitle, setSlideTitle] = useState('');
  const [createdSlides, setCreatedSlides] = useState<Array<{ id: string; title: string }>>([]);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDocTitle, setFormDocTitle] = useState('');
  const [createdForms, setCreatedForms] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // 5. Tasks State
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // 6. Contacts State
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsSearch, setContactsSearch] = useState('');

  // Sync token on mount
  useEffect(() => {
    const currentCached = getAccessToken();
    if (currentCached) {
      setToken(currentCached);
    }
    const unsubscribe = initWorkspaceAuth(
      (_u, authToken) => {
        if (authToken) setToken(authToken);
      },
      () => {}
    );
    return () => unsubscribe();
  }, []);

  const isConnected = Boolean(authUser || token);

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const res = await getGoogleTasks();
      setTasks(res.items || []);
    } catch (err: any) {
      console.warn('Tasks fetch warning:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await getCalendarEvents();
      setCalendarEvents(res.items || []);
    } catch (err: any) {
      console.warn('Calendar fetch warning:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  const loadDrive = useCallback(async () => {
    setIsLoadingDrive(true);
    try {
      const res = await getDriveFiles();
      setDriveFiles(res.files || []);
    } catch (err: any) {
      console.warn('Drive fetch warning:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const res = await getGoogleContacts();
      setContacts(res.connections || []);
    } catch (err: any) {
      console.warn('Contacts fetch warning:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    setIsLoadingInbox(true);
    try {
      const res = await getGmailMessages(10);
      setInboxMessages(res.messages || []);
    } catch (err: any) {
      console.warn('Inbox fetch warning:', err);
    } finally {
      setIsLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    if (activeTab === 'tasks') loadTasks();
    if (activeTab === 'calendar') loadCalendar();
    if (activeTab === 'drive') loadDrive();
    if (activeTab === 'contacts') loadContacts();
    if (activeTab === 'gmail' && gmailSubTab === 'inbox') loadInbox();
  }, [isConnected, activeTab, gmailSubTab, loadTasks, loadCalendar, loadDrive, loadContacts, loadInbox]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setCachedAccessToken(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: isAr ? 'تمت مزامنة وتحديث جميع خدمات Google بنجاح.' : 'Synced Google Workspace services successfully.',
        });
      } else {
        await authSignIn();
        setStatusMessage({
          type: 'success',
          text: isAr ? 'تم تحديث جلسة Google النشطة.' : 'Active Google session refreshed.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || (isAr ? 'فشلت المزامنة التلقائية' : 'Sync failed'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Gmail Send
  const promptSendEmail = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى إكمال الحقول (إلى، الموضوع، النص).' : 'Please complete all email fields.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إرسال البريد' : 'Confirm Send Email',
      description: isAr
        ? `هل تريد إرسال البريد إلى "${emailTo}" بعنوان "${emailSubject}"؟`
        : `Send this email to "${emailTo}"?`,
      confirmLabel: isAr ? 'إرسال فوراً' : 'Send Now',
      onConfirm: async () => {
        setIsSendingEmail(true);
        setStatusMessage(null);
        try {
          await sendGmailMessage({ to: emailTo, subject: emailSubject, body: emailBody });
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إرسال البريد بنجاح إلى ${emailTo}!` : `Email sent to ${emailTo}!`,
          });
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to send email.' });
        } finally {
          setIsSendingEmail(false);
        }
      },
    });
  };

  // Calendar Event Creation
  const promptCreateCalendarEvent = () => {
    if (!eventSummary || !eventStartTime || !eventEndTime) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى تحديد عنوان وموعد الحدث.' : 'Please provide event title and time.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إضافة الموعد للتقويم' : 'Confirm Calendar Event',
      description: isAr
        ? `سيتم حفظ الموعد "${eventSummary}" في تقويم Google لحسابك.`
        : `Event "${eventSummary}" will be added to your Google Calendar.`,
      confirmLabel: isAr ? 'حفظ في التقويم' : 'Save Event',
      onConfirm: async () => {
        setIsCreatingEvent(true);
        setStatusMessage(null);
        try {
          const newEvt = await createCalendarEvent({
            summary: eventSummary,
            description: eventDescription,
            start: { dateTime: new Date(eventStartTime).toISOString() },
            end: { dateTime: new Date(eventEndTime).toISOString() },
          });
          setCalendarEvents((prev) => [newEvt, ...prev]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم حفظ الموعد "${eventSummary}" بنجاح!` : `Event "${eventSummary}" scheduled!`,
          });
          setEventSummary('');
          setEventDescription('');
          setCalendarSubTab('upcoming');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to schedule event' });
        } finally {
          setIsCreatingEvent(false);
        }
      },
    });
  };

  // Delete Calendar Event
  const promptDeleteCalendarEvent = (event: CalendarEventPayload) => {
    if (!event.id) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'حذف الموعد' : 'Delete Event',
      description: isAr
        ? `هل تريد بالتأكيد حذف "${event.summary}" من التقويم؟`
        : `Delete event "${event.summary}" from Google Calendar?`,
      confirmLabel: isAr ? 'حذف' : 'Delete',
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(event.id!);
          setCalendarEvents((prev) => prev.filter((e) => e.id !== event.id));
          setStatusMessage({
            type: 'success',
            text: isAr ? 'تم حذف الحدث بنجاح.' : 'Event deleted.',
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to delete event' });
        }
      },
    });
  };

  // Drive File Creation
  const handleCreateDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveFileName) return;
    setIsCreatingDriveFile(true);
    setStatusMessage(null);
    try {
      const created = await createDriveFile(newDriveFileName, newDriveFileContent);
      setDriveFiles((prev) => [created, ...prev]);
      setStatusMessage({
        type: 'success',
        text: isAr ? `تم إنشاء الملف "${newDriveFileName}" في Drive!` : `File "${newDriveFileName}" created in Drive!`,
      });
      setNewDriveFileName('');
      setNewDriveFileContent('');
      setShowDriveCreate(false);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create Drive file' });
    } finally {
      setIsCreatingDriveFile(false);
    }
  };

  // Docs Creation
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;
    setIsCreatingDoc(true);
    setStatusMessage(null);
    try {
      const doc = await createGoogleDoc(docTitle, docContent);
      setCreatedDocs((prev) => [{ id: doc.documentId, title: docTitle }, ...prev]);
      setStatusMessage({
        type: 'success',
        text: isAr ? `تم إنشاء مستند Google Docs: "${docTitle}"` : `Google Doc created: "${docTitle}"`,
      });
      setDocTitle('');
      setDocContent('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create Google Doc' });
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Sheets Creation
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetTitle) return;
    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const headersArray = sheetHeaders.split(',').map((h) => h.trim()).filter(Boolean);
      const sheet = await createGoogleSpreadsheet(sheetTitle, headersArray);
      if (sheetRowData) {
        const rowArray = sheetRowData.split(',').map((r) => r.trim()).filter(Boolean);
        await appendSheetRow(sheet.spreadsheetId, 'Sheet1!A2', rowArray);
      }
      setCreatedSheets((prev) => [
        { id: sheet.spreadsheetId, title: sheetTitle, url: sheet.spreadsheetUrl },
        ...prev,
      ]);
      setStatusMessage({
        type: 'success',
        text: isAr ? `تم إنشاء جدول Google Sheets: "${sheetTitle}"` : `Google Sheet created: "${sheetTitle}"`,
      });
      setSheetTitle('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create Google Sheet' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Slides Creation
  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle) return;
    setIsCreatingSlide(true);
    setStatusMessage(null);
    try {
      const pres = await createGooglePresentation(slideTitle);
      setCreatedSlides((prev) => [{ id: pres.presentationId, title: slideTitle }, ...prev]);
      setStatusMessage({
        type: 'success',
        text: isAr ? `تم إنشاء عرض Slides: "${slideTitle}"` : `Google Slides created: "${slideTitle}"`,
      });
      setSlideTitle('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create Presentation' });
    } finally {
      setIsCreatingSlide(false);
    }
  };

  // Forms Creation
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;
    setIsCreatingForm(true);
    setStatusMessage(null);
    try {
      const form = await createGoogleForm(formTitle, formDocTitle);
      setCreatedForms((prev) => [
        { id: form.formId, title: formTitle, url: form.responderUri },
        ...prev,
      ]);
      setStatusMessage({
        type: 'success',
        text: isAr ? `تم إنشاء نموذج Google Forms: "${formTitle}"` : `Google Form created: "${formTitle}"`,
      });
      setFormTitle('');
      setFormDocTitle('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create Google Form' });
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Google Tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setIsLoadingTasks(true);
    try {
      const created = await createGoogleTask({
        title: newTaskTitle,
        notes: newTaskNotes,
        status: 'needsAction',
      });
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setStatusMessage({
        type: 'success',
        text: isAr ? 'تمت إضافة المهمة بنجاح!' : 'Task added successfully!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add task' });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleToggleTask = async (task: GoogleTaskItem) => {
    if (!task.id) return;
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    try {
      const updated = await updateGoogleTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update task' });
    }
  };

  const handleDeleteTask = async (taskId?: string) => {
    if (!taskId) return;
    try {
      await deleteGoogleTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete task' });
    }
  };

  const tabsConfig = [
    { id: 'gmail' as const, labelAr: 'البريد (Gmail)', labelEn: 'Gmail', icon: Mail, color: 'text-rose-400' },
    { id: 'calendar' as const, labelAr: 'التقويم (Calendar)', labelEn: 'Calendar', icon: CalendarIcon, color: 'text-blue-400' },
    { id: 'drive' as const, labelAr: 'الملفات (Drive)', labelEn: 'Drive', icon: HardDrive, color: 'text-amber-400' },
    { id: 'docs_suite' as const, labelAr: 'المستندات (Docs & Suite)', labelEn: 'Docs & Suite', icon: FileText, color: 'text-sky-400' },
    { id: 'tasks' as const, labelAr: 'المهام (Tasks)', labelEn: 'Tasks', icon: CheckSquare, color: 'text-emerald-400' },
    { id: 'contacts' as const, labelAr: 'جهات الاتصال (Contacts)', labelEn: 'Contacts', icon: Users, color: 'text-indigo-400' },
  ];

  // Filter Drive Files
  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  // Filter Contacts
  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(contactsSearch.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(contactsSearch.toLowerCase())
  );

  return (
    <div className="w-full space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Dynamic Status Toast Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn transition-all shadow-md text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles size={16} className="text-[var(--accent)] flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="px-2 py-0.5 rounded text-[11px] hover:bg-white/10 opacity-75 hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modern, Clean App Switcher (Distraction-Free) */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md shadow-[var(--accent-glow)]'
                    : 'hover:bg-[var(--surface-hover)] text-[var(--text)]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[var(--accent-contrast)]' : tab.color} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
          title={isAr ? 'تحديث ومزامنة الأذونات' : 'Sync Workspace'}
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin text-[var(--accent)]' : ''} />
          <span className="hidden md:inline">{isAr ? 'مزامنة' : 'Sync'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. GMAIL WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'gmail' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Sub-Switch: Compose vs Inbox */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setGmailSubTab('send')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  gmailSubTab === 'send'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Send size={13} />
                <span>{isAr ? 'صياغة بريد جديد' : 'Compose'}</span>
              </button>
              <button
                type="button"
                onClick={() => setGmailSubTab('inbox')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  gmailSubTab === 'inbox'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Inbox size={13} />
                <span>{isAr ? 'صندوق الوارد' : 'Inbox'}</span>
              </button>
            </div>

            {gmailSubTab === 'inbox' && (
              <button
                type="button"
                onClick={loadInbox}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} className={isLoadingInbox ? 'animate-spin text-[var(--accent)]' : ''} />
                <span>{isAr ? 'تحديث الوارد' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {/* Gmail Composer View */}
          {gmailSubTab === 'send' ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'المستلم (To):' : 'Recipient (To):'}
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'الموضوع (Subject):' : 'Subject:'}
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={isAr ? 'عنوان البريد...' : 'Email subject...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'نص الرسالة:' : 'Message Content:'}
                </label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your email message...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={promptSendEmail}
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--accent-glow)] transition cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} className={isSendingEmail ? 'animate-spin' : ''} />
                  <span>{isSendingEmail ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال الرسالة' : 'Send Email')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Gmail Inbox View */
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-2.5">
              {isLoadingInbox ? (
                <div className="py-10 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                  <span>{isAr ? 'جاري تحميل رسائل الوارد...' : 'Loading inbox messages...'}</span>
                </div>
              ) : inboxMessages.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--muted)]">
                  {isAr ? 'لا توجد رسائل جديدة أو اضغط على تحديث الوارد.' : 'No messages found. Click refresh.'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {inboxMessages.map((msg) => (
                    <div key={msg.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text)] truncate">{msg.subject}</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] flex-shrink-0">{msg.date}</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] line-clamp-2 leading-relaxed">{msg.snippet}</p>
                      <span className="text-[10px] text-[var(--accent)] font-mono block truncate">{msg.from}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CALENDAR WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setCalendarSubTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  calendarSubTab === 'upcoming'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Clock size={13} />
                <span>{isAr ? 'المواعيد القادمة' : 'Upcoming'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarSubTab('create')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  calendarSubTab === 'create'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Plus size={13} />
                <span>{isAr ? 'جدولة موعد جديد' : 'New Event'}</span>
              </button>
            </div>

            {calendarSubTab === 'upcoming' && (
              <button
                type="button"
                onClick={loadCalendar}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} className={isLoadingCalendar ? 'animate-spin text-[var(--accent)]' : ''} />
                <span>{isAr ? 'تحديث' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {calendarSubTab === 'create' ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">{isAr ? 'عنوان الموعد / اللقاء:' : 'Event Title:'}</label>
                <input
                  type="text"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder={isAr ? 'مثال: مراجعة الخطة التنفيذية...' : 'e.g. Executive Sync...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">{isAr ? 'وقت البدء:' : 'Start:'}</label>
                  <input
                    type="datetime-local"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">{isAr ? 'وقت الانتهاء:' : 'End:'}</label>
                  <input
                    type="datetime-local"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">{isAr ? 'ملاحظات / جدول الأعمال (اختياري):' : 'Notes (optional):'}</label>
                <input
                  type="text"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional details...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={promptCreateCalendarEvent}
                  disabled={isCreatingEvent}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--accent-glow)] transition cursor-pointer disabled:opacity-50"
                >
                  <CalendarIcon size={14} />
                  <span>{isCreatingEvent ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ في التقويم' : 'Save Event')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Calendar List */
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-2">
              {isLoadingCalendar ? (
                <div className="py-10 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                  <span>{isAr ? 'جاري جلب المواعيد...' : 'Loading calendar events...'}</span>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--muted)]">
                  {isAr ? 'لا توجد مواعيد قادمة مجدولة.' : 'No upcoming events.'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {calendarEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="text-xs sm:text-sm font-bold text-[var(--text)] block truncate">{evt.summary}</strong>
                        <span className="text-[11px] text-[var(--muted)] font-mono block mt-0.5">
                          {('dateTime' in evt.start ? new Date(evt.start.dateTime).toLocaleString(isAr ? 'ar' : 'en') : evt.start.date)}
                        </span>
                      </div>
                      {evt.id && (
                        <button
                          type="button"
                          onClick={() => promptDeleteCalendarEvent(evt)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DRIVE WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'drive' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Drive Search Bar & Create Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder={isAr ? 'بحث في ملفات Drive...' : 'Search Drive files...'}
                className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowDriveCreate(!showDriveCreate)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                showDriveCreate
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Plus size={14} />
              <span>{isAr ? 'ملف جديد' : 'New File'}</span>
            </button>
            <button
              type="button"
              onClick={loadDrive}
              className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer flex-shrink-0"
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw size={14} className={isLoadingDrive ? 'animate-spin text-[var(--accent)]' : ''} />
            </button>
          </div>

          {/* Quick Create Drive Form */}
          {showDriveCreate && (
            <form onSubmit={handleCreateDriveFile} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 animate-fadeIn">
              <input
                type="text"
                value={newDriveFileName}
                onChange={(e) => setNewDriveFileName(e.target.value)}
                placeholder={isAr ? 'اسم الملف (مثال: memo.txt)...' : 'File name (e.g. memo.txt)...'}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
              />
              <textarea
                rows={2}
                value={newDriveFileContent}
                onChange={(e) => setNewDriveFileContent(e.target.value)}
                placeholder={isAr ? 'محتوى الملف...' : 'File text content...'}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveCreate(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDriveFile || !newDriveFileName}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold transition disabled:opacity-50"
                >
                  {isCreatingDriveFile ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ في Drive' : 'Save in Drive')}
                </button>
              </div>
            </form>
          )}

          {/* Drive Files List */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-2">
            {isLoadingDrive ? (
              <div className="py-10 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                <span>{isAr ? 'جاري جلب ملفات Drive...' : 'Loading Drive files...'}</span>
              </div>
            ) : filteredDriveFiles.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--muted)]">
                {isAr ? 'لا توجد ملفات متطابقة.' : 'No files found.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filteredDriveFiles.map((file) => (
                  <div key={file.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-[var(--text)] block truncate">{file.name}</strong>
                      <span className="text-[10px] text-[var(--muted)] font-mono block truncate">{file.mimeType}</span>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--accent-subtle)] text-[var(--accent)] text-[11px] font-semibold flex items-center gap-1 transition flex-shrink-0"
                      >
                        <span>{isAr ? 'فتح' : 'Open'}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DOCS & SUITE WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'docs_suite' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Sub-Switch: Docs, Sheets, Slides, Forms */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setOfficeSubTab('docs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                officeSubTab === 'docs' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <FileText size={13} />
              <span>{isAr ? 'المستندات Docs' : 'Docs'}</span>
            </button>
            <button
              type="button"
              onClick={() => setOfficeSubTab('sheets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                officeSubTab === 'sheets' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Table size={13} />
              <span>{isAr ? 'الجداول Sheets' : 'Sheets'}</span>
            </button>
            <button
              type="button"
              onClick={() => setOfficeSubTab('slides')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                officeSubTab === 'slides' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Presentation size={13} />
              <span>{isAr ? 'العروض Slides' : 'Slides'}</span>
            </button>
            <button
              type="button"
              onClick={() => setOfficeSubTab('forms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                officeSubTab === 'forms' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <FormInput size={13} />
              <span>{isAr ? 'النماذج Forms' : 'Forms'}</span>
            </button>
          </div>

          {/* Sub-Panel: Docs */}
          {officeSubTab === 'docs' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateDoc} className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder={isAr ? 'عنوان المستند الجديد...' : 'Document title...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
                <textarea
                  rows={3}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder={isAr ? 'المحتوى الأولي للمستند...' : 'Initial document content...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingDoc || !docTitle}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isCreatingDoc ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء في Google Docs' : 'Create Google Doc')}
                  </button>
                </div>
              </form>

              {createdDocs.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--muted)]">{isAr ? 'المستندات المنشأة حديثاً:' : 'Recently Created Docs:'}</span>
                  {createdDocs.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text)] truncate">{d.title}</span>
                      <a
                        href={`https://docs.google.com/document/d/${d.id}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>{isAr ? 'فتح' : 'Open'}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Panel: Sheets */}
          {officeSubTab === 'sheets' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateSheet} className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3">
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder={isAr ? 'عنوان جدول البيانات...' : 'Spreadsheet title...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
                <input
                  type="text"
                  value={sheetHeaders}
                  onChange={(e) => setSheetHeaders(e.target.value)}
                  placeholder={isAr ? 'عناوين الأعمدة (مفصولة بفواصل)...' : 'Columns (comma-separated)...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingSheet || !sheetTitle}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isCreatingSheet ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء في Google Sheets' : 'Create Google Sheet')}
                  </button>
                </div>
              </form>

              {createdSheets.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--muted)]">{isAr ? 'الجداول المنشأة حديثاً:' : 'Recently Created Sheets:'}</span>
                  {createdSheets.map((s) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text)] truncate">{s.title}</span>
                      <a
                        href={s.url || `https://docs.google.com/spreadsheets/d/${s.id}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>{isAr ? 'فتح' : 'Open'}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Panel: Slides */}
          {officeSubTab === 'slides' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateSlide} className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3">
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder={isAr ? 'عنوان العرض التقديمي...' : 'Presentation title...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingSlide || !slideTitle}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isCreatingSlide ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء في Google Slides' : 'Create Google Slide')}
                  </button>
                </div>
              </form>

              {createdSlides.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--muted)]">{isAr ? 'العروض المنشأة حديثاً:' : 'Recently Created Slides:'}</span>
                  {createdSlides.map((sl) => (
                    <div key={sl.id} className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text)] truncate">{sl.title}</span>
                      <a
                        href={`https://docs.google.com/presentation/d/${sl.id}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>{isAr ? 'فتح' : 'Open'}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Panel: Forms */}
          {officeSubTab === 'forms' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateForm} className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={isAr ? 'عنوان النموذج / الاستبيان...' : 'Form title...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingForm || !formTitle}
                    className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isCreatingForm ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء في Google Forms' : 'Create Google Form')}
                  </button>
                </div>
              </form>

              {createdForms.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--muted)]">{isAr ? 'النماذج المنشأة حديثاً:' : 'Recently Created Forms:'}</span>
                  {createdForms.map((fm) => (
                    <div key={fm.id} className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text)] truncate">{fm.title}</span>
                      {fm.url && (
                        <a
                          href={fm.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>{isAr ? 'رابط الاستبيان' : 'Open Form'}</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TASKS WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quick Add Task Input */}
          <form onSubmit={handleCreateTask} className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={isAr ? 'أضف مهمة جديدة في Google Tasks...' : 'Add a new Google Task...'}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
            />
            <button
              type="submit"
              disabled={isLoadingTasks || !newTaskTitle}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 flex-shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>{isAr ? 'إضافة' : 'Add'}</span>
            </button>
            <button
              type="button"
              onClick={loadTasks}
              className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer flex-shrink-0"
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw size={14} className={isLoadingTasks ? 'animate-spin text-[var(--accent)]' : ''} />
            </button>
          </form>

          {/* Tasks List */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-1">
            {isLoadingTasks ? (
              <div className="py-10 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                <span>{isAr ? 'جاري جلب المهام...' : 'Loading tasks...'}</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--muted)]">
                {isAr ? 'لا توجد مهام مسجلة.' : 'No tasks recorded.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div key={task.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-[var(--border)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {isCompleted && <Check size={12} />}
                        </button>
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCompleted ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-lg text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CONTACTS WORKSPACE */}
      {/* ======================================================== */}
      {activeTab === 'contacts' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={contactsSearch}
                onChange={(e) => setContactsSearch(e.target.value)}
                placeholder={isAr ? 'بحث في جهات الاتصال...' : 'Search contacts...'}
                className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <button
              type="button"
              onClick={loadContacts}
              className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer flex-shrink-0"
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw size={14} className={isLoadingContacts ? 'animate-spin text-[var(--accent)]' : ''} />
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
            {isLoadingContacts ? (
              <div className="py-10 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                <span>{isAr ? 'جاري جلب جهات الاتصال...' : 'Loading contacts...'}</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--muted)]">
                {isAr ? 'لا توجد جهات اتصال مطابقة.' : 'No contacts found.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredContacts.map((contact, idx) => (
                  <div key={contact.resourceName || idx} className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2.5">
                    {contact.photoUrl ? (
                      <img
                        src={contact.photoUrl}
                        alt={contact.name || 'Contact'}
                        className="w-8 h-8 rounded-xl object-cover border border-[var(--border)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] font-bold flex items-center justify-center text-xs">
                        {contact.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-[var(--text)] truncate">{contact.name}</strong>
                      {contact.email && <span className="text-[10px] text-[var(--muted)] block truncate">{contact.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-2xl space-y-3.5">
            <h4 className="text-sm font-black text-[var(--text)]">{confirmModal.title}</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{confirmModal.description}</p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-bold transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-md transition cursor-pointer"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
