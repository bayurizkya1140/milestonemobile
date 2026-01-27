import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ============================================
// KONFIGURASI FIREBASE
// ============================================
// 
// CARA MENDAPATKAN NILAI-NILAI INI:
// 1. Buka https://console.firebase.google.com/
// 2. Pilih project Anda
// 3. Klik ikon web (</>) untuk menambahkan aplikasi web
// 4. Copy semua nilai di bawah ini dari Firebase Console
// 5. Ganti semua "YOUR_XXX" dengan nilai yang sebenarnya
//
// PANDUAN LENGKAP: Lihat file PANDUAN_SETUP_FIREBASE.md
// ============================================

const firebaseConfig = {
  // API Key - Ditemukan di Firebase Console > Project Settings > General
  apiKey: "AIzaSyAwOw4momViF79D3jEIiNfD_uFaM8JI3Ww",
  
  // Auth Domain - Format: your-project-id.firebaseapp.com
  authDomain: "milestone-992ec.firebaseapp.com",
  
  // Project ID - Nama project Anda di Firebase
  projectId: "milestone-992ec",
  
  // Storage Bucket - Format: your-project-id.appspot.com
  storageBucket: "milestone-992ec.firebasestorage.app",
  
  // Messaging Sender ID - Nomor ID pengirim pesan
  messagingSenderId: "1095426816362",
  
  // App ID - ID unik aplikasi web Anda
  appId: "1:1095426816362:web:7deeac0b668025b1650d13"

};

// Contoh konfigurasi yang sudah diisi (HAPUS contoh ini dan ganti dengan nilai Anda):
// const firebaseConfig = {
//   apiKey: "AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr678",
//   authDomain: "milestone-mobile.firebaseapp.com",
//   projectId: "milestone-mobile-12345",
//   storageBucket: "milestone-mobile-12345.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdef1234567890"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
