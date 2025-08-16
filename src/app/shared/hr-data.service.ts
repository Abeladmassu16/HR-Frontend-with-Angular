// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Candidate {
  id: number;
  name: string;
  email: string;
  status: 'Applied' | 'Interview' | 'Hired' | 'Rejected';
}
export interface Company {
  id: number;
  name: string;
  location: string;
}
export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string;  // ISO yyyy-mm-dd
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class HrDataService {
  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  private companiesSubject  = new BehaviorSubject<Company[]>([]);
  private employeesSubject  = new BehaviorSubject<Employee[]>([]);

  candidates$ = this.candidatesSubject.asObservable();
  companies$  = this.companiesSubject.asObservable();
  employees$  = this.employeesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshAll().subscribe(); // initial load
  }

  /** Load all collections from the in-memory API (RxJS 6.4-safe forkJoin) */
  refreshAll(): Observable<any> {
    const cReq  = this.http.get<Candidate[]>('/api/candidates').pipe(catchError(this.empty<Candidate[]>([])));
    const coReq = this.http.get<Company[]>('/api/companies').pipe(catchError(this.empty<Company[]>([])));
    const eReq  = this.http.get<Employee[]>('/api/employees').pipe(catchError(this.empty<Employee[]>([])));

    return forkJoin([cReq, coReq, eReq]).pipe(
      tap((res) => {
        const candidates = res[0] || [];
        const companies  = res[1] || [];
        const employees  = res[2] || [];
        this.candidatesSubject.next(candidates);
        this.companiesSubject.next(companies);
        this.employeesSubject.next(employees);
      })
    );
  }

  // ---------- CANDIDATES CRUD ----------
  addCandidate(body: Partial<Candidate>): Observable<Candidate> {
    return this.http.post<Candidate>('/api/candidates', body).pipe(
      tap((created) => {
        const next = this.candidatesSubject.getValue().slice();
        next.push(created);
        this.candidatesSubject.next(next);
      }),
      tap((created) => this.handleCandidateSideEffects(created))
    );
  }

  updateCandidate(row: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`/api/candidates/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.candidatesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.candidatesSubject.next(list);
      }),
      tap((saved) => this.handleCandidateSideEffects(saved))
    );
  }

  deleteCandidate(id: number): Observable<{}> {
    return this.http.delete(`/api/candidates/${id}`).pipe(
      tap(() => {
        const list = this.candidatesSubject.getValue().filter(r => Number(r.id) !== Number(id));
        this.candidatesSubject.next(list);
      })
    );
  }

  // ---------- COMPANIES CRUD ----------
  addCompany(body: Partial<Company>): Observable<Company> {
    return this.http.post<Company>('/api/companies', body).pipe(
      tap((created) => {
        const next = this.companiesSubject.getValue().slice();
        next.push(created);
        this.companiesSubject.next(next);
      })
    );
  }

  updateCompany(row: Company): Observable<Company> {
    return this.http.put<Company>(`/api/companies/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.companiesSubject.getValue().slice();
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
        const list = this.companiesSubject.getValue().filter(r => Number(r.id) !== Number(id));
        this.companiesSubject.next(list);
      })
    );
  }

  // ---------- EMPLOYEES CRUD ----------
  addEmployee(body: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>('/api/employees', body).pipe(
      tap((created) => {
        const next = this.employeesSubject.getValue().slice();
        next.push(created);
        this.employeesSubject.next(next);
      })
    );
  }

  updateEmployee(row: Employee): Observable<Employee> {
    return this.http.put<Employee>(`/api/employees/${row.id}`, row).pipe(
      tap((saved) => {
        const list = this.employeesSubject.getValue().slice();
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
        const list = this.employeesSubject.getValue().filter(r => Number(r.id) !== Number(id));
        this.employeesSubject.next(list);
      })
    );
  }

  // ---------- helpers ----------
  private empty<T>(fallback: T) {
    return function () { return of(fallback); };
  }

  /** Side effects when candidate status changes:
   *  - Hired: ensure an Employee exists (by email)
   *  - Rejected: remove from candidates
   */
  private handleCandidateSideEffects(cand: Candidate): void {
    const status = (cand && cand.status) ? ('' + cand.status).toLowerCase() : '';
    if (status === 'hired') {
      const email = this.normalizeEmail(cand.email);
      const employees = this.employeesSubject.getValue();
      const exists = employees.some(e => this.normalizeEmail(e && e.email || '') === email);

      if (!exists) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = (today.getMonth() + 1).toString().padStart(2, '0');
        const dd = today.getDate().toString().padStart(2, '0');

        const newEmp: Partial<Employee> = {
          name: cand.name,
          email: cand.email,
          hireDate: `${yyyy}-${mm}-${dd}`,
          role: 'New Hire'
        };
        // Fire-and-forget is fine; the subject updates on success.
        this.addEmployee(newEmp).subscribe();
      }
    } else if (status === 'rejected') {
      // Remove candidate from list (and backend)
      this.deleteCandidate(Number(cand.id)).subscribe();
    }
  }

  private normalizeEmail(s: string): string {
    return (s || '').trim().toLowerCase();
  }
}
