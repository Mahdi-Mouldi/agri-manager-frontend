export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface Parcelle {
    id?: number;
    name: string;
    geometryJson: string;
    agroPolygonId?: string;
    dateCreation?: string;
    dateModification?: string; // ← polygone dessiné en GeoJSON
    syncStatus?: SyncStatus;
    farmerId: number;
    fermeId: number;
    culture?: string;     // ← ajouter
    variete?: string;     // ← ajouter
    superficie?: number;  // ← ajouter
}