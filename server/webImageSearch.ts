export interface WebImageResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  source: string;
  pageUrl?: string;
  width?: number;
  height?: number;
  author?: string;
  license?: string;
}

export interface WebImageSearchResponse {
  ok: boolean;
  query: string;
  count: number;
  images: WebImageResult[];
  error?: string;
}

/**
 * Searches and fetches real images from Wikimedia Commons and Wikipedia
 * without requiring external proprietary API keys.
 */
export async function searchInternetImages(
  query: string,
  limit = 6,
  language: 'ar' | 'en' | string = 'ar'
): Promise<WebImageResult[]> {
  const clean = query
    .replace(/^(?:اجلب|ابحث\s*عن|هات|أريد|اعرض|صور|صورة|بحث|search\s*for|find|get|show|images?\s*of|photos?\s*of)\s+/i, '')
    .trim();

  if (!clean || clean.length < 2) return [];

  const results: WebImageResult[] = [];
  const seenUrls = new Set<string>();

  // 1. Search Wikimedia Commons File Namespace (ns=6)
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
    clean
  )}&gsrlimit=${Math.max(limit * 2, 8)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(commonsUrl, {
      headers: {
        'User-Agent': 'AdamAI/2.0 (InternetImageFetcher; contact@adam-ai.internal)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

      for (const p of pages as any[]) {
        const info = Array.isArray(p.imageinfo) ? p.imageinfo[0] : null;
        if (!info || !info.url) continue;

        // Skip non-displayable formats like audio/video/pdf/tiff
        const mime = String(info.mime || '').toLowerCase();
        if (
          mime.includes('audio') ||
          mime.includes('video') ||
          mime.includes('pdf') ||
          mime.includes('tiff') ||
          mime.includes('djvu')
        ) {
          continue;
        }

        const directUrl = String(info.url);
        if (seenUrls.has(directUrl)) continue;
        seenUrls.add(directUrl);

        const rawTitle = String(p.title || '')
          .replace(/^File:/i, '')
          .replace(/\.[a-zA-Z0-9]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();

        const extMeta = info.extmetadata || {};
        const author = extMeta.Artist?.value ? String(extMeta.Artist.value).replace(/<[^>]+>/g, '').trim() : undefined;
        const license = extMeta.LicenseShortName?.value ? String(extMeta.LicenseShortName.value).trim() : 'Public Domain / Creative Commons';

        // Provide a suitable thumbnail URL if width is very large
        let thumbUrl = directUrl;
        if (info.width && info.width > 1200) {
          // Construct wikimedia thumb URL if possible, otherwise use directUrl
          thumbUrl = directUrl;
        }

        results.push({
          id: `wiki_${p.pageid || Math.random().toString(36).slice(2, 9)}`,
          url: directUrl,
          thumbnail: thumbUrl,
          title: rawTitle || clean,
          description: extMeta.ImageDescription?.value ? String(extMeta.ImageDescription.value).replace(/<[^>]+>/g, '').slice(0, 200).trim() : undefined,
          source: 'Wikimedia Commons',
          pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title || '')}`,
          width: info.width,
          height: info.height,
          author,
          license,
        });

        if (results.length >= limit) break;
      }
    }
  } catch (err) {
    console.warn('[WebImageSearch] Wikimedia query failed:', err);
  } finally {
    clearTimeout(timer);
  }

  // 2. Fallback to Wikipedia PageImages API if results < 2
  if (results.length < 2) {
    const wikiLang = language === 'ar' ? 'ar' : 'en';
    const wikiUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      clean
    )}&gsrlimit=4&prop=pageimages|extracts&exintro&explaintext&exsentences=1&pithumbsize=1000&format=json`;

    try {
      const res = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'AdamAI/2.0 (WikipediaImageFetcher)' },
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
        for (const p of pages as any[]) {
          const thumb = p.thumbnail?.source;
          if (thumb && !seenUrls.has(thumb)) {
            seenUrls.add(thumb);
            results.push({
              id: `wp_${p.pageid || Math.random().toString(36).slice(2, 9)}`,
              url: thumb,
              thumbnail: thumb,
              title: p.title || clean,
              description: p.extract || undefined,
              source: `Wikipedia (${wikiLang.toUpperCase()})`,
              pageUrl: `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(p.title || '')}`,
              width: p.thumbnail?.width,
              height: p.thumbnail?.height,
              license: 'Wikipedia Media',
            });
            if (results.length >= limit) break;
          }
        }
      }
    } catch (wikiErr) {
      console.warn('[WebImageSearch] Wikipedia query failed:', wikiErr);
    }
  }

  return results;
}
