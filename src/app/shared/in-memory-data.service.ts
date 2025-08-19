import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({ providedIn: 'root' })
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const companies = [
      { id: 1, name: 'XOKA Tech', location: 'Addis Ababa' },
      { id: 2, name: 'Globex',    location: 'Nairobi' }
    ];

    const departments = [
      { id: 1, name: 'Engineering', companyId: 1 },
      { id: 2, name: 'HR',          companyId: 1 },
      { id: 3, name: 'Finance',     companyId: 1 },
      { id: 4, name: 'full-stack-dev', ompanyId: 1 },
      { id: 5, name: 'Sales',       companyId: 2 }
    ];

    const employees = [
      { id: 1, name: 'Abel K', email: 'abel@example.com', hireDate: '2020-02-15', role: 'Engineer', departmentId: 1 },
      { id: 2, name: 'Elsa M', email: 'elsa@example.com', hireDate: '2021-06-10', role: 'HR Specialist', departmentId: 2 },
       { id: 2, name: 'Nahom', email: 'nahom@example.com', hireDate: '2021-06-10', role: 'developer', departmentId: 4 }
    ];

    const candidates = [
      { id: 1, name: 'Thomas T', email: 'thomas@example.com', status: 'Interview', departmentId: 2 },
      { id: 2, name: 'Maya G',   email: 'maya@example.com',   status: 'Applied',   departmentId: 1 }
    ];

    const salaries = [
      { id: 1, employeeId: 1, amount: 65000, currency: 'USD', effectiveDate: '2020-02-15' },
      { id: 2, employeeId: 2, amount: 72000, currency: 'USD', effectiveDate: '2021-06-10' }
    ];

    // in-memory-web-api automatically exposes /api/<collection>
    return { companies, departments, employees, candidates, salaries };
  }

  genId<T extends { id: number }>(collection: T[]): number {
    if (!collection || collection.length === 0) return 1;
    var max = 0;
    for (var i = 0; i < collection.length; i++) {
      var v = Number(collection[i].id);
      if (isFinite(v) && v > max) max = v;
    }
    return max + 1;
  }
}
