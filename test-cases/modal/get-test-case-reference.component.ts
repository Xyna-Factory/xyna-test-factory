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
import { XcDialogComponent, XcRemoteTableDataSource } from '@zeta/xc';

import { XcModule } from '../../../../zeta/xc/xc.module';
import { NoteComponent } from '../../shared/components/note-component/note-component';
import { SettingsService } from '../../shared/settings.service';
import { XoTestCaseEntry, XoTestCaseEntryArray } from '../xo/test-case-entry.model';


@Component({
    selector: 'get-test-case-reference',
    templateUrl: './get-test-case-reference.component.html',
    styleUrls: ['./get-test-case-reference.component.scss'],
    imports: [XcModule, NoteComponent]
})
export class GetTestCaseReferenceComponent extends XcDialogComponent<{ value: string; label?: string }> {
    private readonly apiService = inject(ApiService);
    private readonly settingsService = inject(SettingsService);

    dataSource: XcRemoteTableDataSource;

    note: string;

    constructor() {
        super();

        const orderType = 'xdev.xtestfactory.infrastructure.selector.GetTestCasesForSelection';
        this.dataSource = new XcRemoteTableDataSource(this.apiService, undefined, this.settingsService.testProjectRtc, orderType);
        this.dataSource.output = XoTestCaseEntryArray;
        this.dataSource.dataChange.subscribe(() => this.note = '');
        this.dataSource.error.subscribe(result => this.note = result.errorMessage);
        this.dataSource.refresh();
    }


    choose() {
        const firstColumn = this.dataSource.columns[0];
        const selection = this.dataSource.selectionModel.selection[0] as XoTestCaseEntry;
        this.dismiss({ value: String(selection.iD), label: selection.resolve(firstColumn.path) });
    }
}
