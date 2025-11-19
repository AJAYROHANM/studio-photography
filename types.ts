
export interface EventDetails {
  id?: string; // Added for Firebase Document ID
  text: string;
  sendSms: boolean;
  amount: number;
  place: string;
  status: 'pending' | 'completed';
  customerName?: string;
  customerMobile?: string;
  timeSlot: 'Morning' | 'Evening' | 'Full Day';
  date?: string; // YYYY-MM-DD, useful for flat objects
}

export interface EventDetailsWithUser extends EventDetails {
  userId: string;
  userName: string;
  userPhoto: string;
}

export interface EventData {
  [dateKey: string]: EventDetailsWithUser[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  name: string;
  phone: string;
  photo: string; // URL
}

export interface Reminder {
  type: 'Today' | 'Tomorrow';
  details: EventDetailsWithUser;
}