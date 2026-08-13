import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import { Post } from './types';
import UserDisplay from './UserDisplay';

interface TipModalProps {
  post: Post;
  onClose: () => void;
}

export default function TipModal({ post, onClose }: TipModalProps) {
  const [amount, setAmount] = useState(100);

  const handleTip = () => {
    const returnUrl = encodeURIComponent(`${window.location.origin}/?tip_callback=true&authorId=${post.authorId}&amount=${amount}`);
    const paymentUrl = `https://bankmur.vercel.app/?merchantName=${encodeURIComponent('Pushenda Social')}&recipientCardNumber=450071570968&amount=${amount}&description=${encodeURIComponent('Подарок автору ' + post.authorUsername)}&returnUrl=${returnUrl}`;
    window.location.href = paymentUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Отправить подарок
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-sm text-neutral-400 mb-2">Получатель:</p>
            <UserDisplay 
              username={post.authorUsername} 
              isPremium={post.authorIsPremium} 
              avatarUrl={post.authorAvatarUrl} 
              size="md" 
            />
          </div>

          <div className="w-full mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Выберите сумму (PUSH):</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[100, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    amount === val 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Другая сумма"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <button
            onClick={handleTip}
            disabled={!amount || amount <= 0}
            className="w-full bg-[#f59e0b] text-black font-extrabold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Оплатить {amount} MUR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
