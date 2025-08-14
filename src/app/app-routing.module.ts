import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DepartmentsComponent } from './features/departments/departments.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { CandidatesComponent } from './features/candidates/candidates.component';

const routes: Routes = [
  { path: '', redirectTo: 'departments', pathMatch: 'full' },
  { path: 'departments', component: DepartmentsComponent },
  { path: 'employees',   component: EmployeesComponent },
  { path: 'companies',   component: CompaniesComponent },
  { path: 'candidates',  component: CandidatesComponent },
  { path: '**', redirectTo: 'departments' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
