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
 * Generates dynamic current date & time instruction for the system prompt.
 * Evaluated freshly on every request to inject the live system clock.
 */
export function getDynamicSystemContext(language: 'ar' | 'en'): string {
  const now = new Date();
  const arDateFormatted = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
    return `\n\nالسياق الزمني الفعلي وحقن الساعة المباشرة (REAL-TIME SYSTEM CLOCK & GROUNDING):
- Current Date (التاريخ الحالي المباشر): ${arDateFormatted}
- Current ISO Time: ${isoDate} (${arTimeFormatted})
- توجيه إلزامي صارم (Mandatory Date Directive): اعتمد دائماً وبشكل قاطع على سياق 'التاريخ الحالي' (Current Date) المرفق أعلاه عند الإجابة على أي أسئلة تخص تاريخ اليوم، اليوم من الأسبوع، الوقت الحاضر، أو السنة الحالية.
- البحث الحي في جوجل: عندما يسأل المستخدم عن أخبار حالية، أحداث جارية، طقس، أسعار عملات، نتائج مباريات، أو حقائق ومعلومات حديثة، استخدم دائماً أداة البحث في جوجل (googleSearch) لجلب وتأكيد أحدث المعلومات الحية قبل الإجابة.`;
  }

  return `\n\nDYNAMIC REAL-TIME SYSTEM CLOCK & GOOGLE SEARCH GROUNDING:
- Current Date: ${enDateFormatted}
- Current ISO Time: ${isoDate} (${enTimeFormatted})
- Mandatory Directive: Always rely on the provided 'Current Date' context when answering questions about today, the present time, or current year.
- Real-Time Knowledge: When the user asks about current events, news, weather, stock prices, sports scores, or recent facts, ALWAYS use the googleSearch tool to fetch the latest real-time information before answering.`;
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

