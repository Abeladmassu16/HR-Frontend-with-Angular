import { Component, OnInit } from '@angular/core';

interface Company {
  id: number;
  name: string;
  location: string;
}

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  companies: Company[] = [];
  filtered: Company[] = [];
  searchTerm = '';

  // modal state
  modalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  modalSaving = false;

  formCompany: Partial<Company> = {};

  ngOnInit(): void {
    // seed if empty (replace with service call if you have one)
    if (!this.companies || this.companies.length === 0) {
      this.companies = [{ id: 1, name: 'XOKA Tech', location: 'Addis Ababa' }];
    }
    this.filtered = this.companies.slice();
  }

  // ===== top bar actions
  openAdd(): void {
    this.modalMode = 'add';
    this.formCompany = { name: '', location: '' };
    this.modalOpen = true;
  }

  openEdit(row: Company): void {
    this.modalMode = 'edit';
    this.formCompany = { id: row.id, name: row.name, location: row.location };
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.modalSaving) { return; }
    this.modalOpen = false;
  }

  // ===== persist
  saveForm(): void {
    if (!this.formCompany || !this.formCompany.name || ('' + this.formCompany.name).trim() === '') {
      return;
    }
    this.modalSaving = true;
    try {
      if (this.modalMode === 'add') {
        const nextId =
          (this.companies && this.companies.length
            ? Math.max.apply(null, this.companies.map(r => Number(r.id) || 0))
            : 0) + 1;

        const newRow: Company = {
          id: nextId,
          name: '' + this.formCompany.name,
          location: '' + (this.formCompany.location || '')
        };
        this.companies.push(newRow);
      } else {
        const id = Number(this.formCompany.id);
        for (let i = 0; i < this.companies.length; i++) {
          if (Number(this.companies[i].id) === id) {
            this.companies[i] = {
              id,
              name: '' + this.formCompany.name,
              location: '' + (this.formCompany.location || '')
            };
            break;
          }
        }
      }
      this.filtered = this.filterNow(this.searchTerm);
      this.modalOpen = false;
    } finally {
      this.modalSaving = false;
    }
  }

  delete(row: Company): void {
    const id = Number(row && row.id);
    this.companies = this.companies.filter(r => Number(r.id) !== id);
    this.filtered = this.filterNow(this.searchTerm);
  }

  // ===== search
  filterNow(term: string): Company[] {
    const q = (term || '').toLowerCase();
    const list = this.companies || [];
    if (!q) { return list.slice(); }
    return list.filter(r =>
      ('' + (r && r.id)).toLowerCase().indexOf(q) !== -1 ||
      ('' + (r && r.name)).toLowerCase().indexOf(q) !== -1 ||
      ('' + (r && r.location)).toLowerCase().indexOf(q) !== -1
    );
  }

  trackById(_: number, row: Company) { return row.id; }
}
