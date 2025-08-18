import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  HrDataService,
  Department,
  Employee,
  Candidate,
} from '../../shared/hr-data.service';

type ViewDepartment = {
  id: number;
  name: string;
  empCount: number;
  candCount: number;
};

type EmpView = Employee & { displayName: string };
type CandView = Candidate & { displayName: string };

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  private allDepts: Department[] = [];
  private allEmps: Employee[] = [];
  private allCands: Candidate[] = [];

  rows: ViewDepartment[] = [];
  searchTerm = '';

  detailFor: Department | null = null;
  detailEmployeesV: EmpView[] = [];
  detailCandidatesV: CandView[] = [];

  modalOpen = false;
  modalSaving = false;
  newDeptName = '';

  private subDepts?: Subscription;
  private subEmps?: Subscription;
  private subCands?: Subscription;

  constructor(private data: HrDataService) {}

  ngOnInit(): void {
    this.subDepts = this.data.departments$.subscribe((ds) => {
      this.allDepts = ds || [];
      this.refreshRows();
      if (this.detailFor) this.openDetail(this.detailFor.id);
    });

    this.subEmps = this.data.employees$.subscribe((es) => {
      this.allEmps = es || [];
      this.refreshRows();
      if (this.detailFor) this.openDetail(this.detailFor.id);
    });

    this.subCands = this.data.candidates$.subscribe((cs) => {
      this.allCands = cs || [];
      this.refreshRows();
      if (this.detailFor) this.openDetail(this.detailFor.id);
    });
  }

  ngOnDestroy(): void {
    if (this.subDepts) this.subDepts.unsubscribe();
    if (this.subEmps) this.subEmps.unsubscribe();
    if (this.subCands) this.subCands.unsubscribe();
  }

  refreshRows(): void {
    const term = (this.searchTerm || '').toLowerCase();
    const mapped: ViewDepartment[] = (this.allDepts || []).map((d) => {
      const eid = Number(d.id);
      const empCount = (this.allEmps || []).filter(
        (e) => Number((e as any).departmentId) === eid
      ).length;
      const candCount = (this.allCands || []).filter(
        (c) => Number((c as any).departmentId) === eid
      ).length;
      return {
        id: Number(d.id),
        name: d.name || '',
        empCount,
        candCount,
      };
    });

    if (!term) { this.rows = mapped; return; }

    this.rows = mapped.filter((r) =>
      String(r.id).indexOf(term) !== -1 ||
      (r.name || '').toLowerCase().indexOf(term) !== -1
    );
  }

  onSearch(v: string): void { this.searchTerm = v || ''; this.refreshRows(); }

  trackById(_: number, row: ViewDepartment): number { return Number(row.id); }

  /** Build a nice display name from any fields available */
  private buildDisplayName(r: any): string {
    const safe = (s: any) => (s == null ? '' : String(s));
    const name = safe(r.name).trim();
    if (name) return name;

    const first = safe(r.firstName).trim();
    const last  = safe(r.lastName).trim();
    const full  = (first + ' ' + last).trim();
    if (full) return full;

    const fn = safe(r.fullName).trim();
    if (fn) return fn;

    const user = safe(r.username).trim();
    if (user) return user;

    const email = safe(r.email).trim();
    if (email) {
      const part = email.split('@')[0] || '';
      if (part) {
        return part
          .split(/[._-]/g)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      return email;
    }
    return '—';
  }

  openDetail(depId: number): void {
    // department heading
    let target: Department | null = null;
    for (let i = 0; i < this.allDepts.length; i++) {
      if (Number(this.allDepts[i].id) === Number(depId)) { target = this.allDepts[i]; break; }
    }
    this.detailFor = target;

    // employees & candidates with displayName
    const emps = (this.allEmps || []).filter(
      (e) => Number((e as any).departmentId) === Number(depId)
    );
    this.detailEmployeesV = emps.map(e => ({
      ...e,
      displayName: this.buildDisplayName(e),
    }));

    const cands = (this.allCands || []).filter(
      (c) => Number((c as any).departmentId) === Number(depId)
    );
    this.detailCandidatesV = cands.map(c => ({
      ...c,
      displayName: this.buildDisplayName(c),
    }));
  }

  clearDetail(): void {
    this.detailFor = null;
    this.detailEmployeesV = [];
    this.detailCandidatesV = [];
  }

  // Add department (modal)
  openAdd(): void { this.modalOpen = true; this.modalSaving = false; this.newDeptName = ''; }
  closeModal(): void { this.modalOpen = false; this.modalSaving = false; this.newDeptName = ''; }

  saveDepartment(): void {
    if (this.modalSaving) return;
    const name = (this.newDeptName || '').trim();
    if (!name) { alert('Please provide a department name.'); return; }
    this.modalSaving = true;
    this.data.addDepartment({ name }).subscribe({
      next: () => { this.modalSaving = false; this.closeModal(); },
      error: () => { this.modalSaving = false; alert('Could not save department. Please try again.'); }
    });
  }
}
