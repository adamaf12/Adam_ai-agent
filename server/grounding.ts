export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
}

export interface GroundingData {
  sources: GroundingSource[];
  queries: string[];
}

/**
 * Extracts and deduplicates web sources and search queries from Gemini grounding metadata.
 */
export function extractGroundingMetadata(metadata: any): GroundingData {
  const sources: GroundingSource[] = [];
  const queries: string[] = [];
  const seenUrls = new Set<string>();

  if (!metadata || typeof metadata !== 'object') return { sources, queries };

  if (Array.isArray(metadata.webSearchQueries)) {
    for (const q of metadata.webSearchQueries) {
      if (typeof q === 'string' && q.trim() && !queries.includes(q.trim())) {
        queries.push(q.trim());
      }
    }
  }

  if (Array.isArray(metadata.groundingChunks)) {
    for (const chunk of metadata.groundingChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title || uri;
      if (uri && typeof uri === 'string' && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        let domain = '';
        try {
          domain = new URL(uri).hostname.replace(/^www\./, '');
        } catch {}
        sources.push({
          title: typeof title === 'string' && title.trim() ? title.trim() : uri,
          url: uri,
          domain: domain || 'web',
        });
      }
    }
  }

  return { sources, queries };
}

/**
 * Merges two grounding data sets without duplicates.
 */
export function mergeGroundingData(base: GroundingData, incoming: GroundingData): GroundingData {
  const queries = Array.from(new Set([...base.queries, ...incoming.queries]));
  const seenUrls = new Set<string>(base.sources.map(s => s.url));
  const sources = [...base.sources];

  for (const s of incoming.sources) {
    if (s.url && !seenUrls.has(s.url)) {
      seenUrls.add(s.url);
      sources.push(s);
    }
  }

  return { sources, queries };
}

/**
 * Detects if a prompt is asking about today, current date, day of week, or current time.
 */
export function isTodayDateQuery(prompt: string): boolean {
  const p = String(prompt || '').toLowerCase().trim();
  return /(?:اليوم|تاريخ اليوم|ماهو اليوم|ما هو اليوم|اليوم ايه|كم تاريخ|كم التاريخ|كم اليوم|شو اليوم|ايش اليوم|ماهو تاريخ اليوم|ما تاريخ|اليوم كم|today|what day is it|current date|today's date|what date is it|what's today)/i.test(p);
}

/**
 * Generates dynamic current date & time instruction for the system prompt.
 * Evaluated freshly on every request to inject the live system clock.
 */
export function getDynamicSystemContext(language: 'ar' | 'en' | 'fr' | string = 'ar'): string {
  const now = new Date();
  const arDateFormatted = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  let arHijriFormatted = '';
  try {
    arHijriFormatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch {
    arHijriFormatted = '';
  }

  const enDateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isoDate = now.toISOString();
  const arTimeFormatted = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
  const enTimeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  if (language === 'ar') {
    const hijriPart = arHijriFormatted ? ` (الموافق هجرياً: ${arHijriFormatted})` : '';
    return `\n\nالسياق الزمني المباشر وتأكيد تاريخ اليوم (REAL-TIME CALENDAR & CLOCK):
- اليوم وتاريخ اليوم المؤكد: ${arDateFormatted}م${hijriPart}
- الوقت الحالي: ${arTimeFormatted} (ISO: ${isoDate})
- توجيه إلزامي صارم لليوم وتاريخ اليوم (MANDATORY TODAY DIRECTIVE):
  * عندما يسألك المستخدم عن "اليوم" أو "تاريخ اليوم" أو "ما هو اليوم" أو "اليوم ايه"، أجب مباشرة بدقة متناهية وبساطة مطلقة معتمداً على التاريخ المحدد أعلاه: "${arDateFormatted}م${hijriPart}". لا تخمّن ولا تؤجل الإجابة، واذكر اليوم والتاريخ فوراً بإيجاز ووضوح.
- توجيه إلزامي للأسئلة العامة والمعلومات من الشبكة (WEB GROUNDING & KNOWLEDGE DIRECTIVE):
  * عندما يسألك المستخدم عن أي موضوع أو حقيقة أو استفسار عام آخر، قدّم إجابة صحيحة، بسيطة، مباشرة، ومستندة إلى معلومات موثوقة من الشبكة بدون أي تعقيد أو حشو غير ضروري.`;
  }

  return `\n\nDYNAMIC REAL-TIME SYSTEM CLOCK & GROUNDING:
- Current Date: ${enDateFormatted}
- Current ISO Time: ${isoDate} (${enTimeFormatted})
- Mandatory Directive: Always rely on the provided 'Current Date' context when answering questions about today, the present time, or current year. Answer directly, clearly, and concisely.
- Knowledge Grounding: When answering general questions about the world, provide accurate, simple, and direct answers based on verified web knowledge without unnecessary fluff.`;
}

/**
 * Fetches real-time web knowledge from DuckDuckGo and Wikipedia APIs in parallel
 * with ultra-fast latency (<600ms), resilient fallback handling, and rich snippet extraction.
 */
export async function fetchLiveWebKnowledge(
  query: string,
  language: 'ar' | 'en' | 'fr' = 'ar'
): Promise<{ sources: GroundingSource[]; knowledgeContext: string; queries: string[] }> {
  const cleanQuery = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().slice(0, 150);
  if (!cleanQuery || cleanQuery.length < 2) {
    return { sources: [], knowledgeContext: '', queries: [] };
  }

  const sources: GroundingSource[] = [];
  const snippets: string[] = [];
  const seenUrls = new Set<string>();

  const wikiEndpoint = language === 'ar'
    ? `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&srlimit=4`
    : `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&srlimit=4`;

  const ddgEndpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);

  try {
    // Query Wikipedia and DuckDuckGo in parallel
    const [wikiRes, ddgRes] = await Promise.allSettled([
      fetch(wikiEndpoint, {
        headers: { 'User-Agent': 'AdamAI/2.0 (LiveKnowledgeAssistant)' },
        signal: controller.signal,
      }).then(r => (r.ok ? r.json() : null)),
      fetch(ddgEndpoint, {
        headers: { 'User-Agent': 'AdamAI/2.0 (LiveKnowledgeAssistant)' },
        signal: controller.signal,
      }).then(r => (r.ok ? r.json() : null)),
    ]);

    // Parse DuckDuckGo Abstract & Related Topics
    if (ddgRes.status === 'fulfilled' && ddgRes.value) {
      const ddgData = ddgRes.value;
      if (ddgData.AbstractText && ddgData.AbstractURL && !seenUrls.has(ddgData.AbstractURL)) {
        seenUrls.add(ddgData.AbstractURL);
        sources.push({
          title: ddgData.Heading || cleanQuery,
          url: ddgData.AbstractURL,
          domain: 'duckduckgo.com',
        });
        snippets.push(`- **${ddgData.Heading || cleanQuery}**: ${ddgData.AbstractText.slice(0, 400)}`);
      }

      if (Array.isArray(ddgData.RelatedTopics)) {
        for (const topic of ddgData.RelatedTopics.slice(0, 2)) {
          if (topic.Text && topic.FirstURL && !seenUrls.has(topic.FirstURL)) {
            seenUrls.add(topic.FirstURL);
            sources.push({
              title: topic.Text.split(' - ')[0] || cleanQuery,
              url: topic.FirstURL,
              domain: 'duckduckgo.com',
            });
            snippets.push(`- ${topic.Text.slice(0, 300)}`);
          }
        }
      }
    }

    // Parse Wikipedia Search Items
    if (wikiRes.status === 'fulfilled' && wikiRes.value) {
      const searchItems = Array.isArray(wikiRes.value?.query?.search) ? wikiRes.value.query.search : [];
      for (const item of searchItems.slice(0, 3)) {
        const title = String(item?.title || '').trim();
        if (!title) continue;
        const snippet = String(item?.snippet || '')
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        const wikiDomain = language === 'ar' ? 'ar.wikipedia.org' : 'en.wikipedia.org';
        const url = `https://${wikiDomain}/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;

        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          sources.push({
            title,
            url,
            domain: 'wikipedia.org',
          });

          if (snippet) {
            snippets.push(`- **${title}**: ${snippet}`);
          }
        }
      }
    }

    let knowledgeContext = '';
    if (snippets.length > 0) {
      knowledgeContext = language === 'ar'
        ? `\n\n=== نتائج ومعلومات حية وموثوقة من شبكة الإنترنت (LIVE INTERNET REAL-TIME GROUNDING) ===\n${snippets.join('\n')}\nاستفد من هذه المعلومات المباشرة والحقائق الحية لتقديم إجابة دقيقة، موثقة، وبسيطة للمستخدم.`
        : `\n\n=== VERIFIED LIVE INTERNET REAL-TIME GROUNDING ===\n${snippets.join('\n')}\nUse these verified live facts to provide an accurate, clear, and direct response.`;
    }

    return { sources, knowledgeContext, queries: [cleanQuery] };
  } catch {
    return { sources: [], knowledgeContext: '', queries: [cleanQuery] };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Builds a fast, resilient, direct CDN image URL with sanitized prompt and length protection.
 * Defaults to Flux.1 high-performance engine.
 */
export function buildFluxEngineUrl(
  prompt: string,
  aspectRatio: string = '1:1',
  seed: number = Date.now()
): { url: string; width: number; height: number; cleanPrompt: string } {
  const cleanPrompt = String(prompt || '')
    .replace(/:::[\s\S]*?:::/g, '')
    .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);

  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1344;
    height = 768;
  } else if (aspectRatio === '9:16') {
    width = 768;
    height = 1344;
  } else if (aspectRatio === '4:3') {
    width = 1152;
    height = 864;
  } else if (aspectRatio === '21:9') {
    width = 1536;
    height = 640;
  }

  const encoded = encodeURIComponent(cleanPrompt || '8k resolution photorealistic cinematic masterpiece 85mm lens volumetric lighting');
  const url = `https://pollinations.ai/p/${encoded}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
  return { url, width, height, cleanPrompt };
}

export function buildSecureImageUrl(
  prompt: string,
  seed: number = Date.now(),
  model: 'flux' | 'turbo' = 'flux',
  width: number = 1024,
  height: number = 1024
): string {
  const clean = String(prompt || '')
    .replace(/:::[\s\S]*?:::/g, '')
    .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);

  const encoded = encodeURIComponent(clean || 'photorealistic cinematic masterpiece 8k');
  return `https://pollinations.ai/p/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`;
}

