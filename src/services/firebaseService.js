import { db } from '../../firebase.config';
import firestore from '@react-native-firebase/firestore';

// ============ VEHICLES ============
export const addVehicle = async (vehicleData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const docRef = await db.collection('vehicles').add({
      ...vehicleData,
      userId: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    const querySnapshot = await db.collection('vehicles')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
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
    const docSnap = await db.collection('vehicles').doc(vehicleId).get();
    if (docSnap.exists) {
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
    await db.collection('vehicles').doc(vehicleId).update({
      ...vehicleData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    await db.collection('vehicles').doc(vehicleId).delete();
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
    const docRef = await db.collection('services').add({
      ...serviceData,
      userId: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    let query = db.collection('services').where('userId', '==', userId);
    if (vehicleId) {
      query = query.where('vehicleId', '==', vehicleId);
    }
    query = query.orderBy('serviceDate', 'desc');
    const querySnapshot = await query.get();
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
    await db.collection('services').doc(serviceId).update({
      ...serviceData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    await db.collection('services').doc(serviceId).delete();
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
    const docRef = await db.collection('parts').add({
      ...partData,
      userId: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    let query = db.collection('parts').where('userId', '==', userId);
    if (vehicleId) {
      query = query.where('vehicleId', '==', vehicleId);
    }
    const querySnapshot = await query.get();
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
    await db.collection('parts').doc(partId).update({
      ...partData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating part:', error);
    throw error;
  }
};

export const deletePart = async (partId) => {
  try {
    await db.collection('parts').doc(partId).delete();
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
    const docRef = await db.collection('taxes').add({
      ...taxData,
      userId: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    let query = db.collection('taxes').where('userId', '==', userId);
    if (vehicleId) {
      query = query.where('vehicleId', '==', vehicleId);
    }
    query = query.orderBy('dueDate', 'asc');
    const querySnapshot = await query.get();
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
    await db.collection('taxes').doc(taxId).update({
      ...taxData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating tax:', error);
    throw error;
  }
};

export const deleteTax = async (taxId) => {
  try {
    await db.collection('taxes').doc(taxId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting tax:', error);
    throw error;
  }
};
