import {
  Component, OnInit, OnChanges, SimpleChanges, Input
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/* ---- Data contracts used by the dashboard ---- */
export interface Employee { id: number; name: string; email?: string; hireDate?: string | Date; role?: string; }
export interface Department { id: number; name: string; }
export interface Company { id: number; name: string; }
export type CandidateStatus = 'Applied' | 'Interview' | 'Hired' | 'Rejected';
export interface Candidate { id: number; name: string; status?: CandidateStatus; createdAt?: string | Date; }
export interface UpcomingItem { id: number; when: string | Date; title: string; person?: string; status?: 'Scheduled' | 'Pending' | 'Canceled'; }

interface Stat { count: number; delta?: number; }

/* Change this if your API base is different (e.g. '' or environment.api) */
const API_BASE = '/api';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnChanges {
  /* ===== Optional inputs (if parent passes real arrays, we'll use them) ===== */
  @Input() employees: Employee[] = [];
  @Input() departments: Department[] = [];
  @Input() companies: Company[] = [];
  @Input() candidates: Candidate[] = [];
  @Input() upcoming: UpcomingItem[] = [];

  @Input() employeesDelta?: number;
  @Input() departmentsDelta?: number;
  @Input() companiesDelta?: number;
  @Input() candidatesDelta?: number;

  /* ===== Theme state ===== */
  theme: 'mint' | 'white' = 'mint';

  /* ===== View model ===== */
  stats: { employees: Stat; departments: Stat; companies: Stat; candidates: Stat } = {
    employees: { count: 0 }, departments: { count: 0 }, companies: { count: 0 }, candidates: { count: 0 }
  };
  recentCandidates: Candidate[] = [];

  isLoading = false;

  constructor(private http: HttpClient) {}

  /* ---------------- Lifecycle ---------------- */
  ngOnInit(): void {
    // theme
    let saved: string | null = null;
    try { saved = localStorage.getItem('hr-theme'); } catch {}
    this.applyTheme(saved === 'white' ? 'white' : 'mint');

    // if no inputs were provided, load from API
    if (!this.hasAnyInputData()) {
      this.loadFromApi();
    } else {
      this.recompute();
    }
  }

  ngOnChanges(_: SimpleChanges): void {
    // when inputs change (parent passes data), recompute
    this.recompute();
  }

  /* ---------------- Data loading (no hardcoded seeds) ---------------- */
  private loadFromApi(): void {
    this.isLoading = true;

    const employees$   = this.http.get<Employee[]>(`${API_BASE}/employees`).pipe(catchError(() => of([])));
    const departments$ = this.http.get<Department[]>(`${API_BASE}/departments`).pipe(catchError(() => of([])));
    const companies$   = this.http.get<Company[]>(`${API_BASE}/companies`).pipe(catchError(() => of([])));
    const candidates$  = this.http.get<Candidate[]>(`${API_BASE}/candidates`).pipe(catchError(() => of([])));
    const upcoming$    = this.http.get<UpcomingItem[]>(`${API_BASE}/upcoming`).pipe(catchError(() => of([])));

    forkJoin([employees$, departments$, companies$, candidates$, upcoming$])
      .subscribe(([emps, depts, comps, cands, up]) => {
        this.employees   = Array.isArray(emps)  ? emps  : [];
        this.departments = Array.isArray(depts) ? depts : [];
        this.companies   = Array.isArray(comps) ? comps : [];
        this.candidates  = Array.isArray(cands) ? cands : [];
        this.upcoming    = Array.isArray(up)    ? up    : [];
        this.recompute();
        this.isLoading = false;
      }, _ => { this.isLoading = false; });
  }

  /* ---------------- Derive view model ---------------- */
  private recompute(): void {
    this.stats.employees.count   = this.len(this.employees);
    this.stats.departments.count = this.len(this.departments);
    this.stats.companies.count   = this.len(this.companies);
    this.stats.candidates.count  = this.len(this.candidates);

    this.stats.employees.delta   = this.norm(this.employeesDelta);
    this.stats.departments.delta = this.norm(this.departmentsDelta);
    this.stats.companies.delta   = this.norm(this.companiesDelta);
    this.stats.candidates.delta  = this.norm(this.candidatesDelta);

    this.recentCandidates = this.pickRecent(this.candidates, 4);

    // sort upcoming by soonest (won’t change if already sorted)
    this.upcoming = (this.upcoming || []).slice().sort((a, b) => {
      const at = new Date(a.when as any).getTime();
      const bt = new Date(b.when as any).getTime();
      return at - bt;
    });
  }

  private hasAnyInputData(): boolean {
    return this.len(this.employees) + this.len(this.departments) + this.len(this.companies) +
           this.len(this.candidates) + this.len(this.upcoming) > 0;
  }
  private len(a: any[]): number { return Array.isArray(a) ? a.length : 0; }
  private norm(v?: number): number | undefined {
    if (v === null || v === undefined) { return undefined; }
    const n = Number(v); return isNaN(n) ? undefined : n;
  }
  private pickRecent(list: Candidate[], take: number): Candidate[] {
    if (!Array.isArray(list) || !list.length) return [];
    const hasCreated = list.some(c => !!c.createdAt);
    if (hasCreated) {
      return list.slice().sort((a, b) => {
        const bt = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        const at = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        return bt - at; // newest first
      }).slice(0, take);
    }
    // else try by id
    const allNum = list.every(c => typeof c.id === 'number');
    if (allNum) {
      return list.slice().sort((a, b) => (b.id as any) - (a.id as any)).slice(0, take);
    }
    // fallback: last N
    const start = Math.max(0, list.length - take);
    return list.slice(start);
  }

  /* ---------------- Theme toggle ---------------- */
  onToggleChange(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.applyTheme(checked ? 'mint' : 'white');
  }
  private applyTheme(next: 'mint' | 'white'): void {
    this.theme = next;
    const root = document.documentElement;
    if (next === 'white') root.classList.add('theme-white'); else root.classList.remove('theme-white');
    try { localStorage.setItem('hr-theme', next); } catch {}
  }

  /* ---------------- TrackBy helpers (optional) ---------------- */
  trackById(_: number, item: { id: number }) { return item.id; }

  /* ---------------- Button stubs ---------------- */
  schedule(item: UpcomingItem): void {}
  email(item: UpcomingItem): void {}
  openSchedule(): void {}
  addNew(): void {}
  openHire(): void {}
}
