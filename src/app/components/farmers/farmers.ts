import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor(private farmerService: FarmerService) {}

  // ── Charger la liste depuis le backend ──────────
  ngOnInit(): void {
    this.loadFarmers();
  }

  loadFarmers(): void {
    this.loading = true;
    this.farmerService.getAll().subscribe({
      next: (data) => {
        this.farmers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement farmers', err);
        this.loading = false;
      }
    });
  }

  // ── Filtrage local (recherche) ──────────────────
  get filteredFarmers(): Farmer[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.farmers;
    return this.farmers.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term) ||
      f.phoneNumber.includes(term)
    );
  }

  // ── Modals ──────────────────────────────────────
  openModal(): void {
    this.editMode = false;
    this.editId = null;
    this.form = { name: '', email: '', phoneNumber: '' };
    this.formErrors = { name: false, email: false };
    this.showModal = true;
  }

  openEditModal(farmer: Farmer): void {
    this.editMode = true;
    this.editId = farmer.id!;
    this.form = { name: farmer.name, email: farmer.email, phoneNumber: farmer.phoneNumber };
    this.formErrors = { name: false, email: false };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
  }

  // ── Validation ──────────────────────────────────
  private validate(): boolean {
    this.formErrors.name  = !this.form.name.trim();
    this.formErrors.email = !this.form.email.trim() || !this.form.email.includes('@');
    return !this.formErrors.name && !this.formErrors.email;
  }

  // ── Ajouter ou modifier ─────────────────────────
  submitForm(): void {
    if (!this.validate()) return;

    if (this.editMode && this.editId !== null) {
      // PUT /api/farmers/:id
      this.farmerService.updateFarmer(this.editId, this.form).subscribe({
        next: (updated) => {
          const index = this.farmers.findIndex(f => f.id === this.editId);
          if (index !== -1) this.farmers[index] = updated;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour.';
          console.error(err);
        }
      });
    } else {
      // POST /api/farmers
      this.farmerService.create(this.form).subscribe({
        next: (created) => {
          this.farmers.push(created);
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la création.';
          console.error(err);
        }
      });
    }
  }

  // ── Supprimer ───────────────────────────────────
  deleteFarmer(id: number): void {
    if (!confirm('Supprimer cet agriculteur ?')) return;
    // DELETE /api/farmers/:id
    this.farmerService.deleteFarmeg(id).subscribe({
      next: () => {
        this.farmers = this.farmers.filter(f => f.id !== id);
      },
      error: (err) => {
        console.error('Erreur suppression', err);
      }
    });
  }
}