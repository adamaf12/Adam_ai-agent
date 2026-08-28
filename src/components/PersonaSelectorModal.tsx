import React, { useState } from 'react';
import { X, Sparkles, Briefcase, GraduationCap, Code, Plus, Check, Trash2, UserCheck, Shield, Zap, Terminal, Feather } from 'lucide-react';
import { AgentPersona } from '../types';

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: AgentPersona[];
  activePersonaId: string;
  onSelectPersona: (personaId: string) => void;
  onCreateCustomPersona?: (persona: Omit<AgentPersona, 'id' | 'isCustom'>) => void;
  onDeleteCustomPersona?: (id: string) => void;
  isArabic: boolean;
}

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({
  isOpen,
  onClose,
  personas,
  activePersonaId,
  onSelectPersona,
  onCreateCustomPersona,
  onDeleteCustomPersona,
  isArabic,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [roleAr, setRoleAr] = useState('');
  const [roleEn, setRoleEn] = useState('');
  const [systemPromptAddon, setSystemPromptAddon] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [tone, setTone] = useState<AgentPersona['tone']>('friendly');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleAr.trim() || !systemPromptAddon.trim() || !onCreateCustomPersona) return;

    onCreateCustomPersona({
      name: name.trim(),
      roleAr: roleAr.trim(),
      roleEn: roleEn.trim() || roleAr.trim(),
      systemPromptAddon: systemPromptAddon.trim(),
      icon,
      tone,
    });

    setName('');
    setRoleAr('');
    setRoleEn('');
    setSystemPromptAddon('');
    setShowCreateForm(false);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-cyan-400" />;
      case 'Feather':
        return <Feather className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isArabic ? 'شخصيات الوكيل آدم (Agent Personas)' : 'Agent Personas'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30">
                  Multi-Agent Modes
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'اختر النمط والتخصص المناسب لآدم حسب طبيعة مهامك اليومية'
                  : 'Select specialized expert mode tailored to your current workflow'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 theme-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {personas.map((persona) => {
              const isActive = persona.id === activePersonaId;
              return (
                <div
                  key={persona.id}
                  onClick={() => onSelectPersona(persona.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-700 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {getIconComponent(persona.icon)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          {persona.name}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {isArabic ? persona.roleAr : persona.roleEn}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="p-1 rounded-full bg-purple-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    "{persona.systemPromptAddon}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                      {isArabic ? `النبرة: ${persona.tone}` : `Tone: ${persona.tone}`}
                    </span>

                    {persona.isCustom && onDeleteCustomPersona && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomPersona(persona.id);
                        }}
                        className="text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isArabic ? 'حذف' : 'Delete'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create custom persona toggle/form */}
          {onCreateCustomPersona && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800/60 hover:border-purple-500 dark:hover:border-purple-500 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isArabic ? 'إنشاء شخصية أو تخصص مخصص لآدم' : 'Create Custom Persona for Adam'}</span>
                </button>
              ) : (
                <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {isArabic ? 'إعداد شخصية مخصصة جديدة:' : 'Setup New Custom Persona:'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {isArabic ? 'اسم الشخصية' : 'Persona Name'}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isArabic ? 'مثال: آدم - مستشار التسويق' : 'e.g., Adam - Marketing Advisor'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        {isArabic ? 'الدور والوظيفة (بالعربية)' : 'Role Description (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={roleAr}
                        onChange={(e) => setRoleAr(e.target.value)}
                        placeholder={isArabic ? 'خبير استراتيجي في التسويق والإعلانات' : 'Marketing strategist expert'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isArabic ? 'تعليمات النظام المخصصة (System Prompt Addon)' : 'Custom System Prompt Addon'}
                    </label>
                    <textarea
                      rows={2}
                      value={systemPromptAddon}
                      onChange={(e) => setSystemPromptAddon(e.target.value)}
                      placeholder={isArabic ? 'ركز على أسلوب الإعلانات، وتحليل المنافسين، وكتابة المحتوى التسويقي الجذاب...' : 'Focus on ad copy, competitor analysis...'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
                    >
                      {isArabic ? 'حفظ الشخصية' : 'Save Persona'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
