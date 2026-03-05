import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ferme } from '../models/ferme.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class FermeService{
    private url = `${environment.apiUrl}/fermes`;
    constructor(private http: HttpClient){}

    getByFarmerId(farmerId: number): Observable<Ferme[]> {
    return this.http.get<Ferme[]>(`${this.url}/farmer/${farmerId}`);
    }
    getAll(): Observable<Ferme[]> {
        return this.http.get<Ferme[]>(this.url);
    }
    getById(id: number): Observable<Ferme> {
        return this.http.get<Ferme>(`${this.url}/${id}`);
    }
    createFerme(ferme: Ferme): Observable<Ferme> {
        return this.http.post<Ferme>(this.url, ferme);
    }
    updateFerme(id: number, updatedFerme: Ferme): Observable<Ferme> {
        return this.http.put<Ferme>(`${this.url}/${id}`, updatedFerme);
    }
    deleteFerme(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}