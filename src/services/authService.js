import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Auth REST API endpoints
const API_KEY = 'AIzaSyAwOw4momViF79D3jEIiNfD_uFaM8JI3Ww';
const AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const TOKEN_REFRESH_URL = 'https://securetoken.googleapis.com/v1/token';

// Storage keys
const USER_KEY = '@milestone_user';
const TOKEN_KEY = '@milestone_token';
const REFRESH_TOKEN_KEY = '@milestone_refresh_token';
const EXPIRY_KEY = '@milestone_token_expiry';

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

const saveUserToStorage = async (user, idToken, refreshToken, expiresIn) => {
  try {
    const expiryTime = Date.now() + (parseInt(expiresIn) * 1000);
    await AsyncStorage.multiSet([
      [USER_KEY, JSON.stringify(user)],
      [TOKEN_KEY, idToken],
      [REFRESH_TOKEN_KEY, refreshToken],
      [EXPIRY_KEY, expiryTime.toString()]
    ]);
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

const clearUserFromStorage = async () => {
  try {
    await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRY_KEY]);
  } catch (error) {
    console.error('Error clearing user from storage:', error);
  }
};

const parseFirebaseError = (error) => {
  const errorMessages = {
    'EMAIL_EXISTS': 'Email sudah terdaftar',
    'OPERATION_NOT_ALLOWED': 'Login dengan email/password tidak diaktifkan',
    'TOO_MANY_ATTEMPTS_TRY_LATER': 'Terlalu banyak percobaan, coba lagi nanti',
    'EMAIL_NOT_FOUND': 'Email tidak ditemukan',
    'INVALID_PASSWORD': 'Password salah',
    'USER_DISABLED': 'Akun telah dinonaktifkan',
    'INVALID_EMAIL': 'Format email tidak valid',
    'WEAK_PASSWORD': 'Password terlalu lemah (minimal 6 karakter)',
    'INVALID_LOGIN_CREDENTIALS': 'Email atau password salah',
  };
  
  return errorMessages[error] || error || 'Terjadi kesalahan';
};

// ============================================
// AUTH FUNCTIONS
// ============================================

export const signUp = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}:signUp?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(parseFirebaseError(data.error?.message));
    }

    const user = {
      uid: data.localId,
      email: data.email,
    };

    await saveUserToStorage(user, data.idToken, data.refreshToken, data.expiresIn);
    notifyListeners(user);

    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(parseFirebaseError(data.error?.message));
    }

    const user = {
      uid: data.localId,
      email: data.email,
    };

    await saveUserToStorage(user, data.idToken, data.refreshToken, data.expiresIn);
    notifyListeners(user);

    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await clearUserFromStorage();
    notifyListeners(null);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}:sendOobCode?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(parseFirebaseError(data.error?.message));
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!storedRefreshToken) {
      return null;
    }

    const response = await fetch(`${TOKEN_REFRESH_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: storedRefreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Token invalid, clear storage
      await clearUserFromStorage();
      notifyListeners(null);
      return null;
    }

    const user = currentUser || JSON.parse(await AsyncStorage.getItem(USER_KEY));
    await saveUserToStorage(user, data.id_token, data.refresh_token, data.expires_in);

    return data.id_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const getIdToken = async () => {
  try {
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    if (!token) return null;

    // Check if token is expired (with 5 minute buffer)
    if (expiry && Date.now() > (parseInt(expiry) - 300000)) {
      return await refreshToken();
    }

    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
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

export const initializeAuth = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    
    if (userJson) {
      const user = JSON.parse(userJson);
      
      // Check if token needs refresh
      if (expiry && Date.now() > (parseInt(expiry) - 300000)) {
        const newToken = await refreshToken();
        if (!newToken) {
          // Token refresh failed, user needs to login again
          notifyListeners(null);
          return null;
        }
      }
      
      notifyListeners(user);
      return user;
    } else {
      notifyListeners(null);
      return null;
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    notifyListeners(null);
    return null;
  }
};
