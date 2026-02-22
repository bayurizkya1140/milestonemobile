import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ============================================
// KONFIGURASI FIREBASE
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAwOw4momViF79D3jEIiNfD_uFaM8JI3Ww",
  authDomain: "milestone-992ec.firebaseapp.com",
  projectId: "milestone-992ec",
  storageBucket: "milestone-992ec.firebasestorage.app",
  messagingSenderId: "1095426816362",
  appId: "1:1095426816362:web:7deeac0b668025b1650d13"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

export default app;
