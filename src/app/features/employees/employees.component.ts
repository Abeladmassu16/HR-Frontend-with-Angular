import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string | Date;
  role?: string;
}

const API = '/api/employees';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  employeesView: Employee[] = [];   // filtered view if you use a search box
  employeeFilter = '';
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading = true; this.error = '';
    this.http.get<Employee[]>(API).pipe(
      catchError(err => { this.error = 'Failed to load employees'; console.error(err); return of([]); })
    ).subscribe(list => {
      this.employees = Array.isArray(list) ? list : [];
      this.applyFilter();
      this.loading = false;
    }, _ => { this.loading = false; });
  }

  applyFilter() {
    const q = (this.employeeFilter || '').toLowerCase();
    if (!q) { this.employeesView = this.employees.slice(); return; }
    this.employeesView = this.employees.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q)
    );
  }

  addEmployee()  { /* open dialog / navigate */ console.log('addEmployee'); }
  editEmployee(e: Employee) { console.log('editEmployee', e); }

  deleteEmployee(e: Employee) {
    if (!e || e.id == null) return;
    this.http.delete(`${API}/${e.id}`).pipe(
      catchError(err => { this.error = 'Failed to delete employee'; console.error(err); return of(null); })
    ).subscribe(() => {
      this.employees = this.employees.filter(x => x.id !== e.id);
      this.applyFilter();
    });
  }

  trackById(_: number, row: { id: number }) { return row.id; }
}
