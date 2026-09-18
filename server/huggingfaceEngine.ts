import type { Response } from 'express';
import { redactSecrets } from './security/secrets';

export interface HuggingFaceModel {
  id: string;
  name: string;
  category: 'reasoning' | 'coding' | 'general' | 'vision';
  parameters: string;
  descriptionAr: string;
  descriptionEn: string;
  speed: number;
  quality: number;
  contextLength: number;
}

export const HUGGINGFACE_CURATED_MODELS: HuggingFaceModel[] = [
  {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1 (Hugging Face Reasoning)',
    category: 'reasoning',
    parameters: '671B MoE (37B active)',
    descriptionAr: 'نموذج التفكير العميق وحل المعضلات البرمجية والرياضية المعقدة بأعلى درجات المنطق وسلسلة التفكير (Chain-of-Thought).',
    descriptionEn: 'SOTA Deep Reasoning model with chain-of-thought deduction, advanced mathematics, and system architectural analysis.',
    speed: 8.8,
    quality: 9.9,
    contextLength: 131072,
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B (Hugging Face Code)',
    category: 'coding',
    parameters: '32.5B Dense',
    descriptionAr: 'المحرك الأقوى لبرمجة التطبيقات، تصحيح الأخطاء، وكتابة شفرات الألعاب والخوارزميات بلغات الويب والأنظمة.',
    descriptionEn: 'State-of-the-art programming engine for full-stack apps, automated debugging, and high-performance algorithms.',
    speed: 9.5,
    quality: 9.8,
    contextLength: 131072,
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B Instruct (Hugging Face)',
    category: 'general',
    parameters: '70B Dense',
    descriptionAr: 'النموذج المفتوح الرائد عالمياً للذكاء العام، التحليل الاستراتيجي، الفصاحة اللغوية، والترجمة الدقيقة.',
    descriptionEn: 'Premier open foundation model for general intelligence, strategic synthesis, and high multilingual fluency.',
    speed: 9.0,
    quality: 9.7,
    contextLength: 131072,
  },
  {
    id: 'mistralai/Mistral-Small-24B-Instruct-2501',
    name: 'Mistral Small 24B (Hugging Face)',
    category: 'general',
    parameters: '24B Dense',
    descriptionAr: 'محرك مدمج فائق السرعة والاستجابة، ممتاز في تلخيص المحتوى والعمليات السريعة.',
    descriptionEn: 'Ultra-fast and highly responsive compact model, ideal for rapid iterations and summarization.',
    speed: 9.8,
    quality: 9.4,
    contextLength: 32768,
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'Flux.1 Schnell (Hugging Face Vision)',
    category: 'vision',
    parameters: '12B Rectified Flow',
    descriptionAr: 'محرك الجيل القادم لتوليد الصور فائقة الواقعية بدقة بصرية وإضاءة سينمائية حجمية 8K.',
    descriptionEn: 'Next-generation 12B parameter visual engine for hyper-realistic renders and cinematic lighting.',
    speed: 9.6,
    quality: 9.9,
    contextLength: 4096,
  },
];

export class HuggingFaceEngine {
  private getApiKey(customToken?: string): string {
    if (customToken && typeof customToken === 'string' && customToken.trim().length >= 10) {
      return customToken.trim();
    }
    return (
      process.env.HUGGINGFACE_API_KEY?.trim() ||
      process.env.HF_TOKEN?.trim() ||
      process.env.HUGGINGFACE_TOKEN?.trim() ||
      process.env.HUGGING_FACE_HUB_TOKEN?.trim() ||
      ''
    );
  }

  public getStatus(customToken?: string) {
    const key = this.getApiKey(customToken);
    return {
      configured: Boolean(key),
      hasCustomToken: Boolean(customToken && customToken.length >= 10),
      tokenProtected: true,
      securityMode: 'server_vault_isolated',
      provider: 'Hugging Face Inference Hub & Router',
      models: HUGGINGFACE_CURATED_MODELS,
      activeModelsCount: HUGGINGFACE_CURATED_MODELS.length,
      defaultCodingModel: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      defaultReasoningModel: 'deepseek-ai/DeepSeek-R1',
    };
  }

  /**
   * Invoke Hugging Face Chat / Code Completion via Router API or Direct Inference
   */
  public async generateChatCompletion(params: {
    model?: string;
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    customToken?: string;
  }): Promise<{ text: string; model: string; provider: string; executionTimeMs: number }> {
    const startTime = Date.now();
    const token = this.getApiKey(params.customToken);
    const selectedModel = params.model || 'Qwen/Qwen2.5-Coder-32B-Instruct';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payloadMessages = [];
    if (params.systemPrompt) {
      payloadMessages.push({ role: 'system', content: params.systemPrompt });
    }
    payloadMessages.push(...params.messages);

    const endpoints = [
      'https://router.huggingface.co/v1/chat/completions',
      'https://api-inference.huggingface.co/v1/chat/completions',
      `https://api-inference.huggingface.co/models/${selectedModel}/v1/chat/completions`,
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: selectedModel,
            messages: payloadMessages,
            temperature: params.temperature ?? 0.35,
            max_tokens: params.maxTokens ?? 4096,
            stream: false,
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${errText.slice(0, 300)}`);
        }

        const data = await response.json();
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.text ||
          data?.generated_text ||
          '';

        if (typeof content === 'string' && content.trim()) {
          return {
            text: content.trim(),
            model: selectedModel,
            provider: 'Hugging Face Inference',
            executionTimeMs: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        // Try next endpoint or direct pipeline
      }
    }

    // Direct model fallback if router returned error
    try {
      const directEndpoint = `https://api-inference.huggingface.co/models/${selectedModel}`;
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 40000);

      const combinedPrompt = `${params.systemPrompt ? `${params.systemPrompt}\n\n` : ''}${params.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n')}\nassistant:`;

      const response = await fetch(directEndpoint, {
        method: 'POST',
        headers,
        signal: directController.signal,
        body: JSON.stringify({
          inputs: combinedPrompt,
          parameters: {
            max_new_tokens: params.maxTokens ?? 2048,
            temperature: params.temperature ?? 0.4,
            return_full_text: false,
          },
        }),
      });

      clearTimeout(directTimeout);

      if (response.ok) {
        const result = await response.json();
        let extracted = '';
        if (Array.isArray(result) && result[0]?.generated_text) {
          extracted = result[0].generated_text;
        } else if (typeof result === 'object' && result?.generated_text) {
          extracted = result.generated_text;
        }

        if (extracted.trim()) {
          return {
            text: extracted.trim(),
            model: selectedModel,
            provider: 'Hugging Face Direct Model',
            executionTimeMs: Date.now() - startTime,
          };
        }
      }
    } catch (directErr) {
      lastError = directErr;
    }

    const safeErrMsg = redactSecrets(lastError?.message || 'No response from model endpoint');
    throw new Error(`Hugging Face inference failed for ${selectedModel}: ${safeErrMsg}`);
  }

  /**
   * Generate an image using Hugging Face Flux or SD models
   */
  public async generateImage(params: {
    prompt: string;
    model?: string;
    customToken?: string;
  }): Promise<{ dataUrl: string; model: string }> {
    const token = this.getApiKey(params.customToken);
    const selectedModel = params.model || 'black-forest-labs/FLUX.1-schnell';
    const endpoint = `https://api-inference.huggingface.co/models/${selectedModel}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          inputs: params.prompt,
        }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(`Hugging Face image generation HTTP ${response.status}: ${err.slice(0, 200)}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        dataUrl,
        model: selectedModel,
      };
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }
}

export const huggingFaceEngine = new HuggingFaceEngine();
