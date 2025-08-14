import { NgModule } from '@angular/core';
import {
  MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule,
  MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatSnackBarModule, MatDialogModule, MatPaginatorModule, MatSortModule,
  MatDatepickerModule
} from '@angular/material';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  exports: [
    MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatDialogModule, MatPaginatorModule, MatSortModule,
    MatDatepickerModule, MatNativeDateModule
  ]
})
export class MaterialModule {}