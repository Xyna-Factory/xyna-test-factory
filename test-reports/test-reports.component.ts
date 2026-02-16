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
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, XoArray, XoDescriber } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcSelectionModel, XcStructureTreeDataSource, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { finalize } from 'rxjs';

import { extractError, OPTIONS_WITH_ERROR } from '../const';
import { ImexService } from '../shared/imex.service';
import { SettingsService } from '../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../shared/table-info-remote-table-data-source';
import { XoTestReportEntry, XoTestReportEntryArray } from './xo/test-report-entry.model';
import { XoFCTReport } from './xo/xo-fctreport.model';
import { XcModule } from '../../../zeta/xc/xc.module';


@Component({
    selector: 'app-test-reports',
    templateUrl: './test-reports.component.html',
    styleUrls: ['./test-reports.component.scss'],
    imports: [XcModule]
})
export class TestReportsComponent {
    private readonly router = inject(Router);
    private readonly apiSerivce = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly settingsService = inject(SettingsService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly imexService = inject(ImexService);
    private readonly i18nService = inject(I18nService);


    dsTestReport: XcTableInfoRemoteTableDataSource<XoTestReportEntry>;
    dsTestReportTree: XcStructureTreeDataSource;
    dsTestReportEdit = null;

    testReport: XoTestReportEntry;
    isTestprojectSelected = false;
    exporting = false;

    constructor() {
        const settingsService = this.settingsService;

        const orderType = 'xdev.xtestfactory.infrastructure.gui.GetTestReports';
        this.dsTestReport = new XcTableInfoRemoteTableDataSource(this.apiSerivce, null, this.settingsService.testProjectRtc, orderType);
        this.dsTestReport.output = XoTestReportEntryArray;
        this.dsTestReport.tableInfoClass = XoRemappingTableInfoClass(XoTableInfo, XoTestReportEntry);
        this.dsTestReport.selectionModel.selectionChange.subscribe(this.testReportSelectionChange.bind(this));
        this.dsTestReport.refreshOnFilterChange = settingsService.tableRefreshOnFilterChange;
        this.dsTestReportTree = new XcStructureTreeDataSource(this.apiSerivce, undefined, this.settingsService.testProjectRtc, null, null);

        settingsService.testProject.subscribe(selector => {
            if (selector !== null) {
                this.isTestprojectSelected = true;
                this.dsTestReport.rtc = selector.runtimeContext;
                this.dsTestReport.resetTableInfo();
                this.dsTestReport.refresh();
            } else {
                this.dsTestReport.clear();
            }
        });
    }

    refresh() {
        this.dsTestReport.refresh();
    }

    refreshTestReports() {
        this.apiSerivce.startOrder(this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.RefreshTestReports', null, null, OPTIONS_WITH_ERROR).subscribe({
            next: result => {
                if (result.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            },
            error: err => this.dialogService.error(extractError(err))
        });
    }

    save() {
        const xo = this.dsTestReportTree.container.data.length > 0 ? this.dsTestReportTree.container.data[0] : null;
        if (xo) {
            this.apiSerivce.startOrder(this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.ChangeTestReport', xo, XoTestReportEntry, OPTIONS_WITH_ERROR).subscribe({
                next: result => {
                    if (result.errorMessage) {
                        this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                    }
                },
                error: err => this.dialogService.error(extractError(err)),
                complete: () => this.refresh()
            });
        }
    }

    close() {
        this.dsTestReport.selectionModel.clear();
    }

    export() {
        this.exporting = true;
        this.imexService.export(this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.ExportTestReport', [this.testReport]).pipe(
            finalize(() => this.exporting = false)
        ).subscribe({
            next: result => {
                if (result.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.exporting = false
        });
    }

    private testReportSelectionChange(model: XcSelectionModel<XoTestReportEntry>) {
        const selection = model.selection[0] || null;
        const dsContainer = new XoArray();
        const descContainer: XoDescriber[] = [];
        const orderType = 'xdev.xtestfactory.infrastructure.gui.GetTestReportDetails';

        if (this.testReport !== selection) {
            this.testReport = selection;
            this.dsTestReportEdit = selection ? selection.clone() : null;

            if (selection) {
                this.apiSerivce.startOrder(this.settingsService.testProjectRtc, orderType, selection, XoFCTReport, OPTIONS_WITH_ERROR).subscribe(response => {
                    if (response.errorMessage) {
                        this.dialogService.error(this.i18nService.translateErrorCode(response.errorMessage));
                    } else {
                        dsContainer.data.push(response.output[0]);
                        descContainer.push(response.output[0]);
                        dsContainer.rtc = this.settingsService.testProjectRtc;

                        this.dsTestReportTree.rtc = this.settingsService.testProjectRtc;
                        this.dsTestReportTree.describers = descContainer;
                        this.dsTestReportTree.container = dsContainer;
                        this.dsTestReportTree.refresh();
                    }
                });
            }
            this.navigateToId();
        }
    }

    private navigateToId() {
        void this.router.navigate(['../Test-Reports'], { relativeTo: this.activatedRoute });
    }
}
