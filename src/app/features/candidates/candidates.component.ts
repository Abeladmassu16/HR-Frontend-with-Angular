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
    this.data.candidates$.subscribe((list) => {
      this.candidates = list || [];
      this.filtered = this.filterNow(this.searchTerm);
    });
  }

  // ------- search -------
  onSearch(term: string): void { this.searchTerm = term; this.filtered = this.filterNow(term); }
  filterNow(term: string): Candidate[] {
    const q = (term || '').toLowerCase(); const list = this.candidates || [];
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
  closeModal(): void { if (!this.modalSaving) { this.modalOpen = false; } }

  // ------- persist (submit) -------
  saveForm(formRef: any): void {
    if (!this.formCandidate) { return; }

    const name  = ('' + (this.formCandidate.name || '')).trim();
    const email = ('' + (this.formCandidate.email || '')).trim();
    const status = ('' + ((this.formCandidate.status as any) || 'Applied')).trim();

    if (name === '') { return; }
    if (email && !(new RegExp(this.emailRegex).test(email))) { return; }

    // prevent duplicate email on ADD only
    if (this.modalMode === 'add' && email) {
      const lower = email.toLowerCase();
      const exists = (this.candidates || []).some(function (c: Candidate) {
        return ('' + (c && c.email ? c.email : '')).toLowerCase() === lower;
      });
      if (exists) { window.alert('A candidate with this email already exists.'); return; }
    }

    const payload: Candidate = {
      id: Number(this.formCandidate.id || 0),
      name: name,
      email: email,
      status: (status as any)
    };

    this.modalSaving = true;
    this.data.saveCandidateWithRules(payload).subscribe(
      () => {
        this.modalSaving = false;
        this.modalOpen = false;        // close on success
        if (formRef && formRef.resetForm) { formRef.resetForm(); }
      },
      () => {
        this.modalSaving = false;      // allow closing if error
      }
    );
  }

  confirmDelete(row: Candidate): void { if (window.confirm('Delete this candidate?')) { this.delete(row); } }
  delete(row: Candidate): void {
    this.modalSaving = true;
    this.data.deleteCandidate(Number(row.id)).subscribe(
      () => { this.modalSaving = false; this.data.refreshAll().subscribe(); },
      () => { this.modalSaving = false; }
    );
  }
}
