import crypto from 'crypto';
import { storage } from './storageService';
import { User } from './types';

// In-memory active session tokens for the single user
const activeSessions = new Set<string>();

export class AuthService {
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public isInitialized(): boolean {
    return storage.getUser() !== null;
  }

  public getCurrentUser(): { id: string; name: string; email: string; createdAt: string; lastLoginAt: string } | null {
    const user = storage.getUser();
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  public setupAccount(name: string, email: string, password: string): { user: User; sessionToken: string } {
    if (storage.getUser()) {
      throw new Error('User account already initialized.');
    }

    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);

    const user: User = {
      id: 'local-user',
      name: name.trim() || 'Sarah Jenkins',
      email: email.trim().toLowerCase() || 'sarah.jenkins@timetrack.internal',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    storage.saveUser(user);

    const sessionToken = crypto.randomUUID();
    activeSessions.add(sessionToken);

    return { user, sessionToken };
  }

  public login(password: string): { sessionToken: string; user: { id: string; name: string; email: string } } {
    const user = storage.getUser();
    if (!user) {
      throw new Error('No user account configured. Please run initial setup.');
    }

    const testHash = this.hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      throw new Error('Incorrect password.');
    }

    user.lastLoginAt = new Date().toISOString();
    storage.saveUser(user);

    const sessionToken = crypto.randomUUID();
    activeSessions.add(sessionToken);

    return {
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  public logout(sessionToken: string): void {
    activeSessions.delete(sessionToken);
  }

  public validateSession(sessionToken?: string): boolean {
    if (!sessionToken) return false;
    return activeSessions.has(sessionToken);
  }
}

export const authService = new AuthService();
