import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type RouteKey = 'employees' | 'departments' | 'companies' | 'candidates' | 'salaries';

interface Metric { count: number; delta: number; }
interface Stats {
  employees:   Metric;
  departments: Metric;
  companies:   Metric;
  candidates:  Metric;
}

interface CandidateItem {
  name: string;
  status: string;
  email?: string;
  department?: string;
}

interface InterviewItem {
  candidate: string;
  when?: string;   // ISO string
  email?: string;
}

interface SalaryItem {
  id: number;
  employeeId: number;
  amount: number;
  currency: string;
  effectiveDate: string;
}

const API = {
  employees:   '/api/employees',
  departments: '/api/departments',
  companies:   '/api/companies',
  candidates:  '/api/candidates',
  salaries:    '/api/salaries'
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // ---- Theme toggle (kept) ----
  theme: 'mint' | 'white' = 'mint';
  onToggleChange(e: any) {
    this.theme = e && e.target && e.target.checked ? 'mint' : 'white';
  }

  // ---- Stats tiles ----
  stats: Stats = {
    employees:   { count: 0, delta: 0 },
    departments: { count: 0, delta: 0 },
    companies:   { count: 0, delta: 0 },
    candidates:  { count: 0, delta: 0 }
  };

  // NEW: Payroll KPI
  payrollTotal = 0;
  payrollRecs  = 0;
  payrollCurrency = 'USD';

  // Recent candidates table
  recentCandidates: CandidateItem[] = [];

  // Upcoming interviews panel
  upcoming: InterviewItem[] = [];

  // ---- Schedule modal state (kept) ----
  scheduleModalOpen = false;
  scheduleEditingIndex: number | null = null;
  scheduleForm: { candidate: string; when: string } = { candidate: '', when: '' };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStatsAndCandidates();
  }

  // ================================================================
  // Fetch counts + candidate list + salaries (NEW)
  // ================================================================
  private loadStatsAndCandidates(): void {
    forkJoin([
      this.http.get<any>(API.employees).pipe(catchError(() => of([]))),
      this.http.get<any>(API.departments).pipe(catchError(() => of([]))),
      this.http.get<any>(API.companies).pipe(catchError(() => of([]))),
      this.http.get<any>(API.candidates).pipe(catchError(() => of([]))),
      this.http.get<any>(API.salaries).pipe(catchError(() => of([])))
    ]).subscribe(
      (res: any[]) => {
        const emps  = this.asArray(res[0]);
        const depts = this.asArray(res[1]);
        const comps = this.asArray(res[2]);
        const cands = this.asArray(res[3]);
        const sals  = this.asArray(res[4]) as SalaryItem[];

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

        // candidate list for the dashboard table
        const normalized = this.normalizeCandidates(cands);
        this.recentCandidates = normalized.slice(0, 5);

        // Build upcoming list from Interview candidates + saved times
        this.buildUpcomingFromCandidates(normalized);

        // NEW: payroll KPI
        this.payrollRecs  = sals.length;
        this.payrollTotal = sals.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        if (sals.length && sals[0].currency) {
          this.payrollCurrency = String(sals[0].currency);
        }

        // save current snapshot
        this.writeSnapshot();
      },
      _err => {
        // Fallback to localStorage if requests failed
        this.hydrateFromLocalStorage();
      }
    );
  }

  // Accepts array or shapes like { data: [...] } or { items: [...] }
  private asArray(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (v && Array.isArray(v.data)) return v.data;
    if (v && Array.isArray(v.items)) return v.items;
    return [];
  }

  private normalizeCandidates(list: any[]): CandidateItem[] {
    const out: CandidateItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const r: any = list[i] || {};

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
        name,
        status,
        email: r.email || r.mail || r.contactEmail || '',
        department: r.department || r.team || ''
      });
    }
    return out;
  }

  // ================================================================
  // Build Upcoming Interviews from Interview candidates + LS
  // ================================================================
  private buildUpcomingFromCandidates(cands: CandidateItem[]): void {
    const stored = this.loadInterviewsLS();          // InterviewItem[]
    const items: InterviewItem[] = [];

    for (let i = 0; i < cands.length; i++) {
      const c: CandidateItem = cands[i];

      const status = (c && c.status ? String(c.status) : '').toLowerCase();
      if (status === 'interview') {
        const match = stored.find(s => s.candidate === (c.name || ''));
        const when = match ? (match.when || '') : '';
        items.push({ candidate: c.name || '—', when, email: c.email || '' });
      }
    }

    this.upcoming = items;
  }

  private loadInterviewsLS(): InterviewItem[] {
    try {
      const raw = localStorage.getItem('interviews');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_e) { return []; }
  }
  private saveInterviewsLS(list: InterviewItem[]): void {
    try { localStorage.setItem('interviews', JSON.stringify(list)); } catch (_e) {}
  }

  // ================================================================
  // Navigation helpers for KPI tiles
  // ================================================================
  goTo(route: RouteKey): void {
    this.router.navigate(['/', route]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  goToSpace(event: KeyboardEvent, route: RouteKey): void {
    event.preventDefault();
    this.goTo(route);
  }

  // Optional CTAs used in your tiles (kept)
  openAddEmployee(): void {
    this.router.navigate(['/employees'], { queryParams: { add: '1' } }).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  openHire(): void {
    this.router.navigate(['/candidates'], { queryParams: { add: '1' } }).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ================================================================
  // Schedule modal actions (kept)
  // ================================================================
  openScheduleFor(item: InterviewItem, index: number): void {
    this.scheduleEditingIndex = index;
    this.scheduleForm.candidate = item && item.candidate ? item.candidate : '';

    const iso = item && item.when ? String(item.when) : '';
    if (iso) {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const dd = ('0' + d.getDate()).slice(-2);
      const hh = ('0' + d.getHours()).slice(-2);
      const mi = ('0' + d.getMinutes()).slice(-2);
      this.scheduleForm.when = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    } else {
      this.scheduleForm.when = '';
    }

    this.scheduleModalOpen = true;
  }

  openScheduleNew(): void {
    this.scheduleEditingIndex = null;
    this.scheduleForm = { candidate: '', when: '' };
    this.scheduleModalOpen = true;
  }

  closeScheduleModal(): void {
    this.scheduleModalOpen = false;
  }

  saveSchedule(): void {
    const form = this.scheduleForm || { candidate: '', when: '' };
    const name = (form.candidate || '').trim();
    const whenVal = (form.when || '').trim();

    if (!name) { alert('Candidate is required.'); return; }
    if (!whenVal) { alert('Please pick date & time.'); return; }

    const iso = new Date(whenVal).toISOString();

    const list: InterviewItem[] = Array.isArray(this.upcoming) ? this.upcoming.slice() : [];

    if (this.scheduleEditingIndex !== null &&
        this.scheduleEditingIndex > -1 &&
        this.scheduleEditingIndex < list.length) {
      list[this.scheduleEditingIndex] = {
        candidate: name,
        when: iso,
        email: list[this.scheduleEditingIndex].email || ''
      };
    } else {
      const existing = list.find(i => i.candidate === name);
      if (existing) existing.when = iso;
      else list.push({ candidate: name, when: iso });
    }

    this.upcoming = list;
    this.saveInterviewsLS(list);
    this.scheduleModalOpen = false;
  }

  email(u: InterviewItem): void {
    const to = u && u.email ? u.email : '';
    const sub = encodeURIComponent('Interview Schedule');
    const body = encodeURIComponent(
      'Hi ' + (u && u.candidate ? u.candidate : '') +
      ',\n\nYour interview is scheduled for ' +
      (u && u.when ? new Date(u.when).toLocaleString() : '(TBD)') +
      '.\n\nThanks.'
    );
    window.location.href = 'mailto:' + to + '?subject=' + sub + '&body=' + body;
  }

  // ================================================================
  // Delta + snapshot helpers (kept)
  // ================================================================
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
    const salaries    = this.safeParseArray(localStorage.getItem('salaries')) as SalaryItem[];

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
    this.buildUpcomingFromCandidates(this.recentCandidates);

    // payroll from LS
    this.payrollRecs  = salaries.length;
    this.payrollTotal = salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    if (salaries.length && salaries[0].currency) {
      this.payrollCurrency = String(salaries[0].currency);
    }

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
