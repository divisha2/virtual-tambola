import dotenv from 'dotenv';
import { RealtimeDBAdapter } from './realtimeDatabase.js';

dotenv.config();

// For local testing, use in-memory storage if no Firebase config
const USE_MEMORY_STORE = !process.env.FIREBASE_PROJECT_ID;

let db;

if (USE_MEMORY_STORE) {
  console.log('Using in-memory storage for local testing');
  const { db: memoryDb } = await import('./memoryStore.js');
  db = memoryDb;
} else {
  console.log('Using Firebase Realtime Database');
  const admin = (await import('firebase-admin')).default;
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  const database = admin.database();
  db = new RealtimeDBAdapter(database);
}

export { db };
