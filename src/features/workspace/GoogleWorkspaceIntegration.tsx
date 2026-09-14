import { useState, useEffect } from 'react';
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
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Calendar,
  HardDrive,
  Users,
  Presentation,
  FormInput,
  Clock,
  Inbox,
  UserCheck,
  Share2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Language } from '../../core/domain';
import {
  initWorkspaceAuth,
  googleSignIn,
  googleSignOut,
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

type WorkspaceTab =
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'docs'
  | 'sheets'
  | 'slides'
  | 'forms'
  | 'tasks'
  | 'contacts';

export function GoogleWorkspaceIntegration({ language }: GoogleWorkspaceIntegrationProps) {
  const isAr = language === 'ar';
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('gmail');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Destructive / Action Confirmation Modal State
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
  const [newDriveFileName, setNewDriveFileName] = useState('');
  const [newDriveFileContent, setNewDriveFileContent] = useState('');
  const [isCreatingDriveFile, setIsCreatingDriveFile] = useState(false);

  // 4. Docs State
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [createdDocs, setCreatedDocs] = useState<Array<{ id: string; title: string }>>([]);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // 5. Sheets State
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetHeaders, setSheetHeaders] = useState('Task, Priority, Status, Assignee');
  const [sheetRowData, setSheetRowData] = useState('Build Agent Core, High, Completed, ADEM');
  const [createdSheets, setCreatedSheets] = useState<Array<{ id: string; title: string; url?: string }>>([]);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // 6. Slides State
  const [slideTitle, setSlideTitle] = useState('');
  const [createdSlides, setCreatedSlides] = useState<Array<{ id: string; title: string }>>([]);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);

  // 7. Forms State
  const [formTitle, setFormTitle] = useState('');
  const [formDocTitle, setFormDocTitle] = useState('');
  const [createdForms, setCreatedForms] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // 8. Tasks State
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // 9. Contacts State
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch contextual data when tabs switch
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'tasks') loadTasks();
    if (activeTab === 'calendar') loadCalendar();
    if (activeTab === 'drive') loadDrive();
    if (activeTab === 'contacts') loadContacts();
    if (activeTab === 'gmail' && gmailSubTab === 'inbox') loadInbox();
  }, [token, activeTab, gmailSubTab]);

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await getGoogleTasks();
      setTasks(res.items || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch Google Tasks' });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await getCalendarEvents();
      setCalendarEvents(res.items || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch Calendar events' });
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const loadDrive = async () => {
    setIsLoadingDrive(true);
    try {
      const res = await getDriveFiles();
      setDriveFiles(res.files || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch Drive files' });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await getGoogleContacts();
      setContacts(res.connections || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch Contacts' });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const loadInbox = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await getGmailMessages(10);
      setInboxMessages(res.messages || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch Inbox' });
    } finally {
      setIsLoadingInbox(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setStatusMessage({
          type: 'success',
          text: isAr ? 'تم ربط جميع خدمات Google Workspace بنجاح!' : 'All Google Workspace services connected successfully!',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || (isAr ? 'فشل تسجيل الدخول بواسطة Google' : 'Google sign-in failed'),
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleSignOut();
    setUser(null);
    setToken(null);
    setStatusMessage({
      type: 'success',
      text: isAr ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.',
    });
  };

  // Gmail Send
  const promptSendEmail = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى ملء جميع حقول البريد.' : 'Please fill all email fields.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إرسال البريد الإلكتروني' : 'Confirm Send Email',
      description: isAr
        ? `هل أنت متأكد من رغبتك في إرسال البريد الإلكتروني إلى "${emailTo}" بعنوان "${emailSubject}" من خلال حسابك؟`
        : `Are you sure you want to send this email to "${emailTo}" with subject "${emailSubject}" on your behalf?`,
      confirmLabel: isAr ? 'إرسال الآن' : 'Send Now',
      onConfirm: async () => {
        setIsSendingEmail(true);
        setStatusMessage(null);
        try {
          await sendGmailMessage({ to: emailTo, subject: emailSubject, body: emailBody });
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إرسال البريد بنجاح إلى ${emailTo}!` : `Email successfully sent to ${emailTo}!`,
          });
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to send email' });
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
      title: isAr ? 'تأكيد جدولة الحدث في Google Calendar' : 'Confirm Calendar Event',
      description: isAr
        ? `سيتم جدولة الحدث "${eventSummary}" في تقويم Google الخاص بك.`
        : `Event "${eventSummary}" will be added to your Google Calendar.`,
      confirmLabel: isAr ? 'جدولة الحدث' : 'Schedule Event',
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
            text: isAr ? `تمت جدولة الحدث "${eventSummary}" بنجاح!` : `Event "${eventSummary}" scheduled!`,
          });
          setEventSummary('');
          setEventDescription('');
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
      title: isAr ? 'تأكيد حذف الحدث' : 'Confirm Event Deletion',
      description: isAr
        ? `هل أنت متأكد من رغبتك في حذف الحدث "${event.summary}" من تقويم Google؟`
        : `Are you sure you want to delete "${event.summary}" from Google Calendar?`,
      confirmLabel: isAr ? 'حذف الحدث' : 'Delete Event',
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(event.id!);
          setCalendarEvents((prev) => prev.filter((e) => e.id !== event.id));
          setStatusMessage({
            type: 'success',
            text: isAr ? 'تم حذف الحدث من التقويم بنجاح.' : 'Event deleted successfully.',
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to delete event' });
        }
      },
    });
  };

  // Drive File Creation
  const promptCreateDriveFile = () => {
    if (!newDriveFileName) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى كتابة اسم الملف.' : 'Please enter file name.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إنشاء ملف في Google Drive' : 'Confirm Google Drive File Creation',
      description: isAr
        ? `سيتم حفظ وإنشاء الملف "${newDriveFileName}" مباشرة في حساب Google Drive الخاص بك.`
        : `File "${newDriveFileName}" will be saved to your Google Drive account.`,
      confirmLabel: isAr ? 'حفظ الملف' : 'Save File',
      onConfirm: async () => {
        setIsCreatingDriveFile(true);
        setStatusMessage(null);
        try {
          const file = await createDriveFile(newDriveFileName, newDriveFileContent);
          setDriveFiles((prev) => [file, ...prev]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم حفظ الملف "${newDriveFileName}" في Drive!` : `File "${newDriveFileName}" saved to Drive!`,
          });
          setNewDriveFileName('');
          setNewDriveFileContent('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to save file' });
        } finally {
          setIsCreatingDriveFile(false);
        }
      },
    });
  };

  // Create Google Doc
  const promptCreateDoc = () => {
    if (!docTitle) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى كتابة عنوان المستند.' : 'Please enter a document title.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إنشاء مستند Google Docs جديد' : 'Confirm Google Doc Creation',
      description: isAr
        ? `سيتم إنشاء مستند Google Doc جديد بعنوان "${docTitle}" وإدراجه في حساب Google الخاص بك.`
        : `A new Google Doc named "${docTitle}" will be created in your Google account.`,
      confirmLabel: isAr ? 'إنشاء المستند' : 'Create Doc',
      onConfirm: async () => {
        setIsCreatingDoc(true);
        setStatusMessage(null);
        try {
          const doc = await createGoogleDoc(docTitle, docContent);
          setCreatedDocs((prev) => [{ id: doc.documentId, title: docTitle }, ...prev]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إنشاء المستند "${docTitle}" بنجاح!` : `Document "${docTitle}" created successfully!`,
          });
          setDocTitle('');
          setDocContent('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to create doc' });
        } finally {
          setIsCreatingDoc(false);
        }
      },
    });
  };

  // Create Google Sheet
  const promptCreateSheet = () => {
    if (!sheetTitle) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى كتابة عنوان جدول البيانات.' : 'Please enter a spreadsheet title.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إنشاء جدول Google Sheets جديد' : 'Confirm Google Sheet Creation',
      description: isAr
        ? `سيتم إنشاء جدول بيانات جديد بعنوان "${sheetTitle}" في حسابك مع الصفوف المحددة.`
        : `A new Google Spreadsheet named "${sheetTitle}" will be created in your account.`,
      confirmLabel: isAr ? 'إنشاء الجدول' : 'Create Sheet',
      onConfirm: async () => {
        setIsCreatingSheet(true);
        setStatusMessage(null);
        try {
          const headers = sheetHeaders.split(',').map((h) => h.trim()).filter(Boolean);
          const sheet = await createGoogleSpreadsheet(sheetTitle, headers);
          if (sheetRowData && sheet.spreadsheetId) {
            const rowValues = sheetRowData.split(',').map((r) => r.trim()).filter(Boolean);
            await appendSheetRow(sheet.spreadsheetId, 'Sheet1!A2', rowValues);
          }
          setCreatedSheets((prev) => [
            {
              id: sheet.spreadsheetId,
              title: sheetTitle,
              url: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`,
            },
            ...prev,
          ]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إنشاء جدول Google Sheets "${sheetTitle}" بنجاح!` : `Spreadsheet "${sheetTitle}" created successfully!`,
          });
          setSheetTitle('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to create spreadsheet' });
        } finally {
          setIsCreatingSheet(false);
        }
      },
    });
  };

  // Create Slides
  const promptCreateSlide = () => {
    if (!slideTitle) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى كتابة عنوان العرض التقديمي.' : 'Please enter presentation title.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إنشاء عرض Google Slides جديد' : 'Confirm Presentation Creation',
      description: isAr
        ? `سيتم إنشاء عرض تقديمي جديد بعنوان "${slideTitle}" في حساب Google Slides الخاص بك.`
        : `A new presentation named "${slideTitle}" will be created in your Google Slides.`,
      confirmLabel: isAr ? 'إنشاء العرض' : 'Create Slides',
      onConfirm: async () => {
        setIsCreatingSlide(true);
        setStatusMessage(null);
        try {
          const res = await createGooglePresentation(slideTitle);
          setCreatedSlides((prev) => [{ id: res.presentationId, title: slideTitle }, ...prev]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إنشاء العرض التقديمي "${slideTitle}" بنجاح!` : `Presentation "${slideTitle}" created successfully!`,
          });
          setSlideTitle('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to create presentation' });
        } finally {
          setIsCreatingSlide(false);
        }
      },
    });
  };

  // Create Forms
  const promptCreateForm = () => {
    if (!formTitle) {
      setStatusMessage({ type: 'error', text: isAr ? 'يرجى كتابة عنوان النموذج أو الاستبيان.' : 'Please enter form title.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد إنشاء استبيان Google Forms جديد' : 'Confirm Form Creation',
      description: isAr
        ? `سيتم إنشاء نموذج واستبيان جديد بعنوان "${formTitle}" في حساب Google Forms الخاص بك.`
        : `A new Google Form named "${formTitle}" will be created in your account.`,
      confirmLabel: isAr ? 'إنشاء الاستبيان' : 'Create Form',
      onConfirm: async () => {
        setIsCreatingForm(true);
        setStatusMessage(null);
        try {
          const res = await createGoogleForm(formTitle, formDocTitle);
          setCreatedForms((prev) => [{ id: res.formId, title: formTitle, url: res.responderUri }, ...prev]);
          setStatusMessage({
            type: 'success',
            text: isAr ? `تم إنشاء نموذج Google Forms "${formTitle}" بنجاح!` : `Google Form "${formTitle}" created successfully!`,
          });
          setFormTitle('');
          setFormDocTitle('');
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to create form' });
        } finally {
          setIsCreatingForm(false);
        }
      },
    });
  };

  // Tasks actions
  const handleCreateTask = async () => {
    if (!newTaskTitle) return;
    try {
      const task = await createGoogleTask({ title: newTaskTitle, notes: newTaskNotes });
      setTasks((prev) => [task, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setStatusMessage({
        type: 'success',
        text: isAr ? 'تمت إضافة المهمة إلى Google Tasks بنجاح!' : 'Task added to Google Tasks!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create task' });
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTaskItem) => {
    if (!task.id) return;
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    try {
      const updated = await updateGoogleTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: updated.status } : t)));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update task' });
    }
  };

  const promptDeleteTask = (task: GoogleTaskItem) => {
    if (!task.id) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تأكيد حذف المهمة' : 'Confirm Task Deletion',
      description: isAr
        ? `هل تريد بالتأكيد حذف المهمة "${task.title}" من حساب Google Tasks الخاص بك؟`
        : `Are you sure you want to delete "${task.title}" from Google Tasks?`,
      confirmLabel: isAr ? 'حذف المهمة' : 'Delete Task',
      onConfirm: async () => {
        try {
          await deleteGoogleTask(task.id!);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setStatusMessage({
            type: 'success',
            text: isAr ? 'تم حذف المهمة بنجاح.' : 'Task deleted successfully.',
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err.message || 'Failed to delete task' });
        }
      },
    });
  };

  const tabsConfig: Array<{ id: WorkspaceTab; labelAr: string; labelEn: string; icon: any; color: string }> = [
    { id: 'gmail', labelAr: 'بريد Gmail', labelEn: 'Gmail', icon: Mail, color: 'text-red-400' },
    { id: 'calendar', labelAr: 'تقويم Calendar', labelEn: 'Calendar', icon: Calendar, color: 'text-blue-400' },
    { id: 'drive', labelAr: 'ملفات Drive', labelEn: 'Drive', icon: HardDrive, color: 'text-amber-400' },
    { id: 'docs', labelAr: 'مستندات Docs', labelEn: 'Docs', icon: FileText, color: 'text-sky-400' },
    { id: 'sheets', labelAr: 'جداول Sheets', labelEn: 'Sheets', icon: Table, color: 'text-emerald-400' },
    { id: 'slides', labelAr: 'عروض Slides', labelEn: 'Slides', icon: Presentation, color: 'text-amber-500' },
    { id: 'forms', labelAr: 'نماذج Forms', labelEn: 'Forms', icon: FormInput, color: 'text-purple-400' },
    { id: 'tasks', labelAr: 'مهام Tasks', labelEn: 'Tasks', icon: CheckSquare, color: 'text-teal-400' },
    { id: 'contacts', labelAr: 'جهات الاتصال Contacts', labelEn: 'Contacts', icon: Users, color: 'text-indigo-400' },
  ];

  return (
    <div className="mt-8 bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {/* Header & Auth Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={20} />
              {isAr ? 'مركز ربط خدمات وتطبيقات Google الشامل' : 'Google Full Suite & Workspace Hub'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr
              ? 'وصول وتحكم كامل ومباشر بـ Gmail، Calendar، Drive، Docs، Sheets، Slides، Forms، Tasks، و Contacts.'
              : 'Full direct integration with Gmail, Calendar, Drive, Docs, Sheets, Slides, Forms, Tasks, and Contacts.'}
          </p>
        </div>

        {/* User Auth Status / Sign-in */}
        {user ? (
          <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-2.5 px-4">
            <img
              src={user.photoURL || 'https://via.placeholder.com/40'}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-emerald-400 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <div className="text-xs font-bold text-emerald-200">{user.displayName || 'Connected User'}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-lg flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-800 font-semibold border border-slate-300"
          >
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-medium">
              {isLoggingIn ? (isAr ? 'جارِ الربط...' : 'Connecting...') : (isAr ? 'تسجيل الدخول وربط الحساب' : 'Connect Google Suite')}
            </span>
          </button>
        )}
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`mt-4 p-3.5 rounded-2xl flex items-center gap-2 text-xs sm:text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/50 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
        {tabsConfig.map(({ id, labelAr, labelEn, icon: Icon, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === id
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <Icon size={15} className={color} />
            <span>{isAr ? labelAr : labelEn}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="mt-5">
        {!token ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <ShieldCheck size={36} className="mx-auto text-emerald-400 mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-white mb-1">
              {isAr ? 'يتطلب ربط تطبيقات Google تسجيل الدخول' : 'Google Account Connection Required'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {isAr
                ? 'سجل دخولك بأمان للوصول إلى أدوات إرسال وقراءة البريد، تنظيم التقويم، إدارة ملفات Drive، إنشاء المستندات والجداول والعروض والاستبيانات ومزامنة المهام وجهات الاتصال.'
                : 'Sign in securely to send/read Gmail, manage Calendar events, browse Drive files, create Docs/Sheets/Slides/Forms, and sync Tasks & Contacts.'}
            </p>
            <button
              type="button"
              onClick={handleLogin}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer"
            >
              {isAr ? 'ربط الحساب الآن' : 'Connect Google Account'}
            </button>
          </div>
        ) : (
          <div>
            {/* 1. GMAIL TAB */}
            {activeTab === 'gmail' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setGmailSubTab('send')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      gmailSubTab === 'send' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Send size={13} />
                    <span>{isAr ? 'إرسال بريد جديد' : 'Compose & Send'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGmailSubTab('inbox')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      gmailSubTab === 'inbox' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Inbox size={13} />
                    <span>{isAr ? 'صندوق الوارد (Read)' : 'Inbox Messages'}</span>
                  </button>
                </div>

                {gmailSubTab === 'send' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isAr ? 'إلى (المستلم):' : 'Recipient Email (To):'}
                      </label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isAr ? 'الموضوع:' : 'Subject:'}
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={isAr ? 'عنوان الرسالة...' : 'Email Subject...'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isAr ? 'نص الرسالة:' : 'Message Body:'}
                      </label>
                      <textarea
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder={isAr ? 'اكتب رسالتك...' : 'Write message content...'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={promptSendEmail}
                        disabled={isSendingEmail}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg"
                      >
                        <Send size={15} />
                        <span>{isSendingEmail ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إرسال عبر Gmail' : 'Send via Gmail')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300">{isAr ? 'أحدث الرسائل المستلمة:' : 'Latest Inbox Messages:'}</h4>
                      <button
                        type="button"
                        onClick={loadInbox}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title={isAr ? 'تحديث البريد' : 'Refresh Inbox'}
                      >
                        <RefreshCw size={14} className={isLoadingInbox ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {isLoadingInbox ? (
                      <div className="text-center py-6 text-xs text-slate-400">{isAr ? 'جارِ قراءة البريد...' : 'Fetching emails...'}</div>
                    ) : inboxMessages.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">{isAr ? 'لا توجد رسائل حديثة.' : 'No recent emails found.'}</div>
                    ) : (
                      <div className="space-y-2">
                        {inboxMessages.map((msg) => (
                          <div key={msg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-red-300 truncate max-w-[200px]">{msg.from}</span>
                              <span className="text-[10px] text-slate-500">{msg.date}</span>
                            </div>
                            <div className="text-xs font-bold text-white">{msg.subject}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-2">{msg.snippet}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. CALENDAR TAB */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-blue-300">{isAr ? 'جدولة موعد / حدث جديد في Calendar' : 'Schedule New Event'}</h4>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'عنوان الحدث:' : 'Event Title:'}</label>
                    <input
                      type="text"
                      value={eventSummary}
                      onChange={(e) => setEventSummary(e.target.value)}
                      placeholder={isAr ? 'اجتماع مراجعة خارطة الطريق...' : 'Roadmap Sync Meeting...'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'وقت البدء:' : 'Start Time:'}</label>
                      <input
                        type="datetime-local"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'وقت الانتهاء:' : 'End Time:'}</label>
                      <input
                        type="datetime-local"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'الوصف (اختياري):' : 'Description (Optional):'}</label>
                    <input
                      type="text"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder={isAr ? 'تفاصيل جدول الأعمال والروابط...' : 'Agenda details...'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={promptCreateCalendarEvent}
                      disabled={isCreatingEvent}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      <Calendar size={14} />
                      <span>{isCreatingEvent ? (isAr ? 'جارِ الحفظ...' : 'Scheduling...') : (isAr ? 'إضافة إلى Calendar' : 'Schedule Event')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">{isAr ? 'الأحداث القادمة في التقويم:' : 'Upcoming Events:'}</h4>
                    <button
                      type="button"
                      onClick={loadCalendar}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title={isAr ? 'تحديث التقويم' : 'Refresh Events'}
                    >
                      <RefreshCw size={14} className={isLoadingCalendar ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {isLoadingCalendar ? (
                    <div className="text-center py-6 text-xs text-slate-400">{isAr ? 'جارِ جلب الأحداث...' : 'Loading events...'}</div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">{isAr ? 'لا توجد أحداث قادمة.' : 'No upcoming events.'}</div>
                  ) : (
                    calendarEvents.map((evt) => (
                      <div key={evt.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-white">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-blue-300">{evt.summary}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            <span>{'dateTime' in evt.start ? new Date(evt.start.dateTime).toLocaleString() : evt.start.date}</span>
                          </div>
                          {evt.description && <div className="text-[10px] text-slate-500">{evt.description}</div>}
                        </div>

                        <button
                          type="button"
                          onClick={() => promptDeleteCalendarEvent(evt)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title={isAr ? 'حذف الحدث' : 'Delete Event'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. DRIVE TAB */}
            {activeTab === 'drive' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300">{isAr ? 'إنشاء وحفظ ملف في Google Drive' : 'Save File to Google Drive'}</h4>
                  <input
                    type="text"
                    value={newDriveFileName}
                    onChange={(e) => setNewDriveFileName(e.target.value)}
                    placeholder={isAr ? 'اسم الملف (مثال: memo.txt)...' : 'Filename (e.g., meeting_notes.txt)...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                  <textarea
                    rows={3}
                    value={newDriveFileContent}
                    onChange={(e) => setNewDriveFileContent(e.target.value)}
                    placeholder={isAr ? 'محتوى الملف...' : 'File contents...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={promptCreateDriveFile}
                      disabled={isCreatingDriveFile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      <HardDrive size={14} />
                      <span>{isCreatingDriveFile ? (isAr ? 'جارِ الحفظ...' : 'Saving...') : (isAr ? 'حفظ في Drive' : 'Save to Drive')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">{isAr ? 'ملفاتك على Google Drive:' : 'Drive Files:'}</h4>
                    <button
                      type="button"
                      onClick={loadDrive}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title={isAr ? 'تحديث الملفات' : 'Refresh Files'}
                    >
                      <RefreshCw size={14} className={isLoadingDrive ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {isLoadingDrive ? (
                    <div className="text-center py-6 text-xs text-slate-400">{isAr ? 'جارِ تصفح الملفات...' : 'Browsing files...'}</div>
                  ) : driveFiles.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">{isAr ? 'لا توجد ملفات حديثة.' : 'No files found.'}</div>
                  ) : (
                    driveFiles.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium text-white">{f.name}</div>
                          <div className="text-[10px] text-slate-500">{f.mimeType}</div>
                        </div>
                        {f.webViewLink && (
                          <a
                            href={f.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                          >
                            <span>{isAr ? 'عرض' : 'View'}</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. DOCS TAB */}
            {activeTab === 'docs' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'عنوان المستند الجديد:' : 'New Document Title:'}
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder={isAr ? 'خطة المشروع السنوية...' : 'Project Strategic Plan...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-sky-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'المحتوى الأولي للمستند:' : 'Initial Content:'}
                  </label>
                  <textarea
                    rows={4}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder={isAr ? 'اكتب الفقرات أو النقاط التي تريد تضمينها في المستند...' : 'Enter initial text content for the Google Doc...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-sky-400 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={promptCreateDoc}
                    disabled={isCreatingDoc}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg"
                  >
                    <Plus size={15} />
                    <span>{isCreatingDoc ? (isAr ? 'جارِ الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء مستند Google Docs' : 'Create Google Doc')}</span>
                  </button>
                </div>

                {createdDocs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">{isAr ? 'المستندات المنشأة حديثاً:' : 'Recently Created Docs:'}</h4>
                    <div className="space-y-2">
                      {createdDocs.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs text-white font-medium">{d.title}</span>
                          <a
                            href={`https://docs.google.com/document/d/${d.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                          >
                            <span>{isAr ? 'فتح في Google Docs' : 'Open in Docs'}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. SHEETS TAB */}
            {activeTab === 'sheets' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'عنوان جدول البيانات:' : 'Spreadsheet Title:'}
                  </label>
                  <input
                    type="text"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    placeholder={isAr ? 'جدول الميزانية والمصروفات...' : 'Budget & Expenses Tracker...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'عناوين الأعمدة (مفصولة بفاصلة):' : 'Column Headers (Comma-separated):'}
                    </label>
                    <input
                      type="text"
                      value={sheetHeaders}
                      onChange={(e) => setSheetHeaders(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'بيانات الصف الأول (مفصولة بفاصلة):' : 'First Row Values (Comma-separated):'}
                    </label>
                    <input
                      type="text"
                      value={sheetRowData}
                      onChange={(e) => setSheetRowData(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-emerald-400 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={promptCreateSheet}
                    disabled={isCreatingSheet}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg"
                  >
                    <Table size={15} />
                    <span>{isCreatingSheet ? (isAr ? 'جارِ الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء جدول Google Sheets' : 'Create Google Sheet')}</span>
                  </button>
                </div>

                {createdSheets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">{isAr ? 'الجداول المنشأة حديثاً:' : 'Recently Created Sheets:'}</h4>
                    <div className="space-y-2">
                      {createdSheets.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs text-white font-medium">{s.title}</span>
                          <a
                            href={s.url || `https://docs.google.com/spreadsheets/d/${s.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                          >
                            <span>{isAr ? 'فتح في Google Sheets' : 'Open in Sheets'}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. SLIDES TAB */}
            {activeTab === 'slides' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'عنوان العرض التقديمي (Slides Deck):' : 'Presentation Deck Title:'}
                  </label>
                  <input
                    type="text"
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder={isAr ? 'عرض خطة التوسع والنمو...' : 'Pitch Deck / Growth Strategy...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={promptCreateSlide}
                    disabled={isCreatingSlide}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg"
                  >
                    <Presentation size={15} />
                    <span>{isCreatingSlide ? (isAr ? 'جارِ الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء Google Slides' : 'Create Google Slides')}</span>
                  </button>
                </div>

                {createdSlides.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">{isAr ? 'العروض المنشأة حديثاً:' : 'Recently Created Presentations:'}</h4>
                    <div className="space-y-2">
                      {createdSlides.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs text-white font-medium">{s.title}</span>
                          <a
                            href={`https://docs.google.com/presentation/d/${s.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                          >
                            <span>{isAr ? 'فتح في Google Slides' : 'Open in Slides'}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. FORMS TAB */}
            {activeTab === 'forms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'عنوان الاستبيان أو النموذج:' : 'Form Title:'}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={isAr ? 'استبيان تقييم رضا العملاء...' : 'Customer Feedback Survey...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'اسم ملف النموذج (اختياري):' : 'Document Filename (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={formDocTitle}
                    onChange={(e) => setFormDocTitle(e.target.value)}
                    placeholder={isAr ? 'ملف استبيان 2026...' : 'Survey Form 2026...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-purple-400 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={promptCreateForm}
                    disabled={isCreatingForm}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg"
                  >
                    <FormInput size={15} />
                    <span>{isCreatingForm ? (isAr ? 'جارِ الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء Google Form' : 'Create Google Form')}</span>
                  </button>
                </div>

                {createdForms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">{isAr ? 'النماذج المنشأة حديثاً:' : 'Recently Created Forms:'}</h4>
                    <div className="space-y-2">
                      {createdForms.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-xs text-white font-medium">{f.title}</span>
                          <a
                            href={f.url || `https://docs.google.com/forms/d/${f.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-purple-400 hover:underline"
                          >
                            <span>{isAr ? 'رابط المشاركة / التعبئة' : 'Open Responder Link'}</span>
                            <Share2 size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. TASKS TAB */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-teal-300">{isAr ? 'إضافة مهمة جديدة إلى Google Tasks' : 'Add New Google Task'}</h4>
                    <button
                      type="button"
                      onClick={loadTasks}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title={isAr ? 'تحديث المهام' : 'Refresh Tasks'}
                    >
                      <RefreshCw size={14} className={isLoadingTasks ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={isAr ? 'عنوان المهمة...' : 'Task Title...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-teal-400 outline-none"
                  />

                  <input
                    type="text"
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    placeholder={isAr ? 'ملاحظات وتفاصيل إضافية (اختياري)...' : 'Notes / Description (Optional)...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-teal-400 outline-none"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>{isAr ? 'إضافة المهمة' : 'Add Task'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">{isAr ? 'قائمة مهامك الحالية:' : 'Your Google Tasks:'}</h4>
                  {isLoadingTasks ? (
                    <div className="text-center py-6 text-xs text-slate-400">{isAr ? 'جارِ جلب المهام...' : 'Loading Google Tasks...'}</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">{isAr ? 'لا توجد مهام حالية.' : 'No tasks found.'}</div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start justify-between p-3 rounded-xl border transition ${
                          task.status === 'completed'
                            ? 'bg-slate-950/40 border-slate-900 text-slate-500 line-through'
                            : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 cursor-pointer text-teal-400 hover:scale-110 transition"
                          >
                            <CheckSquare size={16} className={task.status === 'completed' ? 'opacity-80' : 'opacity-40'} />
                          </button>
                          <div>
                            <div className="text-xs font-semibold">{task.title}</div>
                            {task.notes && <div className="text-[11px] text-slate-400 mt-0.5">{task.notes}</div>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => promptDeleteTask(task)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
                          title={isAr ? 'حذف المهمة' : 'Delete Task'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 9. CONTACTS TAB */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300">{isAr ? 'جهات الاتصال المرتبطة بحساب Google:' : 'Google Contacts:'}</h4>
                  <button
                    type="button"
                    onClick={loadContacts}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title={isAr ? 'تحديث جهات الاتصال' : 'Refresh Contacts'}
                  >
                    <RefreshCw size={14} className={isLoadingContacts ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isLoadingContacts ? (
                  <div className="text-center py-6 text-xs text-slate-400">{isAr ? 'جارِ جلب جهات الاتصال...' : 'Loading contacts...'}</div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">{isAr ? 'لا توجد جهات اتصال.' : 'No contacts found.'}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contacts.map((contact, idx) => (
                      <div key={contact.resourceName || idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                        {contact.photoUrl ? (
                          <img
                            src={contact.photoUrl}
                            alt={contact.name || 'Contact'}
                            className="w-10 h-10 rounded-full border border-indigo-500/40 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                            <UserCheck size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{contact.name}</div>
                          {contact.email && <div className="text-[11px] text-slate-400 truncate">{contact.email}</div>}
                          {contact.phone && <div className="text-[10px] text-indigo-400 truncate">{contact.phone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle size={20} />
              <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{confirmModal.description}</p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const onConfirm = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await onConfirm();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-lg"
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
