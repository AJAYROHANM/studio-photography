export interface EventDetails {
  text: string;
  sendSms: boolean;
  amount: number;
  place: string;
  status: 'pending' | 'completed';
}

export interface EventDetailsWithUser extends EventDetails {
  userId: string;
  userName: string;
  userPhoto: string;
}

export interface EventData {
  [dateKey: string]: EventDetailsWithUser;
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
