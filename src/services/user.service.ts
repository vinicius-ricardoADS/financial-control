import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  User,
  UserCreate,
  UserRegisterResponse,
  LoginCredentials,
  LoginResponse,
} from '../models/user.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient) {}

  async register(userData: UserCreate): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.post<UserRegisterResponse>(`${environment.api}/user`, userData)
      );
      return response.user;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.api}/login`, credentials)
      );
      return response.token;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }
}
