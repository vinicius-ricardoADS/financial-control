// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  async canActivate(): Promise<boolean> {
    const token = this.authService.getToken();

    // Sem token nenhum → login
    if (!token) {
      await this.router.navigate(['/login']);
      return false;
    }

    // Access token válido → permite
    if (!this.authService.isTokenExpired(token)) {
      return true;
    }

    // Access token expirado → tenta refresh
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken || this.authService.isTokenExpired(refreshToken)) {
      this.authService.logout();
      await this.router.navigate(['/login']);
      return false;
    }

    try {
      const response = await this.userService.refreshToken(refreshToken);
      this.authService.saveTokens(response.token, response.refreshToken);
      return true;
    } catch {
      this.authService.logout();
      await this.router.navigate(['/login']);
      return false;
    }
  }
}
