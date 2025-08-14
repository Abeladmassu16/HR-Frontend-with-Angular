import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';
import { Company } from '../app/models/company';

@Injectable({ providedIn: 'root' })
export class CompanyService extends CrudService<Company> {
  constructor(http: HttpClient) { super(http, 'api/companies'); }
}
