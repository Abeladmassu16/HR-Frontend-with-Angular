// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';

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
  hireDate?: string; // ISO yyyy-mm-dd
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
    this.refreshAll().subscribe();
  }

  /** Initial load of all three collections */
  refreshAll(): Observable<any> {
    const cReq  = this.http.get<Candidate[]>('/api/candidates').pipe(catchError(this.empty<Candidate[]>([])));
    const coReq = this.http.get<Company[]>('/api/companies').pipe(catchError(this.empty<Company[]>([])));
    const eReq  = this.http.get<Employee[]>('/api/employees').pipe(catchError(this.empty<Employee[]>([])));

    return forkJoin([cReq, coReq, eReq]).pipe(
      tap((res) => {
        this.candidatesSubject.next(res[0] || []);
        this.companiesSubject.next(res[1] || []);
        this.employeesSubject.next(res[2] || []);
      })
    );
  }

  /** Save candidate AND apply rules, then refresh candidates+employees so UI is consistent */
  saveCandidateWithRules(cand: Candidate): Observable<void> {
    const cleaned: Candidate = {
      id: Number(cand && cand.id ? cand.id : 0),
      name: (cand && cand.name ? ('' + cand.name).trim() : ''),
      email: (cand && cand.email ? ('' + cand.email).trim() : ''),
      status: (cand && cand.status ? (cand.status as any) : 'Applied')
    };

    const save$ = cleaned.id
      ? this.http.put<Candidate>('/api/candidates/' + cleaned.id, cleaned)
      : this.http.post<Candidate>('/api/candidates', cleaned);

    return save$.pipe(
      switchMap((saved: Candidate) => this.applyCandidateRules(saved)),
      switchMap(() => this.refreshCandidatesAndEmployees()),
      map(() => undefined)
    );
  }

  // ---------- (Optional) Direct CRUD (still available if you need them elsewhere) ----------
  addCandidate(body: Partial<Candidate>) { return this.http.post<Candidate>('/api/candidates', body); }
  updateCandidate(row: Candidate) { return this.http.put<Candidate>('/api/candidates/' + row.id, row); }
  deleteCandidate(id: number) { return this.http.delete('/api/candidates/' + id); }

  addCompany(body: Partial<Company>) {
    return this.http.post<Company>('/api/companies', body).pipe(
      tap((created) => this.companiesSubject.next(this.companiesSubject.getValue().concat([created])))
    );
  }
  updateCompany(row: Company) {
    return this.http.put<Company>('/api/companies/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.companiesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.companiesSubject.next(list);
      })
    );
  }
  deleteCompany(id: number) {
    return this.http.delete('/api/companies/' + id).pipe(
      tap(() => {
        this.companiesSubject.next(
          this.companiesSubject.getValue().filter(function (r) { return Number(r.id) !== Number(id); })
        );
      })
    );
  }

  addEmployee(body: Partial<Employee>) {
    return this.http.post<Employee>('/api/employees', body).pipe(
      tap((created) => this.employeesSubject.next(this.employeesSubject.getValue().concat([created])))
    );
  }
  updateEmployee(row: Employee) {
    return this.http.put<Employee>('/api/employees/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.employeesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        }
        this.employeesSubject.next(list);
      })
    );
  }
  deleteEmployee(id: number) {
    return this.http.delete('/api/employees/' + id).pipe(
      tap(() => {
        this.employeesSubject.next(
          this.employeesSubject.getValue().filter(function (r) { return Number(r.id) !== Number(id); })
        );
      })
    );
  }

  // ---------- Internals ----------
  private empty<T>(fallback: T) {
    return function () { return of(fallback); };
  }

  /** Apply your rules deterministically (sequential HTTP), then return Observable<void>. */
  private applyCandidateRules(cand: Candidate): Observable<void> {
    if (!cand) { return of(undefined); }

    var status = (cand.status ? ('' + cand.status) : '').trim().toLowerCase();
    var emailN = this.normalizeEmail(cand.email);

    // Applied / Interview → keep in candidate table
    if (status === 'applied' || status === 'interview') {
      return of(undefined);
    }

    // Hired → add to employees (avoid dup by email if present) → remove from candidates
    if (status === 'hired') {
      const employees = this.employeesSubject.getValue() || [];
      var exists = false;
      if (emailN !== '') {
        for (let i = 0; i < employees.length; i++) {
          var e = employees[i];
          if (this.normalizeEmail(e && e.email ? e.email : '') === emailN) { exists = true; break; }
        }
      }

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = (today.getMonth() + 1).toString().padStart(2, '0');
      const dd = today.getDate().toString().padStart(2, '0');

      // If no email or not existing → still add; if exists by email → skip add, just delete candidate
      const addEmp$ = exists ? of(null) : this.http.post<Employee>('/api/employees', {
        name: cand.name,
        email: cand.email,
        hireDate: yyyy + '-' + mm + '-' + dd,
        role: 'New Hire'
      });

      return addEmp$.pipe(
        switchMap(() => this.http.delete('/api/candidates/' + cand.id)),
        map(() => undefined)
      );
    }

    // Rejected → remove from candidates and any employees with same email
    if (status === 'rejected') {
      const employees = this.employeesSubject.getValue() || [];
      const matches = [];
      if (emailN !== '') {
        for (let i = 0; i < employees.length; i++) {
          var e = employees[i];
          if (this.normalizeEmail(e && e.email ? e.email : '') === emailN) {
            matches.push(Number(e.id));
          }
        }
      }

      return this.http.delete('/api/candidates/' + cand.id).pipe(
        switchMap(() => {
          if (matches.length === 0) { return of(null); }
          const dels = [];
          for (let i = 0; i < matches.length; i++) {
            dels.push(this.http.delete('/api/employees/' + matches[i]));
          }
          return forkJoin(dels);
        }),
        map(() => undefined)
      );
    }

    return of(undefined);
  }

  /** Refresh candidates + employees and push to subjects */
  private refreshCandidatesAndEmployees(): Observable<void> {
    const cReq = this.http.get<Candidate[]>('/api/candidates').pipe(catchError(this.empty<Candidate[]>([])));
    const eReq = this.http.get<Employee[]>('/api/employees').pipe(catchError(this.empty<Employee[]>([])));
    return forkJoin([cReq, eReq]).pipe(
      tap((res) => {
        this.candidatesSubject.next(res[0] || []);
        this.employeesSubject.next(res[1] || []);
      }),
      map(() => undefined)
    );
  }

  private normalizeEmail(s: string): string {
    return (s || '').trim().toLowerCase();
  }
}
