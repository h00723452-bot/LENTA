import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, addDoc } from 'firebase/firestore';
import Auth from './Auth';
import MainLayout from './MainLayout';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ id: firebaseUser.uid, ...userData } as User);

            // Handle payment callback (Обработка коллбэка после успешной покупки Premium)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment_callback') === 'true' && urlParams.get('status') === 'success') {
              if (!userData.isPremium) {
                try {
                  // Выдаем пользователю премиум статус в базе данных
                  await updateDoc(doc(db, 'users', firebaseUser.uid), {
                    isPremium: true
                  });
                  // Очищаем URL строку браузера от параметров
                  window.history.replaceState({}, document.title, window.location.pathname);
                } catch (e) {
                  console.error("Error setting premium:", e);
                }
              } else {
                 // Если уже премиум, просто очищаем URL
                 window.history.replaceState({}, document.title, window.location.pathname);
              }
            }

            // Handle tip callback (Обработка коллбэка после отправки подарка/чаевых)
            if (urlParams.get('tip_callback') === 'true' && urlParams.get('status') === 'success') {
              const authorId = urlParams.get('authorId');
              const amount = Number(urlParams.get('amount'));
              if (authorId && amount && !isNaN(amount)) {
                try {
                  // Создаем новую транзакцию (поступление) для автора поста
                  await addDoc(collection(db, 'transactions'), {
                    userId: authorId,
                    type: 'tip_received',
                    amount: amount,
                    fromUserId: firebaseUser.uid,
                    createdAt: Date.now()
                  });
                  window.history.replaceState({}, document.title, window.location.pathname);
                  alert('Подарок успешно отправлен!');
                } catch (e) {
                  console.error("Error sending tip:", e);
                }
              }
            }

          } else {
            // Edge case if user doc doesn't exist yet (e.g. during registration)
            setUser({ id: firebaseUser.uid, username: 'Загрузка...', createdAt: Date.now() });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
        if (userUnsubscribe) {
          userUnsubscribe();
          userUnsubscribe = undefined;
        }
      }
    });

    return () => {
      unsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <MainLayout user={user} />;
}

