import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
 
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
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { Extent } from 'ol/extent';
 
// Services
import { ParcelleService } from '../../core/services/parcelle.service';
import { FermeService } from '../../core/services/ferme.service';
import { FarmerService } from '../../core/services/farmer.service';
 
// Models
import { Parcelle } from '../../core/models/parcelle.model';
import { Ferme } from '../../core/models/ferme.model';
import { Farmer } from '../../core/models/farmer.model';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-vue-satellite',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './vue-satellite.html',
  styleUrl: './vue-satellite.css',
})
export class VueSatellite implements OnInit, AfterViewInit{
  map!: Map;
  vectorSource= new VectorSource();
  vectorLayer! : VectorLayer;
  tileLayer!: TileLayer;
  labelsLayer!: TileLayer;
  //Données
  parcelles: Parcelle[] = [];
  fermes: Ferme[] = [];
  farmers: Farmer[] = [];
  filteredParcelles: Parcelle[] = [];
  //Filtres
  filterAgriculteur = '';
  filterCulture = '';
  filterVariete = '';
  filterRegion = '';
  filterPropriete = '';
  cultures: string[] = [];
  varietes: string[] = [];
  regions: string[] = [];
  //POPUP Ferme
  selectedFerme : Ferme | null = null;
  popupX = 0;
  popupY = 0;
  //Meteo
  currentWeather : any = null;
  forecastDays : any[] = [];
  weatherLoading = false;
  // UI
  mapLoading = false;
  mapType = 'satellite';
  meteoCollapsed = false;
  
   constructor(
    private parcelleService: ParcelleService,
    private fermeService: FermeService,
    private farmerService: FarmerService,
    private weatherService: WeatherService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(){
    this.loadData();
    this.loadFarmers();
  }
  ngAfterViewInit(): void {
    this.initMap();
  }

  //// ── Charger parcelles + fermes ──
  loadData(): void {
    this.mapLoading = true;
    // Charger parcelles
    this.parcelleService.getAllParcelles().subscribe({
      next: (parcelleGet) => {
        this.parcelles = parcelleGet;
        this.filteredParcelles = parcelleGet;
        // Extraire cultures uniques
        this.cultures = [...new Set(
          parcelleGet.map(p => p.culture).filter(Boolean) as string[]
        )];
        //Extraire varietes uniques
        this.varietes = [...new Set(
          parcelleGet.map(p => p.variete).filter(Boolean) as string[]
        )];
        this.cdr.detectChanges();
        //charger fermes
        this.fermeService.getAll().subscribe({
          next: (fermeGet) => {
            this.fermes = fermeGet;

            //Extraire regions uniques
            this.regions = [...new Set(
              fermeGet.map(p => p.ferme_address).filter(Boolean)
            )];
            this.mapLoading = false;
            this.cdr.detectChanges();
            this.afficherTousLesPolygones();
          },
          error: (err) => {
            console.error('Erreur fermes', err);
            this.mapLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur parcelles', err);
        this.mapLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  // Charger Farmers
  loadFarmers(): void {
    this.farmerService.getAll().subscribe({
      next:(farmersGet) =>{
        this.farmers = farmersGet;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error farmers', err)
    });
  }
  // ── Initialiser la carte OpenLayers ──
  initMap(): void{
    // Style polygone vert
        const polygonStyle = new Style({
      fill: new Fill({ color: 'rgba(34, 197, 94, 0.35)' }),
      stroke: new Stroke({ color: '#16a34a', width: 2.5 }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#2563eb' }),
        stroke: new Stroke({ color: 'white', width: 2 })
      })
    });
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: polygonStyle
    });
    // TileLayer satellite Esri
    this.tileLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    });
      // ✅ NOUVEAU : couche des noms (villes, pays, routes)
    this.labelsLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
      }),
      opacity: 1
    });
    // Créer la carte
    this.map = new Map({
      target: 'satellite-map',
      layers: [this.tileLayer,this.labelsLayer, this.vectorLayer],
      view: new View({
        center: fromLonLat([10.1, 36.8]),
        zoom: 9
      })
    });
    // Événement clic sur la carte
    this.map.on('click', (event: any) => {
      this.onMapClick(event)
    });
  }
  // ── Afficher tous les polygones filtrés ──
  afficherTousLesPolygones(): void{
    this.vectorSource.clear();
    this.filteredParcelles.forEach(p =>{
      if(p.geometryJson){
        try{
          //Cette ligne prend les coordonnées de la parcelle (GeoJSON)
          //  et les transforme en objet géographique (feature)
          //qu’OpenLayers peut afficher sur la carte,
        
          const feature = new GeoJSON().readFeature(p.geometryJson, { 
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }) as Feature;
          feature.setId(p.id);
          this.vectorSource.addFeature(feature)
        }catch (e){
          console.error('GeoJSON invalide parcelle', p.id, e);
        }
      }
    });
  }
  // ── Clic sur polygone → popup ferme ──
  onMapClick(event: any): void{
      const feature = this.map.forEachFeatureAtPixel(
        event.pixel,
        (f) => f
      ) as Feature;
      if(feature){
        const parcelleId = feature.getId() as number;
        const parcelle = this.parcelles.find(p => p.id === parcelleId);
        if(parcelle){
          const ferme = this.fermes.find(f => f.id === parcelle.fermeId);
          if(ferme){
            this.selectedFerme = ferme;
            //Position de la popup
            this.popupX = event.pixel[0] + 10;
            this.popupY = event.pixel[1] - 20;
            this.cdr.detectChanges();
            //Meteo
            this.weatherLoading = true;
            this.weatherService.getWeatherByParcelle(parcelleId).subscribe({
              next: (weatherData) => {
                this.currentWeather = weatherData;
                this.weatherLoading = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Erreur météo', err);
                this.weatherLoading = false;
                this.cdr.detectChanges();
              }
            });
          }
        }
      }else{
        this.closePopup();
      }    
  }
  closePopup(): void{
    this.selectedFerme = null;
    this.cdr.detectChanges();
  } 
  // ── Nom de l'agriculteur ──
  getFarmerName(farmerId: number): string {
    const farmer = this.farmers.find(f => f.id === farmerId);
    return farmer ? farmer.name : '—';
  }
  applyFilters(): void{
    this.filteredParcelles = this.parcelles.filter(p =>{
      const matchAgriculteur = !this.filterAgriculteur || 
      this.getFarmerName(p.farmerId).toLocaleLowerCase().
      includes(this.filterAgriculteur.toLocaleLowerCase());

      const matchCulture = !this.filterCulture ||
      p.culture === this.filterCulture;

      const matchVariete = !this.filterVariete ||
      p.variete === this.filterVariete ; 

      const ferme = this.fermes.find(f => f.id === p.fermeId);
      const matchRegion = !this.filterRegion ||
      ferme?.ferme_address === this.filterRegion;
      // Filtre propriété → via ferme
      const matchPropriete = !this.filterPropriete ||
      ferme?.description === this.filterPropriete;

      return matchAgriculteur && matchCulture && matchVariete && matchRegion && matchPropriete;
    });
    // Rafraîchir la carte
    this.afficherTousLesPolygones();
    this.cdr.detectChanges();
  }
  // changer le type de map
  setMapType(type: string): void {
    this.mapType = type;
    if (type === 'satellite') {
        // Satellite + labels
        this.tileLayer.setSource(new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19
        }));
        this.labelsLayer.setVisible(true); // ✅ Afficher les noms
      } else {
        // OpenStreetMap (a déjà les noms intégrés)
        this.tileLayer.setSource(new XYZ({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19
        }));
        this.labelsLayer.setVisible(false); // ✅ Cacher les labels (OSM les a déjà)
      }

      this.cdr.detectChanges();
  }

}
