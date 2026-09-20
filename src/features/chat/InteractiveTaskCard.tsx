import { useState } from 'react';
import { CheckCircle2, Circle, ListTodo, Plus, Sparkles, Check } from 'lucide-react';
import type { ViewId } from '../../core/domain';

export interface TaskCardItem {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  notes?: string;
}

export interface TaskCardPayload {
  title: string;
  tasks: TaskCardItem[];
}

interface InteractiveTaskCardProps {
  payload: TaskCardPayload;
  language: 'ar' | 'en';
  onNavigateView?: (view: ViewId) => void;
}

export function InteractiveTaskCard({
  payload,
  language,
  onNavigateView,
}: InteractiveTaskCardProps) {
  const isAr = language === 'ar';
  const [tasks, setTasks] = useState<TaskCardItem[]>(payload.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: TaskCardItem = {
      id: `task-${Date.now()}`,
      title: newTaskText.trim(),
      priority: 'medium',
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskText('');
    setShowAddInput(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="my-3 rounded-2xl border border-amber-500/30 bg-slate-950/85 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-500/25 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <ListTodo size={14} />
          </div>
          <div>
            <span className="font-bold text-slate-100">{payload.title}</span>
            <div className="text-[10px] text-amber-400 flex items-center gap-1.5">
              <span>{isAr ? 'مصفوفة المهام التفاعلية المباشرة' : 'Interactive Task Matrix'}</span>
              <span>•</span>
              <span>{completedCount}/{tasks.length} ({progressPercent}%)</span>
            </div>
          </div>
        </div>

        {onNavigateView && (
          <button
            type="button"
            onClick={() => onNavigateView('tasks')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
          >
            {isAr ? 'عرض المهام الشاملة ↗' : 'View Full Planner ↗'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task List */}
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const isCompleted = !!task.completed;
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-200'
                }`}
              >
                <div className="mt-0.5 text-amber-400">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <Circle size={16} className="text-slate-500 hover:text-amber-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium leading-tight ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </div>
                  {task.notes && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{task.notes}</div>
                  )}
                </div>

                {task.priority && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                      task.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.priority === 'high'
                      ? isAr ? 'عاجل' : 'high'
                      : task.priority === 'medium'
                      ? isAr ? 'مهم' : 'med'
                      : isAr ? 'عادي' : 'low'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Add quick subtask inline */}
        {showAddInput ? (
          <form onSubmit={handleAddTask} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={isAr ? 'اكتب عنوان المهمة الجديدة...' : 'New task title...'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer"
            >
              {isAr ? 'إضافة' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddInput(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white transition-all cursor-pointer"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="w-full py-1.5 rounded-xl border border-dashed border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>{isAr ? 'إضافة خطوة أو مهمة جديدة للائحة' : 'Add new task step'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
