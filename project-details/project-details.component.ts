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

import { ApiService, StartOrderOptions } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcFormDirective } from '@zeta/xc';

import { extractError, OPTIONS_WITH_ERROR } from '../const';
import { ImexService } from '../shared/imex.service';
import { SettingsService } from '../shared/settings.service';
import { TestProjectMenuComponent, TestProjectMenuData } from '../usermenu/testprojectmenu.component';
import { XoProjectDetails } from './xo/xo-project-details.model';
import { XcModule } from '../../../zeta/xc/xc.module';


@Component({
    selector: 'app-project-details',
    templateUrl: './project-details.component.html',
    styleUrls: ['./project-details.component.scss'],
    imports: [XcModule]
})
export class ProjectDetailsComponent {

    testProjectDetails = new XoProjectDetails();
    @ViewChild(XcFormDirective, {static: false})
    detailForm: XcFormDirective;
    exportStarted = false;
    isTestprojectSelected = false;
    saving = false;

    constructor(
        private readonly apiService: ApiService,
        private readonly settingsService: SettingsService,
        private readonly i18nService: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly imexService: ImexService
    ) {
        this.settingsService.testProject.subscribe(selector => {
            if (selector !== null) {
                this.isTestprojectSelected = true;
                this.getTestProject();
            }
        });
    }

    exportTestProject() {
        this.exportStarted = true;
        const orderType = 'xdev.xtestfactory.infrastructure.gui.ExportTestProject';
        this.imexService.export(this.settingsService.testProjectRtc, orderType, [this.settingsService.testProjectSelector]).subscribe({
            next: res => {
                if (res.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(res.errorMessage));
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.exportStarted = false
        });
    }

    delete() {
        this.dialogService.confirm(this.i18nService.translate('Confirm delete'), this.i18nService.translate('Do you really want to delete this Test Project?')).afterDismiss()
            .subscribe(confirmDelete => {
                if (confirmDelete) {
                    const orderType = 'xdev.xtestfactory.infrastructure.gui.DeleteTestProject';

                    const sel = this.settingsService.testProjectSelector.clone();
                    this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, sel, null, OPTIONS_WITH_ERROR).subscribe({
                        next: result => {
                            if (!result.errorMessage) {
                                this.testProjectDetails.name = '';
                                this.testProjectDetails.version = '';
                                this.testProjectDetails.description = '';
                                // Setting to null
                                this.settingsService.testProjectSelector = null;
                                this.apiService.runtimeContext = null;

                            } else {
                                this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                            }
                        }, 
                        error: err => this.dialogService.error(extractError(err))
                    });
                }
            });
    }

    duplicate() {
        const data: TestProjectMenuData = {
            rtc: this.settingsService.testProjectRtc,
            preset: this.testProjectDetails,
            selectRtc: false,
            i18nService: this.i18nService
        };
        this.dialogService.custom(TestProjectMenuComponent, data).afterDismissResult().subscribe(sel => {
            if (sel) {
                this.settingsService.testProjectSelector = sel;
                this.apiService.runtimeContext = sel.runtimeContext;
            }
        });
    }

    save() {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.StoreProjectDetails';
        const optionsWithError: StartOrderOptions = {
            async: false,
            withErrorMessage: true
        };
        this.saving = true;
        this.apiService.startOrder(
            this.settingsService.testProjectRtc,
            orderType,
            [this.settingsService.testProjectSelector, this.testProjectDetails],
            null,
            optionsWithError
        ).subscribe({
            next: result => {
                if (result.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                } else {
                    // TODO
                    this.apiService.runtimeContext = this.settingsService.testProjectRtc;
                    this.dialogService.info(this.i18nService.translate('Note'), this.i18nService.translate('Saved successful'));
                }
            },
            error: err => this.dialogService.error(extractError(err)),
            complete: () => this.saving = false
        });
    }

    reset() {
        this.dialogService.confirm(this.i18nService.translate('Reset changes'), this.i18nService.translate('Do you want to reset your changes?')).afterDismiss().subscribe(
            confirmReset => {
                if (confirmReset) {
                    this.getTestProject();
                }
            }
        );
    }

    private getTestProject() {
        const optionsWithError: StartOrderOptions = {
            async: false,
            withErrorMessage: true
        };

        const orderType = 'xdev.xtestfactory.infrastructure.gui.GetProjectDetails';

        this.apiService.startOrder(
            this.settingsService.testProjectRtc,
            orderType,
            this.settingsService.testProjectSelector,
            XoProjectDetails,
            optionsWithError
        ).subscribe({
            next: result => {
                if (!result.errorMessage) {
                    this.testProjectDetails = result.output[0] as XoProjectDetails;
                } else {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                }
            },
            error: err => this.dialogService.error(extractError(err))
        });
    }

}
