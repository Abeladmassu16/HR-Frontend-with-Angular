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

const API = '/api/employees'; // change to your backend path if needed

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

  // Add modal state
  addOpen = false;
  addSaving = false;
  newEmp: { name: string; email?: string; hireDate?: string | null; role?: string } = {
    name: '', email: '', hireDate: null, role: ''
  };

  // focus first field when modal opens
  @ViewChild('nameInput', { static: false }) nameInput: ElementRef | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.refresh(); }

  /** Close modal on ESC */
  @HostListener('document:keydown.escape')
  onEsc() { if (this.addOpen) this.closeAdd(); }

  /** Fetch employees */
  refresh(): void {
    this.loading = true;
    this.error = '';

    this.http.get<any[]>(API).pipe(
      catchError(err => {
        console.error('GET /employees failed', err);
        this.error = 'Failed to load employees.';
        return of([] as any[]);
      })
    )
    .subscribe(list => {
      var raw = Array.isArray(list) ? list : [];
      this.employees = this.normalize(raw);
      this.applyFilter();
      this.loading = false;
    }, _ => { this.loading = false; });
  }

  /** First non-empty value helper (works on TS 3.x) */
  private firstNonEmpty(...values: any[]): any {
    var fallback = values.length ? values[values.length - 1] : '';
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return fallback;
  }

  /** Normalize backend rows into { id, name, email, hireDate, role } */
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

      var id = (r && r.id) != null ? Number(r.id) : (idx + 1);

      return { id: id, name: name, email: email, hireDate: hireDate, role: role };
    });
  }

  /** Search */
  applyFilter(): void {
    var q = (this.employeeFilter || '').toLowerCase();
    if (!q) { this.employeesView = this.employees.slice(); return; }
    this.employeesView = this.employees.filter(function(e) {
      return ((e.name  || '').toLowerCase().indexOf(q) !== -1) ||
             ((e.email || '').toLowerCase().indexOf(q) !== -1) ||
             ((e.role  || '').toLowerCase().indexOf(q) !== -1);
    });
  }

  /* ---------- Add (modal) ---------- */
  openAdd(): void {
    this.addOpen = true;
    this.addSaving = false;
    this.newEmp = { name: '', email: '', hireDate: null, role: '' };

    // lock background scroll
    try { document.body.style.overflow = 'hidden'; } catch (_e) {}

    // focus first field
    setTimeout(() => {
      if (this.nameInput && this.nameInput.nativeElement) {
        this.nameInput.nativeElement.focus();
      }
    }, 0);
  }

  closeAdd(): void {
    if (this.addSaving) return;
    this.addOpen = false;
    // restore scroll
    try { document.body.style.overflow = ''; } catch (_e) {}
  }

  saveNew(): void {
    if (!this.newEmp || !this.newEmp.name || !this.newEmp.name.trim()) return;

    this.addSaving = true;
    var payload: any = {
      name: (this.newEmp.name || '').trim(),
      email: (this.newEmp.email || '').trim(),
      hireDate: this.newEmp.hireDate || null,
      role: (this.newEmp.role || '').trim()
    };

    this.http.post<any>(API, payload).pipe(
      catchError(err => {
        console.error('POST /employees failed, doing local add', err);
        return of(null);
      })
    ).subscribe(created => {
      this.addSaving = false;
      this.addOpen = false;
      try { document.body.style.overflow = ''; } catch (_e) {}

      if (created && created.id != null) {
        this.employees = this.employees.concat(this.normalize([created]));
      } else {
        var maxId = this.employees.reduce(function(m, e){ return e.id > m ? e.id : m; }, 0);
        var local = { id: maxId + 1, name: payload.name, email: payload.email, hireDate: payload.hireDate, role: payload.role };
        this.employees = this.employees.concat([local]);
      }
      this.applyFilter();
    });
  }

  /* ---------- Edit/Delete (stubs) ---------- */
  editEmployee(row: Employee): void {
    console.log('editEmployee', row);
    // TODO: open edit modal or navigate to details
  }

  deleteEmployee(row: Employee): void {
    if (!row || row.id == null) return;
    this.http.delete(API + '/' + row.id).pipe(
      catchError(err => {
        console.error('DELETE employee failed', err);
        this.error = 'Failed to delete employee.';
        return of(null);
      })
    )
    .subscribe(() => {
      this.employees = this.employees.filter(function(x) { return x.id !== row.id; });
      this.applyFilter();
    });
  }

  /** TrackBy to avoid re-render flicker */
  trackById(_: number, r: { id: number }) { return r.id; }
}
