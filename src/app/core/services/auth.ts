import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  // 🔥 FAKE LOGIN (por ahora)
  login(username: string, password: string) {
    console.log('Login:', username, password);

    return of({
      token: 'fake-jwt-token'
    }).pipe(delay(500));
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }
}
