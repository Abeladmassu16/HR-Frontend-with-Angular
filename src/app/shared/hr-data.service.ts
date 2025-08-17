// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/* ===== Domain models ===== */
export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  role?: string;
  hireDate?: string;       // yyyy-mm-dd
  departmentId?: number;   // relates to Department.id
  departmentName?: string; // optional convenience field for UI
}

export interface Candidate {
  id: number;
  name: string;
  email?: string;
  status: 'Applied' | 'Interview' | 'Hired' | 'Rejected';
  departmentId?: number;
}

export interface Company {
  id: number;
  name: string;
  location?: string;
}

@Injectable({ providedIn: 'root' })
export class HrDataService {
  /* ===== Local stores ===== */
  private candidatesSubject  = new BehaviorSubject<Candidate[]>([]);
  private companiesSubject   = new BehaviorSubject<Company[]>([]);
  private employeesSubject   = new BehaviorSubject<Employee[]>([]);
  private departmentsSubject = new BehaviorSubject<Department[]>([]);

  /* ===== Public streams ===== */
  candidates$  = this.candidatesSubject.asObservable();
  companies$   = this.companiesSubject.asObservable();
  employees$   = this.employeesSubject.asObservable();
  departments$ = this.departmentsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Seed initial data from the in-memory API
    this.refreshAll().subscribe();
  }

  /* =========================================================================
     Bulk refresh (safe on older RxJS/TS: uses forkJoin array, not object)
     ========================================================================= */
  refreshAll(): Observable<any> {
    const cReq  = this.http.get<Candidate[]>('/api/candidates').pipe(catchError(this.fallback<Candidate[]>([])));
    const coReq = this.http.get<Company[]>('/api/companies').pipe(catchError(this.fallback<Company[]>([])));
    const eReq  = this.http.get<Employee[]>('/api/employees').pipe(catchError(this.fallback<Employee[]>([])));
    const dReq  = this.http.get<Department[]>('/api/departments').pipe(catchError(this.fallback<Department[]>([])));

    return forkJoin([cReq, coReq, eReq, dReq]).pipe(
      tap((res) => {
        const candidates  = res[0] || [];
        const companies   = res[1] || [];
        const employees   = res[2] || [];
        const departments = res[3] || [];

        this.candidatesSubject.next(candidates);
        this.companiesSubject.next(companies);
        this.employeesSubject.next(employees);
        this.departmentsSubject.next(departments);
      })
    );
  }

  /* =========================================================================
     Snapshot helpers (used in components for filtering/joining)
     ========================================================================= */
  snapshotCandidates(): Candidate[]  { return this.candidatesSubject.getValue(); }
  snapshotCompanies(): Company[]     { return this.companiesSubject.getValue(); }
  snapshotEmployees(): Employee[]    { return this.employeesSubject.getValue(); }
  snapshotDepartments(): Department[] { return this.departmentsSubject.getValue(); }

  /* =========================================================================
     CANDIDATES CRUD
     ========================================================================= */
  addCandidate(body: Partial<Candidate>): Observable<Candidate> {
    return this.http.post<Candidate>('/api/candidates', body).pipe(
      tap((created) => {
        const list = this.snapshotCandidates().slice();
        list.push(created);
        this.candidatesSubject.next(list);
      })
    );
  }

  updateCandidate(row: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`/api/candidates/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.snapshotCandidates().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.candidatesSubject.next(list);
      })
    );
  }

  deleteCandidate(id: number): Observable<{}> {
    return this.http.delete(`/api/candidates/${id}`).pipe(
      tap(() => {
        const list = this.snapshotCandidates().filter(r => Number(r.id) !== Number(id));
        this.candidatesSubject.next(list);
      })
    );
  }

  /* =========================================================================
     EMPLOYEES CRUD
     ========================================================================= */
  addEmployee(body: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>('/api/employees', body).pipe(
      tap((created) => {
        const list = this.snapshotEmployees().slice();
        list.push(created);
        this.employeesSubject.next(list);
      })
    );
  }

  updateEmployee(row: Employee): Observable<Employee> {
    return this.http.put<Employee>(`/api/employees/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.snapshotEmployees().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.employeesSubject.next(list);
      })
    );
  }

  deleteEmployee(id: number): Observable<{}> {
    return this.http.delete(`/api/employees/${id}`).pipe(
      tap(() => {
        const list = this.snapshotEmployees().filter(r => Number(r.id) !== Number(id));
        this.employeesSubject.next(list);
      })
    );
  }

  /* =========================================================================
     COMPANIES CRUD
     ========================================================================= */
  addCompany(body: Partial<Company>): Observable<Company> {
    return this.http.post<Company>('/api/companies', body).pipe(
      tap((created) => {
        const list = this.snapshotCompanies().slice();
        list.push(created);
        this.companiesSubject.next(list);
      })
    );
  }

  updateCompany(row: Company): Observable<Company> {
    return this.http.put<Company>(`/api/companies/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.snapshotCompanies().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.companiesSubject.next(list);
      })
    );
  }

  deleteCompany(id: number): Observable<{}> {
    return this.http.delete(`/api/companies/${id}`).pipe(
      tap(() => {
        const list = this.snapshotCompanies().filter(r => Number(r.id) !== Number(id));
        this.companiesSubject.next(list);
      })
    );
  }

  /* =========================================================================
     DEPARTMENTS CRUD
     ========================================================================= */
  addDepartment(body: Partial<Department>): Observable<Department> {
    return this.http.post<Department>('/api/departments', body).pipe(
      tap((created) => {
        const list = this.snapshotDepartments().slice();
        list.push(created);
        this.departmentsSubject.next(list);
      })
    );
  }

  updateDepartment(row: Department): Observable<Department> {
    return this.http.put<Department>(`/api/departments/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.snapshotDepartments().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.departmentsSubject.next(list);
      })
    );
  }

  deleteDepartment(id: number): Observable<{}> {
    return this.http.delete(`/api/departments/${id}`).pipe(
      tap(() => {
        const list = this.snapshotDepartments().filter(d => Number(d.id) !== Number(id));
        this.departmentsSubject.next(list);

        // Optional: also clear departmentId from employees that referenced this dept
        const emps = this.snapshotEmployees().map(e => {
          if (Number(e.departmentId) === Number(id)) {
            return { ...e, departmentId: undefined, departmentName: undefined };
          }
          return e;
        });
        this.employeesSubject.next(emps);
      })
    );
  }

  /* =========================================================================
     Helpers
     ========================================================================= */
  private fallback<T>(value: T) {
    return function () { return of(value); };
  }
}
