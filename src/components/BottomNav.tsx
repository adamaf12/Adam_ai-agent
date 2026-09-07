import { Brain, CalendarCheck, Film, MessageCircle, Settings2, Sparkles, type LucideIcon } from 'lucide-react';
import type { Language, ViewId } from '../core/domain';
import { copy } from '../core/i18n';

const items: Array<{ id: ViewId; icon: LucideIcon; key: keyof ReturnType<typeof copy>['nav'] }> = [
  { id: 'chat', icon: MessageCircle, key: 'chat' },
  { id: 'tasks', icon: CalendarCheck, key: 'tasks' },
  { id: 'workspace', icon: Sparkles, key: 'workspace' },
  { id: 'media', icon: Film, key: 'media' },
  { id: 'memory', icon: Brain, key: 'memory' },
  { id: 'settings', icon: Settings2, key: 'settings' },
];

export function BottomNav({ active, language, onChange }: { active: ViewId; language: Language; onChange: (view: ViewId) => void }) {
  const labels = copy(language).nav;
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(({ id, icon: Icon, key }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            className={isActive ? 'nav-item nav-item--active' : 'nav-item'}
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{labels[key]}</span>
          </button>
        );
      })}
    </nav>
  );
}

