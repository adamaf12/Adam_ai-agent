import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  Search,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Radio,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { VoiceInteractionLog } from '../types';
import {
  getVoiceInteractions,
  deleteVoiceInteraction,
  clearVoiceInteractions,
} from '../lib/storage';
import { speakWithGlobalVoice, stopAllSpeech } from '../lib/voiceEngine';

interface VoiceInteractionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoiceCommand?: (commandText: string) => void;
  isArabic?: boolean;
}

export const VoiceInteractionHistoryModal: React.FC<VoiceInteractionHistoryModalProps> = ({
  isOpen,
  onClose,
  onSendVoiceCommand,
  isArabic = true,
}) => {
  const [logs, setLogs] = useState<VoiceInteractionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    } else {
      stopAllSpeech();
      setPlayingId(null);
    }
  }, [isOpen]);

  const loadHistory = () => {
    const data = getVoiceInteractions();
    setLogs(data);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        isArabic
          ? 'هل أنت تأكد من مسح جميع سجلات الأوامر الصوتية والتفريغ النصي؟'
          : 'Are you sure you want to clear all voice interaction history?'
      )
    ) {
      clearVoiceInteractions();
      setLogs([]);
      stopAllSpeech();
    }
  };

  const handleDeleteOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteVoiceInteraction(id);
    setLogs((prev) => prev.filter((item) => item.id !== id));
    if (playingId === id) {
      stopAllSpeech();
      setPlayingId(null);
    }
  };

  const handleToggleSpeak = (item: VoiceInteractionLog, type: 'transcript' | 'response') => {
    const targetKey = `${item.id}-${type}`;
    if (playingId === targetKey) {
      stopAllSpeech();
      setPlayingId(null);
    } else {
      stopAllSpeech();
      setPlayingId(targetKey);
      const textToSpeak =
        type === 'transcript'
          ? `${isArabic ? 'الأمر الصوتي' : 'Voice Command'}: ${item.transcript}`
          : `${isArabic ? 'رد آدم' : 'Agent Response'}: ${item.agentResponse}`;

      speakWithGlobalVoice(textToSpeak, 'adam-neural', {
        onEnd: () => setPlayingId(null),
        onError: () => setPlayingId(null),
      });
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `adam_voice_interactions_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((item) => {
    const matchesFilter =
      selectedSourceFilter === 'all' || item.source === selectedSourceFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.agentResponse.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'wake_word':
        return {
          label: isArabic ? 'كلمة التنبيه (آدم)' : 'Wake Word (Adam)',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: Radio,
        };
      case 'continuous_mic':
        return {
          label: isArabic ? 'الاستماع المستمر' : 'Continuous Mic',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: Zap,
        };
      case 'live_voice_call':
        return {
          label: isArabic ? 'المكالمة المباشرة' : 'Live Voice Call',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: Volume2,
        };
      case 'mic_button':
      default:
        return {
          label: isArabic ? 'ميكروفون مباشر' : 'Direct Mic',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: Mic,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {isArabic ? 'سجل الأوامر الصوتية والتفريغ النصي' : 'Voice Interaction History Panel'}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  {logs.length} {isArabic ? 'تفاعل صوتي' : 'voice interactions'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isArabic
                  ? 'سجل مفصل يطابق النص المنطوق مع ردود الوكيل الذكي أدم لسهولة المراجعة وإعادة التشغيل'
                  : 'Displays transcriptions alongside agent responses for easy review, playback, and re-triggering.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: isArabic ? '🎙️ كل الأوامر' : 'All Voice Logs' },
              { id: 'wake_word', label: isArabic ? '📻 كلمة التنبيه' : 'Wake Word' },
              { id: 'continuous_mic', label: isArabic ? '⚡ استماع مستمر' : 'Continuous' },
              { id: 'mic_button', label: isArabic ? '🎤 ميكروفون مباشر' : 'Direct Mic' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSourceFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedSourceFilter === tab.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Bulk Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={isArabic ? 'بحث في الأوامر والتفريغ النصي...' : 'Search transcriptions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <button
              onClick={handleExportJson}
              title={isArabic ? 'تصدير السجل بتنسيق JSON' : 'Export JSON'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <Download className="w-4 h-4" />
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isArabic ? 'مسح الكل' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar theme-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Mic className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-400">
                {searchQuery
                  ? isArabic
                    ? 'لا توجد نتائج مطابقة لبحثك في سجل الأوامر الصوتية.'
                    : 'No matching voice interactions found.'
                  : isArabic
                  ? 'لا يوجد سجل أوامر صوتية حتى الآن. ابدأ بالحديث مع أدم عبر الميكروفون!'
                  : 'No voice interactions recorded yet. Speak to Adam via the microphone to populate!'}
              </p>
            </div>
          ) : (
            filteredLogs.map((item) => {
              const badge = getSourceBadge(item.source);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-md hover:shadow-cyan-950/20 group"
                >
                  {/* Card Header metadata */}
                  <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      {item.confidence && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {isArabic ? 'دقة التفريغ' : 'Accuracy'}: {(item.confidence * 100).toFixed(0)}%
                        </span>
                      )}

                      {item.modelUsed && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 hidden sm:inline-block">
                          {item.modelUsed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.timestamp).toLocaleString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <button
                        onClick={(e) => handleDeleteOne(item.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        title={isArabic ? 'حذف هذا السجل' : 'Delete log'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Conversation Pair Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* User Transcription Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            {isArabic ? 'التفريغ النصي للأمر الصوتي:' : 'Spoken Voice Transcription:'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          "{item.transcript}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
                        <button
                          onClick={() => handleToggleSpeak(item, 'transcript')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                            playingId === `${item.id}-transcript`
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {playingId === `${item.id}-transcript` ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              {isArabic ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-blue-400" />
                              {isArabic ? 'استماع للأمر' : 'Listen'}
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyText(item.transcript, `${item.id}-t`)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title={isArabic ? 'نسخ النص' : 'Copy transcript'}
                          >
                            {copiedId === `${item.id}-t` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onSendVoiceCommand && (
                            <button
                              onClick={() => {
                                onSendVoiceCommand(item.transcript);
                                onClose();
                              }}
                              className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                              title={isArabic ? 'إعادة إرسال هذا الأمر الآن' : 'Re-run voice command'}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{isArabic ? 'إعادة التشغيل' : 'Re-run'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agent Response Box */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            {isArabic ? 'رد الوكيل أدم المباشر:' : 'Triggered Agent Response:'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {item.agentResponse}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10 mt-1">
                        <button
                          onClick={() => handleToggleSpeak(item, 'response')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                            playingId === `${item.id}-response`
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300'
                          }`}
                        >
                          {playingId === `${item.id}-response` ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              {isArabic ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-emerald-400" />
                              {isArabic ? 'استماع للرد بصوت أدم' : 'Listen Response'}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopyText(item.agentResponse, `${item.id}-r`)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title={isArabic ? 'نسخ الرد' : 'Copy response'}
                        >
                          {copiedId === `${item.id}-r` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              {isArabic
                ? 'يتم توثيق كل أمر صوتي وتفريغه نصياً تلقائياً لضمان أعلى مستوى من المتابعة الدقيقة.'
                : 'All voice interactions are recorded and transcribed automatically for continuous review.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
