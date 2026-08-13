import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Use import.meta.glob to optionally load the config file if it exists (avoids build errors on Vercel)
const configFiles = import.meta.glob('../firebase-applet-config.json', { eager: true });
const localConfig = configFiles['../firebase-applet-config.json'] 
  ? ((configFiles['../firebase-applet-config.json'] as any).default || configFiles['../firebase-applet-config.json'])
  : {};

const firebaseConfig = {
  apiKey: localConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: localConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: localConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: localConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: localConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: localConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: undefined
}, localConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
