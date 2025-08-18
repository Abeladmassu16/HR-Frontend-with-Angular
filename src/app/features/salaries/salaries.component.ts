import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HrDataService, Salary, Employee } from '../../shared/hr-data.service';

type ViewSalary = Salary & { employeeName?: string };

@Component({
  selector: 'app-salaries',
  templateUrl: './salaries.component.html',
  styleUrls: ['./salaries.component.scss']
})
export class SalariesComponent implements OnInit, OnDestroy {
  rows: ViewSalary[] = [];
  employees: Employee[] = [];

  private search$ = new BehaviorSubject<string>('');

  formOpen = false;
  formMode: 'add' | 'edit' = 'add';
  formSalary: Partial<Salary> = {};

  private sub: Subscription | undefined;

  constructor(private data: HrDataService) {}

  ngOnInit(): void {
    // keep a local copy of employees for labels & select
    this.data.employees$.subscribe((es) => (this.employees = es ? es.slice() : []));

    // join salaries with employee names + search
    this.sub = combineLatest([
      this.data.salaries$,
      this.data.employees$,
      this.search$.pipe(startWith(''))
    ])
      .pipe(
        map(([sals, emps, term]) => {
          const q = (term || '').toLowerCase().trim();

          const joined: ViewSalary[] = (sals || []).map((s) => {
            const emp = (emps || []).find((e) => Number(e.id) === Number(s.employeeId));
            const nm = this.employeeLabel(emp);
            return { ...s, employeeName: nm };
          });

          if (!q) return joined;

          return joined.filter((r) => {
            const a = String(r.employeeName || '').toLowerCase();
            const b = String(r.amount || '').toLowerCase();
            const c = String(r.currency || '').toLowerCase();
            return a.indexOf(q) !== -1 || b.indexOf(q) !== -1 || c.indexOf(q) !== -1;
          });
        })
      )
      .subscribe((view) => (this.rows = view || []));
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  onSearch(v: string): void {
    this.search$.next(v || '');
  }

  trackById(_: number, r: ViewSalary): number {
    return Number(r.id);
  }

  /** Always prefer the real name; if missing, derive a readable label from email. Never show raw email. */
  employeeLabel(e?: Employee): string {
    if (!e) return '';
    const name = (e.name || '').trim();
    if (name) return name;

    const email = (e.email || '').trim();
    if (email) {
      const local = email.split('@')[0] || '';
      // prettify local part: "abel.kebede" -> "Abel kebede", "elsa_m" -> "Elsa m"
      const pretty = local.replace(/[._-]+/g, ' ').trim();
      return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : `Employee #${e.id}`;
    }
    return `Employee #${e.id}`;
  }

  // --------- modal open/close ----------
  openAdd(): void {
    this.formMode = 'add';
    const firstId = this.employees && this.employees.length ? this.employees[0].id : undefined;
    this.formSalary = {
      employeeId: firstId,
      amount: undefined,
      currency: 'USD',
      effectiveDate: ''
    };
    this.formOpen = true;
  }

  openEdit(row: ViewSalary): void {
    this.formMode = 'edit';
    this.formSalary = {
      id: row.id,
      employeeId: row.employeeId,
      amount: row.amount,
      currency: row.currency || 'USD',
      effectiveDate: row.effectiveDate || ''
    };
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  // --------- save/delete ----------
  saveSalary(): void {
    const payload: Partial<Salary> = { ...this.formSalary };

    if (!payload.employeeId) {
      alert('Please choose an employee.');
      return;
    }
    if (payload.amount == null || Number(payload.amount) < 0) {
      alert('Amount must be a non-negative number.');
      return;
    }
    if (payload.currency) payload.currency = String(payload.currency).toUpperCase().trim();

    const done = () => this.closeForm();

    if (this.formMode === 'add') {
      this.data.addSalary(payload).subscribe({ next: done, error: done });
    } else {
      this.data.updateSalary(payload as Salary).subscribe({ next: done, error: done });
    }
  }

  delete(row: ViewSalary): void {
    if (!row || row.id == null) return;
    if (!confirm('Delete this salary record?')) return;
    this.data.deleteSalary(Number(row.id)).subscribe();
  }
}
