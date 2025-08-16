// src/app/shared/in-memory-data.service.ts
import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

export interface Candidate {
  id: number;
  name: string;
  email: string;
  status: 'Applied' | 'Interview' | 'Hired' | 'Rejected';
}

export interface Company {
  id: number;
  name: string;
  location: string;
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  hireDate?: string; // ISO: yyyy-mm-dd
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class InMemoryDataService implements InMemoryDbService {

  /** Seed your in-memory DB. Collections will be available at:
   *  /api/candidates, /api/companies, /api/employees
   */
  createDb() {
    const candidates: Candidate[] = [
      { id: 1, name: 'Thomas T',  email: 'thomas@example.com',  status: 'Interview' },
      { id: 2, name: 'Sara K',    email: 'sara@example.com',    status: 'Applied'   },
      { id: 3, name: 'Biniam H',  email: 'biniam@example.com',  status: 'Hired'     },
      { id: 4, name: 'Helen M',   email: 'helen@example.com',   status: 'Rejected'  }
    ];

    const companies: Company[] = [
      { id: 1, name: 'XOKA Tech',   location: 'Addis Ababa' },
      { id: 2, name: 'GreenLeaf',   location: 'Nairobi'     },
      { id: 3, name: 'BluePeak LLC',location: 'Dubai'       }
    ];

    const employees: Employee[] = [
      { id: 1, name: 'Amanuel G', email: 'amanuel@xoka.com', hireDate: '2024-01-16', role: 'Frontend Dev' },
      { id: 2, name: 'Liya S',    email: 'liya@xoka.com',    hireDate: '2023-11-02', role: 'HR Manager'   },
      { id: 3, name: 'Biniam H',  email: 'biniam@example.com', hireDate: '2024-06-10', role: 'Backend Dev' }
    ];

    // Return the database collections
    return { candidates, companies, employees };
  }

  /** Auto-increment ID for POSTs without an id property. */
  genId<T extends { id: number }>(collection: T[], _collectionName: string): number {
    if (collection && collection.length) {
      const maxId = Math.max.apply(null, collection.map(function (item) { return Number(item.id) || 0; }));
      return maxId + 1;
    }
    return 1;
  }
}
