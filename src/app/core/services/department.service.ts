import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Department } from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private base = 'http://localhost:8080/api/departments';
  constructor(private http: HttpClient) {}
  list(): Observable<Department[]> { return this.http.get<Department[]>(this.base); }
  create(d: Department){ return this.http.post<Department>(this.base, d); }
  update(id: number, d: Department){ return this.http.put<Department>(`${this.base}/${id}`, d); }
  remove(id: number){ return this.http.delete(`${this.base}/${id}`); }
}