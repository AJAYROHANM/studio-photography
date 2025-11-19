
import { db } from '../lib/firebase';
import { User, EventDetailsWithUser, EventDetails, EventData } from '../types';

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
  if (!db) throw new Error("Database not initialized");
  try {
    const querySnapshot = await db.collection('users').get();
    const users: User[] = [];
    querySnapshot.forEach((doc: any) => {
      // Combine doc data with ID
      const data = doc.data();
      users.push({ ...data, id: doc.id } as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching users from DB:", error);
    throw error;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  try {
    // Use user.id as the document ID for consistency
    await db.collection('users').doc(user.id).set(user);
  } catch (error) {
    console.error("Error saving user to DB:", error);
    throw error;
  }
};

export const deleteUserFromDb = async (userId: string): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  try {
    await db.collection('users').doc(userId).delete();
  } catch (error) {
    console.error("Error deleting user from DB:", error);
    throw error;
  }
};

// --- Events ---

export const getAllEvents = async (users: User[]): Promise<EventData> => {
  if (!db) throw new Error("Database not initialized");
  
  const rawEvents: any[] = [];
  try {
    const querySnapshot = await db.collection('events').get();
    querySnapshot.forEach((docSnap: any) => {
      rawEvents.push({ ...docSnap.data(), id: docSnap.id });
    });
  } catch (error) {
    console.error("Error fetching events from DB:", error);
    throw error;
  }

  // Transform flat list to EventData map
  const eventData: EventData = {};
  
  rawEvents.forEach((data: any) => {
      const dateKey = data.date;
      if (!dateKey) return;

      // Rehydrate user details
      const user = users.find(u => u.id === data.userId);
      const eventWithUser: EventDetailsWithUser = {
        id: data.id,
        text: data.text,
        sendSms: data.sendSms,
        amount: data.amount,
        place: data.place,
        status: data.status,
        customerName: data.customerName,
        customerMobile: data.customerMobile,
        timeSlot: data.timeSlot,
        date: data.date,
        userId: data.userId,
        userName: user ? user.name : 'Unknown User',
        userPhoto: user ? user.photo : 'https://i.pravatar.cc/150?u=unknown'
      };

      if (!eventData[dateKey]) {
        eventData[dateKey] = [];
      }
      eventData[dateKey].push(eventWithUser);
  });

  return eventData;
};

export const saveEventToDb = async (
  event: EventDetails, 
  date: string, 
  userId: string
): Promise<string> => {
  if (!db) throw new Error("Database not initialized");

  const eventDoc = {
    ...event,
    date,
    userId,
    customerName: event.customerName || '',
    customerMobile: event.customerMobile || '',
  };
  
  // Separate ID from data
  const { id, ...docData } = eventDoc;

  try {
    if (event.id) {
      await db.collection('events').doc(event.id).set(docData, { merge: true });
      return event.id;
    } else {
      const docRef = await db.collection('events').add(docData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving event to DB:", error);
    throw error;
  }
};

export const deleteEventFromDb = async (eventId: string): Promise<void> => {
  if (!db) throw new Error("Database not initialized");
  if (!eventId) return;

  try {
    await db.collection('events').doc(eventId).delete();
  } catch (error) {
    console.error("Error deleting event from DB:", error);
    throw error;
  }
};

// --- Backup & Restore ---

export const getFullBackup = async () => {
  if (!db) throw new Error("Database not initialized");
  try {
    const usersSnap = await db.collection('users').get();
    const users: any[] = [];
    usersSnap.forEach((doc: any) => users.push({ ...doc.data(), id: doc.id }));

    const eventsSnap = await db.collection('events').get();
    const events: any[] = [];
    eventsSnap.forEach((doc: any) => events.push({ ...doc.data(), id: doc.id }));

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      users,
      events
    };
  } catch (error) {
    console.error("Error generating backup from DB:", error);
    throw error;
  }
};

export const restoreBackup = async (backupData: any) => {
  if (!db) throw new Error("Database not initialized");

  try {
    // Firestore batch limit is 500 operations. We need to chunk the restore.
    const BATCH_SIZE = 450; 
    let operations: { type: 'user' | 'event', ref: any, data: any }[] = [];

    if (Array.isArray(backupData.users)) {
      for (const user of backupData.users) {
        // Ensure we have an ID
        const userId = user.id; 
        if(!userId) continue;
        
        const userRef = db.collection('users').doc(userId);
        operations.push({ type: 'user', ref: userRef, data: user });
      }
    }

    if (Array.isArray(backupData.events)) {
      for (const event of backupData.events) {
        const eventId = event.id || db.collection('events').doc().id;
        const eventRef = db.collection('events').doc(eventId);
        
        // Clean data (remove ID from body if present, ensure date exists)
        const { id, ...eventData } = event; 
        
        operations.push({ type: 'event', ref: eventRef, data: { ...eventData, date: event.date } });
      }
    }

    // Process in chunks
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = operations.slice(i, i + BATCH_SIZE);
        
        chunk.forEach(op => {
            batch.set(op.ref, op.data);
        });
        
        await batch.commit();
        console.log(`Restored batch ${Math.floor(i / BATCH_SIZE) + 1}`);
        
        // Yield to main thread to prevent browser "unresponsive" warning or white screen during large restores
        await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    console.error("Error restoring backup to DB:", error);
    throw error;
  }
};
