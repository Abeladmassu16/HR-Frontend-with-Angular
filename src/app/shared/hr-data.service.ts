// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/** ---- Domain models ---- */
export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string;
  role?: string;
  departmentId?: number;
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
  /** ---- Subjects ---- */
  private departmentsSubject = new BehaviorSubject<Department[]>([]);
  private employeesSubject   = new BehaviorSubject<Employee[]>([]);
  private candidatesSubject  = new BehaviorSubject<Candidate[]>([]);
  private companiesSubject   = new BehaviorSubject<Company[]>([]);

  /** ---- Public streams ---- */
  departments$ = this.departmentsSubject.asObservable();
  employees$   = this.employeesSubject.asObservable();
  candidates$  = this.candidatesSubject.asObservable();
  companies$   = this.companiesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initial load
    this.refreshAll().subscribe();
  }

  /** ---- Bootstrap all collections (RxJS 6 compatible forkJoin) ---- */
  refreshAll(): Observable<any> {
    const dReq = this.http
      .get<Department[]>('/api/departments')
      .pipe(catchError(this.empty<Department[]>([])));

    const eReq = this.http
      .get<Employee[]>('/api/employees')
      .pipe(catchError(this.empty<Employee[]>([])));

    const cReq = this.http
      .get<Candidate[]>('/api/candidates')
      .pipe(catchError(this.empty<Candidate[]>([])));

    const coReq = this.http
      .get<Company[]>('/api/companies')
      .pipe(catchError(this.empty<Company[]>([])));

    return forkJoin([dReq, eReq, cReq, coReq]).pipe(
      tap((res) => {
        const depts = res[0] || [];
        const emps  = res[1] || [];
        const cands = res[2] || [];
        const comps = res[3] || [];
        this.departmentsSubject.next(depts);
        this.employeesSubject.next(emps);
        this.candidatesSubject.next(cands);
        this.companiesSubject.next(comps);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Snapshot helpers (used by DepartmentsComponent and for local updates)
  // ---------------------------------------------------------------------------
  currentDepartments(): Department[] {
    const v = this.departmentsSubject.getValue();
    return v ? v.slice() : [];
  }
  currentEmployees(): Employee[] {
    const v = this.employeesSubject.getValue();
    return v ? v.slice() : [];
  }
  currentCandidates(): Candidate[] {
    const v = this.candidatesSubject.getValue();
    return v ? v.slice() : [];
  }

  // ---------------------------------------------------------------------------
  // DEPARTMENTS CRUD
  // ---------------------------------------------------------------------------
  addDepartment(body: Partial<Department>): Observable<Department> {
    return this.http.post<Department>('/api/departments', body).pipe(
      tap((created) => {
        const list = this.currentDepartments();
        list.push(created);
        this.departmentsSubject.next(list);
      })
    );
  }

  updateDepartment(row: Department): Observable<Department> {
    return this.http.put<Department>('/api/departments/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentDepartments();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) {
            list[i] = saved;
            break;
          }
        }
        this.departmentsSubject.next(list);
      })
    );
  }

  deleteDepartment(id: number): Observable<{}> {
    return this.http.delete('/api/departments/' + id).pipe(
      tap(() => {
        const list = this.currentDepartments().filter(d => Number(d.id) !== Number(id));
        this.departmentsSubject.next(list);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // EMPLOYEES CRUD
  // ---------------------------------------------------------------------------
  addEmployee(body: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>('/api/employees', body).pipe(
      tap((created) => {
        const list = this.currentEmployees();
        list.push(created);
        this.employeesSubject.next(list);
      })
    );
  }

  updateEmployee(row: Employee): Observable<Employee> {
    return this.http.put<Employee>('/api/employees/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentEmployees();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) {
            list[i] = saved;
            break;
          }
        }
        this.employeesSubject.next(list);
      })
    );
  }

  deleteEmployee(id: number): Observable<{}> {
    return this.http.delete('/api/employees/' + id).pipe(
      tap(() => {
        const list = this.currentEmployees().filter(r => Number(r.id) !== Number(id));
        this.employeesSubject.next(list);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // CANDIDATES CRUD
  // ---------------------------------------------------------------------------
  addCandidate(body: Partial<Candidate>): Observable<Candidate> {
    return this.http.post<Candidate>('/api/candidates', body).pipe(
      tap((created) => {
        const next = this.currentCandidates();
        next.push(created);
        this.candidatesSubject.next(next);
      })
    );
  }

  updateCandidate(row: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>('/api/candidates/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentCandidates();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) {
            list[i] = saved;
            break;
          }
        }
        this.candidatesSubject.next(list);
      })
    );
  }

  deleteCandidate(id: number): Observable<{}> {
    return this.http.delete('/api/candidates/' + id).pipe(
      tap(() => {
        const list = this.currentCandidates().filter(r => Number(r.id) !== Number(id));
        this.candidatesSubject.next(list);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // COMPANIES CRUD
  // ---------------------------------------------------------------------------
  addCompany(body: Partial<Company>): Observable<Company> {
    return this.http.post<Company>('/api/companies', body).pipe(
      tap((created) => {
        const list = this.companiesSubject.getValue().slice();
        list.push(created);
        this.companiesSubject.next(list);
      })
    );
  }

  updateCompany(row: Company): Observable<Company> {
    return this.http.put<Company>('/api/companies/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.companiesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) {
            list[i] = saved;
            break;
          }
        }
        this.companiesSubject.next(list);
      })
    );
  }

  deleteCompany(id: number): Observable<{}> {
    return this.http.delete('/api/companies/' + id).pipe(
      tap(() => {
        const list = this.companiesSubject.getValue().filter(r => Number(r.id) !== Number(id));
        this.companiesSubject.next(list);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  private empty<T>(fallback: T) {
    return function () { return of(fallback); };
  }
}
