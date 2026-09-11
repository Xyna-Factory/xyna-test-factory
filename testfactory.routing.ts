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
        loadComponent: () => import('./testfactory.component').then(m => m.TestfactoryComponent),
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
                loadComponent: () => import('./project-details/project-details.component').then(m => m.ProjectDetailsComponent),
                canDeactivate: [redirectGuardCanDeactivate],
                pathMatch: 'full',
                data: { reuse: projectDetails, redirectKey: root }
            },
            {
                path: testReports,
                loadComponent: () => import('./test-reports/test-reports.component').then(m => m.TestReportsComponent),
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
                loadComponent: () => import('./counters/counters.component').then(m => m.CountersComponent),
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
                loadComponent: () => import('./test-cases/test-cases.component').then(m => m.TestCasesComponent),
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
                loadComponent: () => import('./test-case-chains/test-case-chains.component').then(m => m.TestCaseChainsComponent),
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
                loadComponent: () => import('./test-data/test-data.component').then(m => m.TestDataComponent),
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
