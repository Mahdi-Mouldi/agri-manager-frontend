import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FarmerService } from '../../core/services/farmer.service';

export interface Farmer {
  id?: number;
  name: string;
  email: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css']
})
export class FarmersComponent implements OnInit {

  farmers: Farmer[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  editMode: boolean = false;
  editId: number | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  form: Farmer = { name: '', email: '', phoneNumber: '' };
  formErrors = { name: false, email: false };

  constructor(
    private farmerService: FarmerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFarmers();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadFarmers();
    });
  }

  loadFarmers(): void {
    this.loading = true;
    this.farmerService.getAll().subscribe({
      next: (data) => {
        this.farmers = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement farmers', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredFarmers(): Farmer[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.farmers;
    return this.farmers.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term) ||
      f.phoneNumber.includes(term)
    );
  }

  openModal(): void {
    this.editMode = false;
    this.editId = null;
    this.form = { name: '', email: '', phoneNumber: '' };
    this.formErrors = { name: false, email: false };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(farmer: Farmer): void {
    this.editMode = true;
    this.editId = farmer.id!;
    this.form = { name: farmer.name, email: farmer.email, phoneNumber: farmer.phoneNumber };
    this.formErrors = { name: false, email: false };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
  }

  private validate(): boolean {
    this.formErrors.name  = !this.form.name.trim();
    this.formErrors.email = !this.form.email.trim() || !this.form.email.includes('@');
    return !this.formErrors.name && !this.formErrors.email;
  }

  submitForm(): void {
    if (!this.validate()) return;

    if (this.editMode && this.editId !== null) {
      this.farmerService.updateFarmer(this.editId, this.form).subscribe({
        next: (updated) => {
          const index = this.farmers.findIndex(f => f.id === this.editId);
          if (index !== -1) {
            this.farmers[index] = updated;
            this.farmers = [...this.farmers];
          }
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise a jour.';
          console.error(err);
        }
      });
    } else {
      this.farmerService.create(this.form).subscribe({
        next: (created) => {
          this.farmers = [...this.farmers, created];
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la creation.';
          console.error(err);
        }
      });
    }
  }

  deleteFarmer(id: number): void {
    if (!confirm('Supprimer cet agriculteur ?')) return;
    this.farmerService.deleteFarmer(id).subscribe({
      next: () => {
        this.farmers = [...this.farmers.filter(f => f.id !== id)];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur suppression', err);
      }
    });
  }
}