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
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ZetaModule } from '@zeta/zeta.module';

import { ACMSettingsService } from '../acm/acm-settings.service';
import { FactoryManagerSettingsService } from '../factorymanager/misc/services/factory-manager-settings.service';
import { ProcessmonitorSettingsService } from '../processmonitor/processmonitor-settings.service';
import { CountersComponent } from './counters/counters.component';
import { AddCounterComponent } from './counters/modal/add-counter/add-counter.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { NoteComponent } from './shared/components/note-component/note-component';
import { XTFFocusCandidateDirective } from './shared/directives/xtf-focus-candidate.directive';
import { ImexService } from './shared/imex.service';
import { SettingsService } from './shared/settings.service';
import { AddTestCaseChainComponent } from './test-case-chains/modal/add-test-case-chain.component';
import { TestCaseChainsComponent } from './test-case-chains/test-case-chains.component';
import { AddTestCaseComponent } from './test-cases/modal/add-test-case.component';
import { AddTestDataInstanceComponent } from './test-cases/modal/add-test-data-instance.component';
import { GetTestCaseReferenceComponent } from './test-cases/modal/get-test-case-reference.component';
import { GetTestDataComplexComponent } from './test-cases/modal/get-test-data-complex.component';
import { GetTestDataMcComponent } from './test-cases/modal/get-test-data-mc.component';
import { TestCasesComponent } from './test-cases/test-cases.component';
import { CreateTestDataComponent } from './test-data/modal/create-test-data/create-test-data.component';
import { ShowTestDataComponent } from './test-data/modal/show-test-data/show-test-data.component';
import { TestDataComponent } from './test-data/test-data.component';
import { TestReportsComponent } from './test-reports/test-reports.component';
import { TestfactoryComponent } from './testfactory.component';
import { TestProjectMenuComponent } from './usermenu/testprojectmenu.component';


@NgModule({ declarations: [
        AddCounterComponent,
        AddTestCaseChainComponent,
        AddTestCaseComponent,
        AddTestDataInstanceComponent,
        CreateTestDataComponent,
        CountersComponent,
        GetTestCaseReferenceComponent,
        GetTestDataComplexComponent,
        GetTestDataMcComponent,
        ProjectDetailsComponent,
        ShowTestDataComponent,
        TestCaseChainsComponent,
        TestCasesComponent,
        TestDataComponent,
        TestfactoryComponent,
        TestProjectMenuComponent,
        TestReportsComponent,
        XTFFocusCandidateDirective,
        NoteComponent
    ], imports: [CommonModule,
        RouterModule,
        ZetaModule], providers: [
        ImexService,
        SettingsService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class TestfactoryModule {
    constructor(
        factoryManagerSettings: FactoryManagerSettingsService,
        processmonitorSettings: ProcessmonitorSettingsService,
        acmSettings: ACMSettingsService
    ) {
        // configure behavior of other factory components, which is different, if the XTF is present (OP-3359)
        factoryManagerSettings.tableRefreshOnFilterChange = false;
        processmonitorSettings.tableRefreshOnFilterChange = false;
        acmSettings.tableRefreshOnFilterChange = false;
    }
}
