// core/services/employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private base = 'http://localhost:8080/api/employees';
  constructor(private http: HttpClient) {}
  list(): Observable<Employee[]> { return this.http.get<Employee[]>(this.base); }
  create(e: Employee){ return this.http.post<Employee>(this.base, e); }
  update(id: number, e: Employee){ return this.http.put<Employee>(`${this.base}/${id}`, e); }
  remove(id: number){ return this.http.delete(`${this.base}/${id}`); }
}
