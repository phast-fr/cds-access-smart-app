import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HttpClient, HttpHandler} from '@angular/common/http';
import {PrescriptionModule} from '../../prescription.module';
import {MetadataFormComponent} from './metadata-form.component';

describe('MetadataFormComponent', () => {
  let component: MetadataFormComponent;
  let fixture: ComponentFixture<MetadataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
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
    fixture = TestBed.createComponent(MetadataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
