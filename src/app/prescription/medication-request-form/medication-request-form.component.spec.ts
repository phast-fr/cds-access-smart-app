import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HttpClient, HttpHandler} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PrescriptionModule} from '../prescription.module';
import { MedicationRequestFormComponent } from './medication-request-form.component';

describe('MedicationRequestFormComponent', () => {
  let component: MedicationRequestFormComponent;
  let fixture: ComponentFixture<MedicationRequestFormComponent>;
  // let scheduler: TestScheduler;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        PrescriptionModule
      ],
      providers: [
        HttpClient,
        HttpHandler
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicationRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    /*scheduler = new TestScheduler((actual, expected) => {
      expected(actual).toEqual(expected);
    });*/
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /*it('should add medication', () => {
    const medicationKnowledge = {} as MedicationKnowledge;
    const medicationId = component.viewModel.nextMedicationId();
    const patient = {} as Patient;
    const practitioner = {} as Practitioner;

    scheduler.run(({expectObservable}) => {
      const expectedMarble = '';
      const expectedObj = {};
      expectObservable(component.viewModel.state$()).toBe(expectedMarble, expectedObj);
    });

    component.viewModel.dispatchIntent(
      new MedicationFormIntentAddMedication(
        component.viewModel.medicationRequest, medicationKnowledge, medicationId, patient, practitioner
      )
    );
  });*/
});
