import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SmartService } from '../services/smart.service';

@Component({
  selector: 'app-launch',
  templateUrl: './launch.component.html',
  styleUrls: ['./launch.component.css']
})
export class LaunchComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private smartService: SmartService) { }

  ngOnInit(): void {
    const context = this.route.snapshot?.routeConfig.path.replace('/launch', '');
    const redirectUri = location.origin + '/' + context;
    const iss = this.route.snapshot?.queryParamMap.get('iss');
    const launch = this.route.snapshot.queryParamMap.get('launch');

    if (iss != null && launch != null) {
      this.smartService.launch(context, iss, launch, redirectUri);
    }
    else {
      console.log('This page is reserved for smart on FHIR process !');
    }
  }
}