import type { Language, Message } from '../domain';

export function getClientGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  const stored =
    localStorage.getItem('gemini_api_key')?.trim() ||
    localStorage.getItem('adam_gemini_key')?.trim() ||
    localStorage.getItem('adam_api_key')?.trim() ||
    '';
  if (stored) return stored;

  const envKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY ?? '').trim();
  return envKey || null;
}

export function getClientHuggingFaceToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored =
    localStorage.getItem('huggingFaceToken')?.trim() ||
    localStorage.getItem('adam_hf_token')?.trim() ||
    '';
  if (stored) return stored;

  const envKey = ((import.meta as any).env?.VITE_HF_TOKEN ?? '').trim();
  return envKey || null;
}

export function hasDirectClientAi(): boolean {
  return Boolean(getClientGeminiApiKey() || getClientHuggingFaceToken());
}

export async function executeDirectGemini({
  prompt,
  history,
  language,
  agentName,
  signal,
  onDelta,
}: {
  prompt: string;
  history?: Message[];
  language: Language;
  agentName: string;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}): Promise<string> {
  const apiKey = getClientGeminiApiKey();
  if (!apiKey) throw new Error('No Gemini API key available on client');

  const now = new Date();
  const arDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  let hijri = '';
  try {
    hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch {}
  const hijriStr = hijri ? ` (الموافق هجرياً: ${hijri})` : '';

  const systemText =
    language === 'ar'
      ? `أنت ${agentName} (آدم)، وكيل ذكاء اصطناعي تنفيذي متقدم مستقل تم تطويرك وهندستك بواسطة "آدم فيدات (Adem Feidat)".
أجب مباشرة وبكفاءة وسرعة، دون وعظ أو مقدمات مستهلكة.
اليوم هو: ${arDate}م${hijriStr}.
إذا طُلب منك برمجة أو كتابة تطبيق أو كود، اكتبه بشكل كامل ومباشر مع وسوم Markdown المناسبة.`
      : `You are ${agentName}, an autonomous executive AI agent engineered and developed by Adem Feidat.
Respond directly, efficiently, and with zero fluff.
Today is: ${now.toDateString()}.
When asked for code or full interactive apps, write complete, clean, functional code wrapped in appropriate Markdown blocks.`;

  // Build contents history
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  if (history && history.length > 0) {
    const recent = history.slice(-6);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    if (signal?.aborted) throw new Error('Request aborted');
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemText }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 4096,
          },
        }),
        signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response stream from Gemini API');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const partText =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (partText) {
              fullText += partText;
              onDelta(partText);
            }
          } catch {
            // Ignore malformed sse chunks
          }
        }
      }

      if (fullText.trim()) {
        return fullText;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Direct Gemini API call failed');
}

export async function executeDirectHuggingFace({
  prompt,
  history,
  modelId,
  language,
  agentName,
  signal,
  onDelta,
}: {
  prompt: string;
  history?: Message[];
  modelId?: string;
  language: Language;
  agentName: string;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}): Promise<string> {
  const token = getClientHuggingFaceToken();
  if (!token) throw new Error('No Hugging Face token available on client');

  const selectedModel = modelId || 'Qwen/Qwen2.5-Coder-32B-Instruct';

  const systemMsg =
    language === 'ar'
      ? `أنت ${agentName}، وكيل ذكاء اصطناعي تنفيذي متقدم تم تطويرك بواسطة آدم فيدات (Adem Feidat). أجب بدقة واحترافية وبشكل مباشر.`
      : `You are ${agentName}, an executive AI agent developed by Adem Feidat. Answer directly and precisely.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemMsg },
  ];

  if (history && history.length > 0) {
    for (const m of history.slice(-6)) {
      if (m.role === 'user' || m.role === 'assistant') {
        messages.push({ role: m.role, content: m.content });
      }
    }
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
      max_tokens: 4096,
      temperature: 0.35,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Hugging Face error HTTP ${res.status}: ${errText.slice(0, 100)}`);
  }

  if (!res.body) {
    throw new Error('No response stream from Hugging Face');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          onDelta(delta);
        }
      } catch {
        // Ignore chunk parsing error
      }
    }
  }

  if (fullText.trim()) return fullText;
  throw new Error('Empty response from Hugging Face');
}
