import {Component} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DialogData {
  animal: string;
  name: string;
}
/**
 * @title Dialog Overview
 */
@Component({
  selector: 'app-dialog-selected-specialite',
  templateUrl: './dialog-selected-specialite-dialog.html',
})
export class DialogSelectedSpecialiteComponent {

  animal: string;
  name: string;
  data: any;

  constructor(public dialog: MatDialog) {}

  openDialog(): void {
   const dialogRef = this.dialog.open(DialogSelectedSpecialiteComponent, {
      width: '250px',
      data: {name: this.name, animal: this.animal}
    });
/*
   dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.animal = result;
    });
    */

  }

}
