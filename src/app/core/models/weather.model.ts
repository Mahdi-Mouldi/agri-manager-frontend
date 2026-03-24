export interface Weather{
    id?: number;
    parcelleId?: number;
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    temperatureMean: number;
    precipitation: number;
    rainSum: number;
    windSpeedMax: number;
    windSpeedMean: number;
    sunshineDuration: number;
    uvIndex: number;
}