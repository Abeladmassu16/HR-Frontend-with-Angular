import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';
import { Employee } from '../app/models/employee';

@Injectable({ providedIn: 'root' })
export class EmployeeService extends CrudService<Employee> {
  constructor(http: HttpClient) { super(http, 'api/employees'); }
}
