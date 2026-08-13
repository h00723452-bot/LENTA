import React, { useState } from 'react';
import { Home, MessageCircle, User as UserIcon } from 'lucide-react';
import { User } from './types';
import Feed from './Feed';
import MessagesList from './MessagesList';
import Profile from './Profile';

type Tab = 'feed' | 'messages' | 'profile';

export default function MainLayout({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-200">
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-md mx-auto w-full min-h-full">
          {activeTab === 'feed' && <Feed user={user} />}
          {activeTab === 'messages' && <MessagesList user={user} />}
          {activeTab === 'profile' && <Profile user={user} />}
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-neutral-950/80 backdrop-blur-md border-t border-neutral-900 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'feed' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <Home className="w-6 h-6" strokeWidth={activeTab === 'feed' ? 2.5 : 2} />
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'messages' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <MessageCircle className="w-6 h-6" strokeWidth={activeTab === 'messages' ? 2.5 : 2} />
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'profile' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <UserIcon className="w-6 h-6" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          </button>
        </div>
      </nav>
    </div>
  );
}
