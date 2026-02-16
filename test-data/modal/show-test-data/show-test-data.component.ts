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

import { ApiService, XoArray, XoDescriber, XoStructureType } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent, XcDialogService, XcStructureTreeDataSource, XcTreeNode, XcTreeObserver, XDSIconName } from '@zeta/xc';

import { filter } from 'rxjs/operators';

import { XcModule } from '../../../../../zeta/xc/xc.module';
import { OPTIONS_WITH_ERROR } from '../../../const';
import { NoteComponent } from '../../../shared/components/note-component/note-component';
import { SettingsService } from '../../../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../../../shared/table-info-remote-table-data-source';
import { XoBaseText } from '../../../shared/xo/base-text.model';
import { XoTestData, XoTestDataArray } from '../../../test-cases/xo/test-data.model';


export interface ShowTestDataComponentData {
    structureType: XoStructureType;
    i18nService: I18nService;
}

@Component({
    selector: 'app-show-test-data',
    templateUrl: './show-test-data.component.html',
    styleUrls: ['./show-test-data.component.scss'],
    imports: [XcModule, NoteComponent]
})
export class ShowTestDataComponent extends XcDialogComponent<void, ShowTestDataComponentData> {
    private readonly apiService = inject(ApiService);
    private readonly settingsService = inject(SettingsService);
    private readonly dialogService = inject(XcDialogService);


    tableDataSource: XcTableInfoRemoteTableDataSource<XoTestData>;
    treeDataSource: XcStructureTreeDataSource;
    treeObserver: XcTreeObserver;
    testData: XoTestData;
    dataInput: XoBaseText;
    dataLabel: string;

    note = '';


    constructor() {
        super();
        this.dataInput = new XoBaseText(undefined, this.injectedData.structureType.typeFqn.encode());
        this.dataLabel = this.injectedData.structureType.typeLabel || 'Instances';

        // initialize table data source
        const orderType = 'xdev.xtestfactory.infrastructure.gui.GetTestDataInstances';
        this.tableDataSource = new XcTableInfoRemoteTableDataSource(this.apiService, this.injectedData.i18nService, this.settingsService.testProjectRtc, orderType);
        this.tableDataSource.input = this.dataInput;
        this.tableDataSource.output = XoTestDataArray;
        this.tableDataSource.refreshOnFilterChange = this.settingsService.tableRefreshOnFilterChange;
        this.tableDataSource.selectionModel.selectionChange.subscribe(model => this.tableSelectionChange(model.selection));
        this.tableDataSource.actionElements = [
            {
                iconName: XDSIconName.DELETE,
                tooltip: this.injectedData.i18nService.translate('Delete'),
                onAction: testData => this.delete([testData])
            },
            {
                iconName: XDSIconName.COPY,
                tooltip: this.injectedData.i18nService.translate('Duplicate'),
                onAction: testData => this.copy(testData)
            }
        ];
        this.tableDataSource.refresh();

        // initialize tree data source
        const container = new XoArray<XoTestData>();
        container.rtc = this.settingsService.testProjectRtc;

        const describers = new Array<XoDescriber>();
        describers.push({fqn: this.injectedData.structureType.typeFqn, rtc: this.settingsService.testProjectRtc});

        this.treeDataSource = new XcStructureTreeDataSource(
            this.apiService,
            this.injectedData.i18nService,
            this.settingsService.testProjectRtc,
            describers,
            container
        );

        // set tree observer to disable root nodes
        this.treeObserver = {
            disableNode: (node: XcTreeNode, defaultDisabled: boolean): boolean => !node.parent || defaultDisabled
        };
    }


    cancel() {
        this.tableDataSource.selectionModel.clear();
        this.testData = undefined;
    }


    apply() {
        this.note = '';
        const orderType = 'xdev.xtestfactory.infrastructure.gui.StoreTestDataInstance';
        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, [this.testData, this.dataInput], XoTestData, OPTIONS_WITH_ERROR).subscribe(result => {
            if (!result.errorMessage) {
                this.tableDataSource.refresh();
                this.cancel();
            } else {
                this.note = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
            }
        });
    }


    delete(testDataList: XoTestData[]) {
        this.note = '';
        this.dialogService.confirm(
            this.injectedData.i18nService.translate('Confirm Delete'),
            this.injectedData.i18nService.translate(testDataList.length === 1 ? 'Delete Test Data Instance?' : 'Delete selected Test Data Instances?')
        ).afterDismiss().pipe(
            filter(confirmed => confirmed)
        ).subscribe(() => {
            const orderType = 'xdev.xtestfactory.infrastructure.gui.DeleteTestDataInstanceList';
            const input = new XoTestDataArray();
            input.data.push(...testDataList);
            this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(result => {
                if (result.errorMessage) {
                    this.note = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                } else {
                    this.tableDataSource.refresh();
                }
            });
        });
    }


    add() {
        this.tableDataSource.selectionModel.clear();
        const testData = new XoTestData(this.injectedData.structureType.typeFqn.name);
        testData.fqn   = this.injectedData.structureType.typeFqn;
        testData.rtc   = this.injectedData.structureType.typeRtc;
        this.edit(testData);
    }


    copy(testData: XoTestData) {
        this.tableDataSource.selectionModel.clear();
        this.edit(testData.cloneWithZeroId());
    }


    private edit(testData: XoTestData) {
        this.testData = testData;
        if (this.testData) {
            this.treeDataSource.container.data.splice(0);
            this.treeDataSource.container.append(this.testData);
            this.treeDataSource.refresh();
        }
    }


    private tableSelectionChange(selection: XoTestData[]) {
        if (selection.length > 0) {
            this.edit(selection[0]);
        } else {
            this.testData = undefined;
        }
    }
}
