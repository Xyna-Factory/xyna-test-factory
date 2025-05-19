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

import { ApiService, StartOrderOptions } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { extractError } from '../../const';
import { SettingsService } from '../../shared/settings.service';
import { XoBaseText } from '../../shared/xo/base-text.model';


export interface AddTestCaseChainComponentModalData {
    i18nService: I18nService;
}

@Component({
    templateUrl: './add-test-case-chain.component.html',
    styleUrls: ['./add-test-case-chain.component.scss'],
    standalone: false
})
export class AddTestCaseChainComponent extends XcDialogComponent<string, AddTestCaseChainComponentModalData> {

    testCaseChainName = '';
    note = '';

    constructor(injector: Injector, private readonly apiService: ApiService, private readonly settingsService: SettingsService) {
        super(injector);
    }


    get valid(): boolean {
        return !!this.testCaseChainName;
    }


    add() {
        this.note = '';
        const optionsWithError: StartOrderOptions = {
            async: false,
            withErrorMessage: true
        };
        const orderType = 'xdev.xtestfactory.infrastructure.gui.CreateTestCaseChain';
        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, new XoBaseText(undefined, this.testCaseChainName), null, optionsWithError).subscribe({
            next: res => {
                if (!res.errorMessage) {
                    this.dismiss(this.testCaseChainName);
                } else {
                    this.note = this.injectedData.i18nService.translateErrorCode(res.errorMessage);
                }
            },
            error: err => this.note = extractError(err)
        });
    }
}
