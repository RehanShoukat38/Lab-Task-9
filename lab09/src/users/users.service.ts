import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User, SafeUser } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: bcrypt.hashSync('AdminPass123', 10),
      role: 'admin',
    },
    {
      id: 2,
      name: 'Alice Owner',
      email: 'alice@example.com',
      passwordHash: bcrypt.hashSync('Password123', 10),
      role: 'user',
    },
    {
      id: 3,
      name: 'Bob Normal',
      email: 'bob@example.com',
      passwordHash: bcrypt.hashSync('Password123', 10),
      role: 'user',
    },
  ];

  private nextId = 4;

  findAll(): SafeUser[] {
    return this.users.map(({ id, name, email, role }) => ({
      id,
      name,
      email,
      role,
    }));
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'admin' | 'user';
  }): User {
    const newUser: User = {
      id: this.nextId++,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
    };
    this.users.push(newUser);
    return newUser;
  }

  updatePassword(id: number, newHash: string): void {
    const user = this.findById(id);
    if (user) {
      user.passwordHash = newHash;
    }
  }
}
