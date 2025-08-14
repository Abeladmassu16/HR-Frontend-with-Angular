import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const departments = [
      { id: 1, name: 'Engineering' },
      { id: 2, name: 'HR' },
      { id: 3, name: 'Finance' }
    ];

    const employees = [
      { id: 1, firstName: 'Abel', lastName: 'K.', email: 'abel@example.com', departmentId: 1, hireDate: '2020-02-15', salary: 120000 },
      { id: 2, firstName: 'Elsa', lastName: 'M.', email: 'elsa@example.com', departmentId: 2, hireDate: '2021-06-10', salary: 80000 }
    ];

    const companies = [
      { id: 1, name: 'XOKA Tech', location: 'Addis Ababa' }
    ];

    const candidates = [
      { id: 1, name: 'Thomas T.', email: 'thomas@example.com', phone: '+251911111111', appliedForDepartmentId: 1, status: 'Interview' as const }
    ];

    const salaries = [
      { id: 1, employeeId: 1, amount: 120000, currency: 'USD' as const },
      { id: 2, employeeId: 2, amount: 80000, currency: 'USD' as const }
    ];

    return { departments, employees, companies, candidates, salaries };
  }

  // auto-id helper
  genId(collection: { id: number }[]): number {
    return collection.length ? Math.max(...collection.map(i => i.id)) + 1 : 1;
  }
}
