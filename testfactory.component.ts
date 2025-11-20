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
import { RouterOutlet } from '@angular/router';

import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { ApiService, RuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcNavListItem, XcNavListOrientation } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { XcModule } from '../../zeta/xc/xc.module';
import { ACMSettingsService } from '../acm/acm-settings.service';
import { ProcessmonitorSettingsService } from '../processmonitor/processmonitor-settings.service';
import { xtf_error_code_translations_de_DE } from './locale/xtf-error-code-translations.de-DE';
import { xtf_error_code_translations_en_US } from './locale/xtf-error-code-translations.en-US';
import { xtf_translations_de_DE } from './locale/xtf-translations.de-DE';
import { xtf_translations_en_US } from './locale/xtf-translations.en_US';
import { SettingsService } from './shared/settings.service';
import { TestProjectMenuComponent, TestProjectMenuData } from './usermenu/testprojectmenu.component';


@Component({
    templateUrl: './testfactory.component.html',
    styleUrls: ['./testfactory.component.scss'],
    imports: [XcModule, RouterOutlet]
})
export class TestfactoryComponent extends RouteComponent {

    private runtimeContextSelectionSubscription: Subscription;

    navListItems: XcNavListItem[];
    navListOrientation = XcNavListOrientation.LEFT;


    constructor(
        private readonly settingsService: SettingsService,
        private readonly apiService: ApiService,
        private readonly i18n: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly factoryManagerSettings: FactoryManagerSettingsService,
        private readonly processmonitorSettings: ProcessmonitorSettingsService,
        private readonly acmSettings: ACMSettingsService
    ) {
        super();

        switch (this.i18n.language) {
            case LocaleService.DE_DE:
                this.i18n.setTranslations(this.i18n.language, xtf_translations_de_DE);
                this.i18n.setTranslations(this.i18n.language, xtf_error_code_translations_de_DE);
                break;
            case LocaleService.EN_US:
                this.i18n.setTranslations(this.i18n.language, xtf_translations_en_US);
                this.i18n.setTranslations(this.i18n.language, xtf_error_code_translations_en_US);
                break;
        }

        this.navListItems = [
            {
                link: 'Test-Project', name: i18n.translate('xtf.test-project'), collapsed: true, disabled: true, children: [
                    { link: 'Project-Details', name: i18n.translate('xtf.project-details'), disabled: true },
                    { link: 'Test-Reports', name: i18n.translate('xtf.test-reports'), disabled: true },
                    { link: 'Counters', name: i18n.translate('xtf.counters'), disabled: true }
                ]
            },
            { link: 'Test-Cases', name: i18n.translate('xtf.test-cases'), disabled: true },
            { link: 'Test-Case-Chains', name: i18n.translate('xtf.test-case-chains'), disabled: true },
            { link: 'Test-Data', name: i18n.translate('xtf.test-data'), disabled: true }
        ];

        this.settingsService.testProject.subscribe(selector => {
            if (selector) {
                this.disableNavList(false);  // enable menu (which has been disabled after setting an RTC that wasn't a Test Project)
            }
        });

        this.factoryManagerSettings.tableRefreshOnFilterChange = false;
        this.processmonitorSettings.tableRefreshOnFilterChange = false;
        this.acmSettings.tableRefreshOnFilterChange = false;
    }


    onShow() {
        this.setRuntimeContext(this.apiService.runtimeContext);
        this.runtimeContextSelectionSubscription = this.apiService.runtimeContextSelectionSubject.subscribe(() =>
            this.openRuntimeContextMenu()
        );
    }


    onHide() {
        if (this.runtimeContextSelectionSubscription) {
            this.runtimeContextSelectionSubscription.unsubscribe();
        }
    }


    openRuntimeContextMenu() {
        const data: TestProjectMenuData = {
            rtc: this.settingsService.testProjectRtc,
            selectRtc: true,
            i18nService: this.i18n
        };
        return this.dialogService.custom(TestProjectMenuComponent, data).afterDismissResult().subscribe(testProjectSelector => {
            this.settingsService.testProjectSelector = testProjectSelector;
            this.apiService.runtimeContext = testProjectSelector.runtimeContext;
        });
    }


    setRuntimeContext(value: RuntimeContext) {
        if (!this.settingsService.testProjectRtc || !this.settingsService.testProjectRtc.equals(value)) {
            // handle setting of Runtime Context from outside
            // find matching Test Project Selector and set it, otherwise open menu to select another one
            this.settingsService.retrieveTestProjects().subscribe(selectors => {
                const matchingSelector = selectors.data.find(selector => selector.runtimeContext.equals(value));
                if (matchingSelector) {
                    this.settingsService.testProjectSelector = matchingSelector;
                } else {
                    this.disableNavList(true);
                    if (!this.dialogService.isDialogOpen()) {
                        this.openRuntimeContextMenu();
                    }
                }
            });
        }
    }


    private disableNavList(disabled: boolean) {
        const updateItem = (item: XcNavListItem) => {
            item.disabled = disabled;
            if (item.children) {
                item.children.forEach(child => {
                    updateItem(child);
                });
            }
        };
        return this.navListItems.forEach(item => {
            updateItem(item);
        });
    }


    get runtimeContextSelected(): boolean {
        return !!this.settingsService.testProjectSelector && !!this.apiService.runtimeContext;
    }
}
