// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

/** Models */
export interface Department { id: number; name: string; }

export interface Candidate {
  id: number;
  name: string;
  email?: string;
  departmentId?: number;
  status: 'Applied' | 'Interview' | 'Hired' | 'Rejected';
}

export interface Company {
  id: number;
  name: string;
  location?: string;
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  departmentId?: number;
  hireDate?: string; // ISO yyyy-mm-dd
  role?: string;
}

/** Small helpers (no ?. / ?? used) */
function num(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function str(v: any): string {
  return v == null ? '' : String(v);
}
function normStatus(v: any): Candidate['status'] {
  const s = str(v).toLowerCase();
  if (s === 'hired') return 'Hired';
  if (s === 'interview') return 'Interview';
  if (s === 'rejected') return 'Rejected';
  return 'Applied';
}

@Injectable({ providedIn: 'root' })
export class HrDataService {
  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  private companiesSubject  = new BehaviorSubject<Company[]>([]);
  private employeesSubject  = new BehaviorSubject<Employee[]>([]);
  private departmentsSubject = new BehaviorSubject<Department[]>([]);

  candidates$  = this.candidatesSubject.asObservable();
  companies$   = this.companiesSubject.asObservable();
  employees$   = this.employeesSubject.asObservable();
  departments$ = this.departmentsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshAll().subscribe();
  }

  /** Initial load for all lists */
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

  // ------------------ CANDIDATES ------------------

  addCandidate(body: Partial<Candidate>): Observable<Candidate> {
    const clean: any = {
      name: str(body && (body as any).name),
      email: str(body && (body as any).email),
      departmentId: body && (body as any).departmentId != null ? num((body as any).departmentId) : undefined,
      status: normStatus(body && (body as any).status),
    };

    return this.http.post<any>('/api/candidates', clean).pipe(
      map((resp: any): Candidate => ({
        id: num(resp && resp.id),
        name: str(resp && resp.name),
        email: str(resp && resp.email),
        departmentId: resp && resp.departmentId != null ? num(resp.departmentId) : undefined,
        status: normStatus(resp && resp.status),
      })),
      tap((created) => {
        const list = this.candidatesSubject.getValue().slice();
        list.push(created);
        this.candidatesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  updateCandidate(row: Candidate): Observable<Candidate> {
    const id = num(row && row.id);
    if (!id) return throwError('Missing candidate id');

    const clean: any = {
      id: id,
      name: str(row && row.name),
      email: str(row && row.email),
      departmentId: row && (row as any).departmentId != null ? num((row as any).departmentId) : undefined,
      status: normStatus(row && row.status),
    };

    return this.http.put<any>(`/api/candidates/${id}`, clean).pipe(
      map((resp: any): Candidate => ({
        id: num(resp && resp.id ? resp.id : id),
        name: str(resp && resp.name ? resp.name : clean.name),
        email: str(resp && resp.email ? resp.email : clean.email),
        departmentId: (resp && resp.departmentId != null)
          ? num(resp.departmentId)
          : (clean.departmentId != null ? num(clean.departmentId) : undefined),
        status: normStatus(resp && resp.status ? resp.status : clean.status),
      })),
      tap((saved) => {
        const list = this.candidatesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (num(list[i].id) === num(saved.id)) { list[i] = saved; break; }
        }
        this.candidatesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  deleteCandidate(id: number): Observable<{}> {
    const nid = num(id);
    return this.http.delete(`/api/candidates/${nid}`).pipe(
      tap(() => {
        const list = this.candidatesSubject.getValue().filter(r => num(r.id) !== nid);
        this.candidatesSubject.next(list);
      })
    );
  }

  // ------------------ EMPLOYEES ------------------

  addEmployee(body: Partial<Employee>): Observable<Employee> {
    const clean: any = {
      name: str(body && (body as any).name),
      email: str(body && (body as any).email),
      departmentId: body && (body as any).departmentId != null ? num((body as any).departmentId) : undefined,
      hireDate: str(body && (body as any).hireDate),
      role: str(body && (body as any).role),
    };

    return this.http.post<any>('/api/employees', clean).pipe(
      map((resp: any): Employee => ({
        id: num(resp && resp.id),
        name: str(resp && resp.name),
        email: str(resp && resp.email),
        departmentId: resp && resp.departmentId != null ? num(resp.departmentId) : undefined,
        hireDate: str(resp && resp.hireDate),
        role: str(resp && resp.role),
      })),
      tap((created) => {
        const list = this.employeesSubject.getValue().slice();
        list.push(created);
        this.employeesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  updateEmployee(row: Employee): Observable<Employee> {
    const id = num(row && row.id);
    if (!id) return throwError('Missing employee id');

    const clean: any = {
      id: id,
      name: str(row && row.name),
      email: str(row && row.email),
      departmentId: row && (row as any).departmentId != null ? num((row as any).departmentId) : undefined,
      hireDate: str(row && row.hireDate),
      role: str(row && row.role),
    };

    return this.http.put<any>(`/api/employees/${id}`, clean).pipe(
      map((resp: any): Employee => ({
        id: num(resp && resp.id ? resp.id : id),
        name: str(resp && resp.name ? resp.name : clean.name),
        email: str(resp && resp.email ? resp.email : clean.email),
        departmentId: (resp && resp.departmentId != null)
          ? num(resp.departmentId)
          : (clean.departmentId != null ? num(clean.departmentId) : undefined),
        hireDate: str(resp && resp.hireDate ? resp.hireDate : clean.hireDate),
        role: str(resp && resp.role ? resp.role : clean.role),
      })),
      tap((saved) => {
        const list = this.employeesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (num(list[i].id) === num(saved.id)) { list[i] = saved; break; }
        }
        this.employeesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  deleteEmployee(id: number): Observable<{}> {
    const nid = num(id);
    return this.http.delete(`/api/employees/${nid}`).pipe(
      tap(() => {
        const list = this.employeesSubject.getValue().filter(r => num(r.id) !== nid);
        this.employeesSubject.next(list);
      })
    );
  }

  // ------------------ COMPANIES ------------------

  addCompany(body: Partial<Company>): Observable<Company> {
    const clean: any = {
      name: str(body && (body as any).name),
      location: str(body && (body as any).location),
    };

    return this.http.post<any>('/api/companies', clean).pipe(
      map((resp: any): Company => ({
        id: num(resp && resp.id),
        name: str(resp && resp.name),
        location: str(resp && resp.location),
      })),
      tap((created) => {
        const list = this.companiesSubject.getValue().slice();
        list.push(created);
        this.companiesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  updateCompany(row: Company): Observable<Company> {
    const id = num(row && row.id);
    if (!id) return throwError('Missing company id');

    const clean: any = {
      id: id,
      name: str(row && row.name),
      location: str(row && row.location),
    };

    return this.http.put<any>(`/api/companies/${id}`, clean).pipe(
      map((resp: any): Company => ({
        id: num(resp && resp.id ? resp.id : id),
        name: str(resp && resp.name ? resp.name : clean.name),
        location: str(resp && resp.location ? resp.location : clean.location),
      })),
      tap((saved) => {
        const list = this.companiesSubject.getValue().slice();
        for (let i = 0; i < list.length; i++) {
          if (num(list[i].id) === num(saved.id)) { list[i] = saved; break; }
        }
        this.companiesSubject.next(list);
      }),
      catchError((err) => throwError(err))
    );
  }

  deleteCompany(id: number): Observable<{}> {
    const nid = num(id);
    return this.http.delete(`/api/companies/${nid}`).pipe(
      tap(() => {
        const list = this.companiesSubject.getValue().filter(r => num(r.id) !== nid);
        this.companiesSubject.next(list);
      })
    );
  }

  // ------------------ helper ------------------
  private fallback<T>(value: T) {
    return function () { return of(value); };
  }
}
