# Milestone Mobile - Aplikasi Manajemen Kendaraan

Aplikasi mobile untuk membantu mengelola beberapa kendaraan, termasuk tracking servis, parts yang perlu diganti berdasarkan kilometer, dan pembayaran pajak tahunan maupun 5 tahunan.

## Fitur

- **Manajemen Kendaraan**: Tambah, edit, dan kelola beberapa kendaraan
- **Tracking Servis**: Catat servis kendaraan dengan reminder servis berikutnya
- **Manajemen Parts**: Track parts yang perlu diganti berdasarkan kilometer
- **Manajemen Pajak**: Tracking pajak tahunan dan 5 tahunan dengan reminder jatuh tempo
- **Dashboard**: Overview semua kendaraan dan reminder penting

## Teknologi

- React Native (Expo)
- Firebase Firestore (Free Tier)
- React Navigation
- React Native Paper (UI Components)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (pilih mode test untuk free tier)
3. Copy konfigurasi Firebase Anda ke `firebase.config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Install Expo CLI (jika belum)

```bash
npm install -g expo-cli
```

### 4. Run Aplikasi

```bash
npm start
```

Kemudian pilih platform (Android/iOS) atau scan QR code dengan Expo Go app.

## Struktur Data Firebase

### Collections

- **vehicles**: Data kendaraan
- **services**: Data servis kendaraan
- **parts**: Data parts/komponen kendaraan
- **taxes**: Data pajak kendaraan

## Catatan

- Aplikasi menggunakan Firebase Free Tier (Spark Plan)
- Data disimpan di Firestore
- Tidak ada autentikasi user (semua data tersimpan tanpa user ID)
- Untuk production, disarankan menambahkan autentikasi

## Lisensi

MIT
