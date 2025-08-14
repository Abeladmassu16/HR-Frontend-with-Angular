import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';
import { Candidate } from '../app/models/candidate';

@Injectable({ providedIn: 'root' })
export class CandidateService extends CrudService<Candidate> {
  constructor(http: HttpClient) { super(http, 'api/candidates'); }
}
