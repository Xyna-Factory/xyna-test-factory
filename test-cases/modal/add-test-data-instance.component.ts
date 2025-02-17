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
import { XcDialogComponent, XcRemoteTableDataSource } from '@zeta/xc';

import { SettingsService } from '../../shared/settings.service';
import { XoTestDataSelectorInstance, XoTestDataSelectorInstanceArray } from '../xo/test-data-selector-instance.model';


@Component({
    templateUrl: './add-test-data-instance.component.html',
    styleUrls: ['./add-test-data-instance.component.scss'],
    standalone: false
})
export class AddTestDataInstanceComponent extends XcDialogComponent<XoTestDataSelectorInstance> {

    name: string;
    dataSource: XcRemoteTableDataSource<XoTestDataSelectorInstance>;


    constructor(injector: Injector, apiService: ApiService, settingsService: SettingsService) {
        super(injector);

        const orderType = 'xdev.xtestfactory.infrastructure.selector.GetSelectorPrototypes';
        this.dataSource = new XcRemoteTableDataSource(apiService, undefined, settingsService.testProjectRtc, orderType);
        this.dataSource.output = XoTestDataSelectorInstanceArray;
        this.dataSource.selectionModel.selectionChange.subscribe(model => {
            const selection: XoTestDataSelectorInstance = model.selection[0] || null;
            if (selection) {
                this.name = selection.name;
            }
        });
        this.dataSource.refresh();
    }


    get valid(): boolean {
        return !!this.name && !this.dataSource.selectionModel.isEmpty();
    }


    ok() {
        const selection = this.dataSource.selectionModel.selection[0];
        selection.name = this.name;
        this.dismiss(selection);
    }
}
