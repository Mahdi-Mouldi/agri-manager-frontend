import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Farmer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmers.html',
  styleUrls: ['./farmers.css']
})
export class FarmersComponent implements OnInit {

  // ── State ──────────────────────────────────────
  farmers: Farmer[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  editMode: boolean = false;
  editId: number | null = null;

  form = { name: '', email: '', phone: '' };
  formErrors = { name: false, email: false };

  // ── Mock data (replace with HTTP calls later) ──
  ngOnInit(): void {
    this.farmers = [
      { id: 1, name: 'Jean Dupont',     email: 'jean.dupont@email.com',     phone: '+33 6 12 34 56 78' },
      { id: 2, name: 'Marie Claire',    email: 'marie.claire@email.com',    phone: '+33 6 23 45 67 89' },
      { id: 3, name: 'Pierre Martin',   email: 'pierre.martin@email.com',   phone: '+33 6 34 56 78 90' },
      { id: 4, name: 'Sophie Bernard',  email: 'sophie.bernard@email.com',  phone: '+33 6 45 67 89 01' },
      { id: 5, name: 'Luc Petit',       email: 'luc.petit@email.com',       phone: '+33 6 56 78 90 12' },
    ];
  }

  // ── Computed: filtered list ────────────────────
  get filteredFarmers(): Farmer[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.farmers;
    return this.farmers.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term) ||
      f.phone.includes(term)
    );
  }

  // ── Modal ──────────────────────────────────────
  openModal(): void {
    this.editMode = false;
    this.editId = null;
    this.form = { name: '', email: '', phone: '' };
    this.formErrors = { name: false, email: false };
    this.showModal = true;
  }

  openEditModal(farmer: Farmer): void {
    this.editMode = true;
    this.editId = farmer.id;
    this.form = { name: farmer.name, email: farmer.email, phone: farmer.phone };
    this.formErrors = { name: false, email: false };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ── Validation ─────────────────────────────────
  private validate(): boolean {
    this.formErrors.name  = !this.form.name.trim();
    this.formErrors.email = !this.form.email.trim() || !this.form.email.includes('@');
    return !this.formErrors.name && !this.formErrors.email;
  }

  // ── Submit (Add or Edit) ───────────────────────
  submitForm(): void {
    if (!this.validate()) return;

    if (this.editMode && this.editId !== null) {
      // TODO: replace with this.farmerService.update(this.editId, this.form)
      const index = this.farmers.findIndex(f => f.id === this.editId);
      if (index !== -1) {
        this.farmers[index] = { id: this.editId, ...this.form };
      }
    } else {
      // TODO: replace with this.farmerService.create(this.form)
      const newId = Math.max(...this.farmers.map(f => f.id), 0) + 1;
      this.farmers.push({ id: newId, ...this.form });
    }

    this.closeModal();
  }

  // ── Delete ─────────────────────────────────────
  deleteFarmer(id: number): void {
    if (!confirm('Delete this farmer?')) return;
    // TODO: replace with this.farmerService.delete(id)
    this.farmers = this.farmers.filter(f => f.id !== id);
  }
}
