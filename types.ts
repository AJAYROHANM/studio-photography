export interface EventDetails {
  text: string;
  sendSms: boolean;
  amount: number;
  place: string;
  status: 'pending' | 'completed';
}

export interface EventData {
  [dateKey: string]: EventDetails;
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
