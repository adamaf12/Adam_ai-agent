import { getWorkspaceAccessToken } from './workspaceAuth';

const API_BASE = {
  calendar: 'https://www.googleapis.com/calendar/v3',
  gmail: 'https://gmail.googleapis.com/gmail/v1/users/me',
  drive: 'https://www.googleapis.com/drive/v3',
  contacts: 'https://people.googleapis.com/v1',
};

const getHeaders = (token?: string) => {
  const authToken = token || getWorkspaceAccessToken();
  if (!authToken) {
    throw new Error('لم يتم تسجيل الدخول إلى Google Workspace. يرجى تسجيل الدخول أولاً.');
  }
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };
};

// ==================== GOOGLE CALENDAR ====================
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const fetchCalendarEvents = async (token?: string): Promise<GoogleCalendarEvent[]> => {
  const headers = getHeaders(token);
  const now = new Date().toISOString();
  const res = await fetch(
    `${API_BASE.calendar}/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&maxResults=20&orderBy=startTime&singleEvents=true`,
    { headers }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل جلب الأحداث من تقويم Google');
  }
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (
  eventData: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
  },
  token?: string
): Promise<GoogleCalendarEvent> => {
  const headers = getHeaders(token);
  const body = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: { dateTime: eventData.startTime },
    end: { dateTime: eventData.endTime },
  };
  const res = await fetch(`${API_BASE.calendar}/calendars/primary/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إنشاء الحدث في التقويم');
  }
  return await res.json();
};

export const deleteCalendarEvent = async (eventId: string, token?: string): Promise<void> => {
  const headers = getHeaders(token);
  const res = await fetch(`${API_BASE.calendar}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('فشل حذف الحدث من تقويم Google');
  }
};

// ==================== GMAIL ====================
export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export const fetchGmailMessages = async (maxResults = 15, token?: string): Promise<GmailMessageSummary[]> => {
  const headers = getHeaders(token);
  const listRes = await fetch(`${API_BASE.gmail}/messages?maxResults=${maxResults}`, { headers });
  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل جلب رسائل Gmail');
  }
  const listData = await listRes.json();
  const messages: GmailMessageSummary[] = [];

  if (listData.messages && Array.isArray(listData.messages)) {
    for (const msgItem of listData.messages.slice(0, maxResults)) {
      try {
        const detailRes = await fetch(`${API_BASE.gmail}/messages/${msgItem.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, { headers });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headersList: GmailMessageHeader[] = detail.payload?.headers || [];
          const subject = headersList.find((h) => h.name.toLowerCase() === 'subject')?.value || '(بدون عنوان)';
          const from = headersList.find((h) => h.name.toLowerCase() === 'from')?.value || 'مجهول';
          const date = headersList.find((h) => h.name.toLowerCase() === 'date')?.value || '';
          messages.push({
            id: detail.id,
            snippet: detail.snippet || '',
            subject,
            from,
            date,
          });
        }
      } catch (e) {
        console.warn('Error fetching message details:', e);
      }
    }
  }

  return messages;
};

/**
 * Fetch up to 5 unread Gmail messages (falls back to 5 recent if no unread found).
 */
export const fetchUnreadGmailMessages = async (
  maxResults = 5,
  token?: string
): Promise<{ messages: GmailMessageSummary[]; isUnread: boolean }> => {
  const headers = getHeaders(token);
  let isUnread = true;
  let listData: any = null;

  try {
    const unreadRes = await fetch(`${API_BASE.gmail}/messages?q=is%3Aunread&maxResults=${maxResults}`, { headers });
    if (unreadRes.ok) {
      listData = await unreadRes.json();
    }
  } catch (e) {
    console.warn('Error fetching unread query:', e);
  }

  if (!listData?.messages || listData.messages.length === 0) {
    isUnread = false;
    const recentRes = await fetch(`${API_BASE.gmail}/messages?maxResults=${maxResults}`, { headers });
    if (recentRes.ok) {
      listData = await recentRes.json();
    }
  }

  const messages: GmailMessageSummary[] = [];
  if (listData?.messages && Array.isArray(listData.messages)) {
    for (const msgItem of listData.messages.slice(0, maxResults)) {
      try {
        const detailRes = await fetch(
          `${API_BASE.gmail}/messages/${msgItem.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headersList: GmailMessageHeader[] = detail.payload?.headers || [];
          const subject = headersList.find((h) => h.name.toLowerCase() === 'subject')?.value || '(بدون عنوان)';
          const from = headersList.find((h) => h.name.toLowerCase() === 'from')?.value || 'مجهول';
          const date = headersList.find((h) => h.name.toLowerCase() === 'date')?.value || '';
          messages.push({
            id: detail.id,
            snippet: detail.snippet || '',
            subject,
            from,
            date,
          });
        }
      } catch (e) {
        console.warn('Error fetching unread message detail:', e);
      }
    }
  }

  return { messages, isUnread };
};

/**
 * Request AI to generate an executive summary for the fetched Gmail inbox messages.
 */
export const summarizeGmailInbox = async (
  messages: GmailMessageSummary[],
  isArabic = true
): Promise<string> => {
  if (messages.length === 0) {
    return isArabic
      ? 'لم يتم العثور على أي رسائل بريد إلكتروني جديدة أو غير مقروءة لتلخيصها.'
      : 'No new or unread emails found to summarize.';
  }

  const emailListFormatted = messages
    .map(
      (m, idx) =>
        `[الرسالة ${idx + 1}]
- المرسل: ${m.from}
- العنوان: ${m.subject}
- التاريخ: ${m.date}
- المقتطف: ${m.snippet}`
    )
    .join('\n\n');

  const prompt = isArabic
    ? `أنت مساعد ذكي متخصص في إدارة البريد الإلكتروني. يرجى تحليل آخر ${messages.length} رسائل بريد إلكتروني مقروءة/غير مقروءة في صندوق الوارد بـ Gmail وتقديم ملخص تنفيذي ممتاز ومبسط بالعربية:

${emailListFormatted}

يرجى هيكلة الإجابة بالشكل التالي:
1. 📌 **ملخص عام سريع** (في جملتين عن أبرز المواضيع)
2. 📬 **أبرز الرسائل المهام والعاجلة** (إن وجدت)
3. 📝 **جدول أو نقاط موجزة لكل رسالة** (المرسل | الفكرة الرئيسية | الإجراء المطلوب)
4. 💡 **توصية ذكية** من المساعد للمستخدم.`
    : `You are an executive AI Email Assistant. Please analyze the following ${messages.length} recent/unread Gmail inbox messages and generate a concise executive summary:

${emailListFormatted}

Please structure the summary as follows:
1. 📌 **Quick Executive Summary** (2 sentences)
2. 📬 **Urgent & High-Priority Action Items**
3. 📝 **Bullet List of Messages** (Sender | Main Topic | Required Action)
4. 💡 **Smart Recommendation** for next steps.`;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        systemInstruction: 'أنت مساعد ADAM الذكي المتخصص في تلخيص وتنظيم البريد الإلكتروني بدقة واحترافية عالية.',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply || data.response || data.text) {
        return data.reply || data.response || data.text;
      }
    }
  } catch (err) {
    console.warn('Server AI call failed for email summary, using formatted fallback:', err);
  }

  // Fallback client-side summary format if AI server endpoint is unavailable
  return messages
    .map(
      (m, i) =>
        `• **الرسالة ${i + 1}**: ${m.subject}\n  - **من**: ${m.from}\n  - **الملخص**: ${
          m.snippet || 'لا يوجد مقتطف'
        }`
    )
    .join('\n\n');
};

export const sendGmailMessage = async (
  recipient: string,
  subject: string,
  bodyText: string,
  token?: string
): Promise<any> => {
  const headers = getHeaders(token);
  const rawEmail = [
    `To: ${recipient}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ].join('\r\n');

  // Base64url encode
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${API_BASE.gmail}/messages/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إرسال البريد الإلكتروني عبر Gmail');
  }
  return await res.json();
};

export const trashGmailMessage = async (messageId: string, token?: string): Promise<void> => {
  const headers = getHeaders(token);
  const res = await fetch(`${API_BASE.gmail}/messages/${messageId}/trash`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    throw new Error('فشل نقل الرسالة إلى سلة المهملات');
  }
};

// ==================== GOOGLE DRIVE ====================
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  size?: string;
}

export const fetchDriveFiles = async (maxResults = 20, token?: string): Promise<DriveFileItem[]> => {
  const headers = getHeaders(token);
  const res = await fetch(
    `${API_BASE.drive}/files?pageSize=${maxResults}&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,size)&q=trashed=false&orderBy=modifiedTime desc`,
    { headers }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل جلب ملفات Google Drive');
  }
  const data = await res.json();
  return data.files || [];
};

export const createDriveFolder = async (folderName: string, token?: string): Promise<DriveFileItem> => {
  const headers = getHeaders(token);
  const body = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  const res = await fetch(`${API_BASE.drive}/files`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إنشاء المجلد في Google Drive');
  }
  return await res.json();
};

export const deleteDriveFile = async (fileId: string, token?: string): Promise<void> => {
  const headers = getHeaders(token);
  const res = await fetch(`${API_BASE.drive}/files/${fileId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('فشل حذف الملف من Google Drive');
  }
};

// ==================== GOOGLE CONTACTS (PEOPLE API) ====================
export interface GoogleContact {
  resourceName: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
}

export const fetchGoogleContacts = async (pageSize = 30, token?: string): Promise<GoogleContact[]> => {
  const headers = getHeaders(token);
  const res = await fetch(
    `${API_BASE.contacts}/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,photos`,
    { headers }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل جلب قائمة جهات الاتصال من Google');
  }
  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((c: any) => ({
    resourceName: c.resourceName,
    name: c.names?.[0]?.displayName || 'بدون اسم',
    email: c.emailAddresses?.[0]?.value || '',
    phoneNumber: c.phoneNumbers?.[0]?.value || '',
    photoUrl: c.photos?.[0]?.url || '',
  }));
};

export const createGoogleContact = async (
  name: string,
  email?: string,
  phone?: string,
  token?: string
): Promise<GoogleContact> => {
  const headers = getHeaders(token);
  const body: any = {
    names: [{ givenName: name }],
  };
  if (email) {
    body.emailAddresses = [{ value: email }];
  }
  if (phone) {
    body.phoneNumbers = [{ value: phone }];
  }

  const res = await fetch(`${API_BASE.contacts}/people/createContact`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إضاف جهة الاتصال الجديدة');
  }

  const c = await res.json();
  return {
    resourceName: c.resourceName,
    name: c.names?.[0]?.displayName || name,
    email: c.emailAddresses?.[0]?.value || email || '',
    phoneNumber: c.phoneNumbers?.[0]?.value || phone || '',
    photoUrl: c.photos?.[0]?.url || '',
  };
};

export const deleteGoogleContact = async (resourceName: string, token?: string): Promise<void> => {
  const headers = getHeaders(token);
  const res = await fetch(`${API_BASE.contacts}/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('فشل حذف جهة الاتصال');
  }
};
