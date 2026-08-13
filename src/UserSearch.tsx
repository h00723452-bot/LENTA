import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, limit, getDocs, startAt, endAt } from 'firebase/firestore';
import { User } from './types';
import { ArrowLeft, Search } from 'lucide-react';

import UserDisplay from './UserDisplay';

interface UserSearchProps {
  currentUser: User;
  onClose: () => void;
  onSelectUser: (user: {id: string, username: string, isPremium?: boolean, avatarUrl?: string}) => void;
}

export default function UserSearch({ currentUser, onClose, onSelectUser }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{id: string, username: string, isPremium?: boolean, avatarUrl?: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // A simple prefix search hack for Firestore
        const searchPrefix = searchTerm.toLowerCase();
        const endPrefix = searchPrefix + '\uf8ff';

        const q = query(
          collection(db, 'users'),
          orderBy('username'),
          startAt(searchPrefix),
          endAt(endPrefix),
          limit(20)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              username: data.username,
              isPremium: data.isPremium,
              avatarUrl: data.avatarUrl
            };
          })
          .filter(u => u.id !== currentUser.id); // exclude self

        setResults(users);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentUser.id]);

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="sticky top-0 z-40 bg-neutral-950 px-4 py-4 border-b border-neutral-900 flex items-center space-x-3">
        <button 
          onClick={onClose}
          className="p-1 -ml-1 text-neutral-400 hover:text-white transition-colors rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по имени (с учетом регистра)..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-neutral-700 transition-colors"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-8 text-center text-neutral-600 text-sm">
            Поиск...
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-neutral-900">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="w-full p-4 flex items-center space-x-4 hover:bg-neutral-900/50 transition-colors text-left"
              >
                <UserDisplay username={user.username} isPremium={user.isPremium} avatarUrl={user.avatarUrl} size="md" showAvatar={true} />
              </button>
            ))}
          </div>
        ) : searchTerm.trim() ? (
          <div className="p-8 text-center text-neutral-600 text-sm">
            Пользователи не найдены
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-600 text-sm">
            Введите имя пользователя для поиска
          </div>
        )}
      </div>
    </div>
  );
}
