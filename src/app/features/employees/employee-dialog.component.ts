import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';
import { Employee } from '../../models/employee';

@Component({
  template: `
  <h2 mat-dialog-title>{{data.mode === 'create' ? 'Add Employee' : 'Edit Employee'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <div class="row">
      <mat-form-field><input matInput placeholder="First name" formControlName="firstName"></mat-form-field>
      <mat-form-field><input matInput placeholder="Last name" formControlName="lastName"></mat-form-field>
    </div>
    <mat-form-field style="width:100%"><input matInput placeholder="Email" formControlName="email"></mat-form-field>
    <div class="row">
      <mat-form-field>
        <mat-select placeholder="Department" formControlName="departmentId">
          <mat-option *ngFor="let d of departments" [value]="d.id">{{d.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <input matInput [matDatepicker]="picker" placeholder="Hire date" formControlName="hireDate">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
    <mat-form-field style="width:100%"><input matInput type="number" placeholder="Salary" formControlName="salary"></mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="ref.close()">Cancel</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
      {{data.mode === 'create' ? 'Create' : 'Save'}}
    </button>
  </mat-dialog-actions>
  `,
  styles: [`.row{display:flex; gap:12px}`]
})
export class EmployeeDialogComponent implements OnInit {
  form: FormGroup;
  departments: Department[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create'|'edit', employee?: Employee },
    public ref: MatDialogRef<EmployeeDialogComponent>,
    private fb: FormBuilder,
    private employees: EmployeeService,
    private depts: DepartmentService
  ) {}
  ngOnInit() {
    this.depts.getAll().subscribe(d => this.departments = d);
    const e = this.data.employee || { firstName:'', lastName:'', email:'', departmentId:null, hireDate: new Date().toISOString(), salary: 0 };
    this.form = this.fb.group({
      id: [e['id']], firstName: [e.firstName, Validators.required],
      lastName: [e.lastName, Validators.required],
      email: [e.email, [Validators.required, Validators.email]],
      departmentId: [e.departmentId, Validators.required],
      hireDate: [e.hireDate], salary: [e.salary, [Validators.required, Validators.min(0)]]
    });
  }
  save() {
    const v = { ...this.form.value, hireDate: new Date(this.form.value.hireDate).toISOString() };
    const req = this.data.mode === 'create' ? this.employees.add(v) : this.employees.update(v);
    req.subscribe(() => this.ref.close(true));
  }
}
