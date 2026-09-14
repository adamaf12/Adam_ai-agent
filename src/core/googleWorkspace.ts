import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Workspace OAuth Scopes (All Google Workspace tools & services)
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/forms.body',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-Memory Token Cache (Never stored in localStorage as per security rules)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener
 */
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Sign out
 */
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// =========================================================================
// GOOGLE WORKSPACE API CLIENT HELPERS
// =========================================================================

/**
 * Helper to make authorized Google API fetch
 */
async function authorizedFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Workspace authentication required. Please sign in.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google API Error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// -------------------------------------------------------------------------
// 1. GMAIL API (gmail.send)
// -------------------------------------------------------------------------
export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendGmailMessage(payload: SendEmailPayload): Promise<{ id: string }> {
  // Build RFC 2822 formatted raw base64url email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;
  const messageParts = [
    `To: ${payload.to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    payload.body,
  ];
  const rawMessage = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return authorizedFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw: encodedMessage }),
  });
}

// -------------------------------------------------------------------------
// 2. GOOGLE DOCS API (documents)
// -------------------------------------------------------------------------
export async function createGoogleDoc(title: string, initialContent?: string): Promise<{ documentId: string; title: string }> {
  const doc = await authorizedFetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

  if (initialContent && doc.documentId) {
    await insertTextIntoDoc(doc.documentId, initialContent);
  }

  return doc;
}

export async function insertTextIntoDoc(documentId: string, text: string): Promise<any> {
  return authorizedFetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: `${text}\n`,
          },
        },
      ],
    }),
  });
}

export async function getGoogleDoc(documentId: string): Promise<any> {
  return authorizedFetch(`https://docs.googleapis.com/v1/documents/${documentId}`);
}

// -------------------------------------------------------------------------
// 3. GOOGLE SHEETS API (spreadsheets)
// -------------------------------------------------------------------------
export async function createGoogleSpreadsheet(title: string, headers?: string[]): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheet = await authorizedFetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (headers && headers.length > 0 && sheet.spreadsheetId) {
    await appendSheetRow(sheet.spreadsheetId, 'Sheet1!A1', headers);
  }

  return sheet;
}

export async function appendSheetRow(spreadsheetId: string, range: string, values: string[]): Promise<any> {
  return authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [values],
      }),
    }
  );
}

export async function getSheetValues(spreadsheetId: string, range: string): Promise<{ values: string[][] }> {
  return authorizedFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
}

// -------------------------------------------------------------------------
// 4. GOOGLE TASKS API (tasks)
// -------------------------------------------------------------------------
export interface GoogleTaskItem {
  id?: string;
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
}

export async function getGoogleTaskLists(): Promise<{ items: Array<{ id: string; title: string }> }> {
  return authorizedFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
}

export async function getGoogleTasks(taskListId = '@default'): Promise<{ items: GoogleTaskItem[] }> {
  return authorizedFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&maxResults=50`);
}

export async function createGoogleTask(task: GoogleTaskItem, taskListId = '@default'): Promise<GoogleTaskItem> {
  return authorizedFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateGoogleTask(taskId: string, updates: Partial<GoogleTaskItem>, taskListId = '@default'): Promise<GoogleTaskItem> {
  return authorizedFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteGoogleTask(taskId: string, taskListId = '@default'): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete Google task: ${res.statusText}`);
  }
}

// -------------------------------------------------------------------------
// 5. GMAIL READ API (gmail.readonly)
// -------------------------------------------------------------------------
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function getGmailMessages(maxResults = 10): Promise<{ messages: GmailMessageSummary[] }> {
  const list = await authorizedFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`);
  if (!list.messages || list.messages.length === 0) {
    return { messages: [] };
  }

  // Fetch snippets & headers for each
  const detailedMessages = await Promise.all(
    list.messages.map(async (msg: { id: string }) => {
      try {
        const details = await authorizedFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`);
        const headers = details.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        return {
          id: details.id,
          threadId: details.threadId,
          snippet: details.snippet,
          subject,
          from,
          date,
        };
      } catch {
        return { id: msg.id, threadId: msg.id, snippet: '' };
      }
    })
  );

  return { messages: detailedMessages };
}

// -------------------------------------------------------------------------
// 6. GOOGLE CALENDAR API (calendar.events)
// -------------------------------------------------------------------------
export interface CalendarEventPayload {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  location?: string;
  htmlLink?: string;
}

export async function getCalendarEvents(maxResults = 15): Promise<{ items: CalendarEventPayload[] }> {
  const now = new Date().toISOString();
  return authorizedFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`
  );
}

export async function createCalendarEvent(event: CalendarEventPayload): Promise<CalendarEventPayload> {
  return authorizedFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete calendar event: ${res.statusText}`);
  }
}

// -------------------------------------------------------------------------
// 7. GOOGLE DRIVE API (drive.file)
// -------------------------------------------------------------------------
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

export async function getDriveFiles(pageSize = 15): Promise<{ files: DriveFileItem[] }> {
  return authorizedFetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=nextPageToken,files(id,name,mimeType,webViewLink,createdTime)`
  );
}

export async function createDriveFile(name: string, content: string, mimeType = 'text/plain'): Promise<DriveFileItem> {
  // Simple JSON metadata creation
  return authorizedFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({
      name,
      mimeType,
      description: content,
    }),
  });
}

// -------------------------------------------------------------------------
// 8. GOOGLE CONTACTS / PEOPLE API (contacts.readonly)
// -------------------------------------------------------------------------
export interface ContactItem {
  resourceName: string;
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export async function getGoogleContacts(pageSize = 25): Promise<{ connections: ContactItem[] }> {
  const res = await authorizedFetch(
    `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=${pageSize}`
  );

  const rawConnections = res.connections || [];
  const contacts: ContactItem[] = rawConnections.map((c: any) => ({
    resourceName: c.resourceName,
    name: c.names?.[0]?.displayName || 'Unnamed Contact',
    email: c.emailAddresses?.[0]?.value || '',
    phone: c.phoneNumbers?.[0]?.value || '',
    photoUrl: c.photos?.[0]?.url || '',
  }));

  return { connections: contacts };
}

// -------------------------------------------------------------------------
// 9. GOOGLE SLIDES API (presentations)
// -------------------------------------------------------------------------
export async function createGooglePresentation(title: string): Promise<{ presentationId: string; title: string }> {
  return authorizedFetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    body: JSON.stringify({
      title,
    }),
  });
}

// -------------------------------------------------------------------------
// 10. GOOGLE FORMS API (forms.body)
// -------------------------------------------------------------------------
export async function createGoogleForm(title: string, documentTitle?: string): Promise<{ formId: string; responderUri: string }> {
  return authorizedFetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    body: JSON.stringify({
      info: {
        title,
        documentTitle: documentTitle || title,
      },
    }),
  });
}

