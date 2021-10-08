/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
    if (this.route.snapshot?.routeConfig?.path) {
      const context = this.route.snapshot.routeConfig.path.replace('/launch', '');
      const iss = this.route.snapshot.queryParamMap.get('iss');
      const launch = this.route.snapshot.queryParamMap.get('launch');
      const redirectUri = location.origin + '/' + context;

      if (iss && launch) {
        this.smartService.launch(context, iss, launch, redirectUri);
      }
    }
    else {
      console.log('This page is reserved for smart on FHIR process !');
    }
  }
}
