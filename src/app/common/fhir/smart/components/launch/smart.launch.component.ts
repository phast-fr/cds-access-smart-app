import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {FhirSmartService} from '../../services/fhir.smart.service';

@Component({
  selector: 'app-smart-launch',
  templateUrl: './smart.launch.component.html',
  styleUrls: ['./smart.launch.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartLaunchComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private smartService: FhirSmartService) { }

  public ngOnInit(): void {
    const context = this.route.snapshot?.routeConfig.path.replace('/launch', '');
    const iss = this.route.snapshot?.queryParamMap.get('iss');
    const launch = this.route.snapshot?.queryParamMap.get('launch');
    const redirectUri = location.origin + '/' + context;

    if (iss != null && launch != null) {
      this.smartService.launch(context, iss, launch, redirectUri);
    }
    else {
      console.log('This page is reserved for smart on FHIR process !');
    }
  }
}
