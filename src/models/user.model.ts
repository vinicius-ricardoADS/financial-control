export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

export interface UserRegisterResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UserUpdateResponse {
  user: User;
  token?: string;
}
