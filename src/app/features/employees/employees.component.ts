import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HrDataService, Employee, Department } from '../../shared/hr-data.service';

type ViewEmployee = Employee & { departmentName?: string };

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit, OnDestroy {
  rows$!: Observable<ViewEmployee[]>;
  rows: ViewEmployee[] = [];

  departments: Department[] = [];
  private search$ = new BehaviorSubject<string>('');

  // Modal
  modalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  modalSaving = false;
  formEmp: Partial<Employee> = {};

  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private sub?: Subscription;
  private depSub?: Subscription;

  constructor(private data: HrDataService) {}

  ngOnInit(): void {
    // Seed subjects from in-memory API
    this.data.refreshAll().subscribe();

    this.depSub = this.data.departments$.subscribe((ds) => (this.departments = ds || []));

    this.rows$ = combineLatest([
      this.data.employees$,
      this.data.departments$,
      this.search$.pipe(startWith('')),
    ]).pipe(
      map(([emps, depts, term]) => {
        const q = (term || '').toLowerCase().trim();
        const dList = depts || [];

        const joined: ViewEmployee[] = (emps || []).map((e) => {
          // department name
          const depId: any = (e as any).departmentId;
          let depName = '';
          for (let i = 0; i < dList.length; i++) {
            if (Number(dList[i].id) === Number(depId)) {
              depName = dList[i].name || '';
              break;
            }
          }

          // display name fallback: name || "first last" || humanized email local-part
          let displayName = (e as any).name as string;
          if (!displayName || displayName.trim() === '') {
            const fn = ((e as any).firstName || '') as string;
            const ln = ((e as any).lastName || '') as string;
            const fromParts = (fn + ' ' + ln).trim();
            if (fromParts) {
              displayName = fromParts;
            } else {
              const local = ((e.email || '').split('@')[0] || '')
                .replace(/[._-]+/g, ' ')
                .trim();
              displayName = local
                ? local.replace(/\b\w/g, (m) => m.toUpperCase())
                : '';
            }
          }

          return { ...e, name: displayName, departmentName: depName };
        });

        if (!q) return joined;

        return joined.filter((r) => {
          const name = (r.name || '').toLowerCase();
          const email = (r.email || '').toLowerCase();
          const dep = (r.departmentName || '').toLowerCase();
          return name.includes(q) || email.includes(q) || dep.includes(q);
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

    this.formEmp = {
      name: '',
      email: '',
      role: '',
      hireDate: '',
      departmentId: firstDepId,
    };
    this.modalOpen = true;
  }

  openEdit(row: ViewEmployee): void {
    this.modalMode = 'edit';
    this.formEmp = {
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      role: row.role || '',
      hireDate: row.hireDate || '',
      departmentId: (row as any).departmentId,
    };
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalSaving = false;
  }

  saveForm(): void {
    if (this.modalSaving) return;
    this.modalSaving = true;

    const payload: Partial<Employee> = { ...this.formEmp };
    if (payload.name) payload.name = String(payload.name).trim();
    if (payload.email) payload.email = String(payload.email).trim();
    if (payload.role) payload.role = String(payload.role).trim();

    const done = () => {
      this.modalSaving = false;
      this.closeModal();
    };

    if (this.modalMode === 'add') {
      this.data.addEmployee(payload).subscribe({ next: done, error: done });
    } else {
      this.data.updateEmployee(payload as Employee).subscribe({ next: done, error: done });
    }
  }

  delete(row: ViewEmployee): void {
    if (!row || row.id == null) return;
    if (!confirm('Delete this employee?')) return;
    this.data.deleteEmployee(Number(row.id)).subscribe();
  }

  trackById(_: number, row: ViewEmployee): number {
    return Number(row.id);
  }
}
