import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FermeService } from '../../core/services/ferme.service';
import { ParcelleService } from '../../core/services/parcelle.service';
import { FarmerService } from '../../core/services/farmer.service';
import { Ferme } from '../../core/models/ferme.model';
import { Parcelle, SyncStatus } from '../../core/models/parcelle.model';
import { Farmer } from '../../core/models/farmer.model';
import { NdviService } from '../../core/services/ndvi.service';
import { NdviImage } from '../../core/models/ndvi.model';

// OpenLayers
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { Fill, Stroke, Style } from 'ol/style';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';

@Component({
  selector: 'app-fermes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ferme.html',
  styleUrls: ['./ferme.css']
})
export class FermesComponent implements OnInit {

  fermes: Ferme[] = [];
  filteredFermes: Ferme[] = [];
  farmers: Farmer[] = [];
  parcelles: { [fermeId: number]: Parcelle[] } = {};
  expandedFermeId: number | null = null;
  filterAgriculteur: string = '';
  filterRegion: string = '';
  filterPropriete: string = '';
  regions: string[] = [];

  // Ferme Modal
  showFermeModal: boolean = false;
  fermeEditMode: boolean = false;
  fermeEditId: number | null = null;
  fermeForm: Ferme = { ferme_name: '', ferme_address: '', superficieTotale: 0, latitude: 0, longitude: 0, description: '', farmer_id: 0 };
  fermeErrors = { ferme_name: false, ferme_address: false };

  // Parcelle Modal
  showParcelleModal: boolean = false;
  parcelleEditMode: boolean = false;
  parcelleEditId: number | null = null;
  parcelleForm: Parcelle = { name: '', geometryJson: '', farmerId: 0, fermeId: 0, culture: '', variete: '', superficie: 0 };
  parcelleErrors = { name: false };
  errorMessage: string = '';

  // NDVI Modal
  showNdviModal = false;
  selectedParcelleNdvi: Parcelle | null = null;
  ndviImages: NdviImage[] = [];
  selectedNdviImage: NdviImage | null = null;
  ndviLoading = false;
  selectedIndex = 'ndvi';

  // Carte NDVI
  ndviMap!: Map;
ndviImageLayer!: ImageLayer<Static>;
  constructor(
    private fermeService: FermeService,
    private parcelleService: ParcelleService,
    private ndviService: NdviService,
    private farmerService: FarmerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFermes();
    this.loadFarmers();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.loadFermes());
  }

  loadFermes(): void {
    this.fermeService.getAll().subscribe({
      next: (data) => {
        this.fermes = [...data];
        this.filteredFermes = [...data];
        this.regions = [...new Set(data.map(f => f.ferme_address).filter(Boolean))];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur fermes', err)
    });
  }

  loadFarmers(): void {
    this.farmerService.getAll().subscribe({
      next: (data) => { this.farmers = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Erreur farmers', err)
    });
  }

  loadParcellesByFerme(fermeId: number): void {
    this.parcelleService.getAllParcellesByFermeID(fermeId).subscribe({
      next: (data) => { this.parcelles[fermeId] = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Erreur parcelles', err)
    });
  }

  toggleFerme(ferme: Ferme): void {
    if (this.expandedFermeId === ferme.id) {
      this.expandedFermeId = null;
    } else {
      this.expandedFermeId = ferme.id!;
      if (!this.parcelles[ferme.id!]) this.loadParcellesByFerme(ferme.id!);
    }
  }

  applyFilters(): void {
    this.filteredFermes = this.fermes.filter(f => {
      const matchAgri = !this.filterAgriculteur ||
        this.getFarmerName(f.farmer_id).toLowerCase()
          .includes(this.filterAgriculteur.toLowerCase());
      const matchRegion = !this.filterRegion ||
        f.ferme_address === this.filterRegion;
      const matchProp = !this.filterPropriete ||
        f.description === this.filterPropriete;
      return matchAgri && matchRegion && matchProp;
    });
  }

  getFarmerName(farmerId: number): string {
    const farmer = this.farmers.find(f => f.id === farmerId);
    return farmer ? farmer.name : '—';
  }

  getSyncClass(status?: SyncStatus): string {
    if (status === 'SYNCED') return 'badge-synced';
    if (status === 'FAILED') return 'badge-failed';
    return 'badge-pending';
  }

  openAddFermeModal(): void {
    this.fermeEditMode = false;
    this.fermeEditId = null;
    this.fermeForm = { ferme_name: '', ferme_address: '', superficieTotale: 0, latitude: 0, longitude: 0, description: '', farmer_id: 0 };
    this.fermeErrors = { ferme_name: false, ferme_address: false };
    this.errorMessage = '';
    this.showFermeModal = true;
  }

  openEditFermeModal(ferme: Ferme): void {
    this.fermeEditMode = true;
    this.fermeEditId = ferme.id!;
    this.fermeForm = { ...ferme };
    this.fermeErrors = { ferme_name: false, ferme_address: false };
    this.errorMessage = '';
    this.showFermeModal = true;
  }

  submitFermeForm(): void {
    this.fermeErrors.ferme_name    = !this.fermeForm.ferme_name.trim();
    this.fermeErrors.ferme_address = !this.fermeForm.ferme_address.trim();
    if (this.fermeErrors.ferme_name || this.fermeErrors.ferme_address) return;

    if (this.fermeEditMode && this.fermeEditId) {
      this.fermeService.updateFerme(this.fermeEditId, this.fermeForm).subscribe({
        next: (updated) => {
          const i = this.fermes.findIndex(f => f.id === this.fermeEditId);
          if (i !== -1) { this.fermes[i] = updated; this.fermes = [...this.fermes]; }
          this.applyFilters(); this.closeModal(); this.cdr.detectChanges();
        },
        error: () => { this.errorMessage = 'Erreur mise à jour.'; }
      });
    } else {
      this.fermeService.createFerme(this.fermeForm).subscribe({
        next: (created) => {
          this.fermes = [...this.fermes, created];
          this.applyFilters(); this.closeModal(); this.cdr.detectChanges();
        },
        error: () => { this.errorMessage = 'Erreur création.'; }
      });
    }
  }

  deleteFerme(id: number): void {
    if (!confirm('Supprimer cette ferme et ses parcelles ?')) return;
    this.fermeService.deleteFerme(id).subscribe({
      next: () => {
        this.fermes = [...this.fermes.filter(f => f.id !== id)];
        this.applyFilters();
        delete this.parcelles[id];
        if (this.expandedFermeId === id) this.expandedFermeId = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur suppression ferme', err)
    });
  }

  openAddParcelleModal(ferme: Ferme): void {
    this.parcelleEditMode = false;
    this.parcelleEditId = null;
    this.parcelleForm = { name: '', geometryJson: '', farmerId: ferme.farmer_id, fermeId: ferme.id!, culture: '', variete: '', superficie: 0 };
    this.parcelleErrors = { name: false };
    this.errorMessage = '';
    this.showParcelleModal = true;
  }

  openEditParcelleModal(parcelle: Parcelle): void {
    this.parcelleEditMode = true;
    this.parcelleEditId = parcelle.id!;
    this.parcelleForm = { ...parcelle };
    this.parcelleErrors = { name: false };
    this.errorMessage = '';
    this.showParcelleModal = true;
  }

  submitParcelleForm(): void {
    this.parcelleErrors.name = !this.parcelleForm.name.trim();
    if (this.parcelleErrors.name) return;

    if (this.parcelleEditMode && this.parcelleEditId) {
      this.parcelleService.updateParcelle(this.parcelleEditId, this.parcelleForm).subscribe({
        next: (updated) => {
          const fermeId = updated.fermeId;
          if (this.parcelles[fermeId]) {
            const i = this.parcelles[fermeId].findIndex(p => p.id === updated.id);
            if (i !== -1) { this.parcelles[fermeId][i] = updated; this.parcelles = { ...this.parcelles }; }
          }
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: () => { this.errorMessage = 'Erreur mise à jour.'; }
      });
    } else {
      this.parcelleService.addParcelle(this.parcelleForm).subscribe({
        next: (created) => {
          const fermeId = created.fermeId;
          if (!this.parcelles[fermeId]) this.parcelles[fermeId] = [];
          this.parcelles[fermeId] = [...this.parcelles[fermeId], created];
          this.parcelles = { ...this.parcelles };
          this.closeModal(); this.cdr.detectChanges();
        },
        error: () => { this.errorMessage = 'Erreur création.'; }
      });
    }
  }

  deleteParcelle(id: number): void {
    if (!confirm('Supprimer cette parcelle ?')) return;
    this.parcelleService.deleteParcelle(id).subscribe({
      next: () => {
        for (const fermeId in this.parcelles) {
          this.parcelles[fermeId] = this.parcelles[fermeId].filter(p => p.id !== id);
        }
        this.parcelles = { ...this.parcelles };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur suppression parcelle', err)
    });
  }

  closeModal(): void {
    this.showFermeModal = false;
    this.showParcelleModal = false;
    this.errorMessage = '';
  }

  // ── NDVI ──

  openNdviModal(p: Parcelle): void {
    this.selectedParcelleNdvi = p;
    this.showNdviModal = true;
    this.ndviImages = [];
    this.ndviLoading = true;
    this.selectedNdviImage = null;
    this.selectedIndex = 'ndvi';
    this.cdr.detectChanges();
    this.syncNdvi();
  }

  syncNdvi(): void {
    if (!this.selectedParcelleNdvi || !this.selectedParcelleNdvi.id) return;

    const parcelleId = this.selectedParcelleNdvi.id;
    const startDate = '2025-01-01';
    const endDate = new Date().toISOString().split('T')[0]; // aujourd'hui

    this.ndviLoading = true;
    this.ndviImages = [];
    this.selectedNdviImage = null;

    // Étape 1 : créer le polygone sur Agromonitoring
    this.ndviService.createPolygon(parcelleId).subscribe({
      next: () => {
        // Étape 2 : sync les images NDVI depuis Agromonitoring + sauvegarder en BDD
        this.ndviService.syncNdviImages(parcelleId, startDate, endDate).subscribe({
          next: (images) => {
            this.ndviImages = images;
            this.selectedNdviImage = images.length > 0 ? images[0] : null;
            this.ndviLoading = false;
            this.cdr.detectChanges();
            // Étape 3 : initialiser la carte après que le DOM soit prêt
            setTimeout(() => this.initNdviMap(), 100);
          },
          error: (err) => {
            console.error('Erreur sync NDVI', err);
            this.ndviLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur création polygone', err);
        this.ndviLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initNdviMap(): void {
    if (!this.selectedParcelleNdvi) return; // guard

    // Style du polygone vert
    const polygonStyle = new Style({
      fill: new Fill({ color: 'rgba(34, 197, 94, 0.2)' }),
      stroke: new Stroke({ color: '#16a34a', width: 2.5 })
    });

    // VectorSource : stocke le polygone de la parcelle
    const vectorSource = new VectorSource();

    // Lire le GeoJSON et l'ajouter au vectorSource
    if (this.selectedParcelleNdvi?.geometryJson) {
      try {
        const feature = new GeoJSON().readFeature(
          this.selectedParcelleNdvi.geometryJson,
          {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }
        ) as Feature;
        vectorSource.addFeature(feature);
      } catch (e) {
        console.error('GeoJSON invalide', e);
      }
    }

    // VectorLayer : affiche le polygone sur la carte
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: polygonStyle
    });

    // ImageLayer : affiche l'image NDVI par dessus la carte
    const extent = vectorSource.getExtent();
    this.ndviImageLayer = new ImageLayer({
      source: new Static({
        url: this.selectedNdviImage?.imageUrl || '',
        imageExtent: extent && extent[0] !== Infinity ? extent : [0, 0, 1, 1],
        projection: 'EPSG:3857'
      }),
      opacity: 0.8
    });

    // Créer la carte dans div#ndvi-map
    this.ndviMap = new Map({
      target: 'ndvi-map',
      layers: [
        // Couche 1 : fond satellite Esri
        new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19
          })
        }),
        // Couche 2 : polygone vert de la parcelle
        vectorLayer,
        // Couche 3 : image NDVI colorée par dessus
        this.ndviImageLayer
      ],
      view: new View({
        center: fromLonLat([10.1, 36.8]),
        zoom: 13
      })
    });

    // Zoomer automatiquement sur le polygone
    if (this.selectedParcelleNdvi.geometryJson) {
  const extent = vectorSource.getExtent();
  if (extent && extent[0] !== Infinity) {
    this.ndviMap.getView().fit(extent, {
      padding: [40, 40, 40, 40],
      duration: 500,
      maxZoom: 17
    });
  }
}

    this.cdr.detectChanges();
  }

  selectNdviDate(image: NdviImage): void {
    this.selectedNdviImage = image;

    // Mettre à jour l'image NDVI sur la carte
    if (this.ndviImageLayer && image.imageUrl) {
      const vectorSource = new VectorSource();
      if (this.selectedParcelleNdvi?.geometryJson) {
        const feature = new GeoJSON().readFeature(
          this.selectedParcelleNdvi.geometryJson,
          { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
        ) as Feature;
        vectorSource.addFeature(feature);
      }
      const extent = vectorSource.getExtent();
      this.ndviImageLayer.setSource(new Static({
        url: image.imageUrl,
        imageExtent: extent && extent[0] !== Infinity ? extent : [0, 0, 1, 1],
        projection: 'EPSG:3857'
      }));
    }
    this.cdr.detectChanges();
  }

  closeNdviModal(): void {
    this.showNdviModal = false;
    this.ndviImages = [];
    this.selectedNdviImage = null;
    this.selectedParcelleNdvi = null;
    this.ndviLoading = false;

    // Détruire la carte pour libérer la mémoire
    if (this.ndviMap) {
      this.ndviMap.setTarget(undefined as any);
    }
    this.cdr.detectChanges();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  }
}