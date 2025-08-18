// src/app/shared/hr-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/* ------------ Domain models ------------ */
export interface Department { id: number; name: string; companyId?: number; }
export interface Employee   { id: number; name: string; email?: string; hireDate?: string; role?: string; departmentId?: number; }
export interface Candidate  { id: number; name: string; email?: string; status: 'Applied'|'Interview'|'Hired'|'Rejected'; departmentId?: number; }
export interface Company    { id: number; name: string; location?: string; }
export interface Salary     { id: number; employeeId: number; amount: number; currency: string; effectiveDate: string; }

@Injectable({ providedIn: 'root' })
export class HrDataService {
  private departmentsSubject = new BehaviorSubject<Department[]>([]);
  private employeesSubject   = new BehaviorSubject<Employee[]>([]);
  private candidatesSubject  = new BehaviorSubject<Candidate[]>([]);
  private companiesSubject   = new BehaviorSubject<Company[]>([]);
  private salariesSubject    = new BehaviorSubject<Salary[]>([]);

  departments$ = this.departmentsSubject.asObservable();
  employees$   = this.employeesSubject.asObservable();
  candidates$  = this.candidatesSubject.asObservable();
  companies$   = this.companiesSubject.asObservable();
  salaries$    = this.salariesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshAll().subscribe();
  }

  /* ------------ Bootstrap all collections (RxJS 6 safe) ------------ */
  refreshAll(): Observable<any> {
    const dReq  = this.http.get<Department[]>('/api/departments').pipe(catchError(this.empty<Department[]>([])));
    const eReq  = this.http.get<Employee[]>  ('/api/employees')  .pipe(catchError(this.empty<Employee[]>([])));
    const cReq  = this.http.get<Candidate[]> ('/api/candidates') .pipe(catchError(this.empty<Candidate[]>([])));
    const coReq = this.http.get<Company[]>   ('/api/companies')  .pipe(catchError(this.empty<Company[]>([])));
    const sReq  = this.http.get<Salary[]>    ('/api/salaries')   .pipe(catchError(this.empty<Salary[]>([])));

    return forkJoin([dReq, eReq, cReq, coReq, sReq]).pipe(
      tap((res: any[]) => {
        const depts = res[0] || [];
        const emps  = res[1] || [];
        const cnds  = res[2] || [];
        const cmps  = res[3] || [];
        const sals  = res[4] || [];
        this.departmentsSubject.next(depts);
        this.employeesSubject.next(emps);
        this.candidatesSubject.next(cnds);
        this.companiesSubject.next(cmps);
        this.salariesSubject.next(sals);
      })
    );
  }

  /* ------------ Snapshots ------------ */
  currentDepartments() { const v = this.departmentsSubject.getValue(); return v ? v.slice() : []; }
  currentEmployees()   { const v = this.employeesSubject.getValue();   return v ? v.slice() : []; }
  currentCandidates()  { const v = this.candidatesSubject.getValue();  return v ? v.slice() : []; }
  currentSalaries()    { const v = this.salariesSubject.getValue();    return v ? v.slice() : []; }
  currentCompanies()   { const v = this.companiesSubject.getValue();   return v ? v.slice() : []; }

  /* ------------ Departments ------------ */
  addDepartment(body: Partial<Department>): Observable<Department> {
    return this.http.post<Department>('/api/departments', body).pipe(
      tap((created) => { const list = this.currentDepartments(); list.push(created); this.departmentsSubject.next(list); })
    );
  }
  updateDepartment(row: Department): Observable<Department> {
    return this.http.put<Department>('/api/departments/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentDepartments();
        for (let i = 0; i < list.length; i++) if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        this.departmentsSubject.next(list);
      })
    );
  }
  deleteDepartment(id: number): Observable<{}> {
    return this.http.delete('/api/departments/' + id).pipe(
      tap(() => { const list = this.currentDepartments().filter((d) => Number(d.id) !== Number(id)); this.departmentsSubject.next(list); })
    );
  }

  /* ------------ Employees ------------ */
  addEmployee(body: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>('/api/employees', body).pipe(
      tap((created) => { const list = this.currentEmployees(); list.push(created); this.employeesSubject.next(list); })
    );
  }
  updateEmployee(row: Employee): Observable<Employee> {
    return this.http.put<Employee>('/api/employees/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentEmployees();
        for (let i = 0; i < list.length; i++) if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        this.employeesSubject.next(list);
      })
    );
  }
  deleteEmployee(id: number): Observable<{}> {
    return this.http.delete('/api/employees/' + id).pipe(
      tap(() => { const list = this.currentEmployees().filter((r) => Number(r.id) !== Number(id)); this.employeesSubject.next(list); })
    );
  }

  /* ------------ Candidates (with status effects) ------------ */
  addCandidate(body: Partial<Candidate>): Observable<Candidate> {
    return this.http.post<Candidate>('/api/candidates', body).pipe(
      tap((created) => { const list = this.currentCandidates(); list.push(created); this.candidatesSubject.next(list); })
    );
  }

  /**
   * Update candidate AND apply the rules:
   *  - Hired    => add to Employees + remove from Candidates
   *  - Rejected => remove from Candidates
   *  - Applied/Interview => just update in Candidates
   */
  updateCandidate(row: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>('/api/candidates/' + row.id, row).pipe(
      tap((saved) => {
        // Update local candidates list first
        const list = this.currentCandidates();
        let idx = -1;
        for (let i = 0; i < list.length; i++) if (Number(list[i].id) === Number(saved.id)) { idx = i; break; }
        if (idx >= 0) list[idx] = saved; else list.push(saved);
        this.candidatesSubject.next(list);

        const status = saved && saved.status ? String(saved.status).toLowerCase() : 'applied';

        if (status === 'hired') {
          // 1) create an Employee from this candidate
          const payload: Partial<Employee> = {
            name: saved && saved.name ? String(saved.name) : 'New Hire',
            email: saved && saved.email ? String(saved.email) : '',
            role: '—',
            hireDate: this.todayISO(),
            departmentId: saved && saved.departmentId ? Number(saved.departmentId) : undefined
          };

          this.http.post<Employee>('/api/employees', payload)
            .pipe(
              tap((emp) => {
                const emps = this.currentEmployees();
                emps.push(emp);
                this.employeesSubject.next(emps);
              }),
              catchError(this.empty<Employee | null>(null))
            )
            .subscribe();

          // 2) remove candidate
          this.http.delete('/api/candidates/' + saved.id)
            .pipe(
              tap(() => {
                const after = this.currentCandidates().filter((c) => Number(c.id) !== Number(saved.id));
                this.candidatesSubject.next(after);
              }),
              catchError(this.empty<{}>({}))
            )
            .subscribe();
        } else if (status === 'rejected') {
          // remove candidate only
          this.http.delete('/api/candidates/' + saved.id)
            .pipe(
              tap(() => {
                const after = this.currentCandidates().filter((c) => Number(c.id) !== Number(saved.id));
                this.candidatesSubject.next(after);
              }),
              catchError(this.empty<{}>({}))
            )
            .subscribe();
        }
        // else: applied/interview => keep as updated candidate
      })
    );
  }

  deleteCandidate(id: number): Observable<{}> {
    return this.http.delete('/api/candidates/' + id).pipe(
      tap(() => {
        const list = this.currentCandidates().filter((r) => Number(r.id) !== Number(id));
        this.candidatesSubject.next(list);
      })
    );
  }

  /* ------------ Companies ------------ */
  addCompany(body: Partial<Company>): Observable<Company> {
    return this.http.post<Company>('/api/companies', body).pipe(
      tap((created) => { const list = this.currentCompanies(); list.push(created); this.companiesSubject.next(list); })
    );
  }
  updateCompany(row: Company): Observable<Company> {
    return this.http.put<Company>('/api/companies/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentCompanies();
        for (let i = 0; i < list.length; i++) if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        this.companiesSubject.next(list);
      })
    );
  }
  deleteCompany(id: number): Observable<{}> {
    return this.http.delete('/api/companies/' + id).pipe(
      tap(() => { const list = this.currentCompanies().filter((r) => Number(r.id) !== Number(id)); this.companiesSubject.next(list); })
    );
  }

  /* ------------ Salaries ------------ */
  addSalary(body: Partial<Salary>): Observable<Salary> {
    return this.http.post<Salary>('/api/salaries', body).pipe(
      tap((created) => { const list = this.currentSalaries(); list.push(created); this.salariesSubject.next(list); })
    );
  }
  updateSalary(row: Salary): Observable<Salary> {
    return this.http.put<Salary>('/api/salaries/' + row.id, row).pipe(
      tap((saved) => {
        const list = this.currentSalaries();
        for (let i = 0; i < list.length; i++) if (Number(list[i].id) === Number(saved.id)) { list[i] = saved; break; }
        this.salariesSubject.next(list);
      })
    );
  }
  deleteSalary(id: number): Observable<{}> {
    return this.http.delete('/api/salaries/' + id).pipe(
      tap(() => { const list = this.currentSalaries().filter((s) => Number(s.id) !== Number(id)); this.salariesSubject.next(list); })
    );
  }

  /* ------------ Helpers ------------ */
  private todayISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    let m: any = d.getMonth() + 1; m = m < 10 ? '0' + m : '' + m;
    let day: any = d.getDate();     day = day < 10 ? '0' + day : '' + day;
    return y + '-' + m + '-' + day;
  }

  private empty<T>(fallback: T) {
    return function () { return of(fallback); };
  }
}
