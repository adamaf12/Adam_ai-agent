import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import type http from 'node:http';
import { secretsManager, redactSecrets } from '../security/secrets';

/**
 * Live API WebSocket Bridge
 * Connects browser clients directly to Gemini Live API (gemini-3.8-live)
 * Input: 16kHz PCM Little-Endian
 * Output: 24kHz PCM Little-Endian Audio
 */
export function setupLiveApiWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    const apiKey = secretsManager.getGeminiApiKey();
    if (!apiKey) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            code: 'API_KEY_REQUIRED',
            message: 'Gemini API key is required for Live Voice conversation.',
          })
        );
        clientWs.close(1008, 'API Key Required');
      }
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are ADEM (آدم), an advanced, high-speed executive AI assistant. Be direct, natural, conversational, and precise. Respond in the user\'s language (Arabic, English, French, etc.).',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      text: part.text,
                    })
                  );
                }
              }
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'ready',
            model: 'ADEM-G 3.8 Live',
            rawModel: 'gemini-3.8-live',
            sampleRateInput: 16000,
            sampleRateOutput: 24000,
          })
        );
      }

      clientWs.on('message', (rawData) => {
        try {
          const payload = JSON.parse(rawData.toString());

          // Low-latency ping-pong heartbeat for real-time RTT measurement
          if (payload.type === 'ping') {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'pong',
                  clientTime: payload.clientTime,
                  serverTime: Date.now(),
                })
              );
            }
            return;
          }

          // 1. Audio stream (16kHz PCM)
          if (payload.audio && typeof payload.audio === 'string') {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
          // 2. Multimodal Live Video / Camera / Screen frame (JPEG/WebP)
          else if (
            (payload.type === 'video_frame' || payload.image) &&
            typeof (payload.image || payload.data) === 'string'
          ) {
            const rawImageData = (payload.image || payload.data) as string;
            const cleanBase64 = rawImageData.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
            session.sendRealtimeInput({
              video: {
                mimeType: payload.mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            });
          }
          // 3. Realtime text prompt
          else if (payload.text && typeof payload.text === 'string') {
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (e) {
          // ignore malformed frame
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {}
      });

      clientWs.on('error', (err) => {
        console.warn('[Live API WebSocket client error]:', redactSecrets(err.message || String(err)));
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.error('[Live API Session Connection Error]:', redactSecrets(err.message || String(err)));
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: redactSecrets(err.message || 'Failed to establish Live API connection.'),
          })
        );
        clientWs.close();
      }
    }
  });

  return wss;
}
