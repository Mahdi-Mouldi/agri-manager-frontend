import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Weather } from '../models/weather.model';
import { environment } from '../../environments/environment';
@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private url = `${environment.apiUrl}/weather`;
    constructor(private http: HttpClient){}
    getWeatherByParcelle(parcelleId: number): Observable<Weather> {
        return this.http.get<Weather>(`${this.url}/parcelle/${parcelleId}`);
    }
    getWeatherHistoryByParcelle(parcelleId: number): Observable<Weather[]>{
        return this.http.get<Weather[]>(`${this.url}/history/${parcelleId}`);
    }
    deleteWeather(id: number): Observable<void>{
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}