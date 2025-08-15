import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type RouteKey = 'employees' | 'departments' | 'companies' | 'candidates';

interface Metric { count: number; delta: number; }
interface Stats {
  employees:   Metric;
  departments: Metric;
  companies:   Metric;
  candidates:  Metric;
}

interface Candidate {
  name: string;
  status: string;
  email?: string;
  department?: string;
}

const API = {
  employees:   '/api/employees',
  departments: '/api/departments',
  companies:   '/api/companies',
  candidates:  '/api/candidates'
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    

  stats: Stats = {
    employees:   { count: 0, delta: 0 },
    departments: { count: 0, delta: 0 },
    companies:   { count: 0, delta: 0 },
    candidates:  { count: 0, delta: 0 }

    
  };

  /** Bind your dashboard table to this: *ngFor="let c of recentCandidates" */
  recentCandidates: Candidate[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStatsAndCandidates();
  }

  /* ---------------- Fetch counts + candidate list ---------------- */

  private loadStatsAndCandidates(): void {
    forkJoin([
      this.http.get<any>(API.employees).pipe(catchError(_ => of([]))),
      this.http.get<any>(API.departments).pipe(catchError(_ => of([]))),
      this.http.get<any>(API.companies).pipe(catchError(_ => of([]))),
      this.http.get<any>(API.candidates).pipe(catchError(_ => of([])))
    ]).subscribe(([empsRaw, deptsRaw, compsRaw, candsRaw]) => {
      var emps  = this.asArray(empsRaw);
      var depts = this.asArray(deptsRaw);
      var comps = this.asArray(compsRaw);
      var cands = this.asArray(candsRaw);

      // counts
      this.stats.employees.count   = emps.length;
      this.stats.departments.count = depts.length;
      this.stats.companies.count   = comps.length;
      this.stats.candidates.count  = cands.length;

      // deltas (vs previous snapshot)
      var prev = this.readPrevSnapshot();
      this.stats.employees.delta   = this.delta(prev.employees,   this.stats.employees.count);
      this.stats.departments.delta = this.delta(prev.departments, this.stats.departments.count);
      this.stats.companies.delta   = this.delta(prev.companies,   this.stats.companies.count);
      this.stats.candidates.delta  = this.delta(prev.candidates,  this.stats.candidates.count);

      // candidate list for the dashboard table
      var normalized = this.normalizeCandidates(cands);
      // show top 5 (change the slice if you want more)
      this.recentCandidates = normalized.slice(0, 5);

      // save current snapshot
      this.writeSnapshot();
    }, _err => {
      // Fallback to localStorage if requests failed
      this.hydrateFromLocalStorage();
    });
  }

  // Accepts array or shapes like { data: [...] } or { items: [...] }
  private asArray(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (v && Array.isArray(v.data)) return v.data;
    if (v && Array.isArray(v.items)) return v.items;
    return [];
  }

  private normalizeCandidates(list: any[]): Candidate[] {
    var out: Candidate[] = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i] || {};

      var first = r.firstName ? String(r.firstName) : '';
      var last  = r.lastName  ? String(r.lastName)  : '';
      var partsName = (first + ' ' + last).trim();

      var name = '';
      if (r.name) name = String(r.name);
      else if (partsName) name = partsName;
      else if (r.fullName) name = String(r.fullName);
      else if (r.username) name = String(r.username);
      else name = '—';

      var status = 'Applied';
      if (r.status) status = String(r.status);
      else if (r.phase) status = String(r.phase);
      else if (r.stage) status = String(r.stage);
      else if (r.state) status = String(r.state);

      out.push({
        name: name,
        status: status,
        email: r.email || r.mail || r.contactEmail || '',
        department: r.department || r.team || ''
      });
    }
    return out;
  }

  /* ---------------- Navigation for clickable cards ---------------- */

  goTo(route: RouteKey): void {
    this.router.navigate(['/', route]).then(function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  goToSpace(event: KeyboardEvent, route: RouteKey): void {
    event.preventDefault();
    this.goTo(route);
  }

  /* ---------------- Inner buttons ---------------- */

  openAddEmployee(): void {
    this.router.navigate(['/employees'], { queryParams: { add: '1' } }).then(function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  openHire(): void {
    this.router.navigate(['/candidates'], { queryParams: { add: '1' } }).then(function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- Delta + snapshot helpers ---------------- */

  private delta(prevCount: number, currCount: number): number {
    var p = Number(prevCount);
    var c = Number(currCount);
    if (!isFinite(p) || p <= 0) return 0;
    return Math.round(((c - p) / p) * 100);
  }

  private readPrevSnapshot(): { employees: number; departments: number; companies: number; candidates: number } {
    try {
      var raw = localStorage.getItem('stats_prev');
      if (!raw) return { employees: 0, departments: 0, companies: 0, candidates: 0 };
      var obj = JSON.parse(raw);
      return {
        employees:   obj && obj.employees   && isFinite(obj.employees.count)   ? Number(obj.employees.count)   : 0,
        departments: obj && obj.departments && isFinite(obj.departments.count) ? Number(obj.departments.count) : 0,
        companies:   obj && obj.companies   && isFinite(obj.companies.count)   ? Number(obj.companies.count)   : 0,
        candidates:  obj && obj.candidates  && isFinite(obj.candidates.count)  ? Number(obj.candidates.count)  : 0
      };
    } catch (_e) {
      return { employees: 0, departments: 0, companies: 0, candidates: 0 };
    }
  }

  private writeSnapshot(): void {
    try {
      localStorage.setItem('stats_prev', JSON.stringify({
        employees:   { count: this.stats.employees.count },
        departments: { count: this.stats.departments.count },
        companies:   { count: this.stats.companies.count },
        candidates:  { count: this.stats.candidates.count }
      }));
    } catch (_e) { /* ignore quota */ }
  }

  private hydrateFromLocalStorage(): void {
    var employees   = this.safeParseArray(localStorage.getItem('employees'));
    var departments = this.safeParseArray(localStorage.getItem('departments'));
    var companies   = this.safeParseArray(localStorage.getItem('companies'));
    var candidates  = this.safeParseArray(localStorage.getItem('candidates'));

    this.stats.employees.count   = employees.length;
    this.stats.departments.count = departments.length;
    this.stats.companies.count   = companies.length;
    this.stats.candidates.count  = candidates.length;

    var prev = this.readPrevSnapshot();
    this.stats.employees.delta   = this.delta(prev.employees,   this.stats.employees.count);
    this.stats.departments.delta = this.delta(prev.departments, this.stats.departments.count);
    this.stats.companies.delta   = this.delta(prev.companies,   this.stats.companies.count);
    this.stats.candidates.delta  = this.delta(prev.candidates,  this.stats.candidates.count);

    this.recentCandidates = this.normalizeCandidates(candidates).slice(0, 5);

    this.writeSnapshot();
  }

  private safeParseArray(raw: string | null): any[] {
    if (!raw) return [];
    try {
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (_e) { return []; }
  }
}
