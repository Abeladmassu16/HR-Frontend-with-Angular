import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, combineLatest } from 'rxjs';

import { HrDataService, Salary, Employee } from '../../shared/hr-data.service';
import { SalaryDialogComponent } from './salary-dialog.component';

type SalaryRow = Salary & { employeeName?: string };

@Component({
  selector: 'app-salaries',
  templateUrl: './salaries.component.html',
  styleUrls: ['./salaries.component.scss'],
})
export class SalariesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'id',
    'employeeName',
    'amount',
    'currency',
    'effectiveDate',
    'actions',
  ];

  dataSource = new MatTableDataSource<SalaryRow>([]);
  private sub: Subscription | undefined;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined;
  @ViewChild(MatSort, { static: true }) sort: MatSort | undefined;

  constructor(
    private data: HrDataService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([this.data.salaries$, this.data.employees$]).subscribe(
      ([sals, emps]: [Salary[], Employee[]]) => {
        const rows: SalaryRow[] = (sals || []).map((s) => {
          const emp = (emps || []).find((e) => Number(e.id) === Number(s.employeeId));
          const employeeName = emp ? this.deriveName(emp) : '—';
          return { ...s, employeeName };
        });

        this.dataSource = new MatTableDataSource(rows);
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;

        this.dataSource.filterPredicate = (r: SalaryRow, filter: string) => {
          const f = (filter || '').trim().toLowerCase();
          return (
            String(r.id || '').toLowerCase().includes(f) ||
            String(r.employeeName || '').toLowerCase().includes(f) ||
            String(r.amount || '').toLowerCase().includes(f) ||
            String(r.currency || '').toLowerCase().includes(f) ||
            String(r.effectiveDate || '').toLowerCase().includes(f)
          );
        };
      }
    );
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  /** Prefer real name; otherwise build Title Case from email local-part */
  private deriveName(e: Employee): string {
    if (e && e.name && String(e.name).trim()) return String(e.name).trim();

    const email = (e && e.email) ? String(e.email) : '';
    const local = email.split('@')[0] || '';
    if (!local) return '—';
    // "abel.kassahun" / "abel_kassahun" / "abel-kassahun" -> "Abel Kassahun"
    const pretty = local
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
    return pretty || '—';
  }

  applyFilter(value: string): void {
    if (!this.dataSource) return;
    this.dataSource.filter = (value || '').trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openAdd(): void {
    const ref = this.dialog.open(SalaryDialogComponent, {
      width: '720px',
      panelClass: 'glass-dialog',
      data: { mode: 'add' },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.data.addSalary(payload).subscribe(() => {
        this.snack.open('Salary created', 'OK', { duration: 2000 });
      });
    });
  }

  openEdit(row: SalaryRow): void {
    const ref = this.dialog.open(SalaryDialogComponent, {
      width: '720px',
      panelClass: 'glass-dialog',
      data: { mode: 'edit', row },
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.data.updateSalary(payload).subscribe(() => {
        this.snack.open('Salary updated', 'OK', { duration: 2000 });
      });
    });
  }

  delete(row: SalaryRow): void {
    if (!row || row.id == null) return;
    if (!confirm('Delete this salary record?')) return;
    this.data.deleteSalary(Number(row.id)).subscribe(() => {
      this.snack.open('Salary deleted', 'OK', { duration: 2000 });
    });
  }
}
