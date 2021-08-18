import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CardReadable} from '../prescription.model';
import {PrescriptionStateService} from '../prescription-state.service';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardListComponent {

  constructor(private _prescriptionState: PrescriptionStateService) { }

  public get cards(): Array<CardReadable> {
    return this._prescriptionState.cards;
  }

}
