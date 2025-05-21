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
import { RouterModule } from '@angular/router';

import { RedirectComponent, redirectGuardCanActivate, redirectGuardCanDeactivate, RedirectGuardConfigProvider, RedirectGuardProvider, XynaRoutes } from '@zeta/nav';
import { rightGuardCanActivate } from '@zeta/nav/right.guard';

import { RIGHT_TEST_FACTORY } from './const';
import { CountersComponent } from './counters/counters.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { TestCaseChainsComponent } from './test-case-chains/test-case-chains.component';
import { TestCasesComponent } from './test-cases/test-cases.component';
import { TestDataComponent } from './test-data/test-data.component';
import { TestReportsComponent } from './test-reports/test-reports.component';
import { TestfactoryComponent } from './testfactory.component';


const root = 'Test-Factory';
const testCases = 'Test-Cases';
const testCaseChains = 'Test-Case-Chains';
const testData = 'Test-Data';
const projectDetails = 'Project-Details';
const testReports = 'Test-Reports';
const counters = 'Counters';

export const TestfactoryRoutes: XynaRoutes = [
    {
        path: '',
        redirectTo: root,
        pathMatch: 'full'
    },
    {
        path: root,
        component: TestfactoryComponent,
        canActivate: [rightGuardCanActivate],
        data: { right: RIGHT_TEST_FACTORY, reuse: root },
        children: [
            {
                path: '',
                component: RedirectComponent,
                canActivate: [redirectGuardCanActivate],
                data: { reuse: root + '1', redirectKey: root, redirectDefault: testCases }
            },
            {
                path: projectDetails,
                component: ProjectDetailsComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data: { reuse: projectDetails, redirectKey: root }
            },
            {
                path: testReports,
                component: TestReportsComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data: { reuse: testReports, redirectKey: root }
            },
            {
                path: counters,
                redirectTo: counters + '/',
                pathMatch: 'full'
            },
            {
                path: counters + '/:id',
                component: CountersComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: counters, redirectKey: root }
            },
            {
                path: testCases,
                redirectTo: testCases + '/',
                pathMatch: 'full'
            },
            {
                path: testCases + '/:id',
                component: TestCasesComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: testCases, redirectKey: root }
            },
            {
                path: testCaseChains,
                redirectTo: testCaseChains + '/',
                pathMatch: 'full'
            },
            {
                path: testCaseChains + '/:id',
                component: TestCaseChainsComponent,
                canDeactivate: [redirectGuardCanDeactivate/*, ConfirmGuard*/],
                data: { reuse: testCaseChains, redirectKey: root }
            },
            {
                path: testData,
                redirectTo: testData + '/',
                pathMatch: 'full'
            },
            {
                path: testData + '/:id',
                component: TestDataComponent,
                canDeactivate: [redirectGuardCanDeactivate],
                data: { reuse: testData, redirectKey: root }
            }
        ]
    }
];

export const TestfactoryRoutingModules = [
    RouterModule.forChild(TestfactoryRoutes)   
];

export const TestfactoryRoutingProviders = [
    RedirectGuardProvider(),
    RedirectGuardConfigProvider(testCases)
];
