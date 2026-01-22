import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';

interface JwtPayload {
  id: number;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private storage: StorageService) {
    this.loadUserFromToken();
  }

  private async loadUserFromToken(): Promise<void> {
    const token = await this.getToken();
    if (token) {
      const user = this.decodeToken(token);
      this.currentUserSubject.next(user);
    }
  }

  private decodeToken(token: string): User | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload)) as JwtPayload;
      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
      };
    } catch {
      return null;
    }
  }

  async saveToken(token: string): Promise<void> {
    await this.storage.set(this.TOKEN_KEY, token);
    const user = this.decodeToken(token);
    this.currentUserSubject.next(user);
  }

  async getToken(): Promise<string | null> {
    return await this.storage.get(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async logout(): Promise<void> {
    await this.storage.remove(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  async clearAllData(): Promise<void> {
    await this.storage.clear();
    this.currentUserSubject.next(null);
  }
}
