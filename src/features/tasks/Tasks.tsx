import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, Circle, Flag } from 'lucide-react';
import type { Language, Task, TaskPriority } from '../../core/domain';
import { loadTasks, saveTasks } from '../../core/storage/collections';

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const labels = { ar: { title:'مهامي', subtitle:'حوّل أفكارك إلى أفعال واضحة.', add:'إضافة مهمة', placeholder:'ما الذي تريد إنجازه؟', empty:'لا توجد مهام بعد.', all:'الكل', active:'قيد التنفيذ', done:'مكتملة' }, en: { title:'Tasks', subtitle:'Turn intentions into clear actions.', add:'Add task', placeholder:'What do you want to accomplish?', empty:'No tasks yet.', all:'All', active:'Active', done:'Done' } };

export function Tasks({ language }: { language: Language }) {
 const t=labels[language]; const [tasks,setTasks]=useState<Task[]>(loadTasks); const [draft,setDraft]=useState(''); const [filter,setFilter]=useState<'all'|'active'|'done'>('all');
 const visible=useMemo(()=>tasks.filter(x=>filter==='all'||(filter==='done'?x.completed:!x.completed)),[tasks,filter]);
 const add=()=>{const title=draft.trim();if(!title)return;const now=Date.now();const next=[{id:uid(),title,notes:'',completed:false,priority:'medium' as TaskPriority,createdAt:now,updatedAt:now},...tasks];setTasks(next);saveTasks(next);setDraft('');};
 const toggle=(id:string)=>{const next=tasks.map(x=>x.id===id?{...x,completed:!x.completed,updatedAt:Date.now()}:x);setTasks(next);saveTasks(next)};
 const remove=(id:string)=>{const next=tasks.filter(x=>x.id!==id);setTasks(next);saveTasks(next)};
 return <section className="feature-page"><div className="feature-heading"><div><span className="eyebrow">ADAM / TASKS</span><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="feature-stat"><strong>{tasks.filter(x=>!x.completed).length}</strong><span>{t.active}</span></div></div>
 <div className="task-composer"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder={t.placeholder} aria-label={t.placeholder}/><button onClick={add}><Plus size={18}/>{t.add}</button></div>
 <div className="segmented">{(['all','active','done'] as const).map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{t[x]}</button>)}</div>
 <div className="task-list">{visible.length===0?<div className="empty-state"><Circle size={28}/><strong>{t.empty}</strong></div>:visible.map(task=><article className={`task-card ${task.completed?'is-done':''}`} key={task.id}><button className="check-button" onClick={()=>toggle(task.id)} aria-label="toggle">{task.completed?<Check size={17}/>:<Circle size={17}/>}</button><div className="task-copy"><strong>{task.title}</strong><span><Flag size={13}/>{task.priority}</span></div><button className="icon-button" onClick={()=>remove(task.id)} aria-label="delete"><Trash2 size={17}/></button></article>)}</div></section>;
}
