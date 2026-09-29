import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
  Square,
  RefreshCw,
  Video,
  VideoOff,
  Monitor,
  Send,
  Camera,
  Layers,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import type { Language } from '../../core/domain';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

type LiveVoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (!inputSampleRate || inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;
  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
}

export function LiveVoiceModal({ isOpen, onClose, language }: LiveVoiceModalProps) {
  const isAr = language === 'ar';
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [hasActiveMicStream, setHasActiveMicStream] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedVoice, setSelectedVoice] = useState<LiveVoiceName>('Zephyr');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [fpsCounter, setFpsCounter] = useState<number>(0);

  // Audio Contexts & WebSockets
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const pingIntervalRef = useRef<number | null>(null);
  const videoFrameIntervalRef = useRef<number | null>(null);

  // Video & Canvas elements
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const userVolumeRef = useRef<number>(0);
  const modelVolumeRef = useRef<number>(0);

  // Stop all actively playing audio chunks when interrupted
  const stopAllPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsModelSpeaking(false);
    modelVolumeRef.current = 0;
  }, []);

  // Converts Float32Array [-1.0, 1.0] to base64-encoded 16-bit linear PCM (Little-Endian)
  const floatTo16BitPCMBase64 = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Converts Base64-encoded 16-bit linear PCM into AudioBuffer (24kHz)
  const base64PCMToAudioBuffer = (ctx: AudioContext, base64: string): AudioBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    const sampleCount = Math.floor(bytes.length / 2);
    const float32 = new Float32Array(sampleCount);

    let sumSquares = 0;
    for (let i = 0; i < sampleCount; i++) {
      const int16 = view.getInt16(i * 2, true);
      const val = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
      float32[i] = val;
      sumSquares += val * val;
    }

    modelVolumeRef.current = Math.min(1, Math.sqrt(sumSquares / (sampleCount || 1)) * 3.5);

    const audioBuffer = ctx.createBuffer(1, sampleCount, 24000);
    audioBuffer.copyToChannel(float32, 0);
    return audioBuffer;
  };

  // Schedule AudioBuffer for gapless playback
  const playAudioChunk = useCallback(
    (base64Audio: string) => {
      if (isSpeakerMuted) return;
      const ctx = outputAudioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      try {
        const buffer = base64PCMToAudioBuffer(ctx, base64Audio);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
          nextStartTimeRef.current = currentTime;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;

        activeSourcesRef.current.push(source);
        setIsModelSpeaking(true);

        source.onended = () => {
          const idx = activeSourcesRef.current.indexOf(source);
          if (idx !== -1) {
            activeSourcesRef.current.splice(idx, 1);
          }
          if (activeSourcesRef.current.length === 0) {
            setIsModelSpeaking(false);
            modelVolumeRef.current = 0;
          }
        };
      } catch (e) {
        console.warn('[Live Playback Error]', e);
      }
    },
    [isSpeakerMuted]
  );

  // Initialize or Request Microphone Stream gracefully without breaking live session
  const initMicrophone = useCallback(async (): Promise<boolean> => {
    setIsRequestingMic(true);
    setMicErrorMessage(null);

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[Multimodal Live] getUserMedia not available in this environment');
      setMicPermissionDenied(true);
      setShowPermissionGuide(true);
      setMicErrorMessage(
        isAr
          ? 'المتصفح أو البيئة الحالية لا تدعم تسجيل الصوت المباشر (getUserMedia غير متوفر).'
          : 'Microphone access is not supported in this browser environment.'
      );
      setIsMuted(true);
      setIsRequestingMic(false);
      return false;
    }

    // 1. Immediately request getUserMedia synchronously within the user gesture chain
    let stream: MediaStream;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (firstErr) {
        // Fallback to basic audio constraints without processing to satisfy mobile browsers
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn('[Multimodal Live] Microphone request error:', err);
      const errName = err?.name || '';
      setIsRequestingMic(false);
      setMicPermissionDenied(true);
      setShowPermissionGuide(true);
      setIsMuted(true);

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setMicPermissionState('denied');
        setMicErrorMessage(
          isAr
            ? 'المتصفح حظر الميكروفون أو تم رفض الإذن. يرجى الضغط على أيقونة القفل 🔒 أعلى شريط العنوان ➔ الأذونات ➔ السماح بالميكروفون (Allow)، ثم اضغط زر "تحقق وإعادة المحاولة" أدناه.'
            : 'Microphone permission was denied or blocked. Click the lock 🔒 icon in your browser URL bar > Site permissions > Allow Microphone, then tap "Re-check & Retry".'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setMicErrorMessage(
          isAr
            ? 'لم يتم العثور على أي لاقط صوت (ميكروفون) متصل بالجهاز.'
            : 'No microphone found on this device.'
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setMicErrorMessage(
          isAr
            ? 'الميكروفون قيد الاستخدام من تطبيق آخر أو تبويب آخر. يرجى إغلاق التطبيقات الصوتية الأخرى والمحاولة مجدداً.'
            : 'Microphone is already in use by another app or tab. Please close other audio applications and try again.'
        );
      } else {
        setMicErrorMessage(
          isAr
            ? `تعذر تشغيل الميكروفون (${err?.message || errName || 'خطأ غير معروف'}). يرجى التحقق من أذونات المتصفح.`
            : `Could not access microphone (${err?.message || errName || 'Unknown error'}).`
        );
      }
      return false;
    }

    // 2. Microphone stream acquired successfully! Setup Web Audio processing
    try {
      audioStreamRef.current = stream;
      setHasActiveMicStream(true);
      setMicPermissionDenied(false);
      setShowPermissionGuide(false);
      setMicErrorMessage(null);
      setMicPermissionState('granted');
      setIsMuted(false);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!inputAudioCtxRef.current || inputAudioCtxRef.current.state === 'closed') {
        inputAudioCtxRef.current = new AudioCtx();
      }
      const inputCtx = inputAudioCtxRef.current;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      if (scriptProcessorRef.current) {
        try {
          scriptProcessorRef.current.disconnect();
        } catch {}
      }

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / (channelData.length || 1));
        userVolumeRef.current = Math.min(1, rms * 5.5);
        setIsUserSpeaking(rms > 0.02);

        // Downsample input from native rate (e.g. 48kHz or 44.1kHz) to 16kHz for Gemini Live API
        const pcm16k = downsampleTo16k(channelData, inputCtx.sampleRate);
        const base64Audio = floatTo16BitPCMBase64(pcm16k);
        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      // Connect to destination through a silent gain node to prevent speaker feedback while keeping processor active
      const silentGain = inputCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(inputCtx.destination);
      return true;
    } catch (err: any) {
      console.warn('[Multimodal Live] Audio Context setup warning:', err);
      return true;
    } finally {
      setIsRequestingMic(false);
    }
  }, [isAr]);

  // Capture video/camera or screen frame and stream via WebSocket (Multimodal Live API)
  const captureAndStreamFrame = useCallback(() => {
    const video = videoElementRef.current;
    const ws = wsRef.current;
    if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    if (!frameCanvasRef.current) {
      frameCanvasRef.current = document.createElement('canvas');
    }
    const canvas = frameCanvasRef.current;

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.55);
    const base64Data = dataUrl.split(',')[1];

    if (base64Data) {
      ws.send(
        JSON.stringify({
          type: 'video_frame',
          image: base64Data,
          mimeType: 'image/jpeg',
          timestamp: Date.now(),
        })
      );
      setFpsCounter((prev) => (prev + 1) % 9999);
    }
  }, []);

  // Connect to Live API WebSocket
  const startSession = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage('');
    stopAllPlayback();

    try {
      // 1. Initialize Output Audio Context for ADEM's speech playback
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Setup WebSocket Bridge to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(selectedVoice)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', clientTime: Date.now() }));
          }
        }, 2500);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pong' && data.clientTime) {
            const rtt = Date.now() - data.clientTime;
            setLatencyMs(rtt);
          } else if (data.type === 'ready') {
            setStatus('connected');
          } else if (data.type === 'audio' && data.audio) {
            playAudioChunk(data.audio);
          } else if (data.type === 'interrupted') {
            stopAllPlayback();
          } else if (data.type === 'transcript') {
            setTranscripts((prev) => [
              ...prev.slice(-12),
              {
                id: Math.random().toString(36).substring(7),
                role: 'model',
                text: data.text,
                timestamp: Date.now(),
              },
            ]);
          } else if (data.type === 'error') {
            setStatus('error');
            setErrorMessage(data.message || 'Live API error');
          }
        } catch (e) {
          console.warn('[Live WS parse error]', e);
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMessage(
          isAr
            ? 'تعذر الاتصال بخدمة Multimodal Live API. يرجى التحقق من مفتاح API والشبكة.'
            : 'Could not connect to Multimodal Live API service. Please verify API key.'
        );
      };

      ws.onclose = () => {
        setStatus((s) => (s === 'connected' ? 'idle' : s));
      };

      // 3. Only auto-initialize microphone if permission was already granted previously
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const p = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermissionState(p.state as any);
          if (p.state === 'granted') {
            await initMicrophone();
          } else {
            setMicPermissionDenied(true);
            if (p.state === 'denied') {
              setShowPermissionGuide(true);
            }
          }
        } else {
          setMicPermissionDenied(true);
        }
      } catch {
        setMicPermissionDenied(true);
      }
    } catch (err: any) {
      console.warn('[Multimodal Live Startup Notice]', err?.message || err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to start Multimodal Live session.');
    }
  }, [initMicrophone, isAr, playAudioChunk, stopAllPlayback]);

  // Start Camera Stream
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      setIsCameraActive(false);
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
      }
      return;
    }

    try {
      if (isScreenShareActive && screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setIsScreenShareActive(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 10, max: 15 },
        },
      });

      videoStreamRef.current = stream;
      setIsCameraActive(true);
      setCameraPermissionDenied(false);

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('[Camera Notice]', err?.name || err?.message || err);
      setCameraPermissionDenied(true);
    }
  };

  // Start Screen Share Stream
  const toggleScreenShare = async () => {
    if (isScreenShareActive) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenShareActive(false);
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
      }
      return;
    }

    try {
      if (isCameraActive && videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
        setIsCameraActive(false);
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 5, max: 10 },
        },
      });

      screenStreamRef.current = stream;
      setIsScreenShareActive(true);

      stream.getVideoTracks()[0].onended = () => {
        setIsScreenShareActive(false);
      };

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('[Screen Share Notice]', err?.name || err?.message || err);
    }
  };

  // Video Frame Sampling Loop (Multimodal Live Vision ~1.2 FPS)
  useEffect(() => {
    if ((isCameraActive || isScreenShareActive) && status === 'connected') {
      if (videoFrameIntervalRef.current) clearInterval(videoFrameIntervalRef.current);
      videoFrameIntervalRef.current = window.setInterval(() => {
        captureAndStreamFrame();
      }, 850);
    } else {
      if (videoFrameIntervalRef.current) {
        clearInterval(videoFrameIntervalRef.current);
        videoFrameIntervalRef.current = null;
      }
    }

    return () => {
      if (videoFrameIntervalRef.current) {
        clearInterval(videoFrameIntervalRef.current);
      }
    };
  }, [isCameraActive, isScreenShareActive, status, captureAndStreamFrame]);

  // Clean up all resources
  const cleanup = useCallback(() => {
    stopAllPlayback();

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (videoFrameIntervalRef.current) {
      clearInterval(videoFrameIntervalRef.current);
      videoFrameIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setStatus('idle');
    setIsUserSpeaking(false);
    setIsModelSpeaking(false);
    setIsCameraActive(false);
    setIsScreenShareActive(false);
    setMicPermissionDenied(false);
    setHasActiveMicStream(false);
  }, [stopAllPlayback]);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, startSession, cleanup]);

  // Send realtime text prompt into the live session
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        text: textInput.trim(),
      })
    );

    setTranscripts((prev) => [
      ...prev.slice(-12),
      {
        id: Math.random().toString(36).substring(7),
        role: 'user',
        text: textInput.trim(),
        timestamp: Date.now(),
      },
    ]);

    setTextInput('');
  };

  // Holographic Wave Visualizer Canvas Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const userVol = userVolumeRef.current;
      const modelVol = modelVolumeRef.current;
      const activeVol = Math.max(userVol, modelVol);

      const baseRadius = 52 + activeVol * 42;
      angle += 0.03 + activeVol * 0.05;

      // Glow backdrop
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.2,
        centerX,
        centerY,
        baseRadius * 1.7
      );

      if (isModelSpeaking) {
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isUserSpeaking) {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        gradient.addColorStop(0.6, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing concentric rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = baseRadius + r * 16 + Math.sin(angle + r * 1.2) * 7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2 - r * 0.4;
        ctx.strokeStyle = isModelSpeaking
          ? `rgba(192, 132, 252, ${0.7 - r * 0.2})`
          : isUserSpeaking
          ? `rgba(52, 211, 153, ${0.7 - r * 0.2})`
          : `rgba(96, 165, 250, ${0.4 - r * 0.1})`;
        ctx.stroke();
      }

      // Dynamic organic wave orb
      const points = 36;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const wave =
          Math.sin(theta * 4 + angle * 2) * (7 + activeVol * 15) +
          Math.cos(theta * 6 - angle) * (4 + activeVol * 9);
        const radius = baseRadius + wave;
        const x = centerX + Math.cos(theta) * radius;
        const y = centerY + Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const coreGradient = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      );

      if (isModelSpeaking) {
        coreGradient.addColorStop(0, '#a855f7');
        coreGradient.addColorStop(1, '#6366f1');
      } else if (isUserSpeaking) {
        coreGradient.addColorStop(0, '#10b981');
        coreGradient.addColorStop(1, '#06b6d4');
      } else {
        coreGradient.addColorStop(0, '#38bdf8');
        coreGradient.addColorStop(1, '#818cf8');
      }

      ctx.fillStyle = coreGradient;
      ctx.shadowColor = isModelSpeaking ? '#a855f7' : isUserSpeaking ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isModelSpeaking, isUserSpeaking]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900/95 border border-slate-700/70 shadow-[0_0_90px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{isAr ? 'المحادثة الحية فائقة السرعة' : 'Multimodal Live API'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ADEM-G 3.8 Live
                </span>
                {latencyMs !== null && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <Zap size={10} className="fill-current" />
                    {latencyMs}ms WebSocket
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {isAr
                  ? 'دفق ثنائي متزامن للصوت والرؤية الحية عبر بروتوكول WebSockets بأقل زمن وصول'
                  : 'Ultra-low latency bidirectional audio & vision stream via WebSockets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Multimodal Viewport: Video / Camera Preview & Holographic Visualizer */}
        <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-4 bg-gradient-to-b from-slate-900/60 via-slate-950/70 to-slate-900/60 overflow-hidden min-h-[240px]">
          {/* Live Camera or Screen Share Viewfinder */}
          {(isCameraActive || isScreenShareActive) && (
            <div className="relative w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 shadow-xl shadow-cyan-950/30 bg-black flex items-center justify-center">
              <video
                ref={videoElementRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-400/40 text-[10px] font-mono text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{isScreenShareActive ? (isAr ? 'شاشة نشطة' : 'Screen Active') : (isAr ? 'كاميرا نشطة' : 'Live Camera')}</span>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[9px] font-mono text-slate-300">
                1.2 FPS Stream
              </div>
              <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-400/60 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            </div>
          )}

          {/* Holographic Wave Orb */}
          <div className="relative flex flex-col items-center justify-center">
            <canvas
              ref={visualizerCanvasRef}
              width={280}
              height={220}
              className="w-[240px] h-[190px] sm:w-[260px] sm:h-[200px]"
            />

            {/* Status Pill */}
            <div className="mt-1 flex items-center gap-2">
              {status === 'connecting' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <RefreshCw size={12} className="animate-spin" />
                  {isAr ? 'جاري الاتصال بـ WebSockets...' : 'Connecting WebSocket...'}
                </span>
              )}
              {status === 'connected' && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {isModelSpeaking
                    ? isAr
                      ? 'أدم يتحدث...'
                      : 'ADEM speaking...'
                    : isUserSpeaking
                    ? isAr
                      ? 'يستمع إليك...'
                      : 'Listening...'
                    : (isCameraActive || isScreenShareActive)
                    ? isAr
                      ? 'يراك ويستمع إليك مباشرة'
                      : 'Watching & listening live'
                    : micPermissionDenied
                    ? isAr
                      ? 'متصل عبر WebSockets (بانتظار الميكروفون أو النص)'
                      : 'Connected (Voice or Text ready)'
                    : isAr
                    ? 'جاهز للاستماع والرؤية'
                    : 'Ready, speak freely'}
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  <AlertCircle size={13} />
                  {errorMessage || (isAr ? 'فشل الاتصال' : 'Connection Failed')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* If inside iframe (AI Studio Preview Pane) */}
        {!hasActiveMicStream && typeof window !== 'undefined' && window.self !== window.top && (
          <div className="mx-3 sm:mx-5 mb-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-purple-950/80 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col gap-3 text-xs animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
                <ExternalLink size={20} className="animate-pulse text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-cyan-100 flex items-center gap-1.5 flex-wrap">
                  <span>{isAr ? 'فتح في نافذة مستقلة لتشغيل الميكروفون' : 'Open in Standalone Tab for Microphone'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {isAr ? 'موصى به' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {isAr
                    ? 'متصفحات الهواتف (Chrome) تقيد الميكروفون داخل إطار المعاينة الداخلي. اضغط الزر أدناه لفتح التطبيق مباشرة في متصفحك وسيعمل الميكروفون فوراً بنقرة واحدة.'
                    : 'Mobile browsers block microphone inside embedded preview iframes. Click below to open in your browser directly and talk with ADEM.'}
                </p>
              </div>
            </div>

            {/* Huge Glowing 1-Click Launch Button */}
            <a
              href={`${window.location.origin}${window.location.pathname}?live=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-center no-underline"
            >
              <ExternalLink size={16} />
              <span>{isAr ? '🚀 فتح التطبيق في نافذة مستقلة وتفعيل الصوت فوراً' : '🚀 Open in New Tab & Enable Mic Now'}</span>
            </a>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>{isAr ? 'أو يمكنك التفاعل بالنص والكاميرا أدناه دون ميكروفون:' : 'Or type and use camera live below:'}</span>
              <button
                type="button"
                onClick={initMicrophone}
                disabled={isRequestingMic}
                className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
              >
                {isRequestingMic ? (isAr ? 'جاري الفحص...' : 'Trying...') : (isAr ? 'تجربة طلب الإذن هنا' : 'Try permission here')}
              </button>
            </div>
          </div>
        )}

        {/* If in Standalone / Full Browser Window */}
        {!hasActiveMicStream && typeof window !== 'undefined' && window.self === window.top && (
          <div className="mx-3 sm:mx-5 mb-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-purple-500/10 to-emerald-500/15 border border-emerald-500/35 shadow-lg flex flex-col gap-2.5 text-xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-emerald-200">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
                  <Mic size={18} className="animate-pulse" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {showPermissionGuide || micPermissionState === 'denied'
                        ? isAr
                          ? 'إذن الميكروفون محظور في إعدادات المتصفح'
                          : 'Microphone Permission Blocked'
                        : isAr
                        ? 'تفعيل الميكروفون للتحدث الصوتي المباشر'
                        : 'Enable Microphone for Live Voice'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                    {micErrorMessage ||
                      (isAr
                        ? 'انقر على الزر أدناه ليطلب المتصفح الإذن، ثم اضغط «سماح» (Allow) في النافذة المنبثقة للتحدث مع آدم.'
                        : 'Click below to prompt your browser for permission, then choose "Allow" to talk with ADEM.')}
                  </p>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={initMicrophone}
                disabled={isRequestingMic}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shrink-0 shadow-lg shadow-emerald-950/40"
              >
                <Mic size={16} />
                <span>
                  {isRequestingMic
                    ? isAr
                      ? 'جاري طلب الإذن...'
                      : 'Requesting...'
                    : showPermissionGuide || micPermissionState === 'denied'
                    ? isAr
                      ? '🔄 إعادة المحاولة والتحقق'
                      : '🔄 Retry & Verify'
                    : isAr
                    ? '🎙️ السماح بالميكروفون والبدء'
                    : '🎙️ Allow Microphone & Start'}
                </span>
              </button>
            </div>

            {(showPermissionGuide || micPermissionState === 'denied') && (
              <div className="pt-2 border-t border-emerald-500/25 flex flex-col gap-1 text-[11px] text-slate-300">
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <AlertCircle size={13} />
                  {isAr ? 'إذا لم يظهر مربع الحوار، قم بإلغاء الحظر يدوياً:' : 'If dialog does not appear, unblock manually:'}
                </span>
                <p className="text-slate-300/90 pr-1">
                  {isAr
                    ? 'اضغط على أيقونة القفل 🔒 أعلى شريط عنوان المتصفح ➔ أذونات الموقع (Permissions) ➔ الميكروفون ➔ غيّرها إلى "سماح" (Allow)، ثم اضغط زر إعادة المحاولة.'
                    : 'Tap the lock 🔒 icon in address bar > Permissions > Microphone > Allow, then tap Retry.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Realtime Transcripts Feed */}
        {transcripts.length > 0 && (
          <div className="px-5 py-2 max-h-28 overflow-y-auto border-t border-slate-800/60 bg-slate-950/50 text-xs space-y-1 scrollbar-thin">
            {transcripts.slice(-3).map((t) => (
              <div key={t.id} className="flex items-start gap-2">
                <span className="font-bold text-purple-400 flex-shrink-0">
                  {t.role === 'model' ? (isAr ? 'أدم:' : 'ADEM:') : isAr ? 'أنت:' : 'You:'}
                </span>
                <p className="text-slate-200 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Text Input for Hybrid Live Interaction */}
        <form onSubmit={handleSendText} className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/90 border-t border-slate-800/70">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              isAr
                ? 'أو اكتب نصاً للتفاعل الفوري مع البث الحي...'
                : 'Or type a prompt to send into the live session...'
            }
            className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || status !== 'connected'}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition cursor-pointer"
            title={isAr ? 'إرسال' : 'Send'}
          >
            <Send size={13} />
          </button>
        </form>

        {/* Main Multimodal Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-t border-slate-800/90">
          {/* Left Controls: Mic, Speaker, Camera, Screen Share */}
          <div className="flex items-center gap-2">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!hasActiveMicStream || !audioStreamRef.current) {
                  initMicrophone();
                } else {
                  setIsMuted(!isMuted);
                }
              }}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                !hasActiveMicStream
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/25 active:scale-95'
                  : isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              }`}
              title={
                !hasActiveMicStream
                  ? (isAr ? 'اضغط لتفعيل الميكروفون' : 'Click to enable microphone')
                  : isMuted
                  ? (isAr ? 'تفعيل الميكروفون' : 'Unmute Mic')
                  : isAr
                  ? 'كتم الميكروفون'
                  : 'Mute Mic'
              }
            >
              {!hasActiveMicStream ? (
                <Mic size={15} className="animate-pulse text-slate-950" />
              ) : isMuted ? (
                <MicOff size={15} />
              ) : (
                <Mic size={15} className="text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {!hasActiveMicStream
                  ? (isAr ? 'تفعيل الميكروفون' : 'Enable Mic')
                  : isMuted
                  ? (isAr ? 'مكتوم' : 'Muted')
                  : (isAr ? 'نشط' : 'Active')}
              </span>
            </button>

            {/* Camera Toggle (Multimodal Live Vision) */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                isCameraActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/15'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isCameraActive ? (isAr ? 'إيقاف الكاميرا' : 'Stop Camera') : isAr ? 'تفعيل الكاميرا للرؤية الحية' : 'Start Camera Vision'}
            >
              {isCameraActive ? <Video size={15} className="text-cyan-400" /> : <VideoOff size={15} />}
              <span className="hidden sm:inline">{isCameraActive ? (isAr ? 'الكاميرا نشطة' : 'Camera On') : isAr ? 'كاميرا' : 'Camera'}</span>
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                isScreenShareActive
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/15'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isScreenShareActive ? (isAr ? 'إيقاف مشاركة الشاشة' : 'Stop Screen Share') : isAr ? 'مشاركة الشاشة للتحليل الحي' : 'Share Screen'}
            >
              <Monitor size={15} className={isScreenShareActive ? 'text-purple-400' : ''} />
              <span className="hidden sm:inline">{isScreenShareActive ? (isAr ? 'الشاشة نشطة' : 'Screen On') : isAr ? 'شاشة' : 'Screen'}</span>
            </button>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isSpeakerMuted) stopAllPlayback();
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                isSpeakerMuted
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isSpeakerMuted ? (isAr ? 'تشغيل الصوت' : 'Unmute') : isAr ? 'كتم السماعة' : 'Mute'}
            >
              {isSpeakerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          {/* Right Controls: Interrupt, Reconnect, Close */}
          <div className="flex items-center gap-2">
            {isModelSpeaking && (
              <button
                type="button"
                onClick={stopAllPlayback}
                className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-purple-500/20"
              >
                <Square size={12} fill="currentColor" />
                <span>{isAr ? 'مقاطعة' : 'Interrupt'}</span>
              </button>
            )}

            {status === 'error' && (
              <button
                type="button"
                onClick={startSession}
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>{isAr ? 'إعادة' : 'Retry'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-950/40 active:scale-95"
            >
              {isAr ? 'إنهاء الجلسة' : 'End Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
