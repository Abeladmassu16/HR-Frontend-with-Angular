import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { InMemoryDataService } from './in-memory-data.service';

// Features
import { DepartmentsComponent } from './features/departments/departments.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { EmployeeDialogComponent } from './features/employees/employee-dialog.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { CompanyDialogComponent } from './features/companies/company-dialog.component';
import { CandidatesComponent } from './features/candidates/candidates.component';
import { CandidateDialogComponent } from './features/candidates/candidate-dialog.component';

// Directives
import { ElevateOnHoverDirective } from './directives/elevate-on-hover.directive';
import { TiltCardDirective } from './directives/tilt-card.directive';

@NgModule({
  providers: [
  { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
],
  declarations: [
    AppComponent,
    DepartmentsComponent, EmployeesComponent, EmployeeDialogComponent,
    CompaniesComponent, CompanyDialogComponent,
    CandidatesComponent, CandidateDialogComponent,
    ElevateOnHoverDirective, TiltCardDirective
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 300 }),
    FormsModule, ReactiveFormsModule,
    MaterialModule,
    AppRoutingModule
  ],
  entryComponents: [EmployeeDialogComponent, CompanyDialogComponent, CandidateDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
