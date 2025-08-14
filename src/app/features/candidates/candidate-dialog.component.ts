import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CandidateService } from '../../../services/candidate.service';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';
import { Candidate } from '../../models/candidate';

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
  form: FormGroup;
  depts: Department[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {mode:'create'|'edit', candidate?: Candidate},
    public ref: MatDialogRef<CandidateDialogComponent>,
    private fb: FormBuilder,
    private api: CandidateService,
    private deptsApi: DepartmentService
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
  save() {
    const v = this.form.value;
    const req = this.data.mode==='create' ? this.api.add(v) : this.api.update(v);
    req.subscribe(() => this.ref.close(true));
  }
}
