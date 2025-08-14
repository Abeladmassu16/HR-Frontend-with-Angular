import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';
import { Department } from '../app/models/department';

@Injectable({ providedIn: 'root' })
export class DepartmentService extends CrudService<Department> {
  constructor(http: HttpClient) { super(http, 'api/departments'); }
}
