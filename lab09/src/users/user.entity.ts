export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

export type SafeUser = Omit<User, 'passwordHash'>;
