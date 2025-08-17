import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

export interface Department { id: number; name: string; }
export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string;   // ISO: YYYY-MM-DD
  role?: string;
  departmentId?: number;
}
export interface Company { id: number; name: string; location?: string; }
export interface Candidate {
  id: number;
  name: string;
  email?: string;
  status: 'Applied' | 'Interview' | 'Hired' | 'Rejected';
  departmentId?: number;
}

@Injectable({ providedIn: 'root' })
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const departments: Department[] = [
      { id: 1, name: 'Engineering' },
      { id: 2, name: 'HR' },
      { id: 3, name: 'Finance' },
    ];

    const employees: Employee[] = [
      {
        id: 1,
        name: 'Abel K',
        email: 'abel@example.com',
        departmentId: 1,
        hireDate: '2020-02-15',
        role: 'Manager',
      },
      {
        id: 2,
        name: 'Elsa M',
        email: 'elsa@example.com',
        departmentId: 2,
        hireDate: '2021-06-10',
        role: 'Developer',
      },
    ];

    const candidates: Candidate[] = [
      { id: 1, name: 'Thomas T', email: 'thomas@example.com', status: 'Interview', departmentId: 1 },
    ];

    const companies: Company[] = [
      { id: 1, name: 'XOKA Tech', location: 'Addis Ababa' },
    ];

    return {
      departments,
      employees,
      candidates,
      companies,
    };
  }

  // Generate next id for POSTs
  genId<T extends { id: number }>(collection: T[]): number {
    return collection.length ? Math.max(...collection.map(i => i.id)) + 1 : 1;
  }
}
