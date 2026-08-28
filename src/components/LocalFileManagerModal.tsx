import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Plus,
  Trash2,
  Download,
  X,
  FileText,
  Search,
  Eye,
  Edit3,
  Check,
} from 'lucide-react';
import { LocalFile } from '../types';
import { deleteLocalFile, loadLocalFiles, saveLocalFile } from '../lib/storage';

interface LocalFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  onFileChanged?: () => void;
}

export const LocalFileManagerModal: React.FC<LocalFileManagerModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  onFileChanged,
}) => {
  const [files, setFiles] = useState<LocalFile[]>(loadLocalFiles());
  const [search, setSearch] = useState('');
  const [activeFile, setActiveFile] = useState<LocalFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  if (!isOpen) return null;

  const refreshFiles = () => {
    const loaded = loadLocalFiles();
    setFiles(loaded);
    if (onFileChanged) onFileChanged();
  };

  const handleSelectFile = (file: LocalFile) => {
    setActiveFile(file);
    setEditContent(file.content);
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleSaveEdit = () => {
    if (!activeFile) return;
    const updated = saveLocalFile(activeFile.name, editContent, activeFile.path);
    setActiveFile(updated);
    setIsEditing(false);
    refreshFiles();
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(isArabic ? `هل أنت مقتنع بحذف الملف "${name}"؟` : `Delete file "${name}"?`)) {
      deleteLocalFile(id);
      if (activeFile?.id === id) {
        setActiveFile(null);
      }
      refreshFiles();
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const created = saveLocalFile(name, newFileContent);
    setActiveFile(created);
    setNewFileName('');
    setNewFileContent('');
    setIsCreatingNew(false);
    refreshFiles();
  };

  const handleDownloadFile = (file: LocalFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isArabic ? 'إدارة الملفات ومساحة العمل' : 'Workspace Local File Manager'}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                  {files.length} {isArabic ? 'ملفات' : 'files'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'مجلد العمليات المستقل الخاص بوكيل الذكاء الاصطناعي أدم'
                  : 'Dedicated agent workspace storage for autonomous file management'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: File Explorer Tree */}
          <div className="w-1/3 border-l dark:border-slate-800 border-slate-200 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
            {/* Search & New File bar */}
            <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isArabic ? 'بحث في الملفات...' : 'Search files...'}
                  className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(true);
                  setActiveFile(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isArabic ? 'إنشاء ملف جديد' : 'New File'}</span>
              </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 theme-scrollbar">
              {filteredFiles.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  {isArabic ? 'لا توجد ملفات حالياً' : 'No files found'}
                </p>
              ) : (
                filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                      activeFile?.id === file.id
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-4 h-4 shrink-0 text-teal-500" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{file.size} B</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: File Viewer / Editor / Creator */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 p-6 overflow-hidden">
            {isCreatingNew ? (
              <div className="flex-1 flex flex-col space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-500" />
                  <span>{isArabic ? 'إنشاء ملف نصي/برمجي جديد' : 'Create New File'}</span>
                </h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {isArabic ? 'اسم الملف (مثال: document.txt أو notes.md)' : 'File Name'}
                  </label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="my_file.txt"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {isArabic ? 'محتوى الملف' : 'File Content'}
                  </label>
                  <textarea
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    placeholder={isArabic ? 'اكتب محتوى الملف هنا...' : 'Type content here...'}
                    className="flex-1 w-full p-3 font-mono text-xs rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleCreateFile}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                  >
                    {isArabic ? 'حفظ الملف' : 'Save File'}
                  </button>
                </div>
              </div>
            ) : activeFile ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File Detail Bar */}
                <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {activeFile.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {activeFile.path} • {activeFile.size} Bytes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isArabic ? 'حفظ التعديلات' : 'Save'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                      >
                        <Edit3 className="w-4 h-4 text-teal-500" />
                        <span>{isArabic ? 'تعديل' : 'Edit'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadFile(activeFile)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={isArabic ? 'تحميل الملف' : 'Download File'}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteFile(activeFile.id, activeFile.name)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                      title={isArabic ? 'حذف الملف' : 'Delete File'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor / Content Area */}
                <div className="flex-1 pt-4 flex flex-col overflow-hidden">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full p-4 font-mono text-xs rounded-2xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none resize-none"
                    />
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 theme-scrollbar">
                      {activeFile.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Folder className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">
                  {isArabic ? 'اختر ملفاً من القائمة أو أنشئ ملفاً جديداً' : 'Select a file or create a new one'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
