import { LoaderCircle } from 'lucide-react';
export function StreamingIndicator({ label }: { label: string }) { return <div className="streaming"><LoaderCircle size={15} className="spin" /><span>{label}</span></div>; }
