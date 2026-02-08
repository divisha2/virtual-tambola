import dotenv from 'dotenv';
import { RealtimeDBAdapter } from './realtimeDatabase.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  let serviceAccount;
  
  // Try to use service account JSON file first (for Render deployment)
  const serviceAccountPath = join(__dirname, 'serviceAccount.json');
  try {
    const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
    console.log('Using service account JSON file');
  } catch (error) {
    // Fall back to environment variables (for local development)
    console.log('Using environment variables for Firebase config');
    
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      // Remove surrounding quotes if present
      privateKey = privateKey.replace(/^["']|["']$/g, '');
      // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  const database = admin.database();
  db = new RealtimeDBAdapter(database);
}

export { db };
