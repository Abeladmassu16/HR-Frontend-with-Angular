import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CompanyService } from '../../../services/company.service';
import { Company } from '../../models/company';

@Component({
  template: `
  <h2 mat-dialog-title>{{data.mode==='create' ? 'Add Company' : 'Edit Company'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <mat-form-field style="width:100%"><input matInput placeholder="Name" formControlName="name"></mat-form-field>
    <mat-form-field style="width:100%"><input matInput placeholder="Location" formControlName="location"></mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="ref.close()">Cancel</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">{{data.mode==='create' ? 'Create' : 'Save'}}</button>
  </mat-dialog-actions>
  `
})
export class CompanyDialogComponent implements OnInit {
  form: FormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {mode:'create'|'edit', company?: Company},
    public ref: MatDialogRef<CompanyDialogComponent>,
    private fb: FormBuilder,
    private api: CompanyService
  ) {}
  ngOnInit() {
    const c = this.data.company || { name:'', location:'' };
    this.form = this.fb.group({ id:[(c as any).id], name:[c.name, Validators.required], location:[c.location, Validators.required]});
  }
  save() { const v = this.form.value; const req = this.data.mode==='create' ? this.api.add(v) : this.api.update(v); req.subscribe(() => this.ref.close(true)); }
}
