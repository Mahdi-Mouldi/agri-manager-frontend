export interface NdviImage{
    id?: number;
    parcelleId?: number;
    imageUrl: string;
    ndviMean: number;
    ndviMax: number;
    ndviMin: number;
    imageDate: string;
    sattelite: string;
    cloudCoverage: number;
}