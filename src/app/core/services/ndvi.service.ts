import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NdviImage } from '../models/ndvi.model';
import { environment } from '../../environments/environment';
@Injectable({
    providedIn: 'root'
})  

export class NdviService{
    private url = `${environment.apiUrl}/ndvi`;
    constructor(private http: HttpClient){}
    createPolygon(parcelleId: number): Observable<string> {
        return this.http.post(
            `${this.url}/polygon/${parcelleId}`,
            {},
            { responseType: 'text' }  // ← lire  comme texte brut
  );
}
    searchNdviImages(parcelleId: number, startDate: string, endDate: string): Observable<string> {
        return this.http.get<string>(`${this.url}/search/${parcelleId}`,
            {params: {startDate, endDate}}
        );
    }
    searchNdviHistory(parcelleId: number, startDate: string, endDate: string): Observable<string> {
        return this.http.get<string>(`${this.url}/history/${parcelleId}`,
            {params: {startDate, endDate}}
        );
    }
    syncNdviImages(parcelleId: number, startDate: string, endDate: string): Observable<NdviImage[]>{
        return this.http.post<NdviImage[]>(`${this.url}/sync/${parcelleId}`,{},
            {params: {startDate, endDate}}
        );
    }
    getNdviImageById(id: number): Observable<NdviImage>{
        return this.http.get<NdviImage>(`${this.url}/image/${id}`);
    }
    deleteImageByParcelle(parcelleId: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/parcelle/${parcelleId}`);
    }
    getNdviImagesByParcelle(parcelleId: number): Observable<NdviImage[]>{
        return this.http.get<NdviImage[]>(`${this.url}/parcelle/${parcelleId}`);
    }
}
