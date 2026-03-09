export interface Ferme {
    id?: number;
    ferme_name: string;
    ferme_address: string;
    superficieTotale: number;
    latitude: number;
    longitude: number;
    description: string;
    farmer_id: number;
    synced?: boolean;  // ← ajouter cette ligne

    }