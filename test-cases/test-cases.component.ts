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

import { OrderInputSourceDetailsModalComponent, OrderInputSourceDetailsModalComponentData } from '@fman/order-input-sources/modal/order-input-source-details-modal/order-input-source-details-modal.component';
import { FrequencyControlledTaskLoadPreset, FrequencyControlledTaskPreset, FrequencyControlledTaskRatePreset } from '@fman/order-input-sources/order-input-source-details/order-input-source-details.component';
import { XoOrderInputSource } from '@fman/order-input-sources/xo/xo-order-input-source.model';
import { ApiService, RuntimeContextType } from '@zeta/api';
import { stringToInteger } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcFormAutocompleteTemplate, XcFormBaseComponent, XcFormDirective, XcFormInputTemplate, XcIconButtonTemplate, XcSelectionModel, XDSIconName, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { filter, finalize, map } from 'rxjs/operators';

import { extractError, OPTIONS_WITH_ERROR } from '../const';
import { ImexService } from '../shared/imex.service';
import { SettingsService } from '../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../shared/table-info-remote-table-data-source';
import { AddTestCaseComponent, AddTestCaseComponentModalData } from './modal/add-test-case.component';
import { AddTestDataInstanceComponent } from './modal/add-test-data-instance.component';
import { GetTestCaseReferenceComponent } from './modal/get-test-case-reference.component';
import { GetTestDataComplexComponent } from './modal/get-test-data-complex.component';
import { GetTestDataMcComponent } from './modal/get-test-data-mc.component';
import { XoSimpleTestDataInstanceArray } from './xo/simple-test-data-instance.model';
import { XoTestCaseEntry, XoTestCaseEntryArray } from './xo/test-case-entry.model';
import { XoTestCase } from './xo/test-case.model';
import { XoTestDataSelectorInstance, XoTestDataSelectorInstanceArray, XoTestDataSelectorTableInfo } from './xo/test-data-selector-instance.model';


interface StartTestCaseError {
    status: number;
    statusText: string;
    url: string;
    ok: boolean;
    message: string;
    error: {
        errorMessage: string; // here errorCode
        stackTrace: string[];
    };
}

@Component({
    templateUrl: './test-cases.component.html',
    styleUrls: ['./test-cases.component.scss'],
    standalone: false
})
export class TestCasesComponent extends RouteComponent {

    /**
     * TODO - refactoring
     * (in my humble opinion)
     * The TestCaseEntry model has typeDataWrapper-Autocomplete, that belongs to the view/input screen.
     * They should decide:
     * - which values there are, is the field required, should there be an empty option
     * - and how to translate them (i18n service of the input screen)
     */

    dsTestCases: XcTableInfoRemoteTableDataSource<XoTestCaseEntry>;
    dsTestDataSelectors: XcTableInfoRemoteTableDataSource<XoTestDataSelectorInstance>;

    exportStarted = false;

    @ViewChild(XcFormDirective, {static: false})
    form: XcFormDirective;

    // manageExecutionBusy = false;
    startOrderBusy = false;
    isTestprojectSelected = false;

    // latest order id
    testCaseOrderId = '';

    // selected test case
    testCaseEntry: XoTestCaseEntry; // the currently selected entry in the table
    testCase: XoTestCase; // details of the selected entry


    constructor(
        private readonly settingsService: SettingsService,
        private readonly router: Router,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly i18nService: I18nService,
        private readonly imexService: ImexService
    ) {
        super();

        const dataSourceTestCaseOrderType = 'xdev.xtestfactory.infrastructure.gui.GetAllTestCases';
        this.dsTestCases = new XcTableInfoRemoteTableDataSource(apiService, i18nService, settingsService.testProjectRtc, dataSourceTestCaseOrderType);
        this.dsTestCases.output = XoTestCaseEntryArray;
        this.dsTestCases.tableInfoClass = XoRemappingTableInfoClass(XoTableInfo, XoTestCaseEntry, { src: t => t.description, dst: t => t.desc });
        this.dsTestCases.actionElements = [
            {
                onAction: testCase => {
                    this.dialogService.custom<XoTestCaseEntry, AddTestCaseComponentModalData>
                    (AddTestCaseComponent, {
                        caseEntry: testCase,
                        i18nService: this.i18nService
                    }).afterDismissResult().subscribe(() => {
                        if (this.dsTestCases.selectionModel) {
                            this.dsTestCases.selectionModel.clear();
                        }
                        this.dsTestCases.refresh();
                    });
                },
                tooltip: this.i18nService.translate('Duplicate'),
                class: XDSIconName.COPY,
                iconName: XDSIconName.COPY
            },
            {
                onAction: testCase => {
                    this.deleteTestCases([testCase]);
                }, tooltip: this.i18nService.translate('Delete'), class: XDSIconName.DELETE, iconName: XDSIconName.DELETE
            }
        ];
        this.dsTestCases.selectionModel.selectionChange.subscribe(model => this.testCasesSelectionChange(model));
        this.dsTestCases.refreshOnFilterChange = settingsService.tableRefreshOnFilterChange;

        // test project rtc changes
        settingsService.testProject.subscribe(
            selector => {
                if (selector) {
                    this.isTestprojectSelected = true;
                    this.dsTestCases.rtc = selector.runtimeContext;
                    this.dsTestCases.resetTableInfo();
                    this.dsTestCases.refresh();
                    // reset selected table row
                    this.testCase = null;
                } else {
                    this.dsTestCases.clear();
                }
            }
        );
    }


    onShow() {
        // preselection
        const selectionId: string = this.activatedRoute.snapshot.params.id || this.testCase?.iD;
        if (selectionId) {
            const entry = new XoTestCaseEntry(undefined, Number(selectionId));
            this.dsTestCases.restoreSelectionKeys([entry.uniqueKey], this.settingsService.needRefreshTestCases);
        }
        if (this.settingsService.needRefreshTestCases) {
            this.settingsService.needRefreshTestCases = false;
            this.dsTestCases.refresh();
        }
    }


    private navigateToId() {
        void this.router.navigate(['../' + (this.testCase ? this.testCase.iD : '')], { relativeTo: this.activatedRoute });
    }


    private testCasesSelectionChange(model: XcSelectionModel<XoTestCaseEntry>) {
        if (!!model.selection && model.selection.length === 1) {
            const selection = model.selection[0] || null;
            if (this.testCaseEntry !== selection) {
                this.testCaseEntry = selection;

                if (this.testCaseEntry) {
                    // request test case details (with untyped selectors)
                    const testCaseDetailsOrderType = 'xdev.xtestfactory.infrastructure.gui.GetTestCaseDetails';
                    this.apiService.startOrder(this.settingsService.testProjectRtc, testCaseDetailsOrderType, this.testCaseEntry, XoTestCase, OPTIONS_WITH_ERROR).subscribe(result => {
                        if (!result.errorMessage) {
                            this.testCase = result.output[0] as XoTestCase;
                            this.navigateToId();
                        } else {
                            this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                        }
                    });

                    // reset form inputs as pristine
                    if (this.form) {
                        this.form.markAsPristine();
                    }
                    // update data source for tables in drawer
                    const dataSourceTestDataSelectorsOrderType = 'xdev.xtestfactory.infrastructure.selector.GetTestCaseSelectorsFromTestCase';
                    this.dsTestDataSelectors = new XcTableInfoRemoteTableDataSource(this.apiService, this.i18nService, this.settingsService.testProjectRtc, dataSourceTestDataSelectorsOrderType, XoTestDataSelectorTableInfo);
                    this.dsTestDataSelectors.input = this.testCaseEntry;
                    this.dsTestDataSelectors.output = XoTestDataSelectorInstanceArray;
                    this.dsTestDataSelectors.dataChange.subscribe(modelSel => this.testDataSelectorsChange(modelSel));
                    this.dsTestDataSelectors.refresh();
                } else {
                    this.testCase = null;
                    this.navigateToId();
                }
                this.testCaseOrderId = '';
            }
        } else {
            this.testCaseEntry = null;
            this.testCase = null;
            this.navigateToId();
        }
    }


    private testDataSelectorsChange(instances: XoTestDataSelectorInstance[]) {
        const markAsDirty = (component: XcFormBaseComponent) => {
            component.formControl.markAsDirty();
        };
        instances.forEach(instance => {
            switch (instance.type) {
                case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_SIMPLE: {
                    const formAutocompleteTemplate = <XcFormAutocompleteTemplate>(instance.firstTemplate);
                    const orderType = 'xdev.xtestfactory.infrastructure.selector.GetTestDataForSimpleList';
                    this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, instance, XoSimpleTestDataInstanceArray, OPTIONS_WITH_ERROR).subscribe(
                        result => {
                            if (!result.errorMessage) {
                                const simpleInstances = result.output[0] as XoSimpleTestDataInstanceArray;
                                formAutocompleteTemplate.dataWrapper.values = simpleInstances.data.map(
                                    simpleInstance => ({ name: simpleInstance.label, value: simpleInstance.id.toString() })
                                );
                            } else {
                                this.dialogService.error(extractError(result));
                            }
                        }
                    );
                    break;
                }
                case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_COMPLEX: {
                    const formInputTemplateComplex = <XcFormInputTemplate>(instance.firstTemplate);
                    const iconButtonTemplateComplex = <XcIconButtonTemplate>(instance.lastTemplate);
                    iconButtonTemplateComplex.action = () => {
                        this.dialogService.custom(GetTestDataComplexComponent, instance).afterDismissResult().subscribe(
                            result => {
                                instance.value = result.value;
                                instance.label = result.label;
                                formInputTemplateComplex.callback = markAsDirty;
                                this.dsTestDataSelectors.triggerMarkForChange();
                            }
                        );
                    };
                    break;
                }
                case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_MC: {
                    const formInputTemplateMc = <XcFormInputTemplate>(instance.firstTemplate);
                    const iconButtonTemplateMc = <XcIconButtonTemplate>(instance.lastTemplate);
                    iconButtonTemplateMc.action = () => {
                        this.dialogService.custom(GetTestDataMcComponent, instance).afterDismissResult().subscribe(
                            result => {
                                instance.value = result.value;
                                formInputTemplateMc.callback = markAsDirty;
                                this.dsTestDataSelectors.triggerMarkForChange();
                            }
                        );
                    };
                    break;
                }
                case XoTestDataSelectorInstance.TYPE_TESTCASEREFERENCE: {
                    const formInputTemplateReference = <XcFormInputTemplate>(instance.firstTemplate);
                    const iconButtonTemplateReference = <XcIconButtonTemplate>(instance.lastTemplate);
                    iconButtonTemplateReference.action = () => {
                        this.dialogService.custom(GetTestCaseReferenceComponent).afterDismissResult().subscribe(
                            result => {
                                instance.value = result.value;
                                instance.label = result.label;
                                formInputTemplateReference.callback = markAsDirty;
                                this.dsTestDataSelectors.triggerMarkForChange();
                            }
                        );
                    };
                    break;
                }
            }
        });
    }


    deleteTestDataSelector() {
        const selection = this.dsTestDataSelectors.selectionModel.selection[0];
        if (selection) {
            this.dsTestDataSelectors.remove(selection);
        }
    }


    addTestDataSelector() {
        this.dialogService.custom(AddTestDataInstanceComponent).afterDismissResult().subscribe(
            result => this.dsTestDataSelectors.add(result)
        );
    }


    close() {
        this.dsTestCases.selectionModel.clear();
    }


    saveTestCase() {
        const orderType = 'xdev.xtestfactory.infrastructure.selector.SaveEditedTestCase';
        // build input from current test data selector rows
        const testDataSelectors = new XoTestDataSelectorInstanceArray();
        testDataSelectors.data.push(...this.dsTestDataSelectors.rows);
        // start workflow
        const input = [this.testCaseEntry, testDataSelectors, this.testCase.testDateSelector];
        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(
            result => {
                if (!result.errorMessage) {
                    this.dsTestCases.selectionModel.clear();
                    this.dsTestCases.refresh();
                } else {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            }
        );
    }

    refresh() {
        this.dsTestCases.refresh();
    }


    startTestCase() {
        this.startOrderBusy = true;
        // 270814
        this.settingsService.startTestCase(this.testCase.name, this.testCaseEntry.iD).pipe(
            finalize(() => this.startOrderBusy = false)
        ).subscribe({
            next: result => {
                if (result.errorMessage) {
                    this.dialogService.error(result.errorMessage);
                    this.testCaseOrderId = '';
                } else {
                    this.testCaseOrderId = result.orderId;
                }
            },
            error: error => {
                const response = error as StartTestCaseError;
                let handled = false;
                let message: string;
                if (response) {
                    message = this.i18nService.translateErrorCode(response.error.errorMessage, /(.*)/) + '\n';
                    handled = true;
                }
                if (!handled && response && response.message) {
                    message = response.message;
                    handled = true;
                }

                // see XTF-4
                if (!handled) {
                    message = this.i18nService.translate('Unknown error') + '\n';
                    message += this.i18nService.translate('Please make sure that there is an "Input Generator" set in the Order Input Source details.') + '\n';
                    handled = true;
                }

                this.dialogService.error(message);
                this.testCaseOrderId = '';
            }
        });
    }

    exportTestCase() {
        this.exportStarted = true;
        this.imexService.export(this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.ExportTestCases', [this.settingsService.testProjectSelector]).subscribe({
            next: res => {
                if (res.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(res.errorMessage));
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.exportStarted = false
        });
    }


    manageExecutionDetails() {
        // find revision
        this.apiService.getRuntimeContexts(true).pipe(
            map(rtcs => rtcs.find(rtc => rtc.name === this.settingsService.testProjectRtc.ws.workspace && rtc.type !== RuntimeContextType.Application)),
            filter(rtc => {
                if (!rtc) {
                    console.log(`Cound not retrieve revision for RTC ${this.settingsService.testProjectRtc.toString()}`);
                }
                return !!rtc;
            })
        ).subscribe(rtc => {
            const ois = new XoOrderInputSource();
            ois.name = this.testCase.testProcessReference;
            ois.revision = rtc.revision;

            // TODO make it better: Values should be gathered from the test case entry when returning an OIS with type XTF
            let preset: FrequencyControlledTaskPreset;
            if (this.testCaseEntry.type === 'Rate') {
                preset = new FrequencyControlledTaskRatePreset(this.testCaseEntry.rate, this.testCaseEntry.rateDuration);
            } else if (this.testCaseEntry.type === 'Load') {
                preset = new FrequencyControlledTaskLoadPreset(this.testCaseEntry.load, stringToInteger(this.testCaseEntry.loadCount, undefined));
            }

            this.dialogService.custom(OrderInputSourceDetailsModalComponent, <OrderInputSourceDetailsModalComponentData>{
                orderInputSource: ois,
                fctPreset: preset
            });
        });
    }


    openAudit(orderId: string) {
        void this.router.navigate(['xfm/Process-Monitor'], {
            queryParams: { 'order': orderId }
        });
    }


    deleteTestCases(testCases: XoTestCaseEntry[]) {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.DeleteTestCasesFromEntryList';
        this.dialogService.confirm(this.i18nService.translate('Confirm Delete'), this.i18nService.translate(testCases.length === 1 ? 'Delete Test Case?' : 'Delete selected Test Cases?')).afterDismiss()
            .pipe(filter(confirmed => confirmed))
            .subscribe(() => {
                const testCaseArray = new XoTestCaseEntryArray();
                testCaseArray.data.splice(0, 0, ...testCases);
                this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, testCaseArray, null, OPTIONS_WITH_ERROR).subscribe(result => {
                    if (!result.errorMessage) {
                        this.dsTestCases.refresh();
                    } else {
                        this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                    }
                });
            });
    }


    deleteSelected() {
        this.deleteTestCases(this.dsTestCases.selectionModel.selection);
    }


    createTestCase() {
        const data: AddTestCaseComponentModalData = {
            i18nService: this.i18nService,
            caseEntry: null
        };
        this.dialogService.custom(AddTestCaseComponent, data).afterDismissResult().subscribe(
            () => this.dsTestCases.refresh()
        );
    }


    get validTestProject(): boolean {
        return this.settingsService.testProjectRtc !== null;
    }
}
