import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HrDataService, Candidate, Department } from '../../shared/hr-data.service';

type ViewCandidate = Candidate & { departmentName?: string };

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss'],
})
export class CandidatesComponent implements OnInit, OnDestroy {
  // view rows
  rows$!: Observable<ViewCandidate[]>;
  rows: ViewCandidate[] = [];

  // lookup
  departments: Department[] = [];

  // search
  private search$ = new BehaviorSubject<string>('');

  // modal
  modalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  modalSaving = false;
  formCandidate: Partial<Candidate> = {};

  // simple email regex (client-side hint only)
  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private sub?: Subscription;
  private depSub?: Subscription;

  constructor(private data: HrDataService) {}

  ngOnInit(): void {
    // make sure all subjects are hydrated
    this.data.refreshAll().subscribe();

    // departments list for the select
    this.depSub = this.data.departments$.subscribe((ds) => (this.departments = ds || []));

    // join candidates + departments, then filter by search
    this.rows$ = combineLatest([
      this.data.candidates$,
      this.data.departments$,
      this.search$.pipe(startWith('')),
    ]).pipe(
      map(([cands, depts, term]) => {
        const q = (term || '').toLowerCase().trim();
        const dList = depts || [];

        const joined: ViewCandidate[] = (cands || []).map((c) => {
          // resolve department name
          const depId: any = (c as any).departmentId;
          let depName = '';
          for (let i = 0; i < dList.length; i++) {
            if (Number(dList[i].id) === Number(depId)) {
              depName = dList[i].name || '';
              break;
            }
          }
          // best-effort display name
          let displayName = (c as any).name as string;
          if (!displayName || displayName.trim() === '') {
            const fn = ((c as any).firstName || '') as string;
            const ln = ((c as any).lastName || '') as string;
            const fromParts = (fn + ' ' + ln).trim();
            if (fromParts) {
              displayName = fromParts;
            } else {
              const local = ((c.email || '').split('@')[0] || '')
                .replace(/[._-]+/g, ' ')
                .trim();
              displayName = local ? local.replace(/\b\w/g, (m) => m.toUpperCase()) : '';
            }
          }

          return { ...c, name: displayName, departmentName: depName };
        });

        if (!q) return joined;

        return joined.filter((r) => {
          const name = (r.name || '').toLowerCase();
          const email = (r.email || '').toLowerCase();
          const dep = (r.departmentName || '').toLowerCase();
          const status = (r.status || '').toLowerCase();
          return (
            name.includes(q) ||
            email.includes(q) ||
            dep.includes(q) ||
            status.includes(q)
          );
        });
      })
    );

    this.sub = this.rows$.subscribe((view) => (this.rows = view || []));
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.depSub) this.depSub.unsubscribe();
  }

  onSearch(value: string): void {
    this.search$.next(value || '');
  }

  openAdd(): void {
    this.modalMode = 'add';
    const firstDepId =
      this.departments && this.departments.length ? this.departments[0].id : undefined;

    this.formCandidate = {
      name: '',
      email: '',
      status: 'Applied',
      departmentId: firstDepId,
    } as Partial<Candidate>;

    this.modalOpen = true;
  }

  openEdit(row: ViewCandidate): void {
  this.modalMode = 'edit';
  this.formCandidate = {
    id: Number(row.id),           // ensure numeric
    name: row.name || '',
    email: row.email || '',
    status: row.status || 'Applied',
    departmentId: (row as any).departmentId
  };
  this.modalOpen = true;
}


  closeModal(): void {
    this.modalOpen = false;
    this.modalSaving = false;
  }

  /** Strong submit path; called from (ngSubmit) and button (click) */
  saveForm(): void {
  if (this.modalSaving) return;
  this.modalSaving = true;

  const payload: Partial<Candidate> = { ...this.formCandidate };
  if (payload.name) payload.name = String(payload.name).trim();
  if (payload.email) payload.email = String(payload.email).trim();

  const done = () => { this.modalSaving = false; this.closeModal(); };
  const fail = () => { this.modalSaving = false; alert('Could not save candidate. Please try again.'); };

  if (this.modalMode === 'add') {
    this.data.addCandidate(payload).subscribe({ next: done, error: fail });
  } else {
    // IMPORTANT: id must be present and numeric
    this.data.updateCandidate(payload as Candidate & { id: number }).subscribe({ next: done, error: fail });
  }
}


  delete(row: ViewCandidate): void {
    if (!row || row.id == null) return;
    if (!confirm('Delete this candidate?')) return;
    this.data.deleteCandidate(Number(row.id)).subscribe();
  }

  trackById(_: number, row: ViewCandidate): number {
    return Number(row.id);
  }
}
