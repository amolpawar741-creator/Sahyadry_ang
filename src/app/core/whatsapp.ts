import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Whatsapp {
   constructor(private http: HttpClient) {}

    sendPdf(mobile: string, file: File) {
    const fd = new FormData();
    fd.append('mobile', mobile);
    fd.append('file', file);
    return this.http.post('https://localhost:7001/api/whatsapp/send-pdf', fd);
  }
}
