import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { User, Message, Conversation } from './types';
import { Search, User as UserIcon } from 'lucide-react';
import Chat from './Chat';
import UserSearch from './UserSearch';
import UserDisplay from './UserDisplay';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function MessagesList({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<{id: string, username: string, isPremium?: boolean, avatarUrl?: string} | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const userCache = React.useRef(new Map<string, any>());

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      const convosMap = new Map<string, Conversation>();

      // Pre-fetch missing users
      const missingUserIds = new Set<string>();
      messages.forEach(msg => {
        const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (!userCache.current.has(otherUserId)) {
          missingUserIds.add(otherUserId);
        }
      });

      // Resolve missing users all at once to avoid waterfall
      await Promise.all(
        Array.from(missingUserIds).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              userCache.current.set(uid, userDoc.data());
            }
          } catch(e) {
            console.error("Error fetching other user:", e);
          }
        })
      );

      for (const msg of messages) {
        const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        
        if (!convosMap.has(otherUserId) || convosMap.get(otherUserId)!.lastMessage.createdAt < msg.createdAt) {
          const cachedUser = userCache.current.get(otherUserId) || {};
          
          convosMap.set(otherUserId, {
            otherUserId,
            otherUsername: cachedUser.username || 'Пользователь',
            otherUserIsPremium: cachedUser.isPremium || false,
            otherUserAvatarUrl: cachedUser.avatarUrl,
            lastMessage: msg
          });
        }
      }

      const sortedConvos = Array.from(convosMap.values()).sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
      setConversations(sortedConvos);
    });

    return () => unsubscribe();
  }, [user.id]);

  if (activeChatUser) {
    return (
      <Chat 
        currentUser={user} 
        otherUser={activeChatUser} 
        onBack={() => setActiveChatUser(null)} 
      />
    );
  }

  if (showSearch) {
    return (
      <UserSearch 
        currentUser={user}
        onClose={() => setShowSearch(false)}
        onSelectUser={(selectedUser) => {
          setActiveChatUser(selectedUser);
          setShowSearch(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-4 border-b border-neutral-900 flex justify-between items-center">
        <h1 className="text-xl font-medium tracking-wide">Сообщения</h1>
        <button 
          onClick={() => setShowSearch(true)}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600">
              <UserIcon className="w-8 h-8" />
            </div>
            <p className="text-neutral-500">У вас пока нет сообщений.<br/>Найдите кого-нибудь, чтобы начать чат.</p>
            <button 
              onClick={() => setShowSearch(true)}
              className="px-6 py-2 bg-white text-black font-medium rounded-full mt-4 hover:bg-neutral-200 transition-colors"
            >
              Найти собеседника
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {conversations.map((convo) => (
              <button
                key={convo.otherUserId}
                onClick={() => setActiveChatUser({ id: convo.otherUserId, username: convo.otherUsername, isPremium: convo.otherUserIsPremium, avatarUrl: convo.otherUserAvatarUrl })}
                className="w-full p-4 flex items-center space-x-4 hover:bg-neutral-900/50 transition-colors text-left"
              >
                <UserDisplay username={convo.otherUsername} isPremium={convo.otherUserIsPremium} avatarUrl={convo.otherUserAvatarUrl} size="md" showAvatar={true} />
                <div className="flex-1 min-w-0 ml-2">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(convo.lastMessage.createdAt, { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 truncate">
                    {convo.lastMessage.senderId === user.id ? 'Вы: ' : ''}
                    {convo.lastMessage.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
