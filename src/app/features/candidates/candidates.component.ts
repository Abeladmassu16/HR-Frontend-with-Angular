import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Candidate } from '../../models/candidate';
import { CandidateService } from '../../../services/candidate.service';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../models/department';
import { CandidateDialogComponent } from './candidate-dialog.component';

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss']
})
export class CandidatesComponent implements OnInit {
  displayedColumns = ['id','name','dept','status','email','phone','actions'];
  data = new MatTableDataSource<Candidate>([]);
  depts: Department[] = [];

  @ViewChild(MatPaginator,{static:true}) paginator: MatPaginator;
  @ViewChild(MatSort,{static:true}) sort: MatSort;

  constructor(private api: CandidateService, private deptsApi: DepartmentService, private dialog: MatDialog, private sb: MatSnackBar) {}

  ngOnInit() {
    this.data.paginator = this.paginator; this.data.sort = this.sort;
    this.deptsApi.getAll().subscribe(d => this.depts = d);
    this.load();
  }
  load(){ this.api.getAll().subscribe(rows => this.data.data = rows); }
  deptName(id: number){ const d = this.depts.find(x => x.id === id); return d ? d.name : '-'; }
  filter(v:string){ this.data.filter = v.trim().toLowerCase(); }
  add(){ this.dialog.open(CandidateDialogComponent,{width:'560px',data:{mode:'create'}}).afterClosed().subscribe(ok=>{ if(ok){ this.sb.open('Candidate created','OK',{duration:1500}); this.load(); } }); }
  edit(r: Candidate){ this.dialog.open(CandidateDialogComponent,{width:'560px',data:{mode:'edit', candidate:r}}).afterClosed().subscribe(ok=>{ if(ok){ this.sb.open('Candidate updated','OK',{duration:1500}); this.load(); } }); }
  remove(id:number){ this.api.delete(id).subscribe(()=>{ this.sb.open('Candidate deleted','OK',{duration:1500}); this.load(); }); }
}
