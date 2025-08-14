import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';

import { InMemoryDataService } from './in-memory-data.service';

// Features
import { DepartmentsComponent } from './features/departments/departments.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { EmployeeDialogComponent } from './features/employees/employee-dialog.component';

// Directive
import { ElevateOnHoverDirective } from './directives/elevate-on-hover.directive';

@NgModule({
  declarations: [
    AppComponent,
    DepartmentsComponent, EmployeesComponent, EmployeeDialogComponent,
    ElevateOnHoverDirective
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 300 }),
    FormsModule, ReactiveFormsModule,
    MaterialModule,
    AppRoutingModule
  ],
  entryComponents: [EmployeeDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
