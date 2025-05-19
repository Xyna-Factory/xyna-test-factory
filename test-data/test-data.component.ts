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
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, XoStructureType } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcAutocompleteDataWrapper, XcDialogService, XcFormDirective, XDSIconName } from '@zeta/xc';

import { Observable, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { extractError, OPTIONS_WITH_ERROR } from '../const';
import { ImexService } from '../shared/imex.service';
import { SettingsService } from '../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../shared/table-info-remote-table-data-source';
import { XoTestData } from '../test-cases/xo/test-data.model';
import { CreateTestDataComponent } from './modal/create-test-data/create-test-data.component';
import { ShowTestDataComponent, ShowTestDataComponentData } from './modal/show-test-data/show-test-data.component';
import { XoTestDataMetaDataEntry, XoTestDataMetaDataEntryArray } from './xo/test-data-meta-data-entry.model';
import { XoTestDataMetaDataId } from './xo/test-data-meta-data-id.model';
import { XoTestDataMetaData } from './xo/test-data-meta-data.model';


@Component({
    selector: 'app-test-data',
    templateUrl: './test-data.component.html',
    styleUrls: ['./test-data.component.scss'],
    standalone: false
})
export class TestDataComponent extends RouteComponent {

    dsTestData: XcTableInfoRemoteTableDataSource<XoTestDataMetaDataEntry>;
    testDataEdit: XoTestDataMetaData = null;
    testData: XoTestDataMetaDataEntry = null;

    testDataOrderId: XoTestDataMetaDataId;
    exportStarted = false;
    isTestprojectSelected = false;
    saving = false;

    allTestDataChildrenSubscription: Subscription;

    testDataDefinitionDataWrapper: XcAutocompleteDataWrapper;

    @ViewChild(XcFormDirective, { static: false })
    form: XcFormDirective;

    constructor(
        private readonly router: Router,
        private readonly i18n: I18nService,
        private readonly apiService: ApiService,
        private readonly settings: SettingsService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly imexService: ImexService,
        private readonly dialogService: XcDialogService
    ) {
        super();

        const orderType = 'xdev.xtestfactory.infrastructure.actions.GetAllTestDataMetaData';
        this.dsTestData = new XcTableInfoRemoteTableDataSource(this.apiService, this.i18n, this.settings.testProjectRtc, orderType);
        this.dsTestData.output = XoTestDataMetaDataEntryArray;
        // this.dsTestData.tableInfoClass = XoRemappingTableInfoClass(XoTableInfo, XoTestDataMetaDataEntry);
        this.dsTestData.selectionModel.selectionChange.subscribe(this.testDataSelectionChange.bind(this));
        this.dsTestData.refreshOnFilterChange = settings.tableRefreshOnFilterChange;

        this.dsTestData.actionElements = [
            {
                iconName: XDSIconName.COPY,
                tooltip: this.i18n.translate('Duplicate'),
                onAction: data =>
                    this.getTestDataMetaData(data).subscribe({
                        next: meta => this.createTestData(meta),
                        error: err => dialogService.error(err)
                    })
            },
            {
                iconName: XDSIconName.DELETE,
                tooltip: this.i18n.translate('Delete'),
                onAction: data => this.deleteTestData(data)
            }
        ];

        this.testDataDefinitionDataWrapper = new XcAutocompleteDataWrapper(
            () => this.testDataEdit ? this.testDataEdit.testDataFullQualifiedStorableName : '',
            (value: string) => this.testDataEdit.testDataFullQualifiedStorableName = value
        );

        settings.testProject.subscribe(selector => {
            if (selector !== null) {
                this.isTestprojectSelected = true;
                this.dsTestData.rtc = selector.runtimeContext;
                this.dsTestData.resetTableInfo();
                this.dsTestData.refresh();
                this.fillTestDataDefinitionDataWrapper();
            } else {
                this.dsTestData.clear();
            }
        });
    }

    refresh() {
        this.dsTestData.refresh();
        this.fillTestDataDefinitionDataWrapper();
    }

    importTestData() {
        const resArr = [];
        const payload = [];
        this.imexService.import(this.settings.testProjectRtc, 'xdev.xtestfactory.infrastructure.actions.ImportTestDataFromCSV', payload, resArr)
            .subscribe({
                next: res => {
                    if (res.errorMessage) {
                        this.dialogService.error(this.i18n.translateErrorCode(res.errorMessage));
                    } else {
                        this.dialogService.info(this.i18n.translate('Import'), this.i18n.translate('Import successful!'));
                        this.dsTestData.refresh();
                    }
                },
                error: err => this.dialogService.error(extractError(err))
            });
    }

    createTestData(testDataMetaData?: XoTestDataMetaData) {
        this.dialogService.custom(
            CreateTestDataComponent,
            {
                i18nService: this.i18n,
                testDataMetaData: testDataMetaData
            }
        ).afterDismissResult().subscribe(
            () => this.refresh()
        );
    }

    exportTestData() {
        this.exportStarted = true;
        this.imexService.export(this.settings.testProjectRtc, 'xdev.xtestfactory.infrastructure.actions.ExportTestDataToCSV', [this.testDataEdit])
            .subscribe({
                next: res => {
                    if (res.errorMessage) {
                        this.dialogService.error(this.i18n.translateErrorCode(res.errorMessage));
                    }
                },
                error: err => this.dialogService.error(extractError(err)),
                complete: () => this.exportStarted = false
            });
    }

    close() {
        this.dsTestData.selectionModel.clear();
    }

    save() {
        this.saving = true;
        const orderType = 'xdev.xtestfactory.infrastructure.actions.StoreTestDataMetaDataWithoutStoreParameter';
        this.apiService.startOrder(this.settings.testProjectRtc, orderType, [this.testDataEdit], null, OPTIONS_WITH_ERROR).subscribe({
            next: response => {
                if (response.errorMessage) {
                    this.dialogService.error(this.i18n.translateErrorCode(response.errorMessage));
                } else {
                    this.refresh();
                    this.close();
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.saving = false
        });
    }

    showTestData() {
        this.allTestDataChildrenSubscription = this.getAllTestDataChildren().subscribe({
            next: st => {
                const fqn = st.typeFqn.encode();
                const data: ShowTestDataComponentData = {
                    structureType: st,
                    i18nService: this.i18n
                };
                if (fqn === this.testDataEdit.testDataFullQualifiedStorableName) {
                    this.dialogService.custom(ShowTestDataComponent, data);
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.allTestDataChildrenSubscription.unsubscribe()
        });
    }

    // TODO: finish this
    showTestDataType() {
        console.log('show Test Data Type');
    }

    private testDataSelectionChange(model) {
        const selection = model.selection[0] || null;
        if (this.testData !== selection) {
            this.testData = selection;

            if (selection) {
                this.testDataOrderId = new XoTestDataMetaDataId();
                this.testDataOrderId.iD = this.testData.iD;

                // get test date meta data
                this.getTestDataMetaData(this.testData).subscribe(meta => {
                    this.testDataEdit = meta;
                    this.testDataDefinitionDataWrapper.update();
                });
            } else {
                return this.testDataEdit = null;
            }

            if (this.testData) {
                // reset form inputs as pristine
                if (this.form) {
                    this.form.markAsPristine();
                }
            }
            this.navigateToId();
        }
    }

    private fillTestDataDefinitionDataWrapper() {
        this.testDataDefinitionDataWrapper.values = [];
        const describers = new XoTestData().getDescribers();
        this.allTestDataChildrenSubscription = this.getAllTestDataChildren().subscribe({
            next: st => {
                const val = st.typeFqn.encode();
                if (describers[0].fqn.encode() !== val && !st.typeAbstract) {
                    this.testDataDefinitionDataWrapper.values.push({ name: val, value: val });
                }
            },
            error: err => console.error(err),
            complete: () => {
                this.testDataDefinitionDataWrapper.update();
                this.allTestDataChildrenSubscription.unsubscribe();
            }
        });
    }

    private getAllTestDataChildren(): Observable<XoStructureType> {
        const subj = new Subject<XoStructureType>();

        const describers = new XoTestData().getDescribers();
        describers[0].rtc = this.settings.testProjectRtc;
        this.apiService.getSubtypes(this.settings.testProjectRtc, describers)
            .forEach(obs => {
                obs.subscribe({
                    next: stArr => {
                        if (stArr) {
                            stArr.forEach(st => {
                                const val = st.typeFqn.encode();
                                if (describers[0].fqn.encode() !== val && !st.typeAbstract) {
                                    subj.next(st);
                                }
                            });
                        }
                    },
                    error: err => subj.error(err)
                });
            });

        return subj.asObservable();
    }

    private getTestDataMetaData(entry: XoTestDataMetaDataEntry): Observable<XoTestDataMetaData> {
        const subj = new Subject<XoTestDataMetaData>();
        const orderType = 'xdev.xtestfactory.infrastructure.actions.GetTestDataMetaData';
        const testDataOrderId = new XoTestDataMetaDataId();
        testDataOrderId.iD = entry.iD;

        this.apiService.startOrder(this.settings.testProjectRtc, orderType, testDataOrderId, XoTestDataMetaData, OPTIONS_WITH_ERROR)
            .subscribe({
                next: result => {
                    if (result && !result.errorMessage) {
                        const metaData = result.output[0] as XoTestDataMetaData;
                        subj.next(metaData);
                    } else {
                        subj.error(this.i18n.translateErrorCode(result.errorMessage));
                    }
                },
                error: err => subj.error(extractError(err)),
                complete: () => subj.complete()
            });

        return subj.asObservable();
    }

    private navigateToId() {
        void this.router.navigate(['../' + (this.testData ? this.testData.iD : '')], { relativeTo: this.activatedRoute });
    }

    private deleteTestData(data: XoTestDataMetaDataEntry) {
        this.dialogService.confirm(this.i18n.translate('Delete Test Data'), 'Really delete Test Data?')
            .afterDismiss()
            .pipe(filter(result => !!result))
            .subscribe(() => {
                const otDelete = 'xdev.xtestfactory.infrastructure.actions.DeleteTestDataMetaDataWithoutDeleteParameter';
                const testDataId = new XoTestDataMetaDataId();
                testDataId.iD = data.iD;
                this.apiService.startOrder(this.settings.testProjectRtc, otDelete, testDataId, null, OPTIONS_WITH_ERROR)
                    .subscribe(result => {
                        if (result.errorMessage) {
                            this.dialogService.error(this.i18n.translateErrorCode(result.errorMessage));
                        } else {
                            this.dsTestData.refresh();
                        }
                    });
            });
    }
}
