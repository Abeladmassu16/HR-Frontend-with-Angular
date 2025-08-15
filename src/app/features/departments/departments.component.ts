import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';

import { EmployeeService } from '../../../services/employee.service';
import { CandidateService } from '../../../services/candidate.service';
import { Employee } from '../../models/employee';
import { Candidate } from '../../models/candidate';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  depts: Department[] = [];
  newName = '';

  // NEW: selection + related data
  selectedDept: Department | null = null;
  deptEmployees: Employee[] = [];
  deptCandidates: Candidate[] = [];

  // table columns
  deptsDisplayed = ['id','name','actions'];
  empDisplayed   = ['id','name','email','hireDate','salary'];
  candDisplayed  = ['id','name','status','email','phone'];

  constructor(
    private api: DepartmentService,
    private employeesApi: EmployeeService,
    private candidatesApi: CandidateService
  ) {}

  ngOnInit() { this.load(); }

  load() { this.api.getAll().subscribe(d => this.depts = d); }

  add() {
    const name = (this.newName || '').trim();
    if (!name) return;
    this.api.add({ id: 0, name } as any).subscribe(() => { this.newName=''; this.load(); });
  }

  remove(id: number) {
    this.api.delete(id).subscribe(() => {
      if (this.selectedDept && this.selectedDept.id === id) {
        this.clearSelection();
      }
      this.load();
    });
  }

  // NEW: select a department and load its related data
  select(dept: Department) {
    this.selectedDept = dept;
    this.loadRelated(dept.id);
  }

  clearSelection() {
    this.selectedDept = null;
    this.deptEmployees = [];
    this.deptCandidates = [];
  }

  private loadRelated(deptId: number) {
    // Employees belonging to the department
    this.employeesApi.getAll()
      .subscribe(list => this.deptEmployees = list.filter(e => e.departmentId === deptId));

    // Candidates who applied for the department
    this.candidatesApi.getAll()
      .subscribe(list => this.deptCandidates = list.filter(c => c.appliedForDepartmentId === deptId));
  }
}
