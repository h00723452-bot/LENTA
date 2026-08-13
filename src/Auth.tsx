import React, { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (username.length < 3) {
      setError('Имя пользователя должно быть не менее 3 символов');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    const email = `${username.toLowerCase()}@pushenda.local`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username,
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Имя пользователя уже занято');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Неверное имя пользователя или пароль');
      } else {
        setError('Произошла ошибка. Попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 px-4 text-neutral-200">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light text-center mb-2 tracking-wide text-white">Пушенда</h1>
        <p className="text-center text-neutral-500 mb-8 text-sm">Анонимная сеть</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_а-яА-ЯёЁ-]/g, ''))}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-600"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-600"
          />
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-medium rounded-xl px-4 py-3 mt-2 hover:bg-neutral-200 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:underline ml-1"
          >
            {isLogin ? 'Регистрация' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
}
