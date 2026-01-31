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
    let q;
    try {
      q = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
    } catch (indexError) {
      console.warn('Index not found for vehicles, using query without orderBy:', indexError);
      q = query(collection(db, 'vehicles'));
    }
    const querySnapshot = await getDocs(q);
    let vehicles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort di client side jika orderBy gagal
    vehicles.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA; // Descending order
    });
    
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles:', error);
    // Fallback: coba ambil semua tanpa filter/order
    try {
      const querySnapshot = await getDocs(collection(db, 'vehicles'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return []; // Return empty array instead of throwing
    }
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
      return []; // Return empty array instead of throwing
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
      try {
        q = query(
          collection(db, 'parts'),
          where('vehicleId', '==', vehicleId),
          orderBy('installedAt', 'desc')
        );
      } catch (indexError) {
        console.warn('Index not found for parts, using query without orderBy:', indexError);
        q = query(
          collection(db, 'parts'),
          where('vehicleId', '==', vehicleId)
        );
      }
    } else {
      try {
        q = query(collection(db, 'parts'), orderBy('installedAt', 'desc'));
      } catch (indexError) {
        console.warn('Index not found for parts, using query without orderBy:', indexError);
        q = query(collection(db, 'parts'));
      }
    }
    const querySnapshot = await getDocs(q);
    let parts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort di client side jika orderBy gagal
    parts.sort((a, b) => {
      const dateA = a.installedAt?.toDate ? a.installedAt.toDate() : new Date(0);
      const dateB = b.installedAt?.toDate ? b.installedAt.toDate() : new Date(0);
      return dateB - dateA; // Descending order
    });
    
    return parts;
  } catch (error) {
    console.error('Error getting parts:', error);
    // Fallback: coba ambil semua tanpa filter/order
    try {
      const querySnapshot = await getDocs(collection(db, 'parts'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return []; // Return empty array instead of throwing
    }
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
      try {
        q = query(
          collection(db, 'taxes'),
          where('vehicleId', '==', vehicleId),
          orderBy('dueDate', 'asc')
        );
      } catch (indexError) {
        console.warn('Index not found for taxes, using query without orderBy:', indexError);
        q = query(
          collection(db, 'taxes'),
          where('vehicleId', '==', vehicleId)
        );
      }
    } else {
      try {
        q = query(collection(db, 'taxes'), orderBy('dueDate', 'asc'));
      } catch (indexError) {
        console.warn('Index not found for taxes, using query without orderBy:', indexError);
        q = query(collection(db, 'taxes'));
      }
    }
    const querySnapshot = await getDocs(q);
    let taxes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort di client side jika orderBy gagal
    taxes.sort((a, b) => {
      const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(0);
      const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(0);
      return dateA - dateB; // Ascending order
    });
    
    return taxes;
  } catch (error) {
    console.error('Error getting taxes:', error);
    // Fallback: coba ambil semua tanpa filter/order
    try {
      const querySnapshot = await getDocs(collection(db, 'taxes'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return []; // Return empty array instead of throwing
    }
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
