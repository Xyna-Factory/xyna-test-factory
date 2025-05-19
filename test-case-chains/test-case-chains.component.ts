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
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptions } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcSelectionModel, XDSIconName } from '@zeta/xc';

import { OPTIONS_WITH_ERROR } from '../const';
import { SettingsService } from '../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../shared/table-info-remote-table-data-source';
import { XoTestCaseEntry, XoTestCaseEntryArray } from '../test-cases/xo/test-case-entry.model';
import { XoTestCaseInstanceEntry, XoTestCaseInstanceEntryArray } from '../test-cases/xo/test-case-instance-entry.model';
import { AddTestCaseChainComponent, AddTestCaseChainComponentModalData } from './modal/add-test-case-chain.component';
import { XoInitialTestCaseEntry, XoInitialTestCaseEntryArray } from './xo/initial-test-case-entry.model';
import { XoTestCaseChainEntry, XoTestCaseChainEntryArray } from './xo/test-case-chain-entry.model';
import { XoTestObjectEntry, XoTestObjectEntryArray } from './xo/test-object-entry.model';


const INIT_WF = 'xdev.xtestfactory.infrastructure.gui.GetInitialTestCases';
const FOLLOW_UP_WF = 'xdev.xtestfactory.infrastructure.gui.GetFollowupTestCases';

@Component({
    templateUrl: './test-case-chains.component.html',
    styleUrls: ['./test-case-chains.component.scss'],
    standalone: false
})
export class TestCaseChainsComponent extends RouteComponent {

    dsTestCaseChains: XcTableInfoRemoteTableDataSource<XoTestCaseChainEntry>;
    dsTestObjects: XcTableInfoRemoteTableDataSource<XoTestObjectEntry>;
    dsTestCaseInstances: XcTableInfoRemoteTableDataSource<XoTestCaseInstanceEntry>;

    dsInitialTestCases: XcTableInfoRemoteTableDataSource<XoInitialTestCaseEntry>;
    dsFollowupTestCases: XcTableInfoRemoteTableDataSource<XoTestCaseEntry>;

    // selected test case chain
    testCaseChain: XoTestCaseChainEntry = null;

    // selected test case
    testCase: XoTestCaseInstanceEntry = null;

    // selected initial or followup test case
    initialTestCase: XoInitialTestCaseEntry;
    followupTestCase: XoTestCaseEntry;

    isTestprojectSelected = false;

    showInitialTestCases = true; // switching between initial test cases and followup test cases


    constructor(
        private readonly settingsService: SettingsService,
        private readonly router: Router,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly i18nService: I18nService
    ) {
        super();

        this.dsTestCaseChains = new XcTableInfoRemoteTableDataSource(apiService, this.i18nService, this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.GetTestCaseChains');
        this.dsTestCaseChains.actionElements = [
            {
                onAction: chain => {
                    this.deleteTestCaseChain(chain);
                }, tooltip: this.i18nService.translate('Delete selected Entry'), class: XDSIconName.DELETE, iconName: XDSIconName.DELETE
            }
        ];
        this.dsTestCaseChains.output = XoTestCaseChainEntryArray;
        this.dsTestCaseChains.selectionModel.selectionChange.subscribe(model => this.testCaseChainsSelectionChange(model));
        this.dsTestCaseChains.refreshOnFilterChange = settingsService.tableRefreshOnFilterChange;

        this.dsTestObjects = new XcTableInfoRemoteTableDataSource(apiService, this.i18nService, this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.GetTestObjectsFromTestCaseChain');
        this.dsTestObjects.output = XoTestObjectEntryArray;

        this.dsTestCaseInstances = new XcTableInfoRemoteTableDataSource(apiService, this.i18nService, this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.GetTestCaseInstancesFromTestCaseChain');
        this.dsTestCaseInstances.output = XoTestCaseInstanceEntryArray;
        this.dsTestCaseInstances.selectionModel.selectionChange.subscribe(model => this.testCaseInstancesSelectionChange(model));


        this.dsInitialTestCases = new XcTableInfoRemoteTableDataSource(apiService, this.i18nService, this.settingsService.testProjectRtc, INIT_WF);
        this.dsInitialTestCases.selectionModel.selectionChange.subscribe({
            next: model => this.initialTestCase = model.selection[0],
            error: err => console.log(err)
        });
        this.dsInitialTestCases.output = XoInitialTestCaseEntryArray;

        this.dsFollowupTestCases = new XcTableInfoRemoteTableDataSource(apiService, this.i18nService, this.settingsService.testProjectRtc, FOLLOW_UP_WF);
        this.dsFollowupTestCases.selectionModel.selectionChange.subscribe({
            next: model => this.followupTestCase = model.selection[0],
            error: err => console.log(err)
        });
        this.dsFollowupTestCases.output = XoTestCaseEntryArray;

        // test project rtc changes
        this.settingsService.testProject.subscribe(
            selector => {
                if (selector !== null) {
                    this.isTestprojectSelected = true;
                    this.dsTestCaseChains.rtc = selector.runtimeContext;
                    this.dsTestCaseChains.resetTableInfo();
                    this.dsTestCaseChains.refresh();
                    // update runtime context of table data sources in drawer
                    this.dsTestObjects.rtc = selector.runtimeContext;
                    this.dsTestCaseInstances.rtc = selector.runtimeContext;
                    // this.dsInitialOrFollowupTestCases.rtc = selector.runtimeContext;
                    this.dsInitialTestCases.rtc = selector.runtimeContext;
                    this.dsFollowupTestCases.rtc = selector.runtimeContext;
                    // reset selected table row
                    this.testCaseChain = null;
                } else {
                    this.dsTestCaseChains.clear();
                }
            }
        );
    }


    onShow() {
        // preselection
        const selectionId: string = this.activatedRoute.snapshot.params.id || this.testCaseChain?.id;
        if (selectionId) {
            const entry = new XoTestCaseChainEntry();
            entry.id = parseInt(selectionId, 10);
            this.dsTestCaseChains.restoreSelectionKeys([entry.uniqueKey], this.settingsService.needRefreshTestCaseChains);
        }
        if (this.settingsService.needRefreshTestCaseChains) {
            this.settingsService.needRefreshTestCaseChains = false;
            this.dsTestCaseChains.refresh();
        }
    }


    private navigateToId() {
        void this.router.navigate(['../' + (this.testCaseChain ? this.testCaseChain.id : '')], { relativeTo: this.activatedRoute });
    }


    private testCaseChainsSelectionChange(model: XcSelectionModel<XoTestCaseChainEntry>) {
        const selection = model.selection[0] || null;
        if (this.testCaseChain !== selection) {
            this.testCaseChain = selection;
            // update data source for tables in drawer
            if (this.testCaseChain) {
                // test objects
                this.dsTestObjects.input = this.testCaseChain;
                this.dsTestObjects.refresh();
                // test cases
                this.dsTestCaseInstances.input = this.testCaseChain;
                this.dsTestCaseInstances.refresh();
                // initial test cases
                this.showInitialTestCases = true;
                this.dsInitialTestCases.refresh();
            }
            // reset selected table rows in drawer
            this.dsTestCaseInstances.selectionModel.clear();
            this.dsTestObjects.selectionModel.clear();
            this.navigateToId();
        }
    }


    private testCaseInstancesSelectionChange(model: XcSelectionModel<XoTestCaseInstanceEntry>) {
        const selection = model.selection[0] || null;
        if (this.testCase !== selection) {
            this.testCase = selection;
            this.showInitialTestCases = false;
            if (this.testCase) {
                this.dsFollowupTestCases.input = this.testCase;
                this.dsFollowupTestCases.selectionModel.clear();
                this.dsFollowupTestCases.refresh();
            } else {
                this.showInitialTestCases = true;
                // this.dsInitialTestCases.selectionModel.clear();
                // this.dsInitialTestCases.refresh();
            }
            this.initialTestCase = null;
            this.followupTestCase = null;
        }
    }


    deleteTestCaseChain(chain: XoTestCaseChainEntry) {
        this.dialogService.confirm(this.i18nService.translate('Delete Test Case Chain'), this.i18nService.translate('Do you really want to delete this test case chain?')).afterDismiss().subscribe(confirmed => {
            if (confirmed) {
                const orderType = 'xdev.xtestfactory.infrastructure.gui.DeleteTestCaseChainFromEntry';
                const optionsWithError: StartOrderOptions = {
                    async: false,
                    withErrorMessage: true
                };
                this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, chain, null, optionsWithError).subscribe(
                    result => {
                        if (!result.errorMessage) {
                            this.dsTestCaseChains.refresh();
                            this.settingsService.needRefreshTestCases = true;
                        } else {
                            this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                        }
                    }
                );
            }
        });
    }

    createTestCaseChain() {
        const data: AddTestCaseChainComponentModalData = {
            i18nService: this.i18nService
        };
        this.dialogService.custom<string, AddTestCaseChainComponentModalData>(AddTestCaseChainComponent, data).afterDismissResult().subscribe(
            () => this.dsTestCaseChains.refresh()
        );
    }

    refresh() {
        this.dsTestCaseChains.refresh();
    }


    deleteTestCase() {
        this.dialogService.confirm(this.i18nService.translate('Delete Test Case'), this.i18nService.translate('Do you really want to delete this test case?')).afterDismiss().subscribe(confirmed => {
            if (confirmed) {
                const orderType = 'xdev.xtestfactory.infrastructure.gui.DeleteTestCaseInstance';
                const input = this.dsTestCaseInstances.selectionModel.selection[0];
                this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(
                    result => {
                        if (!result.errorMessage) {
                            this.dsTestObjects.refresh();
                            this.dsTestCaseInstances.refresh();
                            this.settingsService.needRefreshTestCases = true;
                        } else {
                            this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                        }
                    }
                );
            }
        });
    }


    addFollowupTestCase() {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.AddFollowupTestCase';
        const input = [this.testCase, this.followupTestCase];

        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(
            result => {
                if (!result.errorMessage) {
                    this.dsTestObjects.refresh();
                    this.dsTestCaseInstances.refresh();
                    this.settingsService.needRefreshTestCases = true;
                } else {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            }
        );
    }

    addInitialTestCase() {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.AddInitialTestCase';
        const input = [this.testCaseChain, this.initialTestCase];

        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(
            result => {
                if (!result.errorMessage) {
                    this.dsTestObjects.refresh();
                    this.dsTestCaseInstances.refresh();
                    this.settingsService.needRefreshTestCases = true;
                } else {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            }
        );
    }


    get validTestProject(): boolean {
        return this.settingsService.testProjectRtc !== null;
    }


    close() {
        this.dsTestCaseChains.selectionModel.clear();
    }

}
