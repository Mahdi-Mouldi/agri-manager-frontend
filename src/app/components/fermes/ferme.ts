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


@Component({
  selector: 'app-fermes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ferme.html',
  styleUrls: ['./ferme.css']
})
export class FermesComponent implements OnInit {//FarmersComponent

  fermes: Ferme[] = [];
  filteredFermes: Ferme[] = [];
  farmers: Farmer[] = [];
  parcelles: { [fermeId: number]: Parcelle[] } = {};
  expandedFermeId: number | null = null;
  filterAgriculteur: string = '';
  filterRegion: string = '';           // ← ajouter
  filterPropriete: string = '';        // ← ajouter
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
  parcelleForm: Parcelle = { name: '', geometryJson: '', farmerId: 0, fermeId: 0, culture: '', variete: '', superficie: 0 };  parcelleErrors = { name: false };
  errorMessage: string = '';

  constructor(
    private fermeService: FermeService,
    private parcelleService: ParcelleService,
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
          this.closeModal(); this.cdr.detectChanges();
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
}