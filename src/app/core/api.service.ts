import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './env';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private p(o?: Record<string, any>) {
    let hp = new HttpParams();
    Object.entries(o ?? {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') hp = hp.set(k, String(v)); });
    return hp;
  }
  get<T>(path: string, params?: Record<string, any>) { return this.http.get<T>(`${API_URL}/${path}`, { params: this.p(params) }); }
  post<T>(path: string, body: any) { return this.http.post<T>(`${API_URL}/${path}`, body); }
  put<T>(path: string, body: any) { return this.http.put<T>(`${API_URL}/${path}`, body); }
  patch<T>(path: string, body: any = {}) { return this.http.patch<T>(`${API_URL}/${path}`, body); }
  blob(path: string, params?: Record<string, any>) { return this.http.get(`${API_URL}/${path}`, { params: this.p(params), responseType: 'blob' }); }
  download(path: string, name: string, params?: Record<string, any>) {
    this.blob(path, params).subscribe(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href); });
  }
}
