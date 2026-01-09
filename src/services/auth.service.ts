import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private storage: StorageService) {}

  async saveToken(token: string): Promise<void> {
    await this.storage.set(this.TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    return await this.storage.get(this.TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async logout(): Promise<void> {
    await this.storage.remove(this.TOKEN_KEY);
  }

  async clearAllData(): Promise<void> {
    await this.storage.clear();
  }
}
