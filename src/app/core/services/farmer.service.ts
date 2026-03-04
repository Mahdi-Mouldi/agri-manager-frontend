import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Farmer } from '../models/farmer.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FarmerService {
    private url = `${environment.apiUrl}/farmers`;
    constructor(private http: HttpClient) {}
    
    // GET /api/farmers  → getAllFarmers()
    getAll(): Observable<Farmer[]> {
    return this.http.get<Farmer[]>(this.url);
    }
     // GET /api/farmers/:id  → getFarmerById()*

    getFarmerById(id: number): Observable<Farmer> {
        return this.http.get<Farmer>(`${this.url}/${id}`)
    }

    create(farmer: Farmer): Observable<Farmer> {
    return this.http.post<Farmer>(this.url, farmer);
    }
    updateFarmer(id: number, updatedFarmer: Farmer): Observable<Farmer>{
        return this.http.put<Farmer>(`${this.url}/${id}`, updatedFarmer);
    }
    deleteFarmer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}