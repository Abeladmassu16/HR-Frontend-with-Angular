import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string | Date | null;
  role?: string;
}

const API = '/api/employees'; // adjust to your backend

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  employees: Employee[] = [];
  employeesView: Employee[] = [];
  employeeFilter = '';

  loading = false;
  error = '';

  // Modal state
  modalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  modalSaving = false;
  formEmp: { id?: number; name: string; email?: string; hireDate?: string | null; role?: string } = {
    name: '', email: '', hireDate: null, role: ''
  };

  @ViewChild('nameInput', { static: false }) nameInput: ElementRef | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.refresh(); }

  /** Close modal with ESC */
  @HostListener('document:keydown.escape') onEsc() { if (this.modalOpen) this.closeModal(); }

  /* ----------------------- data ----------------------- */

  refresh(): void {
    this.loading = true; this.error = '';
    this.http.get<any[]>(API).pipe(
      catchError(err => {
        console.error('GET /employees failed', err);
        this.error = 'Failed to load employees.';
        return of([] as any[]);
      })
    ).subscribe(list => {
      var raw = Array.isArray(list) ? list : [];
      this.employees = this.normalize(raw);
      this.applyFilter();
      this.loading = false;
    }, _ => this.loading = false);
  }

  /** Pick first non-empty value (TS 3.x safe) */
  private firstNonEmpty(...values: any[]): any {
    var fallback = values.length ? values[values.length - 1] : '';
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return fallback;
  }

  private normalize(list: any[]): Employee[] {
    return list.map((r, idx) => {
      var firstName = (r && r.firstName) ? r.firstName : '';
      var lastName  = (r && r.lastName)  ? r.lastName  : '';
      var nameFromParts = (firstName + ' ' + lastName).trim();

      var name = '';
      if (r && r.name) name = r.name;
      else if (nameFromParts) name = nameFromParts;
      else if (r && r.fullName) name = r.fullName;
      else if (r && r.username) name = r.username;

      var role     = this.firstNonEmpty(r && r.role, r && r.title, r && r.position, r && r.jobTitle);
      var email    = this.firstNonEmpty(r && r.email, r && r.mail, r && r.contactEmail);
      var hireDate = this.firstNonEmpty(r && r.hireDate, r && r.hiredAt, r && r.startDate, r && r.joined, null);
      var id       = (r && r.id) != null ? Number(r.id) : (idx + 1);

      return { id: id, name: name, email: email, hireDate: hireDate, role: role };
    });
  }

  applyFilter(): void {
    var q = (this.employeeFilter || '').toLowerCase();
    if (!q) { this.employeesView = this.employees.slice(); return; }
    this.employeesView = this.employees.filter(function(e) {
      return ((e.name  || '').toLowerCase().indexOf(q) !== -1) ||
             ((e.email || '').toLowerCase().indexOf(q) !== -1) ||
             ((e.role  || '').toLowerCase().indexOf(q) !== -1);
    });
  }

  /* ----------------------- modal ----------------------- */

  openAdd(): void {
    this.modalMode = 'add';
    this.modalOpen = true;
    this.modalSaving = false;
    this.formEmp = { name: '', email: '', hireDate: null, role: '' };
    try { document.body.style.overflow = 'hidden'; } catch (_e) {}
    setTimeout(() => { if (this.nameInput && this.nameInput.nativeElement) this.nameInput.nativeElement.focus(); }, 0);
  }

  openEdit(row: Employee): void {
    if (!row) return;
    this.modalMode = 'edit';
    this.modalOpen = true;
    this.modalSaving = false;
    this.formEmp = {
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      hireDate: this.toISODate(row.hireDate),
      role: row.role || ''
    };
    try { document.body.style.overflow = 'hidden'; } catch (_e) {}
    setTimeout(() => { if (this.nameInput && this.nameInput.nativeElement) this.nameInput.nativeElement.focus(); }, 0);
  }

  closeModal(): void {
    if (this.modalSaving) return;
    this.modalOpen = false;
    try { document.body.style.overflow = ''; } catch (_e) {}
  }

  saveForm(): void {
    if (!this.formEmp || !this.formEmp.name || !this.formEmp.name.trim()) return;
    if (!this.isValidEmail(this.formEmp.email || '')) return;

    this.modalSaving = true;

    var payload: any = {
      name: (this.formEmp.name || '').trim(),
      email: (this.formEmp.email || '').trim(),
      hireDate: this.formEmp.hireDate || null,
      role: (this.formEmp.role || '').trim()
    };

    if (this.modalMode === 'add') {
      this.http.post<any>(API, payload).pipe(
        catchError(err => { console.error('POST /employees failed, local add', err); return of(null); })
      ).subscribe(created => {
        this.afterSaveAdd(created, payload);
      });

    } else {
      var id = this.formEmp.id!;
      this.http.put<any>(API + '/' + id, payload).pipe(
        catchError(err => { console.error('PUT /employees/:id failed, local update', err); return of(null); })
      ).subscribe(updated => {
        this.afterSaveEdit(id, updated || payload);
      });
    }
  }

  private afterSaveAdd(created: any, payload: any): void {
    this.modalSaving = false; this.modalOpen = false; try { document.body.style.overflow = ''; } catch (_e) {}
    if (created && created.id != null) {
      this.employees = this.employees.concat(this.normalize([created]));
    } else {
      var maxId = this.employees.reduce(function(m, e){ return e.id > m ? e.id : m; }, 0);
      var local = { id: maxId + 1, name: payload.name, email: payload.email, hireDate: payload.hireDate, role: payload.role };
      this.employees = this.employees.concat([local]);
    }
    this.applyFilter();
  }

  private afterSaveEdit(id: number, payload: any): void {
    this.modalSaving = false; this.modalOpen = false; try { document.body.style.overflow = ''; } catch (_e) {}
    for (var i = 0; i < this.employees.length; i++) {
      if (this.employees[i].id === id) {
        this.employees[i] = {
          id: id,
          name: payload.name || this.employees[i].name,
          email: payload.email || this.employees[i].email,
          hireDate: payload.hireDate != null ? payload.hireDate : this.employees[i].hireDate,
          role: payload.role || this.employees[i].role
        };
        break;
      }
    }
    this.applyFilter();
  }

  emailRegex: string = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
  /* ----------------------- utils ----------------------- */

  isValidEmail(s: string): boolean {
    if (!s) return true; // empty = allowed
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  }

  private toISODate(d: any): string | null {
    if (!d) return null;
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    var m = (dt.getMonth() + 1).toString(); if (m.length < 2) m = '0' + m;
    var day = dt.getDate().toString(); if (day.length < 2) day = '0' + day;
    return dt.getFullYear() + '-' + m + '-' + day;
  }

  deleteEmployee(row: Employee): void {
    if (!row || row.id == null) return;
    this.http.delete(API + '/' + row.id).pipe(
      catchError(err => { console.error('DELETE employee failed', err); this.error = 'Failed to delete employee.'; return of(null); })
    ).subscribe(() => {
      this.employees = this.employees.filter(function(x) { return x.id !== row.id; });
      this.applyFilter();
    });
  }

  trackById(_: number, r: { id: number }) { return r.id; }
}
