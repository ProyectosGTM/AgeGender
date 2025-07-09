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

  obtenerUltimoHit(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/api/incidencias/ultimo-hit`);
  }

  obtenerDistribucionPorDia(fecha: string) {
    return this.http.get<any[]>(`${environment.API_SECURITY}/api/incidencias/por-hora?fecha=${fecha}`);
  }

  obtenerGenderPorRango(fechaInicio: string, fechaFin: string): Observable<any> {
    const url = `${environment.API_SECURITY}/api/incidencias/rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.http.get<any>(url);
  }

  obtenerGenderPorRangoHora(fechaInicio: string, fechaFin: string): Observable<any> {
    const url = `${environment.API_SECURITY}/api/incidencias/por-hora-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.http.get<any>(url);
  }

  obtenerIncidencias(
    fechaInicioInc: string,
    fechaFinInc: string,
    page: number,
    limit: number
  ): Observable<any> {
    const url = `https://agegender.ddns.net/api/incidencias/rango-paginado?fechaInicio=${fechaInicioInc}&fechaFin=${fechaFinInc}&page=${page}&limit=${limit}&nocache=${Date.now()}`;
    return this.http.get(url);
  }


}