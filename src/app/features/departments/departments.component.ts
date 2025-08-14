import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  depts: Department[] = []; newName = '';
  constructor(private api: DepartmentService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAll().subscribe(d => this.depts = d); }
  add() { const name = this.newName.trim(); if(!name) return;
    this.api.add({ id: 0, name } as any).subscribe(() => { this.newName=''; this.load(); }); }
  remove(id: number) { this.api.delete(id).subscribe(() => this.load()); }
}
