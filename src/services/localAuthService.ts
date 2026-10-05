import AsyncStorage from '@react-native-async-storage/async-storage';
import { localStorage } from './localStorageService';
import { User } from './types';

const SESSION_TOKEN_KEY = '@att_tracker_session_token';

// Robust zero-dependency pure JavaScript SHA-256 implementation
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash.length = 8;
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = [...hash];

    for (let j = 0; j < 64; j++) {
      const w15 = w[j - 15];
      const w2 = w[j - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[j] = j < 16 ? w[j] : (w[j - 16] + s0 + w[j - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[j] + w[j]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateUUID(): string {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export class LocalAuthService {
  private activeToken: string | null = null;

  public async isInitialized(): Promise<boolean> {
    const user = await localStorage.getUser();
    return user !== null;
  }

  public async getCurrentUser(): Promise<User | null> {
    const user = await localStorage.getUser();
    return user;
  }

  public async getSessionToken(): Promise<string | null> {
    if (this.activeToken) return this.activeToken;
    this.activeToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    return this.activeToken;
  }

  public async setupAccount(
    name: string,
    email: string,
    password: string,
    avatar?: string,
    shiftSettings?: Partial<any>
  ): Promise<{ user: User; sessionToken: string }> {
    if (!name || name.trim().length === 0) {
      throw new Error('Please enter your name.');
    }

    if (!password || password.length < 4) {
      throw new Error('Passcode must be at least 4 digits/characters.');
    }

    const salt = generateSalt();
    const passwordHash = sha256(password + ':' + salt);

    const user: User = {
      id: 'user_' + Date.now().toString(36),
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : `${name.trim().toLowerCase().replace(/\s+/g, '.')}@internal.app`,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      title: 'Active Specialist',
      department: 'General Operations',
      officeLocation: 'Main Workspace',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await localStorage.saveUser(user);

    if (shiftSettings) {
      await localStorage.saveSettings(shiftSettings);
    }

    const sessionToken = generateUUID();
    this.activeToken = sessionToken;
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, sessionToken);

    return { user, sessionToken };
  }

  public async login(
    password: string
  ): Promise<{ sessionToken: string; user: User }> {
    const user = await localStorage.getUser();
    if (!user) {
      throw new Error('No user account configured. Please complete initial setup.');
    }

    const testHash = sha256(password + ':' + user.salt);
    if (testHash !== user.passwordHash) {
      throw new Error('Incorrect passcode.');
    }

    user.lastLoginAt = new Date().toISOString();
    await localStorage.saveUser(user);

    const sessionToken = generateUUID();
    this.activeToken = sessionToken;
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, sessionToken);

    return {
      sessionToken,
      user,
    };
  }

  public async logout(): Promise<void> {
    this.activeToken = null;
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  }

  public async validateSession(): Promise<boolean> {
    const token = await this.getSessionToken();
    const user = await localStorage.getUser();
    return Boolean(token && user);
  }
}

export const localAuth = new LocalAuthService();
