import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee, Salary } from '../../shared/hr-data.service';

export interface SalaryDialogData {
  mode: 'add'|'edit';
  employees: Employee[];
  value?: Partial<Salary>;
}

@Component({
  selector: 'app-salary-dialog',
  templateUrl: './salary-dialog.component.html',
  styleUrls: ['./salary-dialog.component.scss']
})
export class SalaryDialogComponent {
  form: FormGroup;
  title: string;

  employees: Employee[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SalaryDialogData,
    private fb: FormBuilder,
    private ref: MatDialogRef<SalaryDialogComponent>
  ) {
    this.employees = data.employees || [];
    var v = data.value || {};
    this.form = this.fb.group({
      id:           [v.id],
      employeeId:   [v.employeeId, Validators.required],
      amount:       [v.amount, [Validators.required, Validators.min(0)]],
      currency:     [v.currency || 'USD', Validators.required],
      effectiveDate:[v.effectiveDate || '', Validators.required]
    });
    this.title = data.mode === 'add' ? 'Add Salary' : 'Edit Salary';
  }

  save() {
    if (this.form.invalid) return;
    this.ref.close(this.form.value as Salary);
  }

  cancel() { this.ref.close(null); }
}
