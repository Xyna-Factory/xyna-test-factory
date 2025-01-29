/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, Injector } from '@angular/core';

import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { OPTIONS_WITH_ERROR } from '../../../const';
import { SettingsService } from '../../../shared/settings.service';
import { XoCounterEntry } from '../../xo/counter-entry.model';


export interface AddCounterComponentData {
    i18nService: I18nService;
    counterEntry: XoCounterEntry;
}


@Component({
    templateUrl: './add-counter.component.html',
    styleUrls: ['./add-counter.component.scss'],
    standalone: false
})
export class AddCounterComponent extends XcDialogComponent<boolean, AddCounterComponentData> {

    readonly counterEntry: XoCounterEntry;
    errorMessage: string;


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly settingsService: SettingsService) {
        super(injector);

        this.counterEntry = this.injectedData.counterEntry
            ? this.injectedData.counterEntry.cloneWithZeroId()
            : new XoCounterEntry();
    }


    add() {
        const orderType = 'xdev.xtestfactory.infrastructure.actions.UpsertCounterWithUniquenessCheck';
        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, this.counterEntry, null, OPTIONS_WITH_ERROR).subscribe(
            response => {
                if (response.stackTrace) {
                    this.errorMessage = this.injectedData.i18nService.translateErrorCode(response.errorMessage);
                } else {
                    this.dismiss(true);
                }
            },
            error => {
                console.log(error);
                this.dismiss();
            }
        );
    }
}
