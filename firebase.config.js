// Firebase Config - menggunakan @react-native-firebase native SDK
// Konfigurasi otomatis dari google-services.json
// Tidak perlu manual config - semua dihandle oleh native SDK

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const db = firestore();
export const firebaseAuth = auth();
