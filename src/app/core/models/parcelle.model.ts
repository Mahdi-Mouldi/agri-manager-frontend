export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface Parcelle {
    id?: number;
    name: string;
    geometryJson: string;  // ← polygone dessiné en GeoJSON
    syncStatus?: SyncStatus;
    farmerId: number;
    fermeId: number;
}