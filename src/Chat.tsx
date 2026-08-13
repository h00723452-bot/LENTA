import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { User, Message } from './types';
import { ArrowLeft, Send } from 'lucide-react';
import UserDisplay from './UserDisplay';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatProps {
  currentUser: User;
  otherUser: { id: string; username: string; isPremium?: boolean; avatarUrl?: string };
  onBack: () => void;
}

export default function Chat({ currentUser, otherUser, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Both participants combination for querying
    const participants = [currentUser.id, otherUser.id].sort();

    const q = query(
      collection(db, 'messages'),
      where('participants', '==', participants),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const participants = [currentUser.id, otherUser.id].sort();

    try {
      await addDoc(collection(db, 'messages'), {
        participants,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        content: newMessage.trim(),
        createdAt: Date.now(),
        read: false
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-4 border-b border-neutral-900 flex items-center space-x-3">
        <button 
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-400 hover:text-white transition-colors rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <UserDisplay username={otherUser.username} isPremium={otherUser.isPremium} avatarUrl={otherUser.avatarUrl} size="md" showAvatar={true} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">
            Начните общение с {otherUser.username}
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser.id;
          const showTime = index === 0 || (msg.createdAt - messages[index-1].createdAt > 5 * 60 * 1000); // show time if gap > 5 mins
          
          return (
            <div key={msg.id} className="flex flex-col">
              {showTime && (
                <div className="text-center my-4">
                  <span className="text-xs text-neutral-600 font-medium px-2 py-1 bg-neutral-900 rounded-full">
                    {msg.createdAt ? format(msg.createdAt, 'HH:mm', { locale: ru }) : ''}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn 
                      ? 'bg-white text-black rounded-tr-sm' 
                      : 'bg-neutral-800 text-white border border-neutral-700 rounded-tl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-900 bg-neutral-950">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-3 text-[15px] text-white outline-none focus:border-neutral-700 transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSubmitting}
            className="p-3 bg-white text-black rounded-full disabled:opacity-50 hover:bg-neutral-200 transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
