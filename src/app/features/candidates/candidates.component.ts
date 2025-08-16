import { Component, OnInit } from '@angular/core';
import { HrDataService, Candidate } from '../../shared/hr-data.service';

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss']
})
export class CandidatesComponent implements OnInit {

  candidates: Candidate[] = [];
  filtered: Candidate[] = [];
  searchTerm = '';

  // modal state
  modalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  modalSaving = false;

  // form + validation
  emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  formCandidate: Partial<Candidate> = {};

  constructor(private data: HrDataService) {}

  ngOnInit(): void {
    // Subscribe to the shared source of truth (in-memory API via service)
    this.data.candidates$.subscribe((list) => {
      this.candidates = list || [];
      this.filtered = this.filterNow(this.searchTerm);
    });

    // IMPORTANT: no component-level seeding here (backend already seeds)
  }

  // ------- search -------
  onSearch(term: string): void {
    this.searchTerm = term;
    this.filtered = this.filterNow(term);
  }

  filterNow(term: string): Candidate[] {
    const q = (term || '').toLowerCase();
    const list = this.candidates || [];
    if (!q) { return list.slice(); }
    return list.filter(function (r: any) {
      const vals = [r && r.id, r && r.name, r && r.email, r && r.status];
      for (let i = 0; i < vals.length; i++) {
        const v = '' + (vals[i] == null ? '' : vals[i]);
        if (v.toLowerCase().indexOf(q) !== -1) { return true; }
      }
      return false;
    });
  }

  trackById(_: number, row: Candidate) { return row && row.id; }

  // ------- modal -------
  openAdd(): void {
    this.modalMode = 'add';
    this.formCandidate = { name: '', email: '', status: 'Applied' };
    this.modalOpen = true;
  }

  openEdit(row: Candidate): void {
    this.modalMode = 'edit';
    this.formCandidate = { id: row.id, name: row.name, email: row.email, status: row.status };
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.modalSaving) { return; }
    this.modalOpen = false;
  }

  // ------- persist -------
  saveForm(): void {
    if (!this.formCandidate) { return; }
    const name = '' + (this.formCandidate.name || '');
    if (name.trim() === '') { return; }

    const email = ('' + (this.formCandidate.email || '')).trim();
    if (email && !(new RegExp(this.emailRegex).test(email))) { return; }

    const status = (this.formCandidate.status as any) || 'Applied';

    // Prevent duplicate by email on ADD
    if (this.modalMode === 'add' && email) {
      const lower = email.toLowerCase();
      const exists = (this.candidates || []).some(function (c: Candidate) {
        return ('' + (c && c.email ? c.email : '')).toLowerCase() === lower;
      });
      if (exists) {
        window.alert('A candidate with this email already exists.');
        return;
      }
    }

    const payload: Partial<Candidate> = {
      id: this.formCandidate.id,
      name: name,
      email: email,
      status: status
    };

    this.modalSaving = true;
    const obs = (this.modalMode === 'add')
      ? this.data.addCandidate(payload)
      : this.data.updateCandidate(payload as Candidate);

    obs.subscribe(
      () => { this.modalOpen = false; this.modalSaving = false; },
      ()  => { this.modalSaving = false; }
    );
  }

  confirmDelete(row: Candidate): void {
    if (window.confirm('Delete this candidate?')) { this.delete(row); }
  }

  delete(row: Candidate): void {
    this.data.deleteCandidate(Number(row.id)).subscribe();
  }
}
