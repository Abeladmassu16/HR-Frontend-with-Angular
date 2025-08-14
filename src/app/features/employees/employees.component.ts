import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialog, MatSnackBar } from '@angular/material';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../../../services/employee.service';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';
import { EmployeeDialogComponent } from './employee-dialog.component';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  displayedColumns = ['id','name','department','email','hireDate','salary','actions'];
  data = new MatTableDataSource<Employee>([]);
  departments: Department[] = [];

  @ViewChild(MatPaginator,{static:true}) paginator: MatPaginator;
  @ViewChild(MatSort,{static:true}) sort: MatSort;

  constructor(
    private employees: EmployeeService,
    private departmentsSvc: DepartmentService,
    private dialog: MatDialog,
    private sb: MatSnackBar
  ) {}

  ngOnInit() {
    this.data.paginator = this.paginator;
    this.data.sort = this.sort;
    this.load();
  }

  load() {
    this.departmentsSvc.getAll().subscribe(d => this.departments = d);
    this.employees.getAll().subscribe(e => this.data.data = e);
  }

  deptName(id: number) {
    const d = this.departments.find(x => x.id === id); return d ? d.name : '-';
  }

  openCreate() {
    const ref = this.dialog.open(EmployeeDialogComponent, { width: '520px', data: { mode: 'create' } });
    ref.afterClosed().subscribe(res => { if (res) { this.sb.open('Employee created','OK',{duration:1500}); this.load(); } });
  }

  openEdit(row: Employee) {
    const ref = this.dialog.open(EmployeeDialogComponent, { width: '520px', data: { mode: 'edit', employee: row } });
    ref.afterClosed().subscribe(res => { if (res) { this.sb.open('Employee updated','OK',{duration:1500}); this.load(); } });
  }

  delete(id: number) {
    this.employees.delete(id).subscribe(() => { this.sb.open('Employee deleted','OK',{duration:1500}); this.load(); });
  }

  applyFilter(v: string) { this.data.filter = v.trim().toLowerCase(); }
}
