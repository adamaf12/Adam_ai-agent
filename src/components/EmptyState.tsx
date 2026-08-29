import { Sparkles } from 'lucide-react';
export function EmptyState({ title, body }: { title: string; body: string }) { return <div className="empty-state"><div className="empty-icon"><Sparkles size={21} /></div><h2>{title}</h2><p>{body}</p></div>; }
