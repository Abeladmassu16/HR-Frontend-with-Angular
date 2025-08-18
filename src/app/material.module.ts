import { NgModule } from '@angular/core';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatTableModule }      from '@angular/material/table';
import { MatPaginatorModule }  from '@angular/material/paginator';
import { MatSortModule }       from '@angular/material/sort';
import { MatDialogModule }     from '@angular/material/dialog';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatSelectModule }     from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule }   from '@angular/material/snack-bar';
import { MatCardModule }       from '@angular/material/card';
import { MatToolbarModule }    from '@angular/material/toolbar';
import { MatTooltipModule }    from '@angular/material/tooltip';

@NgModule({
  exports: [
    MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatSnackBarModule, MatCardModule, MatToolbarModule, MatTooltipModule
  ]
})
export class MaterialModule {}
