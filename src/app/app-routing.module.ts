import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DepartmentsComponent } from './features/departments/departments.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { CandidatesComponent } from './features/candidates/candidates.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SalariesComponent } from './features/salaries/salaries.component';

const routes: Routes = [
  
  { path: 'dashboard',  component: DashboardComponent },
  { path: 'departments', component: DepartmentsComponent },
  { path: 'employees',   component: EmployeesComponent },
  { path: 'companies',   component: CompaniesComponent },
  { path: 'candidates',  component: CandidatesComponent },
  { path: 'salaries', component: SalariesComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'departments' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
