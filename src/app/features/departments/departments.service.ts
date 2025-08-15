import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Department { id: number; name: string; }
const BASE = '/api/departments';

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(BASE).pipe(
      tap(() => console.log('[GET] /api/departments')),
      catchError(err => {
        console.error('GET departments failed', err);
        return of([]);
      })
    );
  }

  add(name: string): Observable<Department> {
    return this.http.post<Department>(BASE, { name }).pipe(
      tap(() => console.log('[POST] /api/departments')),
      catchError(err => {
        console.error('POST department failed', err);
        return of(null as any);
      })
    );
  }

  remove(id: number) {
    return this.http.delete(`${BASE}/${id}`).pipe(
      tap(() => console.log('[DELETE] /api/departments/' + id)),
      catchError(err => {
        console.error('DELETE department failed', err);
        return of(null);
      })
    );
  }
}
