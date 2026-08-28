import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AgentAvatarProps {
  isUser?: boolean;
  className?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  isUser = false,
  className = 'w-9 h-9 rounded-2xl',
}) => {
  const [imgError, setImgError] = useState(false);

  if (isUser) {
    return (
      <div
        className={`${className} flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800`}
      >
        <User className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md overflow-hidden bg-slate-950 border border-cyan-500/50 shadow-cyan-500/30 relative group`}
    >
      {!imgError ? (
        <img
          src="/app-icon.jpg"
          alt="ADEM AI Agent"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : null}

      {/* Persistent Vector Hexagonal 'A' Logo Emblem matching ADEM AI brand */}
      {(imgError || !true) && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-cyan-400">
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="50,5 93,27 93,73 50,95 7,73 7,27"
              stroke="url(#hexGradient)"
              strokeWidth="6"
              fill="rgba(15, 23, 42, 0.85)"
            />
            <path
              d="M50 22L72 70H59L50 48L41 70H28L50 22Z"
              fill="url(#aGradient)"
              filter="drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))"
            />
            <defs>
              <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="aGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
};
