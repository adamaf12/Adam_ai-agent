import { Bot, Copy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../core/domain';

export function MessageBubble({ message, language }: { message: Message; language: 'ar' | 'en' }) {
  const assistant = message.role === 'assistant';
  const copy = () => navigator.clipboard?.writeText(message.content);
  return <article className={assistant ? 'message-row' : 'message-row message-row--user'}><div className={assistant ? 'message-avatar' : 'message-avatar message-avatar--user'}>{assistant ? <Bot size={16} /> : <User size={16} />}</div><div className="message-body"><div className="message-meta">{assistant ? 'Adam' : (language === 'ar' ? 'أنت' : 'You')}<span>{new Date(message.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="message-content">{assistant ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ' '}</ReactMarkdown> : message.content}</div>{assistant && message.content && <button className="message-action" onClick={copy} aria-label="Copy"><Copy size={13} /></button>}</div></article>;
}
