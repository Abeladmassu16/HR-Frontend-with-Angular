import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HrDataService, Employee, Salary } from '../../shared/hr-data.service';

interface DialogData {
  mode: 'add' | 'edit';
  row?: Salary;
}

@Component({
  selector: 'app-salary-dialog',
  templateUrl: './salary-dialog.component.html',
  styleUrls: ['./salary-dialog.component.scss'],
})
export class SalaryDialogComponent implements OnInit {
  title = 'Add Salary';
  employees: Employee[] = [];

  // simple template-driven payload
  form: Partial<Salary> = {
    employeeId: undefined,
    amount: undefined,
    currency: 'USD',
    effectiveDate: '',
  };

  constructor(
    private ref: MatDialogRef<SalaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private ds: HrDataService
  ) {}

  ngOnInit(): void {
    this.ds.employees$.subscribe((es) => (this.employees = es || []));

    if (this.data && this.data.mode === 'edit' && this.data.row) {
      this.title = 'Edit Salary';
      var r = this.data.row;
      this.form = {
        id: r.id,
        employeeId: r.employeeId,
        amount: r.amount,
        currency: r.currency || 'USD',
        effectiveDate: r.effectiveDate || '',
      };
    }
  }

  cancel(): void {
    this.ref.close();
  }

  save(): void {
    // very basic validation
    if (!this.form.employeeId || this.form.amount == null) return;
    this.ref.close(this.form);
  }

  /** Prefer real name; otherwise build Title Case from email local-part */
  displayEmployee(e: Employee): string {
    if (!e) return '';
    if (e.name && String(e.name).trim()) return String(e.name).trim();
    const local = (e.email || '').split('@')[0] || '';
    if (!local) return '';
    return local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }
}
