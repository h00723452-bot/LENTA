import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface UserDisplayProps {
  username: string;
  isPremium?: boolean;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showAvatar?: boolean;
}

export default function UserDisplay({ username, isPremium, avatarUrl, size = 'sm', showAvatar = true }: UserDisplayProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-24 h-24 text-3xl'
  };

  const nameSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center space-x-3">
      {showAvatar && (
        <div className={`flex-shrink-0 flex items-center justify-center font-light border border-neutral-700 rounded-full overflow-hidden ${isPremium ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-neutral-800 text-neutral-400'} ${sizeClasses[size]}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span>{username.charAt(0).toUpperCase()}</span>
          )}
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        <span className={`font-medium truncate ${nameSizeClasses[size]} ${isPremium ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-transparent bg-clip-text font-bold animate-pulse' : 'text-white'}`}>
          {username}
        </span>
        {isPremium && (
          <CheckCircle2 className="w-4 h-4 text-blue-400" fill="currentColor" stroke="black" />
        )}
      </div>
    </div>
  );
}