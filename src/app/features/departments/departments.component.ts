import { Component, OnInit } from '@angular/core';
import { DepartmentsService, Department } from './departments.service';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  departments: Department[] = [];
  newDepartmentName = '';
  loading = false;
  error = '';

  constructor(private svc: DepartmentsService) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading = true;
    this.error = '';
    this.svc.getAll().subscribe(list => {
      this.departments = Array.isArray(list) ? list : [];
      this.loading = false;
      if (!this.departments.length) {
        console.warn('Departments list is empty. Check your API/seed data.');
      }
    }, err => {
      this.loading = false;
      this.error = 'Failed to load departments';
      console.error(err);
    });
  }

  addDepartment() {
    const name = (this.newDepartmentName || '').trim();
    if (!name) return;
    this.svc.add(name).subscribe(created => {
      if (created && created.id != null) {
        this.departments = [...this.departments, created];
        this.newDepartmentName = '';
      } else {
        this.refresh(); // fallback if backend didn’t return the new row
      }
    });
  }

  deleteDepartment(row: Department) {
    if (!row || row.id == null) return;
    this.svc.remove(row.id).subscribe(() => {
      this.departments = this.departments.filter(d => d.id !== row.id);
    });
  }

  trackById(_: number, row: { id: number }) { return row.id; }
}
