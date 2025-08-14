import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Company } from '../../models/company';
import { CompanyService } from '../../../services/company.service';
import { CompanyDialogComponent } from './company-dialog.component';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  displayedColumns = ['id','name','location','actions'];
  data = new MatTableDataSource<Company>([]);
  @ViewChild(MatPaginator,{static:true}) paginator: MatPaginator;
  @ViewChild(MatSort,{static:true}) sort: MatSort;

  constructor(private api: CompanyService, private dialog: MatDialog, private sb: MatSnackBar) {}
  ngOnInit() { this.data.paginator = this.paginator; this.data.sort = this.sort; this.load(); }
  load() { this.api.getAll().subscribe(rows => this.data.data = rows); }
  filter(v:string){ this.data.filter = v.trim().toLowerCase(); }
  add(){ this.dialog.open(CompanyDialogComponent,{width:'480px',data:{mode:'create'}}).afterClosed().subscribe(ok=>{ if(ok){ this.sb.open('Company created','OK',{duration:1500}); this.load(); } }); }
  edit(r: Company){ this.dialog.open(CompanyDialogComponent,{width:'480px',data:{mode:'edit', company:r}}).afterClosed().subscribe(ok=>{ if(ok){ this.sb.open('Company updated','OK',{duration:1500}); this.load(); } }); }
  remove(id:number){ this.api.delete(id).subscribe(()=>{ this.sb.open('Company deleted','OK',{duration:1500}); this.load(); }); }
}
