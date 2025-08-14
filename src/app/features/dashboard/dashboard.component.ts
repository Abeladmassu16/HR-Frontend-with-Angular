import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../services/employee.service';
import { CandidateService } from '../../../services/candidate.service';
import { DepartmentService } from '../../../services/department.service';
import { Employee } from '../../models/employee';
import { Candidate } from '../../models/candidate';
import { Department } from '../../models/department';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // top nav in the header (routes to your existing pages)
  navigationTabs = ['Departments', 'Employees', 'Companies', 'Candidates'];
  activeTab = 'Employees';

  // rendered data for the table
  employees: Array<{id:number; name:string; department:string; email:string; hireDate:string; salary:number}> = [];
  candidates: Candidate[] = [];
  selectedCandidatesList: Array<{name:string; selected:boolean}> = [];

  // modal state
  isAddModalOpen = false;
  newEmployee: { name: string; departmentId: number | null; hireDate: string; salary: number | null } = {
    name: '', departmentId: null, hireDate: '', salary: null
  };

  // departments for dropdown + mapping
  departments: Department[] = [];

  constructor(
    private router: Router,
    private employeesApi: EmployeeService,
    private candidatesApi: CandidateService,
    private deptsApi: DepartmentService
  ) {}

  ngOnInit() {
    this.deptsApi.getAll().subscribe(ds => { this.departments = ds; this.refreshEmployees(); });
    this.candidatesApi.getAll().subscribe(cs => {
      this.candidates = cs;
      this.selectedCandidatesList = cs.map(c => ({ name: c.name, selected: false }));
    });
  }

  private refreshEmployees() {
    this.employeesApi.getAll().subscribe(list => {
      this.employees = list.map(e => ({
        id: e.id,
        name: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
        department: this.deptName(e.departmentId),
        email: e.email,
        hireDate: e.hireDate ? new Date(e.hireDate).toLocaleDateString() : '',
        salary: e.salary
      }));
    });
  }

  private deptName(id: number) {
    const d = this.departments.find(x => x.id === id);
    return d ? d.name : '';
  }

  getStatusClass(status: string) {
    return `status-${(status || '').toLowerCase()}`;
  }

  toggleCandidateSelection(name: string) {
    const item = this.selectedCandidatesList.find(s => s.name === name);
    if (item) item.selected = !item.selected;
  }

  openAddModal()  { this.isAddModalOpen = true; }
  closeAddModal() { this.isAddModalOpen = false; }

  addEmployee() {
    if (!this.newEmployee.name || !this.newEmployee.departmentId) return;

    const [firstName, ...rest] = this.newEmployee.name.trim().split(' ');
    const payload: Employee = {
      id: 0,
      firstName,
      lastName: rest.join(' '),
      email: `${firstName}.${rest.join(' ') || 'user'}`.toLowerCase().replace(/\s+/g, '') + '@example.com',
      departmentId: this.newEmployee.departmentId!,
      hireDate: this.newEmployee.hireDate
        ? new Date(this.newEmployee.hireDate).toISOString()
        : new Date().toISOString(),
      salary: Number(this.newEmployee.salary || 0)
    };

    this.employeesApi.add(payload).subscribe(() => {
      this.closeAddModal();
      this.newEmployee = { name: '', departmentId: null, hireDate: '', salary: null };
      this.refreshEmployees();
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    const map: any = {
      Departments: '/departments',
      Employees:   '/employees',
      Companies:   '/companies',
      Candidates:  '/candidates'
    };
    if (map[tab]) this.router.navigate([map[tab]]);
  }
}
