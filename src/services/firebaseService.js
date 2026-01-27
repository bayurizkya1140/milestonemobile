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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase.config';

// Vehicle Service
export const addVehicle = async (vehicleData) => {
  try {
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...vehicleData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const getVehicles = async () => {
  try {
    const q = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      ...vehicleData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Service Service
export const addService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

export const getServices = async (vehicleId = null) => {
  try {
    let q;
    if (vehicleId) {
      // Query dengan where + orderBy memerlukan index di Firestore
      // Jika error, coba tanpa orderBy dulu
      try {
        q = query(
          collection(db, 'services'),
          where('vehicleId', '==', vehicleId),
          orderBy('serviceDate', 'desc')
        );
      } catch (indexError) {
        // Jika index belum ada, gunakan query tanpa orderBy
        console.warn('Index not found, using query without orderBy:', indexError);
        q = query(
          collection(db, 'services'),
          where('vehicleId', '==', vehicleId)
        );
      }
    } else {
      // Query semua services, coba dengan orderBy dulu
      try {
        q = query(collection(db, 'services'), orderBy('serviceDate', 'desc'));
      } catch (indexError) {
        // Jika index belum ada, gunakan query tanpa orderBy
        console.warn('Index not found, using query without orderBy:', indexError);
        q = query(collection(db, 'services'));
      }
    }
    const querySnapshot = await getDocs(q);
    let services = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort di client side jika orderBy gagal
    if (!vehicleId || services.length > 0) {
      services.sort((a, b) => {
        const dateA = a.serviceDate?.toDate ? a.serviceDate.toDate() : new Date(0);
        const dateB = b.serviceDate?.toDate ? b.serviceDate.toDate() : new Date(0);
        return dateB - dateA; // Descending order
      });
    }
    
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    // Fallback: coba ambil semua tanpa filter/order
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      throw error;
    }
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Parts Service
export const addPart = async (partData) => {
  try {
    const docRef = await addDoc(collection(db, 'parts'), {
      ...partData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding part:', error);
    throw error;
  }
};

export const getParts = async (vehicleId = null) => {
  try {
    let q;
    if (vehicleId) {
      q = query(
        collection(db, 'parts'),
        where('vehicleId', '==', vehicleId),
        orderBy('installedAt', 'desc')
      );
    } else {
      q = query(collection(db, 'parts'), orderBy('installedAt', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting parts:', error);
    throw error;
  }
};

export const updatePart = async (partId, partData) => {
  try {
    const partRef = doc(db, 'parts', partId);
    await updateDoc(partRef, {
      ...partData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating part:', error);
    throw error;
  }
};

export const deletePart = async (partId) => {
  try {
    await deleteDoc(doc(db, 'parts', partId));
  } catch (error) {
    console.error('Error deleting part:', error);
    throw error;
  }
};

// Tax Service
export const addTax = async (taxData) => {
  try {
    const docRef = await addDoc(collection(db, 'taxes'), {
      ...taxData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding tax:', error);
    throw error;
  }
};

export const getTaxes = async (vehicleId = null) => {
  try {
    let q;
    if (vehicleId) {
      q = query(
        collection(db, 'taxes'),
        where('vehicleId', '==', vehicleId),
        orderBy('dueDate', 'asc')
      );
    } else {
      q = query(collection(db, 'taxes'), orderBy('dueDate', 'asc'));
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
    const taxRef = doc(db, 'taxes', taxId);
    await updateDoc(taxRef, {
      ...taxData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating tax:', error);
    throw error;
  }
};

export const deleteTax = async (taxId) => {
  try {
    await deleteDoc(doc(db, 'taxes', taxId));
  } catch (error) {
    console.error('Error deleting tax:', error);
    throw error;
  }
};
