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

/** Your base candidate shape + a few optional fields we need for scheduling */
interface Candidate {
  id?: number;
  name: string;
  status: string;
  email?: string;
  department?: string;
  departmentId?: number;
  /** ISO date string we save when user schedules */
  interviewDate?: string;
}

interface UpcomingRow {
  id: number;
  displayName: string;
  email?: string;
  department?: string;
  when?: string;          // ISO string (if scheduled)
  raw: any;               // original record we will PUT back with interviewDate
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

  // ---------- existing stats ----------
  stats: Stats = {
    employees:   { count: 0, delta: 0 },
    departments: { count: 0, delta: 0 },
    companies:   { count: 0, delta: 0 },
    candidates:  { count: 0, delta: 0 }
  };

  /** your table on the left */
  recentCandidates: Candidate[] = [];

  /** NEW: rows for Upcoming Interviews (right card) */
  upcoming: UpcomingRow[] = [];

  /** NEW: scheduling modal state */
  scheduleModalOpen = false;
  scheduleTarget: UpcomingRow | null = null;
  scheduleDate = ''; // bound to <input type="datetime-local">

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
      const emps  = this.asArray(empsRaw);
      const depts = this.asArray(deptsRaw);
      const comps = this.asArray(compsRaw);
      const cands = this.asArray(candsRaw);

      // counts
      this.stats.employees.count   = emps.length;
      this.stats.departments.count = depts.length;
      this.stats.companies.count   = comps.length;
      this.stats.candidates.count  = cands.length;

      // deltas (vs previous snapshot)
      const prev = this.readPrevSnapshot();
      this.stats.employees.delta   = this.delta(prev.employees,   this.stats.employees.count);
      this.stats.departments.delta = this.delta(prev.departments, this.stats.departments.count);
      this.stats.companies.delta   = this.delta(prev.companies,   this.stats.companies.count);
      this.stats.candidates.delta  = this.delta(prev.candidates,  this.stats.candidates.count);

      // candidate list for the dashboard table (left)
      const normalized = this.normalizeCandidates(cands);
      this.recentCandidates = normalized.slice(0, 5);

      // NEW: compute upcoming (right)
      this.buildUpcoming(cands);

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
    const out: Candidate[] = [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i] || {};

      const first = r.firstName ? String(r.firstName) : '';
      const last  = r.lastName  ? String(r.lastName)  : '';
      const partsName = (first + ' ' + last).trim();

      let name = '';
      if (r.name) name = String(r.name);
      else if (partsName) name = partsName;
      else if (r.fullName) name = String(r.fullName);
      else if (r.username) name = String(r.username);
      else name = '—';

      let status = 'Applied';
      if (r.status) status = String(r.status);
      else if (r.phase) status = String(r.phase);
      else if (r.stage) status = String(r.stage);
      else if (r.state) status = String(r.state);

      out.push({
        id: isFinite(Number(r.id)) ? Number(r.id) : undefined,
        name,
        status,
        email: r.email || r.mail || r.contactEmail || '',
        department: r.department || r.team || '',
        departmentId: isFinite(Number(r.departmentId)) ? Number(r.departmentId) : undefined,
        interviewDate: r.interviewDate
      });
    }
    return out;
  }

  /** NEW: build upcoming interviews list from raw candidates */
  private buildUpcoming(candsRaw: any[]): void {
    const rows: UpcomingRow[] = [];
    for (let i = 0; i < (candsRaw || []).length; i++) {
      const r = candsRaw[i] || {};
      const status = String(r.status || r.phase || r.stage || r.state || '').toLowerCase();
      if (status !== 'interview') continue;

      const displayName = this.bestName(r);
      rows.push({
        id: Number(r.id),
        displayName,
        email: r.email || r.mail || r.contactEmail || '',
        department: r.department || r.team || '',
        when: r.interviewDate, // may be undefined if not scheduled
        raw: r
      });
    }
    // sort by soonest if there is a date
    rows.sort((a, b) => {
      const ta = a.when ? new Date(a.when).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.when ? new Date(b.when).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
    this.upcoming = rows;
  }

  private bestName(r: any): string {
    const safe = (x: any) => (x == null ? '' : String(x));
    const name = safe(r.name).trim();
    if (name) return name;

    const first = safe(r.firstName).trim();
    const last = safe(r.lastName).trim();
    const full = (first + ' ' + last).trim();
    if (full) return full;

    const fn = safe(r.fullName).trim();
    if (fn) return fn;

    const user = safe(r.username).trim();
    if (user) return user;

    const email = safe(r.email || r.mail || r.contactEmail).trim();
    if (email) {
      const part = (email.split('@')[0] || '')
        .split(/[._-]/g)
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return part || email;
    }
    return '—';
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

  /* ---------------- Upcoming: actions ---------------- */

  /** From list row */
  schedule(row: UpcomingRow): void {
    this.scheduleTarget = row;
    this.scheduleDate = row.when ? this.toLocalInputValue(row.when) : '';
    this.scheduleModalOpen = true;
  }

  /** Footer CTA: open empty modal (no candidate selected) */
  openSchedule(): void {
    this.scheduleTarget = null;
    this.scheduleDate = '';
    this.scheduleModalOpen = true;
  }

  email(row: UpcomingRow): void {
    const to = row.email || '';
    const sub = encodeURIComponent('Interview schedule');
    const body = encodeURIComponent(
      `Hi ${row.displayName},\n\nLet's schedule your interview.${row.when ? `\nCurrent time: ${new Date(row.when).toLocaleString()}` : ''}\n\nThanks!`
    );
    window.location.href = `mailto:${to}?subject=${sub}&body=${body}`;
  }

  closeScheduleModal(): void {
    this.scheduleModalOpen = false;
    this.scheduleTarget = null;
    this.scheduleDate = '';
  }

  saveScheduleModal(): void {
    if (!this.scheduleTarget || !this.scheduleDate) return;
    const iso = new Date(this.scheduleDate).toISOString();

    // merge and PUT back to the in-memory API
    const updated = { ...(this.scheduleTarget.raw || {}), interviewDate: iso };

    this.http.put(`${API.candidates}/${this.scheduleTarget.id}`, updated)
      .pipe(catchError(_ => of(null)))
      .subscribe((_ok) => {
        // refresh and close
        this.loadStatsAndCandidates();
        this.closeScheduleModal();
      }, _err => {
        alert('Could not save schedule. Please try again.');
        this.closeScheduleModal();
      });
  }

  // helper for datetime-local value
  private toLocalInputValue(dateLike: any): string {
    const d = new Date(dateLike);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${mm}`;
  }

  /* ---------------- Delta + snapshot helpers ---------------- */

  private delta(prevCount: number, currCount: number): number {
    const p = Number(prevCount);
    const c = Number(currCount);
    if (!isFinite(p) || p <= 0) return 0;
    return Math.round(((c - p) / p) * 100);
  }

  private readPrevSnapshot(): { employees: number; departments: number; companies: number; candidates: number } {
    try {
      const raw = localStorage.getItem('stats_prev');
      if (!raw) return { employees: 0, departments: 0, companies: 0, candidates: 0 };
      const obj = JSON.parse(raw);
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
    const employees   = this.safeParseArray(localStorage.getItem('employees'));
    const departments = this.safeParseArray(localStorage.getItem('departments'));
    const companies   = this.safeParseArray(localStorage.getItem('companies'));
    const candidates  = this.safeParseArray(localStorage.getItem('candidates'));

    this.stats.employees.count   = employees.length;
    this.stats.departments.count = departments.length;
    this.stats.companies.count   = companies.length;
    this.stats.candidates.count  = candidates.length;

    const prev = this.readPrevSnapshot();
    this.stats.employees.delta   = this.delta(prev.employees,   this.stats.employees.count);
    this.stats.departments.delta = this.delta(prev.departments, this.stats.departments.count);
    this.stats.companies.delta   = this.delta(prev.companies,   this.stats.companies.count);
    this.stats.candidates.delta  = this.delta(prev.candidates,  this.stats.candidates.count);

    this.recentCandidates = this.normalizeCandidates(candidates).slice(0, 5);

    // NEW: build upcoming from the locally-cached array too
    this.buildUpcoming(candidates);

    this.writeSnapshot();
  }

  private safeParseArray(raw: string | null): any[] {
    if (!raw) return [];
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (_e) { return []; }
  }
}
