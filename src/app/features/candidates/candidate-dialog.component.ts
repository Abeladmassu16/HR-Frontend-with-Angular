import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CandidateService } from '../../../services/candidate.service';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';
import { Candidate } from '../../models/candidate';

import { Employee } from '../../models/employee';
import { EmployeeService } from '../../../services/employee.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  template: `
  <h2 mat-dialog-title>{{data.mode==='create' ? 'Add Candidate' : 'Edit Candidate'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <div class="row">
      <mat-form-field><input matInput placeholder="Name" formControlName="name"></mat-form-field>
      <mat-form-field><input matInput placeholder="Email" formControlName="email"></mat-form-field>
    </div>
    <div class="row">
      <mat-form-field><input matInput placeholder="Phone" formControlName="phone"></mat-form-field>
      <mat-form-field>
        <mat-select placeholder="Department" formControlName="appliedForDepartmentId">
          <mat-option *ngFor="let d of depts" [value]="d.id">{{d.name}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <mat-form-field style="width:100%">
      <mat-select placeholder="Status" formControlName="status">
        <mat-option value="Applied">Applied</mat-option>
        <mat-option value="Interview">Interview</mat-option>
        <mat-option value="Hired">Hired</mat-option>
        <mat-option value="Rejected">Rejected</mat-option>
      </mat-select>
    </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="ref.close()">Cancel</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
      {{data.mode==='create' ? 'Create' : 'Save'}}
    </button>
  </mat-dialog-actions>
  `,
  styles: [`.row{display:flex; gap:12px}`]
})
export class CandidateDialogComponent implements OnInit {
  form: FormGroup; depts: Department[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {mode:'create'|'edit', candidate?: Candidate},
    public ref: MatDialogRef<CandidateDialogComponent>,
    private fb: FormBuilder,
    private api: CandidateService,
    private deptsApi: DepartmentService,

    // NEW: employees + snackbar
    private employeesApi: EmployeeService,
    private sb: MatSnackBar
  ) {}

  ngOnInit() {
    this.deptsApi.getAll().subscribe(d => this.depts = d);
    const c = this.data.candidate || { name:'', email:'', phone:'', appliedForDepartmentId:null, status:'Applied' };
    this.form = this.fb.group({
      id:[(c as any).id],
      name:[c.name, Validators.required],
      email:[c.email, [Validators.required, Validators.email]],
      phone:[c.phone, Validators.required],
      appliedForDepartmentId:[c.appliedForDepartmentId, Validators.required],
      status:[c.status, Validators.required]
    });
  }

  private mapCandidateToEmployee(c: Candidate): Employee {
    const [firstName, ...rest] = (c.name || '').trim().split(' ');
    return {
      id: 0,
      firstName: firstName || c.name || 'New',
      lastName: rest.join(' '),
      email: c.email,
      departmentId: c.appliedForDepartmentId,
      hireDate: new Date().toISOString(),
      salary: 0
    };
  }

  save() {
    const v = this.form.value as Candidate;
    const req$ = this.data.mode === 'create' ? this.api.add(v) : this.api.update(v);

    req$.pipe(
      switchMap((saved: Candidate) => {
        // Hired → add to employees, then remove candidate
        if (saved.status === 'Hired') {
  const employee = this.mapCandidateToEmployee(saved);

  return this.employeesApi.getAll().pipe(
    map(list => list.some(e =>
      (e.email || '').toLowerCase() === (saved.email || '').toLowerCase()
    )),
    switchMap(exists => exists ? of(null) : this.employeesApi.add(employee)),
    switchMap(() => this.api.delete(saved.id)),
  );
}

        // Rejected → remove candidate
        if (saved.status === 'Rejected') {
          return this.api.delete(saved.id);
        }

        // Otherwise just keep the candidate
        return of(saved);
      })
    ).subscribe({
      next: () => {
        const s = (this.form.value.status || '').toLowerCase();
        if (s === 'hired')   this.sb.open('Candidate hired → moved to Employees', 'OK', { duration: 1800 });
        else if (s === 'rejected') this.sb.open('Candidate rejected → removed', 'OK', { duration: 1800 });
        else this.sb.open('Candidate saved', 'OK', { duration: 1500 });

        this.ref.close(true);
      },
      error: () => {
        this.sb.open('Error saving candidate', 'Dismiss', { duration: 2500 });
      }
    });
  }
}
