import { db } from '../../firebase.config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

// ============ VEHICLES ============
export const addVehicle = async (vehicleData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...vehicleData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Vehicle added with ID:', docRef.id, 'for user:', userId);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const getVehicles = async (userId) => {
  try {
    if (!userId) {
      console.log('No userId provided, returning empty array');
      return [];
    }
    console.log('Fetching vehicles for userId:', userId);
    const q = query(
      collection(db, 'vehicles'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const vehicles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Found vehicles:', vehicles.length);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw error;
  }
};

export const getVehicleById = async (vehicleId) => {
  try {
    const docRef = doc(db, 'vehicles', vehicleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting vehicle:', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const docRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(docRef, {
      ...vehicleData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// ============ SERVICES ============
export const addService = async (serviceData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Service added with ID:', docRef.id, 'for user:', userId);
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

export const getServices = async (userId, vehicleId = null) => {
  try {
    if (!userId) {
      console.log('No userId provided, returning empty array');
      return [];
    }
    let q;
    if (vehicleId) {
      q = query(
        collection(db, 'services'),
        where('userId', '==', userId),
        where('vehicleId', '==', vehicleId),
        orderBy('serviceDate', 'desc')
      );
    } else {
      q = query(
        collection(db, 'services'),
        where('userId', '==', userId),
        orderBy('serviceDate', 'desc')
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// ============ PARTS ============
export const addPart = async (partData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const docRef = await addDoc(collection(db, 'parts'), {
      ...partData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Part added with ID:', docRef.id, 'for user:', userId);
    return docRef.id;
  } catch (error) {
    console.error('Error adding part:', error);
    throw error;
  }
};

export const getParts = async (userId, vehicleId = null) => {
  try {
    if (!userId) {
      console.log('No userId provided, returning empty array');
      return [];
    }
    let q;
    if (vehicleId) {
      q = query(
        collection(db, 'parts'),
        where('userId', '==', userId),
        where('vehicleId', '==', vehicleId)
      );
    } else {
      q = query(
        collection(db, 'parts'),
        where('userId', '==', userId)
      );
    }
    const querySnapshot = await getDocs(q);
    const parts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort client-side by createdAt descending
    return parts.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting parts:', error);
    throw error;
  }
};

export const updatePart = async (partId, partData) => {
  try {
    const docRef = doc(db, 'parts', partId);
    await updateDoc(docRef, {
      ...partData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating part:', error);
    throw error;
  }
};

export const deletePart = async (partId) => {
  try {
    await deleteDoc(doc(db, 'parts', partId));
    return true;
  } catch (error) {
    console.error('Error deleting part:', error);
    throw error;
  }
};

// ============ TAXES ============
export const addTax = async (taxData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const docRef = await addDoc(collection(db, 'taxes'), {
      ...taxData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Tax added with ID:', docRef.id, 'for user:', userId);
    return docRef.id;
  } catch (error) {
    console.error('Error adding tax:', error);
    throw error;
  }
};

export const getTaxes = async (userId, vehicleId = null) => {
  try {
    if (!userId) {
      console.log('No userId provided, returning empty array');
      return [];
    }
    let q;
    if (vehicleId) {
      q = query(
        collection(db, 'taxes'),
        where('userId', '==', userId),
        where('vehicleId', '==', vehicleId),
        orderBy('dueDate', 'asc')
      );
    } else {
      q = query(
        collection(db, 'taxes'),
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting taxes:', error);
    throw error;
  }
};

export const updateTax = async (taxId, taxData) => {
  try {
    const docRef = doc(db, 'taxes', taxId);
    await updateDoc(docRef, {
      ...taxData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating tax:', error);
    throw error;
  }
};

export const deleteTax = async (taxId) => {
  try {
    await deleteDoc(doc(db, 'taxes', taxId));
    return true;
  } catch (error) {
    console.error('Error deleting tax:', error);
    throw error;
  }
};
