import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
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

  private getTokenExp(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload)) as JwtPayload;
      return decoded.exp ?? null;
    } catch {
      return null;
    }
  }

  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.getToken();
    if (!t) return true;

    const exp = this.getTokenExp(t);
    if (!exp) return true;

    // Considera expirado 30s antes para evitar requisições com token prestes a expirar
    const now = Math.floor(Date.now() / 1000);
    return exp - 30 < now;
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const user = this.decodeToken(token);
    this.currentUserSubject.next(user);
  }

  saveRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  saveTokens(token: string, refreshToken: string): void {
    this.saveToken(token);
    this.saveRefreshToken(refreshToken);

    console.log('Tokens salvos no localStorage:', {
      token: localStorage.getItem(this.TOKEN_KEY),
      refreshToken: localStorage.getItem(this.REFRESH_TOKEN_KEY),
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Se o access token está válido, está autenticado
    if (!this.isTokenExpired(token)) return true;

    // Se expirou, mas tem refresh token, ainda consideramos "autenticado"
    // O interceptor vai cuidar de renovar quando fizer requisição
    const refreshToken = this.getRefreshToken();
    return !!refreshToken && !this.isTokenExpired(refreshToken);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  clearAllData(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
  }
}
