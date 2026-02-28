import auth from '@react-native-firebase/auth';

// Auth state listeners
let authListeners = [];
let currentUser = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

const notifyListeners = (user) => {
  currentUser = user;
  authListeners.forEach(listener => listener(user));
};

const parseFirebaseError = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'Email sudah terdaftar',
    'auth/operation-not-allowed': 'Login dengan email/password tidak diaktifkan',
    'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
    'auth/user-not-found': 'Email tidak ditemukan',
    'auth/wrong-password': 'Password salah',
    'auth/user-disabled': 'Akun telah dinonaktifkan',
    'auth/invalid-email': 'Format email tidak valid',
    'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
    'auth/invalid-credential': 'Email atau password salah',
    'auth/invalid-login-credentials': 'Email atau password salah',
    'auth/network-request-failed': 'Koneksi internet bermasalah',
  };

  return errorMessages[errorCode] || errorCode || 'Terjadi kesalahan';
};

// ============================================
// AUTH FUNCTIONS
// ============================================

export const signUp = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw new Error(parseFirebaseError(error.code));
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const user = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw new Error(parseFirebaseError(error.code));
  }
};

export const signOut = async () => {
  try {
    await auth().signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await auth().sendPasswordResetEmail(email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error(parseFirebaseError(error.code));
  }
};

export const getCurrentUser = () => {
  return currentUser;
};

export const subscribeToAuthChanges = (callback) => {
  authListeners.push(callback);

  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
};

export const initializeAppAuth = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        };
        notifyListeners(user);
        resolve(user);
      } else {
        notifyListeners(null);
        resolve(null);
      }
    });
  });
};
