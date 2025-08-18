// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular In-Memory Web API (dev/mock backend)
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './in-memory-data.service';

// App shell & routing
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Angular Material barrel (your local module that imports/exports Mat* modules)
import { MaterialModule } from './material.module';

// Feature components
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { CandidatesComponent } from './features/candidates/candidates.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { DepartmentsComponent } from './features/departments/departments.component';

// Salaries (new, Material-based)
import { SalariesComponent } from './features/salaries/salaries.component';
import { SalaryDialogComponent } from './features/salaries/salary-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    // features
    DashboardComponent,
    EmployeesComponent,
    CandidatesComponent,
    CompaniesComponent,
    DepartmentsComponent,
    // salaries
    SalariesComponent,
    SalaryDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    AppRoutingModule,

    // NOTE: keep this after HttpClientModule; leave it ON during development.
    // If you later connect a real backend, remove this line.
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
      dataEncapsulation: false,
      delay: 300
    })
  ],
  // Required for Angular 8 when opening MatDialog components dynamically
  entryComponents: [SalaryDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
