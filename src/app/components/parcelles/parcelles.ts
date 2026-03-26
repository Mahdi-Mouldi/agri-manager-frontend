import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//OpenLayers

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
export class ParcellesComponent implements OnInit, AfterViewInit{
  map!: Map;
  vectorSource = new VectorSource();
  vectorLayer!: VectorLayer;
  draw!: Draw;
  drawingMode = false;  
  //donnes
  parcelles: Parcelle[] = [];
  filteredParcelles: Parcelle[] = [];
  fermes: Ferme[] = [];
  selectedParcelle: Parcelle | null = null;
  searchQuery = '';
 // ── Modal ──
  showSaveModal = false;
  parcelleForm = {
    name: '',
    culture: '',
    variete: '',
    fermeId: 0,
    farmerId: 0
  };
  formErrors = { name: false, fermeId: false };
  errorMessage = '';
  calculatedArea = '';
  geometryJson = '';
  constructor(
    private parcelleService: ParcelleService,
    private fermeService: FermeService,
    private cdr : ChangeDetectorRef
  ){}
  ngOnInit(): void {
    this.loadParcelles();
    this.loadFermes();  
  }
  ngAfterViewInit(): void {
    this.initMap();
  }

  loadParcelles(): void {
    this.parcelleService.getAllParcelles().subscribe({
      next: (data) => {
        this.parcelles = data;
        this.filteredParcelles = data;
        this.cdr.detectChanges();
        this.afficherTousLesPolygones();
      },
            error: (err) => console.error('Erreur parcelles', err)
    });
  }
  loadFermes(): void{
    this.fermeService.getAll().subscribe({
      next: (data) => {
        this.fermes = data;
        this.cdr.detectChanges();
      }
    });
  }
    // ── Filtre recherche ──
    applyFilter(): void{
      const q = this.searchQuery.toLowerCase();
      this.filteredParcelles= this.parcelles.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.culture || '').toLowerCase().includes(q)
      );

    }

    //initialiser le Map
    initMap(): void {
      //style Polygon 
      const polygonStyle =  new Style({
      fill: new Fill({ color: 'rgba(34, 197, 94, 0.35)' }),
      stroke: new Stroke({ color: '#16a34a', width: 2.5 }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#16a34a' }),
        stroke: new Stroke({ color: 'white', width: 1.5 })
      })
    });

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: polygonStyle
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
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([10.1, 36.8]),
        zoom: 13
      })
    });
    
    }
// ── Afficher tous les polygones existants ──
  afficherTousLesPolygones(): void {
    this.vectorSource.clear();
    this.parcelles.forEach(p => {
      if (p.geometryJson) {
        try {
          const feature = new GeoJSON().readFeature(p.geometryJson, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          })as Feature;
          feature.setId(p.id);
          this.vectorSource.addFeature(feature);
        } catch (e) {
          console.error('GeoJSON invalide pour parcelle', p.id, e);
        }
      }
    });
  }
    // ── Sélectionner une parcelle ──
    selectParcelle(p: Parcelle): void {
      this.selectedParcelle = p;
      this.stopDrawing();
      if(p.geometryJson){
        this.zoomSurParcelle(p);
      }
      this.cdr.detectChanges();
    }
    // Voir Sur Carte 
    voirSurCarte(p: Parcelle): void {
      this.selectedParcelle = p;
      this.stopDrawing();

      // Chercher le feature déjà dans vectorSource
      const feature = this.vectorSource
        .getFeatureById(p.id!) as Feature;

      if (feature) {
        // Feature existe → zoomer directement
        const geometry = feature.getGeometry();
        if (geometry) {
          const extent = geometry.getExtent() as Extent;
          this.map.getView().fit(extent, {
            padding: [60, 60, 60, 60],
            duration: 600,
            maxZoom: 17
          });
        }
      } else if (p.geometryJson) {
        // Feature pas encore dans vectorSource → zoomer quand même
        this.zoomSurParcelle(p);
      }
      this.cdr.detectChanges();
    }     
      // ── Zoom sur une parcelle ──
      zoomSurParcelle(p: Parcelle): void{
        if(!p.geometryJson) return;
        try{
          const feature = new GeoJSON().readFeature(p.geometryJson,{
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
          }) as Feature;
          const geometry = feature.getGeometry();
          if(geometry){
            const extent = geometry.getExtent() as Extent;
            this.map.getView().fit(extent, {
              padding: [60, 60, 60, 60],
              duration: 600,
              maxZoom: 17
            });
          }
        }catch (e) {
          console.error('Zoom error', e);
    }     
      }
      // ── Activer dessin depuis card ──
      activerDessin(p: Parcelle): void{
        this.selectedParcelle = p;
        this.cdr.detectChanges();
        setTimeout(() => this.startDrawing(), 100);
      }
        // ── Commencer le dessin ──
      startDrawing(): void {
        this.stopDrawing();
        this.vectorSource.clear();
        this.geometryJson = '';
        this.calculatedArea = '';
        this.drawingMode = true;
        // Style pendant le dessin
      const drawStyle = new Style({
        fill: new Fill({ color: 'rgba(37, 99, 235, 0.2)' }),
        stroke: new Stroke({ color: '#2563eb', width: 2, lineDash: [6, 4] }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#2563eb' }),
          stroke: new Stroke({ color: 'white', width: 1.5 })
          })          
        });
        this.draw = new Draw({
          source: this.vectorSource,
          type: 'Polygon',
          style: drawStyle
        });  
            // Événement fin de dessin
        this.draw.on('drawend', (event: any)=>{
            // Quand l'utilisateur finit de dessiner un polygon, cette fonction s'exécute
          const feature : Feature = event.feature;
            // Récupère l'objet Feature qui vient d'être dessiné
            const geometry = feature.getGeometry() as Polygon;//recuperer les cordonnes depuis le Feature
            //calculer le superficier en ha
            const areaM2 = getArea(geometry); //calcul le superfice en metre carres
            const hectares = (areaM2/10000).toFixed(3); 
            this.calculatedArea = hectares;
            // ── Récupérer GeoJSON de la géométrie ──
            this.geometryJson = new GeoJSON().writeGeometry(geometry, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            });
        
        this.drawingMode = false;
        this.map.removeInteraction(this.draw);
        if(this.selectedParcelle){
          this.savePolygon();
        }else{
          this.showSaveModal = true;// Affiche la fenêtre/modal pour sauvegarder la parcelle
        }
        
        this.cdr.detectChanges();
        });
        this.map.addInteraction(this.draw);
      }
      // ── Arrêter le dessin ──
      stopDrawing(): void{
        if(this.draw){
          this.map.removeInteraction(this.draw);
        }
        this.drawingMode = false;
      }
      // ── Effacer le dessin ──
      clearDrawing(): void{
        this.vectorSource.clear();
        this.geometryJson = '';
        this.calculatedArea = '';
        this.drawingMode = false;
        this.stopDrawing();
        this.afficherTousLesPolygones();
        this.cdr.detectChanges();
      }
      // ── Sauvegarder polygone sur parcelle existante ──
      savePolygon(): void{
        if( !this.geometryJson ) return;
        if(this.selectedParcelle){
          const updated: Parcelle = {
          ...this.selectedParcelle,
          geometryJson : this.geometryJson,
          superficie: parseFloat(this.calculatedArea)
        }
        this.parcelleService.updateParcelle(this.selectedParcelle.id!, updated).subscribe({
          next: (data) => {
            const i = this.parcelles.findIndex(p => p.id == data.id);
            if(i !==-1){
              this.parcelles[i] = data;
              this.parcelles = [...this.parcelles];
              
            }
            this.selectedParcelle = data;
            this.applyFilter();
            this.afficherTousLesPolygones();
            this.geometryJson = '';
            this.calculatedArea = '';
            this.cdr.detectChanges();
          },
          // Dans savePolygon() et submitParcelleForm()
          error: (err) => {
            // ✅ Afficher message d'erreur clair
            if (err.error?.message?.includes('trop éloignée')) {
              this.errorMessage = err.error.message;
            } else {
              this.errorMessage = 'Erreur lors de la sauvegarde.';
            }
            this.cdr.detectChanges();
          }
        });
        }else{
          this.showSaveModal = true;
          this.cdr.detectChanges();
        }
        
      }
      // ── Soumettre formulaire nouvelle parcelle ──
      submitParcelleForm(): void{
        this.formErrors.name = !this.parcelleForm.name.trim();
        this.formErrors.fermeId = !this.parcelleForm.fermeId || this.parcelleForm.fermeId === 0;
        if(this.formErrors.name || this.formErrors.fermeId) return;
        const ferme = this.fermes.find(f => f.id === Number(this.parcelleForm.fermeId));
        if(!ferme){
          this.errorMessage = 'Ferme introuvable';
          return;
        }
        const nouvelleParcelle: Parcelle = {
          name: this.parcelleForm.name,
          geometryJson: this.geometryJson,
          syncStatus: 'PENDING',
          fermeId: this.parcelleForm.fermeId,
          farmerId: ferme.farmer_id,
          culture: this.parcelleForm.culture,
          variete: this.parcelleForm.variete,
          superficie: parseFloat(this.calculatedArea)
        };
        this.parcelleService.addParcelle(nouvelleParcelle).subscribe({
          next: (created) =>{
            this.parcelles = [...this.parcelles, created],
            this.applyFilter();
            this.afficherTousLesPolygones();
            this.closeModal();
            this.geometryJson = '';
            this.calculatedArea = '';
            this.selectedParcelle = created; 
            this.cdr.detectChanges();
          },
          // Dans savePolygon() et submitParcelleForm()
          error: (err) => {
            // ✅ Afficher message d'erreur clair
            if (err.error?.message?.includes('trop éloignée')) {
              this.errorMessage = err.error.message;
            } else {
              this.errorMessage = 'Erreur lors de la sauvegarde.';
            }
            this.cdr.detectChanges();
          }
        });
      }
      
        // ── Fermer modal ──
  closeModal(): void {
    this.showSaveModal = false;
    this.errorMessage = '';
    this.parcelleForm = { name: '', culture: '', variete: '', fermeId: 0, farmerId: 0 };
    this.formErrors = { name: false, fermeId: false };
    // Effacer le dessin si on annule
    this.clearDrawing();
  }

}
