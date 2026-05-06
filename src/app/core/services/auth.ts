import { Injectable }         from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Router }              from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Usuario }             from '../models/usuario.model';

const TOKEN_KEY = 'token';
const USER_KEY  = 'usuario';

// Prefijo /backend → interceptado por proxy.conf.json
// → reenvía a https://192.168.111.23/pronosticos/*
const LOGIN_URL   = '/backend/api/auth/login';
const USUARIO_URL = (id: number) => `/backend/app/usuarios/${id}`;
const FORGOT_URL  = '/backend/api/auth/forgot-password';
const RESET_URL   = '/backend/api/auth/reset-password';

const FIELD_USER = 'Usuario';
const FIELD_PASS = 'Password';

interface LoginResponse {
  token: string;
  usuario: { id: number; login: string; nombre: string; [key: string]: any; };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const body: Record<string, string> = {
      [FIELD_USER]: username,
      [FIELD_PASS]: password,
    };
    return this.http.post<LoginResponse>(LOGIN_URL, body).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
      }),
      catchError(err => { this.clearSession(); return throwError(() => err); })
    );
  }

  isAuthenticated(): boolean { return !!localStorage.getItem(TOKEN_KEY); }
  getToken(): string | null  { return localStorage.getItem(TOKEN_KEY); }

  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  logout(): void { this.clearSession(); this.router.navigate(['/login']); }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(FORGOT_URL, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(RESET_URL, { token, password });
  }
}
