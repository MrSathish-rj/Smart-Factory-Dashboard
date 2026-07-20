// Firebase configuration
// Replace with your project's config from Firebase Console > Project Settings
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBR71YLC8qfkEZOMImShmHo2g59O1uK9WM",
  authDomain: "smart-factory-dashboard-91043.firebaseapp.com",
  databaseURL: "https://smart-factory-dashboard-91043-default-rtdb.firebaseio.com",
  projectId: "smart-factory-dashboard-91043",
  storageBucket: "smart-factory-dashboard-91043.firebasestorage.app",
  messagingSenderId: "4839524437",
  appId: "1:4839524437:web:381376150c4a7d3fbd6cdc",
  measurementId: "G-91LV5FWR5K"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
