import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './env';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient); private router = inject(Router);
  private timer?: any;
  token = signal<string | null>(sessionStorage.getItem('token'));   // sessionStorage: cleared when the tab closes
  name = signal<string>(sessionStorage.getItem('name') ?? '');
  login(username: string, password: string) {
    return this.http.post<{ token: string; fullName: string; expiresAt: string }>(`${API_URL}/auth/login`, { username, password })
      .pipe(tap(r => {
        sessionStorage.setItem('token', r.token); sessionStorage.setItem('name', r.fullName);
        this.token.set(r.token); this.name.set(r.fullName);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.logout(), new Date(r.expiresAt).getTime() - Date.now());   // session timeout
      }));
  }
  logout() { sessionStorage.clear(); this.token.set(null); this.router.navigate(['/login']); }
}
