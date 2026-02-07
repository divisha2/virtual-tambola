// Firebase configuration for frontend
const USE_FIREBASE = import.meta.env.VITE_FIREBASE_API_KEY;

let auth = null;

if (USE_FIREBASE) {
  const { initializeApp } = await import('firebase/app');
  const { getAuth, signInAnonymously } = await import('firebase/auth');

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Sign in anonymously on app load
  signInAnonymously(auth).catch((error) => {
    console.error('Anonymous auth failed:', error);
  });
} else {
  console.log('Running without Firebase - using mock auth');
  // Mock auth for local testing
  auth = {
    currentUser: { uid: `local-${Date.now()}` },
  };
}

export { auth };
