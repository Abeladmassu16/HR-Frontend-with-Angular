import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    private depts: DepartmentService,
    private dialog: MatDialog,
    private sb: MatSnackBar
  ) {}

  ngOnInit() {
    this.data.paginator = this.paginator; this.data.sort = this.sort;
    this.depts.getAll().subscribe(d => this.departments = d);
    this.load();
  }
  load() { this.employees.getAll().subscribe(e => this.data.data = e); }
  deptName(id: number) { const d = this.departments.find(x => x.id === id); return d ? d.name : '-'; }
  openCreate() { this.dialog.open(EmployeeDialogComponent,{width:'520px',data:{mode:'create'}})
    .afterClosed().subscribe(ok => { if(ok){ this.sb.open('Employee created','OK',{duration:1500}); this.load(); } }); }
  openEdit(row: Employee) { this.dialog.open(EmployeeDialogComponent,{width:'520px',data:{mode:'edit', employee: row}})
    .afterClosed().subscribe(ok => { if(ok){ this.sb.open('Employee updated','OK',{duration:1500}); this.load(); } }); }
  delete(id: number) { this.employees.delete(id).subscribe(() => { this.sb.open('Employee deleted','OK',{duration:1500}); this.load(); }); }
  applyFilter(v: string) { this.data.filter = v.trim().toLowerCase(); }
}
