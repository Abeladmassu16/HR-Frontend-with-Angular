import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DepartmentsComponent } from './features/departments/departments.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { CandidatesComponent } from './features/candidates/candidates.component';

const routes: Routes = [
  { path: '', redirectTo: 'departments', pathMatch: 'full' },
  { path: 'departments', component: DepartmentsComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: 'companies', component: CompaniesComponent },   // <-- must exist
  { path: 'candidates', component: CandidatesComponent }, // <-- must exist
  { path: '**', redirectTo: 'departments' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // keep hash while dev
  exports: [RouterModule]
})
export class AppRoutingModule {}
