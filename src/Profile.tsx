import React, { useRef, useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Transaction } from './types';
import { LogOut, Crown, Image as ImageIcon, Wallet, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import UserDisplay from './UserDisplay';

import { compressImage } from './utils';

export default function Profile({ user }: { user: User }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, [user.id]);

  const balance = transactions.reduce((acc, tx) => {
    return tx.type === 'tip_received' ? acc + tx.amount : acc - tx.amount;
  }, 0);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || withdrawAmount > balance || withdrawAmount <= 0) return;
    if (cardNumber.length < 12) return;

    setWithdrawLoading(true);
    try {
      const response = await fetch('https://bankmur.vercel.app/api/v1/card/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCardNumber: '450071570968',
          fromCvv: '252',
          toCardNumber: cardNumber.replace(/\s+/g, ''),
          amount: Number(withdrawAmount),
          description: 'Вывод средств из Pushenda Social',
        }),
      });

      const result = await response.json();
      if (result.success) {
        await addDoc(collection(db, 'transactions'), {
          userId: user.id,
          type: 'withdrawal',
          amount: Number(withdrawAmount),
          createdAt: Date.now()
        });
        setShowWithdrawModal(false);
        setCardNumber('');
        setWithdrawAmount('');
        alert("Вывод успешно выполнен!");
      } else {
        alert("Ошибка вывода: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка соединения с MURBANK API");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.isPremium) return;

    if (file.size > 2 * 1024 * 1024) {
       alert('Файл слишком большой! Максимальный размер 2MB.');
       return;
    }

    setIsUploading(true);
    try {
      const avatarUrl = await compressImage(file, 300);
      
      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl
      });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert('Ошибка при загрузке картинки. Попробуйте файл поменьше.');
    } finally {
      setIsUploading(false);
    }
  };

  const returnUrl = encodeURIComponent(`${window.location.origin}/?payment_callback=true`);
  const paymentUrl = `https://bankmur.vercel.app/?merchantName=${encodeURIComponent('Pushenda Social')}&recipientCardNumber=450071570968&amount=5000&description=${encodeURIComponent('Premium Status')}&returnUrl=${returnUrl}`;

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      <h1 className="text-2xl font-medium text-white mb-8">Профиль</h1>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <UserDisplay username={user.username} isPremium={user.isPremium} avatarUrl={user.avatarUrl} size="lg" showAvatar={true} />
            {user.isPremium && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors"
                title="Изменить аватар (GIF)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-neutral-500 mt-1">
              В Пушенде с {user.createdAt ? format(user.createdAt, 'd MMMM yyyy', { locale: ru }) : 'неизвестно'}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400 mb-1">Баланс аккаунта</p>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-pink-500" />
            {balance} <span className="text-lg text-pink-500">MUR</span>
          </div>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={balance <= 0}
          className="bg-white text-black font-medium px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          Вывести
        </button>
      </div>

      {!user.isPremium && (
        <div className="mt-6 bg-gradient-to-br from-yellow-900/30 to-purple-900/30 border border-yellow-500/30 rounded-2xl p-6 text-center">
          <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Premium аккаунт</h3>
          <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
            Получи радужный ник, галочку верификации и возможность установить любую GIF на аватар!
          </p>
          <a 
            href={paymentUrl}
            className="bg-[#f59e0b] text-black font-extrabold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Купить за 5 000 MUR</span>
          </a>
        </div>
      )}

      <div className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl px-4 py-3 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-pink-500" />
                Вывод средств
              </h2>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Доступно: {balance} MUR</label>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="Сумма вывода"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Номер карты зачисления</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  required
                  minLength={12}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={withdrawLoading || !withdrawAmount || withdrawAmount > balance || !cardNumber}
                className="w-full bg-white text-black font-bold px-6 py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {withdrawLoading ? (
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-black rounded-full animate-spin"></div>
                ) : (
                  'Подтвердить вывод'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
