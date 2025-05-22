import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgeGenderService {

  constructor(private http: HttpClient) { }

  obtenerGender(): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/api/incidencias`);
  }
  
}
