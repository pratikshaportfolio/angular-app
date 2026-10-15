
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  private apiUrl = 'http://localhost:3000/api/analyze';

  constructor(private http: HttpClient) {}

  analyzeWebsite(url: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { url: url });
  }
}
