import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { getArea } from 'ol/sphere';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { Polygon } from 'ol/geom';
import { Extent } from 'ol/extent';
import booleanWithin from '@turf/boolean-within';

import { ParcelleService } from '../../core/services/parcelle.service';
import { FermeService } from '../../core/services/ferme.service';
import { Parcelle } from '../../core/models/parcelle.model';
import { Ferme } from '../../core/models/ferme.model';

@Component({
  selector: 'app-parcelles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcelles.html',
  styleUrl: './parcelles.css',
})
export class ParcellesComponent implements OnInit, AfterViewInit {
  map!: Map;

  // Fermes déjà stockées
  fermeSource = new VectorSource();
  fermeLayer!: VectorLayer<VectorSource>;

  // Parcelles déjà stockées
  parcellesSource = new VectorSource();
  parcellesLayer!: VectorLayer<VectorSource>;

  // Dessin en cours (ferme ou parcelle)
  dessinSource = new VectorSource();
  dessinLayer!: VectorLayer<VectorSource>;

  draw!: Draw;
  drawingMode = false;
  drawingType: 'ferme' | 'parcelle' | null = null;

  parcelles: Parcelle[] = [];
  fermes: Ferme[] = [];
  filteredFermes: Ferme[] = [];

  selectedFerme: Ferme | null = null;
  searchQuery = '';

  showSaveModal = false;

  parcelleForm = {
    name: '',
    culture: '',
    variete: ''
  };

  formErrors = { name: false };
  errorMessage = '';
  calculatedArea = '';
  geometryJson = '';

  constructor(
    private parcelleService: ParcelleService,
    private fermeService: FermeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFermes();
    this.loadParcelles();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.refreshMapData();
  }

  loadFermes(): void {
    this.fermeService.getAll().subscribe({
      next: (data) => {
        this.fermes = data;
        this.filteredFermes = data;
        this.refreshMapData();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur fermes', err)
    });
  }

  loadParcelles(): void {
    this.parcelleService.getAllParcelles().subscribe({
      next: (data) => {
        this.parcelles = data;
        this.refreshMapData();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur parcelles', err)
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredFermes = this.fermes.filter(f =>
      f.ferme_name.toLowerCase().includes(q) ||
      (f.ferme_address || '').toLowerCase().includes(q)
    );
  }

  initMap(): void {
    this.fermeLayer = new VectorLayer({
      source: this.fermeSource,
      style: new Style({
        stroke: new Stroke({
          color: '#2563eb',
          width: 3
        }),
        fill: new Fill({
          color: 'rgba(37, 99, 235, 0)'
        })
      })
    });

    this.parcellesLayer = new VectorLayer({
      source: this.parcellesSource,
      style: new Style({
        stroke: new Stroke({
          color: '#16a34a',
          width: 2.5
        }),
        fill: new Fill({
          color: 'rgba(34, 197, 94, 0.30)'
        })
      })
    });

    this.dessinLayer = new VectorLayer({
      source: this.dessinSource,
      style: new Style({
        stroke: new Stroke({
          color: '#f59e0b',
          width: 2,
          lineDash: [6, 4]
        }),
        fill: new Fill({
          color: 'rgba(245, 158, 11, 0.15)'
        }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#f59e0b' }),
          stroke: new Stroke({ color: 'white', width: 1.5 })
        })
      })
    });

    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19
          })
        }),
        this.fermeLayer,
        this.parcellesLayer,
        this.dessinLayer
      ],
      view: new View({
        center: fromLonLat([10.1, 36.8]),
        zoom: 13
      })
    });
  }

  refreshMapData(): void {
    if (!this.map) return;
    this.afficherToutesLesFermes();
    this.afficherToutesLesParcelles();
  }

  afficherToutesLesFermes(): void {
    this.fermeSource.clear();

    this.fermes.forEach(f => {
      if (!f.geometryJson) return;

      try {
        const feature = new GeoJSON().readFeature(f.geometryJson, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        }) as Feature;

        feature.setId(`ferme-${f.id}`);
        this.fermeSource.addFeature(feature);
      } catch (e) {
        console.error('GeoJSON invalide pour ferme', f.id, e);
      }
    });
  }

  afficherToutesLesParcelles(): void {
    this.parcellesSource.clear();

    this.parcelles.forEach(p => {
      if (!p.geometryJson) return;

      try {
        const feature = new GeoJSON().readFeature(p.geometryJson, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        }) as Feature;

        feature.setId(`parcelle-${p.id}`);
        this.parcellesSource.addFeature(feature);
      } catch (e) {
        console.error('GeoJSON invalide pour parcelle', p.id, e);
      }
    });
  }

  selectFerme(f: Ferme): void {
    this.selectedFerme = f;
    this.errorMessage = '';
    this.clearDrawing(false);

    if (!f.geometryJson || !this.map) return;

    try {
      const feature = new GeoJSON().readFeature(f.geometryJson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }) as Feature;

      const geometry = feature.getGeometry();
      if (geometry) {
        const extent = geometry.getExtent() as Extent;
        this.map.getView().fit(extent, {
          padding: [60, 60, 60, 60],
          duration: 600,
          maxZoom: 17
        });
      }
    } catch (e) {
      console.error('Erreur affichage ferme', e);
    }
  }

  startDrawingFerme(): void {
    if (!this.selectedFerme) {
      this.errorMessage = 'Veuillez sélectionner une ferme dans la liste.';
      return;
    }

    this.stopDrawing();
    this.dessinSource.clear();
    this.geometryJson = '';
    this.calculatedArea = '';
    this.errorMessage = '';
    this.drawingMode = true;
    this.drawingType = 'ferme';

    this.draw = new Draw({
      source: this.dessinSource,
      type: 'Polygon'
    });

    this.draw.on('drawend', (event: any) => {
      const feature: Feature = event.feature;
      const geometry = feature.getGeometry() as Polygon;

      const areaM2 = getArea(geometry);
      this.calculatedArea = (areaM2 / 10000).toFixed(3);

      this.geometryJson = new GeoJSON().writeGeometry(geometry, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      console.log('geometryJson après dessin = ', this.geometryJson);
      this.drawingMode = false;
      this.map.removeInteraction(this.draw);
      this.cdr.detectChanges();
    });

    this.map.addInteraction(this.draw);
  }
  saveFermeGeometry(): void {
  if (!this.selectedFerme) {
    this.errorMessage = 'Aucune ferme sélectionnée.';
    return;
  }

  if (!this.geometryJson || this.drawingType !== 'ferme') {
    this.errorMessage = 'Veuillez dessiner le contour de la ferme.';
    return;
  }

  const updatedFerme: Ferme = {
    ...this.selectedFerme,
    geometryJson: this.geometryJson,
    superficieTotale: parseFloat(this.calculatedArea) || this.selectedFerme.superficieTotale
  };

  console.log('geometryJson frontend = ', this.geometryJson);
  console.log('updatedFerme envoyé = ', updatedFerme);

  this.fermeService.updateFerme(this.selectedFerme.id!, updatedFerme).subscribe({
    next: (data) => {
      console.log('réponse backend = ', data);

      this.selectedFerme = data;

      const index = this.fermes.findIndex(f => f.id === data.id);
      if (index !== -1) {
        this.fermes[index] = data;
        this.fermes = [...this.fermes];
        this.filteredFermes = [...this.fermes];
      }

      this.refreshMapData();
      this.clearDrawing(false);
      this.errorMessage = '';
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('erreur backend = ', err);
      this.errorMessage = err.error?.message || 'Erreur lors de la sauvegarde de la ferme.';
      this.cdr.detectChanges();
    }
  });
}
/*
  saveFermeGeometry(): void {
    if (!this.selectedFerme) {
      this.errorMessage = 'Aucune ferme sélectionnée.';
      return;
    }

    if (!this.geometryJson || this.drawingType !== 'ferme') {
      this.errorMessage = 'Veuillez dessiner le contour de la ferme.';
      return;
    }

    const updatedFerme: Ferme = {
      ...this.selectedFerme,
      geometryJson: this.geometryJson,
      superficieTotale: parseFloat(this.calculatedArea) || this.selectedFerme.superficieTotale
    };

    this.fermeService.updateFerme(this.selectedFerme.id!, updatedFerme).subscribe({
      next: (data) => {
        this.selectedFerme = data;

        const index = this.fermes.findIndex(f => f.id === data.id);
        if (index !== -1) {
          this.fermes[index] = data;
          this.fermes = [...this.fermes];
          this.filteredFermes = [...this.fermes];
        }

        this.refreshMapData();
        this.clearDrawing(false);
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la sauvegarde de la ferme.';
        this.cdr.detectChanges();
      }
    });
  }
*/
  startDrawingParcelle(): void {
    if (!this.selectedFerme) {
      this.errorMessage = 'Veuillez sélectionner une ferme dans la liste.';
      return;
    }

    if (!this.selectedFerme.geometryJson) {
      this.errorMessage = 'Veuillez d’abord dessiner la ferme.';
      return;
    }

    this.stopDrawing();
    this.dessinSource.clear();
    this.geometryJson = '';
    this.calculatedArea = '';
    this.errorMessage = '';
    this.drawingMode = true;
    this.drawingType = 'parcelle';

    this.draw = new Draw({
      source: this.dessinSource,
      type: 'Polygon'
    });

    this.draw.on('drawend', (event: any) => {
      const feature: Feature = event.feature;
      const geometry = feature.getGeometry() as Polygon;

      const areaM2 = getArea(geometry);
      this.calculatedArea = (areaM2 / 10000).toFixed(3);

      this.geometryJson = new GeoJSON().writeGeometry(geometry, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      this.drawingMode = false;
      this.map.removeInteraction(this.draw);
      this.showSaveModal = true;
      this.cdr.detectChanges();
    });

    this.map.addInteraction(this.draw);
  }

  stopDrawing(): void {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
    this.drawingMode = false;
    this.drawingType = null;
  }

  clearDrawing(resetMessage = true): void {
    this.dessinSource.clear();
    this.geometryJson = '';
    this.calculatedArea = '';
    this.stopDrawing();

    if (resetMessage) {
      this.errorMessage = '';
    }

    this.cdr.detectChanges();
  }

  parcelleDansFerme(): boolean {
    if (!this.selectedFerme || !this.selectedFerme.geometryJson) {
      this.errorMessage = 'Veuillez sélectionner une ferme déjà dessinée.';
      return false;
    }

    if (!this.geometryJson) {
      this.errorMessage = 'Veuillez dessiner une parcelle.';
      return false;
    }

    const parcelleGeo = JSON.parse(this.geometryJson);
    const fermeGeo = JSON.parse(this.selectedFerme.geometryJson);

    const inside = booleanWithin(parcelleGeo, fermeGeo);

    if (!inside) {
      this.errorMessage = 'La parcelle dépasse les limites de la ferme.';
      return false;
    }

    return true;
  }

  submitParcelleForm(): void {
    if (!this.parcelleDansFerme()) return;

    this.formErrors.name = !this.parcelleForm.name.trim();
    if (this.formErrors.name) return;

    if (!this.selectedFerme) {
      this.errorMessage = 'Aucune ferme sélectionnée';
      return;
    }

    const nouvelleParcelle: Parcelle = {
      name: this.parcelleForm.name,
      geometryJson: this.geometryJson,
      syncStatus: 'PENDING',
      fermeId: this.selectedFerme.id!,
      farmerId: this.selectedFerme.farmer_id,
      culture: this.parcelleForm.culture,
      variete: this.parcelleForm.variete,
      superficie: parseFloat(this.calculatedArea)
    };

    this.parcelleService.addParcelle(nouvelleParcelle).subscribe({
      next: (created) => {
        this.parcelles = [...this.parcelles, created];
        this.refreshMapData();
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la sauvegarde.';
        this.cdr.detectChanges();
      }
    });
  }

  closeModal(): void {
    this.showSaveModal = false;
    this.errorMessage = '';
    this.parcelleForm = {
      name: '',
      culture: '',
      variete: ''
    };
    this.formErrors = { name: false };
    this.clearDrawing(false);
  }
}