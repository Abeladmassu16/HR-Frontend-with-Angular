import { NgModule } from '@angular/core';

import { MatToolbarModule }     from '@angular/material/toolbar';
import { MatIconModule }        from '@angular/material/icon';
import { MatButtonModule }      from '@angular/material/button';
import { MatCardModule }        from '@angular/material/card';
import { MatTableModule }       from '@angular/material/table';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatSnackBarModule }    from '@angular/material/snack-bar';
import { MatDialogModule }      from '@angular/material/dialog';
import { MatPaginatorModule }   from '@angular/material/paginator';
import { MatSortModule }        from '@angular/material/sort';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatNativeDateModule }  from '@angular/material/core';

@NgModule({
  exports: [
    MatToolbarModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatDialogModule, MatPaginatorModule, MatSortModule,
    MatDatepickerModule, MatNativeDateModule
  ]
})
export class MaterialModule {}
