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
import { Component, inject } from '@angular/core';

import { ApiService } from '@zeta/api';
import { AuthService } from '@zeta/auth';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { XcModule } from '../../../../zeta/xc/xc.module';
import { extractError, OPTIONS_WITH_ERROR } from '../../const';
import { NoteComponent } from '../../shared/components/note-component/note-component';
import { SettingsService } from '../../shared/settings.service';
import { XoTestCaseEntry } from '../xo/test-case-entry.model';
import { XoTestCaseID } from '../xo/test-case-id.model';


export interface AddTestCaseComponentModalData {
    caseEntry: XoTestCaseEntry;
    i18nService: I18nService;
}

@Component({
    selector: 'add-test-case',
    templateUrl: './add-test-case.component.html',
    styleUrls: ['./add-test-case.component.scss'],
    imports: [XcModule, NoteComponent]
})
export class AddTestCaseComponent extends XcDialogComponent<XoTestCaseEntry, AddTestCaseComponentModalData> {
    private readonly apiService = inject(ApiService);
    private readonly settingsService = inject(SettingsService);
    private readonly authService = inject(AuthService);


    readonly testCase = new XoTestCaseEntry();
    note: string;

    duplicateMode = false;


    constructor() {
        super();

        if (this.injectedData && this.injectedData.caseEntry) {
            this.testCase.name = this.injectedData.caseEntry.name;
            this.testCase.description = this.injectedData.caseEntry.description;
            this.testCase.priority = this.injectedData.caseEntry.priority;
            this.duplicateMode = true;
        } else {
            this.testCase.priority = 7;
        }
        this.testCase.author = this.authService.username;
    }

    add() {
        const orderType = this.duplicateMode ? 'xdev.xtestfactory.infrastructure.gui.DuplicateTestCase' : 'xdev.xtestfactory.infrastructure.gui.CreateTestCase';
        const params = this.duplicateMode ? [this.testCase, XoTestCaseID.fromId(this.injectedData.caseEntry.iD)] : [this.testCase];

        this.note = '';
        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, params, null, OPTIONS_WITH_ERROR).subscribe({
            next: result => {
                if (result.errorMessage) {
                    this.note = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                } else {
                    this.dismiss(this.testCase);
                }
            },
            error: error => this.note = extractError(error)
        });
    }
}
