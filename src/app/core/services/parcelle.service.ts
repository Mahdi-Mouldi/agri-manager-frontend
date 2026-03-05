import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parcelle } from '../models/parcelle.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class ParcelleService {
    private url = `${environment.apiUrl}/parcelles`;
    constructor(private http: HttpClient){}

    addParcelle(parcelle: Parcelle): Observable<Parcelle> {
        return this.http.post<Parcelle>(this.url, parcelle);
    }
    getAllParcellesByFarmerID(farmerId: number): Observable<Parcelle[]> {
        return this.http.get<Parcelle[]>(`${this.url}/farmers/${farmerId}`);
    }
    getAllParcellesByFermeID(fermeId: number): Observable<Parcelle[]> {
        return this.http.get<Parcelle[]>(`${this.url}/fermes/${fermeId}`);
    }
    getParcelleById(id: number): Observable<Parcelle> {
        return this.http.get<Parcelle>(`${this.url}/${id}`);
    }
    getAllParcelles(): Observable<Parcelle[]> {
        return this.http.get<Parcelle[]>(this.url);
    }
    updateParcelle(id: number, updatedParcelle: Parcelle): Observable<Parcelle> {
        return this.http.put<Parcelle>(`${this.url}/${id}`, updatedParcelle);
    }
    deleteParcelle(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

}