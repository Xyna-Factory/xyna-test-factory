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

import { ApiService, RuntimeContext } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem, XDSIconName } from '@zeta/xc';

import { extractError, GET_DUPLICATE_TEST_PROJECT_MSG, GET_IMPORT_TEST_PROJECT_MSG, OPTIONS_WITH_ERROR } from '../const';
import { XoProjectDetails } from '../project-details/xo/xo-project-details.model';
import { ImexService } from '../shared/imex.service';
import { SettingsService } from '../shared/settings.service';
import { XoTestProjectSelector } from './xo/test-project-selector';
import { XcModule } from '../../../zeta/xc/xc.module';
import { NoteComponent } from '../shared/components/note-component/note-component';


export interface TestProjectMenuData {
    rtc: RuntimeContext;
    preset?: XoProjectDetails;
    selectRtc: boolean;
    i18nService: I18nService;
}


@Component({
    templateUrl: './testprojectmenu.component.html',
    styleUrls: ['./testprojectmenu.component.scss'],
    imports: [XcModule, NoteComponent]
})

export class TestProjectMenuComponent extends XcDialogComponent<XoTestProjectSelector, TestProjectMenuData> {

    projectToCreate: XoProjectDetails;
    testProject: XoProjectDetails;
    testProjectSelector: XoTestProjectSelector;

    chooseProject = true;
    createProject = false;
    duplicateProject = false;
    creationMode = false;

    okButtonBusyFlag = false;

    note = '';
    showTestProjectWrapper = true;
    testProjectsDataWrapper = new XcAutocompleteDataWrapper(
        () => this.testProjectSelector,
        value => this.testProjectSelector = value
    );

    XDSIconName = XDSIconName;

    constructor(
        injector: Injector,
        private readonly apiService: ApiService,
        private readonly settingsService: SettingsService,
        private readonly dialogService: XcDialogService,
        private readonly imexService: ImexService
    ) {
        super(injector);
        this.testProjectSelector = this.settingsService.testProjectSelector;

        if (this.injectedData.selectRtc) {
            this.chooseProject = true;

            this.refreshTestProjectsDataWrapper();
        } else {
            this.chooseProject = false;

            if (this.injectedData.preset) {
                this.creationMode = true;
                this.duplicateProject = true;
                this.testProject = this.injectedData.preset.clone();
            }
        }
    }


    get invalidChoose(): boolean {
        return !this.testProjectSelector;
    }

    get invalidCreate(): boolean {
        return !this.projectToCreate.name || !this.projectToCreate.version;
    }

    get invalidDuplicate(): boolean {
        return !this.testProject.name || !this.testProject.version;
    }

    ok() {
        // close dialog with selected test project rtc
        this.dismiss(this.testProjectSelector);
    }

    refreshTestProjectsDataWrapper() {
        this.settingsService.retrieveTestProjects().subscribe({
            next: selectors => {
                this.showTestProjectWrapper = true;
                this.testProjectsDataWrapper.values = selectors.data.map(
                    item => <XcOptionItem>{ name: item.testProjectName + ' ' + item.testProjectVersion, value: item }
                );
            },
            error: err => {
                this.showTestProjectWrapper = false;
                this.note = extractError(err);
            }
        });
        this.note = '';
    }

    switchToCreateTestProject() {
        this.chooseProject = false;
        this.createProject = true;
        this.projectToCreate = new XoProjectDetails();
        this.note = '';
    }

    duplicateTestProject() {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.DuplicateTestProject';
        this.note = '';
        this.okButtonBusyFlag = true;

        this.apiService.startOrder(
            this.settingsService.fallbackRtc,
            orderType,
            [this.settingsService.testProjectSelector, this.testProject],
            null, OPTIONS_WITH_ERROR)
            .subscribe({
                next: res => {
                    if (res.errorMessage) {
                        this.note = this.injectedData.i18nService.translateErrorCode(res.errorMessage);
                    } else if (res) {
                        const msgObj = GET_DUPLICATE_TEST_PROJECT_MSG(this.injectedData.i18nService, res.orderId);

                        this.beforeDismiss().subscribe(dismissed => this.dialogService.info(msgObj.header, msgObj.message));
                        this.dismiss();
                    }
                },
                error: error => console.log(extractError(error)),
                complete: () => this.okButtonBusyFlag = false
            });
    }

    createTestProject() {
        const orderType = 'xdev.xtestfactory.infrastructure.gui.CreateTestProject';
        this.okButtonBusyFlag = true;
        this.note = '';

        this.apiService.startOrder(this.settingsService.fallbackRtc, orderType, this.projectToCreate, null, OPTIONS_WITH_ERROR).subscribe({
            next: res => {
                if (res.errorMessage) {
                    this.note = this.injectedData.i18nService.translateErrorCode(res.errorMessage);
                } else {
                    this.dismiss();
                    const data: TestProjectMenuData = {
                        rtc: this.settingsService.testProjectRtc,
                        selectRtc: true,
                        i18nService: this.injectedData.i18nService
                    };
                    this.dialogService.custom(TestProjectMenuComponent, data).afterDismissResult().subscribe(
                        sel => {
                            if (sel) {
                                this.settingsService.testProjectSelector = sel;
                                this.apiService.runtimeContext = sel.runtimeContext;
                            }
                        }
                    );
                }
            },
            error: error => {
                this.note = extractError(error);
            },
            complete: () => this.okButtonBusyFlag = false
        });
    }

    importTestProject() {

        this.note = '';
        this.imexService.import(
            this.settingsService.fallbackRtc,
            'xdev.xtestfactory.infrastructure.actions.ImportTestProject', null, null, true
        ).subscribe({
            next: res => {
                if (res && !res.errorMessage) {
                    const msgObj = GET_IMPORT_TEST_PROJECT_MSG(this.injectedData.i18nService, res.orderId);
                    this.note = msgObj.message;
                } else {
                    this.note = this.injectedData.i18nService.translateErrorCode(res.errorMessage);
                }
            },
            error: err => this.note = extractError(err),
            complete: () => { }
        });
    }

    abortCreation() {
        this.chooseProject = true;
        this.createProject = false;
    }
}
