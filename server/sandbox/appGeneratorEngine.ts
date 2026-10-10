import { GoogleGenAI, Type } from '@google/genai';
import { secretsManager } from '../security/secrets';
import { synthesizeApp } from '../../src/core/agent/gameAppSynthesizer';

export interface GenerateAppRequest {
  prompt: string;
  category?: 'game' | 'app' | 'tool';
  language?: 'ar' | 'en';
  apiKey?: string;
}

export interface GeneratedAppResponse {
  id: string;
  title: string;
  titleEn: string;
  category: 'game' | 'app' | 'tool';
  prompt: string;
  code: string;
  features: string[];
}

export class AppGeneratorEngine {
  /**
   * Generates a complete, functional, single-file HTML5/CSS/JS interactive application or game
   * using Gemini 3.8 Flash, with resilient procedural fallback.
   */
  public static async generateApp(req: GenerateAppRequest): Promise<GeneratedAppResponse> {
    const rawApiKey = req.apiKey || secretsManager.getGeminiApiKey();
    const prompt = (req.prompt || '').trim();
    const isAr = req.language !== 'en';
    const appId = `adem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (rawApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: rawApiKey });

        const systemInstruction = `You are ADEM's Autonomous Full-Stack Application & Interactive Game Synthesis Engine.
Your mission is to generate a 100% complete, fully working, beautiful, responsive, single-file HTML5/CSS3/JavaScript application, tool, or game based on the user's prompt.

CRITICAL RULES:
1. Return ONLY valid JSON matching the schema.
2. The "code" field MUST be a complete <!DOCTYPE html> document with all CSS in <style> and JavaScript in <script>.
3. Design Quality: Luxury, modern dark-mode aesthetic (#0b0f19 background, neon/emerald/cyan accents, glassmorphic panels, responsive flex/grid layout, smooth CSS transitions, mobile touch & desktop keyboard support).
4. Zero Mock, Zero Placeholder: All buttons, forms, controls, canvas, or game loops must be 100% functional and interactive.
5. Provide real working logic: state persistence (localStorage), calculations, charts/visuals, or audio effects via Web Audio API if suitable.
6. Language: If the prompt is in Arabic, all labels, instructions, and messages inside the app must be in fluent, polished Arabic (RTL). If in English or other languages, match that language.`;

        const userPrompt = `User Request: "${prompt}"
App Type / Category Preference: ${req.category || 'auto-detect'}
Language Preference: ${isAr ? 'Arabic (العربية)' : 'English'}`;

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Display title of the application in the prompt language' },
                titleEn: { type: Type.STRING, description: 'English title of the application' },
                category: { type: Type.STRING, description: "'app' | 'tool' | 'game'" },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 3 to 5 prominent features implemented in the code'
                },
                code: { type: Type.STRING, description: 'The complete, runnable <!DOCTYPE html> single-file source code' }
              },
              required: ['title', 'titleEn', 'category', 'features', 'code']
            },
            temperature: 0.35,
          }
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI Generation Timeout')), 9000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed && parsed.code && parsed.code.includes('<!DOCTYPE html>')) {
            return {
              id: appId,
              title: parsed.title || prompt.slice(0, 30),
              titleEn: parsed.titleEn || 'Interactive Application',
              category: (['game', 'app', 'tool'].includes(parsed.category) ? parsed.category : 'app') as 'game' | 'app' | 'tool',
              prompt,
              code: parsed.code,
              features: Array.isArray(parsed.features) ? parsed.features : ['Interactive UI', 'Real-time State', 'Responsive'],
            };
          }
        }
      } catch (err) {
        console.warn('[AppGeneratorEngine] Gemini generation warning, using smart procedural synthesizer:', err);
      }
    }

    // High-res Procedural Fallback Engine
    const localResult = synthesizeApp({ prompt, category: req.category });
    return {
      id: appId,
      title: localResult.title,
      titleEn: localResult.titleEn,
      category: localResult.category,
      prompt,
      code: localResult.code,
      features: localResult.features,
    };
  }
}
