    import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { FormsModule } from '@angular/forms';
    import { Router, NavigationEnd } from '@angular/router';
    import { filter } from 'rxjs/operators';
    import { FermeService } from '../../core/services/ferme.service';
    import { Ferme } from '../../core/models/ferme.model';

    @Component({
    selector: 'app-fermes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ferme.html',
    styleUrls: ['./ferme.css']
    })
    export class FermesComponent implements OnInit {

    fermes: Ferme[] = [];
    searchTerm: string = '';
    showModal: boolean = false;
    editMode: boolean = false;
    editId: number | null = null;
    loading: boolean = false;
    errorMessage: string = '';

    form: Ferme = {
        ferme_name: '', ferme_address: '',
        superficieTotale: 0, latitude: 0,
        longitude: 0, description: '', farmer_id: 0
    };
    formErrors = { ferme_name: false, ferme_address: false };

    constructor(
        private fermeService: FermeService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadFermes();
        this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
        this.loadFermes();
        });
    }

    loadFermes(): void {
        this.loading = true;
        this.fermeService.getAll().subscribe({
        next: (data) => {
            this.fermes = [...data];
            this.loading = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error('Erreur chargement fermes', err);
            this.loading = false;
            this.cdr.detectChanges();
        }
        });
    }

    get filteredFermes(): Ferme[] {
        const term = this.searchTerm.toLowerCase();
        if (!term) return this.fermes;
        return this.fermes.filter(f =>
        f.ferme_name.toLowerCase().includes(term) ||
        f.ferme_address.toLowerCase().includes(term)
        );
    }

    openModal(): void {
        this.editMode = false;
        this.editId = null;
        this.form = { ferme_name: '', ferme_address: '', superficieTotale: 0, latitude: 0, longitude: 0, description: '', farmer_id: 0 };
        this.formErrors = { ferme_name: false, ferme_address: false };
        this.errorMessage = '';
        this.showModal = true;
    }

    openEditModal(ferme: Ferme): void {
        this.editMode = true;
        this.editId = ferme.id!;
        this.form = { ...ferme };
        this.formErrors = { ferme_name: false, ferme_address: false };
        this.errorMessage = '';
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.errorMessage = '';
    }

    private validate(): boolean {
        this.formErrors.ferme_name    = !this.form.ferme_name.trim();
        this.formErrors.ferme_address = !this.form.ferme_address.trim();
        return !this.formErrors.ferme_name && !this.formErrors.ferme_address;
    }

    submitForm(): void {
        if (!this.validate()) return;

        if (this.editMode && this.editId !== null) {
        this.fermeService.updateFerme(this.editId, this.form).subscribe({
            next: (updated) => {
            const index = this.fermes.findIndex(f => f.id === this.editId);
            if (index !== -1) {
                this.fermes[index] = updated;
                this.fermes = [...this.fermes];
            }
            this.closeModal();
            this.cdr.detectChanges();
            },
            error: (err) => {
            this.errorMessage = "Erreur lors de la mise a jour.";
            console.error(err);
            }
        });
        } else {
        this.fermeService.createFerme(this.form).subscribe({
            next: (created) => {
            this.fermes = [...this.fermes, created];
            this.closeModal();
            this.cdr.detectChanges();
            },
            error: (err) => {
            this.errorMessage = "Erreur lors de la creation.";
            console.error(err);
            }
        });
        }
    }

    deleteFerme(id: number): void {
        if (!confirm('Supprimer cette ferme ?')) return;
        this.fermeService.deleteFerme(id).subscribe({
        next: () => {
            this.fermes = [...this.fermes.filter(f => f.id !== id)];
            this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur suppression', err)
        });
    }
    }