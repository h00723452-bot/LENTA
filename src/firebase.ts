import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Динамически загружаем локальный конфиг Firebase
// Это помогает избежать ошибок сборки на Vercel, если локальный файл конфига отсутствует
const configFiles = import.meta.glob('../firebase-applet-config.json', { eager: true });
const localConfig = configFiles['../firebase-applet-config.json'] 
  ? ((configFiles['../firebase-applet-config.json'] as any).default || configFiles['../firebase-applet-config.json'])
  : {};

// Настраиваем Firebase. Берем ключи либо из локального файла, либо из переменных окружения Vercel (.env)
const firebaseConfig = {
  apiKey: localConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: localConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: localConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: localConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: localConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: localConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID
};

// Инициализируем само приложение
const app = initializeApp(firebaseConfig);

// Подключаем базу данных (Firestore). Используем кастомный ID базы для совместимости с AI Studio
const db = initializeFirestore(app, {
  localCache: undefined // Отключаем локальный кэш, так как он может вызывать конфликты
}, localConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID);

// Экспортируем сервисы авторизации и хранения
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
